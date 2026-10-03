// /why 视觉稿验收脚本：规则1 单色相 + 规则2 WCAG 对比度（8-bit 口径）+ 规则3 可 grep 禁令
// 用法：node check.mjs why.html
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const file = process.argv[2];
if (!file) { console.error('usage: node check.mjs <file.html>'); process.exit(2); }
const src = readFileSync(file, 'utf8');
const name = basename(file);
let fails = [];

// ---------- 颜色解析 ----------
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const s = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function oklchToRgb(L, C, H) {
  // OKLCH -> OKLab
  const hr = H * Math.PI / 180;
  const a = C * Math.cos(hr), b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toSrgb = v => {
    v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(v * 255)));
  };
  return [toSrgb(r), toSrgb(g), toSrgb(bb)];
}

// 收集色值（hex 与 oklch，含 alpha）
const colorDecls = [];
// hex
for (const m of src.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
  colorDecls.push({ raw: m[0], kind: 'hex' });
}
// oklch(...) — 解析参数与可选 alpha
const oklchs = [];
for (const m of src.matchAll(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)/g)) {
  let L = parseFloat(m[1]); if (m[1].endsWith('%')) L = L / 100;
  let alpha = 1;
  if (m[4] !== undefined) {
    alpha = parseFloat(m[4]); if (String(m[4]).endsWith('%')) alpha = alpha / 100;
  }
  oklchs.push({ raw: m[0], L, C: parseFloat(m[2]), H: parseFloat(m[3]), alpha, index: m.index });
}
// CSS 变量：抓 --fg 的 oklch 作为墨色本体（供 alpha 合成）
let inkRgb = null;
const fgDecl = src.match(/--fg\s*:\s*oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/);
if (fgDecl) {
  let L = parseFloat(fgDecl[1]); if (fgDecl[1].endsWith('%')) L /= 100;
  inkRgb = oklchToRgb(L, parseFloat(fgDecl[2]), parseFloat(fgDecl[3]));
}
// 背景：--bg
let bgRgb = [250, 250, 247]; // #FAFAF7 缺省
const bgDecl = src.match(/--bg\s*:\s*oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/);
if (bgDecl) {
  let L = parseFloat(bgDecl[1]); if (bgDecl[1].endsWith('%')) L /= 100;
  bgRgb = oklchToRgb(L, parseFloat(bgDecl[2]), parseFloat(bgDecl[3]));
}
const PAPER = bgRgb;

