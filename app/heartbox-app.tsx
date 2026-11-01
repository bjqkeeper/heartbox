"use client";

import { useCallback, useEffect, useState } from "react";

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

export default function HeartboxApp({ displayName }: { displayName: string }) {
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

  return <div className="shell">
    <header className="topbar"><div className="brand"><div className="logo">✉</div><div><strong>心事信箱</strong><small>把难说的话，温柔地寄出</small></div></div><div className="user"><span className="privacy"><i />私密空间</span><span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span></div></header>
    <div className="workspace"><aside className="sidebar"><div className="sidebar-heading">我的空间</div>
      <div className="group-list">{data?.groups.map((item) => <button key={item.id} className={"group-item " + (item.id === group?.id ? "active" : "")} onClick={() => { setGroupId(item.id); setTab("inbox"); setExpanded(null); }}><span className="group-icon">{item.kind === "couple" ? "♡" : "✦"}</span><span><strong>{item.name}</strong><small>{item.kind === "couple" ? "双人空间" : "朋友空间"} · {item.memberCount} 人</small></span></button>)}</div>
      <button className="sidebar-action" onClick={() => setModal("create")}>＋ 创建空间</button>
      <button className="sidebar-action" onClick={() => setModal("join")}>↗ 加入空间</button>
      <div className="sidebar-quote"><b>❝</b><p>愿每一句心里话，<br />都有被认真接住的机会。</p></div>
    </aside>
    <main className="main">
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {!data ? <div className="loading">正在打开信箱…</div> : !group ? <div className="welcome"><div className="welcome-icon">✉</div><span className="eyebrow">从一个空间开始</span><h1>给心里话，一个<br /><em>刚刚好的去处。</em></h1><p>和朋友或恋人创建一个只属于你们的空间。写下难以当面说的话，让信封在约定时间打开。</p><div className="buttons"><button className="primary" onClick={() => setModal("create")}>创建我的空间 ↗</button><button className="secondary" onClick={() => setModal("join")}>已有邀请码</button></div></div> : <>
        <div className="intro"><div><span className="eyebrow">{group.kind === "couple" ? "双人空间" : "朋友空间"} · {group.memberCount} 位成员</span><h1>{group.name}<span>✦</span></h1><p>有些话，等一个合适的时间再打开。</p></div><div className="release-chip"><span>◷</span><div><small>解封规则</small><strong>{releaseText}</strong></div></div></div>
        <nav className="tabs">{([["inbox", "收件箱"], ["write", "写一封信"], ["sent", "已寄出"], ["points", "积分与设置"]] as const).map(([value, label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}{value === "inbox" && lockedCount + readyCount > 0 && <b>{lockedCount + readyCount}</b>}</button>)}</nav>
        {tab === "inbox" && <section><div className="section-head"><div><span className="eyebrow">写给你的信</span><h2>收件箱</h2><p>只有寄给你的信，才会出现在这里。</p></div><span className="count">共 {data.inbox.length} 封</span></div>
          {data.inbox.length === 0 ? <div className="empty"><div>✉</div><h3>信箱里还没有来信</h3><p>邀请成员加入，或先给对方写一封信吧。</p><button onClick={() => setTab("write")}>写一封信 →</button></div> : <div className="letter-list">{data.inbox.map((letter) => <article key={letter.id} className="letter"><button className="letter-header" disabled={letter.locked} onClick={() => setExpanded(expanded === letter.id ? null : letter.id)}><span className={"letter-symbol " + (letter.locked ? "sealed" : "")}>✉</span><span className="letter-heading"><strong>{letter.locked ? "一封还未解封的信" : letter.senderName ? "来自 " + letter.senderName + " 的信" : "一封写给你的信"}</strong><small>{letter.locked ? "将于 " : "于 "}{formatDate(letter.unlockAt)} 解封</small></span><span className={"state " + (letter.locked ? "sealed" : letter.response ? "answered" : "ready")}>{letter.locked ? "未解封" : letter.response ? "已回应" : "待回应"}</span>{!letter.locked && <span className="arrow">{expanded === letter.id ? "⌃" : "⌄"}</span>}</button>
            {!letter.locked && expanded === letter.id && <div className="opened"><div className="paper"><small>写给你的一段话</small><p>{letter.body}</p><small>寄于 {formatDate(letter.createdAt)}</small></div>{letter.response ? <div className="response-done">你选择了「{responseLabel[letter.response]}」。谢谢你认真读完。</div> : <div className="respond"><strong>读完后，你的感受是？</strong><p>你可以稍后再回应，不必为了让对方得分而勉强自己。</p><div className="response-options">{(["agree", "neutral", "disagree"] as const).map((choice) => <button key={choice} disabled={busy} onClick={async () => { await run({ action: "respond", letterId: letter.id, response: choice }, "回应已保存"); setExpanded(letter.id); }}>{responseLabel[choice]}</button>)}</div></div>}</div>}</article>)}</div>}
        </section>}
        {tab === "write" && <section><div className="section-head"><div><span className="eyebrow">让心事有处可去</span><h2>写一封信</h2><p>慢慢写，不急着找到完美的说法。</p></div></div><div className="compose-layout"><div className="compose card"><label htmlFor="recipient">写给谁</label><select id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} disabled={!others.length}>{others.length ? others.map((m) => <option key={m.userId} value={m.userId}>{m.displayName}</option>) : <option value="">还没有其他成员</option>}</select><label htmlFor="letter-body">信的内容</label><textarea id="letter-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} rows={9} placeholder="那天发生的一件事，让我有点在意……" /><div className="length">{body.length} / 1500</div><div className="compose-bottom"><span>✦ 这封信会按 {releaseText} 的规则解封</span><button className="primary" disabled={busy || !others.length || body.trim().length < 5} onClick={async () => { if (await run({ action: "sendLetter", groupId: group.id, recipientId: recipient, body }, "信已寄出，会在约定时间解封")) { setBody(""); setTab("sent"); } }}>封好并寄出 ↗</button></div></div><aside className="guide card"><span>✧</span><h3>试着这样表达</h3><div><b>01</b><p><strong>发生了什么</strong><br />描述具体的一件事，少一点猜测。</p></div><div><b>02</b><p><strong>你的感受</strong><br />说说这件事让你有什么感觉。</p></div><div><b>03</b><p><strong>你的期待</strong><br />告诉对方，你希望以后怎样相处。</p></div><small>每 7 天最多向同一人寄 3 封信，给彼此留一点消化的时间。</small></aside></div></section>}
        {tab === "sent" && <section><div className="section-head"><div><span className="eyebrow">你寄出去的心意</span><h2>已寄出</h2><p>这里只显示你自己写的信。</p></div><span className="count">共 {data.sent.length} 封</span></div>{data.sent.length === 0 ? <div className="empty"><div>↗</div><h3>还没有寄出的信</h3><p>第一封信，可以从一句简单的心里话开始。</p><button onClick={() => setTab("write")}>去写一封 →</button></div> : <div className="sent-list">{data.sent.map((letter) => <article className="sent card" key={letter.id}><div><strong>写给 {letter.recipientName}</strong><span>{formatDate(letter.createdAt)}</span></div><p>{letter.body}</p><footer><span>{letter.unlockAt > Date.now() ? "待 " + formatDate(letter.unlockAt) + " 解封" : letter.response ? "对方选择了「" + responseLabel[letter.response] + "」" : "已解封，等待回应"}</span>{letter.response && <b>+{letter.scoreAwarded ?? 0} 分</b>}</footer></article>)}</div>}</section>}
        {tab === "points" && <section><div className="section-head"><div><span className="eyebrow">一次真诚的回应</span><h2>积分与设置</h2><p>积分只是小小的鼓励，不代表谁对谁错。</p></div></div><div className="scores"><div className="score-card current"><small>本{group.settlementKind === "monthly" ? "月" : "周"}积分</small><strong>{data.points.period}<span> 分</span></strong><p>根据对方已回应的信计算</p></div><div className="score-card"><small>累计积分</small><strong>{data.points.total}<span> 分</span></strong><p>只显示你自己的积分</p></div></div>
          <div className="settings card"><div className="settings-head"><div><h3>空间规则</h3><p>已寄出的信保留投递时的解封时间与分值。</p></div><span>{isOwner ? "你是建组人" : "由建组人设置"}</span></div><div className="settings-grid"><label>解封频率<select value={settings.releaseKind ?? "nightly"} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, releaseKind: e.target.value as Group["releaseKind"] })}><option value="nightly">每天晚上</option><option value="weekly">每周一次</option></select></label><label>解封时间<select value={settings.releaseHour ?? 21} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, releaseHour: Number(e.target.value) })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}</select></label>{settings.releaseKind === "weekly" && <label>每周哪天<select value={settings.releaseWeekday ?? 0} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, releaseWeekday: Number(e.target.value) })}>{weekdays.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></label>}<label>积分周期<select value={settings.settlementKind ?? "weekly"} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, settlementKind: e.target.value as Group["settlementKind"] })}><option value="weekly">每周</option><option value="monthly">每月</option></select></label></div><div className="point-settings"><strong>回应分值</strong><div>{([["赞同", "scoreAgree"], ["无感", "scoreNeutral"], ["不认同", "scoreDisagree"]] as const).map(([label, key]) => <label key={key}>{label}<input type="number" min="0" max="20" value={settings[key] ?? 0} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })} />分</label>)}</div></div><label className="anonymous"><input type="checkbox" checked={!!settings.anonymous} disabled={!isOwner} onChange={(e) => setSettings({ ...settings, anonymous: e.target.checked ? 1 : 0 })} /><span><strong>向收信人隐藏寄信人姓名</strong><small>双人空间中，对方通常仍能推断寄信人。</small></span></label>{isOwner && <button className="primary" disabled={busy} onClick={() => run({ action: "updateGroup", groupId: group.id, ...settings }, "规则已更新，新投递的信会按新规则安排")}>保存规则</button>}</div>
          <div className="invite card"><div><h3>邀请成员</h3><p>建组人可复制邀请码，邀请朋友加入这个空间。</p>{isOwner && <small>当前站点仅你可访问，邀请码需开放成员访问后才能使用。</small>}</div>{isOwner && <button onClick={() => { navigator.clipboard.writeText(group.inviteCode); setNotice("邀请码已复制"); }}>{group.inviteCode} <span>复制</span></button>}</div>
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
    {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><div className="modal card" role="dialog" aria-modal="true" aria-label={modal === "create" ? "创建空间" : "加入空间"} onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setModal(null)}>×</button><div className="modal-icon">{modal === "create" ? "✦" : "✉"}</div><h2>{modal === "create" ? "创建一个新空间" : "加入他们的空间"}</h2><p>{modal === "create" ? "给彼此一个安全、温柔的表达角落。" : "输入建组人分享给你的 8 位邀请码。"}</p>{modal === "create" ? <><label htmlFor="group-name">空间名称</label><input id="group-name" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="例如：我们的周末小组" /><label htmlFor="group-kind">空间类型</label><select id="group-kind" value={kind} onChange={(e) => setKind(e.target.value as "friends" | "couple")}><option value="friends">朋友组 · 多人</option><option value="couple">双人组 · 两人</option></select><button className="primary" disabled={busy || name.trim().length < 2} onClick={async () => { if (await run({ action: "createGroup", name, kind }, "新空间已建好", true)) { setModal(null); setName(""); setTab("inbox"); } }}>创建空间 ↗</button></> : <><label htmlFor="invite-code">邀请码</label><input id="invite-code" value={code} maxLength={8} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="输入 8 位邀请码" /><button className="primary" disabled={busy || code.length !== 8} onClick={async () => { if (await run({ action: "joinGroup", code }, "已加入新空间", true)) { setModal(null); setCode(""); setTab("inbox"); } }}>加入空间 ↗</button></>}</div></div>}
    {showDelete && group && <div className="modal-backdrop" onClick={() => setShowDelete(false)}><div className="modal card" role="dialog" aria-modal="true" aria-label="确认删除空间" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowDelete(false)}>×</button><div className="modal-icon danger-icon">×</div><h2>确认删除「{group.name}」？</h2><p>这会永久删除空间内全部信封、成员关系和积分记录，无法恢复。</p><label htmlFor="delete-confirm">请输入空间名称确认</label><input id="delete-confirm" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={group.name} /><button className="danger-submit" disabled={busy || deleteConfirm.trim() !== group.name} onClick={async () => { if (await run({ action: "deleteGroup", groupId: group.id, confirmName: deleteConfirm }, "空间已删除")) { setShowDelete(false); setDeleteConfirm(""); setTab("inbox"); } }}>永久删除空间</button><button className="cancel-delete" onClick={() => setShowDelete(false)}>取消</button></div></div>}
  </div>;
}
