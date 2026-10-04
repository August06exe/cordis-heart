// 「域名/cordis」子路径构建：先带 BASE_PATH=/cordis 跑 astro build（JS 里的 BASE_URL 因此带上前缀），
// 再由 rebase.mjs 给 HTML 属性与 CSS url() 补前缀（Astro 的 base 不会改写模板里手写的 href）。
import { spawnSync } from 'node:child_process';

const build = spawnSync('npx', ['astro', 'build'], { stdio: 'inherit', shell: true, env: { ...process.env, BASE_PATH: '/cordis' } });
if (build.status) process.exit(build.status);
await import('./rebase.mjs');
