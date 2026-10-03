/**
 * 词典页文稿构建期解析器（只在页面 frontmatter 执行，不进客户端包）。
 *
 * 唯一输入：src/content/pages/glossary.md（内容集合 pages，slug glossary）。
 * 原则：文案一字不改。本模块只做结构切分与行内标记的最小 HTML 化：
 *   `code` 行内码、**加粗**、【解读】/【转引】标注包一层 .mark（文字原样保留）。
 * 新声音结构（2026-10-02 同步）：
 *   正文首个 `# ` 行是页题（本页 h1）；导语其余行为副文一段；
 *   每张术语卡恰好三段（一句话 / 一个类比 / 落到你的项目里，段序即段名，
 *   段名用词出自导语那行，卡上标签不新造词）；
 *   「还有几个词（快查）」为 `- ` 词条列表；
 *   「可带走物」节为提示词代码块 + 一条站内跳转链接；
 *   `---` 之后是页尾快照行。
 * 结构对不上时在构建期直接抛错，绝不静默丢文案。
 */

export interface GlossaryCardData {
  /** 条目号，如 "01" */
  n: string;
  /** 中文术语 */
  zh: string;
  /** 英文术语，可能为空（如 03 累加器、12 声明式配置、14 生命周期） */
  en: string;
  /** 第一段：一句话 */
  defHtml: string;
  /** 第二段：一个类比 */
  analogyHtml: string;
  /** 第三段：落到你的项目里 */
  sourceHtml: string;
}

export interface GlossaryQuickData {
  heading: string;
  /** 各词条已行内化（词条内 **术语**：释义） */
  termsHtml: string[];
}

export interface GlossaryOuttakeData {
  /** 节标题全文，如「可带走物 · 让 AI 跟你说同一种话」 */
  heading: string;
  /** 提示词代码块原文（未做任何替换） */
  code: string;
  /** 尾部跳转链接文案与地址（来自文稿 Markdown 链接行） */
  nextLabel: string;
  nextHref: string;
}

export interface GlossaryPageData {
  /** 文稿正文一级标题（本页 h1 文字） */
  headline: string;
  /** 导语段（一级标题之后、第一节之前） */
  subHtml: string;
  cards: GlossaryCardData[];
  quick: GlossaryQuickData;
  outtake: GlossaryOuttakeData;
  /** 页尾快照行 */
  coda: string;
  /** frontmatter badges 行的计数与行内标注说明 */
  counts: { l1: number; l2: number; l3: number; note: string };
}

/** 行内标记最小 HTML 化：先转义，再放行 code / strong / 可靠度行内标注（文字不动） */
export function inlineMd(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/【(解读|转引)】/g, '<span class="mark">【$1】</span>');
}

function fail(msg: string): never {
  throw new Error(`glossary 文稿结构异常：${msg}`);
}

interface Section {
  heading: string;
  lines: string[];
}

function splitSections(body: string): {
  headline: string;
  intro: string[];
  sections: Section[];
  coda: string;
} {
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let headline = '';
  const intro: string[] = [];
  const sections: Section[] = [];
  const coda: string[] = [];
  let current: Section | null = null;
  let inCoda = false;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (/^-{3,}\s*$/.test(line)) {
      current = null;
      inCoda = true;
      continue;
    }
    if (line.startsWith('# ')) {
      if (headline || current || inCoda) fail(`一级标题只能出现在正文开头：${line}`);
      headline = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (inCoda) {
      if (line.trim()) coda.push(line.trim());
      continue;
    }
    if (current) current.lines.push(line);
    else intro.push(line);
  }
  if (!headline) fail('文稿缺一级标题（# 页题）');
  return { headline, intro, sections, coda: coda.join('\n') };
}

