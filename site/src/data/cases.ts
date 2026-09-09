/**
 * 精選案例資料（順序：好齡居 A → 好齡居 B → 好齡居 C → 合作金庫；
 * 首頁維持四張；桃園卡佔位卡於 v2.2 由好齡居 C 版取代；報稅系統暫不展示）。
 * 專案類型（types）僅使用已提供素材（合作客戶logo.pdf）中的描述；
 * 未提供者顯示「案例整理中」，不得捏造。
 *
 * 好齡居目前以三種敘事風格並列測試（A 悠識務實版／B AJA 品牌敘事版／C 小瑜觀點版），
 * 內容依據《好齡居專案實例-版本A/B/C》指示文件；擇定後保留一版並改用 /work/nexdo。
 */
export interface CaseItem {
  name: string;
  tag: string;
  types: string[];
  mediaNote?: string;
  eyebrow?: string;
  summary?: string;
  image?: { src: string; alt: string };
  href?: string;
  cta?: string;
}

export const CASES: CaseItem[] = [
  {
    name: '好齡居｜樂齡居住服務品牌及網站優化',
    tag: '生活服務',
    types: ['研究分析', '品牌與服務定位', '內容策略'],
    eyebrow: '好齡居 NEXDO',
    summary:
      '透過 303 份問卷與 5 位深度訪談，釐清實際購買服務的子女與使用服務的長輩各自在意什麼，並將洞察落地為服務分類、品牌定位、首頁架構與內容策略。',
    image: {
      src: '/images/work/nexdo/nexdo-home-hero.jpg',
      alt: '好齡居新網站首頁，以生活情境引導使用者認識居住安全、清潔收納、樂齡健康與租房搬家服務',
    },
    href: '/work/nexdo-a/',
    cta: '查看專案',
  },
  {
    name: '好齡居｜重新定義長照服務的角色與價值',
    tag: '生活服務',
    types: ['體驗策略', '品牌定位', '跨世代照顧'],
    eyebrow: '好齡居 NEXDO',
    summary:
      '我們從子女與長輩的真實關係出發，重新定義好齡居的角色：不只解決家的問題，更成為協助彼此理解、讓改變開始發生的第三方。',
    image: {
      src: '/images/work/nexdo/nexdo-about-hero.jpg',
      alt: '好齡居品牌頁以跨世代家庭相處情境傳達陪伴與理解',
    },
    href: '/work/nexdo-b/',
    cta: '查看專案',
  },
  {
    // 版本 C：小瑜觀點版（卡片文字依指示文件 §2；標題與 B 版指示文件相同，擇定後需調整）
    name: '好齡居｜重新定義長照服務的角色與價值',
    tag: '生活服務',
    types: ['品牌研究', '服務定位', '網站策略'],
    eyebrow: '好齡居 NEXDO',
    summary:
      '我們從子女與長輩不同的需求出發，協助好齡居重新整理目標受眾、服務分類與品牌角色，並將研究判斷落實到網站與內容策略。',
    image: {
      src: '/images/work/nexdo/nexdo-home-hero-20260826.jpg',
      alt: '好齡居現行網站首頁，以家庭生活情境呈現樂齡居住服務',
    },
    href: '/work/nexdo-c/',
    cta: '查看專案',
  },
  {
    name: '合作金庫銀行',
    tag: '金融服務',
    types: ['網銀流程改造'],
    mediaNote: '需要素材：網銀流程改造專案代表圖',
  },
];
