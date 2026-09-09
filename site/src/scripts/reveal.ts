/**
 * 區塊進場：IntersectionObserver 驅動（不使用 scroll listener）。
 * 元素加上 data-reveal 即套用；reduced-motion 時 CSS 直接顯示最終內容。
 * 捲出視窗後會重置，捲回來時動畫重新播放；加 data-reveal-once 則只播一次（如 Hero，本身持續輪播）。
 */
export function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // 離場重置：完全捲出視窗才移除，避免半可見時肉眼看到淡出
  const hide = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) entry.target.classList.remove('is-visible');
      }
    },
    { threshold: 0 },
  );

  const show = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        if (entry.target.hasAttribute('data-reveal-once')) {
          show.unobserve(entry.target);
          hide.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  targets.forEach((el) => {
    hide.observe(el);
    show.observe(el);
  });
}

initReveal();
