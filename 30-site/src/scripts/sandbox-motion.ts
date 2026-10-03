/**
 * /sandbox「六拍」拍数指示驱动（DesignRead v2 §5 第 1、2 条；沙盒任务书第 ④ 条）。
 *
 * SceneGuide 两件套（右侧竖排圆点 + 顶端进度线）挂在六拍分镜带的粘性右栏，
 * 滚动经过六格时逐拍点亮：已过拍点亮为墨 .70、当前拍实心放大并显拍名，
 * 进度线 scaleX 随六格行程增长。驱动量是分镜带的滚动进度——引擎本体
 * （画布时间轴、撤销栈、控制条四钮）仍属 M5.5，接入后改由引擎时间轴
 * onUpdate 调同一 handle（bindSceneGuide().update(index, progress) 签名不变）。
 *
 * 铁律 1：只写 class 翻转与 transform:scaleX（都在 scene-guide.ts 内部），
 *         无 window scroll 监听，滚动判定走 ScrollTrigger。
 * 铁律 2：gsap.matchMedia 包裹降级——prefers-reduced-motion 分支不建滚动
 *         触发，直出末拍（静态分镜带的阅读终态），内容零缺失。
 * 铁律 5：场景经 registerScene('sandbox-board') 暴露 play / pause / restart；
 *         本页暂无可见控件绑定它（沙盒控制条四钮随 M5.5 引擎接管），
 *         restart = 回到分镜带行程起点让滚动重走（导航动作，非滚动监听）。
 */
import { gsap, ScrollTrigger, ensureGsap, registerScene } from './motion';
import { bindSceneGuide } from './scene-guide';

const SHOT_COUNT = 6;

type BoardApi = { play(): void; pause(): void; restart(): void };

let ctx: ReturnType<typeof gsap.context> | null = null;

function bind(root: HTMLElement): void {
  if (root.dataset.sandboxMotionInit) return;
  root.dataset.sandboxMotionInit = '1';
  ensureGsap();

  const guide = bindSceneGuide(root);
  const cells = root.querySelector<HTMLElement>('[data-sandbox-cells]');
  if (!guide || !cells) return;

  let api: BoardApi = { play() {}, pause() {}, restart() {} };

  ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (mmCtx) => {
        const cond = (mmCtx.conditions ?? {}) as Record<string, boolean | undefined>;

        /* ── 降级分支：直出末拍，指示器与静态分镜带的阅读终态一致（铁律 2） ── */
        if (cond.reduced === true) {
          guide.update(SHOT_COUNT - 1, 1);
          return;
        }

        /* ── 全动效分支：分镜带滚动进度 → 拍序与进度线 ── */
        guide.update(0, 0);
        const st = ScrollTrigger.create({
          trigger: cells,
          start: 'top 78%',
          end: 'bottom 55%',
          onUpdate: (self) => {
            const p = self.progress;
            guide.update(Math.min(SHOT_COUNT - 1, Math.floor(p * SHOT_COUNT)), p);
          },
        });

        api = {
          play: () => st.enable(),
          pause: () => st.disable(),
          restart: () => {
            st.enable();
            window.scrollTo({ top: Math.ceil(st.start) + 2, behavior: 'smooth' });
          },
        };
      },
    );
  }, root);

  registerScene('sandbox-board', {
    play: () => api.play(),
    pause: () => api.pause(),
    restart: () => api.restart(),
    destroy: () => {
      ctx?.revert();
      ctx = null;
    },
  });
}

export function initSandboxMotion(): void {
  if (typeof document === 'undefined') return;
  const root = document.querySelector<HTMLElement>('[data-sandbox-board]');
  if (root) bind(root);
}

// ClientRouter：首次加载与每次换页后重建；换页前由 destroyScenes（BaseLayout）
// 触发 revert。守卫浏览器环境：本模块只应经 <script> 标签打包到客户端。
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initSandboxMotion);
  document.addEventListener('astro:before-swap', () => {
    ctx?.revert();
    ctx = null;
  });
  initSandboxMotion();
}
