import { spawn } from 'node:child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9337;

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

async function run(width, height) {
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=D:/Workshop/3000-Projects/3011-DSH论文笔记/30-site/.tmp-gen/profile-${width}`,
    '--no-first-run', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1800));
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find(t => t.type === 'page');
  const { ws, send } = await getPage(page.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
  await send('Page.navigate', { url: 'http://localhost:4400/steal-this/' });
  await new Promise(r => setTimeout(r, 7000));
  const ev = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
    const imgs = [...document.querySelectorAll('.stpage img')].map(im => {
      const r = im.getBoundingClientRect();
      return { src: im.getAttribute('src'), x: Math.round(r.x), y: Math.round(r.y + window.scrollY),
               w: Math.round(r.width), h: Math.round(r.height), nw: im.naturalWidth, complete: im.complete };
    });
    return { vw: window.innerWidth, pageW: document.documentElement.scrollWidth,
             pageH: document.documentElement.scrollHeight, hScroll: document.documentElement.scrollWidth > window.innerWidth,
             imgs };
  })()` });
  console.log(`== ${width}x${height} ==`, JSON.stringify(ev.result.result.value));
  ws.close(); proc.kill();
}

await run(1440, 1200);
await run(375, 900);
