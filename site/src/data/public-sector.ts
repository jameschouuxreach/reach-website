/**
 * 政府與公共服務內頁（/public-sector/）的角色內容（2026-10-01 規格 doc/開發規格/public-sector-v1）。
 * Tab 順序承辦→廠商、預設承辦（2026-10-01 使用者指示，取代規格 §1 的廠商優先）。
 * 文案與插圖對應依規格 §4 逐字採用；插圖為 assets-manifest.json 的最新版，部署於 final/。
 * 本檔不 import 其他模組，供 tests/ 以 node --experimental-strip-types 直接載入。
 */

export type RoleId = 'vendor' | 'government';

export interface IllustratedPoint {
  /** 對應 assets-manifest.json 的 id，也是插圖檔名 */
  id: string;
  title: string;
  body: string;
}

export interface RoleContent {
  id: RoleId;
  /** Tab 文字，也作為無 JS 時的角色標題 */
  label: string;
  painHeading: string;
  pains: IllustratedPoint[];
  solutionHeading: string;
  solutions: IllustratedPoint[];
  cta: { title: string; description: string };
}

/** 插圖原始尺寸（10 張皆 1448 × 1086，4:3 白底） */
export const ILLUSTRATION_SIZE = { width: 1448, height: 1086 } as const;

export const illustrationSrc = (id: string): string => `/images/public-sector/illustrations/final/${id}.png`;

/** 兩個角色 CTA 共用的按鈕文字與目的地 */
export const ROLE_CTA_ACTION = { label: '聯絡我們', href: '/contact/' } as const;

export const ROLES: RoleContent[] = [
  {
    id: 'government',
    label: '我是政府單位承辦',
    painHeading: '推動數位服務，您是否也遇過這些難題？',
    pains: [
      {
        id: 'gov-pain-01-revisions',
        title: '系統一改再改，使用者還是覺得不好用',
        body: '需求在招標前就得寫清楚，真正開始使用後，才發現原先規劃與使用者的需求有落差。受限於合約範圍與驗收時程，只能在既有規格內反覆修改，卻始終沒有解決民眾卡住的問題。',
      },
      {
        id: 'gov-pain-02-constraints',
        title: '知道問題在哪，卻卡在系統與權責限制',
        body: '想簡化申辦流程，卻牽涉既有系統串接、其他單位的作業方式，甚至不同機關的權責。改善方向看似明確，實際推動時卻處處受限，很難找到各方都能配合、也確實做得到的方案。',
      },
      {
        id: 'gov-pain-03-rfp',
        title: '想把易用性寫進需求，卻難拿捏規格與時程',
        body: '撰寫需求規格書（RFP）時，規格太細怕限制執行彈性，太鬆又擔心成果不如預期。「讓系統好用」該訂哪些工作、如何驗收，又該預留多少時間，往往缺乏明確依據，也難向長官說明為什麼這些時間不能省。',
      },
    ],
    solutionHeading: '從需求規劃到成果驗證，我們協助您找到可行做法',
    solutions: [
      {
        id: 'gov-solution-01-research',
        title: '找出問題根源，讓每次改善都有依據',
        body: '我們透過訪談、現場觀察與易用性測試等方法，了解民眾在哪個步驟遇到困難，以及背後的原因。協助您釐清問題出在資訊、操作流程或服務規則，將有限資源投入最需要改善的地方。',
      },
      {
        id: 'gov-solution-02-alternatives',
        title: '釐清現實限制，找到做得到的改善方案',
        body: '我們會與您及相關團隊一起梳理系統、作業流程與權責限制，確認哪些能調整、哪些需要保留。當理想方案暫時不可行，就尋找同樣能幫助民眾完成任務的替代做法，並區分當下可做與後續推動的項目。',
      },
      {
        id: 'gov-solution-03-planning',
        title: '把易用性轉成可執行、可驗收的工作規劃',
        body: '憑藉多年政府標案經驗，我們協助您將易用性目標轉成需求規格書中的工作項目、交付成果與驗證方式。同時依專案規模與執行條件，提出研究、設計及測試的合理時程，讓您在管理廠商與向長官說明時，都有具體依據。',
      },
    ],
    cta: {
      title: '讓承辦的每一分努力，成為民眾用得順的服務。',
      description: '無論您正在準備需求規格，或尋找既有系統的改善方向，都歡迎與我們聊聊，一起釐清下一步。',
    },
  },
  {
    id: 'vendor',
    label: '我是資訊廠商',
    painHeading: '執行政府標案，您是否也面臨這些壓力？',
    pains: [
      {
        id: 'vendor-pain-01-changes',
        title: '設計遲遲無法定案，開發時程一再被壓縮',
        body: '每次提報都有新的調整意見，畫面與流程反覆修改，團隊卻不容易掌握明確的決策標準。當設計遲遲無法定案，甚至開發後才大幅調整，重工就會壓縮原本安排好的開發與測試時間。',
      },
      {
        id: 'vendor-pain-02-criteria',
        title: '機關要求「好用」，卻缺少共同的判斷依據',
        body: '功能都已完成，機關仍希望確認民眾是否看得懂、用得順。但如果沒有明確的驗證方式，討論就容易停留在個人感受，團隊也難以說明目前設計是否已達到預期。',
      },
    ],
    solutionHeading: '用研究協助定案，用測試驗證成果',
    solutions: [
      {
        id: 'vendor-solution-01-consensus',
        title: '讓設計有憑有據，在開發前建立共識',
        body: '我們透過使用者研究，將民眾的需求與操作困難整理成具體證據，讓設計取捨有清楚的理由。也能協助團隊向承辦與長官說明、回應疑慮，在開發前確認關鍵流程與設計方向，降低後期反覆修改的風險。',
      },
      {
        id: 'vendor-solution-02-testing',
        title: '讓實際使用者驗證，交付更有把握',
        body: '我們透過易用性測試，觀察使用者能否完成關鍵任務，找出操作卡點，並依影響程度提出調整建議。測試結果也能作為與機關溝通的依據，清楚說明哪些設計已獲得驗證、哪些仍需改善，讓成果更有說服力。',
      },
    ],
    cta: {
      title: '讓設計更有共識，讓交付更有把握。',
      description: '從提案規劃、設計溝通到成果驗證，我們都能與您的團隊協作，一起兼顧專案進度與使用體驗。',
    },
  },
];

/**
 * Tab 鍵盤操作的目標索引（WAI-ARIA tabs）：左右方向鍵循環、Home 第一個、End 最後一個；其他按鍵回傳 undefined。
 */
export function tabIndexForKey(key: string, current: number, count: number): number | undefined {
  if (key === 'ArrowRight') return (current + 1) % count;
  if (key === 'ArrowLeft') return (current - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}
