/**
 * Hero「更深／更廣／更遠」互動：
 * - 語意化 button，支援滑鼠、鍵盤與觸控。
 * - 預設選中「更深」；切換 220ms opacity＋translateY(4px)；reduced-motion 直接換內容。
 * - 說明區固定最小高度，切換不造成版面跳動。
 */
const VALUE_CONTENT: Record<string, string> = {
  deeper: '讓決策源自理解',
  wider: '讓全局清晰可見',
  further: '讓改變真實發生',
};

export function initHeroValues(): void {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-hero-value]'),
  );
  const panel = document.querySelector<HTMLElement>('[data-hero-value-panel]');
  const panelText = document.querySelector<HTMLElement>('[data-hero-value-text]');
  if (buttons.length === 0 || !panel || !panelText) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeKey = 'deeper';
  let swapTimer: number | undefined;

  function select(key: string): void {
    if (key === activeKey || !(key in VALUE_CONTENT)) return;
    activeKey = key;

    for (const button of buttons) {
      const isActive = button.dataset.heroValue === key;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('is-active', isActive);
    }

    if (reduceMotion) {
      panelText!.textContent = VALUE_CONTENT[key];
      return;
    }

    window.clearTimeout(swapTimer);
    panel!.classList.add('is-swapping');
    swapTimer = window.setTimeout(() => {
      panelText!.textContent = VALUE_CONTENT[key];
      panel!.classList.remove('is-swapping');
    }, 220);
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const key = button.dataset.heroValue;
      if (key) select(key);
    });
  }
}

initHeroValues();
