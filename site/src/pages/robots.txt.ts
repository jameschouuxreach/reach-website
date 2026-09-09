import type { APIRoute } from 'astro';
import { SITE_URL, SITE_URL_CONFIRMED } from '../config';

// 網域與上線開關集中於 src/config.ts：SITE_URL_CONFIRMED 為 false 時全站禁止索引，
// 改為 true 後自動改回 Allow 並附 sitemap 位址。
export const GET: APIRoute = () => {
  const body = SITE_URL_CONFIRMED
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', SITE_URL).href}\n`
    : `User-agent: *\nDisallow: /\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
