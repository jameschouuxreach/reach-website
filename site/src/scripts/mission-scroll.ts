/**
 * 使命區三點敘事（v5，2026-08-28：移除捲動鎖定與滾輪／鍵盤步進）：
 * - 頁面自由捲動，不攔任何滾輪、鍵盤或 scroll 事件；三點只由 tabs 切換。
 * - 與其他區塊的進場動畫一致：區塊捲入視窗（>35% 可見）即回到「01 更深」自動播放第一段
 *   （外圍圓 無→虛線→實線）；完全捲出視窗立即中止並重置，回場一律從 01 重播。
 *   停留期間 tabs 切換的狀態會保留，直到區塊完全離開視窗才重置。
 * - 動畫為時間驅動（rAF tween），與捲動速度無關。
 * - 行動版／reduced-motion／無 JS：後備靜態版（由元件 CSS 切換，本腳本直接返回）。
 */

/** 0–1 夾限 */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const STAGE1_MS = 1100; // 外圍圓 無→虛線→實線（進場自動播放）
const STAGE_MS = 900; // 連線／填滿（tab 切換）
const ARC_GROW_PORTION = 0.95; // 階段一內部：前 95% 弧段延長，後 5% 完整圓淡入
const ENTER_THRESHOLD = 0.35; // 區塊可見比例達此值視為「進場」（與 AI 圓陣一致）

export function initMissionScroll(): void {
  const root = document.querySelector<HTMLElement>('[data-msp]');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 769px)').matches) return;

  const svg = root.querySelector<SVGSVGElement>('[data-mission-svg]');
  const slots = Array.from(root.querySelectorAll<HTMLElement>('.msp-slot'));
  const titleItems = Array.from(root.querySelectorAll<HTMLElement>('[data-msp-title]'));
  const bodyItems = Array.from(root.querySelectorAll<HTMLElement>('[data-msp-body]'));
  const exampleItems = Array.from(root.querySelectorAll<HTMLElement>('[data-msp-example]'));
  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[data-msp-tab]'));
  if (
    !svg ||
    slots.length === 0 ||
    titleItems.length !== 3 ||
    bodyItems.length !== 3 ||
    exampleItems.length !== 3
  ) {
    return;
  }

  // ---- SVG 狀態（三段各一個 0–1 進度值） ----
  let p1 = 0;
  let p2 = 0;
  let p3 = 0;

  function apply(): void {
    const style = svg!.style;
    style.setProperty('--ms-arc', String(Math.min(p1 / ARC_GROW_PORTION, 1)));
    style.setProperty(
      '--ms-ringfull',
      String(clamp01((p1 - ARC_GROW_PORTION) / (1 - ARC_GROW_PORTION))),
    );
    style.setProperty('--ms-line', String(p2));
    style.setProperty('--ms-fill-outer', String(p3));
  }

  function swapTo(index: number): void {
    for (const group of [titleItems, bodyItems, exampleItems]) {
      group.forEach((el, i) => {
        el.classList.toggle('is-current', i === index);
        el.classList.toggle('is-past', i < index); // 已過的項目停在下方（往下滑方向）
      });
    }
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === index);
      tab.setAttribute('aria-selected', String(i === index));
    });
  }

  /** 不播字槽滑動、直接就位（重置用） */
  function snapSwapTo(index: number): void {
    slots.forEach((el) => el.classList.add('no-anim'));
    swapTo(index);
    void slots[0]!.offsetWidth;
    slots.forEach((el) => el.classList.remove('no-anim'));
  }

  // ---- rAF tween（時間驅動，與捲動無關；同時只會有一個 tween） ----
  let rafId = 0;

  function tween(set: (v: number) => void, from: number, to: number, dur: number): void {
    cancelAnimationFrame(rafId);
    const t0 = performance.now();
    const frame = (now: number) => {
      const k = clamp01((now - t0) / dur);
      set(from + (to - from) * easeInOutCubic(k));
      apply();
      if (k < 1) rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
  }

  // ---- 三點狀態：只由 tabs 與進場／離場控制 ----
  let point: 1 | 2 | 3 = 1;

  /** 切到某一點：一律從該點的開頭「正向」播放該階段動畫
   *（前置階段瞬間就位、後續階段瞬間清空；往回跳也不倒放） */
  function goToPoint(target: 1 | 2 | 3): void {
    point = target;
    swapTo(target - 1);
    if (target === 1) {
      p1 = 0;
      p2 = 0;
      p3 = 0;
      apply();
      tween((v) => (p1 = v), 0, 1, STAGE1_MS);
    } else if (target === 2) {
      p1 = 1;
      p2 = 0;
      p3 = 0;
      apply();
      tween((v) => (p2 = v), 0, 1, STAGE_MS);
    } else {
      p1 = 1;
      p2 = 1;
      p3 = 0;
      apply();
      tween((v) => (p3 = v), 0, 1, STAGE_MS);
    }
  }

  /** 重置為初始狀態：中止動畫、只有中心實心圓、字幕直接停在第一點（不播滑動） */
  function resetToStart(): void {
    cancelAnimationFrame(rafId);
    point = 1;
    p1 = p2 = p3 = 0;
    apply();
    snapSwapTo(0);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      const target = (i + 1) as 1 | 2 | 3;
      if (target !== point) goToPoint(target);
    });
  });

  // ---- 進場重播／離場重置（與 reveal.ts、ai-grid.ts 同一套慣例） ----
  // armed：離場重置後才允許下一次進場自動播放；區塊只是在視窗內小幅進出（未完全離開）
  // 不會重播，避免打斷使用者用 tabs 停留的那一點
  let armed = true;
  const show = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !armed) continue;
        armed = false;
        resetToStart();
        goToPoint(1);
      }
    },
    { threshold: ENTER_THRESHOLD },
  );
  const hide = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) continue;
        armed = true;
        resetToStart();
      }
    },
    { threshold: 0 },
  );
  show.observe(root);
  hide.observe(root);

  // 初始：僅中心實心圓＋第一點文字（進場時才播）
  apply();
}

initMissionScroll();
