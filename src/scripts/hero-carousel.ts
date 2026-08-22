/**
 * Hero 四幕輪播（2026-08-22 v1.1，取代原 hover 互動＋第 7 區 Reach sticky scroll）：
 * - 幕 1–3：左欄打字機刪改「深→廣→遠」（帶閃爍游標），右欄同步切換 Reach 句＋中文句。
 * - 幕 3→4：「致」「遠」以 FLIP 位移合併成「致遠」，再打字補上「體驗設計」；右欄收束為
 *   Reach better experiences。
 * - 第四幕停留後淡出重置，回第一幕無限循環。
 * - prefers-reduced-motion 或無 JS：CSS 直接顯示靜態完整版，本腳本不啟動。
 * - 僅使用 opacity／transform；打字格固定 1em 寬，無 layout shift。
 */

const DWELL_MS = 3200;
const BRAND_DWELL_MS = 5200;
const BRAND_TEXT = '體驗設計';

export function initHeroCarousel(): void {
  const root = document.querySelector<HTMLElement>('[data-hc]');
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stage = root.querySelector<HTMLElement>('[data-hc-stage]');
  const line1 = root.querySelector<HTMLElement>('[data-hc-line1]');
  const line2 = root.querySelector<HTMLElement>('[data-hc-line2]');
  const zhi = root.querySelector<HTMLElement>('[data-hc-zhi]');
  const slot = root.querySelector<HTMLElement>('[data-hc-slot]');
  const caret = root.querySelector<HTMLElement>('[data-hc-caret]');
  const brand = root.querySelector<HTMLElement>('[data-hc-brand]');
  const brandZhi = root.querySelector<HTMLElement>('[data-hc-brand-zhi]');
  const brandYuan = root.querySelector<HTMLElement>('[data-hc-brand-yuan]');
  const brandRest = root.querySelector<HTMLElement>('[data-hc-brand-rest]');
  const brandCaret = root.querySelector<HTMLElement>('[data-hc-brand-caret]');
  const pairs = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-pair]'));

  if (
    !stage || !line1 || !line2 || !zhi || !slot || !caret ||
    !brand || !brandZhi || !brandYuan || !brandRest || !brandCaret ||
    pairs.length !== 4
  ) {
    return;
  }

  const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));

  function setPair(index: number): void {
    pairs.forEach((pair, i) => pair.classList.toggle('is-current', i === index));
  }

  /** 幕 1–3 的打字刪改：刪掉現有字 → 停頓 → 打上新字 */
  async function swapChar(next: string): Promise<void> {
    caret!.classList.add('is-typing');
    await wait(280);
    slot!.textContent = '';
    await wait(320);
    slot!.textContent = next;
    await wait(180);
    caret!.classList.remove('is-typing');
  }

  /** 幕 3→4：致、遠合併，再打出「體驗設計」 */
  async function morphToBrand(): Promise<void> {
    const stageRect = stage!.getBoundingClientRect();
    const zhiFrom = zhi!.getBoundingClientRect();
    const yuanFrom = slot!.getBoundingClientRect();
    const zhiTo = brandZhi!.getBoundingClientRect();
    const yuanTo = brandYuan!.getBoundingClientRect();

    const makeClone = (text: string, from: DOMRect): HTMLElement => {
      const el = document.createElement('span');
      el.className = 'hc-clone';
      el.textContent = text;
      el.style.left = `${from.left - stageRect.left}px`;
      el.style.top = `${from.top - stageRect.top}px`;
      stage!.appendChild(el);
      return el;
    };

    const cloneZhi = makeClone('致', zhiFrom);
    const cloneYuan = makeClone('遠', yuanFrom);

    // 原字立即隱形（改由 clone 呈現），其餘文字淡出
    zhi!.classList.add('is-ghost');
    slot!.classList.add('is-ghost');
    caret!.classList.add('is-hidden');
    line1!.classList.add('is-faded');
    line2!.classList.add('is-faded');
    await wait(300);

    // 強制 reflow 後啟動位移
    void cloneZhi.offsetWidth;
    cloneZhi.style.transform = `translate(${zhiTo.left - zhiFrom.left}px, ${zhiTo.top - zhiFrom.top}px)`;
    cloneYuan.style.transform = `translate(${yuanTo.left - yuanFrom.left}px, ${yuanTo.top - yuanFrom.top}px)`;
    setPair(3);
    await wait(620);

    brand!.classList.add('is-shown');
    await wait(140);
    cloneZhi.remove();
    cloneYuan.remove();

    brandCaret!.classList.add('is-visible', 'is-typing');
    for (const ch of BRAND_TEXT) {
      brandRest!.textContent += ch;
      await wait(170);
    }
    brandCaret!.classList.remove('is-typing');
  }

  /** 第四幕結束：整體淡出、還原為第一幕、淡入 */
  async function resetToStart(): Promise<void> {
    root!.classList.add('is-resetting');
    await wait(460);

    brand!.classList.remove('is-shown');
    brandRest!.textContent = '';
    brandCaret!.classList.remove('is-visible', 'is-typing');
    zhi!.classList.remove('is-ghost');
    slot!.classList.remove('is-ghost');
    slot!.textContent = '深';
    caret!.classList.remove('is-hidden');
    line1!.classList.remove('is-faded');
    line2!.classList.remove('is-faded');
    setPair(0);

    await wait(80);
    root!.classList.remove('is-resetting');
    await wait(460);
  }

  async function run(): Promise<void> {
    for (;;) {
      await wait(DWELL_MS); // 第一幕
      setPair(1);
      await swapChar('廣');
      await wait(DWELL_MS); // 第二幕
      setPair(2);
      await swapChar('遠');
      await wait(DWELL_MS); // 第三幕
      await morphToBrand();
      await wait(BRAND_DWELL_MS); // 第四幕
      await resetToStart();
    }
  }

  void run();
}

initHeroCarousel();
