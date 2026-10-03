/**
 * /ideas 页级动效（页级强度 5，50-design/04-DesignRead-定稿.md 第 2 节 /ideas brief）。
 *
 * - 节间轻显影：交给 motion.ts 的 [data-reveal]（IntersectionObserver，无 scroll 监听），
 *   本脚本不另做入场编排。
 * - 演示 03「万物过前台」：全站唯一自动循环（定稿分层规则 3 例外条款）。
 *   GSAP MotionPath 驱动两类方块沿同一条路径流经柜台，落账时账本以 opacity 添一行；
 *   进视口开播（ScrollTrigger onToggle）、滚出视口即暂停，不与滚动耦合。
 * - 演示 01 / 02「撤销堆栈」「生命周期状态机」：占位壳，完整交互级本体属 M5
 *   （PRD 里程碑表；演示取舍 05）。控制条置灰并注册占位场景，统一 play / pause /
 *   restart 接口（铁律 5）。
 *
 * 铁律 1：循环只动画 transform 与 opacity。
 * 铁律 2：gsap.matchMedia 包裹 prefers-reduced-motion 降级（循环定格首帧，
 *         重播按钮改「过账终态 / 回到首帧」淡切（只动 opacity），内容不缺失）。
 */
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { gsap, ScrollTrigger, ensureGsap, registerScene } from './motion';

let motionPathReady = false;

function ensurePlugins(): void {
  ensureGsap();
  if (!motionPathReady) {
    gsap.registerPlugin(MotionPathPlugin);
    motionPathReady = true;
  }
}

type Demo03Api = { play(): void; pause(): void; restart(): void };

/** 方块静止位，与 Demo03Scene.astro 的 markup transform 一致（x/y = 几何中心） */
const TRAVELER_HOME = {
  effect: { x: 194, y: 183 },
  register: { x: 336, y: 209 },
} as const;

let ctx: ReturnType<typeof gsap.context> | null = null;

/* ── 演示 01 / 02：占位场景（本体属 M5） ─────────────────────────────── */

function bindPlaceholderScene(id: string): void {
  const controls = document.querySelector<HTMLElement>(`[data-scene-controls="${id}"]`);
  if (!controls || controls.dataset.placeholderInit) return;
  controls.dataset.placeholderInit = '1';

  for (const btn of Array.from(controls.querySelectorAll<HTMLButtonElement>('[data-ctl]'))) {
    btn.disabled = true;
    btn.title = '演示本体属 M5 交付，当前为静帧与分镜';
  }
  registerScene(id, {
    play() { /* 占位：静帧无可播放 */ },
    pause() { /* 同上 */ },
    restart() { /* 同上 */ },
    destroy() { /* 占位场景无动画资源 */ },
  });
}

/* ── 演示 03：万物过前台（自动循环） ─────────────────────────────────── */

