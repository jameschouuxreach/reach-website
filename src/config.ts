// 全站集中設定：所有需要網域的地方（canonical、og:url、sitemap）一律引用這裡，不得散落硬編碼。

// TODO: 正式網域確認後改為真實網址，並將 SITE_URL_CONFIRMED 改為 true。
export const SITE_URL = 'https://example.com';
export const SITE_URL_CONFIRMED = false;

export const SITE_NAME = '致遠體驗設計';
export const SITE_NAME_EN = 'Reach Experience Design';

/** 供 sitemap 與導覽使用的主要路由 */
export const ROUTES = [
  { path: '/', label: '首頁' },
  { path: '/services/', label: '服務內容' },
  { path: '/cases/', label: '專案實例' },
  { path: '/about/', label: '關於致遠' },
  { path: '/insights/', label: '致遠觀點' },
  { path: '/public-sector/', label: '政府與公共服務' },
  { path: '/business/', label: '企業與服務團隊' },
  { path: '/contact/', label: '聯絡我們' },
] as const;
