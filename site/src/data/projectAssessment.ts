/**
 * 專案類型評估（/services/ 收尾區塊「開始評估」Modal）的單一資料來源
 * ——依《致遠官網-v1-專案類型評估Modal-增量開發規格》§6–§9、§14。
 *
 * - 題目、選項、答案 value、鎖定文案、推薦理由與推薦規則全部集中於此；
 *   Astro 元件（ProjectAssessmentModal）與瀏覽器腳本（scripts/project-assessment.ts）不得各自複製一份。
 * - 六種方案的 title／subtitle／路由仍以 src/data/services.ts 為準，本檔只持有 slug；
 *   ProjectAssessmentModal.astro 於 build 期驗證每個 slug 都能在 PROJECT_TYPES 找到，找不到即 build 失敗。
 * - 推薦為確定性純函式：同一組答案永遠得到同一結果；不使用 AI、隨機權重、網路請求或任何儲存空間。
 * - 本檔刻意不 import 其他模組，且只用可直接抹除的 TypeScript 語法（無 enum／namespace），
 *   讓 tests/ 能以 `node --experimental-strip-types --test` 直接執行，不引入測試框架。
 */

/* ---------------------------------------------------------------- 方案 slug */

export type ProjectAssessmentSlug =
  | 'key-issue'
  | 'comprehensive-discovery'
  | 'advisory-partnership'
  | 'cross-domain-integration'
  | 'architecture-restructuring'
  | 'flow-optimization';

/** 結果頁可能出現的全部方案（Modal 於 build 期預先渲染六張結果卡，再由腳本顯示其中一至兩張） */
export const PROJECT_ASSESSMENT_SLUGS: readonly ProjectAssessmentSlug[] = [
  'key-issue',
  'comprehensive-discovery',
  'advisory-partnership',
  'cross-domain-integration',
  'architecture-restructuring',
  'flow-optimization',
];

/* ---------------------------------------------------------------- 答案型別（§7.1） */

export type StageValue = 'new' | 'existing' | 'unclear';

export type SituationValue =
  | 'audience-needs'
  | 'content-features'
  | 'validate-concept'
  | 'findability'
  | 'task-friction'
  | 'unknown-performance'
  | 'alignment'
  | 'recurring-unknown'
  | 'many-parts';

export type ScopeValue = 'single-system' | 'cross-domain' | 'scope-unknown';

export type ResearchCapacityValue =
  | 'established-research'
  | 'research-squeezed'
  | 'no-research-capacity'
  | 'research-unknown';

export type SupportPreferenceValue = 'one-off-research' | 'ongoing-support' | 'support-unknown';

export interface AssessmentAnswers {
  stage?: StageValue;
  situation?: SituationValue;
  scope?: ScopeValue;
  researchCapacity?: ResearchCapacityValue;
  supportPreference?: SupportPreferenceValue;
}

export type AssessmentStepId = keyof AssessmentAnswers;

/* ---------------------------------------------------------------- 題目與選項（§6，鎖定文案） */

export interface AssessmentOption {
  value: string;
  label: string;
}

export interface AssessmentQuestion {
  /** DOM 用識別字：第 2 題依第 1 題分支，三個變體各有 id（situation-new／situation-existing／situation-unclear） */
  id: string;
  /** 對應的答案欄位 */
  step: AssessmentStepId;
  /** 第 2 題變體：只在第 1 題等於此值時顯示 */
  forStage?: StageValue;
  title: string;
  options: AssessmentOption[];
}

export const ASSESSMENT_MAX_STEPS = 5;

