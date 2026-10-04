const mq = typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => !!mq?.matches;
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, reduced() ? 0 : ms));

const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

function play(el: Element, frames: Keyframe[], o: KeyframeAnimationOptions = {}) {
  if (reduced()) return Promise.resolve();
  return el.animate(frames, { duration: 340, easing: EASE, ...o }).finished.then(() => {}, () => {});
}

/** 显影：从微偏移淡入到原位（结束于自然样式，不留内联残值） */
export async function show(el: HTMLElement, from = 'translateY(8px)') {
  el.hidden = false;
  await play(el, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }]);
}

/** 退场：淡出后隐藏，并清掉动画留下的 fill */
export async function hide(el: HTMLElement, to = 'translateY(-6px) scale(0.96)') {
  await play(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: to }], { fill: 'forwards', duration: 280 });
  el.hidden = true;
  el.getAnimations().forEach((a) => a.cancel());
}

export async function drop(el: HTMLElement, to?: string) {
  await hide(el, to);
  el.remove();
}

/** 盖章：放大落下，略带回弹 */
export async function stamp(el: HTMLElement) {
  el.hidden = false;
  await play(el, [
    { opacity: 0, transform: 'rotate(-6deg) scale(1.9)' },
    { opacity: 1, transform: 'rotate(-6deg) scale(1)' },
  ], { duration: 240, easing: 'cubic-bezier(0.3, 1.5, 0.5, 1)' });
}

/** 被点名：短暂抬起 */
export async function nudge(el: HTMLElement) {
  el.classList.add('is-hot');
  await play(el, [{ transform: 'none' }, { transform: 'translate(-3px, -3px)' }, { transform: 'none' }], { duration: 420 });
  el.classList.remove('is-hot');
}

export async function shake(el: HTMLElement) {
  await play(el, [
    { transform: 'none' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' },
    { transform: 'translateX(-3px)' }, { transform: 'none' },
  ], { duration: 360 });
}

/** 由 HTML 模板生成一个元素 */
export function make<T extends HTMLElement = HTMLElement>(html: string): T {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
}

/** 设置节点状态：on 在岗 / wait 待命 / off 离场 / fail 失败 */
export function setState(nd: HTMLElement, s: 'on' | 'wait' | 'off' | 'fail', text?: string) {
  nd.dataset.s = s;
  const chip = nd.querySelector<HTMLElement>('.chip');
  if (!chip) return;
  chip.className = 'chip ' + ({ on: 'on', wait: 'wait', off: 'off', fail: 'bad' } as const)[s];
  chip.textContent = text ?? ({ on: '在岗', wait: '待命', off: '未装', fail: '失败' } as const)[s];
}
