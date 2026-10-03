/**
 * 实录页三枚数字卡场景：进视口 count-up 一次，画完即完全静止。
 * 页级动效 5 档（50-design/07-DesignRead-v2.md §1：非首页非沙盒页），
 * 禁钉住禁擦洗，只做进视口一次性显影；本页其余入场走 [data-reveal]
 * （motion.ts 的 IntersectionObserver 通路），题注与尾注为零动效 release zone。
 *
 * 铁律 1：计数文本由 onUpdate 改写 textContent（内容写入而非样式动画），
 *         数字可见性只动 opacity（autoAlpha）；不挂滚动事件回调，
 *         进视口判定走 ScrollTrigger（铁律 1 白名单通路）。
 * 铁律 2：整段动效包在 gsap.matchMedia 里；prefers-reduced-motion 分支直出
 *         静态终态（HTML 即终值，不隐藏不改写，内容零缺失），播放与暂停置灰。
 * 铁律 5：经 registerScene('stats') 暴露 play / pause / restart，SceneControls 绑定。
 *
 * HTML 直出终值（4,000+ / 7 年 / 241,568）：无 JS 或降级时内容完整；
 * 动效分支在时间轴构建前才隐藏终值并从 0 起数，避免「先见终值再归零」闪烁。
 */
import { gsap, ScrollTrigger, ensureGsap, registerScene } from './motion';

type StatsApi = { play(): void; pause(): void; restart(): void };

let ctx: ReturnType<typeof gsap.context> | null = null;

function formatCounter(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

function bind(root: HTMLElement): void {
  if (root.dataset.statsInit) return;
  root.dataset.statsInit = '1';
  ensureGsap();

  const counters = Array.from(root.querySelectorAll<HTMLParagraphElement>('[data-count]'));
  const playBtn = root.querySelector<HTMLButtonElement>('[data-ctl="play"]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-ctl="pause"]');
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-ctl="restart"]');

  let api: StatsApi = { play() {}, pause() {}, restart() {} };

  ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (mmCtx) => {
        const cond = (mmCtx.conditions ?? {}) as Record<string, boolean | undefined>;

        /* ── 降级分支：直出静态终态（HTML 已是终值），控制条置灰 ─────────── */
        if (cond.reduced === true) {
          if (playBtn) {
            playBtn.disabled = true;
            playBtn.title = '降级模式：数字为静态终态';
          }
          if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.title = '降级模式：数字为静态终态';
          }
          if (restartBtn) {
            restartBtn.disabled = true;
            restartBtn.title = '降级模式：数字为静态终态';
          }
          api = { play() {}, pause() {}, restart() {} };
          return;
        }

        /* ── 动效分支：先藏终值，进视口从 0 起数，数完即静止 ─────────────── */
        const proxies = counters.map((el) => ({
          el,
          target: Number(el.dataset.target ?? '0'),
          suffix: el.dataset.suffix ?? '',
          v: 0,
        }));

        gsap.set(counters, { autoAlpha: 0 });

        const tl = gsap.timeline({ paused: true });
        for (const p of proxies) {
          tl.to(
            p,
            {
              v: p.target,
              duration: 1.3,
              ease: 'power2.out',
              onUpdate: () => {
                p.el.textContent = formatCounter(p.v) + p.suffix;
              },
            },
            0,
          );
        }
        tl.to(counters, { autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: 'none' }, 0.15);

        const st = ScrollTrigger.create({
          trigger: root,
          start: 'top 78%',
          once: true,
          onEnter: () => {
            if (tl.progress() < 1) tl.play();
          },
        });
        // 深链或刷新落在数字卡之下时直出终态，内容不缺失（st.scroll 为
        // ScrollTrigger 自记的当前滚动位，不经 window）
        if (st.scroll() >= st.start) tl.progress(1);

        api = {
          play: () => tl.play(),
          pause: () => tl.pause(),
          restart: () => tl.restart(),
        };
      },
    );
  }, root);

  // 控制条绑定（铁律 5）：按钮始终指向当前分支的播放 API
  playBtn?.addEventListener('click', () => api.play());
  pauseBtn?.addEventListener('click', () => api.pause());
  restartBtn?.addEventListener('click', () => api.restart());

  registerScene('stats', {
    play: () => api.play(),
    pause: () => api.pause(),
    restart: () => api.restart(),
    destroy: () => {
      ctx?.revert();
      ctx = null;
    },
  });
}

export function initStatsMotion(): void {
  const root = document.querySelector<HTMLElement>('[data-stats]');
  if (root) bind(root);
}

// ClientRouter：首次加载与每次换页后重建；换页前由 destroyScenes 与上方监听触发 revert。
// 守卫浏览器环境：本模块只应经 <script> 标签打包到客户端，这里防误引入 SSR。
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initStatsMotion);
  document.addEventListener('astro:before-swap', () => {
    ctx?.revert();
    ctx = null;
  });
  initStatsMotion();
}
