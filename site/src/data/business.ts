/**
 * 企業與服務團隊內頁（/business/）的內容（2026-10-01 規格 doc/開發規格/business-v1）。
 * 文案依規格 §4 逐字採用；插圖為 assets-manifest.json 的 6 張，部署於 business/illustrations/final/。
 * 本頁只有單一受眾，不設角色 Tab；本檔不 import 其他模組，供 tests/ 直接載入。
 */

export interface BusinessPoint {
  /** 對應 assets-manifest.json 的 id，也是插圖檔名 */
  id: string;
  title: string;
  body: string;
  image: { src: string; width: number; height: number };
}

const illustration = (id: string) => ({
  src: `/images/business/illustrations/final/${id}.png`,
  width: 1448,
  height: 1086,
});

export const BUSINESS_HERO = {
  title: '找對問題，讓體驗改善轉為商業價值',
  intro: '從理解使用者出發，釐清產品與服務的改善方向。我們協助您連結使用者需求、品牌溝通與產品決策，讓每一份投入更有依據。',
};

export const BUSINESS_PAIN_HEADING = '您的產品與服務，是否也遇過這些難題？';

export const BUSINESS_PAINS: BusinessPoint[] = [
  {
    id: 'biz-pain-01-data',
    title: '看得見數據變化，卻不清楚使用者為什麼這樣做',
    body: '您知道使用者在哪一步離開、哪些功能少人使用，卻不確定背後是操作困難、資訊不足，還是產品沒有回應真正的需求。數據指出了問題發生的位置，團隊卻仍難以判斷該從哪裡改善。',
    image: illustration('biz-pain-01-data'),
  },
  {
    id: 'biz-pain-02-value',
    title: '產品有優勢，卻難讓客戶理解為什麼值得選擇',
    body: '團隊清楚產品的功能與特色，對外溝通時卻不容易說出與客戶切身相關的價值。即使投入行銷與推廣，客戶仍可能看不出與其他選擇的差異，也找不到採取行動的理由。',
    image: illustration('biz-pain-02-value'),
  },
  {
    id: 'biz-pain-03-decisions',
    title: '想法很多，卻不確定哪個方向值得投入',
    body: '新功能、服務調整與市場機會不斷出現，團隊往往只能依經驗與假設決定優先順序。當時間與資源有限，最難的是判斷哪些需求值得回應，以及投入後是否有機會帶來預期效益。',
    image: illustration('biz-pain-03-decisions'),
  },
];

export const BUSINESS_SOLUTION_HEADING = '從理解需求到驗證方向，讓投入更有依據';

export const BUSINESS_SOLUTIONS: BusinessPoint[] = [
  {
    id: 'biz-solution-01-needs',
    title: '理解行為背後的原因，找出真正需要解決的問題',
    body: '我們透過訪談、情境觀察與易用性測試等方法，了解使用者的目標、困難，以及做出選擇時的考量。再結合既有數據，協助團隊釐清問題根源，找到對使用者有意義的改善方向。',
    image: illustration('biz-solution-01-needs'),
  },
  {
    id: 'biz-solution-02-brand',
    title: '找出客戶在意的價值，讓品牌溝通更貼近需求',
    body: '我們從研究中梳理目標客群的需求、選擇理由與疑慮，找出產品優勢與客戶期待之間的連結。據此協助釐清品牌價值主張與溝通重點，讓網站、產品介紹與服務接觸點，都能說清楚「這能為我帶來什麼」。',
    image: illustration('biz-solution-02-brand'),
  },
  {
    id: 'biz-solution-03-validation',
    title: '在投入前驗證關鍵假設，優先推進值得做的事',
    body: '我們協助團隊將產品構想轉成可驗證的假設，透過概念測試、原型測試等方式，確認目標客群是否有需求、能否理解方案，以及有哪些採用障礙。再結合商業目標與執行成本，判斷優先順序，降低投入後才發現方向不合適的風險。',
    image: illustration('biz-solution-03-validation'),
  },
];

export const BUSINESS_CTA = {
  title: '讓下一步的投入，從真正的需求開始。',
  description: '無論您正在尋找成長機會、調整品牌溝通，或評估產品下一步，都歡迎與我們聊聊，一起找出值得優先解決的問題。',
  label: '聯絡我們',
  href: '/contact/',
};
