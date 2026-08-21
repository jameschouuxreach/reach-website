import type { APIRoute } from 'astro';
import { ROUTES, SITE_URL } from '../config';

// 網域集中於 src/config.ts（TODO：正式網域確認後自動生效）
export const GET: APIRoute = () => {
  const urls = ROUTES.map(
    (route) => `  <url>\n    <loc>${new URL(route.path, SITE_URL).href}</loc>\n  </url>`,
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
