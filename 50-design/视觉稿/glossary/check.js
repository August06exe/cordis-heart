// check.js — node check.js glossary.html （brief 第 7 节可脚本项 1-3）
const fs = require('fs');
const html = fs.readFileSync(process.argv[2] || 'glossary.html', 'utf8');
const lines = html.split(/\r?\n/);
let fail = 0;

// 1) 单色相扫描：hex 白名单 + oklch 色值核对
const hexes = [...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0].toUpperCase());
const allowed = new Set(['#FAFAF7', '#2148B8']);
const badHex = [...new Set(hexes)].filter(h => !allowed.has(h));
console.log('1) 非白名单 hex:', badHex.length ? (fail = 1, badHex) : '无');

const oklchs = [...new Set([...html.matchAll(/oklch\(([^)]+)\)/g)].map(m => m[1]))];
const okAllowed = /^0\.449 0\.182 265( \/ \.(14|20|70|78|80|82))?$|^0\.984 0\.004 106\.5$/;
const badOk = oklchs.filter(v => !okAllowed.test(v.trim()));
console.log('   oklch 令牌:', oklchs.length, '个;', badOk.length ? (fail = 1, '越界: ' + badOk) : '全部在钴蓝色相与纸白内');

// 2) WCAG 对比度（8-bit 合成）
const fg = [0x21, 0x48, 0xB8], bg = [0xFA, 0xFA, 0xF7];
const mix = a => fg.map((v, i) => Math.round(v * a + bg[i] * (1 - a)));
const lum = ([r, g, b]) => {
  const s = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
};
const cr = (c1, c2) => { const [a, b] = [lum(c1), lum(c2)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
const expect = [[1, 7.48, '≥4.5 文字'], [0.82, 4.966, '≥4.5 正文'], [0.80, 4.716, '≥4.5 编号'], [0.78, 4.524, '≥4.5 小字'], [0.70, 3.778, '≥3 图形线'], [0.20, 1.39, '仅细线'], [0.14, 1.25, '仅色块']];
for (const [a, ref, use] of expect) {
  const v = cr(mix(a), bg);
  const okText = a >= 0.70 ? (a >= 0.78 ? v >= 4.5 : v >= 3) : true;
  if (!okText) fail = 1;
  console.log(`2) 墨 ${a}: ${v.toFixed(3)}:1 (基准 ${ref}) [${use}] ${okText ? 'PASS' : 'FAIL'}`);
}

// .14/.20 不得用于任何文字色：扫描含文字的 CSS 声明
const textInk = [...html.matchAll(/(?:color|fill)\s*:\s*var\(--ink-(?:14|20)\)/g)];
console.log('   .14/.20 用作文字色:', textInk.length ? (fail = 1, textInk.map(m => m[0])) : '无');
// SVG 文字档 ≥.78：dg-note .78 / dg-index .8 均 ≥.78
const svgTextOps = [...html.matchAll(/\.(dg-note|dg-index)\{[^}]*opacity:\s*\.?(\d+)\s*;?/g)]
  .map(m => [m[1], +('0.' + m[2].replace('.', ''))]);
console.log('   SVG 文字透明度档:', svgTextOps.map(([c, o]) => `${c}=${o}`).join(', '),
  svgTextOps.every(([, o]) => o >= 0.78) ? 'PASS' : (fail = 1, 'FAIL'));

// 3) 禁令 grep
const dash = lines.map((l, i) => [i + 1, l]).filter(([, l]) => /[\u2014\u2013]/.test(l));
console.log('3) 破折号 —/– :', dash.length ? (fail = 1, dash) : '零命中');
const ste = /scroll\s+to\s+explore/i.test(html);
console.log('   scroll to explore:', ste ? (fail = 1, '命中') : '零命中');
const grad = /linear-gradient|backdrop-filter|blur\(/.test(html);
console.log('   渐变/玻璃拟态:', grad ? (fail = 1, '命中') : '零命中');
const black = /#000000\b/i.test(html);
console.log('   #000000:', black ? (fail = 1, '命中') : '零命中');
const hscreen = /h-screen/.test(html);
console.log('   h-screen:', hscreen ? (fail = 1, '命中') : '零命中');
const dotLines = lines.filter(l => (l.match(/·/g) || []).length > 1);
console.log('   · 每行 ≤1:', dotLines.length ? (fail = 1, dotLines.map((l, i) => `行${lines.indexOf(l) + 1}: ${l.trim().slice(0, 40)}`)) : 'PASS');
const midDots = (html.match(/·/g) || []).length;
console.log('   全页 · 总数:', midDots);

console.log(fail ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(fail);
