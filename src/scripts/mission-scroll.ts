/**
 * 使命區捲動敘事（規格：致遠官網-v1-使命區捲動敘事-增量修改規格.md）：
 * - Motion `scroll()` 取得使命區 0–1 局部進度，scroll-linked、雙向可逆。
 * - 每幀只更新主 SVG 上的 5 個 CSS 變數與左欄 active panel，不 query DOM、不重算幾何。
 * - prefers-reduced-motion 或行動版：不註冊 observer（CSS 呈現靜態終態）。
 */
import { scroll } from 'motion';

/** 將總進度 clamp／normalize 為單一階段的 0–1 */
function segmentProgress(progress: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

// 階段切分（規格 §3.2）
const ARC_END = 0.32; // 虛線弧段延長為實線（含收尾）
const LINE_START = 0.34;
const LINE_END = 0.66; // 八條連線生成
const FILL_CENTER_START = 0.68;
const FILL_CENTER_END = 0.8; // 中心圓填滿
const FILL_OUTER_START = 0.8;
const FILL_OUTER_END = 1.0; // 外圍圓同步填滿

// 第一階段內部：前 95% 弧段延長（0.3 → 1.0），後 5% 完整圓淡入、弧段淡出
const ARC_INITIAL = 0.3;
const ARC_GROW_PORTION = 0.95;

export function initMissionScroll(): void {
  const section = document.querySelector<HTMLElement>('[data-mission-story]');
  if (!section) return;

  // reduced-motion／行動版：CSS 已呈現靜態終態，不註冊 scroll observer
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 769px)').matches) return;

  const svg = section.querySelector<SVGSVGElement>('[data-mission-svg]');
  const panels = Array.from(section.querySelectorAll<HTMLElement>('[data-mission-panel]'));
  if (!svg || panels.length !== 3) return;

  let activePanel = -1;

  function update(progress: number): void {
    const arcPhase = segmentProgress(progress, 0, ARC_END);
    const arcGrow = Math.min(arcPhase / ARC_GROW_PORTION, 1);
    const ringfull = segmentProgress(arcPhase, ARC_GROW_PORTION, 1);

    const style = svg!.style;
    style.setProperty('--ms-arc', String(ARC_INITIAL + (1 - ARC_INITIAL) * arcGrow));
    style.setProperty('--ms-ringfull', String(ringfull));
    style.setProperty('--ms-line', String(segmentProgress(progress, LINE_START, LINE_END)));
    style.setProperty(
      '--ms-fill-center',
      String(segmentProgress(progress, FILL_CENTER_START, FILL_CENTER_END)),
    );
    style.setProperty(
      '--ms-fill-outer',
      String(segmentProgress(progress, FILL_OUTER_START, FILL_OUTER_END)),
    );

    const index = progress < 0.33 ? 0 : progress < 0.67 ? 1 : 2;
    if (index !== activePanel) {
      activePanel = index;
      panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
    }
  }

  // 先以進度 0 覆寫 CSS 的最終態預設值，避免初載閃現完成狀態
  update(0);

  const cleanup = scroll((progress: number) => update(progress), {
    target: section,
    offset: ['start start', 'end end'],
  });

  window.addEventListener('pagehide', () => cleanup(), { once: true });
}

initMissionScroll();
