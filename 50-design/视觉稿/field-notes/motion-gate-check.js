// 计数器预显影门 CDP 实测：field-notes.html 图 01 三枚 stat-num 的显影时序取证
// 复现评审 CDP 取证口径：阈值前后取 computed opacity 与 textContent 时间线
// 用法：node motion-gate-check.js （需本机 Edge 或 Chrome，node >= 22 用内置 WebSocket / fetch）
'use strict';
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HTML = 'file:///' + path.resolve(__dirname, 'field-notes.html').replace(/\\/g, '/');
const CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];
const exe = CANDIDATES.find(p => fs.existsSync(p));
if (!exe) { console.error('FAIL: no Edge/Chrome found'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));

function launch(extra) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-prof-'));
  const child = spawn(exe, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--window-size=1280,700',
    ...extra, 'about:blank',
  ], { stdio: 'ignore' });
  return { child, port, profile };
}
function kill(child) {
  try { execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }); } catch {}
}
async function getWsUrl(port) {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('devtools endpoint unreachable');
}
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else if (msg.method) events.push(msg);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, m => m.error ? reject(new Error(method + ' ' + JSON.stringify(m.error))) : resolve(m.result));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const ready = new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  return { ws, send, ready, events };
}
async function evaluate(send, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
const grabStats = `JSON.stringify(['stat-plugins','stat-star','stat-zero'].map(id => {
  const el = document.getElementById(id);
  return { id, text: el.textContent, opacity: getComputedStyle(el).opacity };
}))`;
const grabBars = `JSON.stringify([...document.querySelectorAll('.bar-row')].map(r => ({
  name: r.querySelector('.bar-name').textContent.trim(),
  w: Math.round(r.querySelector('.bar').getBoundingClientRect().width),
  valOpacity: getComputedStyle(r.querySelector('.bar-val')).opacity
})))`;
const htmlClass = `document.documentElement.className`;

async function openCase(extra) {
  const b = launch(extra);
  const wsUrl = await getWsUrl(b.port);
  const c = connect(wsUrl);
  await c.ready;
  await c.send('Page.enable');
  await c.send('Page.navigate', { url: HTML });
  const t0 = Date.now();
  while (Date.now() - t0 < 10000 && !c.events.some(m => m.method === 'Page.loadEventFired')) await sleep(100);
  await sleep(400);
  return { b, c };
}
function closeCase(b, c) { try { c.ws.close(); } catch {} kill(b.child); sleep(200).then(() => fs.rmSync(b.profile, { recursive: true, force: true })); }

let failures = 0;
const check = (name, cond, detail) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
  if (!cond) failures++;
};

