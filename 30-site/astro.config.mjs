// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// BASE_PATH 环境变量供「域名/cordis」子路径发布用（scripts/build-cordis.mjs 会设置它）
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  integrations: [mdx()],
  devToolbar: { enabled: false },
});
