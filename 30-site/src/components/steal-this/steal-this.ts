/**
 * /steal-this 页面脚本（M4.5 v2 重排后沿用）。页级动效强度 5（v2 §1 页级分层，
 * 非首页/沙盒档），全部动效来自用户交互，页面本身没有滚动驱动效果
 * （禁 pin、禁 scrub、禁视差、禁循环动画，本页无自动播放时间轴，无需重播入口）。
 *
 * 职责一：依据浮层。触发钮 hover（鼠标）/ focus / 点按弹出，Esc 与点其他处收起；
 *         定位在本模块内实现（2026-10-03：共享 dev server 的依赖预构建处于
 *         失效状态，@floating-ui/dom 的优化产物 504，页面脚本因此整体未执行；
 *         换成等价的就地定位：bottom-start、间距 6、下空间不足上翻、
 *         16px 视口内距，开启瞬间算一次坐标，不做滚动跟踪，铁律 1 不变）。
 * 职责二：打法卡勾选反馈。切换卡片 is-on（实影转实印），同步面板计数「已选 n 条」；
 *         空态文案仅在计数为零时显示。
 *
 * M5 分镜注记：生成器逻辑（markdown 拼装、复制、下载）属 M5，挂载点见
 * GenPanel.astro 注释与 [data-md-slot]；change 事件已在此统一收口，M5 钩在同一处。
 *
 * 显影走全站 [data-reveal]（BaseLayout 引导的 IntersectionObserver + CSS，
 * prefers-reduced-motion 直接显影，motion.ts / global.css 已处理）。
 */

interface OpenPop {
  trigger: HTMLElement;
  pop: HTMLElement;
  scope: HTMLElement | null;
}

import { STEAL_ITEMS } from './items';
import type { StealItem } from './items';

let active: OpenPop | null = null;

function closeActive(): void {
  if (!active) return;
  active.pop.removeAttribute('data-open');
  active.trigger.setAttribute('aria-expanded', 'false');
  active.scope?.classList.remove('is-pop-open');
  active = null;
}

/**
 * 浮层就地定位（computePosition + offset(6) + flip + shift(16) 的等价实现）：
 * 开启瞬间算一次坐标写 left/top，不做滚动跟踪（页面滚动时收起由交互自然完成）。
 */
function placePop(trigger: HTMLElement, pop: HTMLElement): void {
  const t = trigger.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const pw = pop.offsetWidth;
  const ph = pop.offsetHeight;
  // flip：下方放不下且上方更宽裕时上翻（offset 6 由 6px 间距体现）
  const spaceBelow = vh - t.bottom;
  const above = spaceBelow < ph + 12 && t.top > spaceBelow;
  const x = Math.min(Math.max(16, t.left), Math.max(16, vw - pw - 16)); // shift(16)
  const y = above ? t.top - ph - 6 : t.bottom + 6;
  // 视口坐标换算到 offsetParent（.st-src，position:relative）坐标系
  const base = pop.offsetParent?.getBoundingClientRect();
  pop.style.left = `${Math.round(x - (base?.left ?? 0))}px`;
  pop.style.top = `${Math.round(y - (base?.top ?? 0))}px`;
}

function openPop(trigger: HTMLElement): void {
  const pop = document.getElementById(trigger.dataset.popId ?? '');
  if (!pop) return;
  if (active?.trigger === trigger) return;
  closeActive();
  const scope = trigger.closest<HTMLElement>('[data-pop-scope]');
  pop.dataset.open = 'true';
  trigger.setAttribute('aria-expanded', 'true');
  scope?.classList.add('is-pop-open');
  placePop(trigger, pop);
  active = { trigger, pop, scope };
}

function togglePop(trigger: HTMLElement): void {
  if (active?.trigger === trigger) closeActive();
  else openPop(trigger);
}

function setupPopovers(): void {
  const triggers = document.querySelectorAll<HTMLElement>('[data-pop-trigger]:not([data-pop-init])');
  for (const trigger of triggers) {
    trigger.dataset.popInit = '1';

    // 仅鼠标悬停弹出；触屏走点按（click 切换）
    trigger.addEventListener('pointerenter', (event) => {
      if ((event as PointerEvent).pointerType === 'mouse') openPop(trigger);
    });
    trigger.addEventListener('pointerleave', (event) => {
      if ((event as PointerEvent).pointerType === 'mouse' && active?.trigger === trigger) closeActive();
    });
    trigger.addEventListener('click', () => togglePop(trigger));
    trigger.addEventListener('focus', () => openPop(trigger));
    trigger.addEventListener('blur', () => {
      if (active?.trigger === trigger) closeActive();
    });
  }
}