/** 术语卡：标题给编号与术语名，正文两到三段，段序固定（一句话 / 类比 / 项目） */
function parseCard(sec: Section): GlossaryCardData {
  const headM = sec.heading.match(/^(\d{2}) · (.+)$/);
  if (!headM) fail(`术语卡标题格式不对：${sec.heading}`);
  const n = headM[1];
  const nameM = headM[2].match(/^(.+?)(?:（(.+)）)?$/u);
  if (!nameM) fail(`术语名解析失败：${headM[2]}`);
  const zh = nameM[1].trim();
  const en = (nameM[2] ?? '').trim();

  const paras = sec.lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (paras.length < 2 || paras.length > 3) {
    fail(`术语卡 ${n} 段数不在 2~3（一句话 / 类比 [/ 项目]）：${paras.length}`);
  }
  const [def, analogy, source = ''] = paras;
  if (def.startsWith('>') || analogy.startsWith('>') || source.startsWith('>')) {
    fail(`术语卡 ${n} 出现引文行：新声音文稿术语卡不含可靠度引文`);
  }
  return {
    n,
    zh,
    en,
    defHtml: inlineMd(def),
    analogyHtml: inlineMd(analogy),
    sourceHtml: inlineMd(source),
  };
}

function parseQuick(sec: Section): GlossaryQuickData {
  if (sec.heading !== '还有几个词（快查）') fail(`快查小节标题不对：${sec.heading}`);
  const terms: string[] = [];
  for (const raw of sec.lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('- ')) {
      terms.push(inlineMd(line.slice(2).trim()));
      continue;
    }
    fail(`快查小节出现无法归属的行：${line.slice(0, 24)}`);
  }
  if (terms.length === 0) fail('快查小节没有词条');
  return { heading: sec.heading, termsHtml: terms };
}

function parseOuttake(sec: Section): GlossaryOuttakeData {
  if (!sec.heading.startsWith('可带走物')) fail(`可带走物小节标题不对：${sec.heading}`);
  const codeLines: string[] = [];
  let linkLine = '';
  let inCode = false;
  let sawFence = false;
  for (const raw of sec.lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() && !inCode) continue;
    if (/^```/.test(line.trim())) {
      inCode = !inCode;
      sawFence = true;
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (line.trim()) {
      if (linkLine) fail(`可带走物小节出现多余正文行：${line.slice(0, 24)}`);
      linkLine = line.trim();
    }
  }
  if (!sawFence || codeLines.length === 0) fail('可带走物小节缺提示词代码块');
  const linkM = linkLine.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (!linkM) fail(`可带走物小节尾部链接行格式不对：${linkLine}`);
  return {
    heading: sec.heading,
    code: codeLines.join('\n'),
    nextLabel: linkM[1],
    nextHref: linkM[2],
  };
}

export function parseCounts(badges: string): { l1: number; l2: number; l3: number; note: string } {
  const m = badges.trim().match(/^原文核实 (\d+) ｜ 合理解读 (\d+) ｜ 转引未核实 (\d+)（(.+)）$/u);
  if (!m) fail(`badges frontmatter 格式不对：${badges}`);
  return { l1: Number(m[1]), l2: Number(m[2]), l3: Number(m[3]), note: m[4] };
}

export function parseGlossary(body: string, badges: string | undefined): GlossaryPageData {
  // badges 由调用方从 content schema 取（astro 生成类型偶发带可选性），运行时防线在 parseCounts 的格式校验
  const { headline, intro, sections, coda } = splitSections(body);

  const subLines = intro.map((l) => l.trim()).filter((l) => l.length > 0);
  if (subLines.length === 0) fail('导语缺副文段');

  const cards: GlossaryCardData[] = [];
  let quick: GlossaryQuickData | null = null;
  let outtake: GlossaryOuttakeData | null = null;
  for (const sec of sections) {
    if (/^\d{2} · /.test(sec.heading)) cards.push(parseCard(sec));
    else if (sec.heading === '还有几个词（快查）') quick = parseQuick(sec);
    else if (sec.heading.startsWith('可带走物')) outtake = parseOuttake(sec);
    else fail(`未知小节：${sec.heading}`);
  }
  if (cards.length === 0) fail('一张术语卡都没解析到');
  if (!quick) fail('缺「还有几个词（快查）」小节');
  if (!outtake) fail('缺「可带走物」小节');
  if (!coda) fail('缺页尾快照行');

  return {
    headline,
    subHtml: inlineMd(subLines.join('\n')),
    cards,
    quick,
    outtake,
    coda,
    counts: parseCounts(badges ?? ''),
  };
}
