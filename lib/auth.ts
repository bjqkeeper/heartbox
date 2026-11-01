import "server-only";
import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getChatGPTUser, type ChatGPTUser } from "../app/chatgpt-auth";

const COOKIE = "heartbox_session";
const SESSION_AGE = 30 * 24 * 60 * 60 * 1000;
// Workers caps each PBKDF2 call at 100,000 iterations. Chain three rounds.
const ITERATIONS = 100_000;
const ROUNDS = 3;

export class AuthError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export type CurrentUser = ChatGPTUser & { authKind: "local" | "chatgpt" };
type Account = { id: string; username: string; displayName: string; passwordHash: string; passwordSalt: string };

const db = () => env.DB as D1Database;
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const hexToBytes = (hex: string) => new Uint8Array(hex.match(/../g)?.map((pair) => parseInt(pair, 16)) ?? []);

async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

async function passwordHash(password: string, salt: string) {
  let secret = new TextEncoder().encode(password);
  const saltBytes = hexToBytes(salt);
  for (let round = 0; round < ROUNDS; round++) {
    const key = await crypto.subtle.importKey("raw", secret, "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new Uint8Array([...saltBytes, round]), iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
    secret = new Uint8Array(bits);
  }
  return bytesToHex(secret);
}

function sameHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

export function normalizeUsername(value: unknown) {
  const username = typeof value === "string" ? value.trim().normalize("NFKC").toLowerCase() : "";
  if (!/^[\p{L}\p{N}_-]{3,24}$/u.test(username)) throw new AuthError("用户名需为 3–24 位文字、数字、- 或 _");
  return username;
}

export function validatePassword(value: unknown) {
  if (typeof value !== "string" || value.length < 10 || value.length > 128) {
    throw new AuthError("密码需为 10–128 位");
  }
  return value;
}

export async function getLocalUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = await sha256(token);
  const row = await db().prepare(`SELECT a.id, a.display_name AS displayName FROM sessions s
    JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(hash, Date.now()).first<{ id: string; displayName: string }>();
  if (!row) return null;
  return { userId: row.id, displayName: row.displayName, email: "", fullName: null, authKind: "local" };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const local = await getLocalUser();
  if (local) return local;
  const legacy = await getChatGPTUser();
  return legacy ? { ...legacy, authKind: "chatgpt" } : null;
}

export async function hasLocalAccount(userId: string) {
  return !!(await db().prepare("SELECT 1 FROM accounts WHERE id = ?").bind(userId).first());
}

export async function createAccount(username: string, password: string, existingUser?: ChatGPTUser) {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await passwordHash(password, salt);
  const id = existingUser?.userId ?? crypto.randomUUID();
  const displayName = existingUser?.displayName ?? username;
  try {
    await db().prepare(`INSERT INTO accounts (id, username, display_name, password_hash, password_salt, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`).bind(id, username, displayName, hash, salt, Date.now()).run();
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message)) {
      throw new AuthError("用户名已被使用，或此账号已设置独立登录", 409);
    }
    throw error;
  }
  return id;
}

export async function verifyLogin(username: string, password: string) {
  const account = await db().prepare(`SELECT id, username, display_name AS displayName,
    password_hash AS passwordHash, password_salt AS passwordSalt FROM accounts WHERE username = ?`)
    .bind(username).first<Account>();
  if (!account) {
    // Keep a similar cost for unknown usernames.
    await passwordHash(password, "00000000000000000000000000000000");
    return null;
  }
  return sameHash(await passwordHash(password, account.passwordSalt), account.passwordHash) ? account.id : null;
}

export async function issueSession(accountId: string, request: Request) {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await db().prepare("INSERT INTO sessions (token_hash, account_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), accountId, now + SESSION_AGE, now).run();
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_AGE / 1000}${secure}`;
}

export async function revokeSession(request: Request) {
  const token = request.headers.get("Cookie")?.match(/(?:^|;\s*)heartbox_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (token) await db().prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function checkAttemptLimit(request: Request, subject: string, maximum: number) {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const key = await sha256(`${ip}:${subject}`);
  const now = Date.now();
  const row = await db().prepare("SELECT count, reset_at AS resetAt FROM auth_attempts WHERE key = ?")
    .bind(key).first<{ count: number; resetAt: number }>();
  if (row && row.resetAt > now && row.count >= maximum) return false;
  await db().prepare(`INSERT INTO auth_attempts (key, count, reset_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
    reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END`)
    .bind(key, now + 15 * 60_000, now, now).run();
  return true;
}
