/**
 * 服務內容單一資料來源（依《致遠官網-v1-服務內容資訊架構-增量開發規格》§5–§7、§11）。
 * 服務總覽卡、四個服務類別頁、六個專案類型頁、同層切換列與 sitemap 全部由此檔產生，
 * 不得在頁面另外複製一份文案。文案為規格鎖定內容，除標示待確認的案例名稱外不得改寫
 *（2026-08-31 業主口頭指示覆蓋：六個專案類型的 fit 文案已依指示改寫）。
 *
 * 關聯規則：
 * - ProjectType.serviceItemSlugs 只能引用四個服務類別已定義的子項目（build 期驗證）。
 * - relatedCases 只有 status 'published' 且 href 能在 CASES 找到相同案例時才輸出連結；
 *   尚無案例內頁者標 'preparing'，頁面只顯示候選名稱與「案例內容整理中」。
 */
import { CASES, type CaseItem } from './cases';

export interface ServiceItem {
  slug: string;
  title: string;
  description: string;
}

export interface ServiceCategory {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  overview: string;
  items: ServiceItem[];
  /** 服務界線說明（目前只有體驗設計）：類別頁需直接可見，不可藏在 hover／tooltip／FAQ */
  boundaryNote?: string;
}

export type ProjectFamily = 'discovery' | 'optimization';

export interface RelatedCaseReference {
  name: string;
  href?: string;
  status?: 'published' | 'preparing';
}

export interface ProjectType {
  slug: string;
  family: ProjectFamily;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** 適合以下情況（三點列表，2026-09-01 業主指示；每點精簡到 13–15 字，卡片內單行可容） */
  fit: string[];
  /** 我們會如何協助（2026-09-01 起頁面改以 steps「專案流程」呈現，此欄保留未顯示） */
  approach: string;
  example: string;
  serviceItemSlugs: string[];
  /** 專案目標：三張有標題的卡片（2026-09-01 業主提供） */
  goals: ProjectGoal[];
  /** 專案流程：五個步驟（序號由順序產生；2026-09-01 業主提供） */
  steps: ProjectStep[];
  value: string;
  relatedCases: RelatedCaseReference[];
}

export interface ProjectGoal {
  title: string;
  body: string;
}

