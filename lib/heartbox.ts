import "server-only";
import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "../app/chatgpt-auth";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SHANGHAI_OFFSET = 8 * HOUR;

export type Group = {
  id: string; name: string; kind: "friends" | "couple"; ownerId: string;
  inviteCode: string; releaseKind: "nightly" | "weekly"; releaseHour: number;
  releaseWeekday: number; settlementKind: "weekly" | "monthly";
  scoreAgree: number; scoreNeutral: number; scoreDisagree: number;
  anonymous: number; createdAt: number; memberCount: number;
};

type Member = { userId: string; displayName: string; email: string };
type LetterRow = {
  id: string; body: string; createdAt: number; unlockAt: number;
  response: string | null; scoreAwarded: number | null; respondedAt: number | null;
  senderName?: string; recipientName?: string;
};

export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function database(): D1Database {
  if (!env.DB) throw new Error("数据库尚未配置");
  return env.DB;
}

function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (name.length < 2 || name.length > 30) throw new AppError("组名需要 2 到 30 个字");
  return name;
}

function groupSettings(input: Record<string, unknown>) {
  const releaseKind = input.releaseKind === "weekly" ? "weekly" : "nightly";
  const settlementKind = input.settlementKind === "monthly" ? "monthly" : "weekly";
  const releaseHour = Number(input.releaseHour);
  const releaseWeekday = Number(input.releaseWeekday);
  const scoreAgree = Number(input.scoreAgree);
  const scoreNeutral = Number(input.scoreNeutral);
  const scoreDisagree = Number(input.scoreDisagree);
  if (![releaseHour, releaseWeekday, scoreAgree, scoreNeutral, scoreDisagree].every(Number.isInteger)) {
    throw new AppError("时间和分值必须是整数");
  }
  if (releaseHour < 0 || releaseHour > 23 || releaseWeekday < 0 || releaseWeekday > 6) {
    throw new AppError("解封时间无效");
  }
  if ([scoreAgree, scoreNeutral, scoreDisagree].some((v) => v < 0 || v > 20)) {
    throw new AppError("分值需在 0 到 20 之间");
  }
  return { releaseKind, settlementKind, releaseHour, releaseWeekday,
    scoreAgree, scoreNeutral, scoreDisagree, anonymous: input.anonymous ? 1 : 0 };
}

export function unlockTime(now: number, group: Pick<Group, "releaseKind" | "releaseHour" | "releaseWeekday">): number {
  const local = new Date(now + SHANGHAI_OFFSET);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  if (group.releaseKind === "nightly") {
    let candidate = Date.UTC(year, month, day, group.releaseHour) - SHANGHAI_OFFSET;
    if (candidate <= now) candidate += DAY;
    return candidate;
  }
  const daysUntil = (group.releaseWeekday - local.getUTCDay() + 7) % 7;
  let candidate = Date.UTC(year, month, day + daysUntil, group.releaseHour) - SHANGHAI_OFFSET;
  if (candidate <= now) candidate += 7 * DAY;
  return candidate;
}

function periodStart(now: number, kind: Group["settlementKind"]): number {
  const local = new Date(now + SHANGHAI_OFFSET);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  if (kind === "monthly") return Date.UTC(year, month, 1) - SHANGHAI_OFFSET;
  const daysSinceMonday = (local.getUTCDay() + 6) % 7;
  return Date.UTC(year, month, day - daysSinceMonday) - SHANGHAI_OFFSET;
}

