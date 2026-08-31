import type { APIRoute } from 'astro';
import { ROUTES, WORK_ROUTES, SITE_URL } from '../config';
import { SERVICE_ROUTES } from '../data/services';

// 網域集中於 src/config.ts（TODO：正式網域確認後自動生效）
export const GET: APIRoute = () => {
  // 服務類別與專案類型路由由 src/data/services.ts 產生，不在此手寫
  const urls = [...ROUTES, ...SERVICE_ROUTES, ...WORK_ROUTES].map(
    (route) => `  <url>\n    <loc>${new URL(route.path, SITE_URL).href}</loc>\n  </url>`,
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
