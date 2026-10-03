// /limits 视觉稿自检 v2：单一色相（声明值口径）+ WCAG 对比度（8-bit 合成口径）
// 规则 1 按 scorecard 方法：全文提取 hex 与 oklch 声明值换算 OKLCH 色相，C≥0.02 须在钴蓝 265±5°；
// 规则 2：带 alpha 的声明值先对纸白做 sRGB 8-bit 合成取整，再按 WCAG 相对亮度公式算对比度。
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./cordis-limits.html', import.meta.url), 'utf8');
const PAPER = [250, 250, 247]; // #FAFAF7 8-bit

const c2 = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * c2(r) + 0.7152 * c2(g) + 0.0722 * c2(b);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

function oklchFromRgb8([r, g, b]) {
  const R = c2(r), G = c2(g), B = c2(b);
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const Bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(A * A + Bb * Bb);
  let H = Math.atan2(Bb, A) * 180 / Math.PI; if (H < 0) H += 360;
  return { L, C, H };
}

function srgb8FromOklch(L, C, H) {
  const hr = H * Math.PI / 180;
  const A = C * Math.cos(hr), Bb = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * A + 0.2158037573 * Bb;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * Bb;
  const s_ = L - 0.0894841775 * A - 1.2914855480 * Bb;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const lin2srgb = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  const to8 = (v) => Math.round(Math.min(1, Math.max(0, lin2srgb(v))) * 255);
  return [to8(r), to8(g), to8(b)];
}

const flat = html.replace(/%23/g, '#');
const rows = [];
for (const m of flat.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
  let h = m[1]; if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  rows.push({ declared: '#' + h.toUpperCase(), alpha: 1, rgb });
}
for (const m of flat.matchAll(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)/g)) {
  const L = +m[1], C = +m[2], H = +m[3], a = m[4] === undefined ? 1 : +m[4];
  const rgb = srgb8FromOklch(L, C, H);
  rows.push({ declared: m[0].replace(/\s+/g, ' '), alpha: a, rgb });
}

console.log('=== 规则 1：声明色值单一色相扫描（C≥0.02 须在 265±5°）===');
let hueFail = [];
for (const r of rows) {
  const d = oklchFromRgb8(r.rgb); // 声明本体（不合成）
  const neutral = d.C < 0.02;
  if (!neutral && (d.H < 260 || d.H > 270)) hueFail.push(r.declared + '@H' + d.H.toFixed(1));
  console.log(r.declared.padEnd(40), '本体 rgb8(' + r.rgb.join(',') + ')',
    'H=' + d.H.toFixed(1), 'C=' + d.C.toFixed(3),
    neutral ? '[中性豁免]' : (d.H >= 260 && d.H <= 270 ? '[同相 PASS]' : '[超界]'));
}
console.log(hueFail.length === 0 ? '规则 1 判定：PASS（C≥0.02 的声明色值全部在 265±5°）' : '规则 1 判定：FAIL ' + hueFail.join(', '));

console.log('\n=== 规则 2：alpha 对纸白 8-bit 合成后 WCAG 对比度 ===');
const tiers = {};
for (const r of rows) {
  if (!r.declared.startsWith('oklch')) continue;
  const isInk = r.declared.includes('0.182'); // 墨族：oklch(0.449 0.182 265 ...)
  const key = (isInk ? 'ink@' : 'paper@') + r.alpha.toFixed(2);
  if (tiers[key]) continue;
  const composed = r.alpha >= 1 ? r.rgb : r.rgb.map((v, i) => Math.round(r.alpha * v + (1 - r.alpha) * PAPER[i]));
  const c = oklchFromRgb8(composed);
  tiers[key] = { composed, cr: contrast(composed, PAPER), H: c.H, C: c.C };
}
const demands = [
  ['ink@1.00',  '标题/文字 ≥4.5', 4.5],
  ['ink@0.82',  '正文 ≥4.5', 4.5],
  ['ink@0.78',  '小字/图注 ≥4.5', 4.5],
  ['ink@0.70',  '图解线 ≥3（表意图形线）', 3],
  ['ink@0.20',  '分隔细线（装饰豁免）', null],
  ['ink@0.14',  '基座色块（装饰豁免）', null],
];
for (const [k, label, min] of demands) {
  const t = tiers[k];
  if (!t) { console.log(label, 'NOT FOUND'); continue; }
  const verdict = min === null ? '装饰豁免' : (t.cr >= min ? 'PASS' : 'FAIL');
  console.log(k.padEnd(10), 'rgb8(' + t.composed.join(',') + ')',
    String(t.cr.toFixed(3) + ':1').padStart(9), verdict,
    '（合成 H=' + t.H.toFixed(1) + '）');
}

console.log('\n=== 硬性阈值复核 ===');
console.log('文字线 .78 ≥4.5 :', tiers['ink@0.78'].cr >= 4.5 ? 'PASS' : 'FAIL', '(' + tiers['ink@0.78'].cr.toFixed(3) + ')');
console.log('正文线 .82 ≥4.5 :', tiers['ink@0.82'].cr >= 4.5 ? 'PASS' : 'FAIL', '(' + tiers['ink@0.82'].cr.toFixed(3) + ')');
console.log('图形线 .70 ≥3   :', tiers['ink@0.70'].cr >= 3 ? 'PASS' : 'FAIL', '(' + tiers['ink@0.70'].cr.toFixed(3) + ')');
console.log('唯一墨 1.0 ≥4.5 :', tiers['ink@1.00'].cr >= 4.5 ? 'PASS' : 'FAIL', '(' + tiers['ink@1.00'].cr.toFixed(3) + ')');
