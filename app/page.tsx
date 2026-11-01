import { getCurrentUser } from "../lib/auth";
import HeartboxApp from "./heartbox-app";
import { NightStars, SleepingFox } from "./night-illustration";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) return <HeartboxApp displayName={user.displayName} authKind={user.authKind} />;

  const signIn = "/login";
  return <div className="public-site">
    <header className="public-header"><a className="public-brand" href="/"><span>✉</span><strong>心事信箱</strong></a><nav><a href="#how">如何使用</a><a href="#privacy">隐私规则</a><a className="public-login" href={signIn}>进入信箱 ↗</a></nav></header>
    <main>
      <section className="public-hero"><NightStars /><div className="public-hero-copy"><span className="public-eyebrow">小小吐槽，也可以写成一封信</span><h1>写下来，<br /><em>等夜晚轻轻打开。</em></h1><p>吐槽一件小事，或随手写几句。封好后，等到约定的时间再打开。</p><div className="public-actions"><a className="public-primary" href={signIn}>进入信箱 <span>↗</span></a><a className="public-secondary" href="#how">看看怎么用 ↓</a></div><small>用户名和密码即可登录；加入空间需要邀请码。</small></div><div className="public-art" aria-hidden="true"><div className="night-moon" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-letter back"><span>晚安</span></div><div className="art-letter front"><span className="art-stamp">✦</span><span className="art-fold" /><strong>一封留给你的信</strong><small>在约定的时间开启</small></div><SleepingFox /><div className="art-spark one">✧</div><div className="art-spark two">✦</div></div></section>
      <section id="how" className="public-section"><div className="public-section-head"><span className="public-eyebrow">如何使用</span><h2>写好，封好，<br />等到约定的时间。</h2></div><div className="public-steps"><article><span>01</span><h3>建立空间</h3><p>创建朋友组或双人组，邀请成员加入。</p></article><article><span>02</span><h3>写一封信</h3><p>选定收信人，写下想说的一件事。</p></article><article><span>03</span><h3>约时解封</h3><p>空间可设置每天晚上或每周解封。</p></article><article><span>04</span><h3>选择回应</h3><p>收信人可以回应，也可以稍后再说。</p></article></div></section>
      <section id="privacy" className="public-privacy"><div><span className="public-eyebrow">隐私规则</span><h2>一封信，只给一个人。</h2><p>只有指定的收信人能看到信件。解封前正文不显示；空间里的其他成员和建组人也无法查看。寄信人姓名是否显示，由空间规则决定。</p><a href={signIn}>开始使用 ↗</a></div><div className="privacy-card"><span>✉</span><strong>指定收信人可读</strong><small>约时解封 · 不公开展示</small></div></section>
    </main>
    <footer className="public-footer"><span>✉ 心事信箱</span><small>写下来，等一等。</small></footer>
  </div>;
}
