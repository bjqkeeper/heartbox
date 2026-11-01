# 心事信箱（内测版）

一个面向朋友和恋人的定时信封网站。使用 Sites 托管、用户名密码登录和 Cloudflare D1 持久化。原有 ChatGPT 用户可在站内设置独立登录，继续使用原来的空间和信封。

## 已实现

- 创建朋友组或双人组，使用 8 位邀请码加入。双人组最多 2 人。
- 每封信只寄给组内一位成员；每天或每周按中国标准时间定时解封。
- 解封前服务端不返回正文；收信人以外的人不能读取来信。
- 收信人可选赞同、无感、不认同；写信人按投递时的分值获得 3/1/0 分（组设置可修改）。一封信只能回应一次。
- 周/月周期积分与累计积分、组内解封设置、匿名显示选项。
- 每 7 天对同一收信人最多投递 3 封，防止密集投递。
- 每封信限制 5–500 字，写信页提示一次只写一件事，避免长篇内容给收信人带来压力。
- 建组人可以重命名空间，也可以在输入当前空间名称确认后永久删除空间；删除同时清除该空间的成员、信封和积分。
- 普通浏览器可公开访问介绍页；用户使用用户名和密码注册、登录。会话使用 HttpOnly Cookie，密码经 PBKDF2 加盐保存。原有 ChatGPT 用户可绑定本地账号。

## 本地开发

需要 Node.js 22.13+。安装依赖后运行 `npm run db:generate`、`npm run build`，再按 Sites starter 的 D1 本地迁移说明应用 `drizzle/` 中的 SQL。`npm run start` 使用本地 D1 预览。

## 技术架构与部署备注

- 前端使用 React、TypeScript 和 Next.js App Router 页面结构；项目由 Vinext/Vite 构建，在 Cloudflare Workers 环境运行。页面主要使用自定义 CSS，同时引入 Tailwind CSS。
- 登录、空间、信件和积分由服务端路由处理，数据保存在 Cloudflare D1。账号和会话也依赖同一数据库；当前公开版本由 Sites 托管。
- 如果将来改为中国大陆服务器和自有域名，不能只更换 DNS 或上传静态网页：需要让服务端代码适配新的运行环境，迁移数据库中的账号、空间、信件和积分，并验证登录、解封、权限与定时规则。
- 正式切换前应确认当前托管数据的导出方式，做好备份与迁移核对，并按新接入服务商的要求处理域名和备案。现有网站可在迁移验证期间保留作为旧入口。

### 部署到自己的 Cloudflare Workers

1. 在 Cloudflare D1 中创建名为 `heartbox-db` 的数据库，复制它的数据库 ID。新数据库与当前 Sites 网站的数据相互独立。
2. 在新数据库中依次执行 `drizzle/0000_foamy_mentor.sql` 和 `drizzle/0001_melodic_frank_castle.sql`，建好表后再部署。可在本地登录 Wrangler 后运行：

   ```bash
   npx wrangler d1 execute heartbox-db --remote --file=drizzle/0000_foamy_mentor.sql
   npx wrangler d1 execute heartbox-db --remote --file=drizzle/0001_melodic_frank_castle.sql
   ```

3. 在 Workers & Pages 中选择 **创建 Worker → 连接 GitHub**，选择 `bjqkeeper/heartbox`。仓库根目录就是项目根目录，根目录设置留空。
4. 项目名称填 `heartbox`，构建命令填 `npm run build`，部署命令填 `npm run deploy:cloudflare`。
5. 在构建变量中添加 `CLOUDFLARE_D1_DATABASE_ID`，值为第 1 步复制的数据库 ID。如果数据库没有命名为 `heartbox-db`，再添加 `CLOUDFLARE_D1_DATABASE_NAME`。这些是 **构建变量**，不是运行时密钥。部署后用新网址测试注册、登录和创建空间。

不要把现有 Sites 数据库当作新数据库；若需要保留旧账号或信件，必须先导出并迁移数据。

## 权限规则

`/api/dashboard` 仅查询当前用户所在的组。收件箱只查询当前用户为收信人的信，未解封时响应中不包含正文。寄件箱只查询当前用户写的信。投递和回应都在服务端检查组成员、收信人及解封时间。建组人只能改设置，不能查看其他成员的信。

## 后续工作

当前版本无需 ChatGPT 账号，加入组仍需邀请码。密码暂不支持自助找回。后续需要补齐举报、退出组、单封信删除、账号注销和密码找回流程，并做更完整的滥用与隐私测试。

关于回应选项、积分与继续对话的改进意见，见 [沟通机制改进意见](docs/communication-feedback.md)。
