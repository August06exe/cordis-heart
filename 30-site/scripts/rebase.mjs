// 发布到「域名/cordis」子路径用：把 dist 里 HTML/CSS 的根路径加上 /cordis 前缀。
// 用法：npm run build:cordis（= astro build && node scripts/rebase.mjs）。
// JS 里的绝对链接已在源码用 import.meta.env.BASE_URL 处理（src/scripts/ui.ts），
// 所以这里只改 HTML 属性与 CSS url()，不碰 JS 字符串（演示文案里有「/天气」这类普通文本）。
// 本地 npm run build / dev 不加前缀，仍是根路径。
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const PREFIX = '/cordis';
// //开头的协议相对地址、已经是 /cordis 的，跳过
const SKIP = /^\/(\/|cordis(\/|$))/;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html|css)$/.test(name)) files.push(p);
  }
})(DIST);

const attr = /(\s(?:href|src|content|poster|srcset)=")(\/[^"]*)"/g;
const cssUrl = /(url\(\s*(['"]?))(\/[^'")]+)\2/g;
let n = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const out = src
    .replace(attr, (m, head, v) => (SKIP.test(v) ? m : head + PREFIX + v + '"'))
    .replace(cssUrl, (m, head, quote, v) => (SKIP.test(v) ? m : head + PREFIX + v + quote));
  if (out !== src) {
    writeFileSync(file, out);
    n += 1;
  }
}
console.log(`rebase: ${n}/${files.length} files prefixed with ${PREFIX}`);
