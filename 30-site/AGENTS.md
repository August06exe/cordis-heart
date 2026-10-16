# AGENTS — 改这个站点前必读

「DSH 的心脏」：把 Cordis 论文（arXiv:2608.25512）与 deepseek-ai/deepseek-harness 讲成一本 12 页交互网页书。Astro 静态站，发布在 augustyang.win/cordis/。命令、目录结构、视觉约定见 [README.md](README.md)，本文件讲外来协作者最容易踩的坑。

## 构建口径（最容易翻车的一处）

- 发布构建是 `npm run build:cordis`（Cloudflare Pages 在 CI 跑它）：全站路径加 `/cordis` 前缀。本地 `npm run build` 通过只说明根路径口径没坏，改了链接/资源引用后必须再跑 `build:cordis` 确认。
- `scripts/rebase.mjs` 只重写 HTML 属性与 CSS `url()`，**永不改 JS 字符串**——demo 文案里就有「/天气」这类正文，不是路径，不能被前缀化。
- 字体走 @fontsource 自托管，不要引入任何外部字体/CDN 请求。

## 文案声音（用户逐字校准过，动文案前对照）

- 整体调性：科普博主的故事感 + 教学时的轻吐槽。开场靠 DeepSeek/dsh 的名气引流，不堆 GitHub 数据。
- 五则稿则：现象开场；新词后面紧跟一句「也就是……」；每段只讲一个想法；轻吐槽每节最多一句；每节落到「所以呢」。
- 禁：审计腔（「综上所述」「值得注意的是」）；「说人话」类标题；黑话不经解释直进正文；独立「存疑」页；正文结尾挂编者按。
- 关键说法带论文页码，用 `<R id>` 引 `data/refs.ts` 的原文摘句；术语用 `<T id>` 引 `data/terms.ts`。id 写错构建直接报错；别在 MDX 里硬编码摘句或释义。

## 仓库地图（本目录之外）

- 仓库根 = `D:\Workshop\3000-Projects\3011-DSH论文笔记`：`20-content/` 研读底稿（站点文稿的上游素材，00-MAP.md 是入口）；`40-assets/` 设计资产（插图 2K 母本 gitignored、videos/ 视频、screenshots/ README 用截图）；`50-design/` 现行设计决策稿。
- `60-promo/`、`70-video/`、`99-archive/` 本地专用（gitignored），永远别提交；过程与临时文件只进 `99-archive/`。
- 根目录洁癖：根 = README + 编号目录，别新建散文件。密钥与凭证永不进任何仓库。

## 改动后验收

`npx astro check`（0 错）→ `npm run build:cordis` → `node scripts/probe-ux.mjs`（先起 dev，23 项交互回归全过）→ 390–1920px 宽度无横向溢出。

## 框架参考

Astro 官方文档：https://docs.astro.build 。路由、组件、MDX、样式按官方指南来；本项目特定的部分以本文件与 README.md 为准。