export async function getDashboard(user: ChatGPTUser, requestedGroupId?: string | null) {
  const db = database();
  const now = Date.now();
  const { results: groups } = await db.prepare(`
    SELECT g.id, g.name, g.kind, g.owner_id AS ownerId, g.invite_code AS inviteCode,
      g.release_kind AS releaseKind, g.release_hour AS releaseHour,
      g.release_weekday AS releaseWeekday, g.settlement_kind AS settlementKind,
      g.score_agree AS scoreAgree, g.score_neutral AS scoreNeutral,
      g.score_disagree AS scoreDisagree, g.anonymous, g.created_at AS createdAt,
      (SELECT COUNT(*) FROM memberships mc WHERE mc.group_id = g.id) AS memberCount
    FROM groups g JOIN memberships m ON m.group_id = g.id
    WHERE m.user_id = ? ORDER BY g.created_at DESC
  `).bind(user.userId).all<Group>();
  const selected = groups.find((g) => g.id === requestedGroupId) ?? groups[0] ?? null;
  const visibleGroups = groups.map((group) => ({ ...group,
    inviteCode: group.ownerId === user.userId ? group.inviteCode : "" }));
  if (!selected) return { user: { id: user.userId, name: user.displayName }, groups: visibleGroups, selected: null,
    members: [], inbox: [], sent: [], points: { period: 0, total: 0 } };

  const [membersResult, inboxResult, sentResult, pointsResult] = await Promise.all([
    db.prepare(`SELECT user_id AS userId, display_name AS displayName, email
      FROM memberships WHERE group_id = ? ORDER BY joined_at`).bind(selected.id).all<Member>(),
    db.prepare(`SELECT l.id, l.body, l.created_at AS createdAt, l.unlock_at AS unlockAt,
      l.response, l.score_awarded AS scoreAwarded, l.responded_at AS respondedAt,
      m.display_name AS senderName
      FROM letters l JOIN memberships m ON m.group_id = l.group_id AND m.user_id = l.sender_id
      WHERE l.group_id = ? AND l.recipient_id = ? ORDER BY l.created_at DESC`)
      .bind(selected.id, user.userId).all<LetterRow>(),
    db.prepare(`SELECT l.id, l.body, l.created_at AS createdAt, l.unlock_at AS unlockAt,
      l.response, l.score_awarded AS scoreAwarded, l.responded_at AS respondedAt,
      m.display_name AS recipientName
      FROM letters l JOIN memberships m ON m.group_id = l.group_id AND m.user_id = l.recipient_id
      WHERE l.group_id = ? AND l.sender_id = ? ORDER BY l.created_at DESC`)
      .bind(selected.id, user.userId).all<LetterRow>(),
    db.prepare(`SELECT COALESCE(SUM(score_awarded), 0) AS total,
      COALESCE(SUM(CASE WHEN responded_at >= ? THEN score_awarded ELSE 0 END), 0) AS period
      FROM letters WHERE group_id = ? AND sender_id = ?`)
      .bind(periodStart(now, selected.settlementKind), selected.id, user.userId)
      .first<{ total: number; period: number }>(),
  ]);

  const inbox = inboxResult.results.map((letter) => {
    if (letter.unlockAt > now) return { id: letter.id, createdAt: letter.createdAt,
      unlockAt: letter.unlockAt, locked: true as const };
    return { ...letter, locked: false as const,
      senderName: selected.anonymous ? null : letter.senderName ?? null };
  });
  const sent = sentResult.results;
  return { user: { id: user.userId, name: user.displayName }, groups: visibleGroups,
    selected: { ...selected, inviteCode: selected.ownerId === user.userId ? selected.inviteCode : "" },
    members: membersResult.results, inbox, sent,
    points: pointsResult ?? { total: 0, period: 0 } };
}

export async function createGroup(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const name = cleanName(input.name);
  const kind = input.kind === "couple" ? "couple" : "friends";
  const now = Date.now();
  const id = crypto.randomUUID();
  const inviteCode = Array.from(crypto.getRandomValues(new Uint8Array(8)),
    (v) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[v % 32]).join("");
  await db.batch([
    db.prepare(`INSERT INTO groups (id, name, kind, owner_id, invite_code,
      release_kind, release_hour, release_weekday, settlement_kind,
      score_agree, score_neutral, score_disagree, anonymous, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'nightly', 21, 0, 'weekly', 3, 1, 0, 1, ?, ?)`)
      .bind(id, name, kind, user.userId, inviteCode, now, now),
    db.prepare(`INSERT INTO memberships (group_id, user_id, display_name, email, joined_at)
      VALUES (?, ?, ?, ?, ?)`).bind(id, user.userId, user.displayName, user.email, now),
  ]);
  return { groupId: id };
}

export async function joinGroup(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const code = String(input.code ?? "").trim().toUpperCase();
  if (!/^[A-Z2-9]{8}$/.test(code)) throw new AppError("请输入 8 位邀请码");
  const group = await db.prepare(`SELECT id, kind FROM groups WHERE invite_code = ?`)
    .bind(code).first<{ id: string; kind: string }>();
  if (!group) throw new AppError("邀请码不存在");
  const current = await db.prepare(`SELECT 1 FROM memberships WHERE group_id = ? AND user_id = ?`)
    .bind(group.id, user.userId).first();
  if (current) return { groupId: group.id };
  if (group.kind === "couple") {
    const count = await db.prepare(`SELECT COUNT(*) AS n FROM memberships WHERE group_id = ?`)
      .bind(group.id).first<{ n: number }>();
    if ((count?.n ?? 0) >= 2) throw new AppError("双人组已满");
  }
  await db.prepare(`INSERT INTO memberships (group_id, user_id, display_name, email, joined_at)
    VALUES (?, ?, ?, ?, ?)`).bind(group.id, user.userId, user.displayName, user.email, Date.now()).run();
  return { groupId: group.id };
}

export async function updateGroup(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const groupId = String(input.groupId ?? "");
  const group = await db.prepare(`SELECT owner_id AS ownerId FROM groups WHERE id = ?`)
    .bind(groupId).first<{ ownerId: string }>();
  if (!group || group.ownerId !== user.userId) throw new AppError("只有建组人能修改设置", 403);
  const settings = groupSettings(input);
  await db.prepare(`UPDATE groups SET release_kind = ?, release_hour = ?, release_weekday = ?,
    settlement_kind = ?, score_agree = ?, score_neutral = ?, score_disagree = ?,
    anonymous = ?, updated_at = ? WHERE id = ?`)
    .bind(settings.releaseKind, settings.releaseHour, settings.releaseWeekday,
      settings.settlementKind, settings.scoreAgree, settings.scoreNeutral,
      settings.scoreDisagree, settings.anonymous, Date.now(), groupId).run();
  return { groupId };
}

