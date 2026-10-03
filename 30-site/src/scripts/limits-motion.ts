/**
 * /limits 页级动效（页级强度 4，克制本身是论点；50-design/04-DesignRead-定稿.md 第 2 节 /limits brief）。
 *
 * 全页唯一编排时刻：「什么时候别用」账页对照表（[data-ledger]）进视口时五行逐条显影，
 * 每行 stagger 60ms、位移 12px 一次性上浮，「适用」focal 行压轴（其实印加粗是静态排版，不参与动画）。
 * 常规节不在这里动：走全站 [data-reveal] 轻显影，limits.astro 里以页面级覆盖把位移归零，
 * 降为纯透明度交叉淡（视觉稿 .fx 同口径：纯 opacity、无位移）。
 *
 * 铁律 1：只动 transform 与 opacity；无 window scroll 监听（进视口判定走 ScrollTrigger）。
 * 铁律 2：编排动效用 gsap.matchMedia 包裹 prefers-reduced-motion 分支，降级定格终态、内容不缺失。
 * 铁律 5：对照表场景经 registerScene('limits-ledger') 暴露 play / pause / restart。
 *         它是进视口一次性显影，按视觉稿不设可见控制条，接口经场景注册表暴露。
 */
import { gsap, ScrollTrigger, ensureGsap, registerScene } from './motion';

type LedgerApi = { play(): void; pause(): void; restart(): void };

let ctx: ReturnType<typeof gsap.context> | null = null;

function bind(root: HTMLElement): void {
  if (root.dataset.limitsMotionInit) return;
  root.dataset.limitsMotionInit = '1';
  ensureGsap();

  const ledger = root.querySelector<HTMLElement>('[data-ledger]');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-ledger-row]'));
  if (!ledger || rows.length === 0) return;

  let api: LedgerApi = { play() {}, pause() {}, restart() {} };

  ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (mmCtx) => {
        const cond = (mmCtx.conditions ?? {}) as Record<string, boolean | undefined>;

        /* ── 降级分支：跳过逐条显影，五行直出终态，内容零缺失（铁律 2） ── */
        if (cond.reduced === true) {
          gsap.set(rows, { autoAlpha: 1, y: 0 });
          return;
        }

        /* ── 全动效分支：进视口一次性逐条显影（stagger 60ms、上浮 12px） ── */
        gsap.set(rows, { autoAlpha: 0, y: 12 });
        const tl = gsap.timeline({ paused: true });
        tl.to(rows, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: 'power1.out',
          stagger: 0.06,
        });

        ScrollTrigger.create({
          trigger: ledger,
          start: 'top 82%',
          once: true,
          onEnter: () => tl.play(),
        });

        api = {
          play: () => tl.play(),
          pause: () => tl.pause(),
          restart: () => tl.restart(),
        };
      },
    );
  }, root);

  registerScene('limits-ledger', {
    play: () => api.play(),
    pause: () => api.pause(),
    restart: () => api.restart(),
    destroy: () => {
      ctx?.revert();
      ctx = null;
    },
  });
}

export function initLimitsMotion(): void {
  if (typeof document === 'undefined') return;
  const root = document.querySelector<HTMLElement>('[data-limits]');
  if (root) bind(root);
}

// ClientRouter：首次加载与每次换页后重建；换页前由 destroyScenes（BaseLayout）触发 revert。
// 守卫浏览器环境：本模块只应经 <script> 标签打包到客户端，这里防误引入 SSR。
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initLimitsMotion);
  document.addEventListener('astro:before-swap', () => {
    ctx?.revert();
    ctx = null;
  });
  initLimitsMotion();
}
