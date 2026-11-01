import { getChatGPTUser } from "../../chatgpt-auth";
import { AppError, createGroup, deleteGroup, joinGroup, renameGroup, respondToLetter, sendLetter, updateGroup } from "../../../lib/heartbox";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "来源无效" }, { status: 403 });
  }
  try {
    const input = await request.json() as Record<string, unknown>;
    const result = input.action === "createGroup" ? await createGroup(user, input)
      : input.action === "joinGroup" ? await joinGroup(user, input)
      : input.action === "updateGroup" ? await updateGroup(user, input)
      : input.action === "renameGroup" ? await renameGroup(user, input)
      : input.action === "deleteGroup" ? await deleteGroup(user, input)
      : input.action === "sendLetter" ? await sendLetter(user, input)
      : input.action === "respond" ? await respondToLetter(user, input)
      : null;
    if (!result) throw new AppError("操作无效");
    return Response.json(result);
  } catch (error) {
    const status = error instanceof AppError ? error.status : 500;
    return Response.json({ error: error instanceof AppError ? error.message : "操作失败，请稍后重试" },
      { status });
  }
}
