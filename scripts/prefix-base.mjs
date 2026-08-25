// GitHub Pages 預覽用：把 dist/ 內站內絕對路徑（href/src/srcset/url()）加上子路徑前綴。
// 正式站部署在網域根路徑，不需要此步驟；原始碼一律維持根路徑寫法。
// 用法：node scripts/prefix-base.mjs <base> [dir]  例：node scripts/prefix-base.mjs /reach-website-v1 dist
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const base = (process.argv[2] || '').replace(/\/$/, '');
const root = process.argv[3] || 'dist';
if (!base.startsWith('/')) {
  console.error('base 必須以 / 開頭，例如 /reach-website-v1');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// "//" 開頭是協定相對網址，不處理；已帶前綴的不重複加（讓腳本可重跑）
const escaped = base.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const attrRe = new RegExp(`\\b(href|src)="/(?!/|${escaped}/)`, 'g');
const srcsetRe = new RegExp(`\\b(srcset=")/(?!/|${escaped}/)`, 'g');
const cssUrlRe = new RegExp(`url\\(\\s*(['"]?)/(?!/|${escaped}/)`, 'g');

let changed = 0;
for (const file of walk(root)) {
  const ext = extname(file);
  if (!['.html', '.css'].includes(ext)) continue;
  const before = readFileSync(file, 'utf8');
  let after = before;
  if (ext === '.html') {
    after = after
      .replace(attrRe, `$1="${base}/`)
      .replace(srcsetRe, `$1${base}/`)
      .replace(cssUrlRe, (m, q) => m.replace(`${q}/`, `${q}${base}/`));
  } else {
    after = after.replace(cssUrlRe, (m, q) => m.replace(`${q}/`, `${q}${base}/`));
  }
  if (after !== before) {
    writeFileSync(file, after);
    changed++;
  }
}
console.log(`prefix-base: ${base} 已套用至 ${changed} 個檔案（${root}/）`);
