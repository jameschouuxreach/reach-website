/**
 * 致遠觀點文章的集中資料源。列表頁、文章頁與 sitemap 共用同一份 metadata，
 * 正文本身不在此檔維護（正文只存在於
 * src/pages/insights/website-usability-vs-information-architecture.astro）。
 * 2026-09-22 改版：比較表欄序改為「架構重整型／流程優化型」、移除百分比比例，
 * 改為「適用情境／專案重點／執行方式」三列文字＋「了解專案」CTA。
 */
import { getProjectTypePath } from './services';

export const INSIGHTS_BASE_PATH = '/insights/';

export interface InsightArticleMeta {
  slug: string;
  /** 完整路徑，含開頭與結尾斜線 */
  path: string;
  /** H1／title／ogTitle 共用 */
  title: string;
  /** 類別文字 */
  category: string;
  /** description／列表摘要 */
  description: string;
}

export const FIRST_INSIGHT_ARTICLE: InsightArticleMeta = {
  slug: 'website-usability-vs-information-architecture',
  path: `${INSIGHTS_BASE_PATH}website-usability-vs-information-architecture/`,
  title: '網站改了好幾次，客戶怎麼還是覺得不好用？',
  category: '網站體驗改善',
  description:
    '網站不好用，可能是資訊找不到，也可能是操作卡住。透過兩次購物的經驗，看懂資訊架構重整、易用性測試，以及兩種專案的適用情境。',
};

/** 供 sitemap 追加使用；未來新增文章時在此陣列增列即可 */
export const INSIGHT_ROUTES = [{ path: FIRST_INSIGHT_ARTICLE.path, label: FIRST_INSIGHT_ARTICLE.title }] as const;

/* ---------------------------------------------------------------- 專案比較 */

/** 欄序固定：架構重整型在左、流程優化型在右 */
export const PROJECT_TYPE_LABELS = [
  { slug: 'architecture-restructuring', title: '架構重整型' },
  { slug: 'flow-optimization', title: '流程優化型' },
] as const;

export interface ProjectComparisonRow {
  /** 適用情境（每則為一行陣列，供表格／卡片以 <br> 換行） */
  situation: string[];
  /** 專案重點 */
  focus: string[];
  /** 執行方式（固定兩行：主／輔） */
  approach: string[];
  /** 了解專案：CTA 文字（不含裝飾箭頭）與連結 */
  ctaLabel: string;
  ctaHref: string;
}

/** 與 PROJECT_TYPE_LABELS 同序：[架構重整型, 流程優化型] */
export const PROJECT_COMPARISON_ROWS: ProjectComparisonRow[] = [
  {
    situation: ['網站以資訊瀏覽為主，操作相對簡單，但使用者經常不知道去哪裡找資料'],
    focus: ['整理內容、分類與命名，讓資訊更容易尋找與理解'],
    approach: ['資訊架構重整為主', '易用性測試為輔'],
    ctaLabel: '查看架構重整型專案',
    ctaHref: getProjectTypePath('architecture-restructuring'),
  },
  {
    situation: ['使用者通常知道要選哪個功能，但在填寫、上傳、送出等操作中反覆卡關'],
    focus: ['找出操作障礙，改善步驟、說明與回饋，讓使用者順利完成任務'],
    approach: ['易用性測試為主', '資訊架構為輔'],
    ctaLabel: '查看流程優化型專案',
    ctaHref: getProjectTypePath('flow-optimization'),
  },
];

/** 結尾主 CTA */
export const CONTACT_CTA = {
  label: '聯絡致遠，聊聊你的網站問題',
  href: '/contact/',
};