function compose(rgbFg, alpha, rgbBg) {
  // 8-bit 取整口径：先取整再合成（与浏览器渲染一致）
  const f = rgbFg.map(v => Math.round(v));
  return f.map((v, i) => Math.round(v * alpha + rgbBg[i] * (1 - alpha)));
}
function relLum([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const l1 = relLum(a), l2 = relLum(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- 规则 1：单色相 ----------
console.log('== 规则 1 · 单色相扫描 ==');
const hueSet = new Set(); let neutral = 0;
function oklchFromRgb(rgb) {
  const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [r, g, b] = rgb.map(f);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.sqrt(A * A + B * B);
  let H = Math.atan2(B, A) * 180 / Math.PI; if (H < 0) H += 360;
  return { L, C, H };
}
for (const m of src.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
  const rgb = hexToRgb(m[0]);
  const { C, H } = oklchFromRgb(rgb);
  if (C < 0.02) { neutral++; continue; }
  hueSet.add(Math.round(H));
}
for (const o of oklchs) {
  if (o.C < 0.02) { neutral++; continue; }
  hueSet.add(Math.round(o.H));
}
console.log(`chromatic hues: {${[...hueSet].join(', ')}}, neutral(C<0.02): ${neutral}`);
if (hueSet.size > 1) {
  const arr = [...hueSet];
  const anchor = 265;
  const spread = arr.every(h => Math.abs(h - anchor) <= 5 || Math.abs(h - anchor) >= 355);
  if (!spread) fails.push(`规则1: 色相集合 {${arr.join(',')}} 超出钴蓝 265±5°`);
  else console.log('色相均在钴蓝 265±5° 容差内');
} else if (hueSet.size === 1) {
  const h = [...hueSet][0];
  if (Math.abs(h - 265) > 5) fails.push(`规则1: 色相 ${h} 偏离钴蓝 265±5°`);
}
if (hueSet.size <= 1) console.log('PASS');

// ---------- 规则 2：对比度（8-bit 口径）----------
console.log('\n== 规则 2 · WCAG 对比度（8-bit 合成）==');
if (!inkRgb) {
  fails.push('规则2: 未找到 --fg oklch 墨色定义');
  console.log('FAIL: 未找到 --fg');
} else {
  const rows = [
    ['.14 基座/色块（装饰豁免）', 0.14, 0, 'deco'],
    ['.20 分隔细线（装饰豁免）', 0.20, 0, 'deco'],
    ['.70 图解线（≥3:1）', 0.70, 3, 'graphic'],
    ['.78 小字注脚（≥4.5:1）', 0.78, 4.5, 'text'],
    ['.82 正文（≥4.5:1）', 0.82, 4.5, 'text'],
    ['1.0 标题（≥4.5:1）', 1.00, 4.5, 'text'],
  ];
  for (const [label, alpha, min, kind] of rows) {
    const rgb = compose(inkRgb, alpha, PAPER);
    const c = contrast(rgb, PAPER);
    const ok = c >= min;
    console.log(`${label}: ${c.toFixed(3)}:1 (阈值 ${min}) ${ok ? 'PASS' : 'FAIL'}  合成rgb=${rgb.join(',')}`);
    if (!ok) fails.push(`规则2: ${label} = ${c.toFixed(3)} < ${min}`);
  }
}

// ---------- 规则 3：可 grep 禁令（node 版 grep）----------
console.log('\n== 规则 3 · 禁令扫描 ==');
function scan(re, label, opts = {}) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const rx = new RegExp(re.source, flags);
  const hits = [];
  let m;
  const target = opts.stripTags ? src : src;
  while ((m = rx.exec(target)) !== null) {
    const line = target.slice(0, m.index).split('\n').length;
    hits.push({ line, text: m[0] });
  }
  console.log(`${label}: ${hits.length} 处命中${hits.length ? ' -> ' + hits.slice(0, 8).map(h => `L${h.line} "${h.text}"`).join('; ') : ''}`);
  return hits;
}

// 3a 渐变/玻璃拟态/纯黑/h-screen
scan(/linear-gradient|radial-gradient|backdrop-filter|blur\(/i, '渐变与玻璃拟态');
scan(/#000000|#000\b/, '纯黑第二墨');
scan(/h-screen/, 'h-screen');

// 3b 破折号：只在可见文本里查（剥去 <style>/<script>/注释）
const visible = src
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ');
const dashHits = [];
for (const m of visible.matchAll(/[—–]/g)) {
  dashHits.push(visible.slice(0, m.index).split('\n').length);
}
console.log(`破折号(可见文本): ${dashHits.length} 处命中${dashHits.length ? ' -> 行 ' + dashHits.join(',') : ''}`);

// 3c 滚动提示语（忽略大小写，可见文本+属性）
const scrollHits = [...src.matchAll(/scroll\s*to\s*explore|向下滚动|滚动探索/gi)];
console.log(`滚动提示语: ${scrollHits.length} 处命中`);

// 3d 中点限流：可见文本每行 · 至多 1 个
const midLines = [];
for (const [i, line] of visible.split('\n').entries()) {
  const n = (line.match(/·/g) || []).length;
  if (n > 1) midLines.push({ line: i + 1, n, text: line.trim().slice(0, 60) });
}
console.log(`中点限流(每行>1个·): ${midLines.length} 处命中${midLines.length ? ' -> ' + midLines.slice(0, 6).map(x => `L${x.line}(${x.n}个) "${x.text}"`).join('; ') : ''}`);

if (dashHits.length) fails.push(`规则3: 可见文本破折号 ${dashHits.length} 处`);
if (scrollHits.length) fails.push(`规则3: 滚动提示语 ${scrollHits.length} 处`);
if (midLines.length) fails.push(`规则3: 中点限流超限 ${midLines.length} 行`);
scan(/linear-gradient|backdrop-filter|blur\(/i, '').length && fails.push('规则3: 渐变/玻璃拟态命中');
scan(/#000000|#000\b/, '').length && fails.push('规则3: 纯黑命中');
scan(/h-screen/, '').length && fails.push('规则3: h-screen 命中');

// ---------- 规则 5：结构线索（viewport meta、响应式断点存在性）----------
console.log('\n== 结构抽查 ==');
console.log(`viewport meta: ${/name="viewport"/.test(src) ? '有' : '无'}`);
console.log(`@media 断点: ${(src.match(/@media/g) || []).length} 处`);
console.log(`prefers-reduced-motion: ${/prefers-reduced-motion/.test(src) ? '有' : '无'}`);
console.log(`<svg 内联: ${(src.match(/<svg/g) || []).length} 幅`);
console.log(`focus-visible: ${/:focus-visible/.test(src) ? '有' : '无'}`);
console.log(`100dvh: ${/100dvh|min-height:\s*100(vh|dvh)/.test(src) ? '有' : '无'}`);

// ---------- 汇总 ----------
console.log('\n== 汇总 ==');
if (fails.length) {
  console.log('FAIL:');
  fails.forEach(f => console.log(' - ' + f));
  process.exit(1);
} else {
  console.log(`${name}: 全部脚本项 PASS`);
}