export const ASSESSMENT_QUESTIONS: readonly AssessmentQuestion[] = [
  {
    id: 'stage',
    step: 'stage',
    title: '你現在最想處理的是？',
    options: [
      { value: 'new', label: '準備推出新的網站、系統或服務' },
      { value: 'existing', label: '想改善已經在使用的網站、系統或服務' },
      { value: 'unclear', label: '還說不清楚，只知道目前有事情卡住' },
    ],
  },
  {
    id: 'situation-new',
    step: 'situation',
    forStage: 'new',
    title: '目前最需要釐清的是？',
    options: [
      { value: 'audience-needs', label: '這項服務要提供給誰、解決什麼需求' },
      { value: 'content-features', label: '網站或系統該有哪些內容與功能' },
      { value: 'validate-concept', label: '已有構想，想驗證是否符合使用者需要' },
    ],
  },
  {
    id: 'situation-existing',
    step: 'situation',
    forStage: 'existing',
    title: '現在最常發生哪種狀況？',
    options: [
      { value: 'findability', label: '使用者找不到需要的內容或功能' },
      { value: 'task-friction', label: '使用者常在操作途中卡住、放棄或求助' },
      { value: 'unknown-performance', label: '客訴或成效不如預期，但原因還不清楚' },
    ],
  },
  {
    id: 'situation-unclear',
    step: 'situation',
    forStage: 'unclear',
    title: '以下哪種情況最接近？',
    options: [
      { value: 'alignment', label: '團隊對目標或發展方向沒有共識' },
      { value: 'recurring-unknown', label: '問題反覆發生，卻找不到真正原因' },
      { value: 'many-parts', label: '牽涉太多人與環節，不知道從哪裡開始改善' },
    ],
  },
  {
    id: 'scope',
    step: 'scope',
    title: '這次改善會牽涉哪些環節？',
    options: [
      { value: 'single-system', label: '主要是單一網站或系統內的內容與操作' },
      { value: 'cross-domain', label: '還包含客服、臨櫃、其他部門或既有系統' },
      { value: 'scope-unknown', label: '目前還不清楚完整的影響範圍' },
    ],
  },
  {
    id: 'researchCapacity',
    step: 'researchCapacity',
    title: '產品或服務持續調整時，團隊通常怎麼了解使用者？',
    options: [
      { value: 'established-research', label: '有專人與固定流程，能自行進行研究' },
      { value: 'research-squeezed', label: '會收集使用者回饋，但研究常被進度擠壓' },
      { value: 'no-research-capacity', label: '缺乏固定研究人力，多半依靠內部經驗判斷' },
      { value: 'research-unknown', label: '目前還不確定' },
    ],
  },
  {
    id: 'supportPreference',
    step: 'supportPreference',
    title: '你希望我們如何補上研究資源？',
    options: [
      { value: 'one-off-research', label: '在重要決策前，協助完成一次研究' },
      { value: 'ongoing-support', label: '配合產品迭代，持續協助研究與把關' },
      { value: 'support-unknown', label: '還不確定，想先討論適合的合作方式' },
    ],
  },
];

export function getAssessmentQuestion(id: string): AssessmentQuestion | undefined {
  return ASSESSMENT_QUESTIONS.find((question) => question.id === id);
}

/* ---------------------------------------------------------------- 鎖定文案（§4.1、§5、§9、§15；entry 與 §5.1 第一畫面已依 2026-09-08 業主指示調整） */

export const ASSESSMENT_COPY = {
  /** 服務頁收尾的評估入口（2026-09-08 業主指示：標題去掉「還」；副標改為「簡單回答幾個問題，了解你適合哪個專案」並加粗） */
  entry: {
    title: '不確定自己屬於哪一種專案？',
    subtitle: '簡單回答幾個問題，了解你適合哪個專案',
    cta: '開始評估',
  },
  /** Modal 上方標籤，同時是 dialog 的可讀名稱（規格 §5.1 的第一畫面標題與說明已依 2026-09-08 業主指示移除，開啟即顯示第 1 題） */
  label: '專案類型評估',
  progress: (current: number, max: number = ASSESSMENT_MAX_STEPS) => `第 ${current} 題／最多 ${max} 題`,
  buttons: {
    next: '下一題',
    prev: '上一題',
    result: '查看結果',
    restart: '重新評估',
    contact: '與我們討論需求',
    closeLabel: '關閉專案類型評估',
  },
  contactHref: '/contact/',
  result: {
    label: '評估結果',
    title: '適合你的專案方向',
    description: '以下結果依據你的回答整理，實際內容仍會依需求、預算與時程進一步調整。',
    reasonHeading: '為什麼推薦',
    cardCta: '查看專案說明',
    /** 顧問陪跑只達「可能適合」條件時，卡片標籤或提示前綴 */
    tentativeLabel: '可進一步評估',
    advisoryNote:
      '你的團隊也可能需要顧問陪跑：在研究容易受時程或人力影響時，由外部顧問配合迭代節奏持續協助研究與把關。',
    scopeNote: '目前完整的影響範圍仍不清楚，實際合作前需再確認是否涉及其他服務管道、部門或系統。',
  },
  error: '目前無法完成評估，請重新再試一次，或直接與我們討論需求。',
} as const;

