import { redirect } from "next/navigation";
import { getChatGPTUser } from "../chatgpt-auth";
import { getLocalUser, hasLocalAccount } from "../../lib/auth";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getLocalUser()) redirect("/");
  const legacy = await getChatGPTUser();
  const linked = legacy ? await hasLocalAccount(legacy.userId) : false;
  return <LoginForm legacyName={legacy?.displayName ?? null} linked={linked} />;
}
