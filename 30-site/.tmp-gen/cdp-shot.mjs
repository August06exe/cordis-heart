// CDP 截图核验：取每个 <img> 的位置/自然尺寸 + 整页高 + 横向滚动
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

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

async function run(width, height, out) {
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
    `--window-size=${width},${height}`, '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = list.find(t => t.type === 'page');
  const { ws, send } = await getPage(page.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:4400/steal-this/' });
  await new Promise(r => setTimeout(r, 6000)); // 等图片解码
  const ev = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
    const imgs = [...document.querySelectorAll('.stpage img')].map(im => {
      const r = im.getBoundingClientRect();
      return { src: im.getAttribute('src'), x: Math.round(r.x), y: Math.round(r.y + window.scrollY),
               w: Math.round(r.width), h: Math.round(r.height), nw: im.naturalWidth, nh: im.naturalHeight,
               complete: im.complete };
    });
    return { imgs, pageH: document.documentElement.scrollHeight,
             pageW: document.documentElement.scrollWidth, vw: window.innerWidth };
  })()` });
  // 全页截图
  await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: ev.result.result.value.pageH, scale: 1 } }).then(r => {
    fs.writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  }).catch(async e => {
    console.error('captureBeyondViewport 失败，退回窗口截图:', e.message);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  });
  console.log(`== ${width} ==`, JSON.stringify(ev.result.result.value, null, 1));
  ws.close(); proc.kill();
}

await run(1440, 1000, '.tmp-gen/cdp-1440.png');
await run(375, 1000, '.tmp-gen/cdp-375.png');
