/**
 * 使命區釘住式捲動敘事（v3）：
 * - Motion `scroll()` 以 260vh 跑道（[data-msp]）取得 0–1 進度；區塊釘住後才開始動畫。
 * - 三階段固定進度窗；左側字幕輪替門檻＝右側該階段起點（同時開始），
 *   階段窗結束後才到下一個門檻（等右邊動畫做完）。
 * - 字幕輪替為 Hero 式垂直滑動（CSS transition 觸發式）：向下換幕舊字上滑出、新字自下方進；
 *   反向捲動時自然反轉（已看過的字幕停在上方待命位）。
 * - 右側 SVG 僅逐幀更新 4 個 CSS 變數；第一點文字與中心實心圓為初始靜態，無進場動畫。
 * - prefers-reduced-motion／行動版／無 JS：顯示後備靜態版，不註冊 observer。
 */
import { scroll } from 'motion';

/** 將總進度 clamp／normalize 為單一階段的 0–1 */
function segmentProgress(progress: number, start: number, end: number): number {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

// ---- 三階段進度窗（釘住區間 0–1）----
const ARC_START = 0.06;
const ARC_END = 0.3; // 階段一：外圍圓 無→虛線→實線（左側停留第一點）
const STAGE2_AT = 0.4; // 門檻：字幕換第二點＋連線動畫同時開始
const LINE_END = 0.62;
const STAGE3_AT = 0.72; // 門檻：字幕換第三點＋外圍填滿同時開始
const FILL_END = 0.92;
const ARC_GROW_PORTION = 0.95; // 階段一內部：前 95% 弧段延長，後 5% 完整圓淡入

export function initMissionScroll(): void {
  const runway = document.querySelector<HTMLElement>('[data-msp]');
  if (!runway) return;

  // reduced-motion／行動版：後備靜態版已由 CSS 呈現，不註冊 scroll observer
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 769px)').matches) return;

  const svg = runway.querySelector<SVGSVGElement>('[data-mission-svg]');
  const items = Array.from(runway.querySelectorAll<HTMLElement>('[data-msp-item]'));
  if (!svg || items.length !== 3) return;

  let activeItem = 0;

  /** 字幕輪替：目前項顯示；已看過的項停在上方待命（反向捲動時自然從上滑回） */
  function swapTo(index: number): void {
    activeItem = index;
    items.forEach((el, i) => {
      el.classList.toggle('is-current', i === index);
      el.classList.toggle('is-above', i < index);
    });
  }

  function update(progress: number): void {
    const arcPhase = segmentProgress(progress, ARC_START, ARC_END);
    const arcGrow = Math.min(arcPhase / ARC_GROW_PORTION, 1);
    const ringfull = segmentProgress(arcPhase, ARC_GROW_PORTION, 1);

    const style = svg!.style;
    style.setProperty('--ms-arc', String(arcGrow));
    style.setProperty('--ms-ringfull', String(ringfull));
    style.setProperty('--ms-line', String(segmentProgress(progress, STAGE2_AT, LINE_END)));
    style.setProperty('--ms-fill-outer', String(segmentProgress(progress, STAGE3_AT, FILL_END)));

    const index = progress < STAGE2_AT ? 0 : progress < STAGE3_AT ? 1 : 2;
    if (index !== activeItem) swapTo(index);
  }

  // 先以進度 0 覆寫 CSS 的最終態預設值（初始：僅中心實心圓＋第一點文字）
  update(0);

  const cleanup = scroll((progress: number) => update(progress), {
    target: runway,
    offset: ['start start', 'end end'],
  });

  window.addEventListener('pagehide', () => cleanup(), { once: true });
}

initMissionScroll();
