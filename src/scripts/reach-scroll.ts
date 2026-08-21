/**
 * Reach 品牌動態（桌機 sticky scroll）：
 * - 「Reach」為固定品牌起點，價值詞組隨捲動依序切換，最後收束為 Reach Experience Design。
 * - 以 IntersectionObserver 觀測分段 sentinel（不使用 scroll listener）。
 * - 行動版與 prefers-reduced-motion 由 CSS 改顯示靜態版本，此腳本不介入。
 */
export function initReachScroll(): void {
  const root = document.querySelector<HTMLElement>('[data-reach-desktop]');
  if (!root) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-reach-step]'));
  const phrases = Array.from(root.querySelectorAll<HTMLElement>('[data-reach-phrase]'));
  if (steps.length === 0 || phrases.length === 0) return;

  function activate(index: number): void {
    for (const [i, phrase] of phrases.entries()) {
      phrase.classList.toggle('is-current', i === index);
    }
    root!.classList.toggle('is-final', index === phrases.length - 1);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const index = Number((entry.target as HTMLElement).dataset.reachStep);
          if (!Number.isNaN(index)) activate(index);
        }
      }
    },
    // 只在 sentinel 進入視窗中段時切換狀態
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  );

  steps.forEach((step) => observer.observe(step));
}

initReachScroll();