function setupChecklist(): void {
  const numEl = document.querySelector<HTMLElement>('[data-gen-num]');
  const emptyEl = document.querySelector<HTMLElement>('[data-gen-empty]');
  const slot = document.querySelector<HTMLElement>('[data-md-slot]');
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-m5="copy"]');
  const dlBtn = document.querySelector<HTMLButtonElement>('[data-m5="download"]');
  const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('[data-idea-cbx]:not([data-cbx-init])'));
  // astro:page-load 与模块直跑会让本函数执行两次：第二次 boxes 为空（全带 init 标记），
  // 若继续跑预勾选之后的 sync()，会把首次建立的勾选与面板状态覆盖回空（真机断言确诊）
  if (boxes.length === 0) return;
  const byN = new Map(STEAL_ITEMS.map((item) => [item.n, item]));
  const reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 导出 markdown 单块：条目号与模式名 / 大白话 / 出处行带档位 / 复制给 AI 段（GenPanel 规格） */
  const block = (item: StealItem): string =>
    [
      `## ${item.n} · ${item.title}`,
      '',
      item.plain,
      '',
      `出处：${item.source}（${item.level === 1 ? '论文原文核实' : '合理解读'}）`,
      '',
      '复制给 AI：',
      item.prompt,
    ].join('\n');

  /** 当前勾选（条目号升序）对应的条目清单 */
  const collect = (): StealItem[] =>
    boxes
      .filter((box) => box.checked)
      .map((box) => byN.get(box.dataset.ideaCbx ?? ''))
      .filter((item): item is StealItem => Boolean(item))
      .sort((a, b) => a.n.localeCompare(b.n));

  const sync = (): void => {
    const picked = collect();
    const n = picked.length;
    if (numEl) numEl.textContent = String(n);
    if (emptyEl) emptyEl.hidden = n > 0;
    const disabled = n === 0;
    for (const btn of [copyBtn, dlBtn]) {
      if (!btn) continue;
      btn.disabled = disabled;
      if (disabled) btn.removeAttribute('title');
    }
    if (!slot) return;
    if (n === 0) {
      slot.replaceChildren();
      const code = document.createElement('code');
      code.className = 'md-empty';
      code.dataset.genEmpty = '';
      code.textContent = '勾选左侧条目，这里逐条拼出可带走的清单';
      slot.append(code);
      return;
    }
    // 已有块复用、新块淡入、取消块淡出（brief §4；reduced-motion 直切）
    const texts = picked.map(block);
    const existing = Array.from(slot.querySelectorAll<HTMLElement>('.md-block'));
    texts.forEach((text, i) => {
      let el = existing[i];
      if (!el) {
        el = document.createElement('span');
        el.className = 'md-block';
        el.textContent = i === 0 ? text : `\n\n${text}`;
        slot.append(el);
        if (!reduceMotion) {
          el.animate(
            [
              { opacity: '0', transform: 'translateY(8px)' },
              { opacity: '1', transform: 'translateY(0)' },
            ],
            { duration: 240, easing: 'ease-out' },
          );
          const flash = document.createElement('span');
          flash.className = 'md-flash';
          el.append(flash);
          flash
            .animate([{ opacity: '1' }, { opacity: '0' }], { duration: 600, easing: 'ease-out' })
            .addEventListener('finish', () => flash.remove());
        }
      } else {
        if (el.textContent !== text) el.textContent = text;
      }
    });
    for (const el of existing.slice(texts.length)) {
      if (reduceMotion) {
        el.remove();
        continue;
      }
      el.animate([{ opacity: '1' }, { opacity: '0' }], { duration: 200, easing: 'ease-in' }).addEventListener(
        'finish',
        () => el.remove(),
      );
    }
  };

  for (const box of boxes) {
    box.dataset.cbxInit = '1';
    const row = box.closest<HTMLElement>('[data-idea-item]');
    const apply = (): void => { row?.classList.toggle('is-on', box.checked); };
    box.addEventListener('change', () => {
      apply();
      sync();
    });
    apply();
  }
  // 初始预勾选 01/04/13（视觉稿定稿口径：面板载入即有成果）
  for (const n of ['01', '04', '13']) {
    const box = boxes.find((b) => b.dataset.ideaCbx === n);
    if (box) {
      box.checked = true;
      box.closest<HTMLElement>('[data-idea-item]')?.classList.add('is-on');
    }
  }
  sync();

  // 复制：导出全文进剪贴板，按钮就地切「已复制」两秒回弹（与带走物复制同口径）
  copyBtn?.addEventListener('click', () => {
    const md = collect().map(block).join('\n\n');
    navigator.clipboard
      ?.writeText(md)
      .then(() => {
        copyBtn.textContent = '已复制';
        window.setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
      })
      .catch(() => { /* 剪贴板不可用：静默，mdview 内容仍可手选 */ });
  });
  // 下载：导出全文存 cordis-steal-this.md（GenPanel 规格）
  dlBtn?.addEventListener('click', () => {
    const md = collect().map(block).join('\n\n');
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cordis-steal-this.md';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function initPage(): void {
  setupPopovers();
  setupChecklist();
}

// 守卫浏览器环境：本模块只应经 <script> 标签打包到客户端，防误引入 SSR。
if (typeof document !== 'undefined') {
  // 全局收口只挂一次（模块级），换页后 DOM 更新、active 失效由 closeActive 兜底
  document.addEventListener('pointerdown', (event) => {
    const target = event.target as Node;
    if (active && !active.trigger.contains(target) && !active.pop.contains(target)) closeActive();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active) {
      const trigger = active.trigger;
      closeActive();
      trigger.focus();
    }
  });

  // ClientRouter：首次加载与每次换页后重建
  document.addEventListener('astro:page-load', initPage);
  initPage();
}