export interface ProjectStep {
  title: string;
  body: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProjectFamilyInfo {
  label: string;
  /** 群組副標（2026-08-31 業主指示：取代原多段群組說明） */
  subtitle: string;
}

/* ---------------------------------------------------------------- 路由 */

export const SERVICES_BASE_PATH = '/services/';
export const PROJECT_TYPES_ANCHOR = 'project-types';
/** 專案類型頁「常見專案類型」返回入口（不另建 /services/projects/ 總覽頁） */
export const PROJECT_TYPES_HREF = `${SERVICES_BASE_PATH}#${PROJECT_TYPES_ANCHOR}`;

export const getServiceCategoryPath = (categorySlug: string): string =>
  `${SERVICES_BASE_PATH}${categorySlug}/`;

export const getProjectTypePath = (projectSlug: string): string =>
  `${SERVICES_BASE_PATH}projects/${projectSlug}/`;

/* ------------------------------------------------------ 四個服務類別 */

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: 'research',
    eyebrow: 'EXPERIENCE RESEARCH',
    title: '研究分析',
    subtitle: '深入真實情境，找出表面現象背後的關鍵問題',
    overview:
      '從使用者的行為、需求與決策脈絡出發，理解問題如何發生、影響哪些人，以及真正值得投入的改善方向。',
    items: [
      {
        slug: 'in-depth-interview',
        title: '深度訪談',
        description:
          '透過一對一對話，理解使用者的行為、動機與決策脈絡，發現數據難以說明的真實需求。',
      },
      {
        slug: 'focus-group',
        title: '焦點團體',
        description:
          '邀集不同受眾共同討論特定議題，辨認彼此的共識、差異與使用語言，適合概念、品牌及議題探索。',
      },
      {
        slug: 'survey',
        title: '問卷調查',
        description:
          '透過較大規模的回覆了解需求分布與族群差異，驗證質性洞察，協助鎖定目標受眾與優先方向。',
      },
      {
        slug: 'usability-testing',
        title: '易用性測試',
        description:
          '邀請代表性使用者完成關鍵任務，觀察操作中的卡點與誤解，在正式上線前攔截風險並排出改善優先序。',
      },
      {
        slug: 'information-architecture-testing',
        title: '資訊架構測試',
        description:
          '透過卡片分類、樹狀測試等方式驗證內容分類與尋找路徑，避免以組織內部邏輯取代使用者的理解方式。',
      },
      {
        slug: 'co-creation-workshop',
        title: '共創工作坊',
        description:
          '讓關鍵利害關係人進入同一個討論現場，對齊問題、限制與決策原則，共同形成可執行的改善方向。',
      },
    ],
  },
  {
    slug: 'experience-design',
    eyebrow: 'EXPERIENCE DESIGN',
    title: '體驗設計',
    // 2026-09-01 業主指示改寫（結尾句號依其他三類副標慣例省略）
    subtitle: '將研究洞察轉化為具體、可落地的網頁與系統設計，讓操作更直覺順暢',
    overview:
      '從資訊如何被找到，到流程如何被完成，將研究結果轉化為具體的架構、互動與關鍵介面，讓團隊能看見並驗證改善方向。',
    items: [
      {
        slug: 'information-architecture',
        title: '資訊架構',
        description:
          '盤點網站或服務中的內容與功能，重新整理分類、命名、層級與導覽，讓使用者更容易找到需要的資訊。',
      },
      {
        slug: 'interface-prototype-design',
        title: '介面與原型設計',
        description:
          '將研究洞察轉化為關鍵流程、線框與可驗證原型，協助團隊確認操作方向，並作為後續設計及開發的溝通依據。',
      },
    ],
    boundaryNote:
      '介面與原型主要用於定義、溝通與驗證方向，不以短期大量產出精緻 UI 畫面為主要服務。',
  },
  {
    slug: 'brand-service-strategy',
    eyebrow: 'BRAND & SERVICE STRATEGY',
    title: '品牌與服務策略',
    subtitle: '整合品牌、內容與服務系統，讓每個接觸點傳遞一致價值',
    overview:
      '研究不只用來改善介面。我們進一步釐清品牌應該扮演的角色、內容如何與受眾溝通，以及不同角色與流程如何共同支撐完整服務。',
    items: [
      {
        slug: 'brand-positioning',
        title: '品牌定位',
        description:
          '整合使用者需求、品牌現況與服務特性，釐清品牌角色、價值主張與溝通調性，建立清楚且具辨識度的品牌方向。',
      },
      {
        slug: 'content-strategy',
        title: '內容策略',
        description:
          '依據受眾需求與品牌定位，規劃內容優先順序、資訊結構、語氣及撰寫原則，讓重要訊息更容易被理解與採取行動。',
      },
      {
        slug: 'service-blueprint-integration',
        title: '服務藍圖與跨域整合',
        description:
          '梳理使用者接觸點、前台服務、後台流程、組織分工與系統限制，找出彼此的依賴關係與真正能推動改變的施力點。',
      },
    ],
  },
  {
    slug: 'experience-consulting',
    eyebrow: 'EXPERIENCE CONSULTING',
    title: '體驗顧問',
    subtitle: '在探索、開發與迭代的關鍵時刻，持續校正方向',
    overview:
      '當專案無法一次定義完整範圍，或需要在快速變化中持續做出判斷，我們以顧問方式參與關鍵階段，協助團隊辨認風險、整合限制並維持體驗方向。',
    items: [
      {
        slug: 'product-discovery-consulting',
        title: '產品探索顧問',
        description:
          '適合仍在探索市場、受眾或服務方向的團隊。我們以固定節奏協助釐清假設、安排研究並收斂決策，逐步建立產品方向。',
      },
      {
        slug: 'implementation-consulting',
        title: '開發落地顧問',
        description:
          '在策略或設計交付後，持續協助團隊回應開發過程中的問題，檢視實作成果，避免原有的體驗原則在落地過程中被稀釋。',
      },
      {
        slug: 'continuous-improvement-consulting',
        title: '持續優化顧問',
        description:
          '適合快速迭代、缺乏完整研究時間的產品團隊。透過定期檢視與重點診斷，快速辨認高風險問題並提供優先改善建議。',
      },
      {
        slug: 'rapid-experience-diagnostic',
        title: '快速體驗診斷',
        description:
          '針對現有產品或原型，在有限時間內檢視關鍵任務、資訊結構與高風險介面，整理需優先處理的問題，作為後續研究或迭代的起點。',
      },
    ],
  },
];

