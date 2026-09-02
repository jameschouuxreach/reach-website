## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

注意：專案在外接硬碟上，Vite 檔案監聽不可靠——**切換 branch 後一律重啟 dev server**；遇到「檔案存在卻 404」「改了樣式沒生效」也先重啟再查。

## Deploy（GitHub Pages）

網站以「gh-pages branch 放靜態成品」的方式部署，多個版本並存供比較。**網站根是版本入口頁**（正本在 `scripts/entry/index.html`，含根目錄 404.html，只在部署 main 時同步），各版本一律部署在子資料夾。部署方式：checkout 要部署的 branch，跑 `./scripts/deploy.sh`——部署位置由 branch 自動決定，腳本開頭會印出目標網址：

- 版本入口頁 → https://jameschouuxreach.github.io/reach-website/
- `main` → https://jameschouuxreach.github.io/reach-website/v1/
- `reach-web-v2` → https://jameschouuxreach.github.io/reach-website/v2/
- `reach-web-v2-1` → https://jameschouuxreach.github.io/reach-website/v2-1/ （v2 首頁改版快照：Logo 移至 Hero 下、使命區具體舉例卡、服務對象文案）
- `reach-web-v2-2` → https://jameschouuxreach.github.io/reach-website/v2-2/ （2026-08-28 快照：案例卡 C 版改小標＋五 tag、使命區 v5 無捲動鎖定只留 tabs、服務區新增四個服務範疇 pill）
- `service-v1` → https://jameschouuxreach.github.io/reach-website/v2-3/ （2026-09-02 快照：服務內容三層資訊架構——/services/ 總覽＋四類別頁＋六專案頁，含專案標誌、專案目標、專案流程、執行項目 tab 與相關案例）

腳本會自動 build、用 `scripts/prefix-base.mjs` 補上 Pages 子路徑前綴、把成品同步進 gh-pages 對應位置後 push。原始碼一律維持根路徑寫法（`/images/...`），不要把前綴寫進原始碼。要再多掛一個版本時，在 `scripts/deploy.sh` 的 branch 對應表加一行、並在 `scripts/entry/index.html` 的版本清單加一張卡（在 main 上改、部署 main 生效）。

註：repo 於 2026-09-02 由 `reach-website-v1` 改名為 `reach-website`——GitHub Pages 舊網址不轉址，改名前分享出去的連結已失效。

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
