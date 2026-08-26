/**
 * AI 區塊 4×4 圓陣：「從混亂到一致」。
 * 每圓＝上淺下中階半圓（同「我們與誰合作」三圓初始樣貌），初始各自不同角度。
 * 進入視窗後共轉五次（回彈曲線同 --wwa-spring，時長同 --wwa-d1）：
 *   1、2：各圓隨機方向與角度（混亂）
 *   3：全部就近轉回同一角度（上淺下中階）
 *   4、5：全體同步順時針各轉 180°（方向速度一致）
 * 完全捲出視窗後重置為新的隨機初始角，捲回時重播。
 * prefers-reduced-motion：不啟動，所有圓維持一致角度（CSS 預設 rotate(0)）。
 */

/** 與 index.astro 的 .ai-orb-spin transition 同步 */
const SPIN_DUR = 950;
/** 步與步之間的小拍 */
const STEP_GAP = 300;

export function initAiGrid(): void {
  const grid = document.querySelector<HTMLElement>('[data-ai-grid]');
  if (!grid) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const orbs = Array.from(grid.querySelectorAll<HTMLElement>('[data-ai-orb]'));
  if (orbs.length === 0) return;

  const angles: number[] = new Array(orbs.length).fill(0);
  const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));

  /** 無動畫就位：16 個彼此不同的初始角度（22.5° 等距洗牌） */
  function snapInitial(): void {
    const base = orbs.map((_, i) => i * 22.5);
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j]!, base[i]!];
    }
    orbs.forEach((el, i) => {
      angles[i] = base[i]!;
      el.style.transition = 'none';
      el.style.transform = `rotate(${angles[i]}deg)`;
      void el.getBoundingClientRect();
      el.style.transition = '';
    });
  }

  let running = false;
  let needsReset = false;

  async function play(): Promise<void> {
    if (running) return;
    running = true;

    // 1、2：各圓隨機方向（順逆各半機率）與角度（90°–270°）
    for (let step = 0; step < 2; step++) {
      orbs.forEach((el, i) => {
        const delta = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180);
        angles[i]! += delta;
        el.style.transform = `rotate(${angles[i]}deg)`;
      });
      await wait(SPIN_DUR + STEP_GAP);
    }

    // 3：全部就近轉回同一角度（≡ 0°，上淺下中階）
    orbs.forEach((el, i) => {
      angles[i] = Math.round(angles[i]! / 360) * 360;
      el.style.transform = `rotate(${angles[i]}deg)`;
    });
    await wait(SPIN_DUR + STEP_GAP);

    // 4、5：全體同步順時針各轉 180°
    for (let step = 0; step < 2; step++) {
      orbs.forEach((el, i) => {
        angles[i]! += 180;
        el.style.transform = `rotate(${angles[i]}deg)`;
      });
      await wait(SPIN_DUR + STEP_GAP);
    }

    running = false;
    if (needsReset) {
      needsReset = false;
      snapInitial();
    }
  }

  snapInitial();

  // 進場（>35% 可見）播放；完全捲出後重置，捲回重播
  const show = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) void play();
      }
    },
    { threshold: 0.35 },
  );
  const hide = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) continue;
        if (running) {
          needsReset = true;
        } else {
          snapInitial();
        }
      }
    },
    { threshold: 0 },
  );
  show.observe(grid);
  hide.observe(grid);
}

initAiGrid();