/* ------------------------------------------------------ 兩個專案群組 */

export const PROJECT_FAMILY_ORDER: ProjectFamily[] = ['discovery', 'optimization'];

export const PROJECT_FAMILIES: Record<ProjectFamily, ProjectFamilyInfo> = {
  discovery: {
    label: '探索型專案',
    subtitle: '釐清未知，找到值得投入的方向',
  },
  optimization: {
    label: '優化型專案',
    subtitle: '找出關鍵阻礙，讓既有體驗發揮更大價值',
  },
};

/* ------------------------------------------------------ 六種專案類型 */

export const PROJECT_TYPES: ProjectType[] = [
  {
    slug: 'key-issue',
    family: 'discovery',
    eyebrow: 'EXPLORATION PROJECT',
    title: '關鍵議題型',
    subtitle: '聚焦一個關鍵問題，讓下一步決策更清楚',
    fit: [
      '已有明確疑問、假設或品牌議題',
      '尚未釐清問題原因與受眾看法',
      '需要研究依據支持下一步決策',
    ],
    approach:
      '我們聚焦單一議題進行研究，釐清影響因素、需求差異與可能方向，避免重要決策只建立在內部推測上。',
    example:
      '某電商品牌推出新產品，瀏覽與加入購物車表現正常，但實際購買轉換偏低；團隊需要進一步判斷問題來自產品理解、內容溝通，還是購買流程。',
    serviceItemSlugs: ['survey', 'in-depth-interview', 'focus-group', 'co-creation-workshop'],
    goals: [
      {
        title: '釐清關鍵議題背後的真正原因',
        body: '從表面現象往下追查，理解問題如何發生。辨認真正影響結果的關鍵因素。避免投入資源後，才發現處理了錯誤的問題。',
      },
      {
        title: '理解不同受眾的需求與觀點',
        body: '梳理不同受眾面對議題時的想法與行為。看見彼此的共識、差異與在意重點。讓後續方向不只反映內部觀點。',
      },
      {
        title: '建立下一步決策的清楚依據',
        body: '將研究發現收斂成可理解的結論。協助團隊比較不同方向的影響與優先性。減少憑直覺決策所帶來的風險。',
      },
    ],
    steps: [
      { title: '對焦議題', body: '釐清想解決的疑問、決策情境與研究範圍，確認這次真正需要回答的問題。' },
      { title: '規劃研究', body: '依據議題選擇研究方法、目標受眾與執行方式，建立清楚的研究計畫。' },
      { title: '執行研究', body: '透過訪談、問卷或焦點團體等方式，蒐集受眾的真實經驗與觀點。' },
      { title: '找出原因', body: '整合研究資料，辨認問題背後的影響因素、需求差異與關鍵模式。' },
      { title: '形成決策', body: '將洞察轉化為清楚結論與行動建議，協助團隊判斷下一步方向。' },
    ],
    value: '深入理解一個關鍵議題，讓下一步決策有更清楚的方向與依據。',
    // 正式案例名稱與公開範圍需另行確認，公開頁只顯示候選名稱與「案例內容整理中」
    relatedCases: [{ name: '慈濟', status: 'preparing' }],
  },
  {
    slug: 'comprehensive-discovery',
    family: 'discovery',
    eyebrow: 'EXPLORATION PROJECT',
    title: '全面探索型',
    subtitle: '從受眾、需求到品牌與服務，建立完整發展方向',
    fit: [
      '已有產品構想，但發展方向模糊',
      '尚未釐清受眾、需求或品牌定位',
      '需要整合研究、策略與設計方向',
    ],
    approach:
      '從使用者研究開始，整合服務、品牌、內容與體驗設計，建立一套彼此連貫、可持續發展的方向。',
    example:
      '某公司準備發展全新產品線，但還不確定主要受眾、真正需要解決的問題，以及服務應如何被包裝與溝通。',
    serviceItemSlugs: [
      'in-depth-interview',
      'focus-group',
      'survey',
      'brand-positioning',
      'content-strategy',
      'information-architecture',
      'interface-prototype-design',
    ],
    goals: [
      {
        title: '確認目標受眾與核心需求',
        body: '盤點可能的受眾與使用情境。釐清真正需要優先回應的問題。協助團隊把資源集中在最重要的對象與需求。',
      },
      {
        title: '釐清產品、品牌與服務定位',
        body: '整合受眾需求、產品特性與組織目標。找出產品應扮演的角色與核心價值。建立對內能對齊、對外能被理解的定位。',
      },
      {
        title: '建立一致的整體發展方向',
        body: '串連品牌、內容、服務與體驗設計。讓各項決策朝向共同目標發展。避免不同環節各自推進，最後難以形成完整體驗。',
      },
    ],
    steps: [
      { title: '對齊目標', body: '釐清產品構想、商業目標與目前未知，建立專案共同探索的範圍。' },
      { title: '盤點全貌', body: '整理市場、品牌、服務與既有資源，理解產品目前所處的發展脈絡。' },
      { title: '深入受眾', body: '透過質性與量化研究，了解目標受眾、核心需求與真實使用情境。' },
      { title: '收斂定位', body: '整合研究結果，釐清產品角色、品牌價值與優先回應的需求。' },
      { title: '整合方向', body: '串連品牌、內容、服務與體驗，形成後續發展與投入的整體方向。' },
    ],
    value: '從受眾、定位到體驗建立整合性理解，讓產品與服務更有把握地進入下一階段。',
    // 本次唯一已確認可點的關聯案例
    relatedCases: [
      { name: '好齡居｜樂齡居住服務品牌及網站優化', href: '/work/nexdo-a/', status: 'published' },
    ],
  },
  {
    slug: 'advisory-partnership',
    family: 'discovery',
    eyebrow: 'EXPLORATION PROJECT',
    title: '顧問陪跑型',
    subtitle: '在快速發展中，持續有人替體驗方向把關',
    fit: [
      '產品仍在探索或快速迭代階段',
      '缺少研究時間或內部體驗專業',
      '需要顧問持續把關與校正方向',
    ],
    approach: '以固定節奏參與關鍵討論，協助釐清問題、辨認風險、安排必要研究並校正設計方向。',
    example:
      '某軟體服務在發展初期快速推出新功能，沒有足夠時間與資源執行完整研究，但仍希望有專業角色持續替操作體驗與產品方向把關。',
    serviceItemSlugs: [
      'product-discovery-consulting',
      'continuous-improvement-consulting',
      'rapid-experience-diagnostic',
      'interface-prototype-design',
    ],
    goals: [
      {
        title: '持續校正產品與體驗方向',
        body: '定期檢視產品進展與需求變化。協助團隊判斷目前方向是否仍回應真實需求。避免快速迭代讓體驗逐漸失去焦點。',
      },
      {
        title: '及早發現迭代中的關鍵風險',
        body: '在重要功能與設計決策發生時提供專業檢視。提早辨認可能影響理解與操作的問題。讓團隊能在投入更多資源前及時調整。',
      },
      {
        title: '讓重要決策保有專業依據',
        body: '結合研究觀點與體驗專業，協助團隊評估不同方案。讓討論建立在共同的判斷原則上。減少反覆爭論與方向來回變動。',
      },
    ],
    steps: [
      { title: '初步診斷', body: '了解產品現況、團隊目標與目前限制，找出最需要優先協助的議題。' },
      { title: '建立節奏', body: '依據開發與迭代週期，建立固定的討論、檢視與決策協作方式。' },
      { title: '持續檢視', body: '參與關鍵討論並檢視產品進展，及早發現體驗風險與方向偏移。' },
      { title: '重點探索', body: '針對高風險或尚未釐清的問題，安排必要的快速研究與體驗診斷。' },
      { title: '校正方向', body: '提出當期調整建議與下一步重點，並隨產品迭代持續循環檢視。' },
    ],
    value: '在快速變動中保留專業判斷，減少反覆試錯與方向偏移。',
    // 正式專案名稱與公開範圍需另行確認
    relatedCases: [{ name: 'IRISGo', status: 'preparing' }],
  },
  {
    slug: 'cross-domain-integration',
    family: 'optimization',
    eyebrow: 'OPTIMIZATION PROJECT',
    title: '跨域整合型',
    subtitle: '看清線上、線下與多方角色如何彼此影響',
    fit: [
      '服務橫跨多個部門、角色或系統',
      '局部改善後，整體問題仍然存在',
      '需要對齊多方並找出關鍵施力點',
    ],
    approach:
      '盤點使用者旅程、前台服務、後台流程、組織分工與系統限制，找出彼此依賴關係與能牽動全局的改善施力點。',
    example:
      '銀行辦卡流程同時涉及官網、紙本文件、分行人員、客服、審核與發卡系統；只調整其中一個畫面，無法解決整段體驗的斷點。',
    serviceItemSlugs: [
      'in-depth-interview',
      'co-creation-workshop',
      'focus-group',
      'usability-testing',
      'service-blueprint-integration',
    ],
    goals: [
      {
        title: '看清角色、流程與系統關係',
        body: '盤點使用者、前後台人員、流程與系統之間的互動。看見各環節如何彼此牽動。避免只處理局部問題，卻忽略整體影響。',
      },
      {
        title: '找出服務斷點與責任交界',
        body: '辨認資訊、任務與責任在交接時發生的落差。釐清問題來自流程、分工還是系統限制。讓團隊知道真正需要協調的位置。',
      },
      {
        title: '建立跨部門可推動的改善方向',
        body: '將不同單位的需求與限制放在同一張圖上。建立共同理解與改善優先順序。找出兼顧使用者需求與組織現況的可行方向。',
      },
    ],
    steps: [
      { title: '界定範圍', body: '確認服務涵蓋的使用者、部門、系統與接觸點，建立共同討論邊界。' },
      { title: '理解多方', body: '訪談使用者與關鍵利害關係人，理解各方需求、任務與現實限制。' },
      { title: '描繪全局', body: '整理使用者旅程、前後台流程、組織分工與系統之間的關係。' },
      { title: '找出施力點', body: '辨認服務斷點、責任交界與相互影響，排定最值得改善的位置。' },
      { title: '共擬路徑', body: '與相關單位對齊優先順序與分工，形成跨部門可推動的改善方向。' },
    ],
    value: '讓團隊共同看見完整服務系統，找到真正有影響力的改善切入點。',
    // 案例適配性與公開範圍需另行確認
    relatedCases: [{ name: '工商憑證', status: 'preparing' }],
  },
  {
    slug: 'architecture-restructuring',
    family: 'optimization',
    eyebrow: 'OPTIMIZATION PROJECT',
    title: '架構重整型',
    subtitle: '讓持續增加的內容與功能，重新變得清楚好找',
    fit: [
      '內容與功能長期累積、逐漸混亂',
      '分類、命名或導覽開始失去邏輯',
      '使用者難找，內部也難以管理',
    ],
    approach:
      '從使用者尋找資訊的方式出發，驗證分類與命名，重新建立能理解、能尋找，也能支撐後續擴充的資訊架構。',
    example:
      '網站內容與功能隨時間持續增加，使用者即使知道自己要找什麼，也常因分類方式與內部組織邏輯看不懂入口。',
    serviceItemSlugs: [
      'usability-testing',
      'information-architecture-testing',
      'information-architecture',
      'content-strategy',
    ],
    goals: [
      {
        title: '重整內容分類、命名與層級',
        body: '盤點現有內容、功能與彼此關係。從使用者的理解方式重新整理分類與名稱。讓網站與系統重新建立清楚一致的結構。',
      },
      {
        title: '建立直覺清楚的尋找路徑',
        body: '理解使用者會如何尋找資訊與判斷入口。調整導覽、分類與頁面層級。減少反覆嘗試與找不到資訊的情況。',
      },
      {
        title: '支援後續內容管理與擴充',
        body: '建立可持續使用的分類與命名原則。讓內部團隊知道新內容應放在哪裡。避免網站隨業務成長再次變得混亂。',
      },
    ],
    steps: [
      { title: '盤點內容', body: '整理現有內容、功能、分類與命名，掌握架構混亂及重複發生的位置。' },
      { title: '理解尋找', body: '了解使用者的資訊需求、尋找方式與常見任務，辨認現有架構的落差。' },
      { title: '重建架構', body: '重新規劃分類、命名、層級與導覽，建立更符合使用者理解的架構。' },
      { title: '檢視調整', body: '依專案需要進行分類檢視或樹狀測試，找出理解落差並調整架構。' },
      { title: '建立原則', body: '交付資訊架構與命名原則，協助團隊後續管理、維護與擴充內容。' },
    ],
    value: '讓資訊重新有清楚的分類與尋找路徑，也為後續內容成長保留一致架構。',
    // 相關案例候選尚未確認：只顯示「相關案例／案例內容整理中」，不顯示虛構客戶或專案名稱
    relatedCases: [{ name: '相關案例', status: 'preparing' }],
  },
  {
    slug: 'flow-optimization',
    family: 'optimization',
    eyebrow: 'OPTIMIZATION PROJECT',
    title: '流程優化型',
    subtitle: '找出操作卡點，讓重要任務更順利完成',
    fit: [
      '現有網站或系統已可正常運作',
      '仍常出現卡關、錯誤或中途放棄',
      '需要找出阻礙並排定改善順序',
    ],
    approach:
      '觀察使用者完成真實任務的過程，辨認流程、資訊與介面中的阻礙，並將問題轉化為可排優先序的改善方向。',
    example:
      '既有線上申辦流程雖然功能完整，使用者仍常在入口、欄位說明、文件上傳或完成確認等環節中斷。',
    serviceItemSlugs: [
      'usability-testing',
      'information-architecture',
      'interface-prototype-design',
      'implementation-consulting',
    ],
    goals: [
      {
        title: '找出操作卡點與中斷原因',
        body: '觀察使用者如何完成真實任務。辨認卡關、錯誤與中途放棄發生的位置。釐清問題來自流程、資訊還是介面。',
      },
      {
        title: '優化關鍵步驟與資訊呈現',
        body: '重新檢視任務順序、操作指引與畫面資訊。減少不必要的步驟與理解負擔。讓使用者更清楚目前狀態與下一步行動。',
      },
      {
        title: '讓重要任務更容易完成',
        body: '將改善資源集中在最影響任務完成的環節。降低操作過程中的疑惑與阻礙。讓整體流程更清楚、順暢且容易掌握。',
      },
    ],
    steps: [
      { title: '鎖定任務', body: '確認需要改善的關鍵任務、使用對象與流程範圍，聚焦本次優化目標。' },
      { title: '觀察操作', body: '邀請代表性使用者完成真實任務，觀察卡關、錯誤與中斷的位置。' },
      { title: '診斷卡點', body: '分析流程、資訊與介面問題，判斷各項阻礙的影響與改善優先性。' },
      { title: '提出改善', body: '將研究洞察轉化為流程、資訊與關鍵介面的具體調整方向。' },
      { title: '銜接落地', body: '整理改善優先順序與設計依據，協助內部或開發團隊理解並執行。' },
    ],
    value: '讓改善建立在真實操作證據上，優先處理最影響任務完成的關鍵節點。',
    // 正式案例內頁完成前只顯示候選名稱，不可點
    relatedCases: [{ name: '合作金庫｜信貸申辦流程優化', status: 'preparing' }],
  },
];

