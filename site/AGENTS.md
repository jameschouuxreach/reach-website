## Development

本專案位於 repo 的 `site/` 子資料夾（repo 根目錄另有只存本機、不進 git 的 `doc/`），以下 npm、astro、deploy 指令一律在 `site/` 內執行。

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

注意：專案在外接硬碟上，Vite 檔案監聽不可靠——**切換 branch 後一律重啟 dev server**；遇到「檔案存在卻 404」「改了樣式沒生效」也先重啟再查。

## Deploy（Cloudflare Pages）

網站由 Cloudflare Pages 連動 GitHub repo 自動部署（Pages 專案 `reach-website-6cb`；Root directory = `site`、build `npm run build`、output `dist`）。**push 即部署**，repo 裡沒有也不需要部署腳本；沒有 commit 並 push 的變更不會上線。push 後約一到兩分鐘生效，build 狀態看 Cloudflare 專案的 Deployments 頁或 GitHub commit 旁的勾叉。

- production branch 是 `main` → https://reach-website-6cb.pages.dev
- 其他任何 branch 第一次 push 後自動得到 `https://<branch>.reach-website-6cb.pages.dev`，之後每次 push 更新。branch 名稱用小寫英數與連字號、保持簡短。
- 預覽網址由 Cloudflare 自動加 noindex，不會被搜尋引擎收錄。

版本模型：`main` 是正式／基準版；開發中的版本用功能 branch；要凍結給人比較的快照另開 branch，push 一次後不再推（別名網址永遠指向該 branch 最新一次部署）。目前線上版本：

| branch | 網址 | 說明 |
|---|---|---|
| `main` | https://reach-website-6cb.pages.dev | v1 基準版（2026-08-25 併入 main） |
| `reach-web-v2` | https://reach-web-v2.reach-website-6cb.pages.dev | v2 開發線 |
| `reach-web-v2-1` | https://reach-web-v2-1.reach-website-6cb.pages.dev | 2026-08-27 快照：Logo 移至 Hero 下、使命區具體舉例卡、服務對象文案 |
| `reach-web-v2-2` | https://reach-web-v2-2.reach-website-6cb.pages.dev | 2026-08-28 快照：案例卡 C 版改小標＋五 tag、使命區 v5 無捲動鎖定只留 tabs、服務區新增四個服務範疇 pill |
| `service-v1` | https://service-v1.reach-website-6cb.pages.dev | 2026-09-02 快照：服務內容三層資訊架構（原 GitHub Pages 的 /v2-3/） |
| `service-v2` | https://service-v2.reach-website-6cb.pages.dev | 服務頁後續調整開發線 |

原始碼一律維持根路徑寫法（`/images/...`）。正式網域確認後，在 Cloudflare 專案的 Custom domains 綁定，並更新 `src/config.ts` 的 `SITE_URL`。

註：2026-09-09 由 GitHub Pages（gh-pages branch 子資料夾多版本）遷來，舊的 jameschouuxreach.github.io 網址已停用。repo 於 2026-09-02 由 `reach-website-v1` 改名為 `reach-website`。

### 正式上線檢查清單（AI 助理務必主動提醒）

網站目前**全站 noindex**：`src/config.ts` 的 `SITE_URL_CONFIRMED = false` 會讓每頁輸出 `<meta name="robots" content="noindex, nofollow">`、robots.txt 回 `Disallow: /`，並且不輸出 canonical、og:url、og:image 與 sitemap 位址。這是 2026-09-09 為了避免比較階段的 pages.dev 網址被搜尋引擎收錄而加的。

**當使用者提到正式上線、綁定正式網域、SEO、Google 收錄時，主動提醒依序完成：**

1. 在 Cloudflare Pages 專案的 Custom domains 綁定正式網域。
2. `src/config.ts`：`SITE_URL` 改為正式網址、`SITE_URL_CONFIRMED` 改為 `true`。這一步會同時解除 noindex、開啟 canonical／og:url／og:image、robots.txt 改回 Allow 並附 sitemap 位址。
3. push 到 `main`，上線後用 `curl -sI <正式網址>` 與 `curl <正式網址>/robots.txt` 確認頁面沒有 noindex、robots.txt 是 Allow。
4. 到 Google Search Console 提交 sitemap。

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
