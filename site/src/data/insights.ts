/**
 * 致遠觀點文章的集中資料源（依《致遠官網-首篇觀點文章-開發執行規格》§2.2）。
 * 列表頁、文章頁與 sitemap 共用同一份 metadata，正文本身不在此檔維護
 *（正文只存在於 src/pages/insights/website-usability-vs-information-architecture.astro，
 * 對外文案以 doc/開發規格/致遠官網-首篇觀點文章-鎖定文案.md 為準，不得改寫）。
 */
import { getProjectTypePath } from './services';

export const INSIGHTS_BASE_PATH = '/insights/';

export interface InsightArticleMeta {
  slug: string;
  /** 完整路徑，含開頭與結尾斜線 */
  path: string;
  /** H1／title／ogTitle 共用（鎖定文案 附錄C） */
  title: string;
  /** 類別文字（鎖定文案 附錄C） */
  category: string;
  /** description／列表摘要（鎖定文案 附錄C） */
  description: string;
}

export const FIRST_INSIGHT_ARTICLE: InsightArticleMeta = {
  slug: 'website-usability-vs-information-architecture',
  path: `${INSIGHTS_BASE_PATH}website-usability-vs-information-architecture/`,
  title: '網站改了好幾次，客戶怎麼還是覺得不好用？',
  category: '網站體驗改善',
  description:
    '網站不好用，可能是資訊找不到，也可能是操作卡住。透過超市與除濕機的例子，看懂易用性測試、資訊架構重整，以及兩種專案的適用情境。',
};

/** 供 sitemap 追加使用；未來新增文章時在此陣列增列即可 */
export const INSIGHT_ROUTES = [{ path: FIRST_INSIGHT_ARTICLE.path, label: FIRST_INSIGHT_ARTICLE.title }] as const;

/* ---------------------------------------------------------------- 專案比較（§5.1、鎖定文案附錄A） */

export interface ProjectComparisonRow {
  /** 專案類型 */
  projectType: string;
  /** 比較接近你的情況 */
  situation: string;
  /** 主要工作重點 */
  focus: string;
  /** 工作重心示意：易用性測試／資訊架構重整佔比，兩者總和固定為 100 */
  usabilityPercent: number;
  informationArchitecturePercent: number;
  /** 了解專案：CTA 文字（不含裝飾箭頭）與連結 */
  ctaLabel: string;
  ctaHref: string;
}

export const PROJECT_COMPARISON_ROWS: ProjectComparisonRow[] = [
  {
    projectType: '流程優化型',
    situation: '使用者通常知道要選哪個功能，但在填寫、上傳、送出等操作中反覆卡關',
    focus: '透過易用性測試找出操作障礙，調整步驟、說明與回饋，同步檢查入口與相關資訊',
    usabilityPercent: 80,
    informationArchitecturePercent: 20,
    ctaLabel: '查看流程優化型專案',
    ctaHref: getProjectTypePath('flow-optimization'),
  },
  {
    projectType: '架構重整型',
    situation: '網站以資訊瀏覽為主，操作相對簡單，但使用者經常不知道去哪裡找資料',
    focus: '盤點並整理內容、分類與命名，驗證是否容易尋找，同步檢查重要操作',
    usabilityPercent: 20,
    informationArchitecturePercent: 80,
    ctaLabel: '查看架構重整型專案',
    ctaHref: getProjectTypePath('architecture-restructuring'),
  },
];

/** 結尾主 CTA（鎖定文案附錄C；§5.3） */
export const CONTACT_CTA = {
  label: '聯絡致遠，聊聊你的網站問題',
  href: '/contact/',
};
