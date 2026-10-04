export interface Chapter {
  no: string;
  slug: string;
  short: string;
  title: string;
  part: 'A' | 'B' | 'C' | 'X';
  minutes: number;
  icon: string;
  blurb: string;
}

export const PARTS: Record<Chapter['part'], string> = {
  A: '上篇 · 来龙去脉',
  B: '中篇 · 拆开论文',
  C: '下篇 · 拿去用',
  X: '附录',
};

export const PAPER_URL = 'https://arxiv.org/abs/2608.25512';
export const DSH_URL = 'https://github.com/deepseek-ai/deepseek-harness';
export const CORDIS_URL = 'https://github.com/cordiverse/cordis';
export const KOISHI_URL = 'https://github.com/koishijs/koishi';
export const SNAPSHOT = '2026-10';

const card = (n: string) => `/images/web/cards/${n}.jpg`;

export const CHAPTERS: Chapter[] = [
  { no: '01', slug: 'origin', short: '由来', part: 'A', minutes: 5, icon: card('field-notes-card1'),
    title: '一颗跑了快七年的心脏',
    blurb: 'dsh 七周 24 万 star，它的地基却是 2019 年一个聊天机器人框架里长出来的。' },
  { no: '02', slug: 'problem', short: '问题', part: 'A', minutes: 6, icon: card('why-card1'),
    title: '换个灯泡，为什么要拉整栋楼的电闸',
    blurb: 'VSCode 前 100 个扩展里，87 个卸载要重启。等 AI 开始自己改自己，这会变成灾难。' },
  { no: '03', slug: 'paper', short: '一页纸', part: 'A', minutes: 5, icon: card('open-questions-card2'),
    title: '92 页论文，压成一页',
    blurb: '赶时间就只读这一章：一句话、两道考题、三句口诀、五张字据。' },
  { no: '04', slug: 'undo', short: '思想一 · 回执', part: 'B', minutes: 8, icon: card('ideas-card2'),
    title: '每个改动，当场交出撤销办法',
    blurb: '做一件事留一张回执，卸载时倒着撕，一张不落。' },
  { no: '05', slug: 'deps', short: '思想二 · 插座', part: 'B', minutes: 8, icon: card('glossary-card1'),
    title: '缺了就歇着，齐了就上岗',
    blurb: '进门先交需求清单。断供自动歇业，来电自动开张，没人需要盯着电闸。' },
  { no: '06', slug: 'context', short: '思想三 · 一扇门', part: 'B', minutes: 8, icon: card('glossary-card2'),
    title: '所有事，都走同一扇门',
    blurb: '门外的状态没人管。接口少承诺一点，就多一批可以乱序的操作。' },
  { no: '07', slug: 'lifecycle', short: '思想四 · 一生', part: 'B', minutes: 8, icon: card('why-card2'),
    title: '乱按也不怕：一个组件的一生',
    blurb: '人只下三道命令，其余自动流转。中间怎么折腾，结局只看最终配置。' },
  { no: '08', slug: 'cordis-dsh', short: '思想五 · 落地', part: 'B', minutes: 7, icon: card('ideas-card1'),
    title: '从论文到 24 万 star',
    blurb: 'Cordis 的五个动作、Koishi 四千插件的证据、dsh 墙上那一排插座。' },
  { no: '09', slug: 'steal', short: '抄作业', part: 'C', minutes: 5, icon: card('steal-this-card2'),
    title: '十五招，勾走你要的',
    blurb: '勾选、复制、发给你的 AI 编程搭档。一行代码都不用写。' },
  { no: '10', slug: 'limits', short: '边界', part: 'C', minutes: 5, icon: card('limits-card1'),
    title: '什么时候别用它',
    blurb: '最大的成本叫纪律。动手之前，先答五个问题。' },
  { no: '附', slug: 'terms', short: '术语表', part: 'X', minutes: 3, icon: card('open-questions-card1'),
    title: '术语表',
    blurb: '全书出现的词，一句话一个，标明在哪一章讲透。' },
];

export const href = (slug: string) => `/${slug}/`;

export function neighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return { prev: i > 0 ? CHAPTERS[i - 1] : undefined, next: CHAPTERS[i + 1], current: CHAPTERS[i] };
}
