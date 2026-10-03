# 出稿 Brief：实录页 /field-notes（单墨编辑印刷 · 九页视觉稿之一）

## 0. 执行指令（先读我，硬性要求）

1. **本次任务的唯一交付物是项目内新文件 `field-notes.html`**（单文件 HTML）。你必须在结束前用 write_file / create_artifact 把它写进项目根目录，并确认它成为带 manifest 的 artifact。**只输出计划、只读参考、或在聊天里贴代码而不落盘，都算失败。**
2. 不要向用户提问，本 brief 信息自足；有取舍直接按 brief 裁定并落进设计说明。
3. 探索从简：`brand-spec.md` 与 `cordis-hero.html` 是已验证风格实样（第 2 节已把要点抄录），看一眼即可开写；**不要改动项目里已有的 why.html、cordis-hero.html、brand-spec.md**。
4. 产出后快速自检第 5 节禁令（尤其：全文不得出现破折号 — –；每行中点 · 至多 1 个；无纯黑），然后结束。

---

你是本页的出稿 agent。按本 brief 产出一个**单文件 HTML 视觉稿**。第 1 节铁律逐条强制，第 5 节禁令可被 grep 验证，第 3 节是唯一内容来源：**页面上出现的每一个数字都必须能在第 3、6 节找到原文出处，禁止编造任何数字（日期、star、版本号、PR 号、篇数都是数字）**。

---

## 1. 风格铁律（每条强制，评审按此打分）

1. **单墨编辑印刷风**：纸白 `#FAFAF7` 背景，全页唯一墨色钴蓝 `#2148B8`，层次只靠透明度阶梯（.14 基座 / .20 细线 / .70 图解线 / .78 小字 / .82 正文 / 1 标题），不出现第二色相。
2. **对比度红线**（已用 node 按 WCAG 相对亮度公式实算，alpha 在 sRGB 上按 8-bit 取整合成，不许目测）：

   | 墨档 | 实算值 | 用途 |
   |---|---|---|
   | 1.0 | 7.483:1 | 标题实印、徽标墨底纸字 |
   | .82 | 4.966:1 | 正文（≥4.5 过线） |
   | .80 | 4.716:1 | 图内编号文字 |
   | .78 | 4.524:1 | 小字 / 注脚，**任何文字的 alpha 下限** |
   | .70 | 3.778:1 | 图解线 / 表意图形（≥3 线），**不作文字** |
   | .20 | 1.389:1 | 分隔细线（装饰豁免，不作文字） |
   | .14 | 1.251:1 | 基座色块（装饰豁免，不作文字） |

3. **字体**：Noto Serif SC 900 衬线大标题 + Noto Sans SC 400/500/700 正文；数字与数据场景用 IBM Plex Mono。留白占 25%~50%。
4. **反 AI 味五禁令**：无紫色渐变、无玻璃拟态、无三等分卡片阵列、无「滚动探索/Scroll to explore」提示语、无装饰性状态圆点。
5. **交付物形态**：单文件 HTML 视觉稿（可引用 Google Fonts CDN），图表与时间线为内联 SVG，末尾附一段设计说明（配色 / 字体 / 构图 / 动效分镜各一两句）。

## 2. 视觉词汇（逐条继承已验证小样 `cordis-hero.html`，不要另起炉灶）

