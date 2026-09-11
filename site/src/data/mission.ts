/**
 * 「我們的使命」三點敘事的內容（原為首頁 index.astro 的 positioning 常數；
 * 2026-09-08 業主指示把使命區從首頁移到「關於致遠」頁，資料一併抽到此處，供 MissionScrollStory 使用）。
 */
export interface MissionItem {
  index: string;
  title: string;
  body: string;
  /** 具體舉例：這一點如何落實在專案中 */
  example: { project: string; body: string };
}

export const MISSION_ITEMS: MissionItem[] = [
  {
    index: '01',
    title: '讓決策源自理解',
    body: '透過研究走進使用者的真實情境，理解問題如何發生，讓每一步都有脈絡可循。',
    example: {
      project: '信貸系統優化｜打破既定想像，看見真實操作困境',
      body: '透過使用者測試，讓團隊親眼看見申請過程中的真實阻礙，讓每一項改善都有問題依據，而非只憑想像。',
    },
  },
  {
    index: '02',
    title: '讓全局清晰可見',
    body: '從使用者體驗到組織營運，我們梳理流程、角色及互動，找出能牽動全局的關鍵施力點。',
    example: {
      project: '長照官網重塑｜從多方角色中，找出品牌切入點',
      body: '同時理解父母與子女對照顧的不同期待，從多方需求中找到兼顧各個角色的品牌定位與官網優化方向。',
    },
  },
  {
    index: '03',
    title: '讓改變真實發生',
    body: '理解多方需求與現實限制，在複雜組織中找到可行路徑，讓洞察落地、讓設計產生影響。',
    example: {
      project: '報稅系統改版｜在技術限制下，找到有效解法',
      body: '釐清後端系統與跨單位權責的限制，在不更動既有流程的條件下，找出可落地的畫面改善，讓易用性真正提升。',
    },
  },
];
