"use client";

import { useState } from "react";

type Mode = "login" | "register" | "link";

export default function LoginForm({ legacyName, linked }: { legacyName: string | null; linked: boolean }) {
  const [mode, setMode] = useState<Mode>(legacyName && !linked ? "link" : "login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, username, password }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "操作失败");
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "请稍后再试");
      setBusy(false);
    }
  }

  return <div className="auth-site"><a className="auth-brand" href="/"><span>✉</span> 心事信箱</a><main className="auth-card"><span className="public-eyebrow">继续使用</span><h1>{mode === "link" ? "保留原来的空间" : mode === "register" ? "创建账号" : "欢迎回来"}</h1><p>{mode === "link" ? `你现在是 ${legacyName}。设置用户名和密码后，以后不打开 ChatGPT 也能进入原来的空间。` : mode === "register" ? "只需用户名和密码，无需 ChatGPT 账号。" : "用用户名和密码登录，继续使用你的空间。"}</p>
    {mode !== "link" && <div className="auth-switch"><button type="button" className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }}>登录</button><button type="button" className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setError(""); }}>注册</button></div>}
    <form onSubmit={submit}><label htmlFor="auth-username">用户名</label><input id="auth-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={24} required placeholder="3–24 位文字、数字、- 或 _" /><label htmlFor="auth-password">密码</label><input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} required placeholder="至少 10 位" />{error && <div className="auth-error" role="alert">{error}</div>}<button className="auth-submit" disabled={busy}>{busy ? "请稍候…" : mode === "link" ? "设置独立登录" : mode === "register" ? "注册并进入" : "登录信箱"} ↗</button></form>
    {mode === "link" && <button className="auth-text-button" onClick={() => setMode("login")}>已有独立账号？用用户名登录</button>}
    {linked && <small>此空间已设置独立登录，请用对应的用户名和密码进入。</small>}
    {mode !== "login" && <small>请妥善保存密码。当前版本暂不支持自助找回密码。</small>}
    <a className="auth-back" href="/">← 返回首页</a>
  </main></div>;
}