- **开本**：页面四缘一圈 1px 墨线框（墨 .20），页边距桌面 22px、移动 14px；报头、正文、页脚三段以 1px 分隔线切开。
- **报头**：左侧 wordmark = `CORDIS`（Serif 900、19px、字距 .34em）+ 「DSH 的心脏 · 思想图鉴」（13px、.82）；右侧 folio = 「实录 · 勘察与案例」（12px、字距 .22em、.78）。folio 放章节名，**不出现「№ 01」式自编号**。
- **令牌**：`--bg`（纸白）、`--fg`（钴蓝，全页唯一墨）、`--ink-14 / --ink-20 / --ink-70 / --ink-78 / --ink-82`；写法可沿用 `oklch(0.449 0.182 265 / a)` 或 hex + alpha。面板一律 2px 墨线勾勒、纸白填充，**不做填充色区分**。
- **版式**：kicker 12px、字距 .42em、墨 .78，**全页至多 1 个**；大标题 clamp(38px, 3.6vw, 58px)，Noto Serif SC 900；正文 16px / line-height 2.0 / 墨 .82 / 列宽上限 26em；图注 11.5px、字距 .2em、.78，配 1px 细线。display 对最小功能字（11.5px 图注）≥5 倍：桌面 58/11.5=5.04 过线；**移动端裁定：维持 clamp 38px 下限，并在末尾设计说明里写明「clamp 下限档豁免」**。
- **SVG 图解**：2px 描边、纸白填充、rx 10 圆角积木（或刻度块）立于墨 .14 基座条上；关系线 1.6px、墨 .70、端点小三角箭头。图表数值标签用 IBM Plex Mono。
- **无障碍 / 响应式**：`:focus-visible` 2px 墨色外框；满高用 `min-height:100dvh`，禁 `h-screen`；视口 <960px 塌单栏（页边距 14px），375/768/1280/1440 四档禁止横向滚动。
- **可靠度徽标**（挂小节，印刷隐喻三级，全部单墨、无圆点）：实印 = 墨底纸字（7.483:1 过线）；网屏 = 纸底、.78 文字、1px 实线边框（.20）；细线 = 纸底、.78 文字、仅下缘 1px 细线。三级文案：「论文原文核实」「合理解读」「转引未核实」。**每节至多一枚**。
- 本页浅色交付即可，不做深色变体。整体密度档 3，图表节局部可到 4-5。

## 3. 页面结构与内容（archival plate 图版式）

版式族：**archival plate**（题注 + 多栏图版说明）。全页竖排：报头 → 节 0 引言 → 节 1 图版（图 01）→ 节 2 勘察要点卡 → 节 3 图版（图 02 时间线）→ 带走物槽位 → 页脚 → 设计说明。节与节之间大留白或 1px 分隔线，各节布局族不重样，全部元素居中是失败形态；桌面 1280px 内容区建议最宽 1080px，留白 25%~50%。

### 节 0 · 引言（左对齐，文案列约 40%宽）
- kicker（全页唯一）：`实录 · 勘察与案例`
- 大标题（Serif 900）：`论文说的数字，我们去仓库数了一遍`
- 副文（正文档，.82）：`2026-10-01，我们沿 GitHub API 与 raw 文档勘察了 deepseek-ai/deepseek-harness。仓库存在而且活跃，README 写明由 Cordis 驱动。本页数字逐条注明来源，读不到的地方如实标注。`

### 节 1 · 图版 图 01：Koishi 生态数字（本页 focal event）
- 小节题：`图 01`（mono 功能编号）+ 题名 `Koishi 生态：四年攒下 4000+ 插件` + 徽标「论文原文核实」（实印）。
- 图表（内联 SVG，**lieflat-charts G18「Draw-in + Counter」风格复刻**，不引入 lieflat 运行时，单墨）：
  - **计数器三枚**（IBM Plex Mono 大数字，进视口 count-up 显影）：
    1. `4,000+` 社区插件（论文第 69 页）
    2. `6,239` GitHub star（2026-10-01 勘察值）
    3. `0` 对照实验（论文第 70 页自述局限：单一生态、单一语言 TypeScript、观察性证明、无对照实验、性能未量化）
  - **横向条形一组**（Draw-in，画一遍即停）：三仓 star 线性同尺对比，Koishi 6,239 / Cordis 8,938 / dsh 241,568；dsh 条满宽，量级差即论点（dsh 创建七周 vs Koishi 五年）。每条左端仓名、条端 mono 数值；条形是表意图形，用墨 1.0 或 .70（≥3:1），基线与网格用 .14/.20 装饰档。
- **题注**（11.5px 图注档，上缘 1px 细线）：`数据转引自论文 arXiv:2608.25512 第 69 页 · star 数为 GitHub API 2026-10-01 勘察值`（此行只含这一个中点）。
- 脚注小字（.78）：`Koishi 官网自称 3000+ 插件（转引未核实），本图以论文口径为准。论文脚注注明 Koishi 现用 Cordis v3，论文讲 v4，核心组合模型两个版本一致。`

