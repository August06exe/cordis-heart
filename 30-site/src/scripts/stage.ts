export interface Beat {
  /** 拍点短名，也用作按钮文案「下一拍：②拔掉」 */
  label: string;
  /** 这一拍的旁白：讲清因 → 果 */
  say: string;
  run: () => Promise<void> | void;
}

const NUM = '①②③④⑤⑥⑦⑧';

/**
 * 线性引导式演示：一个主按钮推进，一行旁白解释，拍点显示进度。
 * 动画进行中按钮锁住；播完后主按钮变成「再看一遍」。
 */
export function stage(root: HTMLElement, beats: Beat[], opts: { reset: () => void; done?: string; intro?: string }) {
  const btn = root.querySelector<HTMLButtonElement>('[data-next]')!;
  const again = root.querySelector<HTMLButtonElement>('[data-reset]')!;
  const say = root.querySelector<HTMLElement>('[data-say]')!;
  const chips = root.querySelector<HTMLElement>('.st-beats')!;
  chips.innerHTML = beats.map((b, i) => `<li>${NUM[i]} ${b.label}</li>`).join('');
  const lis = [...chips.children] as HTMLElement[];
  let i = 0;
  let busy = false;

  const paint = () => {
    lis.forEach((li, k) => (li.dataset.s = k < i - 1 ? 'done' : k === i - 1 ? 'now' : ''));
    btn.textContent = i < beats.length ? `${i === 0 ? '开始' : '下一拍'}：${NUM[i]} ${beats[i].label}` : '再看一遍';
    btn.disabled = busy;
    again.disabled = busy || i === 0;
  };

  const restart = () => {
    i = 0;
    opts.reset();
    say.textContent = opts.intro ?? root.dataset.intro ?? '';
    paint();
  };

  btn.addEventListener('click', async () => {
    if (busy) return;
    if (i >= beats.length) return restart();
    const b = beats[i];
    busy = true;
    i += 1;
    say.textContent = b.say;
    paint();
    try { await b.run(); } finally { busy = false; }
    if (i >= beats.length && opts.done) say.textContent = `${b.say}\n\n${opts.done}`;
    paint();
  });
  again.addEventListener('click', () => !busy && restart());
  restart();
}

/** 页面里每个演示各自挂载一次 */
export function mount(name: string, init: (root: HTMLElement) => void) {
  const run = () => document.querySelectorAll<HTMLElement>(`[data-demo="${name}"]`).forEach((el) => {
    if (el.dataset.ready) return;
    el.dataset.ready = '1';
    init(el);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
