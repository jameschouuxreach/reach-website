/**
 * Hero 四幕輪播（v1.2）：
 * - 全部轉場統一為垂直滑動字槽（機制同 Animate UI「Rotating Text」primitive，原生重寫）：
 *   舊字上滑出、新字自下方滑入；時長與緩動由 CSS 變數 --hc-dur／--hc-ease 控制。
 * - 進場（首次載入與每輪重置後皆播放）：主標與「Reach」直接顯示；左欄「深」與右欄詞組、
 *   中文句自下方滑入（與換幕同一轉場），這些字槽在標記中不預設 is-current，由本腳本補上。
 * - 幕 1–3：左欄「深→廣→遠」與右欄詞組、中文句同步滑動；右欄「Reach」固定不動。
 * - 幕 3→4：「致」「遠」以 FLIP 位移合併成「致遠」，「體驗設計」自下方滑入。
 * - 第四幕停留後淡出重置：字槽歸回待命（空槽），淡入後重播進場滑入，無限循環。
 * - prefers-reduced-motion 或無 JS：CSS 直接顯示靜態完整版，本腳本不啟動。
 * - 僅使用 opacity／transform；字槽固定尺寸，無 layout shift。
 */

/** 每幕「動畫結束後」的靜止停留，四幕統一 */
const DWELL_MS = 2000;
/** 每輪重置淡入後、進場滑入前的小拍（首次載入不留空拍，直接滑入） */
const REENTER_DELAY_MS = 350;
/** 與 index.astro 的 --hc-dur 保持一致 */
const SLIDE_MS = 850;
/** 與 index.astro 的 --hc-fly-dur 保持一致（幕 3→4 合併飛行）。
 *  與 SLIDE_MS 同值：致遠合併與右欄切至 Experience／Design 同始同終。 */
const FLY_MS = 850;
/** 合併完成後，整行「致遠」水平滑回置中的時長（與 CSS .hc-brand transition 同步） */
const GLIDE_MS = 700;
/** 最終停留位置：0.5＝左欄正中，越大越靠頁面中間 */
const BRAND_CENTER_BIAS = 0.65;

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
  const brandYuan = root.querySelector<HTMLElement>('[data-hc-brand-yuan]');
  const brandRest = root.querySelector<HTMLElement>('[data-hc-brand-rest]');
  const leftItems = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-left] .hc-slide-item'));
  const phraseItems = Array.from(
    root.querySelectorAll<HTMLElement>('[data-hc-phrase] .hc-slide-item'),
  );
  const zhItems = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-zh] .hc-slide-item'));

  if (
    !stage || !line1 || !line2 || !zhi || !brand || !brandZhi || !brandYuan || !brandRest ||
    leftItems.length !== 3 || phraseItems.length !== 4 || zhItems.length !== 4
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

  /** 換幕：左欄字（幕 1–3）與右欄詞組、中文句同步滑動 */
  function slideTo(index: number): void {
    if (index <= 2) slideGroup(leftItems, index);
    slideGroup(phraseItems, index);
    slideGroup(zhItems, index);
  }

  /** 直接定位到某一幕（重置用，不播動畫）；index 為 -1 時全部歸回下方待命（空槽） */
  function snapTo(index: number): void {
    for (const items of [leftItems, phraseItems, zhItems]) {
      items.forEach((el, i) => {
        el.classList.add('no-anim');
        el.classList.toggle('is-current', i === index);
        el.classList.remove('is-leaving');
        void el.offsetWidth;
        el.classList.remove('no-anim');
      });
    }
  }

  /** 量字形實際渲染範圍（Range）：不受元素是 inline 或 flex item 影響 */
  function glyphRect(el: HTMLElement): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  }

  /** 幕 3→4：致、遠「純垂直」合併（致↓遠↑），整行滑回置中後「體驗設計」滑入 */
  async function morphToBrand(): Promise<void> {
    const yuanSource = leftItems[2]!;
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
    const yuanTo = glyphRect(brandYuan!);

    const makeClone = (text: string, from: DOMRect): HTMLElement => {
      const el = document.createElement('span');
      el.className = 'hc-clone';
      const inner = document.createElement('span');
      inner.textContent = text;
      el.appendChild(inner);
      el.style.left = `${from.left - stageRect.left}px`;
      el.style.top = `${from.top - stageRect.top}px`;
      stage!.appendChild(el);
      // 像素級校正：clone 是絕對定位盒，行高會讓字形在盒內位置與行內原字不同
      // （實測偏 ~3px）。以內層字形實測位置校正外框，起飛與落地皆與實體字重合。
      const innerRect = inner.getBoundingClientRect();
      el.style.left = `${from.left - stageRect.left + (from.left - innerRect.left)}px`;
      el.style.top = `${from.top - stageRect.top + (from.top - innerRect.top)}px`;
      return el;
    };

    const cloneZhi = makeClone('致', zhiFrom);
    const cloneYuan = makeClone('遠', yuanFrom);

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

  /** 第四幕結束：整體淡出、還原為第一幕、淡入 */
  async function resetToStart(): Promise<void> {
    root!.classList.add('is-resetting');
    await wait(460);

    brand!.classList.remove('is-shown');
    brand!.style.transition = 'none';
    brand!.style.transform = 'none';
    brand!.style.insetInlineStart = '0px';
    void brand!.offsetWidth;
    brand!.style.transition = '';
    brandRest!.classList.add('no-anim');
    brandRest!.classList.remove('is-current');
    void brandRest!.offsetWidth;
    brandRest!.classList.remove('no-anim');
    zhi!.classList.remove('is-ghost');
    leftItems[2]!.classList.remove('is-ghost');
    line1!.classList.remove('is-faded');
    line2!.classList.remove('is-faded');
    // 歸回待命（空槽）而非直接放好第一幕：淡入後由 run() 重播進場滑入
    snapTo(-1);

    await wait(80);
    root!.classList.remove('is-resetting');
    await wait(460);
  }

  async function run(): Promise<void> {
    let firstCycle = true;
    for (;;) {
      // 進場：「深」與右欄詞組、中文句自下方滑入第一幕（首次載入與每輪重置後皆播放）。
      // 首次載入不留空拍，直接滑入；重置淡入後留一小拍再滑
      if (firstCycle) {
        await nextFrame();
      } else {
        await wait(REENTER_DELAY_MS);
      }
      slideTo(0);
      await wait(SLIDE_MS);

      await wait(DWELL_MS); // 第一幕
      firstCycle = false;
      slideTo(1);
      await wait(SLIDE_MS); // 等滑動完成，停留自動畫結束起算
      await wait(DWELL_MS); // 第二幕
      slideTo(2);
      await wait(SLIDE_MS);
      await wait(DWELL_MS); // 第三幕
      await morphToBrand();
      await wait(DWELL_MS); // 第四幕
      await resetToStart();
    }
  }

  void run();
}

initHeroCarousel();
