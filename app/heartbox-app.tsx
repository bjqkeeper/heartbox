"use client";

import { useCallback, useEffect, useState } from "react";
import { NightStars, SleepingFox } from "./night-illustration";

type Group = {
  id: string; name: string; kind: "friends" | "couple"; ownerId: string; inviteCode: string;
  releaseKind: "nightly" | "weekly"; releaseHour: number; releaseWeekday: number;
  settlementKind: "weekly" | "monthly"; scoreAgree: number; scoreNeutral: number;
  scoreDisagree: number; anonymous: number; memberCount: number;
};
type Member = { userId: string; displayName: string };
type Letter = { id: string; createdAt: number; unlockAt: number; locked?: boolean;
  body?: string; response?: string | null; scoreAwarded?: number | null;
  senderName?: string | null; recipientName?: string };
type Dashboard = { user: { id: string; name: string }; groups: Group[]; selected: Group | null;
  members: Member[]; inbox: Letter[]; sent: Letter[]; points: { period: number; total: number } };
type Tab = "inbox" | "write" | "sent" | "points";

const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const responseLabel: Record<string, string> = { agree: "赞同", neutral: "无感", disagree: "不认同" };
const formatDate = (value: number) => new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value));

async function mutate(input: Record<string, unknown>) {
  const response = await fetch("/api/action", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  const result = await response.json() as { error?: string; groupId?: string; letterId?: string };
  if (!response.ok) throw new Error(result.error || "操作失败");
  return result;
}

export default function HeartboxApp({ displayName, authKind }: { displayName: string; authKind: "local" | "chatgpt" }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("inbox");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"friends" | "couple">("friends");
  const [code, setCode] = useState("");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [settings, setSettings] = useState<Partial<Group>>({});
  const [renameName, setRenameName] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const reload = useCallback(async (id?: string | null) => {
    const response = await fetch("/api/dashboard" + (id ? "?groupId=" + encodeURIComponent(id) : ""), { cache: "no-store" });
    if (!response.ok) throw new Error("暂时无法读取信箱");
    const next: Dashboard = await response.json();
    setData(next); setGroupId(next.selected?.id ?? null); setSettings(next.selected ?? {});
    setRenameName(next.selected?.name ?? "");
    setRecipient((old) => next.members.some((m) => m.userId === old && old !== next.user.id)
      ? old : next.members.find((m) => m.userId !== next.user.id)?.userId ?? "");
  }, []);
  useEffect(() => { reload(groupId).catch((error) => setNotice(error.message)); }, [groupId, reload]);
  useEffect(() => {
    const timer = setInterval(() => reload(groupId).catch(() => {}), 60_000);
    return () => clearInterval(timer);
  }, [groupId, reload]);

  async function run(input: Record<string, unknown>, message: string, selectNew = false) {
    setBusy(true); setNotice("");
    try {
      const result = await mutate(input);
      await reload(selectNew ? result.groupId : groupId);
      setNotice(message);
      return result;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "操作失败");
      return null;
    } finally { setBusy(false); }
  }

  const group = data?.selected;
  const others = data?.members.filter((m) => m.userId !== data.user.id) ?? [];
  const lockedCount = data?.inbox.filter((letter) => letter.locked).length ?? 0;
  const readyCount = data?.inbox.filter((letter) => !letter.locked && !letter.response).length ?? 0;
  const releaseText = group?.releaseKind === "weekly"
    ? "每" + weekdays[group.releaseWeekday] + " " + String(group.releaseHour).padStart(2, "0") + ":00"
    : "每天 " + String(group?.releaseHour ?? 21).padStart(2, "0") + ":00";
  const isOwner = !!group && group.ownerId === data?.user.id;

  return <div className="shell"><NightStars />
    <header className="topbar"><div className="brand"><div className="logo">✉</div><div><strong>心事信箱</strong><small>定时信件空间</small></div></div><div className="user"><span className="privacy"><i />私密空间</span>{authKind === "chatgpt" ? <a className="account-link" href="/login">设置独立登录</a> : <button className="account-link" onClick={async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); window.location.assign("/"); }}>退出登录</button>}<span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span></div></header>
    <div className="workspace"><aside className="sidebar"><div className="sidebar-heading">我的空间</div>
      <div className="group-list">{data?.groups.map((item) => <button key={item.id} className={"group-item " + (item.id === group?.id ? "active" : "")} onClick={() => { setGroupId(item.id); setTab("inbox"); setExpanded(null); }}><span className="group-icon">{item.kind === "couple" ? "♡" : "✦"}</span><span><strong>{item.name}</strong><small>{item.kind === "couple" ? "双人空间" : "朋友空间"} · {item.memberCount} 人</small></span></button>)}</div>
      <button className="sidebar-action" onClick={() => setModal("create")}>＋ 创建空间</button>
      <button className="sidebar-action" onClick={() => setModal("join")}>↗ 加入空间</button>
      <div className="sidebar-mascot"><SleepingFox /><span>✦ ✧</span></div>
    </aside>
    <main className="main">
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {!data ? <div className="loading">正在打开信箱…</div> : !group ? <div className="welcome"><div className="welcome-icon">✉</div><span className="eyebrow">从这里开始</span><h1>留一个空间，<br /><em>慢慢写。</em></h1><p>创建一个朋友或双人空间，信件会在约定的时间解封。</p><div className="buttons"><button className="primary" onClick={() => setModal("create")}>创建空间 ↗</button><button className="secondary" onClick={() => setModal("join")}>已有邀请码</button></div></div> : <>
        <div className="intro"><div><span className="eyebrow">{group.kind === "couple" ? "双人空间" : "朋友空间"} · {group.memberCount} 位成员</span><h1>{group.name}<span>✦</span></h1><p>信件将在约定的时间解封。</p></div><div className="release-chip"><span>◷</span><div><small>解封时间</small><strong>{releaseText}</strong></div></div><SleepingFox /></div>
        <nav className="tabs">{([["inbox", "收件箱"], ["write", "写一封信"], ["sent", "已寄出"], ["points", "积分与设置"]] as const).map(([value, label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}{value === "inbox" && lockedCount + readyCount > 0 && <b>{lockedCount + readyCount}</b>}</button>)}</nav>
        {tab === "inbox" && <section><div className="section-head"><div><span className="eyebrow">来信</span><h2>收件箱</h2><p>这里只显示寄给你的信。</p></div><span className="count">共 {data.inbox.length} 封</span></div>
          {data.inbox.length === 0 ? <div className="empty"><div>✉</div><h3>暂时没有来信</h3><p>可以先邀请成员加入空间。</p><button onClick={() => setTab("write")}>写一封信 →</button></div> : <div className="letter-list">{data.inbox.map((letter) => <article key={letter.id} className="letter"><button className="letter-header" disabled={letter.locked} onClick={() => setExpanded(expanded === letter.id ? null : letter.id)}><span className={"letter-symbol " + (letter.locked ? "sealed" : "")}>✉</span><span className="letter-heading"><strong>{letter.locked ? "一封还未解封的信" : letter.senderName ? "来自 " + letter.senderName + " 的信" : "一封写给你的信"}</strong><small>{letter.locked ? "将于 " : "于 "}{formatDate(letter.unlockAt)} 解封</small></span><span className={"state " + (letter.locked ? "sealed" : letter.response ? "answered" : "ready")}>{letter.locked ? "未解封" : letter.response ? "已回应" : "待回应"}</span>{!letter.locked && <span className="arrow">{expanded === letter.id ? "⌃" : "⌄"}</span>}</button>
            {!letter.locked && expanded === letter.id && <div className="opened"><div className="paper"><small>信件内容</small><p>{letter.body}</p><small>寄于 {formatDate(letter.createdAt)}</small></div>{letter.response ? <div className="response-done">已选择「{responseLabel[letter.response]}」</div> : <div className="respond"><strong>选择回应</strong><p>也可以稍后再回应。</p><div className="response-options">{(["agree", "neutral", "disagree"] as const).map((choice) => <button key={choice} disabled={busy} onClick={async () => { await run({ action: "respond", letterId: letter.id, response: choice }, "回应已保存"); setExpanded(letter.id); }}>{responseLabel[choice]}</button>)}</div></div>}</div>}</article>)}</div>}
        </section>}
        {tab === "write" && <section><div className="section-head"><div><span className="eyebrow">落笔</span><h2>写一封信</h2><p>想吐槽一件小事，就从那里写起。短一点也很好。</p></div></div><div className="compose-layout"><div className="compose card"><label htmlFor="recipient">写给谁</label><select id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} disabled={!others.length}>{others.length ? others.map((m) => <option key={m.userId} value={m.userId}>{m.displayName}</option>) : <option value="">还没有其他成员</option>}</select><label htmlFor="letter-body">信的内容</label><textarea id="letter-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={7} placeholder="想吐槽的一件小事……" /><div className="length">{body.length} / 500</div><div className="compose-bottom"><span>✦ 预计 {releaseText} 解封</span><button className="primary" disabled={busy || !others.length || body.trim().length < 5} onClick={async () => { if (await run({ action: "sendLetter", groupId: group.id, recipientId: recipient, body }, "信已寄出，会在约定时间解封")) { setBody(""); setTab("sent"); } }}>封好并寄出 ↗</button></div></div><aside className="guide card"><span>✧</span><h3>写信时的小提示</h3><div><b>01</b><p><strong>一件事</strong><br />从具体的事情写起。</p></div><div><b>02</b><p><strong>一点感受</strong><br />用自己的话简单描述。</p></div><div><b>03</b><p><strong>一个期待</strong><br />如果愿意，可以说说你的想法。</p></div><small>每封信最多 500 字。每 7 天最多向同一人寄 3 封信。</small></aside></div></section>}
        {tab === "sent" && <section><div className="section-head"><div><span className="eyebrow">寄出</span><h2>已寄出</h2><p>这里只显示你自己写的信。</p></div><span className="count">共 {data.sent.length} 封</span></div>{data.sent.length === 0 ? <div className="empty"><div>↗</div><h3>还没有寄出的信</h3><p>想写的时候，再来写。</p><button onClick={() => setTab("write")}>去写一封 →</button></div> : <div className="sent-list">{data.sent.map((letter) => <article className="sent card" key={letter.id}><div><strong>写给 {letter.recipientName}</strong><span>{formatDate(letter.createdAt)}</span></div><p>{letter.body}</p><footer><span>{letter.unlockAt > Date.now() ? "待 " + formatDate(letter.unlockAt) + " 解封" : letter.response ? "对方选择了「" + responseLabel[letter.response] + "」" : "已解封，等待回应"}</span>{letter.response && <b>+{letter.scoreAwarded ?? 0} 分</b>}</footer></article>)}</div>}</section>}
        {tab === "points" && <section><div className="section-head"><div><span className="eyebrow">规则</span><h2>积分与设置</h2><p>积分是回应记录，可以按空间规则调整。</p></div></div><div className="scores"><div className="score-card current"><small>本{group.settlementKind === "monthly" ? "月" : "周"}积分</small><strong>{data.points.period}<span> 分</span></strong><p>根据对方已回应的信计算</p></div><div className="score-card"><small>累计积分</small><strong>{data.points.total}<span> 分</span></strong><p>只显示你自己的积分</p></div></div>
          <div className="settings card"><div className="settings-head"><div><h3>空间规则</h3><p>已寄出的信保留投递时的解封时间与分值。</p></div><span>{isOwner ? "你是建组人" : "由建组人设置"}</span></div><div className="settings-grid"><label>解封频率<select value={settings.releaseKind ?? "nightly"} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, releaseKind: e.target.value as Group["releaseKind"] })}><option value="nightly">每天晚上</option><option value="weekly">每周一次</option></select></label><label>解封时间<select value={settings.releaseHour ?? 21} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, releaseHour: Number(e.target.value) })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select></label>{settings.releaseKind === "weekly" && <label>每周哪天<select value={settings.releaseWeekday ?? 0} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, releaseWeekday: Number(e.target.value) })}>{weekdays.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>}<label>积分周期<select value={settings.settlementKind ?? "weekly"} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, settlementKind: e.target.value as Group["settlementKind"] })}><option value="weekly">每周</option><option value="monthly">每月</option></select></label></div><div className="point-settings"><strong>回应分值</strong><div>{([["赞同", "scoreAgree"], ["无感", "scoreNeutral"], ["不认同", "scoreDisagree"]] as const).map(([label, key]) => <label key={key}>{label}<input type="number" min="0" max="20" value={settings[key] ?? 0} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })} />分</label>)}</div></div><label className="anonymous"><input type="checkbox" checked={!!settings.anonymous} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, anonymous: e.target.checked ? 1 : 0 })} /><span><strong>向收信人隐藏寄信人姓名</strong><small>双人空间中，对方通常仍能推断寄信人。</small></span></label>{isOwner && <button className="primary" disabled={busy} onClick={() => run({ action: "updateGroup", groupId: group.id, ...settings }, "规则已更新，新投递的信会按新规则安排")}>保存规则</button>}</div>
          <div className="invite card"><div><h3>邀请成员</h3><p>把网站链接和邀请码发给朋友；对方用用户名注册后选择“加入空间”。</p></div>{isOwner && <button onClick={() => { navigator.clipboard.writeText(group.inviteCode); setNotice("邀请码已复制"); }}>{group.inviteCode} <span>复制</span></button>}</div>
          {isOwner && <div className="manage card">
            <h3>空间管理</h3>
            <p>建组人可以修改空间名称，或结束这个空间。</p>
            <label htmlFor="rename-group">空间名称</label>
            <div className="rename-row"><input id="rename-group" value={renameName} maxLength={30} onChange={(e) => setRenameName(e.target.value)} /><button className="secondary" disabled={busy || renameName.trim().length < 2 || renameName.trim() === group.name} onClick={() => run({ action: "renameGroup", groupId: group.id, name: renameName }, "空间已重命名")}>保存名称</button></div>
            <div className="danger-row"><div><strong>删除空间</strong><small>所有成员和信封都会永久删除，无法恢复。</small></div><button className="danger-button" onClick={() => { setDeleteConfirm(""); setShowDelete(true); }}>删除空间</button></div>
          </div>}
        </section>}
      </>}
    </main></div>
    {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><div className="modal card" role="dialog" aria-modal="true" aria-label={modal === "create" ? "创建空间" : "加入空间"} onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setModal(null)}>×</button><div className="modal-icon">{modal === "create" ? "✦" : "✉"}</div><h2>{modal === "create" ? "创建空间" : "加入空间"}</h2><p>{modal === "create" ? "取一个名字，邀请想一起使用的人。" : "输入建组人分享的 8 位邀请码。"}</p>{modal === "create" ? <><label htmlFor="group-name">空间名称</label><input id="group-name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="例如：周末小组" /><label htmlFor="group-kind">空间类型</label><select id="group-kind" value={kind} onChange={(e) => setKind(e.target.value as "friends" | "couple")}><option value="friends">朋友组 · 多人</option><option value="couple">双人组 · 两人</option></select><button className="primary" disabled={busy || name.trim().length < 2} onClick={async () => { if (await run({ action: "createGroup", name, kind }, "新空间已建好", true)) { setModal(null); setName(""); setTab("inbox"); } }}>创建空间 ↗</button></> : <><label htmlFor="invite-code">邀请码</label><input id="invite-code" value={code} maxLength={8} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="输入 8 位邀请码" /><button className="primary" disabled={busy || code.length !== 8} onClick={async () => { if (await run({ action: "joinGroup", code }, "已加入新空间", true)) { setModal(null); setCode(""); setTab("inbox"); } }}>加入空间 ↗</button></>}</div></div>}
    {showDelete && group && <div className="modal-backdrop" onClick={() => setShowDelete(false)}><div className="modal card" role="dialog" aria-modal="true" aria-label="确认删除空间" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowDelete(false)}>×</button><div className="modal-icon danger-icon">×</div><h2>确认删除「{group.name}」？</h2><p>这会永久删除空间内全部信封、成员关系和积分记录，无法恢复。</p><label htmlFor="delete-confirm">请输入空间名称确认</label><input id="delete-confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={group.name} /><button className="danger-submit" disabled={busy || deleteConfirm.trim() !== group.name} onClick={async () => { if (await run({ action: "deleteGroup", groupId: group.id, confirmName: deleteConfirm }, "空间已删除")) { setShowDelete(false); setDeleteConfirm(""); setTab("inbox"); } }}>永久删除空间</button><button className="cancel-delete" onClick={() => setShowDelete(false)}>取消</button></div></div>}
  </div>;
}
