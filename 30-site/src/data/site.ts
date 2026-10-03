/**
 * 全站共享数据：站名、九页导航、时效声明。
 * 页面 slug 与 30-site/src/content/pages/*.md 的 frontmatter 一一对应；
 * 导航短标与 folio 章节名是全站报头与导航的唯一数据源（页面实现员从这里取，不再自备）。
 */

export interface SitePage {
  /** 内容集合 slug，与 frontmatter slug 一致；首页为 "/" */
  slug: string;
  /** 路由路径 */
  path: string;
  /** 导航短标 */
  nav: string;
  /** 页面全称，与 frontmatter title 一致 */
  title: string;
  /** 报头右侧 folio 章节名（首页与沙盒取自文稿报头段，其余取页题） */
  folio: string;
}

export const SITE_WORDMARK = 'CORDIS';
export const SITE_SUBTITLE = 'DSH 的心脏 · 思想图鉴';
export const SNAPSHOT = '2026-10';
/** 页脚时效声明横幅，措辞出自 30-site/content index.md 页脚段（PRD 第 7 节要求） */
export const PREVIEW_BANNER = 'dsh 为 developer preview，快照 2026-10。';

export const SITE_PAGES: SitePage[] = [
  { slug: '/', path: '/', nav: '开篇', title: 'DSH 的心脏 · Cordis 思想图鉴', folio: '图鉴开篇' },
  { slug: 'why', path: '/why/', nav: '序章', title: '序章 · 为什么', folio: '序章 · 为什么' },
  { slug: 'glossary', path: '/glossary/', nav: '词典', title: '术语图鉴', folio: '词典 · 术语卡' },
  { slug: 'ideas', path: '/ideas/', nav: '思想', title: '五个核心思想', folio: '五个核心思想' },
  { slug: 'sandbox', path: '/sandbox/', nav: '沙盒', title: '组件沙盒', folio: 'SANDBOX · 组件工作台' },
  { slug: 'field-notes', path: '/field-notes/', nav: '实录', title: '实录 · 勘察与案例', folio: '实录 · 勘察与案例' },
  { slug: 'steal-this', path: '/steal-this/', nav: '借鉴', title: '借鉴清单：十五条思想，勾走你要的', folio: '借鉴清单' },
  { slug: 'limits', path: '/limits/', nav: '边界', title: '边界与代价', folio: '边界与代价' },
];

/** OG 图文件名约定：首页 slug 为 "index"，其余取 slug */
export function ogKey(slug: string): string {
  return slug === '/' || slug === '' ? 'index' : slug.replace(/^\/+|\/+$/g, '');
}
