/**
 * SceneGuide 组件的配套脚本：把页动效的 scrub 进度接到拍数指示器与场景进度线上
 * （DesignRead v2 §5：拍数指示器 + 场景进度线，钉住场景必配）。
 *
 * 用法（各页动效脚本内，root 为包含 <SceneGuide> 的 pin 容器）：
 *   import { bindSceneGuide } from './scene-guide';
 *   const guide = bindSceneGuide(root);
 *   tl.eventCallback('onUpdate', () => {
 *     guide?.update(beatIndex(tl.time()), tl.progress());
 *   });
 * prefers-reduced-motion 降级分支若直出终态，收尾调一次 update(末拍, 1) 即可，
 * 指示器与进度线同静态场景一致，内容不缺失。
 *
 * 纪律：只写 class 翻转与 transform:scaleX（铁律 1：只动 transform/opacity），
 * 不读布局、不建全局监听；ClientRouter 换页后元素随 DOM 销毁，本模块无状态、
 * 无泄漏，每页 astro:page-load 重新 bind 即可；handle 指向已销毁元素时更新
 * 写在游离节点上，无副作用。
 */

export interface SceneGuideHandle {
  /**
   * @param index    当前拍，0 起；小数向下取整，超出范围钳制到首末拍
   * @param progress 场景 scrub 进度，0~1，越界与 NaN 钳制到 0
   */
  update(index: number, progress: number): void;
}

/** 绑定 root 下第一个 [data-scene-guide]；找不到时返回 null，调用方用 ?. 即可 */
export function bindSceneGuide(root: ParentNode = document): SceneGuideHandle | null {
  const guide = root.querySelector<HTMLElement>('[data-scene-guide]');
  if (!guide) return null;

  const fill = guide.querySelector<HTMLElement>('.sg-fill');
  const items = Array.from(guide.querySelectorAll<HTMLElement>('.sg-item'));

  let lastIndex = -1;

  return {
    update(index: number, progress: number): void {
      /* 进度线每帧都动（scaleX 连续量），拍点 class 只在换拍时翻转 */
      const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
      if (fill) fill.style.transform = `scaleX(${p})`;

      const i = Number.isFinite(index)
        ? Math.min(items.length - 1, Math.max(0, Math.floor(index)))
        : 0;
      if (i === lastIndex) return;
      lastIndex = i;

      for (let k = 0; k < items.length; k++) {
        items[k].classList.toggle('is-lit', k <= i);
        items[k].classList.toggle('is-active', k === i);
      }
    },
  };
}
