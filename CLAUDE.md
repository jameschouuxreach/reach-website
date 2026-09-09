@site/AGENTS.md

## Repo 結構

- `site/`：Astro 官網專案（原本在 repo 根目錄，2026-09-07 搬入）。`npm install`、`astro dev` 一律在 `site/` 內執行。部署由 Cloudflare Pages 連動 GitHub 自動完成，push 即部署，詳見 `site/AGENTS.md` 的 Deploy 章節。
- `doc/`：官網規格、會議逐字稿、案例文案、競品研究、素材。**只存在本機、不進 git**——以 `.git/info/exclude` 排除，因為內含約 2 GB 的錄音錄影檔（m4a／webm／qta），超過 GitHub 單檔 100 MB 上限，且錄音涉及同事與受測者隱私。切勿執行 `git clean -x` 或 `-X`，會把它整個刪掉。
- **正式上線前提醒**：網站目前全站 noindex，由 `site/src/config.ts` 的 `SITE_URL_CONFIRMED = false` 控制。使用者提到正式上線、綁網域、SEO 時，務必主動提醒改回 `true`，步驟見 `site/AGENTS.md` 的「正式上線檢查清單」。
