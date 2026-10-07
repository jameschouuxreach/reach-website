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
| `main` | https://reach-website-6cb.pages.dev | v1 基準版（2026-08-25 併入 main）；Cloudflare 正式分支、GitHub 預設分支 |
| `case-on` | https://case-on.reach-website-6cb.pages.dev | 主要開發線：包含 v2、服務頁、好齡居 A～E、企業／公共服務頁、關於頁改版（原 about-v2）與聯絡表單（2026-10-06 由 contact-form 改名） |

2026-10-06 分支整理：其餘分支已刪除，最後狀態保存為 `archive/<原分支名>` 標籤（`about-v2`、`case-v4`、`case-v5`、`service-v1`、`service-v2`、`reach-web-v2`、`reach-web-v2-1`、`reach-web-v2-2`、`mission-redesign`、`mission-redesign-v2`、`visual-beta-1`、`gh-pages`）。標籤不會觸發部署；要重新看某個舊版，用 `git branch <新分支名> archive/<原分支名>` 還原後 push，就會得到新的預覽網址。

原始碼一律維持根路徑寫法（`/images/...`）。正式網域確認後，在 Cloudflare 專案的 Custom domains 綁定，並更新 `src/config.ts` 的 `SITE_URL`。

註：2026-09-09 由 GitHub Pages（gh-pages branch 子資料夾多版本）遷來，舊的 jameschouuxreach.github.io 網址已停用。repo 於 2026-09-02 由 `reach-website-v1` 改名為 `reach-website`。

### 正式上線檢查清單（AI 助理務必主動提醒）

網站目前**全站 noindex**：`src/config.ts` 的 `SITE_URL_CONFIRMED = false` 會讓每頁輸出 `<meta name="robots" content="noindex, nofollow">`、robots.txt 回 `Disallow: /`，並且不輸出 canonical、og:url、og:image 與 sitemap 位址。這是 2026-09-09 為了避免比較階段的 pages.dev 網址被搜尋引擎收錄而加的。

**當使用者提到正式上線、綁定正式網域、SEO、Google 收錄時，主動提醒依序完成：**

1. 在 Cloudflare Pages 專案的 Custom domains 綁定正式網域。
2. `src/config.ts`：`SITE_URL` 改為正式網址、`SITE_URL_CONFIRMED` 改為 `true`。這一步會同時解除 noindex、開啟 canonical／og:url／og:image、robots.txt 改回 Allow 並附 sitemap 位址。
3. push 到 `main`，上線後用 `curl -sI <正式網址>` 與 `curl <正式網址>/robots.txt` 確認頁面沒有 noindex、robots.txt 是 Allow。
4. 到 Google Search Console 提交 sitemap。

## 聯絡表單（/contact/ → Cloudflare Function → Notion＋通知信）

2026-10-06 上線。客戶在 `/contact/` 填表 → `functions/api/contact.ts`（Cloudflare Pages Function，`POST /api/contact`）→ 寫入 Notion 資料庫，並用 Resend 寄通知信。從服務頁「專案類型評估」結果按「與我們討論需求」過來時，評估答案會以 sessionStorage 暫存帶到聯絡頁，由客戶決定是否一併送出。

- 規則集中處：欄位、驗證、Notion 欄位名稱與通知信內容在 `src/lib/contactForm.ts`；評估答案的驗證與摘要在 `src/data/projectAssessment.ts`（`parseAssessmentAnswers`、`summarizeAssessment`）。前端驗證只為即時提示，後端一律重新驗證。
- Notion 與通知信任一成功就算送出成功（信件完整附上內容，Notion 失敗時信件就是備份）；兩者都失敗才顯示錯誤，表單內容保留讓客戶再送。
- 防護：同源檢查、Turnstile 人機驗證、隱藏的誘餌欄位、內容上限 20 KB。
- 每筆資料只寫 Notion 欄位、不寫頁面內文，只占 1 個 block（Notion 免費版多成員工作區終身只有 1,000 block，建議資料庫放在只有一位成員的工作區，同事以訪客身分檢視）。

