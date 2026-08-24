/**
 * 使命區步進式敘事（v4）：
 * - 區塊為 100vh 單屏。向下捲動跨過區塊頂端時鎖定頁面並對齊，第一段動畫自動播放
 *  （外圍圓 無→虛線→實線）。
 * - 鎖定期間，每一次向下手勢（不論力道）推進一步：
 *   第二點（字幕輪替＋連線動畫）→ 第三點（字幕輪替＋外圍填滿）→ 再一次手勢放行離開。
 * - 向上手勢逐步倒退；在第一點向上直接放行。動畫播放中的手勢忽略；
 *   同一次慣性（事件間隔 < 350ms）只算一個手勢。
 * - 捲軸拖曳不對抗（鎖定中頁面被大幅拖走即靜默解鎖）；鍵盤方向鍵／PgUp/PgDn／空白鍵可步進。
 * - 動畫為時間驅動（rAF tween），與捲動速度無關。
 * - 行動版／reduced-motion／無 JS：後備靜態版；偵測到觸控即停用鎖定。
 */

/** 0–1 夾限 */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const STAGE1_MS = 1100; // 外圍圓 無→虛線→實線（自動播放）
const STAGE_MS = 900; // 連線／填滿
const STEP_COOLDOWN_MS = 450; // 每步之後的冷卻：吞掉慣性尾巴、避免連跳
const ACCUM_THRESHOLD = 100; // 累積位移達此值＝一步（滑鼠一格 tick 即達標）
const ACCUM_MIN_DELTA = 15; // 小於此值的事件不累積（過濾慣性尾巴的微小殘餘）
const ARC_GROW_PORTION = 0.95; // 階段一內部：前 95% 弧段延長，後 5% 完整圓淡入

