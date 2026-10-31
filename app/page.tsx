import { requireChatGPTUser } from "./chatgpt-auth";
import HeartboxApp from "./heartbox-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  return <HeartboxApp displayName={user.displayName} />;
}
