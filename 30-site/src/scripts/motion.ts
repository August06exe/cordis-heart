/**
 * 全站动效基建。所有页面动画统一从这里取 gsap 与 ScrollTrigger。
 *
 * 铁律 1：只动画 transform 与 opacity；SVG 描边动画的 stroke-dashoffset 是唯一例外。
 *         禁止 window scroll 监听，滚动只走 GSAP ScrollTrigger / IntersectionObserver /
 *         CSS 滚动动画。
 * 铁律 2：MOTION_INTENSITY 高于 3 的动效必须用 gsap.matchMedia 包裹
 *         prefers-reduced-motion 降级（大位移动画降为轻交叉淡），内容不缺失。
 * 铁律 5：每个动画场景经 registerScene 暴露 play / pause / restart。
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let pluginsReady = false;

/** 首次调用时注册 ScrollTrigger，重复调用无副作用 */
export function ensureGsap(): typeof gsap {
  if (!pluginsReady) {
    gsap.registerPlugin(ScrollTrigger);
    pluginsReady = true;
  }
  return gsap;
}

export { gsap, ScrollTrigger };

/** 单个动画场景对外暴露的控制接口（铁律 5） */
export interface SceneHandle {
  play(): void;
  pause(): void;
  restart(): void;
  /** ClientRouter 换页前清理，由 destroyScenes 统一调用 */
  destroy(): void;
}

const scenes = new Map<string, SceneHandle>();

export function registerScene(id: string, scene: SceneHandle): void {
  scenes.get(id)?.destroy();
  scenes.set(id, scene);
}

export function destroyScenes(): void {
  for (const scene of scenes.values()) scene.destroy();
  scenes.clear();
}

/**
 * [data-reveal]：进视口一次性显影，给 4-5 档页的默认入场。
 * IntersectionObserver 实现，无 window scroll 监听；
 * prefers-reduced-motion 下直接显影，内容不缺失。
 */
let revealObserver: IntersectionObserver | null = null;

export function initReveals(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-done])');
  if (els.length === 0) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  for (const el of els) {
    el.dataset.revealDone = '1';
    if (reduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-revealed');
      continue;
    }
    revealObserver ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          revealObserver?.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    revealObserver.observe(el);
  }
}