export function initMissionScroll(): void {
  const root = document.querySelector<HTMLElement>('[data-msp]');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(min-width: 769px)').matches) return;

  const svg = root.querySelector<SVGSVGElement>('[data-mission-svg]');
  const slot = root.querySelector<HTMLElement>('.msp-slot');
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-msp-item]'));
  if (!svg || !slot || items.length !== 3) return;

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
    items.forEach((el, i) => {
      el.classList.toggle('is-current', i === index);
      el.classList.toggle('is-above', i < index);
    });
  }

  function snapSwapTo(index: number): void {
    slot!.classList.add('no-anim');
    swapTo(index);
    void slot!.offsetWidth;
    slot!.classList.remove('no-anim');
  }

  // ---- rAF tween（時間驅動，與捲動無關） ----
  let animating = false;
  let rafId = 0;

  function tween(set: (v: number) => void, from: number, to: number, dur: number): void {
    animating = true;
    cancelAnimationFrame(rafId);
    const t0 = performance.now();
    const frame = (now: number) => {
      const k = clamp01((now - t0) / dur);
      set(from + (to - from) * easeInOutCubic(k));
      apply();
      if (k < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        animating = false;
        lastStepTs = performance.now(); // 動畫結束重啟冷卻：吃掉期間的慣性尾巴
      }
    };
    rafId = requestAnimationFrame(frame);
  }

  // ---- 鎖定與步進狀態機 ----
  let point: 1 | 2 | 3 = 1; // 目前停留的點
  let locked = false;
  let lockedAt = 0; // 鎖定時間戳（鎖定初期的漂移一律夾回）
  let arrived = false; // 第一段是否已自動播放
  let touchMode = false; // 偵測到觸控即停用鎖定
  let lastY = window.scrollY;
  let lastWheelTs = 0;
  let accum = 0; // 滾動累積量（正＝向下）
  let lastStepTs = 0;
  let sectionTop = 0;

  function measure(): void {
    // 取整：瀏覽器捲動位置為整數，小數邊界會讓「跨越」判定在對齊點附近抖動誤觸
    sectionTop = Math.round(root!.getBoundingClientRect().top + window.scrollY);
  }
  measure();
  window.addEventListener('resize', measure);

  const alignToSection = () =>
    window.scrollTo({ top: sectionTop, behavior: 'instant' as ScrollBehavior });

  function resetAll(): void {
    point = 1;
    arrived = false;
    p1 = p2 = p3 = 0;
    apply();
    snapSwapTo(0);
  }

  /** 自上方進入：鎖定；首次進入自動播第一段 */
  function engageLock(): void {
    locked = true;
    lockedAt = performance.now();
    alignToSection();
    if (!arrived) {
      arrived = true;
      tween((v) => (p1 = v), p1, 1, STAGE1_MS);
    }
  }

  /** 自下方回捲進入：以完成狀態鎖定於第三點，向上手勢逐步倒退 */
  function engageLockFromBelow(): void {
    locked = true;
    lockedAt = performance.now();
    arrived = true;
    point = 3;
    p1 = p2 = p3 = 1;
    apply();
    snapSwapTo(2);
    alignToSection();
  }

  /** 手勢決策：回傳 'consume'（吃掉）或 'release'（放行此事件） */
  function step(direction: 1 | -1): 'consume' | 'release' {
    if (animating) return 'consume';
    if (direction === 1) {
      if (point === 1) {
        point = 2;
        swapTo(1);
        tween((v) => (p2 = v), p2, 1, STAGE_MS);
        return 'consume';
      }
      if (point === 2) {
        point = 3;
        swapTo(2);
        tween((v) => (p3 = v), p3, 1, STAGE_MS);
        return 'consume';
      }
      // 第三點再向下：放行離開
      locked = false;
      return 'release';
    }
    // 向上
    if (point === 3) {
      point = 2;
      swapTo(1);
      tween((v) => (p3 = v), p3, 0, STAGE_MS);
      return 'consume';
    }
    if (point === 2) {
      point = 1;
      swapTo(0);
      tween((v) => (p2 = v), p2, 0, STAGE_MS);
      return 'consume';
    }
    // 第一點再向上：放行離開
    locked = false;
    return 'release';
  }

  // ---- 滾輪（鎖定期間非 passive 以便 preventDefault） ----
  window.addEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (touchMode) return;
      const now = performance.now();
      lastWheelTs = now;
      if (!locked) return;

      // 動畫播放中或冷卻期：吞掉並清空累積
      if (animating || now - lastStepTs < STEP_COOLDOWN_MS) {
        accum = 0;
        event.preventDefault();
        return;
      }

      // 累積位移：小殘餘不計；方向改變即重置
      if (Math.abs(event.deltaY) >= ACCUM_MIN_DELTA) {
        if (Math.sign(event.deltaY) !== Math.sign(accum)) accum = 0;
        accum += event.deltaY;
      }

      if (Math.abs(accum) < ACCUM_THRESHOLD) {
        event.preventDefault();
        return;
      }

      const dir: 1 | -1 = accum > 0 ? 1 : -1;
      accum = 0;
      lastStepTs = now;
      const decision = step(dir);
      if (decision === 'consume') event.preventDefault();
      // release：不阻擋此事件，讓頁面自然離開
    },
    { passive: false },
  );

  // ---- 鍵盤步進（無障礙） ----
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!locked || touchMode) return;
    const isDown =
      (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey));
    const isUp = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
    if (!isDown && !isUp) return;
    const decision = step(isDown ? 1 : -1);
    if (decision === 'consume') event.preventDefault();
  });

  // 偵測觸控：停用鎖定（觸控裝置維持自然捲動）
  window.addEventListener(
    'touchstart',
    () => {
      touchMode = true;
      locked = false;
    },
    { passive: true, once: true },
  );

  // ---- 進入偵測與捲軸逃逸 ----
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      const prevY = lastY;
      lastY = y;

      if (touchMode) return;

      if (!locked) {
        // 向下跨過區塊頂端 → 鎖定（暴力滑動也會被夾回對齊）；
        // ±2px 容差帶：放行離開時起點就在對齊點上，不得立即誤判回鎖
        if (goingDown && prevY < sectionTop - 2 && y >= sectionTop - 2) {
          engageLock();
          return;
        }
        // 自下方向上跨過區塊頂端 → 以完成狀態鎖定（反向逐步倒退）
        if (!goingDown && prevY > sectionTop + 2 && y <= sectionTop + 2) {
          engageLockFromBelow();
          return;
        }
        // 回到區塊上方一段距離 → 重置以便重看
        if (y < sectionTop - window.innerHeight * 0.9 && arrived) {
          resetAll();
        }
        return;
      }

      // 鎖定中：頁面若仍被移動——
      // 滾輪已全數 preventDefault，殘餘位移多半是鎖定前事件的飛行中動畫 → 夾回；
      // 只有「長時間無滾輪事件＋大幅位移」（捲軸拖曳）才視為使用者接管、靜默解鎖
      const drift = Math.abs(y - sectionTop);
      if (drift <= 1) return;
      const now = performance.now();
      const wheelRecent = now - lastWheelTs < 1200;
      const justLocked = now - lockedAt < 700;
      if (justLocked || wheelRecent || drift <= 250) {
        alignToSection();
      } else {
        locked = false;
      }
    },
    { passive: true },
  );

  // 初始：僅中心實心圓＋第一點文字
  apply();
}

initMissionScroll();