### 環境變數（Cloudflare Pages 專案 → Settings → Variables and Secrets；金鑰一律設為 Secret，不進 git）

| 變數 | 類型 | 說明 |
|---|---|---|
| `NOTION_TOKEN` | Secret | Notion integration 的 Internal Integration Secret |
| `NOTION_DATABASE_ID` | 文字 | 表單資料庫 ID（下方工具建立後會印出） |
| `TURNSTILE_SECRET_KEY` | Secret | Turnstile 的 Secret Key；**必填**，未設定時表單一律回報錯誤 |
| `PUBLIC_TURNSTILE_SITE_KEY` | 文字（建置時使用） | Turnstile 的 Site Key；未設定時使用官方「一律通過」測試金鑰，只適合預覽 |
| `RESEND_API_KEY` | Secret | Resend API Key；與下兩項都設定才會寄信 |
| `NOTIFY_EMAIL_TO` | 文字 | 收通知的信箱，多個以逗號分隔 |
| `NOTIFY_EMAIL_FROM` | 文字 | 寄件人，例如 `致遠官網 <form@網域>`，網域須先在 Resend 驗證 |

Notion 與通知信至少要設定一組，加上 `TURNSTILE_SECRET_KEY`，表單才能運作。Production 與 Preview 環境要分別設定；改完環境變數後要重新部署（再 push 一次或在 Deployments 頁 Retry）才會生效。

### 第一次設定步驟

1. **Notion**：到 https://www.notion.so/profile/integrations 建立 Internal integration（權限勾 Read／Update／Insert content），複製 Secret。在 Notion 開一個頁面（例如「官網聯絡表單」），右上「⋯ → 連線」加入這個 integration，從頁面網址複製最後那段 32 碼的頁面 ID。
2. **建立資料庫**（欄位名稱必須與程式一致，請用工具建立，不要手動建）：在 `site/` 執行
   `NOTION_TOKEN=… NOTION_PARENT_PAGE_ID=… node --experimental-strip-types tools/notion-create-database.ts`，
   把印出的 `NOTION_DATABASE_ID` 設到 Cloudflare。之後若在 Notion 改欄位名稱，`src/lib/contactForm.ts` 的 `NOTION_PROPERTIES` 也要同步改。
3. **Turnstile**：Cloudflare 後台 → Turnstile → Add widget，Hostname 填正式網域與 `reach-website-6cb.pages.dev`，取得 Site Key 與 Secret Key。
4. **Resend**：註冊後在 Domains 驗證寄件網域（加 DNS 紀錄），建立 API Key。正式網域確定前只能寄給 Resend 帳號本人的信箱（寄件人用 `onboarding@resend.dev`）。
5. 設定好環境變數後重新部署，到預覽網址實際送一筆，確認 Notion 有新資料、信箱收到通知。

### 本機測試

`astro dev` 不會執行 Functions。要測整個送出流程，先 `npm run build`，再用 `npx wrangler pages dev dist --binding KEY=VALUE …` 帶入環境變數。Turnstile 測試金鑰：Secret `1x0000000000000000000000000000000AA` 一律通過、`2x0000000000000000000000000000000AA` 一律失敗。外接硬碟（exFAT）會在 `functions/` 產生 `._*.ts` 附屬檔，wrangler 會因此編譯失敗，先 `find functions -name '._*' -delete`（這些檔案已被 gitignore，不影響 Cloudflare 上的建置）。

公司聯絡資訊（信箱、Facebook、地址）集中在 `src/config.ts` 的 `CONTACT_INFO`，頁尾與聯絡頁共用，送出失敗時也提示客戶改寫信到這個信箱。表單的個資同意勾選欄已於 2026-10-07 依業主指示移除；上線前仍需補上頁尾「隱私權政策」內容。

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
