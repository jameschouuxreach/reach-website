// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// 正式網域尚未提供：canonical 與 sitemap 的網域統一由 src/config.ts 的 SITE_URL 管理（TODO）。
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