### 节 2 · dsh 仓库勘察要点卡（两列锯齿，禁三等分卡阵）
- 小节题：`仓库勘察六要点` + 徽标「合理解读」（网屏）。
- **六张卡**，2px 墨线勾勒、纸白填充，两列锯齿（CSS columns 或 grid 两列，内容长短不齐、高差明显，禁止等高等宽三栏）；每卡 = 功能编号（mono，.80）+ 标题（Serif 700）+ 正文（.82）+ 出处小字（.78）。文案如下，可直接用：

  - **01 存在且活跃**：2026-08-13 创建，勘察日 241,568 star、28,999 fork；最近五条提交全部落在 2026-09-29 当天，其中一条是 `release(dsh): 0.2.0-rc.2`，PR 编号已到 #5479。出处：GitHub API 元数据与提交记录。
  - **02 一切皆插件**：官方自述「Everything is a Plugin.」模型适配器、工具注册表、会话日志、agent 循环本身都是插件，都能通过配置替换；扩展就是在别的插件旁边挂一个新插件，没有特权核心需要打补丁。出处：README 原文。
  - **03 整体收编 Cordis**：`vendor/` 目录把 Cordis 连同 loader、hmr、schemastery、cosmokit 等共 9 个目录整个内置进仓库，不靠外部版本漂移。出处：根目录与 vendor 目录清单。
  - **04 文档密度罕见**：`docs/` 下 60 余篇文档中英双语成对，architecture、cordis-primer、glossary、capability-seams 分门别类。出处：docs 目录清单。
  - **05 三层组装**：Profile 定配方，Bundle 在 package.json 里自我声明，Patch 按 id 把任何一行打印出来的配置顶掉；想改哪块写个补丁即可，不用 fork 整个产品。出处：docs/architecture.md（大白话转述）。
  - **06 预览版警告**：developer preview，README 用大写警告 `THERE WILL BE COMPATIBILITY-BREAKING CHANGES`；star 热度不等于 API 稳定。出处：README 原文。

### 节 3 · 图版 图 02：演化时间线（Cordis → Koishi → dsh）
- 小节题：`图 02` + 题名 `从元框架到 agent 地基` + 徽标「合理解读」（细线）。
- 内联 SVG 水平时间线：一条 1.6px 墨线（.70）横贯，四个节点（2px 描边刻度块立于 .14 细基座上）；每节点下方三行：日期（IBM Plex Mono）、名称（Serif 700）、一行小字（.78）。节点内容：
  1. `2019-12` Koishi 创建：跨平台聊天机器人框架（GitHub API）
  2. `2022-05` Cordis 仓库创建：自述「时空可组合性元框架」（GitHub API）
  3. `2026-08` 论文与 dsh：arXiv:2608.25512 挂出，dsh 8 月 13 日开源（arXiv 与 GitHub API）
  4. `2026-09` dsh 持续高热：`0.2.0-rc.2` 发布，PR #5479（GitHub API）
- 时间线下方一句注（正文档）：`Koishi 先跑了四五年，证明这套范式养得起三千插件的生态；然后 dsh 把 Cordis 整个搬进仓库，拿它做 agent 框架的地基。`
- <960px 时改为纵向时间线（线竖走、节点左对齐），仍禁横向滚动。

### 带走物槽位（页脚上方，只占位）
一条 1px 虚线边框的扁条（高约 44px），内放 .78 小字：`带走物槽位 · 形态与内容由 M3 定，本页仅预留`。

### 页脚（release zone，零动效）
- 左：`deepseek-harness / Cordis 支撑框架`
- 右：`数据快照 2026-10-01 · 图表风格 lieflat-charts G18，PolyForm Noncommercial 许可随附并保留署名`（此行只含这一个中点）

### 设计说明（正文末尾，页面可见，一段或四个短行）
配色 / 字体 / 构图 / 动效分镜各一两句；**并写明「移动端 display 维持 clamp 38px 下限，clamp 下限档豁免」**。

## 4. 动效分镜（页级强度 4：图表画一遍后静止）

- 预算：只有进视口一次性显影，禁钉住、禁滚动擦洗、禁循环、禁视差；只动 transform / opacity，60fps。触发用 IntersectionObserver（once）或 ScrollTrigger `once:true`。
- **focal event（全页唯一大动作）**：图 01 进视口时，三枚计数器 count-up（约 1.2s ease-out，千分位逗号格式；`0` 那枚直接淡入即可），条形自零宽度依次生长（约 0.8s，间隔 120ms）；**画完后完全静止供阅读**。
- 其余节：勘察卡 stagger 轻入场（60ms 间隔、位移 ≤12px、一次性上浮）；时间线整节一次轻显影（透明度淡入即可，节点不逐个动画）；引言节随载入淡入。
- **release zone：页脚、带走物槽位与全部题注区，零动效。**
- `prefers-reduced-motion`：计数器与条形直出终态，列表无位移，全部内容立即可读。
- 动效实现不限库：原生 CSS transition / animation 或内联 JS 皆可，保持单文件自足。

