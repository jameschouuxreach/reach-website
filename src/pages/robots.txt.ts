import type { APIRoute } from 'astro';
import { SITE_URL } from '../config';

// 網域集中於 src/config.ts（TODO：正式網域確認後自動生效）
export const GET: APIRoute = () => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', SITE_URL).href}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
