/**
 * 公共服務內頁的角色 Tab（WAI-ARIA tabs，自動選取）。
 * - 漸進增強：伺服器輸出兩角色全部內容、Tab 列 hidden；全部元素找齊後才顯示 Tab、隱藏非目前角色的 panel 與 CTA。
 * - 單一 setActiveRole 同步 tab（aria-selected／tabindex）、panel 與 CTA，避免內容與 Banner 不一致。
 * - 不改路由、hash 或 storage，重整一律回到第一個角色（政府單位承辦）。
 * - 以 data-ready 防止重複初始化而重複掛事件。
 */
import { tabIndexForKey } from '../data/public-sector';

function initRoleTabs(root: HTMLElement): void {
  if (root.dataset.ready !== undefined) return;

  const tablist = root.querySelector<HTMLElement>('[role="tablist"]');
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-role-tab]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls') ?? ''));
  const ctas = tabs.map((tab) => root.querySelector<HTMLElement>(`[data-role-cta="${tab.dataset.roleTab}"]`));
  if (!tablist || tabs.length === 0 || panels.some((p) => !p) || ctas.some((c) => !c)) return;

  const setActiveRole = (activeIndex: number) => {
    tabs.forEach((tab, index) => {
      const active = index === activeIndex;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
      panels[index]!.hidden = !active;
      ctas[index]!.hidden = !active;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setActiveRole(index));
    tab.addEventListener('keydown', (event) => {
      const target = tabIndexForKey(event.key, index, tabs.length);
      if (target === undefined) return;
      event.preventDefault();
      setActiveRole(target);
      tabs[target].focus();
    });
  });

  // 無 JS 時 panel 只是一般區塊；初始化成功才掛上 tabpanel 語意
  panels.forEach((panel, index) => {
    panel!.setAttribute('role', 'tabpanel');
    panel!.setAttribute('aria-labelledby', tabs[index].id);
    panel!.tabIndex = 0;
  });
  setActiveRole(0);
  tablist.hidden = false;
  root.dataset.ready = '';
}

document.querySelectorAll<HTMLElement>('[data-ps-roles]').forEach(initRoleTabs);
