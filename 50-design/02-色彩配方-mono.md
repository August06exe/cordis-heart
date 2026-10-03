# 整站色彩配方：钴蓝单墨 on 纸白

mono-color 技能（commit `c8ff705`，2026-09-02）校验结论：既定方向的两个 HEX 都是 catalog 原值。`#2148B8` 就是 `ink_cobalt`（design-system/colors.json:18），`#FAFAF7` 就是 `substrate_neutral_white`（colors.json:4），一个字都不用改。单墨模式在技能里有明确的许可路径（SKILL.md:76）：用户显式指定单墨或单一具名墨色时切换 pure one-ink，本方向符合。swatch 文件 `swatches/cobalt.svg` 内也只含 `#2148B8`，与 catalog 一致。

本文按技能流程（Input Reading → Recipe Manifest → catalog 逐项解析 → Prompt Compiler）产出整站配方。深色主题在 catalog 里没有对应物，相关色值全部由墨纸对调推导，逐处标注。所有对比度为本机实算（WCAG 相对亮度公式，Node 脚本，见文末复现命令）。

## 安装与校验依据

```
git clone --depth 1 https://github.com/yanliudesign/mono-color-skill C:/Users/itx/.zcode/skills/mono-color
```

安装位置 `C:/Users/itx/.zcode/skills/mono-color`，HEAD = `c8ff70597ddedcd65f21a0b528f6a70c35690b0a`。已通读：`SKILL.md`、`design-system/` 全部六个 catalog（colors / typography / rhythm / compositions / carriers / imperfections）、`BOARD-DIRECTION.md`、`swatches/cobalt.svg`。

## 配方卡（Recipe Manifest）

```yaml
subject: DSH 论文笔记整站（知识型阅读站）
intent: field note（观察记录）+ specimen page（论文详情作标本页）
exact_text: 站内中文文案原样保留；生成插图上的自造展示词用英文 2-8 词
text_language: 中文（自造文案 English，SKILL.md:74）
representation: faithful reproduction
ratio: 站内插图 3:4（默认）；OG 分享图见"坑"第 9 条
carrier: carrier_portfolio（站内插图）/ carrier_social_cover（分享图）
substrate: substrate_neutral_white #FAFAF7
mode: pure one-ink
palette: palette_cobalt
inks: ink_cobalt #2148B8
plate_roles: 唯一墨版同时承担图像、标题与细线，靠密度分层（实印 / 网屏 / 细线）
layout: 版式族映射见下节
empty_paper: 35%（页面区间 25%-50%，balanced 档）
visual_tension: balanced
focal_event: 每页恰一个
release_zone: 版心一侧或下缘的整片安静留白
unresolved_edge: none
image_treatment: clean plate separation 或 medium screening
type_hierarchy: 索引页 Programmatic，阅读页 Literary（一致性来自墨、间距与微字排印，typography.json:3）
disruption: 每页一处（偏中图裁切或超大词）
imperfection_seed: db44c934
imperfections: imperfection_ink_density + imperfection_halftone_drift（当代向 0-2 上限内）
```

seed 计算方式：`sha256("dsh-notes|palette_cobalt|substrate_neutral_white")` 前 8 位，对应 imperfections.json:6 的 seed 策略；同一输入固定复用，重试不换。

## 印刷模式

pure one-ink（SKILL.md:130）：一版墨担起图像、标题、细线全部内容，层级只来自密度。技能明确两件事（SKILL.md:101）：密度深的覆盖可以近黑，稀网屏可以发白，两者都算同一墨；纸必须一直露出来，整页铺成单色 wash 是硬性禁止项（SKILL.md:326）。

落到 web 的三条等价规则：

1. hover、边线、分隔线、色块全部用钴蓝的不同浓度，不引入第二色相，也不另起一套中性灰阶（灰会被读成第二墨，见"坑"第 4 条）。
2. 页面上永远保留可见的底色区域，大色块只能作为主对象区出现并露出纸色。
3. 需要复古网点效果时，网点是复制工艺语言，自动附带做旧（黄纸纹、sepia、复古道具）仍属禁止项（SKILL.md:98,330）。

## 油墨与色值

### 浅色主题（默认）

| 角色 | 值 | 对比度（对 #FAFAF7） | 来源 |
| --- | --- | --- | --- |
| 基底（纸） | `#FAFAF7` | - | catalog：substrate_neutral_white，colors.json:4 |
| 墨（主色，标题/链接/强调/插图） | `#2148B8` | 7.48:1 | catalog：ink_cobalt，colors.json:18 |
| 长文正文（墨的近黑浓度） | `#173382` | 10.96:1 | 推导（L=0.30），授权来自 SKILL.md:101"深覆盖可近黑" |
| 极深一档（小字号/极强调） | `#11255f` | 13.81:1 | 推导（L=0.22） |

钴蓝对纸白 7.48:1，同时过 WCAG AA（4.5）与 AAA（7.0），正文可以直接用原值。长文若嫌原值偏亮，降到 `#173382`，仍是同一墨的密度变化，不违反单墨约束。