/** 結果卡專用推薦理由（§9.2）；不取代 services.ts 既有專案副標 */
export const RECOMMENDATION_REASONS: Record<ProjectAssessmentSlug, string> = {
  'key-issue':
    '你目前已看見現象或有一個待驗證的構想，但真正原因仍不清楚。適合先聚焦關鍵議題，找出影響因素，再決定下一步。',
  'comprehensive-discovery':
    '目前仍需要釐清服務對象、核心需求或整體方向。適合先建立完整理解，再決定產品、品牌、內容與體驗如何發展。',
  'advisory-partnership':
    '產品或服務持續迭代，但團隊難以在每個重要節點投入完整研究。適合由顧問配合開發節奏，持續補上使用者觀點與專業判斷。',
  'cross-domain-integration':
    '問題不只發生在單一畫面，也牽涉不同服務管道、部門或系統。適合先盤點彼此關係，找出能推動整體改善的關鍵位置。',
  'architecture-restructuring':
    '目前最明顯的阻礙是使用者難以找到需要的內容或功能。適合重新盤點分類、命名與導覽，建立更清楚的資訊架構。',
  'flow-optimization':
    '使用者常在重要操作中卡住、放棄或轉而求助。適合觀察真實任務，找出中斷原因並改善關鍵流程。',
};

/* ---------------------------------------------------------------- 題序與答案狀態（§5.4、§7.2、§7.3） */

/** 依目前答案算出實際題序（第 2 題依第 1 題分支；第 4 題選 established-research 則沒有第 5 題） */
export function getQuestionSequence(answers: AssessmentAnswers): AssessmentQuestion[] {
  const stage = getAssessmentQuestion('stage')!;
  if (!answers.stage) return [stage];

  const situation = ASSESSMENT_QUESTIONS.find(
    (question) => question.step === 'situation' && question.forStage === answers.stage,
  )!;
  const sequence = [stage, situation, getAssessmentQuestion('scope')!, getAssessmentQuestion('researchCapacity')!];
  if (answers.researchCapacity !== 'established-research') sequence.push(getAssessmentQuestion('supportPreference')!);
  return sequence;
}

/**
 * 目前可預期的總題數：第 1 題未答時尚不知第 2 題分支，但題數必為最多 5 題（第 4 題答 established-research 才減為 4）。
 * 供「查看結果」只在最後一題出現、以及進度條比例使用；不可直接用 getQuestionSequence().length（未答第 1 題時只有 1 題）。
 */
export function getStepCount(answers: AssessmentAnswers): number {
  return answers.stage ? getQuestionSequence(answers).length : ASSESSMENT_MAX_STEPS;
}

/**
 * 寫入一題答案並依 §7.2 清除受影響的下游答案（回傳新物件，不改動輸入）：
 * - 第 1 題改變 → 清除 situation 及其後全部答案。
 * - 第 4 題「改成」established-research → 清除 supportPreference。
 * - 答案未變 → 原樣回傳，不清除任何東西（返回上一題再前進不會丟失後續答案）。
 */
export function applyAnswer(answers: AssessmentAnswers, step: AssessmentStepId, value: string): AssessmentAnswers {
  if (answers[step] === value) return answers;

  const next: Record<string, string | undefined> = { ...answers, [step]: value };
  if (step === 'stage') {
    delete next.situation;
    delete next.scope;
    delete next.researchCapacity;
    delete next.supportPreference;
  }
  if (step === 'researchCapacity' && value === 'established-research') {
    delete next.supportPreference;
  }
  return next as AssessmentAnswers;
}

