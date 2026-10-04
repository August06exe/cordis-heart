// 交互回归：生成器、自查五问、沙盘自由模式、本页目录高亮、术语/出处浮层、移动端抽屉、演示短标签不折行。
// 用法：先 npm run dev，再 node scripts/probe-ux.mjs [base]   （系统 Edge + playwright-core；失败时退出码 1）
import { chromium } from 'playwright-core';

const base = process.argv[2] || 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
const fails = [];
page.on('pageerror', (e) => errors.push(page.url() + ' ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(page.url() + ' ' + m.text()));
const ok = (cond, msg) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  if (!cond) fails.push(msg);
};

// 1. 抄作业生成器
await page.goto(base + '/steal/', { waitUntil: 'networkidle' });
const n = () => page.$$eval('[data-trick]:checked', (l) => l.length);
const txt = () => page.$eval('[data-out]', (e) => e.textContent);
ok((await n()) === 3 && (await txt()).includes('不要改代码'), '默认选中「给老项目体检」3 招 + 体检模式');
await page.click('[data-preset="agent"]');
ok((await n()) === 12 && !(await txt()).includes('不要改代码') && (await txt()).includes('12. '), '「做 agent」12 招，改造模式');
await page.click('[data-preset="none"]');
ok((await n()) === 0 && (await page.$eval('[data-copyout]', (b) => b.disabled)), '清空后复制按钮禁用');
await page.click('label.sb-item:has(input[value="seam"])');
await page.click('label.sb-item:has(input[value="lifo"])');
const t2 = await txt();
ok(t2.indexOf('倒着撕') < t2.indexOf('能力做成插座'), '手动勾选按招数顺序排列（2 在 15 前）');
await page.click('[data-copyout]');
const clip = await page.evaluate(() => navigator.clipboard.readText());
ok(clip.replaceAll('\r\n', '\n') === t2, '复制到剪贴板的内容与预览一致（Windows 剪贴板会把换行转成 CRLF）');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-download]')]);
ok(dl.suggestedFilename() === 'cordis-rules.md', '下载文件名 cordis-rules.md');

// 2. 采用前自查
await page.goto(base + '/limits/', { waitUntil: 'networkidle' });
const answer = async (arr) => {
  for (let i = 0; i < arr.length; i++) await page.click(`[data-q="${i}"] [data-a="${arr[i]}"]`);
};
const verdict = () => page.textContent('[data-verdict]');
await answer(['y', 'y', 'y']);
ok(await page.$eval('[data-verdict]', (e) => e.hidden), '没答完不出结论');
await answer(['y', 'y', 'y', 'y', 'y']);
ok((await verdict()).includes('值得试'), '全「是」→ 值得试');
await answer(['n', 'y', 'y', 'y', 'y']);
ok((await verdict()).includes('先别用') && !(await page.$eval('[data-q="0"] .fit-no', (e) => e.hidden)), '第 1 题「否」→ 先别用，并展开解释');
await answer(['y', 'n', 'y', 'n', 'y']);
ok((await verdict()).includes('局部借'), '两个「否」→ 局部借');
await answer(['y', 'n', 'n', 'n', 'y']);
ok((await verdict()).includes('不合适'), '三个「否」→ 不合适');

// 3. 沙盘：引导播完后的自由模式
await page.goto(base + '/lifecycle/', { waitUntil: 'networkidle' });
for (let b = 0; b < 4; b++) {
  await page.click('[data-demo="life"] [data-next]');
  await page.waitForFunction(() => !document.querySelector('[data-demo="life"] [data-next]').disabled, null, { timeout: 20000 });
}
for (const k of ['wea', 'db', 'rem', 'wea', 'sta']) {
  await page.click(`label.lf-sw:has([data-want="${k}"])`);
  await page.waitForTimeout(60);
}
await page.waitForTimeout(2500);
await page.click('[data-check]');
await page.waitForTimeout(900);
ok((await page.textContent('[data-demo="life"] .stamp')).includes('一模一样'), '自由模式乱按 5 次后，对照结果一致');

// 4. 本页目录高亮
await page.goto(base + '/deps/', { waitUntil: 'networkidle' });
const on = () => page.$$eval('.toc a', (l) => l.findIndex((a) => a.classList.contains('is-on')));
const total = await page.$$eval('.toc a', (l) => l.length);
ok((await on()) === 0, '顶部：高亮第 1 节');
await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
ok((await on()) === total - 1, '底部：高亮最后一节');
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(300);
ok((await on()) === 0, '回到顶部：高亮回到第 1 节（不残留）');

// 5. 术语与出处浮层
await page.hover('.term[data-term="coeffect"]');
await page.waitForTimeout(250);
ok(await page.$eval('#pop', (p) => p.classList.contains('is-on') && p.textContent.includes('反效应')), '术语悬停出浮层');
await page.mouse.move(5, 5);
await page.waitForTimeout(400);
await page.focus('.ref');
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
ok(await page.$eval('#pop', (p) => p.classList.contains('is-on') && p.textContent.includes('论文第')), '出处可用键盘触发浮层');

// 6. 移动端抽屉
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = await mctx.newPage();
m.on('pageerror', (e) => errors.push('m ' + e.message));
await m.goto(base + '/undo/', { waitUntil: 'networkidle' });
await m.tap('[data-menu]');
await m.waitForTimeout(400);
ok((await m.$eval('[data-menu]', (b) => b.getAttribute('aria-expanded'))) === 'true', '移动端：目录按钮打开抽屉');
await m.keyboard.press('Escape');
await m.waitForTimeout(300);
ok((await m.$eval('[data-menu]', (b) => b.getAttribute('aria-expanded'))) === 'false', '移动端：Esc 关闭抽屉');
await mctx.close();

// 7. 演示里 ≤8 字的短标签不折行（1024 有侧栏时舞台只有约 700px，曾把「数据库」挤成一字一行）
for (const w of [390, 1024, 1440]) {
  const wctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p = await wctx.newPage();
  const hits = [];
  for (const s of ['', 'problem', 'undo', 'deps', 'context', 'lifecycle', 'cordis-dsh']) {
    await p.goto(base + '/' + (s ? s + '/' : ''), { waitUntil: 'networkidle' });
    const h = await p.evaluate(() => {
      const out = [];
      for (const st of document.querySelectorAll('.stage')) {
        const tw = document.createTreeWalker(st, NodeFilter.SHOW_TEXT);
        for (let node = tw.nextNode(); node; node = tw.nextNode()) {
          const t = node.textContent.trim();
          if (!t || t.length > 8) continue;
          const rg = document.createRange();
          rg.selectNodeContents(node);
          const tops = new Set([...rg.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
          if (tops.size > 1) out.push(t);
        }
      }
      return out;
    });
    hits.push(...h.map((t) => (s || 'index') + ':' + t));
  }
  ok(hits.length === 0, `${w}px：演示短标签不折行${hits.length ? ' → ' + hits.slice(0, 6).join(' ') : ''}`);
  await wctx.close();
}

ok(errors.length === 0, '无脚本报错' + (errors.length ? ' → ' + errors.join(' | ') : ''));
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASS');
await browser.close();
process.exit(fails.length ? 1 : 0);