export async function renameGroup(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const groupId = String(input.groupId ?? "");
  const name = cleanName(input.name);
  const result = await db.prepare(`UPDATE groups SET name = ?, updated_at = ?
    WHERE id = ? AND owner_id = ?`)
    .bind(name, Date.now(), groupId, user.userId).run();
  if (!result.meta.changes) throw new AppError("只有建组人能重命名空间", 403);
  return { groupId, name };
}

export async function deleteGroup(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const groupId = String(input.groupId ?? "");
  const confirmedName = String(input.confirmName ?? "").trim();
  const group = await db.prepare(`SELECT name FROM groups WHERE id = ? AND owner_id = ?`)
    .bind(groupId, user.userId).first<{ name: string }>();
  if (!group) throw new AppError("只有建组人能删除空间", 403);
  if (confirmedName !== group.name) throw new AppError("请输入当前空间名称以确认删除");
  const allowed = `SELECT id FROM groups WHERE id = ? AND owner_id = ? AND name = ?`;
  const results = await db.batch([
    db.prepare(`DELETE FROM letters WHERE group_id IN (${allowed})`)
      .bind(groupId, user.userId, confirmedName),
    db.prepare(`DELETE FROM memberships WHERE group_id IN (${allowed})`)
      .bind(groupId, user.userId, confirmedName),
    db.prepare(`DELETE FROM groups WHERE id = ? AND owner_id = ? AND name = ?`)
      .bind(groupId, user.userId, confirmedName),
  ]);
  if (!results[2].meta.changes) throw new AppError("空间名称已变化，请刷新后重试");
  return { deletedGroupId: groupId };
}

export async function sendLetter(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const groupId = String(input.groupId ?? "");
  const recipientId = String(input.recipientId ?? "");
  const body = String(input.body ?? "").trim();
  if (body.length < 5 || body.length > 1500) throw new AppError("信件内容需要 5 到 1500 个字");
  if (recipientId === user.userId) throw new AppError("请选择其他成员作为收信人");
  const group = await db.prepare(`SELECT g.*, 
    EXISTS(SELECT 1 FROM memberships WHERE group_id = g.id AND user_id = ?) AS sender_member,
    EXISTS(SELECT 1 FROM memberships WHERE group_id = g.id AND user_id = ?) AS recipient_member
    FROM groups g WHERE g.id = ?`).bind(user.userId, recipientId, groupId).first<Record<string, unknown>>();
  if (!group || !group.sender_member || !group.recipient_member) throw new AppError("收信人不在这个组内", 403);
  const now = Date.now();
  const recent = await db.prepare(`SELECT COUNT(*) AS n FROM letters
    WHERE group_id = ? AND sender_id = ? AND recipient_id = ? AND created_at >= ?`)
    .bind(groupId, user.userId, recipientId, now - 7 * DAY).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 3) throw new AppError("一周内对同一人最多投递 3 封信");
  const unlockAt = unlockTime(now, {
    releaseKind: group.release_kind as Group["releaseKind"],
    releaseHour: Number(group.release_hour), releaseWeekday: Number(group.release_weekday),
  });
  const id = crypto.randomUUID();
  await db.prepare(`INSERT INTO letters (id, group_id, sender_id, recipient_id, body,
    created_at, unlock_at, score_agree, score_neutral, score_disagree)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, groupId, user.userId, recipientId, body, now, unlockAt,
      group.score_agree, group.score_neutral, group.score_disagree).run();
  return { letterId: id, unlockAt };
}

export async function respondToLetter(user: ChatGPTUser, input: Record<string, unknown>) {
  const db = database();
  const letterId = String(input.letterId ?? "");
  const response = String(input.response ?? "");
  if (!["agree", "neutral", "disagree"].includes(response)) throw new AppError("回应类型无效");
  const letter = await db.prepare(`SELECT recipient_id AS recipientId, unlock_at AS unlockAt,
    response, score_agree AS scoreAgree, score_neutral AS scoreNeutral,
    score_disagree AS scoreDisagree FROM letters WHERE id = ?`)
    .bind(letterId).first<{ recipientId: string; unlockAt: number; response: string | null;
      scoreAgree: number; scoreNeutral: number; scoreDisagree: number }>();
  if (!letter || letter.recipientId !== user.userId) throw new AppError("无权回应这封信", 403);
  if (letter.unlockAt > Date.now()) throw new AppError("信封还未解封", 403);
  if (letter.response) throw new AppError("这封信已经回应过了");
  const points = response === "agree" ? letter.scoreAgree :
    response === "neutral" ? letter.scoreNeutral : letter.scoreDisagree;
  const result = await db.prepare(`UPDATE letters SET response = ?, score_awarded = ?, responded_at = ?
    WHERE id = ? AND recipient_id = ? AND response IS NULL AND unlock_at <= ?`)
    .bind(response, points, Date.now(), letterId, user.userId, Date.now()).run();
  if (!result.meta.changes) throw new AppError("这封信已经回应过了");
  return { points };
}
