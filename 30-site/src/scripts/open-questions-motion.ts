/**
 * 存疑与答问页 · 页级动效（动效强度 4，全站最安静的一页）。
 *
 * 分镜注记（50-design/04-DesignRead-定稿.md 第 2 节本页 brief + 视觉稿设计说明）：
 *   1. 时效声明横幅：全页唯一编排时刻，进视口淡入一次（translateY 8px + opacity，400ms）；
 *      IO 不可用或任何失败路径都有兜底，横幅最终可见（06-响应式实测 §246 口径）。
 *   2. 徽标依据浮层：用户触发（hover 或键盘聚焦），淡入轻浮 8px，定位走
 *      @floating-ui/dom（实现在 BadgeSpecimens.astro，不经过本模块）。
 *   3. 其余全部静态呈排：存疑台账、答读者问、带走物不设入场动效
 *      （禁令 9：非用户触发动效每页只允许一个编排时刻）。
 *
 * 铁律 1：只动画 transform 与 opacity；无 window scroll 监听，进视口判定走 IntersectionObserver。
 * 铁律 2：gsap.matchMedia 包裹 prefers-reduced-motion 降级，reduce 分支直出终态、内容不缺失。
 * 铁律 5：场景经 registerScene 暴露 play/pause/restart；蓝图与本页 brief 未安排可见控制条
 *         （横幅为一次性 400ms 显影，非可叙事场景，06 §7/§11 亦裁定此类显影无重播对象），
 *         故控制接口为程序化暴露。
 */
import { ensureGsap, gsap, registerScene } from './motion';

function initTimeliness(): void {
  const banner = document.querySelector<HTMLElement>('[data-oq-banner]');
  if (!banner || banner.dataset.oqBannerInit) return;
  banner.dataset.oqBannerInit = '1';
  ensureGsap();

  let tl: gsap.core.Timeline | null = null;
  let io: IntersectionObserver | null = null;
  let timer = 0;

  const mm = gsap.matchMedia();

  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      reduced: '(prefers-reduced-motion: reduce)',
    },
    (mmCtx) => {
      const reduced = (mmCtx.conditions ?? {}) as Record<string, boolean | undefined>;

      const reveal = (): void => {
        window.clearTimeout(timer);
        io?.disconnect();
        io = null;
        if (tl) tl.play();
        else banner.classList.add('is-in');
      };

      /* ── 降级分支：直出终态，内容零缺失（CSS 侧另有 @media reduce 强制可见兜底） ── */
      if (reduced.reduced === true) {
        gsap.set(banner, { opacity: 1, y: 0 });
        return;
      }

      /* ── 全动效分支：进视口淡入一次，8px 位移 + 400ms（蓝图 120-125 口径） ── */
      gsap.set(banner, { opacity: 0, y: 8 });
      tl = gsap
        .timeline({ paused: true })
        .to(banner, { opacity: 1, y: 0, duration: 0.4, ease: 'power1.out' });

      if (typeof IntersectionObserver === 'undefined') {
        tl.progress(1);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            reveal();
            break;
          }
        },
        { threshold: 0.15 },
      );
      io.observe(banner);
      // 兜底：任何失败路径都保证横幅最终可见（蓝图 arm() 的 setTimeout 同款）
      timer = window.setTimeout(reveal, 1600);
    },
  );

  registerScene('oq-timeliness', {
    play: () => tl?.play(),
    pause: () => tl?.pause(),
    restart: () => tl?.progress(0).play(),
    destroy: () => {
      window.clearTimeout(timer);
      io?.disconnect();
      io = null;
      tl = null;
      mm.revert();
    },
  });
}

// ClientRouter：首次加载与每次换页后重建；换页前由 BaseLayout 的 destroyScenes 触发 destroy。
// 守卫浏览器环境：本模块只应经 <script> 标签打包到客户端，这里防误引入 SSR。
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initTimeliness);
  initTimeliness();
}
