# 30-site

DSH 的心脏 · Cordis 思想图鉴，Astro 静态站工程（PRD 里程碑 M4 脚手架）。

## 命令

```text
npm install
npm run dev       # 本地开发
npm run build     # 构建到 dist/
npm run preview   # 预览构建产物
```

## 结构

```text
src/
  content/pages/    九页文稿（collection: pages，schema 见 src/content.config.ts）
  content.config.ts 内容管线配置
  data/site.ts      站名、九页导航、时效声明的唯一数据源
  layouts/          BaseLayout.astro（报头、导航、页脚横幅、进度条、主题、ClientRouter）
  components/       Badge、Takeaway、SceneControls、ThemeToggle、HeroScene
  scripts/          motion.ts（GSAP 基建）、hero-motion.ts（首页五拍）
  styles/global.css 全站令牌与共享样式（定案来源 10-docs/11-深色令牌定案.md）
  pages/            index.astro、map.json.ts、og/[slug].svg.ts
public/images/      插图占位目录（插图管线后续填入）
```

## 约定

- 单墨：全页唯一墨色钴蓝 #2148B8，深色主题基墨 #A0B4EE 为待对账推导值，令牌表见 global.css 注释。
- 动效：只动画 transform 与 opacity（SVG 描边的 stroke-dashoffset 除外）；场景统一经 `registerScene` 暴露播放、暂停、重播；强度 8 页（首页、沙盒）必须过 gsap.matchMedia 的 prefers-reduced-motion 降级。
- 页面实现员写 `src/pages/<slug>.astro`，slug 取 `src/data/site.ts` 的 SITE_PAGES；内容从 `getCollection('pages')` 取。
- 端点：`/map.json` 知识库地图；`/og/<slug>.svg` 每页 OG 图（M6 可升级 satori+resvg 出 PNG）。
