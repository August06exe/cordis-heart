import type { APIRoute } from 'astro';
import { SITE_PAGES, SITE_WORDMARK, SITE_SUBTITLE, PREVIEW_BANNER, ogKey } from '../../data/site';

/**
 * OG 图端点：每页一张 /og/<slug>.svg（首页为 /og/index.svg）。
 * 技术方案取「简化 SVG」（任务允许项，M6 可升级 satori+resvg 出 PNG）：
 * 零依赖、构建期静态产出。单墨令牌用 hex 定值：纸白 #FAFAF7、钴蓝 #2148B8
 * （均为 catalog 原值，见 10-docs/11-深色令牌定案.md 第 4 节）。
 */

export function getStaticPaths() {
  return SITE_PAGES.map((page) => ({ params: { slug: ogKey(page.slug) } }));
}

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = ({ params }) => {
  const key = params.slug ?? 'index';
  const page = SITE_PAGES.find((candidate) => ogKey(candidate.slug) === key);
  if (!page) return new Response('Not found', { status: 404 });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FAFAF7"/>
  <rect x="22" y="22" width="1156" height="586" fill="none" stroke="#2148B8" stroke-opacity="0.2"/>
  <text x="70" y="126" font-family="'Noto Serif SC',serif" font-weight="900" font-size="34" letter-spacing="12" fill="#2148B8">${esc(SITE_WORDMARK)}</text>
  <text x="70" y="172" font-family="'Noto Sans SC',sans-serif" font-weight="500" font-size="20" letter-spacing="6" fill="#2148B8" fill-opacity="0.78">${esc(SITE_SUBTITLE)}</text>
  <text x="70" y="356" font-family="'Noto Serif SC',serif" font-weight="900" font-size="52" fill="#2148B8">${esc(page.title)}</text>
  <line x1="70" y1="498" x2="1130" y2="498" stroke="#2148B8" stroke-opacity="0.2"/>
  <text x="70" y="546" font-family="'Noto Sans SC',sans-serif" font-size="18" letter-spacing="3" fill="#2148B8" fill-opacity="0.78">${esc(PREVIEW_BANNER)}</text>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
