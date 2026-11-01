import { NightStars, SleepingFox } from "../night-illustration";
import "./guide.css";

export const metadata = {
  title: "使用与规则 · 心事信箱",
  description: "了解心事信箱的空间、信封、解封、回应、积分与隐私规则。",
};

const steps = [
  ["01", "建立空间", "创建朋友空间或双人空间，发出邀请码。"],
  ["02", "写一封信", "选一位收信人，写一件想说的小事。"],
  ["03", "等待解封", "信会在空间设定的下一次时间解封。"],
  ["04", "选择回应", "收信人可以回应，也可以先放一放。"],
];

const settings = [
  ["解封频率", "每天晚上", "每天一次，或每周一次"],
  ["解封时间", "21:00", "00:00 至 23:00，整点选择"],
  ["每周解封日", "周日", "选用每周解封时可设周日到周六"],
  ["积分周期", "每周", "每周或每月；只影响周期积分的统计"],
  ["回应分值", "赞同 3 / 无感 1 / 不认同 0", "每项都可设为 0 至 20 分"],
  ["隐藏寄信人姓名", "开启", "控制收信人是否看到寄信人姓名"],
];

export default function GuidePage() {
  return <div className="guide-page">
    <NightStars />
    <header className="guide-header">
      <a className="guide-brand" href="/"><span>✉</span>心事信箱</a>
      <nav aria-label="页面导航"><a href="/">返回首页</a><a className="guide-enter" href="/">进入信箱 ↗</a></nav>
    </header>
    <main>
      <section className="guide-hero">
        <div><span className="guide-kicker">使用与规则</span><h1>写好，封好，<br /><em>等到约定的时间。</em></h1><p>这里整理了信箱的使用方式、空间配置和回应机制。想写时再写，想读时再读。</p><div className="guide-hero-links"><a href="#start">从使用方法开始 ↓</a><a href="#settings">查看可调整的配置 ↓</a></div></div>
        <div className="guide-hero-art" aria-hidden="true"><div className="guide-moon" /><div className="guide-envelope">✦</div><SleepingFox /></div>
      </section>

      <div className="guide-body">
        <aside className="guide-index" aria-label="本页目录"><strong>本页目录</strong><a href="#start">怎么使用</a><a href="#space">空间与成员</a><a href="#letters">写信和解封</a><a href="#responses">回应与积分</a><a href="#settings">调整配置</a><a href="#privacy">隐私与管理</a></aside>
        <div className="guide-content">
          <section id="start" className="guide-section">
            <span className="guide-kicker">01 · 开始</span><h2>怎么使用</h2>
            <p>用用户名和密码注册或登录。创建空间后，把邀请码分享给要一起使用的人；对方注册账号并选择“加入空间”即可。</p>
            <div className="guide-steps">{steps.map(([number, title, detail]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></article>)}</div>
          </section>

          <section id="space" className="guide-section">
            <span className="guide-kicker">02 · 成员</span><h2>空间怎么运作</h2>
            <div className="guide-grid">
              <article><h3>朋友空间</h3><p>适合多人一起使用。创建人把 8 位邀请码发给朋友，对方加入后才能成为空间成员。</p></article>
              <article><h3>双人空间</h3><p>最多两位成员，适合两个人使用。第二位成员加入后，空间就不能再加入其他人。</p></article>
            </div>
            <p>空间名称为 2～30 个字；每个账号最多创建 10 个空间。成员可以使用空间里的收信与写信功能，只有建组人可以修改规则、重命名或删除空间。</p>
          </section>

          <section id="letters" className="guide-section">
            <span className="guide-kicker">03 · 信封</span><h2>写信与解封</h2>
            <ul className="guide-list">
              <li><strong>一封信只给一个人。</strong>写信时从当前空间选择收信人，不能寄给自己。</li>
              <li><strong>写短一点也可以。</strong>正文为 5～500 个字；每 7 天最多向同一个人寄 3 封信。寄出后目前不能编辑或撤回。</li>
              <li><strong>在下一次约定时间解封。</strong>可设为每天一个整点，或每周某天的一个整点。页面显示的时间按北京时间计算。</li>
              <li><strong>解封前不显示正文。</strong>收信人能看到待解封的信封和时间；寄信人可以在“已寄出”中查看自己写过的信。</li>
            </ul>
            <div className="guide-note"><b>举个例子</b><p>空间设为每天 21:00：20:00 寄出的信会在当天 21:00 解封；21:00 之后寄出，则在第二天 21:00 解封。</p></div>
          </section>

          <section id="responses" className="guide-section">
            <span className="guide-kicker">04 · 回应</span><h2>回应与积分</h2>
            <p>信件解封后，只有收信人能选择回应。回应有“赞同”“无感”“不认同”三种，每封信只能选一次；也可以暂时不回应。积分是互动记录，不用它判断谁对谁错。</p>
            <div className="guide-points"><div><strong>赞同</strong><span>默认 +3 分</span></div><div><strong>无感</strong><span>默认 +1 分</span></div><div><strong>不认同</strong><span>默认 +0 分</span></div></div>
            <p>分数记到寄信人名下，只有收信人回应后才产生。“本周 / 本月积分”统计这个周期内收到回应的分数；“累计积分”保留历史总分。周期按北京时间计算，每周从周一开始，每月从 1 日开始。</p>
          </section>

          <section id="settings" className="guide-section">
            <span className="guide-kicker">05 · 自定义</span><h2>在哪里调整配置</h2>
            <p>进入空间后，打开“积分与设置” → “空间规则”。建组人修改选项后点击“保存规则”；其他成员可以查看当前规则。</p>
            <div className="guide-settings" role="table" aria-label="空间配置">
              <div className="guide-settings-head" role="row"><span role="columnheader">配置</span><span role="columnheader">默认值</span><span role="columnheader">可以怎么改</span></div>
              {settings.map(([name, defaultValue, detail]) => <div className="guide-settings-row" role="row" key={name}><strong role="cell">{name}</strong><span role="cell">{defaultValue}</span><span role="cell">{detail}</span></div>)}
            </div>
            <div className="guide-note"><b>修改后从什么时候生效？</b><p>新寄出的信按新解封规则和分值安排；已经寄出的信保留投递时确定的解封时间与回应分值。隐藏姓名的设置会影响收信箱里姓名的显示。</p></div>
          </section>

          <section id="privacy" className="guide-section">
            <span className="guide-kicker">06 · 安心使用</span><h2>谁能看到信</h2>
            <p>信件不会公开展示。寄信人能查看自己寄出的信；收信人解封后能读到寄给自己的信。若不是这封信的寄信人或收信人，建组人也不能查看正文。</p>
            <p>新空间默认隐藏寄信人姓名，建组人可以关闭这个选项。双人空间即使隐藏姓名，对方仍可能推断是谁写的。</p>
            <div className="guide-grid guide-last-grid"><article><h3>重命名空间</h3><p>建组人可在“积分与设置” → “空间管理”中修改名称。</p></article><article><h3>删除空间</h3><p>建组人可在同一位置删除空间。删除后，成员关系、信件和积分记录会永久清除，无法恢复。</p></article></div>
            <p className="guide-small">当前版本暂不支持自助找回密码，请妥善保存登录信息。</p>
          </section>
          <div className="guide-end"><span>✉</span><p>想好了，就从一封短信开始。</p><a href="/">进入信箱 ↗</a></div>
        </div>
      </div>
    </main>
    <footer className="guide-footer"><span>✉ 心事信箱</span><a href="/">返回首页 ↑</a></footer>
  </div>;
}