/* ------------------------------------------------------------- FAQ */

/** 六個專案類型頁共用；第一版不依類型改寫答案，避免不同頁面出現互相矛盾的承諾 */
export const SERVICE_FAQ: FaqItem[] = [
  {
    question: '這些方法都會在同一個專案中使用嗎？',
    answer:
      '不一定。網站列出的是常見搭配，我們會先釐清問題、目標、既有資源與時程，再決定真正必要的方法與順序，避免為了做研究而做研究。',
  },
  {
    question: '專案開始前，需要先準備完整需求嗎？',
    answer:
      '不需要先把問題定義完整。提供目前遇到的狀況、希望改善的對象、已知限制與預計時程即可；問題釐清本身就是合作初期的重要工作。',
  },
  {
    question: '研究完成後會提供完整 UI 設計嗎？',
    answer:
      '是否包含介面設計，會依專案範圍而定。我們可將洞察轉化為資訊架構、關鍵流程、線框或可驗證原型；若需要大量視覺頁面或正式 UI 製作，需在合作前另外確認分工與交付範圍。',
  },
  {
    question: '可以和既有開發商或內部團隊一起合作嗎？',
    answer:
      '可以。我們會在研究、設計與開發之間建立清楚的決策依據，協助團隊理解調整原因並處理落地限制；前提是專案需預留必要的溝通、測試與迭代時間。',
  },
  {
    question: '專案時程與費用如何估算？',
    answer:
      '會依問題範圍、受測對象招募、研究深度、交付物與協作輪次評估。初步對談後，我們會提出建議範圍、執行方式與報價，不以單一固定價格套用所有情境。',
  },
];