## 5. 禁令与自检（交付前逐条过）

1. `grep "—|–"`：**零命中**（含 `<title>`、alt、按钮文案；连字符 `-` 与负号除外）。
2. `grep -i "scroll to explore|linear-gradient|backdrop-filter|blur\(|#000000|h-screen"`：零命中。
3. **中点限流**：任何渲染行 `·` 至多 1 个，禁止「foo · bar · baz」串联。
4. 无三等分卡片阵列（勘察卡是两列锯齿、高差不齐）；无装饰性状态圆点；kicker 全页 1 个；无「№」式自编号（图号、卡号是功能编号，豁免）。
5. 数字核对：页面每个数字都能在第 3、6 节找到原文；素材之外的推算数（倍数、合计）不得出现。
6. 单色相：全文色值只允许 `#FAFAF7`、`#2148B8` 及其 alpha 阶梯（含 oklch 写法）；纯黑、中性灰、第二色相禁。
7. 响应式：375 / 768 / 1280 / 1444 四档无横向滚动；<960px 塌单栏。
8. `<title>` 建议：`实录 · 勘察与案例 | Cordis 思想图鉴`（竖线分隔，禁破折号）。
9. `:focus-visible` 样式存在；满高用 `min-height:100dvh`。

## 6. 素材出处（核对用，全部实读自勘察记录）

- 勘察时间与方法：2026-10-01，GitHub API + raw.githubusercontent.com，读不到的地方如实标注。
- dsh（deepseek-ai/deepseek-harness）：TypeScript、MIT；star 241,568 / fork 28,999；创建 2026-08-13；最近推送 2026-09-29；最近 5 条提交全在 2026-09-29 当天，含 `release(dsh): 0.2.0-rc.2`，PR #5479；developer preview + 大写兼容性警告；`npx @deepseek-ai/dsh web` 本地 3080 端口；根目录 14 目录 46 文件；packages/ 55 包；apps/ 4 入口；vendor/ 9 目录（cordis、loader、hmr、schemastery、cosmokit 等）；docs/ 60 余篇中英双语。
- Cordis（cordiverse/cordis）：TypeScript、MIT、8,938 star、2022-05 创建、2026-09 仍有推送，自述「时空可组合性元框架」，API 尚不稳定。
- Koishi（koishijs/koishi）：TypeScript、MIT、6,239 star、2019-12 创建、2026-08 仍在推送，官网 koishi.chat，官网自称 3000+ 插件；依赖链验证：koishi → @koishijs/core 4.18.11 → `cordis: ^4.6.0`。
- 论文：*A Programming Paradigm for Spatiotemporal Composability*，arXiv:2608.25512，作者 Yifan Shi、Wei Zhang、Tianyi Cui（2026）。第 69 页：Koishi 四年攒下 4000 多个社区插件；脚注：Koishi 现用 Cordis v3，论文讲 v4，核心组合模型一致。第 70 页：证据来自单一生态、单一语言 TypeScript，属观察性证明，无对照实验，性能开销未量化。
- 结论句（时间线下方注的依据）：Cordis 这套理论先在 Koishi 上跑了四五年、养出三千插件的生态，然后才被拿来做 agent 框架的地基；Koishi 用五年证明范式养得起大生态，比 dsh 七周 24 万星更有参考价值。

## 7. 交付要求

- 单文件 HTML，UTF-8，`lang="zh-CN"`。
- Google Fonts 一条 link：`Noto+Serif+SC:wght@600;900` + `Noto+Sans+SC:wght@400;500;700` + `IBM+Plex+Mono:wght@400;500`。
- 图表与时间线全部内联 SVG（SVG+HTML 混排亦可），不引外部图片。
- 文件名建议 `field-notes.html`，放在本 brief 同目录。
- 可沿用小样的 `data-od-id` 标注习惯，非强制。
