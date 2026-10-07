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
- `src/scripts/`：`hero-carousel.ts`（Hero 四幕輪播：打字機刪改＋致遠 FLIP 合併＋無限循環）、`reveal.ts`（區塊進場）
- `src/data/`：`cases.ts`（四張案例卡：好齡居 A／B／C 三版並列測試＋合作金庫佔位）、`partners.ts`（14 個合作 Logo 清單）
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

## v1.1 調整（2026-08-22，經業主口頭指示覆蓋規格書對應條文）

1. Hero 改滿版海報式（自帶約 80px 內距，其餘區塊維持 1160px 版心）。
2. Hero 改四幕自動輪播，取代原 hover 互動：幕 1–3 左欄打字機刪改「深→廣→遠」（閃爍游標），右欄同步顯示 Reach 句＋對應中文句（無卡片）；幕 3→4「致」「遠」FLIP 合併成「致遠」後打字補上「體驗設計」，右欄收束 Reach better experiences；第四幕停留後淡出，回第一幕無限循環。
3. Reach 品牌動態自第 7 區併入 Hero；第 7 區「信任與合作」保留合作 Logo 牆。
4. 主標字級 ×0.8（桌機 88 → 70px，手機守規格下限 40px）、字重 700 → 500；右欄中文句字重 400。
5. 英文文案維持規格鎖定版（Reach lasting change／Reach better experiences）。
6. v1.2（同日）：左欄打字機效果統一改為垂直滑動字槽（含第四幕「體驗設計」滑入，游標移除）；滑動時長 680ms、easeInOutQuint（--hc-dur／--hc-ease 集中可調，需與 hero-carousel.ts 的 SLIDE_MS 同步）；右欄改三行結構（Reach 固定／詞組／中文句）與左欄 H1 精確等高（grid stretch＋字級由 --hero-fs 階梯係數推導）；右欄左緣加 1px 分隔線（高度＝文字區塊高度）。動畫機制參考 Animate UI「Rotating Text」primitive，以原生 CSS/TS 重寫。
7. v1.3（同日）：左欄再減重（主標 70→66px）並加前導內距（md+ 約 27–54px，--hero-lead）；右欄字級係數反向補償維持英文 ~48px；幕 3→4 改為並行動畫——其他字淡出（650ms）、致遠合併飛行（950ms）、「體驗設計」滑入（飛行 44% 時啟動）與右欄切換同時進行，總長約 1.1 秒。
8. v1.6（2026-08-22）：AI 主張區塊自「我們的使命」內移出，改置於 Hero 正下方為獨立區塊；底色由 Neutral 950 深色改為品牌藍 #0B5CFF（白字、強調詞 Blue 200，對比符合 AA）。全站不再有大面積深色區（覆蓋規格 §5.2「唯一深色區」與首頁區塊順序條款）。
9. v1.6b：首頁案例區標題「精選案例」改為區塊小標樣式「我們的經驗 OUR EXPERIENCE」，案例卡改為每排兩張（覆蓋規格 §5.5 區塊標題文字）。
10. v1.7：案例卡改 AJA 版式——獨立圖片、下方客戶類別小標＋大標題、底部專案類型 pill；規格 §5.5 的「問題一句描述」與停用 CTA「內容準備中」隨版式移除（卡片非連結，無假連結問題）。專案類型僅用素材已提供的描述（合庫＝網銀流程改造、綜所稅＝報稅系統 Mac／手機版），未提供者顯示「案例整理中」。
11. v1.8：政府／企業客群分流併入「我們的服務」同一色塊，前置新增標題「解法因情境而異，核心始終如一」與內文（業主提供文案）；案例區改淺灰底維持交錯節奏（覆蓋首頁區塊順序條款，首頁由九區塊變八區塊）。
12. v2.0（2026-08-23）：首次載入加進場動畫——主標與「Reach」隨整塊 data-reveal 直接顯示，左欄「深」與右欄詞組、中文句自下方滑入第一幕，轉場與換幕相同（垂直字槽滑動，--hc-dur／--hc-ease）。進場字槽於標記中不預設 is-current，由腳本進場補上（無 JS 或 reduced-motion 時仍顯示完整靜態版，不受影響）。第四幕後的淡出重置改為歸回空槽，淡入後每輪重播同一套進場滑入（首次載入不留空拍直接滑入，重置後留 350ms 小拍）。
13. 覆蓋的規格條文：首頁九區塊順序（Reach 位置）、Hero 互動要求（hover／keyboard 切換）、§8「禁止持續無限動畫」（輪播無限循環）。降級不變：`prefers-reduced-motion` 與無 JS 時顯示完整靜態版（全三詞主標＋四句 Reach），螢幕閱讀器一律讀固定完整文案（動畫層 aria-hidden）。
14. v2.1（2026-08-25）：新增好齡居專案實例雙版本測試——`/work/nexdo-a/`（悠識務實版）與 `/work/nexdo-b/`（AJA 品牌敘事版），內容依《好齡居專案實例-版本A/B》指示文件產出；擇定後保留一版並改用 `/work/nexdo/`。案例卡（CaseCard）擴充支援真實案例（圖片／連結／摘要／CTA），cases.ts 以兩張好齡居卡取代原佔位卡；BaseLayout 新增 ogTitle／ogDescription。素材：現行網站 nexdo.tw 三張截圖（2026-08-25 擷取）＋研究報告 目錄-19 Before/After 輸出圖；其餘研究圖表依指示重製為網頁原生圖。正式發布前需完成兩份指示文件內的上線確認清單（客戶同意、AI 情境圖授權等）。
15. v2.2（2026-08-26）：新增第三版好齡居案例 `/work/nexdo-c/`（小瑜觀點版），依《好齡居專案實例-版本C-小瑜觀點版.md》製作：Our Approach 前置＋四個頁內錨點（`scroll-margin-top` 避開 sticky 導覽列）、四個策略章節皆以「Before／我們如何判斷／After」三欄呈現、Hero 自 目錄-19 分別裁出舊／新網站畫面重製為原生 Before／After（不貼整頁簡報）、首頁策略附現行首頁長頁截圖＋四階段標記、預設不顯示 303／5 與族群百分比（客戶同意後再開）。首頁與案例列表的案例卡以此版取代原「桃園卡」佔位卡（順序：好齡居 A → B → C → 合作金庫）。BaseLayout 新增 `ogImage`（正式網域確認後才輸出）。現行網站截圖於 2026-08-26 以 puppeteer-core＋本機 Chrome 重新擷取（檔名帶日期；08-25 舊圖保留給 A／B 版）——注意 nexdo.tw 前端首次載入常未把 CMS（Supabase）內容寫進畫面，需同一 profile 載入兩次才截得到完整卡片。**與指示文件的已知差異（發布前請與客戶確認）**：現行首頁「我們提供」區塊只有居住安全、收納清潔、租房搬家三張卡（Hero 仍列四類含樂齡健康；卡片「收納清潔」與 Hero「清潔收納」名稱不一致），合作流程已改為填表預約→真人顧問→透明溝通→安心出發，與文件所寫的四張卡／初步諮詢～執行驗收不同，頁面文字已依現行網站調整。B、C 兩版卡片標題依各自指示文件皆為「好齡居｜重新定義長照服務的角色與價值」，並列展示時撞名，擇定後需調整。
16. v2.4（2026-08-28）：使命區移除捲動鎖定與滾輪／鍵盤步進（v4 的「跨過區塊頂端鎖頁、每次手勢推進一點」機制在用力甩動時會先超過再被夾回，屬反應式設計的先天限制，業主決定整個拿掉）。改為：頁面自由捲動，三點只由 tabs 切換；區塊捲入視窗（>35% 可見）即回到 01 自動播第一段，完全捲出即中止並重置，回場一律從 01 重播（與 reveal.ts／ai-grid.ts 同一套 IntersectionObserver 慣例）。舉例卡標題改 `--neutral-700`、左欄字槽切換方向改為往下滑；首頁案例卡 C 版改為小標＋大標＋五 tag、無摘要（CaseCard 新增 `kicker`）。
17. v2.5（2026-08-28）：版面對「使用者放大瀏覽器預設字級」的容錯（老闆的 Comet 設為字型大小「大」＝根字級 20px，全站 rem 尺寸放大 25%，px／vh 尺寸不變，導致使命區 tab 與標題擠在一起、標題斷在詞中間）。修正：使命區 `height` 改 `min-height`（可隨內容長高）、tabs 到內容固定最小間距 3rem、移除允許壓縮的 `min-height: 0`；服務區與 AI 區標題改「詞組單位」換行（每個詞組 inline-block，只在逗號處整段換行；服務區保留設計的兩行結構）；AI 區標題字級另以欄寬封頂（`min(…, 9cqw)`，正常字級下不變）；案例卡標題維持純文字自然換行（曾試過「｜」後副標包 inline-block，業主決定不拆段）；全站 `h1–h4` 的 `text-wrap` 由 `balance` 改 `pretty`（balance 會把中文標題平均切成等長兩行、常斷在詞中間；pretty 逐字塞滿第一行、只避免最後一行孤字）。Hero 已是 `min-height`、AI 圓陣區無固定高度，不需調整。驗證：1512×860／1440×900／390 三種視窗 × 根字級 16／20px，無水平捲動；已知極端情況 390px＋20px 的案例卡副標仍會在詞中間斷行。要重現老闆畫面：DevTools Console 執行 `document.documentElement.style.fontSize='20px'`（注意 Hero 的 FLIP 合併是載入時量測的，Console 事後改字級會讓第四幕「致遠體驗設計」位置偏掉，屬測試假象；正式驗證需在載入前就設定字級，或改瀏覽器設定後重新整理）。Hero 另做兩層（業主 2026-08-28 拍板 A＋C）：上限由 `4.125rem` 改 `66px`（`.heading-hero` 與 `--hero-fs` 兩處同步），Hero 尺寸由設計決定、不隨瀏覽器預設字級放大，寬度響應仍由 vw 負責；`.hero-grid` 設為 container，`--hero-fs` 再以左欄可用寬 ÷ 7.1 字封頂（桌機 `(50cqw − 1.5rem − lead)/7.1`、手機 `(100cqw − lead)/7.1`），保證「從複雜，致清晰」在任何字級都放得進一行，右欄因共用 `--hero-fs` 自動跟隨。驗證 16／20／24px × 1695／1512／1440／1024／390：桌機一律 66px，封頂只在 390＋20px 以上與 1024＋24px 生效，H1 內無任何元素超出內容框。

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