/* --------------------------------------------------------- 查找 helper */

export function getServiceCategory(categorySlug: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((category) => category.slug === categorySlug);
}

export function getProjectType(projectSlug: string): ProjectType | undefined {
  return PROJECT_TYPES.find((project) => project.slug === projectSlug);
}

export function getProjectTypesByFamily(family: ProjectFamily): ProjectType[] {
  return PROJECT_TYPES.filter((project) => project.family === family);
}

export interface ResolvedServiceItem {
  category: ServiceCategory;
  item: ServiceItem;
  /** 服務類別頁對應 anchor，如 /services/research/#in-depth-interview */
  href: string;
}

/** 由子項目 slug 反查所屬類別與連結；頁面顯示服務名稱與連結一律經由此處，不另外硬編碼 */
export function resolveServiceItem(itemSlug: string): ResolvedServiceItem | undefined {
  for (const category of SERVICE_CATEGORIES) {
    const item = category.items.find((candidate) => candidate.slug === itemSlug);
    if (item) {
      return { category, item, href: `${getServiceCategoryPath(category.slug)}#${item.slug}` };
    }
  }
  return undefined;
}

export function resolveServiceItems(itemSlugs: string[]): ResolvedServiceItem[] {
  return itemSlugs.map((slug) => {
    const resolved = resolveServiceItem(slug);
    if (!resolved) throw new Error(`[services] 找不到服務項目：${slug}`);
    return resolved;
  });
}

