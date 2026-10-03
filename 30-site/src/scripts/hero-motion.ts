/**
 * 首页五拍滚动叙事（页级动效强度 9，全站动效天花板；v2 §1）。
 * 拍点依据 50-design/07-DesignRead-v2.md §5 与 10-docs/02-技术方案.md 第 4 节。
 * v2 §5 第 3 条：场景静止初始帧必须是完整「装好」画面：默认帧即五积木全亮
 * 立于基座、依赖线已画，禁止空白或半透明开场；因此拍一不再是「从无到有」，
 * 而是对完整画面的整体呈现（推近聚焦）。
 *
 *   拍一 0-20%   装上：完整场景以基座为原点整体推近 1.06，全员实墨（焦点=全体）
 *   拍二 20-45%  文案切「拔掉它」，焦点移交中央「数据库驱动」：抬起抽出基座并
 *                scale 1.06，其余积木与依赖线降为 .3 墨
 *   拍三 45-70%  焦点移交 04/05（scale 1.06、组透明度提回 1）：两块依次熄灭
 *                （内层 lit→off 切到墨 .14 并微微下沉，熄灭态是叙事本体，不再
 *                叠加组级降墨），依赖线虚化断裂（.12 + 虚线描边，描边例外机制）；
 *                图注换实墨点名哪两块已连锁熄灭
 *   拍四 70-95%  焦点回到提供者：03 归位（scale 1.06），依赖线复原重画（回实墨），
 *                04/05 依次复明；图注随之改写
 *   拍五 95-100% 落定：全员回实墨、scale 回 1，标题换回全文沉降落定
 *
 * v2 §5 第 4 条焦点跟随：每拍由 scale 1.06 + 实墨标出主体，非当前拍元素降 .3 墨，
 * 视觉焦点跟着滚轮走；接线见 SceneGuide 组件（右侧竖排拍点 + 顶部进度线）。
 *
 * 叙事文案位（04 定稿：hero 文本元素至多四个 = kicker、标题、副文、图注）：
 *   标题 h1 拍二切「拔掉它」、拍五换回全文落定；图注在拍三/拍四改写。
 *   换字不用 tl.call：callback 正反向穿越都会触发，倒滚会把旧字留在上一拍；
 *   改为按时间轴播放头所在区间映射文案，换字只发生在淡出后的不可见窗口，
 *   正滚倒滚都成立。fadeSwap 的淡出/淡入窗口与 SWAP_* 换字点一一对应。
 *
 * 主时间轴 scrub 0.5 配 pin；pin 行程按 v2 §3「首页 ≤6000px（含 pin 区）」压缩：
 *   桌面 +=1200（原 2600），<960px 不 pin 短程擦洗 +=900。
 * 擦洗场景的「重播」= 回到钉住起点让滚动重走（window.scrollTo 是重播的导航动作，
 * 不是滚动监听，不受铁律 1 约束）。prefers-reduced-motion 跳过钉住擦洗直出终态
 * （即默认帧本身），重播按钮改「终态与拔除中态」淡切；拍数指示器在降级分支
 * 直出末拍满进度。<960px 塌单栏后场景会滚出视口，改不 pin 的短程擦洗，
 * 叙事不缺失只压缩行程。
 */
import { gsap, ScrollTrigger, ensureGsap, registerScene } from './motion';
import { bindSceneGuide } from './scene-guide';

type HeroApi = { play(): void; pause(): void; restart(): void };

let ctx: ReturnType<typeof gsap.context> | null = null;

/* ── 叙事文案位与换字点（时间轴总时长 100 = 拍点百分比；换字点落在淡出窗口中点） ── */
const BEAT_WORD = '拔掉它';
const NOTE_BASE = '积木与依赖';
const NOTE_OFF = '04 查询插件、05 聊天插件连锁熄灭';
const NOTE_BACK = '已复明，原样退回';
const SWAP_HEADLINE_IN = 21.5;   // 淡出 20→21.4，淡入 21.6→23
const SWAP_HEADLINE_BACK = 96.5; // 淡出 95→96.4，淡入 96.6→98（含沉降，即「标题落定」）
const SWAP_NOTE_OFF = 53.5;      // 淡出 52→53.4，淡入 53.6→55
const SWAP_NOTE_BACK = 85.5;     // 淡出 84→85.4，淡入 85.6→87

