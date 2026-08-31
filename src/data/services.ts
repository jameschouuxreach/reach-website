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
  fit: string;
  approach: string;
  example: string;
  serviceItemSlugs: string[];
  value: string;
  relatedCases: RelatedCaseReference[];
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
    subtitle: '把研究洞察轉成清楚、可驗證，也能銜接開發的體驗方向',
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
    fit: '已有特定疑問、假設或品牌議題，想釐清背後原因或受眾想法。',
    approach:
      '我們聚焦單一議題進行研究，釐清影響因素、需求差異與可能方向，避免重要決策只建立在內部推測上。',
    example:
      '某電商品牌推出新產品，瀏覽與加入購物車表現正常，但實際購買轉換偏低；團隊需要進一步判斷問題來自產品理解、內容溝通，還是購買流程。',
    serviceItemSlugs: ['survey', 'in-depth-interview', 'focus-group', 'co-creation-workshop'],
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
    fit: '已有產品或服務構想，卻還不清楚目標受眾、核心需求、品牌定位與整體體驗方向。',
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
    fit: '處於發展初期、需求快速變動，沒有太多時間資源進行完整研究。',
    approach: '以固定節奏參與關鍵討論，協助釐清問題、辨認風險、安排必要研究並校正設計方向。',
    example:
      '某軟體服務在發展初期快速推出新功能，沒有足夠時間與資源執行完整研究，但仍希望有專業角色持續替操作體驗與產品方向把關。',
    serviceItemSlugs: [
      'product-discovery-consulting',
      'continuous-improvement-consulting',
      'rapid-experience-diagnostic',
      'interface-prototype-design',
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
    fit: '服務橫跨不同部門、角色、系統與接觸點，單看介面已無法解釋問題的組織。',
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
    fit: '網站或系統長期累積內容與功能，導致內容雜亂難找。',
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
    fit: '已有成熟產品，使用者卻持續出現使用問題，導致中途放棄或詢問客服的比例高。',
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
