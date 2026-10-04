<div align="center">

# CORDIS · DSH 的心脏

把 DeepSeek 那篇 92 页的 Cordis 论文，讲成一本 12 页、能动手玩的网页书。
不用会编程：每个思想配一个能亲手点的演示，读完带走几条能直接发给 AI 的规矩。

**[线上阅读](https://augustyang.win/cordis/)**　·　[论文原文 ↗](https://arxiv.org/abs/2608.25512)　·　[deepseek-harness ↗](https://github.com/deepseek-ai/deepseek-harness)

<img src="40-assets/screenshots/hero.jpg" alt="首页：软件一边跑，一边换零件，凭什么不散架？" width="880" />

</div>

全书十二页：一个落地页、十个章节、一份术语表。第四章到第八章与论文的五项贡献一一对位，每章末尾有一条可以直接复制给 AI 的「带走」。

## 目录

| 目录 | 放什么 |
| --- | --- |
| `10-docs/` | 研读与建设过程的文档：决策记录、里程碑报告 |
| `20-content/` | 内容源：研读总览、7 份素材笔记 |
| `30-site/` | Astro 站点工程；本地跑 `cd 30-site && npm run dev` |
| `40-assets/` | 插图母本与 README 截图（母本不入 git） |
| `50-design/` | 设计稿与色彩配方 |
| `99-archive/` | 过程归档（不入 git） |

规则只有三条：根目录只留这份 README 和编号目录，过程文件一律进 `99-archive/`；`40-assets/illustrations/` 与 `99-archive/` 不入 git（见 `.gitignore`）；任何仓库、部署产物与公开分发包不得包含密钥。

## 进展

- 2026-10-01：论文与仓库研读完成，底稿在 `20-content/`
- 2026-10-04：全书重构为 12 页并上线：[augustyang.win/cordis](https://augustyang.win/cordis/)
