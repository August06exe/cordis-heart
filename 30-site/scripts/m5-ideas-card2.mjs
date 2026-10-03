// ideas-card2「撤销·回旋箭头」补图：apimart JSON-RPC 直调（通道先例见 10-docs/04 第 2 节）。
// 用法：node scripts/m5-ideas-card2.mjs   （密钥读 ~/.zcode/cli/config.json，不落盘）
// gpt-image-2.5-ext @ 1:1 / 2k，prompt 照录 40-assets/illustrations/m47/prompts/ideas-card2.txt
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cfg = JSON.parse(readFileSync(join(homedir(), '.zcode/cli/config.json'), 'utf8'));
const KEY = cfg.mcp.servers.apimart.headers.Authorization.split(' ')[1];
const URL = 'https://mcp.apimart.ai/mcp';
const HEADERS = {
  Authorization: `Bearer ${KEY}`,
  'User-Agent': 'zcode/0.16.9',
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
};

let session = null;
let rpcId = 1;

async function rpc(method, params, { notify = false } = {}) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { ...HEADERS, ...(session ? { 'Mcp-Session-Id': session } : {}) },
    body: JSON.stringify(
      notify
        ? { jsonrpc: '2.0', method, params }
        : { jsonrpc: '2.0', id: rpcId++, method, params },
    ),
  });
  if (notify) return null; // 通知无响应体（202 或空），不解析
  const text = await res.text();
  // 响应可能是 SSE 帧（event: message\ndata: {...}），取 data 行
  const dataLine = text.split('\n').find((l) => l.startsWith('data:'));
  const json = JSON.parse(dataLine ? dataLine.slice(5).trim() : text);
  if (json.error) throw new Error(`${method} 失败: ${JSON.stringify(json.error)}`);
  return json.result;
}

const prompt = readFileSync(join(ROOT, '40-assets/illustrations/m47/prompts/ideas-card2.txt'), 'utf8').trim();

const init = await rpc('initialize', {
  protocolVersion: '2025-03-26',
  capabilities: {},
  clientInfo: { name: 'dsh-site-gen', version: '1.0' },
});
console.log('initialized:', init.serverInfo.name, init.serverInfo.version);
await rpc('notifications/initialized', {}, { notify: true });

const call = await rpc('tools/call', {
  name: 'generate_image',
  arguments: {
    model: 'gpt-image-2.5-ext',
    input: {
      prompt,
      n: 1,
      size: '1:1',
      resolution: '2k',
      nsfw_check: false,
      official_fallback: false,
    },
    idempotency_key: 'ideas-card2-undo-2k-v1',
  },
});
const taskInfo = JSON.parse(call.content[0].text);
console.log('task:', taskInfo.task_id ?? JSON.stringify(taskInfo).slice(0, 200));

let status = taskInfo;
for (let i = 0; i < 40; i++) {
  if (status.status === 'completed' || status.status === 'failed') break;
  await new Promise((r) => setTimeout(r, 4000));
  const poll = await rpc('tools/call', {
    name: 'get_task',
    arguments: { task_id: taskInfo.task_id ?? status.task_id, language: 'zh' },
  });
  status = JSON.parse(poll.content[0].text);
  console.log(`poll ${i}:`, status.status);
}
if (status.status !== 'completed') throw new Error(`生成未完成: ${JSON.stringify(status).slice(0, 400)}`);

const imgUrl = status.output?.url ?? status.result?.url ?? status.url;
if (!imgUrl) throw new Error(`无图片 URL: ${JSON.stringify(status).slice(0, 400)}`);
console.log('image url:', imgUrl);
const imgRes = await fetch(imgUrl);
mkdirSync(join(ROOT, '40-assets/illustrations/m47/2k'), { recursive: true });
const out = join(ROOT, '40-assets/illustrations/m47/2k/ideas-card2.png');
writeFileSync(out, Buffer.from(await imgRes.arrayBuffer()));
console.log('saved:', out);
