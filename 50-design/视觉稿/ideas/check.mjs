// /ideas 视觉稿最小自检（M3.2 补齐）：规则1 单一色相 + 规则2 文字对比度
// 口径与 why/check.mjs、limits/check-limits.mjs 一致：
//   规则1（声明值口径）：全文 hex / oklch 声明换算 OKLCH，C≥0.02 的色相必须全部落在钴蓝 265±5°，
//          出现任一第二色相即 FAIL（C<0.02 近中性色豁免，同 04-定稿 规则 1）。
//   规则2（8-bit 合成口径）：除纸白外的每个前景声明，带 alpha 先对纸白 #FAFAF7 做 sRGB 8-bit 合成取整，
//          再按 WCAG 2.x 相对亮度公式实算对比度；阈值沿用 brand-spec 红线：
//          文字档（α≥.78 或 1）≥4.5，图解线档（.50≤α<.78）≥3，α<.5 装饰档照录不设线。
// 用法：node check.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./ideas.html', import.meta.url), 'utf8');
const flat = html.replace(/%23/g, '#');   // SVG data URI 里的 URL 编码色值还原
const PAPER = [250, 250, 247];            // #FAFAF7 纸白 8-bit
const LO = 260, HI = 270;                 // 钴蓝 265±5°

// ---- 色彩数学（CSS Color 4 / WCAG 2.x，与 08-深色主题样张-审记.md 复现脚本同源）----
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
function oklchFromRgb8([r, g, b]) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const Bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(A * A + Bb * Bb);
  let H = Math.atan2(Bb, A) * 180 / Math.PI; if (H < 0) H += 360;
  return { H, C };
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
  const to8 = v => Math.round(Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)) * 255);
  return [to8(r), to8(g), to8(b)];
}
function parseHex(h) {
  let s = h; if (s.length === 3) s = [...s].map(c => c + c).join('');
  const rgb = [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
  return { rgb, a };
}
const compose = (rgb, a, bg = PAPER) => rgb.map((v, i) => Math.round(a * v + (1 - a) * bg[i]));
const f1 = x => x.toFixed(1), f3 = x => x.toFixed(3);

// ---- 收集颜色声明（去重）----
const decls = new Map();
const put = (raw, rgb, a) => { const k = raw.replace(/\s+/g, ' '); if (!decls.has(k)) decls.set(k, { raw: k, rgb, a }); };
for (const m of flat.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
  const { rgb, a } = parseHex(m[1]);
  put(m[0].toUpperCase(), rgb, a);
}
for (const m of flat.matchAll(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)/g)) {
  let L = parseFloat(m[1]); if (m[1].endsWith('%')) L /= 100;
  let a = m[4] === undefined ? 1 : parseFloat(m[4]); if (m[4] !== undefined && m[4].endsWith('%')) a /= 100;
  put(m[0], srgb8FromOklch(L, parseFloat(m[2]), parseFloat(m[3])), a);
}

// ---- 规则 1：单一色相（声明值口径）----
console.log('== 规则 1 · 单一色相扫描（全文声明值，C≥0.02 须在 265±5°）==');
const chroma = new Set(); let hueFail = [];
for (const d of decls.values()) {
  const { H, C } = oklchFromRgb8(d.rgb);
  const neutral = C < 0.02;
  if (!neutral) chroma.add(f1(H));
  if (!neutral && (H < LO || H > HI)) hueFail.push(`${d.raw}@H${f1(H)}`);
  console.log(d.raw.padEnd(36), `rgb8(${d.rgb.join(',')})`, `H=${f1(H)}`, `C=${f3(C)}`,
    neutral ? '[中性豁免]' : (H >= LO && H <= HI ? '[同相]' : '[超界]'));
}
console.log(`色相集合: {${[...chroma].join(', ')}}（容差窗口 ${LO}–${HI}°）`);
console.log(hueFail.length === 0 ? '规则 1 判定：PASS（无第二色相）' : '规则 1 判定：FAIL ' + hueFail.join(', '));

// ---- 规则 2：逐个前景色对纸白实算 WCAG（8-bit 合成口径）----
console.log('\n== 规则 2 · 前景色对纸白 WCAG 对比度（8-bit 合成）==');
let conFail = [];
for (const d of decls.values()) {
  if (JSON.stringify(d.rgb) === JSON.stringify(PAPER)) {
    console.log(`${d.raw.padEnd(36)} 纸白（背景本体，跳过）`);
    continue;
  }
  const eff = d.a >= 1 ? d.rgb : compose(d.rgb, d.a);
  const c = contrast(eff, PAPER);
  let min = null, line;
  if (d.a >= 0.78) { min = 4.5; line = '文字档 ≥4.5'; }
  else if (d.a >= 0.5) { min = 3; line = '图解线档 ≥3'; }
  else line = '装饰档（照录不设线）';
  const verdict = min === null ? '照录' : (c >= min ? 'PASS' : 'FAIL');
  if (verdict === 'FAIL') conFail.push(`${d.raw} = ${f3(c)} < ${min}`);
  console.log(`${d.raw.padEnd(36)} a=${d.a.toFixed(2)} 合成 rgb8(${eff.join(',')})  ${f3(c)}:1  ${line} ${verdict}`);
}
console.log(conFail.length === 0 ? '规则 2 判定：PASS' : '规则 2 判定：FAIL ' + conFail.join(', '));

// ---- 口径完备性：其他颜色写法与 CSS 命名色不静默放过 ----
const others = [...flat.matchAll(/\b(?:rgb|rgba|hsl|hsla|lab|lch|oklab|color|color-mix|light-dark)\s*\(/gi)].map(m => m[0]);
const named = [...new Set([...flat.matchAll(/[:\s(,"'](white|black|gray|grey|silver|red|green|blue|navy|maroon|olive|purple|orange|pink|brown|teal|cyan|magenta|violet|indigo|gold)[\s;,)"']/gi)].map(m => m[1]))];
console.log(`\n[口径完备性] 其他颜色函数写法: ${others.length ? others.join(', ') : '无'}；CSS 命名色: ${named.length ? named.join(', ') : '无'}`);

// ---- 汇总 ----
console.log('\n== 汇总 ==');
if (hueFail.length || conFail.length) {
  console.log('FAIL:');
  hueFail.forEach(x => console.log(' - ' + x));
  conFail.forEach(x => console.log(' - ' + x));
  process.exit(1);
}
console.log('ideas.html: 全部脚本项 PASS');
