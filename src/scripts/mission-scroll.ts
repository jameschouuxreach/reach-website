/**
 * 使命區捲動敘事（v2）：
 * - Motion `scroll()`（offset 含進場段），scroll-linked、雙向可逆。
 * - 三階段時間窗由「實測段落中心」動態推算：每段動畫在該段文字滑到畫面正中前完成並停住，
 *   文字置中期間右側維持該段最終示意圖。
 * - 階段一自「完全沒有外圍圓」開始：弧段 0 → 虛線 → 接近實線，收尾完整圓淡入去接縫。
 * - 中心圓自始即為實心（無中心填色動畫）；第三階段僅八個外圍圓同步填滿。
 * - 每幀僅更新主 SVG 上 4 個 CSS 變數與 active panel；幾何與時間窗不在 scroll frame 重算。
 * - prefers-reduced-motion 或行動版：不註冊 observer（CSS 呈現靜態終態）。
 */
import { scroll } from 'motion';

/** 將總進度 clamp／normalize 為單一階段的 0–1 */
function segmentProgress(progress: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

const ENTRY_START = 0.03; // 區塊剛開始進場後不久，階段一即開演
const HOLD_BEFORE = 0.05; // 每段文字到達正中前，動畫需提前完成的緩衝
const HOLD_AFTER = 0.07; // 文字離開正中後，下一階段才開始
const ARC_GROW_PORTION = 0.95; // 階段一內部：前 95% 弧段延長，後 5% 完整圓淡入

interface StageWindows {
  arc: [number, number];
  line: [number, number];
  fill: [number, number];
  panelBounds: [number, number]; // active panel 切換界線（段落中心的中點）
}

export function initMissionScroll(): void {
  const section = document.querySelector<HTMLElement>('[data-mission-story]');
  if (!section) return;

  // reduced-motion／行動版：CSS 已呈現靜態終態，不註冊 scroll observer
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 769px)').matches) return;

  const svg = section.querySelector<SVGSVGElement>('[data-mission-svg]');
  const panels = Array.from(section.querySelectorAll<HTMLElement>('[data-mission-panel]'));
  if (!svg || panels.length !== 3) return;

  let windows: StageWindows | null = null;
  let lastProgress = 0;
  let activePanel = -1;

  /** 量測段落中心 → 推算三階段時間窗（初始化與 resize 時執行，不在 scroll frame） */
  function measure(): void {
    const viewportH = window.innerHeight;
    const sectionTop = section!.getBoundingClientRect().top + window.scrollY;
    const total = section!.offsetHeight;

    // offset ['start end','end end'] 下，progress = (scrollY + vh − sectionTop) / total；
    // 段落中心與畫面正中重合時 progress = (段落中心相對位置 + vh/2) / total
    const centers = panels.map((panel) => {
      const rect = panel.getBoundingClientRect();
      const centerRel = rect.top + window.scrollY - sectionTop + rect.height / 2;
      return (centerRel + viewportH / 2) / total;
    }) as [number, number, number];

    const clampEnd = (v: number) => Math.min(v, 0.98);
    windows = {
      arc: [ENTRY_START, Math.max(clampEnd(centers[0] - HOLD_BEFORE), ENTRY_START + 0.1)],
      line: [centers[0] + HOLD_AFTER, clampEnd(centers[1] - HOLD_BEFORE)],
      fill: [centers[1] + HOLD_AFTER, clampEnd(centers[2] - HOLD_BEFORE)],
      panelBounds: [(centers[0] + centers[1]) / 2, (centers[1] + centers[2]) / 2],
    };
  }

  function update(progress: number): void {
    lastProgress = progress;
    if (!windows) return;

    const arcPhase = segmentProgress(progress, windows.arc[0], windows.arc[1]);
    const arcGrow = Math.min(arcPhase / ARC_GROW_PORTION, 1);
    const ringfull = segmentProgress(arcPhase, ARC_GROW_PORTION, 1);

    const style = svg!.style;
    style.setProperty('--ms-arc', String(arcGrow));
    style.setProperty('--ms-ringfull', String(ringfull));
    style.setProperty('--ms-line', String(segmentProgress(progress, windows.line[0], windows.line[1])));
    style.setProperty('--ms-fill-outer', String(segmentProgress(progress, windows.fill[0], windows.fill[1])));

    const index =
      progress < windows.panelBounds[0] ? 0 : progress < windows.panelBounds[1] ? 1 : 2;
    if (index !== activePanel) {
      activePanel = index;
      panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
    }
  }

  measure();
  // 先以進度 0 覆寫 CSS 的最終態預設值，避免初載閃現完成狀態
  update(0);

  const cleanup = scroll((progress: number) => update(progress), {
    target: section,
    offset: ['start end', 'end end'],
  });

  window.addEventListener('resize', () => {
    measure();
    update(lastProgress);
  });

  window.addEventListener('pagehide', () => cleanup(), { once: true });
}

initMissionScroll();