### 深色主题（待做，全部为推导值）

catalog 的 substrates 只有三种浅纸（colors.json:4-6），没有深色基底。深色主题按技能的墨纸关系对调推导：印刷里墨是深色压在浅纸上，深色主题里正文换成纸色系浅字，钴蓝降级为 accent 版。

| 角色 | 值 | 对比度（对深底） | 说明 |
| --- | --- | --- | --- |
| 基底（暗纸） | `#12151D` | - | 推导。三档候选（#10131B / #12151D / #161A23）中取中间值 |
| 正文 | `#FAFAF7` | 17.45:1 | 即纸色反转用法 |
| 链接 / 正文级 accent | `#6b8be6` | 5.61:1 | 推导（同色相 L=0.66 提亮） |
| 次要文字 | `#a0b4ee` | 8.91:1 | 推导（同色相 L=0.78） |
| 大字号 / UI 状态 accent | `#2058D4` | 2.96:1 | catalog：ink_royal_blue，colors.json:19，技能称其为钴蓝的亮支；对比度只够大字与图形，禁作正文 |

关键事实：钴蓝原值 `#2148B8` 在深底只有 2.33:1，不可作任何文字色（见"坑"第 3 条）。深底三档推导值等技能 catalog 未来补深色基底后应回收替换。

## 留白结构比例

技能数值（SKILL.md:141-146）与 rhythm.json 页面档位：

- 空纸 25%-55%，默认 35%；站点取 balanced 档 25%-50%（rhythm.json:37），因为论文笔记落在它的 default_for（journal / observation / editorial information，rhythm.json:43）。reflective 类长文页可切 relaxed 档（25%-55%）。
- 外边距为页宽的 5%-9%。
- 主对象占 45%-80%；信息密集版式（索引、归档）可降到 32%-55%（SKILL.md:207）。
- 对齐到一条隐形左缘或 2-3 列编辑网格；所有元素居中是被点名的失败形态（SKILL.md:145）。
- 每页恰一处 deliberate disruption：偏中裁切的图、超大词、圆形标记或微型注记任选其一。
- 每页恰一个 release zone，明显比 focal event 安静；留白里不许填装饰性微文案（rhythm.json:58 failure_signals）。

web 映射：正文列约 35-40 个中文字符宽，两侧留白合计 25%-50% 视口；首页 hero 的主对象区不超过 80% 且四周必须露纸；任何一屏的空白低于 25% 就按技能标准判 fail（SKILL.md:341）。

## 版式族与字体搭配

### 版式族映射（compositions.json 九族 → 站点页面）

| 页面 | 版式族 | catalog 行 |
| --- | --- | --- |
| 首页 / 封面 | editorial cover：标题贴边，一个主图区，稀疏期刊式微文案，无假刊头 | compositions.json:9 |
| 笔记阅读页 | editorial journal：主图 + 强标题/日期 + 有纪律的正文栏，标题嵌进阅读节奏 | compositions.json:12 |
| 索引 / 归档 / 标签页 | ruled information poster（细线信息带）或 archival plate（题注 + 多栏图版说明） | compositions.json:7,8 |
| 关于 / 宣言页 | type-led declaration：文案本身即主对象 | compositions.json:6 |

### 字体（typography.json 双轨）

技能规定每页一个主 display 声部加一个功能 support 声部，声部上限 3（SKILL.md:213），字号跳变 5-12 倍（SKILL.md:229）。整站跨页一致性的来源是墨、间距、版逻辑与微字排印，display 骨架允许随内容切换（typography.json:3）。

| 声部 | 角色 | 用在哪 | 比例 | 落地字体建议 |
| --- | --- | --- | --- | --- |
| display A | Programmatic（typography.json:34）：中等 grotesk，日期与数字可做锚点，表格数字 | 索引、归档、任何带编号日期的页面 | 4:1-9:1 | Inter / Noto Sans SC |
| display B | Literary（typography.json:8）：编辑向衬线，小写句式断行，可入图 | 阅读页、长文 | 6:1-12:1 | Source Serif / Noto Serif SC |
| support | mono，表格数字 | 引用、代码、编号、元信息 | 与上文共同构成跳变 | JetBrains Mono / IBM Plex Mono |

字体名是落地建议；catalog 只定义角色与比例，不定字体。中文站注意：display 与正文之间保持 5 倍以上字号跳变，中文 display 用字重与大字号承担，不额外加装饰。

一处 catalog 内部张力要记录：SKILL.md:343 的返工条件要求"5 倍以上字号跳变"，而 Programmatic 角色的比例下限是 4:1（typography.json:38）。站点索引页取 5 倍以上，避开这条边界。

## 钴蓝单墨的坑

按技能方法如实列出，共九条：