function bindDemo03(root: HTMLElement): void {
  if (root.dataset.demo03Init) return;
  root.dataset.demo03Init = '1';
  ensurePlugins();

  const svg = root.querySelector<SVGSVGElement>('[data-d3-svg]');
  const route = svg?.querySelector<SVGPathElement>('[data-d3-route]') ?? null;
  const effect = svg?.querySelector<SVGGElement>('[data-d3-traveler="effect"]') ?? null;
  const register = svg?.querySelector<SVGGElement>('[data-d3-traveler="register"]') ?? null;
  const rowEffect = svg?.querySelector<SVGGElement>('[data-d3-row="effect"]') ?? null;
  const rowRegister = svg?.querySelector<SVGGElement>('[data-d3-row="register"]') ?? null;
  const controls = root.querySelector('[data-scene-controls="ideas-demo03"]');
  const playBtn = controls?.querySelector<HTMLButtonElement>('[data-ctl="play"]') ?? null;
  const pauseBtn = controls?.querySelector<HTMLButtonElement>('[data-ctl="pause"]') ?? null;
  const restartBtn = controls?.querySelector<HTMLButtonElement>('[data-ctl="restart"]') ?? null;
  if (!svg || !route || !effect || !register || !rowEffect || !rowRegister || !controls
    || !playBtn || !pauseBtn || !restartBtn) return;

  let api: Demo03Api = { play() {}, pause() {}, restart() {} };

  ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (mmCtx) => {
        const cond = (mmCtx.conditions ?? {}) as Record<string, boolean | undefined>;

        /* ── 降级分支：定格首帧；重播按钮改「过账终态 / 回到首帧」淡切（只动 opacity） ── */
        if (cond.reduced === true) {
          // 方块保持 markup transform 的静止位（首帧），不动位移
          playBtn.disabled = true;
          pauseBtn.disabled = true;
          playBtn.title = '降级模式：循环定格在首帧';
          pauseBtn.title = '降级模式：循环定格在首帧';

          // 终态 = 两类方块都已过账：账行显影、方块退为淡影；无任何位移
          const rTl = gsap.timeline({ paused: true, defaults: { duration: 0.4, ease: 'power1.inOut' } });
          rTl.to([rowEffect, rowRegister], { autoAlpha: 1 }, 0)
            .to([effect, register], { autoAlpha: 0.3 }, 0);

          let settled = false;
          const toggle = (): void => {
            if (settled) rTl.reverse();
            else rTl.play();
            settled = !settled;
            restartBtn.textContent = settled ? '回到首帧' : '过账终态';
          };
          restartBtn.textContent = '过账终态';

          api = {
            play() { /* 静态首帧无可播放 */ },
            pause() { /* 同上 */ },
            restart: toggle,
          };
          return;
        }

        /* ── 全动效分支：循环时间轴，进视口开播、滚出即停 ─────────────────── */
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        playBtn.title = '';
        pauseBtn.title = '';

        gsap.set(effect, { x: TRAVELER_HOME.effect.x, y: TRAVELER_HOME.effect.y, autoAlpha: 1 });
        gsap.set(register, { x: TRAVELER_HOME.register.x, y: TRAVELER_HOME.register.y, autoAlpha: 1 });
        gsap.set([rowEffect, rowRegister], { autoAlpha: 0 });

        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.7, defaults: { ease: 'power1.inOut' } });
        // 效应 上路：沿同一条路径流经柜台，入账隐没，账本落一行
        tl.to(effect, { motionPath: { path: route }, duration: 5, ease: 'none' }, 0);
        tl.to(effect, { autoAlpha: 0, duration: 0.35 }, 5);
        tl.fromTo(rowEffect, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 5.3);
        // 登记 排到队首，再走同一条路（两半机制在同一座柜台咬合）
        tl.to(register, { x: TRAVELER_HOME.effect.x, y: TRAVELER_HOME.effect.y, duration: 0.7 }, 5.2);
        tl.to(register, { motionPath: { path: route }, duration: 5, ease: 'none' }, 6);
        tl.to(register, { autoAlpha: 0, duration: 0.35 }, 11);
        tl.fromTo(rowRegister, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 11.3);
        tl.to({}, { duration: 0.9 }, 11.6); // 账面停留
        // 清账重来：方块回位、账行翻页
        tl.set([rowEffect, rowRegister], { autoAlpha: 0 }, 12.5);
        tl.set(effect, { x: TRAVELER_HOME.effect.x, y: TRAVELER_HOME.effect.y, autoAlpha: 0 }, 12.5);
        tl.set(register, { x: TRAVELER_HOME.register.x, y: TRAVELER_HOME.register.y, autoAlpha: 0 }, 12.5);
        tl.to([effect, register], { autoAlpha: 1, duration: 0.45 }, 12.6);

        tl.pause(); // 进视口再开播
        ScrollTrigger.create({
          trigger: root,
          start: 'top 85%',
          end: 'bottom 20%',
          onToggle: (self) => {
            if (self.isActive) tl.play();
            else tl.pause();
          },
        });

        api = {
          play: () => tl.play(),
          pause: () => tl.pause(),
          restart: () => tl.restart(),
        };
      },
    );
  }, root);

  // 控制条绑定（铁律 5）：按钮始终指向当前分支的播放 API
  playBtn.addEventListener('click', () => api.play());
  pauseBtn.addEventListener('click', () => api.pause());
  restartBtn.addEventListener('click', () => api.restart());

  registerScene('ideas-demo03', {
    play: () => api.play(),
    pause: () => api.pause(),
    restart: () => api.restart(),
    destroy: () => {
      ctx?.revert();
      ctx = null;
    },
  });

  // 字体加载改变版面高度，刷新视口触发测量
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/* ── 页级初始化 ─────────────────────────────────────────────────────── */

export function initIdeasMotion(): void {
  if (!document.querySelector('[data-ideas-page]')) return;
  bindPlaceholderScene('ideas-demo01');
  bindPlaceholderScene('ideas-demo02');
  const demo03 = document.querySelector<HTMLElement>('[data-demo03]');
  if (demo03) bindDemo03(demo03);
}

// ClientRouter：首次加载与每次换页后重建；换页前由 destroyScenes 触发 revert
// （BaseLayout 全局脚本），这里再兜底一次，与 hero-motion.ts 同款。
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initIdeasMotion);
  document.addEventListener('astro:before-swap', () => {
    ctx?.revert();
    ctx = null;
  });
  initIdeasMotion();
}
