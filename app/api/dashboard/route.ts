import { getChatGPTUser } from "../../chatgpt-auth";
import { getDashboard } from "../../../lib/heartbox";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const groupId = new URL(request.url).searchParams.get("groupId");
  return Response.json(await getDashboard(user, groupId), {
    headers: { "Cache-Control": "no-store" },
  });
}
