import { getChatGPTUser } from "../../chatgpt-auth";
import { checkAttemptLimit, createAccount, issueSession, normalizeUsername, revokeSession, validatePassword, verifyLogin } from "../../../lib/auth";

export async function POST(request: Request) {
  const origin = request.headers.get("Origin");
  if (origin !== new URL(request.url).origin) return Response.json({ error: "来源无效" }, { status: 403 });
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return Response.json({ error: "请求格式无效" }, { status: 415 });
  }
  try {
    const input = await request.json() as Record<string, unknown>;
    if (input.action === "logout") {
      return Response.json({ ok: true }, { headers: { "Set-Cookie": await revokeSession(request), "Cache-Control": "no-store" } });
    }
    const username = normalizeUsername(input.username);
    const password = validatePassword(input.password);
    if (input.action === "login") {
      if (!await checkAttemptLimit(request, `login:${username}`, 8)) {
        return Response.json({ error: "尝试过多，请 15 分钟后再试" }, { status: 429 });
      }
      const id = await verifyLogin(username, password);
      if (!id) return Response.json({ error: "用户名或密码不正确" }, { status: 401 });
      return Response.json({ ok: true }, { headers: { "Set-Cookie": await issueSession(id, request), "Cache-Control": "no-store" } });
    }
    if (input.action === "register" || input.action === "link") {
      if (!await checkAttemptLimit(request, "register", 10)) {
        return Response.json({ error: "尝试过多，请 15 分钟后再试" }, { status: 429 });
      }
      const legacyUser = input.action === "link" ? await getChatGPTUser() : null;
      if (input.action === "link" && !legacyUser) {
        return Response.json({ error: "请先用原账号进入空间，再设置独立登录" }, { status: 401 });
      }
      const id = await createAccount(username, password, legacyUser ?? undefined);
      return Response.json({ ok: true }, { headers: { "Set-Cookie": await issueSession(id, request), "Cache-Control": "no-store" } });
    }
    return Response.json({ error: "操作无效" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "请稍后重试" }, { status: 400 });
  }
}