1. 单墨是许可路径，但不是技能默认。默认是 controlled two-ink，兜底对为 Cobalt + Terracotta `#2148B8` + `#C65F38`（SKILL.md:76,119；colors.json:44）。将来整站若需要一个带内容职责的强调色（标注、活动状态），第二墨必须先分配 plate role，且优先用这个已批准对，不要临时发明新色。
2. 深色主题没有 catalog 依据。substrates 只有三种浅纸（colors.json:4-6），本文深底四值全部是推导，将来要对账替换。
3. 钴蓝原值在深底不可用：2.33:1，任何文字都不达标。深底 accent 必须换亮度档（Royal Blue 只够大字，正文级 accent 用 `#6b8be6`）。
4. 层级只能靠密度，中性灰阶别另起一套。长文正文用钴蓝近黑浓度 `#173382`；Cool Gray `#E9E9E5` 在 catalog 里是基底不是墨（colors.json:5，`counts_as_ink: false`），把它当文字灰用会被读成第二墨。
5. 别整页铺蓝。monochrome color wash 在 Hard Avoids（SKILL.md:326）；大色块只能当 45%-80% 的主对象区，并让纸色以形状出现在构图内部（SKILL.md:168）。
6. halftone 不等于做旧。未请求复古时禁止黄纸、sepia、褪色边框、怀旧道具（SKILL.md:98,330）。站内插图默认当代编辑向，缺陷效果收在 0-2 处。
7. 空纸低于 25% 直接判 fail（SKILL.md:341）。营销式 hero 是最容易踩线的页面，首屏留白要按比例预留，不是靠感觉。
8. 自造展示词默认英文（SKILL.md:74,232）。站内中文文案原样照排；生成插图上的自造词组用英文 2-8 词，且跨重试保持同一句（SKILL.md:30）。
9. carrier 表没有网页比例。carriers.json 只定义了 3:4 / 2:3 / 4:5 / 1:1 / 4:3 六种，OG 图的 1.91:1 属于 catalog 外延。分享图建议按 carrier_social_cover（3:4，carriers.json:6）生成后再裁，并在 prompt 里声明这是自定义比例。

## gpt-image-2 出图 prompt 要点

按技能 Prompt Compiler（SKILL.md:289-299）写五段，顺序固定：

1. Canvas and ink：比例（站内插图 3:4）；基底写明 `#FAFAF7` 及选它的理由（知识主题、当代编辑向，colors.json:4 的 use_for）；纯单墨 `#2148B8`；单一墨版同时担图像、文字与细线，密度分层；flat front-facing page。
2. Original composition：版式族名、tension = balanced、恰一个 focal event、恰一个 release zone、边距 5%-9% 页宽、空纸百分比（25%-50% 内取值）、网格（左缘或 2-3 列）、主对象 45%-80% 及边缘裁切方式、恰一个手工手势（circled fact、手绘线、registration mark 等单一家族）。
3. Subject：faithful reproduction 的写法是描述保留什么、怎么裁、多大、什么网屏处理、纸色从哪里透出来（SKILL.md:295）。
4. Typography and words：display + utility 双声部；写死那条英文展示短语；明确标题与主对象的交叠、横穿或紧锁关系。
5. Material and avoids：0-2 处缺陷效果并写明范围（uneven ink density 6%-12%、halftone drift 5%-10%，imperfections.json:10-27），再接 Hard Avoids 清单（SKILL.md:320-332）：多于两墨、渐变、neon、vector-flat 数字海报感、居中模板、卡片网格、UI 面板、scrapbook、自动复古、长段落、营销话术、CTA、logo、URL、二维码。

出图纪律：

- 同一主题重试时，palette、layout、百分比、seed 全部锁死，只允许复制层的松动（SKILL.md:87）。
- 文字渲染坏一次之后，改出生成少字底图，排版工具叠字，不假装糊字是对的（SKILL.md:350）。
- 生成后两档自检：全尺寸看缺陷，缩略图看 focal event 是否一眼可辨（SKILL.md:336-338）。返工条件照 SKILL.md:339-349 逐条查：出现第二色、accent 无角色、像数字调色而非物理印刷、空纸越界、主体不识别、无 5 倍字号跳变、长文乱码、安全式左标题右图分栏、release zone 被填满。
- prompt 里不提任何参考图、艺术家、工作室或"in the style of"（SKILL.md:299）。

本会话没有生图能力，且本任务只要 prompt 要点，按技能自身的 prompt-only 分支（SKILL.md:22，无生图能力时停在 prompt）不产图。将来用 gpt-image-2 出图后，补做上面两档自检。

## 复现

```
# 对比度与推导值
node -e "…WCAG 相对亮度 + CR 计算…"
# seed
node -e "console.log(require('crypto').createHash('sha256').update('dsh-notes|palette_cobalt|substrate_neutral_white').digest('hex').slice(0,8))"
# => db44c934
```

对比度结果：`#2148B8`/`#FAFAF7` = 7.48；`#173382`/`#FAFAF7` = 10.96；`#11255f`/`#FAFAF7` = 13.81；`#FAFAF7`/`#12151D` = 17.45；`#6b8be6`/`#12151D` = 5.61；`#a0b4ee`/`#12151D` = 8.91；`#2058D4`/`#12151D` = 2.96；`#2148B8`/`#12151D` = 2.33。
