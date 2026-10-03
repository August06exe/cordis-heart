// steal-this 生成器真机断言：系统 Edge + playwright-core，收集 console 错误与面板初始态
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto('http://localhost:4321/steal-this/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const state = await page.evaluate(() => ({
  checked: document.querySelectorAll('[data-idea-cbx]:checked').length,
  num: document.querySelector('[data-gen-num]')?.textContent,
  blocks: document.querySelectorAll('.md-block').length,
  copyDisabled: document.querySelector('[data-m5="copy"]')?.disabled,
  firstBlock: document.querySelector('.md-block')?.textContent?.slice(0, 80),
  emptyVisible: !document.querySelector('[data-gen-empty]')?.hidden,
}));

// 勾选 02 再取消 01，验证拼装联动（原生 click 绕过 dev toolbar 遮挡）
await page.evaluate(() => document.querySelector('[data-idea-cbx="02"]').click());
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({
  num: document.querySelector('[data-gen-num]')?.textContent,
  blocks: document.querySelectorAll('.md-block').length,
}));
await page.evaluate(() => document.querySelector('[data-idea-cbx="01"]').click());
await page.waitForTimeout(400);
const afterOff = await page.evaluate(() => ({
  num: document.querySelector('[data-gen-num]')?.textContent,
  blocks: document.querySelectorAll('.md-block').length,
  has02: [...document.querySelectorAll('.md-block')].some((b) => b.textContent.includes('02 ·')),
  has01: [...document.querySelectorAll('.md-block')].some((b) => b.textContent.includes('01 ·')),
}));

console.log(JSON.stringify({ state, after, afterOff, errors }, null, 1));
await page.screenshot({ path: '../99-archive/2026-10-03-版心重排/v2-steal-wb.png', clip: { x: 250, y: 0, width: 1190, height: 2400 }, fullPage: true }).catch(() => {});
await browser.close();
