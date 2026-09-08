/**
 * Hero 循環輪播（v2.0，無縫輪迴、無淡出重置）：
 * - 全部轉場統一為垂直滑動字槽（機制同 Animate UI「Rotating Text」primitive，原生重寫）：
 *   舊字下滑出、新字自上方滑入；時長與緩動由 CSS 變數 --hc-dur／--hc-ease 控制。
 * - 循環結構（首次載入直接從開場狀態開始）：
 *   O1 開場＝合併終態：左「致遠體驗設計」置中、右 Reach／Experience／Design，停留。
 *   O2 「體驗設計」往下滑出消失，「致遠」整行滑回原本上下合併的位置。
 *   O3 拉霸：「遠」字槽快速輪轉 遠→深→廣→遠→深→廣→遠→深（樣式同一般換幕、
 *      整體漸快再漸慢），落定「致深」。
 *   O4 「致」「深」以 FLIP 上下分離飛回句中位置；右欄同步滑至 deeper understanding。
 *   O5 句子其餘文字淡入（致／深由飛行字覆蓋維持全亮）＝「深」幕，停留。
 *   幕「廣」→ 幕「遠」→ 致遠合併（morphToBrand，含體驗設計滑入）→ 回到 O1。
 * - prefers-reduced-motion 或無 JS：CSS 直接顯示靜態完整版，本腳本不啟動。
 * - 僅使用 opacity／transform；字槽固定尺寸，無 layout shift。
 */

/** 每幕「動畫結束後」的靜止停留（O1、深、廣、遠四個停點統一） */
const DWELL_MS = 3500;
/** 首次載入的品牌開場停留：比循環中的停留短，讓動畫早點開始 */
const FIRST_DWELL_MS = 1000;
/** 與 index.astro 的 --hc-dur 保持一致 */
const SLIDE_MS = 850;
/** 與 index.astro 的 --hc-fly-dur 保持一致（合併／分離飛行） */
const FLY_MS = 850;
/** 合併完成後，整行「致遠」水平滑回置中的時長（與 CSS .hc-brand transition 同步） */
const GLIDE_MS = 700;
/** 與 CSS .hc-line 的 opacity transition 同步（句子淡入／淡出） */
const LINE_FADE_MS = 850;
/** 最終停留位置：0.5＝左欄正中，越大越靠頁面中間 */
const BRAND_CENTER_BIAS = 0.65;
/** 拉霸：整串以「連續捲軸＋單一 transition」完成（整體漸快再漸慢、中途無頓挫） */
const SPIN_MS = 2000;
const SPIN_EASE = 'cubic-bezier(0.83, 0, 0.17, 1)'; // 與 --hc-ease 同曲線
/** 拉霸字序：遠→深→廣→遠→深→廣→遠→深（結尾落定「深」） */
const SPIN_SEQUENCE = ['遠', '深', '廣', '遠', '深', '廣', '遠', '深'] as const;
/** 捲軸每格高度，與 .hc-slot／.hc-spin-cell 的 1.12em 一致 */
const SPIN_CELL_EM = 1.12;