// ── 用例 A：默认（动画开）────────────────────────────────────────
async function caseDefault() {
  const { b, c } = await openCase([]);
  try {
    const cls = await evaluate(c.send, htmlClass);
    const stats = JSON.parse(await evaluate(c.send, grabStats));
    console.log('载入态 html.className =', JSON.stringify(cls));
    console.log('载入态（滚动前）stats =', JSON.stringify(stats));
    check('A1 html 挂 js 类', cls.includes('js'), cls);
    check('A2 滚动前三枚 stat-num opacity=0（终值不可见，评审所见闪烁的成因被消除）',
      stats.every(s => s.opacity === '0'), stats.map(s => `${s.id}:${s.opacity}`).join(' '));

    const barsPre = JSON.parse(await evaluate(c.send, grabBars));
    check('A2b 滚动前条形宽度为 0（draw-in 起点成立）', barsPre.every(x => x.w === 0), JSON.stringify(barsPre));

    // 模拟用户滚到图 01，等 IntersectionObserver 过 25% 阈值
    const tScroll = Date.now();
    await evaluate(c.send, `document.getElementById('fig01').scrollIntoView({block:'center'})`);
    let tIn = -1;
    const deadline = tScroll + 8000;
    while (Date.now() < deadline) {
      const ok = await evaluate(c.send, `document.getElementById('fig01').classList.contains('in')`);
      if (ok) { tIn = Date.now(); break; }
      await sleep(40);
    }
    if (tIn < 0) { check('A3 图 01 过阈值触发 .in', false, '超时未触发'); return; }
    check('A3 图 01 过阈值触发 .in', true, `滚动后 +${tIn - tScroll}ms`);

    // 阈值后时间线取样：+30ms（淡入延迟窗）/ +420ms（count-up 中段）/ +1900ms（终态）
    const at = async ms => { while (Date.now() - tIn < ms) await sleep(10); return JSON.parse(await evaluate(c.send, grabStats)); };
    const s1 = await at(30);
    const s2 = await at(420);
    const s3 = await at(1900);
    const bars3 = JSON.parse(await evaluate(c.send, grabBars));
    console.log('阈值后 +30ms  =', JSON.stringify(s1));
    console.log('阈值后 +420ms =', JSON.stringify(s2));
    console.log('阈值后 +1900ms =', JSON.stringify(s3));
    console.log('阈值后 +1900ms bars =', JSON.stringify(bars3));
    const p = s => s.find(x => x.id === 'stat-plugins');
    const st = s => s.find(x => x.id === 'stat-star');
    check('A4 淡入延迟窗内 opacity 仍≈0（首帧旧文本不可见，无终值闪帧）',
      parseFloat(p(s1).opacity) < 0.1 && parseFloat(st(s1).opacity) < 0.1, `plugins:${p(s1).opacity} star:${st(s1).opacity}`);
    const num = t => parseFloat(String(t).replace(/,/g, ''));
    check('A5 count-up 中段值低于终值且未直接出终值（对照评审取证 +270ms 的 2,146+）',
      num(p(s2).text) < 4000 && num(st(s2).text) < 6239 && p(s2).text !== '4,000+' && st(s2).text !== '6,239',
      `plugins:${p(s2).text} star:${st(s2).text}`);
    check('A6 终态文本与 opacity=1（画完静止供阅读）',
      p(s3).text === '4,000+' && st(s3).text === '6,239' && p(s3).opacity === '1' && st(s3).opacity === '1',
      `plugins:${p(s3).text}@${p(s3).opacity} star:${st(s3).text}@${st(s3).opacity}`);
    const bar = n => bars3.find(x => x.name.includes(n));
    check('A7 条形 draw-in 终态（dsh 满宽、koishi/cordis 出图、数值标签可见）',
      bar('deepseek').w > 500 && bar('koishijs').w > 0 && bar('cordiverse').w > 0 &&
      bars3.every(x => x.valOpacity === '1'),
      `w: koishi=${bar('koishijs').w} cordis=${bar('cordiverse').w} dsh=${bar('deepseek').w} valOpacity=${bars3.map(x => x.valOpacity).join('/')}`);
    check('A8 stat-zero 对照实验位按期显影（评审引用的参照实现此前被死选择器卡在 opacity 0）',
      s3.find(x => x.id === 'stat-zero').opacity === '1',
      `zero:${JSON.stringify(s3.find(x => x.id === 'stat-zero'))}`);
  } finally { closeCase(b, c); }
}

// ── 用例 B：prefers-reduced-motion 直出终态 ──────────────────────
async function caseReduced() {
  const { b, c } = await openCase(['--force-prefers-reduced-motion']);
  try {
    const cls = await evaluate(c.send, htmlClass);
    const stats = JSON.parse(await evaluate(c.send, grabStats));
    console.log('reduced-motion html.className =', JSON.stringify(cls));
    console.log('reduced-motion 载入态 stats =', JSON.stringify(stats));
    check('B1 html 挂 no-anim 类', cls.includes('no-anim'), cls);
    check('B2 三枚计数器载入即 opacity=1 且为终值（reduced-motion 兜底含 .stat-num）',
      stats.every(s => s.opacity === '1') &&
      stats.find(s => s.id === 'stat-plugins').text === '4,000+' &&
      stats.find(s => s.id === 'stat-star').text === '6,239',
      stats.map(s => `${s.id}:${s.text}@${s.opacity}`).join(' '));
  } finally { closeCase(b, c); }
}

// ── 用例 C：禁 JS（渐进增强底线）────────────────────────────────
async function caseNoJs() {
  const { b, c } = await openCase(['--blink-settings=scriptEnabled=false']);
  try {
    const cls = await evaluate(c.send, htmlClass);
    const stats = JSON.parse(await evaluate(c.send, grabStats));
    console.log('no-js html.className =', JSON.stringify(cls));
    console.log('no-js 载入态 stats =', JSON.stringify(stats));
    check('C1 html 无 js 类', !cls.includes('js'), cls);
    check('C2 无 JS 时三枚计数器静态可见（预显影门不误伤无 JS 用户）',
      stats.every(s => s.opacity === '1' && s.text.length > 0),
      stats.map(s => `${s.id}:${s.text}@${s.opacity}`).join(' '));
  } finally { closeCase(b, c); }
}

(async () => {
  await caseDefault();
  await caseReduced();
  await caseNoJs();
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(2); });
