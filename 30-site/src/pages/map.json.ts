import type { APIRoute } from 'astro';
import { SITE_PAGES } from '../data/site';

/**
 * /map.json：知识库地图的静态输出，供 AI Agent 直接取用。
 * 数据来自 20-content/00-MAP.md 的要点手工结构化（读法、文件清单、按问题找文件、
 * 可靠度说明），site 段是本站九页的导航表（数据源 src/data/site.ts）。
 */

interface MapFile { name: string; size: string; summary: string }
interface MapRoute { question: string; where: string }

const FILES: MapFile[] = [
  { name: 'Cordis与deepseek-harness研读总览.md', size: '35KB', summary: '总入口：一页纸总览、通俗词典（10+ 术语）、5 个核心思想、论文与仓库的对应、15 条可借鉴清单、边界与代价、存疑问题与答读者问' },
  { name: '素材/00-仓库勘察.md', size: '17KB', summary: 'dsh 仓库实勘：定位、目录结构、55 个包、核心机制（读自其 architecture.md）、与论文的对应关系、给借鉴者的三句话，附原始链接' },
  { name: '素材/01-动机与全景.md', size: '12KB', summary: '论文第 1~9 页：为什么要做这项研究，VSCode 插件系统的两个真实局限，自进化 Agent harness 为什么更急，effect/coeffect 的预备知识' },
  { name: '素材/02-两大核心机制.md', size: '10KB', summary: '论文第 9~21 页：可逆效应（每个操作自带撤销函数、运行时自动追踪恢复）与响应式反效应（组件声明依赖、断供自动歇业），全文最核心的两个机制' },
  { name: '素材/03-统一语境与独立性.md', size: '9KB', summary: '论文第 21~31 页：为什么一切交互都要经过同一个「语境」对象，观察等价，两个组件互不干扰需要什么条件（交换性）' },
  { name: '素材/04-演算与保证.md', size: '10KB', summary: '论文第 31~56 页：组件/纤维/注册表三个对象，九条生命周期规则，四大保证各自向使用者承诺什么，四个扩展（异步、失败、隔离、配置修订）' },
  { name: '素材/05-实现与案例.md', size: '10KB', summary: '论文第 57~70 页：Cordis 实际用起来什么样（五个核心动作、声明式配置、HMR 三阶段），Koishi 4000+ 插件生态的实测' },
  { name: '素材/06-讨论与启示.md', size: '11KB', summary: '论文第 70~83 页：什么能撤销什么不能，服务多路复用与滚动更新，能力型访问控制，换语言需要什么，与 React/OSGi/依赖注入框架的本质区别' },
];

const READING_ORDER: string[] = [
  '先读本地图（本文件）',
  '再读 Cordis与deepseek-harness研读总览.md（35KB，全部核心内容都在里面，多数问题读它就够）',
  '需要某一板块的细节时，再去读对应的素材文件',
];

const BY_QUESTION: MapRoute[] = [
  { question: '这套东西整体是什么、值得懂吗', where: '总览第一节，或 01 的开头' },
  { question: '某个术语（effect、coeffect、fiber、HMR 等）什么意思', where: '总览第二节词典' },
  { question: '论文为什么存在，现实痛点是什么', where: '01；更细的 VSCode 统计也在 01' },
  { question: '撤销机制、依赖断供自动停机怎么运作', where: '02' },
  { question: '为什么所有交互都走同一个语境、组件间怎么做到互不干扰', where: '03' },
  { question: '卸载一个组件为什么不会弄坏别的组件、系统有什么承诺', where: '04' },
  { question: '插件/组件实际怎么写、热更新怎么做的', where: '05' },
  { question: '能借鉴到我自己开源项目里的具体做法', where: '总览第五节；想看理由和出处再读 06' },
  { question: '什么时候不该用这套思想', where: '总览第六节' },
  { question: '和 React、OSGi、DI 框架、动态软件更新的区别', where: '06 第三节' },
  { question: '仓库结构、论文概念对应哪个包', where: '00（注意其可靠度说明）' },
  { question: '哪些结论还没坐实', where: '总览第七、八节，及各素材末尾的存疑记录' },
];

const RELIABILITY_CAVEATS: string[] = [
  '论文概念到 dsh 代码的映射表是研读员的解读，只核对到目录和架构文档深度，源码未逐行确认',
  '「fiber」一词在 dsh 文档里没有出现，dsh 用 per-agent scope 承担隔离职责，两者关系未定',
  '全部数学证明按计划跳过，四大保证的表述取自定理陈述与论文自己的解释',
  'VSCode 扩展统计（87/100、7/100）、Koishi 4000+ 插件等数字转引自论文脚注，未独立核实',
  'dsh 自曝 developer preview、接口可能有破坏性变更，其 API 形态描述有时效风险',
];

export const GET: APIRoute = () => {
  const map = {
    title: 'Cordis 与 deepseek-harness 知识库地图',
    about: '关于论文《A Programming Paradigm for Spatiotemporal Composability》（arXiv:2608.25512，下称「论文」）和 deepseek-ai/deepseek-harness 仓库（下称 dsh）的通俗研读库。写给人看，也写给 AI Agent 用。',
    snapshot: '2026-10-01',
    paper: { arxiv: '2608.25512', pages: 92 },
    stats: { files: 8, totalSize: '约 115KB（约 4 万字符）', contextFit: '128k 上下文可以整包装入' },
    readingOrder: READING_ORDER,
    files: FILES,
    byQuestion: BY_QUESTION,
    reliability: {
      note: '各素材正文都是照论文原文或仓库文档写的，可以放心引用。以下内容是推断或转引，引用时请带上存疑标注：',
      caveats: RELIABILITY_CAVEATS,
    },
    site: {
      note: '本站把上述知识库整理成九页图文，导航如下',
      pages: SITE_PAGES.map((page) => ({ slug: page.slug, path: page.path, title: page.title })),
    },
  };

  return new Response(JSON.stringify(map, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