/** 五個欄位是否已足以產生結果（第 5 題只在第 4 題不是 established-research 時必填） */
export function isAssessmentComplete(answers: AssessmentAnswers): boolean {
  if (!answers.stage || !answers.situation || !answers.scope || !answers.researchCapacity) return false;
  if (answers.researchCapacity === 'established-research') return true;
  return Boolean(answers.supportPreference);
}

/* ---------------------------------------------------------------- 推薦規則（§8） */

/** 第 2 題答案直接決定主要方案（§8.1） */
export const PRIMARY_BY_SITUATION: Record<SituationValue, ProjectAssessmentSlug> = {
  'audience-needs': 'comprehensive-discovery',
  'content-features': 'comprehensive-discovery',
  'validate-concept': 'key-issue',
  findability: 'architecture-restructuring',
  'task-friction': 'flow-optimization',
  'unknown-performance': 'key-issue',
  alignment: 'comprehensive-discovery',
  'recurring-unknown': 'key-issue',
  'many-parts': 'cross-domain-integration',
};

export type AdvisoryLevel = 'strong' | 'possible';

/**
 * 顧問陪跑推薦強度（§8.3）。研究資源不足與持續支援需求必須同時成立；
 * established-research 或 one-off-research 一律不推薦。
 */
export function getAdvisoryLevel(answers: AssessmentAnswers): AdvisoryLevel | undefined {
  const capacity = answers.researchCapacity;
  const support = answers.supportPreference;
  if (!capacity || capacity === 'established-research') return undefined;
  if (!support || support === 'one-off-research') return undefined;

  const lacking = capacity === 'research-squeezed' || capacity === 'no-research-capacity';
  if (lacking && support === 'ongoing-support') return 'strong';
  if (capacity === 'research-unknown' && support === 'ongoing-support') return 'possible';
  if (support === 'support-unknown') return 'possible';
  return undefined;
}

export interface AssessmentResult {
  /** 依優先序排列，最多兩個：主要方案 → 跨域整合 → 顧問陪跑 */
  recommendedSlugs: ProjectAssessmentSlug[];
  /** 顧問陪跑是否成立及其強度；成立但卡片已滿兩張時改以 advisoryNote 補充 */
  advisoryLevel?: AdvisoryLevel;
  /** 卡片上需標「可進一步評估」的方案（目前只會是顧問陪跑） */
  tentativeSlugs: ProjectAssessmentSlug[];
  /** 三重條件（主要＋跨域＋顧問陪跑）時，卡片下方的顧問陪跑補充提示 */
  advisoryNote?: string;
  /** 第 3 題 scope-unknown 時的影響範圍提示 */
  scopeNote?: string;
}

/**
 * 確定性推薦（§8.1–§8.4）。輸入不完整時擲出錯誤，由呼叫端改顯示 §15 的錯誤訊息；
 * 任何完整且合法的答案組合一定回傳一至兩個方案。
 */
export function recommend(answers: AssessmentAnswers): AssessmentResult {
  if (!isAssessmentComplete(answers)) {
    throw new Error('[projectAssessment] 答案不完整，無法產生推薦');
  }

  const primary = PRIMARY_BY_SITUATION[answers.situation!];
  if (!primary) throw new Error(`[projectAssessment] 未定義的情境「${answers.situation}」`);

  const recommendedSlugs: ProjectAssessmentSlug[] = [primary];
  if (answers.scope === 'cross-domain' && primary !== 'cross-domain-integration') {
    recommendedSlugs.push('cross-domain-integration');
  }

  const advisoryLevel = getAdvisoryLevel(answers);
  const tentativeSlugs: ProjectAssessmentSlug[] = [];
  let advisoryNote: string | undefined;
  if (advisoryLevel) {
    if (recommendedSlugs.length < 2) {
      recommendedSlugs.push('advisory-partnership');
      if (advisoryLevel === 'possible') tentativeSlugs.push('advisory-partnership');
    } else {
      advisoryNote = ASSESSMENT_COPY.result.advisoryNote;
    }
  }

  return {
    recommendedSlugs,
    advisoryLevel,
    tentativeSlugs,
    advisoryNote,
    scopeNote: answers.scope === 'scope-unknown' ? ASSESSMENT_COPY.result.scopeNote : undefined,
  };
}
