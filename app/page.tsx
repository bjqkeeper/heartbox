import { getCurrentUser } from "../lib/auth";
import HeartboxApp from "./heartbox-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) return <HeartboxApp displayName={user.displayName} authKind={user.authKind} />;

  const signIn = "/login";
  return <div className="public-site">
    <header className="public-header"><a className="public-brand" href="/"><span>✉</span><strong>心事信箱</strong></a><nav><a href="#how">如何使用</a><a href="#privacy">隐私规则</a><a className="public-login" href={signIn}>登录进入 ↗</a></nav></header>
    <main>
      <section className="public-hero"><div className="public-hero-copy"><span className="public-eyebrow">给关系一个好好说话的机会</span><h1>把难说的话，<br /><em>留到合适的时候打开。</em></h1><p>为朋友和恋人准备的私密信箱。写下当面难以表达的心事，在约定的时间交给对方，由对方决定怎样回应。</p><div className="public-actions"><a className="public-primary" href={signIn}>进入心事信箱 <span>↗</span></a><a className="public-secondary" href="#how">看看怎么玩 ↓</a></div><small>用用户名和密码即可登录，无需 ChatGPT 账号。加入朋友的空间还需要邀请码。</small></div><div className="public-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-letter back"><span>愿意听你说</span></div><div className="art-letter front"><span className="art-stamp">✦</span><span className="art-fold" /><strong>写给你的一封信</strong><small>在约定的时间开启</small></div><div className="art-spark one">✧</div><div className="art-spark two">✦</div></div></section>
      <section id="how" className="public-section"><div className="public-section-head"><span className="public-eyebrow">HOW IT WORKS</span><h2>让表达有一点缓冲，<br />也有一个回音。</h2></div><div className="public-steps"><article><span>01</span><h3>建立空间</h3><p>创建朋友组或双人组，用邀请码把想认真相处的人邀请进来。</p></article><article><span>02</span><h3>写一封信</h3><p>选定一位收信人，写下具体的事情、自己的感受和期待。</p></article><article><span>03</span><h3>约时解封</h3><p>空间可设置每天晚上或每周解封，时间没到，正文不会提前显示。</p></article><article><span>04</span><h3>温和回应</h3><p>收信人可以选择赞同、无感或不认同，也可以稍后再回应。</p></article></div></section>
      <section id="privacy" className="public-privacy"><div><span className="public-eyebrow">只属于你们的空间</span><h2>心里话，留给该看见的人。</h2><p>一封信只寄给一位收信人。空间里的其他成员和建组人都不能查看信件内容。寄信人姓名是否对收信人显示，由空间规则决定。</p><a href={signIn}>开始使用 ↗</a></div><div className="privacy-card"><span>✉</span><strong>指定收信人可读</strong><small>解封前正文不显示 · 无公开信件广场</small></div></section>
    </main>
    <footer className="public-footer"><span>✉ 心事信箱</span><small>把难说的话，温柔地寄出。</small></footer>
  </div>;
}
