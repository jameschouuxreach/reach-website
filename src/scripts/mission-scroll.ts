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
const ENGAGE_COOLDOWN_MS = 800; // 進場／回鎖冷卻：抵達的同一次甩動整串不得步進
const ACCUM_THRESHOLD = 100; // 累積位移達此值＝一步（滑鼠一格 tick 即達標）
const ACCUM_MIN_DELTA = 15; // 小於此值的事件不累積（過濾慣性尾巴的微小殘餘）
const ARC_GROW_PORTION = 0.95; // 階段一內部：前 95% 弧段延長，後 5% 完整圓淡入

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

  function snapSwapTo(index: number): void {
    slots.forEach((el) => el.classList.add('no-anim'));
    swapTo(index);
    void slots[0]!.offsetWidth;
    slots.forEach((el) => el.classList.remove('no-anim'));
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
        cooldownUntil = performance.now() + STEP_COOLDOWN_MS; // 動畫結束重啟冷卻：吃掉期間的慣性
      }
    };
    rafId = requestAnimationFrame(frame);
  }

  // ---- 鎖定與步進狀態機 ----
  let point: 1 | 2 | 3 = 1; // 目前停留的點
  let experienceDone = false; // 首次完整走完並向下離開後，不再鎖定（自由捲動）
  let locked = false;
  let lockedAt = 0; // 鎖定時間戳（鎖定初期的漂移一律夾回）
  let arrived = false; // 第一段是否已自動播放
  let touchMode = false; // 偵測到觸控即停用鎖定
  let lastY = window.scrollY;
  let lastWheelTs = 0;
  let accum = 0; // 滾動累積量（正＝向下）
  let cooldownUntil = 0;
  let lockY = 0; // 鎖定捲動位置＝區塊頂 − 導覽列高（區塊頂對齊導覽列底部）

  function measure(): void {
    // 取整：瀏覽器捲動位置為整數，小數邊界會讓「跨越」判定在對齊點附近抖動誤觸
    const sectionTop = Math.round(root!.getBoundingClientRect().top + window.scrollY);
    const header = document.querySelector<HTMLElement>('header');
    const headerH = header ? Math.round(header.offsetHeight) : 72;
    lockY = sectionTop - headerH;
  }
  measure();
  window.addEventListener('resize', measure);

  const alignToSection = () =>
    window.scrollTo({ top: lockY, behavior: 'instant' as ScrollBehavior });

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
    accum = 0;
    cooldownUntil = lockedAt + ENGAGE_COOLDOWN_MS; // 抵達的同一次滑動不得立即步進
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
    accum = 0;
    cooldownUntil = lockedAt + ENGAGE_COOLDOWN_MS; // 同一次上滑不得直接退回第二點，需再滑一次
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
      // 第三點再向下：放行離開；首次體驗完成，之後不再鎖定
      locked = false;
      experienceDone = true;
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

  // ---- Tabs：自由切換三點。一律從該點的開頭「正向」播放該階段動畫，
  //     不因往回跳而倒放（前置階段瞬間就位、後續階段瞬間清空） ----
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

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      arrived = true; // 手動切換視同已看過進場
      if ((i + 1) as 1 | 2 | 3 !== point) goToPoint((i + 1) as 1 | 2 | 3);
    });
  });

  // ---- 滾輪（鎖定期間非 passive 以便 preventDefault） ----
  window.addEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (touchMode) return;
      const now = performance.now();
      lastWheelTs = now;
      if (!locked) return;

      // 動畫播放中或冷卻期：吞掉並清空累積
      if (animating || now < cooldownUntil) {
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
      cooldownUntil = now + STEP_COOLDOWN_MS;
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
        // 首次完整體驗結束後不再鎖定：區塊如一般內容自由捲動（tabs 仍可切換）
        if (experienceDone) return;
        // 向下跨過鎖定點 → 鎖定（暴力滑動也會被夾回對齊）；
        // ±2px 容差帶：放行離開時起點就在對齊點上，不得立即誤判回鎖
        if (goingDown && prevY < lockY - 2 && y >= lockY - 2) {
          engageLock();
          return;
        }
        // 自下方向上跨過鎖定點 → 以完成狀態鎖定（反向逐步倒退）
        if (!goingDown && prevY > lockY + 2 && y <= lockY + 2) {
          engageLockFromBelow();
          return;
        }
        // 回到區塊上方一段距離 → 重置以便重看
        if (y < lockY - window.innerHeight * 0.9 && arrived) {
          resetAll();
        }
        return;
      }

      // 鎖定中：頁面若仍被移動——
      // 滾輪已全數 preventDefault，殘餘位移多半是鎖定前事件的飛行中動畫 → 夾回；
      // 只有「長時間無滾輪事件＋大幅位移」（捲軸拖曳）才視為使用者接管、靜默解鎖
      const drift = Math.abs(y - lockY);
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
