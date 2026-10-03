import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9341;

async function getPage(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((res) => {
    const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params }));
  });
  return { ws, send };
}

const SCROLL_EXPR = `(async () => {
  for (let y = 0; y <= document.documentElement.scrollHeight; y += 600) {
    window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
  }
  await new Promise(r => setTimeout(r, 1500));
  window.scrollTo(0, 0);
})()`;

const REPORT_EXPR = `(() => ({
  imgs: [...document.querySelectorAll('.stpage img')].map(im => {
    const r = im.getBoundingClientRect();
    return { src: im.getAttribute('src'), y: Math.round(r.y + window.scrollY),
             nw: im.naturalWidth, nh: im.naturalHeight, complete: im.complete };
  }),
  pageH: document.documentElement.scrollHeight,
  pageW: document.documentElement.scrollWidth,
  vw: window.innerWidth,
}))()`;

async function run(width, height, out) {
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=D:/Workshop/3000-Projects/3011-DSH论文笔记/30-site/.tmp-gen/p3-${width}`,
    '--no-first-run', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1800));
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find(t => t.type === 'page');
  const { ws, send } = await getPage(page.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
  await send('Page.navigate', { url: 'http://localhost:4400/steal-this/' });
  await new Promise(r => setTimeout(r, 3000));
  const scrollEv = await send('Runtime.evaluate', { awaitPromise: true, expression: SCROLL_EXPR });
  if (scrollEv.result.exceptionDetails) console.log('scroll EXC', JSON.stringify(scrollEv.result.exceptionDetails).slice(0, 200));
  await new Promise(r => setTimeout(r, 1500));
  const ev = await send('Runtime.evaluate', { returnByValue: true, expression: REPORT_EXPR });
  if (ev.result.exceptionDetails) console.log('report EXC', JSON.stringify(ev.result.exceptionDetails).slice(0, 200));
  const val = ev.result.result && ev.result.result.value;
  console.log(`== ${width}x${height} ==`);
  console.log(JSON.stringify(val, null, 1));
  const pageH = (val && val.pageH) || 9000;
  const shot = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: pageH, scale: 1 },
  });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('saved', out, pageH + 'px tall');
  ws.close(); proc.kill();
}

await run(1440, 1200, '.tmp-gen/full-1440.png');
await run(375, 900, '.tmp-gen/full-375.png');
