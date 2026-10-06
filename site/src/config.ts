// 全站集中設定：所有需要網域的地方（canonical、og:url、sitemap）一律引用這裡，不得散落硬編碼。

// TODO: 正式網域確認後改為真實網址，並將 SITE_URL_CONFIRMED 改為 true。
// SITE_URL_CONFIRMED = false 期間（2026-09-09 起）：每頁輸出 noindex,nofollow、robots.txt 回 Disallow: /，
// 且不輸出 canonical／og:url／og:image／sitemap 位址。正式上線時改為 true 一次解除，步驟見 AGENTS.md「正式上線檢查清單」。
export const SITE_URL = 'https://example.com';
export const SITE_URL_CONFIRMED = false;

export const SITE_NAME = '致遠體驗設計';
export const SITE_NAME_EN = 'Reach Experience Design';

/** 專案實例內頁路由（僅供 sitemap；不進主導覽） */
export const WORK_ROUTES = [
  { path: '/work/nexdo-a/', label: '好齡居（版本A）' },
  { path: '/work/nexdo-b/', label: '好齡居（版本B）' },
] as const;

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

/**
 * 聯絡表單的 Turnstile（Cloudflare 人機驗證）Site Key，公開值、可進 git。
 * 由 Cloudflare Pages 的建置環境變數 PUBLIC_TURNSTILE_SITE_KEY 提供；未設定時用 Cloudflare 官方的「一律通過」測試金鑰，
 * 只適合本機與預覽。正式上線前務必在 Cloudflare 設定真正的 Site Key，並把對應的 Secret Key 設為 TURNSTILE_SECRET_KEY。
 */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_SITE_KEY: string = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;

/** 表單送不出去時提示的備用聯絡信箱；留空則不顯示（正式 email 確認後填入） */
export const CONTACT_FALLBACK_EMAIL = '';
