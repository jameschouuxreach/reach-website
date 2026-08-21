# 致遠體驗設計 公司官網 v1（示意站）

依《致遠官網-v1-Claude-Code開發規格.md》建立的多頁靜態官網。用途為刺激團隊發想與驗證品牌敘事，非正式上線版本。

## 技術

- Astro 7（static output，多頁靜態 HTML）＋ TypeScript ＋ Tailwind CSS v4（`@tailwindcss/vite`）
- 品牌色彩、字體、圓角、動態節奏依規格書 Design Tokens（`src/styles/tokens.css`），Tailwind 主題以 `@theme inline` 引用同一組 CSS 變數
- 動畫：CSS ＋ IntersectionObserver ＋ 少量原生 TypeScript，無任何動畫套件、無 scroll listener
- 主要文案皆直接存在 build 後的 HTML

## 安裝與開發

```bash
cd site-v1
npm install        # 首次
npm run dev        # 開發伺服器 http://localhost:4321
npm run build      # 產出靜態檔至 dist/
npm run preview    # 預覽 build 結果
```

## 目錄重點

- `src/config.ts`：**網域集中設定（TODO）**。正式網域確認後改 `SITE_URL` 並把 `SITE_URL_CONFIRMED` 設為 `true`，canonical／og:url／sitemap／robots 會同時生效。
- `src/styles/`：`tokens.css`（品牌 Token）→ `global.css`（Tailwind 入口）→ `components.css`（按鈕／卡片／字級）→ `motion.css`（進場與切換動畫、reduced-motion 降級）
- `src/scripts/`：`hero-values.ts`（更深／更廣／更遠互動）、`reach-scroll.ts`（Reach sticky scroll，IntersectionObserver sentinel 實作）、`reveal.ts`（區塊進場）
- `src/data/`：`cases.ts`（四個案例，順序鎖定）、`partners.ts`（14 個合作 Logo 清單）
- `src/assets/partners/`：合作 Logo（自 `合作客戶logo.pdf` 裁切），build 時由 astro:assets 產出 WebP＋PNG fallback，前端以灰階呈現、hover 恢復原色

## 驗證結果（2026-08-21）

- Lighthouse（本機 dist）：首頁 Performance 99／Accessibility 100／Best Practices 100／SEO 100；八個路由 Accessibility 全數 100
- 1440／1024／768／390px 均無水平捲動
- Hero 互動支援滑鼠、鍵盤、觸控；預設「更深」；切換無版面跳動
- Reach 動態五階段依捲動切換並收束為 Reach Experience Design；行動版與 `prefers-reduced-motion` 顯示靜態版
- 所有 CTA 皆有明確目的地（無 `href="#"`）；案例卡 CTA 依規格顯示「內容準備中」並停用

## 規格書內部衝突的取捨（已依較明確條文處理）

1. 客群分流卡底色：§5.4 明定「兩張卡片預設樣式完全相同（皆白底），不以底色區分」；§7.2 表格寫「一張白底、一張極淡藍底」。採 §5.4（條文較細且附理由）。
2. 最終聯絡 CTA 底色：§7.2 允許「品牌藍或深色底」，但 §5.2 明定 AI 主張是「全站唯一大面積深色區塊」，故最終 CTA 採品牌藍系（Blue 700 `#063AA8`），未用深色中性底。

## 待補素材（正式上線前）

1. 公司 Logo SVG／向量原檔（目前使用 `公司LOGO.png` 白底點陣檔；favicon 亦由此縮放，未重繪）
2. 公司正式 email、電話、地址與社群連結（Footer 與聯絡頁現以「待補」標示）
3. 合作客戶 Logo 公開使用授權確認（現用素材出自 `合作客戶logo.pdf`）
4. 四個案例的正式名稱確認、問題描述、圖片與可公開成果（卡片現顯示「案例內容整理中」＋灰階佔位框）
5. 正式服務分類與說明（`/services/` 現為「內容規劃中」骨架）
6. 公司成立年份、團隊、品牌故事（`/about/` 現為骨架）
7. 正式網域、部署平台、隱私權政策與表單服務（聯絡表單為視覺原型，送出鈕標示「表單尚未啟用」）
8. 致遠觀點文章內容（`/insights/` 現為佔位卡）

## 已知限制

- 未載入 Inter 字型檔（規格禁止 CDN 載入）；字體堆疊為 `Inter → 系統字體 → PingFang TC → Noto Sans TC`，訪客未安裝 Inter 時以系統字體顯示
- sitemap／robots 目前輸出 `https://example.com` 佔位網域，正式網域確認後由 `src/config.ts` 一處更新