/** 播放头（0-100）→ 拍序（0 起），供拍数指示器点亮 */
function beatIndex(t: number): number {
  return t < 20 ? 0 : t < 45 ? 1 : t < 70 ? 2 : t < 95 ? 3 : 4;
}

/** 淡出、留 0.2 的不可见窗、淡入（scrub 可逆；换字由区间映射在窗口内完成）。
 *  settle=true 时淡入带 6px 沉降，只动 transform 与 opacity（铁律 1）。 */
function fadeSwap(tl: gsap.core.Timeline, at: number, el: Element, settle = false): void {
  tl.to(el, { autoAlpha: 0, duration: 1.4, ease: 'none' }, at);
  if (settle) {
    tl.fromTo(
      el,
      { y: 6 },
      { y: 0, autoAlpha: 1, duration: 1.4, ease: 'power2.out', immediateRender: false },
      at + 1.6,
    );
  } else {
    tl.to(el, { autoAlpha: 1, duration: 1.4, ease: 'none' }, at + 1.6);
  }
}

function bind(root: HTMLElement): void {
  if (root.dataset.heroInit) return;
  root.dataset.heroInit = '1';
  ensureGsap();

  const svg = root.querySelector<SVGSVGElement>('[data-hero-svg]');
  const headline = root.querySelector<HTMLElement>('[data-hero-headline]');
  const note = root.querySelector<HTMLElement>('[data-hero-note]');
  const controls = root.querySelector('[data-scene-controls]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-ctl="play"]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-ctl="pause"]');
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-ctl="restart"]');
  if (!svg || !headline || !note || !controls || !playBtn || !pauseBtn || !restartBtn) return;

  /* 拍数指示器 + 场景进度线（v2 §5 第 1、2 条，钉住场景必配） */
  const guide = bindSceneGuide(root);

  const block = (n: string) => svg.querySelector<SVGGElement>(`[data-block="${n}"]`);
  const part = (n: string, selector: string) => block(n)?.querySelector(selector) ?? null;
  const blockEls = Array.from(svg.querySelectorAll<SVGGElement>('[data-block]'))
    .sort((a, b) => (a.dataset.block ?? '').localeCompare(b.dataset.block ?? ''));
  const depGroup = svg.querySelector('[data-dep]');
  const depPaths = Array.from(svg.querySelectorAll<SVGPathElement>('[data-dep-path]'));
  if (!blockEls.length || !depGroup || depPaths.length === 0) return;
  const others = (focus: string[]): SVGGElement[] =>
    blockEls.filter((el) => !focus.includes(el.dataset.block ?? ''));

  /* 标题换字的基准全文在初始化时从 SSR 标记捕获，不另存第二份文案 */
  const titleHTML = headline.innerHTML;

  /* ── 叙事文案映射：按播放头区间换字，正反向滚动都成立 ─────────────────── */
  let headlineIsTitle = true;
  let noteShowing = 0;
  const applyBeatText = (t: number): void => {
    const wantTitle = t < SWAP_HEADLINE_IN || t >= SWAP_HEADLINE_BACK;
    if (wantTitle !== headlineIsTitle) {
      headlineIsTitle = wantTitle;
      headline.innerHTML = wantTitle ? titleHTML : BEAT_WORD;
    }
    const idx = t < SWAP_NOTE_OFF ? 0 : t < SWAP_NOTE_BACK ? 1 : 2;
    if (idx !== noteShowing) {
      noteShowing = idx;
      note.textContent = [NOTE_BASE, NOTE_OFF, NOTE_BACK][idx];
      /* 拍三的信息承担者按 04 熄灭态裁定换正文墨（实墨），复明拍随改写回落 */
      note.classList.toggle('is-body', idx === 1);
    }
  };

  /* 标题与「拔掉它」行数不同，换字会造成栏内跳版：用标题在场时的实测高度锁
     min-height（只在标题在场时测量；字体加载与视口变化经 ScrollTrigger.refresh
     重测）。min-height 只兜底不裁切，测小了内容仍完整。 */
  const lockHeadline = (): void => {
    if (headlineIsTitle) headline.style.minHeight = `${headline.offsetHeight}px`;
  };
  lockHeadline();

  /* 每个分支各自布置初始态、各自的播放 API；matchMedia 翻转时 revert 后重建 */
  let api: HeroApi = { play() {}, pause() {}, restart() {} };

  ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        full: '(prefers-reduced-motion: no-preference) and (min-width: 961px)',
        flow: '(prefers-reduced-motion: no-preference) and (max-width: 960px)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (mmCtx) => {
        const cond = (mmCtx.conditions ?? {}) as Record<string, boolean | undefined>;
        const reduced = cond.reduced === true;
        const pinned = cond.full === true;

        /* ── 降级分支：跳过钉住擦洗直出终态，内容零缺失（铁律 2） ─────────── */
        if (reduced) {
          /* 从动效分支切过来时可能停在叙事中段，先复位文案位与完整画面
             （终态 = 默认帧：五积木全亮、依赖线已画、全员实墨、scale 1） */
          headlineIsTitle = false;
          noteShowing = -1;
          applyBeatText(0);
          headline.style.minHeight = '';

          gsap.set(blockEls, { y: 0, autoAlpha: 1, scale: 1 });
          gsap.set(svg, { scale: 1 });
          depPaths.forEach((p) => gsap.set(p, { strokeDasharray: 'none', strokeDashoffset: 0 }));
          gsap.set(depGroup, { autoAlpha: 1 });
          playBtn.disabled = true;
          pauseBtn.disabled = true;
          playBtn.title = '降级模式：场景为静态终态';
          pauseBtn.title = '降级模式：场景为静态终态';

          // 指示器直出末拍满进度，与静态终态一致（scene-guide.ts 降级口径）
          guide?.update(beatIndex(100), 1);

          // 重播按钮改「终态与拔除中态」淡切：只动 opacity，不做大位移（铁律 2）。
          // 拔除中态是降级分支的局部演示，拍数指示器保持末拍不回拨。
          const lit4 = part('04', '.block-lit');
          const lit5 = part('05', '.block-lit');
          const off4 = part('04', '.block-off');
          const off5 = part('05', '.block-off');
          let mid = false;
          const rTl = gsap.timeline({ paused: true, defaults: { duration: 0.45, ease: 'power1.inOut' } });
          if (lit4 && lit5 && off4 && off5) {
            rTl.to([lit4, lit5], { autoAlpha: 0 }, 0)
              .to([off4, off5], { autoAlpha: 1 }, 0)
              .to(depGroup, { autoAlpha: 0.12 }, 0)
              .to(others(['04', '05']), { autoAlpha: 0.3 }, 0);
          }
          restartBtn.disabled = false;
          restartBtn.textContent = '拔除中态';
          const toggleMid = (): void => {
            if (rTl.progress() === 0 || rTl.progress() === 1) {
              if (mid) rTl.reverse();
              else rTl.play();
              mid = !mid;
            } else if (mid) {
              rTl.reverse();
              mid = false;
            } else {
              rTl.play();
              mid = true;
            }
            restartBtn.textContent = mid ? '回到终态' : '拔除中态';
            /* 拔除中态的信息承担者：图注换正文墨点名连锁熄灭的两块 */
            note.textContent = mid ? NOTE_OFF : NOTE_BASE;
            note.classList.toggle('is-body', mid);
          };

          api = {
            play() { /* 静态终态无可播放，空实现以维持统一接口 */ },
            pause() { /* 同上 */ },
            restart: toggleMid,
          };
          return;
        }

        /* ── 全动效分支：scrub 0.5；桌面 pin（+=1200），<960px 不 pin（+=900） ── */
        lockHeadline(); // 降级分支清过 minHeight，动效分支回来时重锁（如系统级偏好热切换）
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        playBtn.title = '恢复滚动驱动';
        pauseBtn.title = '冻结场景（滚动不再推进动画）';
        restartBtn.title = '回到钉住起点，滚动重走一遍';

        /* 初始帧不做任何隐藏：SSR 直出的就是完整「装好」画面（v2 §5 第 3 条），
           时间轴从该帧出发只做呈现与焦点调度，无空白开场 */
        const lens = depPaths.map((p) => p.getTotalLength());

        const tl = gsap.timeline({
          defaults: { ease: 'none', duration: 10 },
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            // v2 §3：压缩 pin 行程（含 pin 区页面总高 ≤6000px）；移动端不 pin，
            // 场景会滚出视口，行程压到约一屏
            end: pinned ? '+=1200' : '+=900',
            pin: pinned,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        const st = tl.scrollTrigger;

        // 拍一 0-20 装上：默认帧即完整画面，开场只做整体呈现：
        // 场景以基座为原点推近 1.06（焦点=全体），全员实墨
        tl.to(svg, { scale: 1.06, transformOrigin: '50% 86%', duration: 12, ease: 'power1.inOut' }, 0);

        // 拍二 20-45 拔掉它：标题换字；焦点移交 03：抬起抽出基座并推近 1.06，
        // 其余积木与依赖线降 .3 墨（v2 §5 第 4 条，视觉焦点跟滚轮走）
        fadeSwap(tl, 20, headline);
        tl.to(block('03')!, { y: -96, scale: 1.06, duration: 11, ease: 'power2.inOut' }, 23);
        tl.to([...others(['03']), depGroup], { autoAlpha: 0.3, duration: 6 }, 24);

        // 拍三 45-70 连锁熄灭：焦点移交 04/05（组透明度提回 1、推近 1.06；熄灭态
        // 由内层 lit→off 承担，不再叠加组级降墨），03 退回原尺寸
        tl.to(block('03')!, { scale: 1, duration: 6 }, 45);
        tl.to([block('04')!, block('05')!], { autoAlpha: 1, duration: 4 }, 45);
        tl.to([block('04')!, block('05')!], { scale: 1.06, duration: 6, ease: 'power1.inOut' }, 45);
        const extinguish = (n: string, at: number): void => {
          const lit = part(n, '.block-lit');
          const off = part(n, '.block-off');
          if (lit) tl.to(lit, { autoAlpha: 0, duration: 5 }, at);
          if (off) tl.to(off, { autoAlpha: 1, duration: 5 }, at);
          tl.to(block(n)!, { y: 6, duration: 5 }, at);
        };
        extinguish('04', 47);
        extinguish('05', 57);
        tl.to(depGroup, { autoAlpha: 0.12, duration: 6 }, 49);
        // 断裂 = 描边例外机制内的虚线化（一次性 set），复明前由拍四的 set 复原
        depPaths.forEach((p) => tl.set(p, { strokeDasharray: '10 14' }, 51));
        // 图注点名哪两块已连锁熄灭（04-定稿首页 brief 熄灭态裁定，正文墨）
        fadeSwap(tl, 52, note);

        // 拍四 70-95 原样退回：焦点回到提供者：03 归位推近 1.06，依赖线复原
        // 重画（回实墨），04/05 保持推近依次复明
        tl.to(block('03')!, { y: 0, scale: 1.06, duration: 9, ease: 'power2.inOut' }, 70);
        // 归位后先把虚线复原成整线并回到未画状态，再逐条重画，避免「先现身后消失」
        tl.set(depGroup, { autoAlpha: 1 }, 74);
        depPaths.forEach((p, i) => {
          tl.set(p, { strokeDasharray: lens[i], strokeDashoffset: lens[i] }, 74);
        });
        depPaths.forEach((p, i) => {
          tl.to(p, { strokeDashoffset: 0, duration: 8, ease: 'power1.inOut' }, 74 + i * 4);
        });
        const revive = (n: string, at: number): void => {
          const lit = part(n, '.block-lit');
          const off = part(n, '.block-off');
          if (lit) tl.to(lit, { autoAlpha: 1, duration: 5 }, at);
          if (off) tl.to(off, { autoAlpha: 0, duration: 5 }, at);
          tl.to(block(n)!, { y: 0, duration: 5 }, at);
        };
        revive('04', 80);
        revive('05', 88);
        fadeSwap(tl, 84, note);

        // 拍五 95-100 落定：全员回实墨、焦距回位，标题换回全文沉降落定
        fadeSwap(tl, 95, headline, true);
        tl.to(others(['03', '04', '05']), { autoAlpha: 1, duration: 4 }, 95);
        tl.to([block('03')!, block('04')!, block('05')!], { scale: 1, duration: 5, ease: 'power1.inOut' }, 95);
        tl.to(svg, { scale: 1, duration: 5, ease: 'power1.inOut' }, 95);

        // 换字与拍数指示器都挂在时间轴播放头上（含 scrub 追帧），正向反向都成立
        tl.eventCallback('onUpdate', () => {
          applyBeatText(tl.time());
          guide?.update(beatIndex(tl.time()), tl.progress());
        });
        applyBeatText(tl.time());
        guide?.update(beatIndex(tl.time()), tl.progress());

        // 字体加载或视口变化经 refresh 后重测标题高度、同步文案位与指示器
        const onRefresh = (): void => {
          applyBeatText(tl.time());
          guide?.update(beatIndex(tl.time()), tl.progress());
          lockHeadline();
        };
        ScrollTrigger.addEventListener('refresh', onRefresh);

        if (st) {
          api = {
            play: () => st.enable(),
            pause: () => st.disable(),
            restart: () => {
              // 擦洗场景的重播：回到钉住起点让滚动重走一遍（平滑回卷一遍叙事）。
              // 不手动 tl.progress(0)：scrub 场景时间轴归 ScrollTrigger 管辖，
              // 手拨进度会被追帧立刻覆盖，只会闪一帧。
              st.enable();
              window.scrollTo({ top: Math.ceil(st.start) + 2, behavior: 'smooth' });
            },
          };
        }

        // 分支退场时摘掉 refresh 监听（matchMedia 翻转 / context revert 都会走到）
        return () => {
          ScrollTrigger.removeEventListener('refresh', onRefresh);
        };
      },
    );
  }, root);

  // 控制条绑定（铁律 5）：按钮始终指向当前分支的播放 API
  playBtn.addEventListener('click', () => api.play());
  pauseBtn.addEventListener('click', () => api.pause());
  restartBtn.addEventListener('click', () => api.restart());

  registerScene('hero', {
    play: () => api.play(),
    pause: () => api.pause(),
    restart: () => api.restart(),
    destroy: () => {
      ctx?.revert();
      ctx = null;
    },
  });

  // 字体加载改变版面高度会影响钉住测量与标题高度锁
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

export function initHeroMotion(): void {
  const root = document.querySelector<HTMLElement>('[data-hero]');
  if (root) bind(root);
}

// ClientRouter：首次加载与每次换页后重建；换页前由 destroyScenes 触发 revert。
// 守卫浏览器环境：本模块只应经 <script> 标签打包到客户端，这里防误引入 SSR。
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initHeroMotion);
  document.addEventListener('astro:before-swap', () => {
    ctx?.revert();
    ctx = null;
  });
  initHeroMotion();
}
