// why-card2 程序化补绘（r1 回改，2026-10-03）
// 生图通道双故障（本地出口 + apimart 源站），why-card2 无图；本脚本按
// public/images/m47/prompts/why-card2.txt 的确定性描述，以 SVG 程序化补绘
// 同族单墨小卡，再经 sharp 光栅化为 600×600 JPG 落
// public/images/web/cards/why-card2.jpg。与 why-card1.jpg 同族工艺：
// 单墨钴蓝 #2148B8 / 纸白 #FAFAF7 / halftone 网点 / 物体居中偏上 /
// 下缘留白 / 不均匀墨密度（分段透明度 0.92–1.0）+ 轻微网点漂移。
// 用法：node scripts/m47-why-card2.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const INK = '#2148B8';
const PAPER = '#FAFAF7';
const CX = 300, CY = 252, R = 148;           // 环心稍高于卡心，下缘留白
const TAIL_T = -32;                          // 尾端（起点，实墨）
const HEAD_T = 303;                          // 箭头端（顺时针扫 303°）
const rad = (d) => (d * Math.PI) / 180;
const pt = (t, r = R) => [CX + r * Math.cos(rad(t)), CY + r * Math.sin(rad(t))];
const round = (v) => Math.round(v * 10) / 10;

// —— 主环：分四段实墨弧，透明度 0.92–1.0 表现不均匀墨密度 ————————————
const segs = [
  [TAIL_T, 60, 1.0],
  [60, 150, 0.96],
  [150, 230, 0.92],
  [230, HEAD_T, 0.98],
];
const loop = segs
  .map(([a, b, op]) => {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    const large = b - a > 180 ? 1 : 0;
    return `<path d="M ${round(x1)} ${round(y1)} A ${R} ${R} 0 ${large} 1 ${round(x2)} ${round(y2)}" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round" opacity="${op}"/>`;
  })
  .join('\n  ');

// —— 箭头：实心三角，尖指向尾端（回环自衔） ————————————————————————
const [hx, hy] = pt(HEAD_T);
const [tx, ty] = pt(TAIL_T);
let dx = tx - hx, dy = ty - hy;
const gap = Math.hypot(dx, dy);
dx /= gap; dy /= gap;
const px = -dy, py = dx;                     // 垂直方向
const tipLen = 38, halfW = 24;
const arrow = `<path d="M ${round(hx + dx * tipLen)} ${round(hy + dy * tipLen)} L ${round(hx + px * halfW)} ${round(hy + py * halfW)} L ${round(hx - px * halfW)} ${round(hy - py * halfW)} Z" fill="${INK}"/>`;

// —— 箭头尖断成网点：三角尖与尾端之间 3 颗递减网点，将触未触 ————————————
const dots = [
  [11, 3.2, 1.0],
  [17.5, 2.4, 0.92],
  [22.5, 1.7, 0.8],
]
  .map(([d, r, op]) => {
    const x = hx + dx * (tipLen + d), y = hy + dy * (tipLen + d);
    return `<circle cx="${round(x)}" cy="${round(y)}" r="${r}" fill="${INK}" opacity="${op}"/>`;
  })
  .join('\n  ');

// —— 三道尾随短线：箭头身后弧外侧，渐次变淡，示回环正在合拢 ————————————
const ticks = [283, 264, 245]
  .map((t, i) => {
    const [x, y] = pt(t, R + 36);
    const ux = -Math.sin(rad(t)), uy = Math.cos(rad(t));  // 切向（顺时针）
    const len = [22, 19, 16][i];
    return `<line x1="${round(x - ux * len / 2)}" y1="${round(y - uy * len / 2)}" x2="${round(x + ux * len / 2)}" y2="${round(y + uy * len / 2)}" stroke="${INK}" stroke-width="6.5" stroke-linecap="round" opacity="${[0.9, 0.72, 0.55][i]}"/>`;
  })
  .join('\n  ');

// —— 环底内侧墨洼：贴内缘的一排小网点（墨往低处聚） ————————————————————
const pool = [];
for (let t = 62; t <= 118; t += 7) {
  const depth = Math.sin(rad(t - 62) / (2 * Math.PI) * Math.PI); // 0→1→0
  const [x, y] = pt(t, R - 22);
  const r = 1.4 + 2.0 * depth;
  pool.push(`<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" fill="${INK}" opacity="0.75"/>`);
}

// —— 环下淡影：网点渐密渐疏的墨池；x>300 一侧整体偏移 (1.5,1) 表网点漂移 ————
const shadow = [];
for (let row = 0; row < 4; row++) {
  const y = 428 + row * 14;
  const rowScale = [1, 0.78, 0.52, 0.28][row];
  for (let x = 160; x <= 440; x += 14) {
    const f = Math.max(0, 1 - ((x - 300) / 150) ** 2);
    const r = 3.0 * f * rowScale;
    if (r < 0.55) continue;
    const drift = x > 300 ? [1.5, 1] : [0, 0];
    shadow.push(`<circle cx="${round(x + drift[0])}" cy="${round(y + drift[1])}" r="${round(r)}" fill="${INK}" opacity="0.45"/>`);
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="${PAPER}"/>
  <g>${shadow.join('')}</g>
  <g>${pool.join('')}</g>
  <g>
  ${loop}
  </g>
  <g>${ticks}</g>
  <g>${arrow}</g>
  <g>${dots}</g>
</svg>`;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'web', 'cards', 'why-card2.jpg');
mkdirSync(dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(out);
console.log('written:', out);