export function initHeroCarousel(): void {
  const root = document.querySelector<HTMLElement>('[data-hc]');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stage = root.querySelector<HTMLElement>('[data-hc-stage]');
  const line1 = root.querySelector<HTMLElement>('[data-hc-line1]');
  const line2 = root.querySelector<HTMLElement>('[data-hc-line2]');
  const zhi = root.querySelector<HTMLElement>('[data-hc-zhi]');
  const brand = root.querySelector<HTMLElement>('[data-hc-brand]');
  const brandZhi = root.querySelector<HTMLElement>('[data-hc-brand-zhi]');
  const brandSlot = root.querySelector<HTMLElement>('[data-hc-brand-slot]');
  const brandRest = root.querySelector<HTMLElement>('[data-hc-brand-rest]');
  const brandSlotItems = brandSlot
    ? Array.from(brandSlot.querySelectorAll<HTMLElement>('.hc-slide-item'))
    : [];
  const leftItems = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-left] .hc-slide-item'));
  const phraseItems = Array.from(
    root.querySelectorAll<HTMLElement>('[data-hc-phrase] .hc-slide-item'),
  );
  const zhItems = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-zh] .hc-slide-item'));

  if (
    !stage || !line1 || !line2 || !zhi || !brand || !brandZhi || !brandSlot || !brandRest ||
    brandSlotItems.length !== 3 || leftItems.length !== 3 ||
    phraseItems.length !== 4 || zhItems.length !== 4
  ) {
    return;
  }

  const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));
  /** 等兩個影格：確保待命狀態先渲染過，之後補上的 is-current 才會觸發 transition */
  const nextFrame = () =>
    new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())));

  /** 單一字槽的滑動切換 */
  function slideGroup(items: HTMLElement[], index: number): void {
    items.forEach((el, i) => {
      if (i === index) {
        el.classList.remove('is-leaving', 'no-anim');
        el.classList.add('is-current');
      } else if (el.classList.contains('is-current')) {
        el.classList.remove('is-current');
        el.classList.add('is-leaving');
        window.setTimeout(() => {
          // 離場後無動畫地歸位到下方待命
          el.classList.add('no-anim');
          el.classList.remove('is-leaving');
          void el.offsetWidth;
          el.classList.remove('no-anim');
        }, SLIDE_MS + 80);
      }
    });
  }

  /** 換幕：左欄字（深／廣／遠）與右欄詞組、中文句同步滑動 */
  function slideTo(index: number): void {
    if (index <= 2) slideGroup(leftItems, index);
    slideGroup(phraseItems, index);
    slideGroup(zhItems, index);
  }

  /** 停留進度：轉場結束後，右欄第二行詞組與第三行中文句同時以淡色螢光筆掃過
   *（時長曲線見 CSS） */
  function startPhraseSweep(index: number): void {
    if (index > 2) return; // 品牌開場的 Experience／Design 不套用
    phraseItems[index]?.classList.add('is-sweeping');
    zhItems[index]?.classList.add('is-sweeping');
  }

  /** 底線隨舊字句一起滑出，待其離場歸位（不可見）後才移除、瞬間歸零 */
  function clearPhraseSweep(): void {
    for (const el of [...phraseItems, ...zhItems]) el.classList.remove('is-sweeping');
  }

  /** 無動畫直接定位一組字槽；index 為 -1 時全部歸回下方待命（空槽） */
  function snapGroup(items: HTMLElement[], index: number): void {
    items.forEach((el, i) => {
      el.classList.add('no-anim');
      el.classList.toggle('is-current', i === index);
      el.classList.remove('is-leaving');
      void el.offsetWidth;
      el.classList.remove('no-anim');
    });
  }

  /** 量字形實際渲染範圍（Range）：不受元素是 inline 或 flex item 影響 */
  function glyphRect(el: HTMLElement): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  }

  /** 建立飛行字（FLIP clone），置於 from 位置並做像素級校正 */
  function makeClone(text: string, from: DOMRect, stageRect: DOMRect): HTMLElement {
    const el = document.createElement('span');
    el.className = 'hc-clone';
    const inner = document.createElement('span');
    inner.textContent = text;
    el.appendChild(inner);
    el.style.left = `${from.left - stageRect.left}px`;
    el.style.top = `${from.top - stageRect.top}px`;
    stage!.appendChild(el);
    // clone 是絕對定位盒，行高會讓字形在盒內位置與行內原字不同（實測偏 ~3px），
    // 以內層字形實測位置校正外框，起飛與落地皆與實體字重合
    const innerRect = inner.getBoundingClientRect();
    el.style.left = `${from.left - stageRect.left + (from.left - innerRect.left)}px`;
    el.style.top = `${from.top - stageRect.top + (from.top - innerRect.top)}px`;
    return el;
  }

  /** 首次載入：無動畫直接就位到 O1 開場（＝合併終態） */
  async function snapToBrandState(): Promise<void> {
    await nextFrame();
    line1!.classList.add('is-faded');
    line2!.classList.add('is-faded');
    zhi!.classList.add('is-ghost');
    snapGroup(leftItems, -1);
    snapGroup(phraseItems, 3);
    snapGroup(zhItems, 3);

    const stageRect = stage!.getBoundingClientRect();
    const zhiFrom = glyphRect(zhi!);
    brand!.style.transition = 'none';
    brand!.style.insetInlineStart = `${zhiFrom.left - stageRect.left}px`;
    brand!.style.transform = 'none';
    brandRest!.classList.add('no-anim');
    brandRest!.classList.add('is-current');
    void brand!.offsetWidth;
    const brandRect = brand!.getBoundingClientRect();
    const deltaX =
      (stageRect.width - brandRect.width) * BRAND_CENTER_BIAS - (brandRect.left - stageRect.left);
    brand!.style.transform = `translateX(${deltaX}px)`;
    void brand!.offsetWidth;
    brand!.style.transition = '';
    brandRest!.classList.remove('no-anim');
    brand!.classList.add('is-shown');
  }

  /** O2：「體驗設計」往下滑出消失，「致遠」整行滑回上下合併點 */
  async function retractBrand(): Promise<void> {
    // is-leaving＝往下滑出；離場後無動畫歸回上方待命，供下一輪合併自上方滑入
    brandRest!.classList.remove('is-current');
    brandRest!.classList.add('is-leaving');
    window.setTimeout(() => {
      brandRest!.classList.add('no-anim');
      brandRest!.classList.remove('is-leaving');
      void brandRest!.offsetWidth;
      brandRest!.classList.remove('no-anim');
    }, SLIDE_MS + 80);
    await wait(SLIDE_MS * 0.4);
    brand!.style.transform = 'translateX(0px)';
    await wait(Math.max(GLIDE_MS, SLIDE_MS * 0.6) + 80);
  }

  /** O3：拉霸——「遠」字槽輪轉 遠→深→廣→…→深。
   *  以連續捲軸取代逐格切換：整串只有一次 transition，
   *  單一曲線整體漸快再漸慢，中途每個字等速連續流過、無逐格頓挫 */
  async function spinBrandSlot(): Promise<void> {
    const strip = document.createElement('span');
    strip.className = 'hc-spin-strip';
    // 往下捲動＝顯示順序與 DOM 堆疊相反，故以反序建格：
    // 起點對齊最末格（遠），捲回 0 依序流過 深→廣→…，落定首格（深）
    for (const ch of [...SPIN_SEQUENCE].reverse()) {
      const cell = document.createElement('span');
      cell.className = 'hc-spin-cell';
      cell.textContent = ch;
      strip.appendChild(cell);
    }
    // 同一影格內：清空實體字槽、掛上捲軸（起始格「遠」與原字同位，無縫換手）
    snapGroup(brandSlotItems, -1);
    brandSlot!.appendChild(strip);
    strip.style.transform = `translateY(${-(SPIN_SEQUENCE.length - 1) * SPIN_CELL_EM}em)`;
    void strip.offsetWidth;
    strip.style.transition = `transform ${SPIN_MS}ms ${SPIN_EASE}`;
    strip.style.transform = 'translateY(0)';
    await wait(SPIN_MS + 80);
    // 末格「深」與實體字同位：實體接手後移除捲軸
    snapGroup(brandSlotItems, 1);
    strip.remove();
  }

  /** O4＋O5：「致深」上下分離飛回句中（右欄同步切 deeper），句子其餘文字淡入 */
  async function splitToLines(): Promise<void> {
    const shenBrand = brandSlotItems[1]!; // 拉霸落定的「深」
    const shenLine = leftItems[0]!; // 句中的「深」

    // 落點就位（句子仍隱藏）：左欄字槽直接置入「深」並先隱形，待淡入完成後換手
    shenLine.classList.add('is-ghost');
    snapGroup(leftItems, 0);

    const stageRect = stage!.getBoundingClientRect();
    const zhiFrom = glyphRect(brandZhi!);
    const shenFrom = glyphRect(shenBrand);
    const zhiTo = glyphRect(zhi!);
    const shenTo = glyphRect(shenLine);

    const cloneZhi = makeClone('致', zhiFrom, stageRect);
    const cloneShen = makeClone('深', shenFrom, stageRect);

    // 分離飛行、品牌行淡出、右欄切至 deeper「同時」啟動
    void cloneZhi.offsetWidth;
    brand!.classList.remove('is-shown');
    cloneZhi.style.transform = `translate(${zhiTo.left - zhiFrom.left}px, ${zhiTo.top - zhiFrom.top}px)`;
    cloneShen.style.transform = `translate(${shenTo.left - shenFrom.left}px, ${shenTo.top - shenFrom.top}px)`;
    slideGroup(phraseItems, 0);
    slideGroup(zhItems, 0);

    await wait(FLY_MS);

    // 品牌行於不可見狀態下歸位，字槽回到「遠」待命下一輪合併
    brand!.style.transition = 'none';
    brand!.style.transform = 'none';
    brand!.style.insetInlineStart = '0px';
    void brand!.offsetWidth;
    brand!.style.transition = '';
    snapGroup(brandSlotItems, 0);

    // O5：句子其餘文字淡入；致／深由飛行字覆蓋維持全亮，淡入完成後換手
    line1!.classList.remove('is-faded');
    line2!.classList.remove('is-faded');
    await wait(LINE_FADE_MS);
    zhi!.classList.remove('is-ghost');
    shenLine.classList.remove('is-ghost');
    leftItems[2]!.classList.remove('is-ghost'); // 上一輪合併時隱形的「遠」歸隊
    cloneZhi.remove();
    cloneShen.remove();
  }

  /** 幕「遠」→ O1：致、遠「純垂直」合併（致↓遠↑），整行滑回置中後「體驗設計」滑入 */
  async function morphToBrand(): Promise<void> {
    const yuanSource = leftItems[2]!;
    const yuanTarget = brandSlotItems[0]!; // 品牌字槽中的「遠」
    const stageRect = stage!.getBoundingClientRect();
    const zhiFrom = glyphRect(zhi!);
    const yuanFrom = glyphRect(yuanSource);

    // 將品牌行水平對齊「致」的原始 x：合併位移只剩垂直分量。
    // 需先暫停 transition 再歸零，否則上一輪殘留的 translateX 會在此刻播出一段殘影。
    brand!.style.transition = 'none';
    brand!.style.transform = 'none';
    brand!.style.insetInlineStart = `${zhiFrom.left - stageRect.left}px`;
    void brand!.offsetWidth;
    brand!.style.transition = '';

    const zhiTo = glyphRect(brandZhi!);
    const yuanTo = glyphRect(yuanTarget);

    const cloneZhi = makeClone('致', zhiFrom, stageRect);
    const cloneYuan = makeClone('遠', yuanFrom, stageRect);

    // 原字立即隱形（改由 clone 呈現）
    zhi!.classList.add('is-ghost');
    yuanSource.classList.add('is-ghost');

    // 淡出、合併飛行、右欄切換「同時」啟動（強制 reflow 後套 transform）
    void cloneZhi.offsetWidth;
    line1!.classList.add('is-faded');
    line2!.classList.add('is-faded');
    cloneZhi.style.transform = `translate(${zhiTo.left - zhiFrom.left}px, ${zhiTo.top - zhiFrom.top}px)`;
    cloneYuan.style.transform = `translate(${yuanTo.left - yuanFrom.left}px, ${yuanTo.top - yuanFrom.top}px)`;
    slideTo(3);

    // 垂直合併落地：實體「致遠」浮現、移除飛行字
    await wait(FLY_MS);
    brand!.classList.add('is-shown');
    await wait(180);
    cloneZhi.remove();
    cloneYuan.remove();

    // 整行滑回置中，途中「體驗設計」滑入
    const h1Rect = stage!.getBoundingClientRect();
    const brandRect = brand!.getBoundingClientRect();
    const deltaX =
      (h1Rect.width - brandRect.width) * BRAND_CENTER_BIAS - (brandRect.left - h1Rect.left);
    brand!.style.transform = `translateX(${deltaX}px)`;
    await wait(260);
    brandRest!.classList.add('is-current');
    await wait(Math.max(SLIDE_MS, GLIDE_MS - 260) + 80);
  }

  async function run(): Promise<void> {
    await snapToBrandState();
    let firstCycle = true;
    for (;;) {
      // O1／合併終態：致遠體驗設計（首次載入停 1 秒，循環中停 3.5 秒）
      await wait(firstCycle ? FIRST_DWELL_MS : DWELL_MS);
      firstCycle = false;
      await retractBrand(); // O2
      await wait(220);
      await spinBrandSlot(); // O3
      await wait(160);
      await splitToLines(); // O4＋O5 → 幕「深」
      startPhraseSweep(0);
      await wait(DWELL_MS); // 深
      slideTo(1); // 舊詞組帶著底線一起滑出
      await wait(SLIDE_MS);
      clearPhraseSweep();
      startPhraseSweep(1);
      await wait(DWELL_MS); // 廣
      slideTo(2);
      await wait(SLIDE_MS);
      clearPhraseSweep();
      startPhraseSweep(2);
      await wait(DWELL_MS); // 遠
      await morphToBrand(); // 合併（詞組帶著底線滑出）→ 銜接回 O1
      clearPhraseSweep();
    }
  }

  void run();
}

initHeroCarousel();