/** 已發布案例：以 href 在既有 CASES 找到相同案例資料（找不到時回傳 undefined，由 build 期驗證攔截） */
export function getPublishedCase(reference: RelatedCaseReference): CaseItem | undefined {
  if (reference.status !== 'published' || !reference.href) return undefined;
  return CASES.find((item) => item.href === reference.href);
}

/** 供 sitemap 使用：四個服務類別＋六個專案類型路由（不在 sitemap 手寫） */
export const SERVICE_ROUTES: { path: string; label: string }[] = [
  ...SERVICE_CATEGORIES.map((category) => ({
    path: getServiceCategoryPath(category.slug),
    label: category.title,
  })),
  ...PROJECT_TYPES.map((project) => ({
    path: getProjectTypePath(project.slug),
    label: project.title,
  })),
];

/* --------------------------------------------------- build 期資料驗證 */

/**
 * 資料不完整時直接讓 build 失敗，不在正式頁面顯示空卡或假連結（規格 §5.2、§13.3）。
 */
function assertServicesData(): void {
  const itemSlugs = new Set<string>();
  const categorySlugs = new Set<string>();

  for (const category of SERVICE_CATEGORIES) {
    if (categorySlugs.has(category.slug)) {
      throw new Error(`[services] 服務類別 slug 重複：${category.slug}`);
    }
    categorySlugs.add(category.slug);

    if (category.items.length === 0) {
      throw new Error(`[services] 服務類別「${category.title}」沒有任何子項目`);
    }
    for (const item of category.items) {
      if (itemSlugs.has(item.slug)) {
        throw new Error(`[services] 服務項目 slug 重複：${item.slug}`);
      }
      itemSlugs.add(item.slug);
    }
  }

  const projectSlugs = new Set<string>();
  for (const project of PROJECT_TYPES) {
    if (projectSlugs.has(project.slug)) {
      throw new Error(`[services] 專案類型 slug 重複：${project.slug}`);
    }
    projectSlugs.add(project.slug);

    if (project.serviceItemSlugs.length === 0) {
      throw new Error(`[services] 專案類型「${project.title}」沒有搭配服務`);
    }
    if (project.goals.length === 0) {
      throw new Error(`[services] 專案類型「${project.title}」沒有專案目標`);
    }
    if (project.steps.length === 0) {
      throw new Error(`[services] 專案類型「${project.title}」沒有專案流程`);
    }
    for (const slug of project.serviceItemSlugs) {
      if (!itemSlugs.has(slug)) {
        throw new Error(`[services] 專案類型「${project.title}」引用了不存在的服務項目：${slug}`);
      }
    }

    for (const reference of project.relatedCases) {
      if (reference.status === 'published') {
        if (!reference.href) {
          throw new Error(`[services] 已發布案例「${reference.name}」缺少 href`);
        }
        if (!CASES.some((item) => item.href === reference.href)) {
          throw new Error(
            `[services] 已發布案例「${reference.name}」在 CASES 中找不到 href 為 ${reference.href} 的資料`,
          );
        }
      } else if (reference.href) {
        throw new Error(`[services] 整理中案例「${reference.name}」不得帶 href（不可輸出假連結）`);
      }
    }
  }
}

assertServicesData();
