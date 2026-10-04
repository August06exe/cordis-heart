import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { TERMS } from '../data/terms';
import { REFS } from '../data/refs';

const BASE = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '');
import { copyText } from './copy';

const el = (tag: string, cls: string, text?: string) => {
  const n = document.createElement(tag);
  n.className = cls;
  if (text) n.textContent = text;
  return n;
};

function termBody(id: string) {
  const t = TERMS[id];
  if (!t) return null;
  const box = document.createDocumentFragment();
  box.append(el('div', 'pop-t', `${t.name} · ${t.en}`), el('div', '', t.def));
  const f = el('div', 'pop-f');
  const a = document.createElement('a');
  a.href = `${BASE}/terms/#${id}`;
  a.textContent = '在术语表里看 →';
  f.append(a);
  box.append(f);
  return box;
}

function refBody(id: string) {
  const r = REFS[id];
  if (!r) return null;
  const box = document.createDocumentFragment();
  box.append(el('div', 'pop-t', `论文第 ${r.page} 页`), el('div', '', r.gist), el('div', 'pop-q', r.quote));
  const f = el('div', 'pop-f', 'arXiv:2608.25512v1 原文摘句');
  box.append(f);
  return box;
}

function popovers() {
  const pop = el('div', 'pop');
  pop.setAttribute('role', 'tooltip');
  pop.id = 'pop';
  document.body.append(pop);
  let owner: HTMLElement | null = null;
  let timer = 0;

  const open = async (trigger: HTMLElement) => {
    clearTimeout(timer);
    const body = trigger.dataset.term ? termBody(trigger.dataset.term) : refBody(trigger.dataset.ref!);
    if (!body) return;
    owner = trigger;
    pop.replaceChildren(body);
    trigger.setAttribute('aria-describedby', 'pop');
    const { x, y } = await computePosition(trigger, pop, { placement: 'top', middleware: [offset(10), flip(), shift({ padding: 12 })] });
    Object.assign(pop.style, { left: `${x}px`, top: `${y}px` });
    pop.classList.add('is-on');
  };
  const close = (now = false) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      pop.classList.remove('is-on');
      owner?.removeAttribute('aria-describedby');
      owner = null;
    }, now ? 0 : 160);
  };

  const triggers = document.querySelectorAll<HTMLElement>('[data-term], [data-ref]');
  triggers.forEach((t) => {
    t.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && open(t));
    t.addEventListener('pointerleave', () => close());
    t.addEventListener('focus', () => open(t));
    t.addEventListener('blur', () => close());
    t.addEventListener('click', (e) => {
      if (owner === t && pop.classList.contains('is-on') && matchMedia('(hover: hover)').matches) return;
      e.preventDefault();
      owner === t && pop.classList.contains('is-on') ? close(true) : open(t);
    });
  });
  pop.addEventListener('pointerenter', () => clearTimeout(timer));
  pop.addEventListener('pointerleave', () => close());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close(true));
  document.addEventListener('click', (e) => {
    const t = e.target as Node;
    if (owner && !owner.contains(t) && !pop.contains(t)) close(true);
  });
}

function pageToc() {
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.toc a')];
  if (!links.length) return;
  const heads = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean) as HTMLElement[];
  let raf = 0;
  const upd = () => {
    raf = 0;
    const line = 140;
    let k = 0;
    heads.forEach((h, i) => { if (h.getBoundingClientRect().top < line) k = i; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) k = heads.length - 1;
    links.forEach((a, i) => a.classList.toggle('is-on', i === k));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  addEventListener('resize', upd);
  upd();
}

function drawer() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu]');
  if (!btn) return;
  const root = document.documentElement;
  const set = (on: boolean) => { root.classList.toggle('nav-open', on); btn.setAttribute('aria-expanded', String(on)); };
  btn.addEventListener('click', () => set(!root.classList.contains('nav-open')));
  document.querySelector('.scrim')?.addEventListener('click', () => set(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
}

function progress() {
  const bar = document.querySelector<HTMLElement>('.progress');
  if (!bar) return;
  let raf = 0;
  const upd = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', String(max > 0 ? Math.min(1, scrollY / max) : 0));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  upd();
}

function copyButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const src = document.getElementById(b.dataset.copy!);
      if (!src || !(await copyText(src.innerText.trim()))) return;
      const label = b.textContent;
      b.textContent = '已复制 ✓';
      b.classList.add('is-solid');
      setTimeout(() => { b.textContent = label; b.classList.remove('is-solid'); }, 1800);
    });
  });
}

function reveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-in]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  els.forEach((e) => io.observe(e));
}

popovers();
pageToc();
drawer();
progress();
copyButtons();
reveal();
