# 30-site

「DSH 的心脏」站点工程：把 Cordis 论文（arXiv:2608.25512）讲成一本 12 页的网页书。Astro 静态站，文稿即 `src/pages/*.mdx`。

## 命令

```text
npm install
npm run dev                  # 本地开发（后台运行：npx astro dev --background）
npm run build                # 构建到 dist/
npm run build:cordis         # 同上，并把所有路径加 /cordis 前缀（发布到 域名/cordis 子路径用）
npx astro check              # 类型检查
node scripts/probe-ux.mjs    # 交互回归（先起 dev；用系统 Edge + playwright-core）
```

## 结构

```text
src/
  pages/            落地页 index.astro + 十章与术语表 *.mdx（路由即文件名）
  layouts/          Base（报头、进度条、版心、页脚）、Chapter（章首图版、侧栏目录、本页目录、翻页）
  components/       正文零件 T（术语）R（出处）Fig Cmp Case Code Rule；Stage 演示外壳；
                    TermList 术语表、StealBoard 抄作业生成器、FitCheck 自查五问
    demos/          八个演示：七个套 Stage 逐拍播放，TwoWindows 是单步对照
    figs/           四张程序化图：Lineage、PaperMap、TwoAxes、Lines
  data/             book.ts 章节表、terms.ts 术语、refs.ts 论文摘句、steal.ts 十五招、snippets.ts 代码对照
  scripts/          stage.ts 拍点引擎、motion.ts 动效、ui.ts 浮层/本页目录/抽屉/进度条、copy.ts 复制
  styles/           tokens 令牌、base 正文、shell 版心、stage 演示、parts 零件
public/images/web/  插图 web 档（母本在 40-assets，不入 git）
scripts/            probe-ux.mjs 交互回归；build-cordis.mjs + rebase.mjs 子路径发布；m47-、m5- 两个补图脚本留作出处
```

## 约定

- 单墨：纸 #FAFAF7，钴蓝 #2148B8 是唯一强调色。状态语言统一：实印 = 在岗，网屏 = 待命，虚线 = 已撤，盖章 = 失败。
- 术语和出处只用 `<T id>`、`<R id>` 引用，数据各自只在 terms.ts、refs.ts 一处维护；id 写错，构建直接报错。
- 演示只动 transform、opacity、clip-path；`prefers-reduced-motion` 下等待归零、瞬切。
- 演示的断点看舞台和画布自身宽度（container query），不看窗口：有侧栏时舞台可能只剩 700px。
- 改完跑 `astro check`、`build`、`probe-ux`。
