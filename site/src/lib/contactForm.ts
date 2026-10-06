/**
 * 聯絡表單的單一規則來源（2026-10-06 上線）：欄位、長度上限、驗證訊息、Notion 欄位與通知信內容。
 * - 瀏覽器（scripts/contact-form.ts）與 Cloudflare Function（functions/api/contact.ts）共用同一份驗證，
 *   前端驗證只為即時提示，後端一律重新驗證，不信任瀏覽器送來的任何內容。
 * - 本檔不 import 其他模組、只用可抹除的 TypeScript 語法，讓 tests/ 能以 node --experimental-strip-types 直接執行。
 * - Notion 資料庫的欄位名稱集中在 NOTION_PROPERTIES；改名時 Notion 端要同步改，否則寫入會失敗。
 */

export const CONTACT_FIELDS = ['name', 'email', 'org', 'phone', 'message'] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export const CONTACT_LIMITS: Record<ContactField, number> = {
  name: 50,
  email: 254,
  org: 100,
  phone: 30,
  message: 2000,
};

export const CONTACT_LABELS: Record<ContactField | 'consent', string> = {
  name: '姓名',
  email: 'Email',
  org: '組織名稱',
  phone: '電話',
  message: '想討論的問題',
  consent: '個人資料蒐集同意',
};

export interface ContactSubmission {
  name: string;
  email: string;
  org: string;
  phone: string;
  message: string;
}

export type ContactErrors = Partial<Record<ContactField | 'consent', string>>;

export type ContactValidation =
  | { ok: true; data: ContactSubmission }
  | { ok: false; errors: ContactErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 數字、空白與常見分隔符號，允許分機（#）與國碼（+） */
const PHONE_PATTERN = /^[0-9+\-()#\s]+$/;

/** 去頭尾空白、統一換行；非字串一律視為空字串 */
const clean = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';

/**
 * 驗證表單內容。必填：姓名、Email、想討論的問題、同意勾選；選填：組織名稱、電話。
 * 錯誤訊息直接顯示給使用者，說明要怎麼修正。
 */
export function validateContactSubmission(raw: Record<string, unknown>): ContactValidation {
  const data: ContactSubmission = {
    name: clean(raw.name),
    email: clean(raw.email),
    org: clean(raw.org),
    phone: clean(raw.phone),
    message: clean(raw.message),
  };
  const errors: ContactErrors = {};

  if (!data.name) errors.name = '請填寫姓名。';
  if (!data.email) errors.email = '請填寫 Email，方便我們回覆你。';
  else if (!EMAIL_PATTERN.test(data.email)) errors.email = 'Email 格式看起來不正確，請再確認一次。';
  if (data.phone && !PHONE_PATTERN.test(data.phone)) errors.phone = '電話只能包含數字、空白與 + - ( ) #。';
  if (!data.message) errors.message = '請簡單描述想討論的問題。';

  for (const field of CONTACT_FIELDS) {
    if (!errors[field] && data[field].length > CONTACT_LIMITS[field]) {
      errors[field] = `${CONTACT_LABELS[field]}最多 ${CONTACT_LIMITS[field]} 字，目前 ${data[field].length} 字。`;
    }
  }

  if (raw.consent !== true && raw.consent !== 'on' && raw.consent !== 'true') {
    errors.consent = '請勾選同意後再送出。';
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, data };
}

/* ---------------------------------------------------------------- Notion */

/** Notion 資料庫欄位名稱與型別（建立資料庫時要完全一致；tools/notion-create-database.mjs 依此建立） */
export const NOTION_PROPERTIES = {
  name: { name: '姓名', type: 'title' },
  email: { name: 'Email', type: 'email' },
  org: { name: '組織名稱', type: 'rich_text' },
  phone: { name: '電話', type: 'phone_number' },
  message: { name: '想討論的問題', type: 'rich_text' },
  status: { name: '處理狀態', type: 'select' },
  stage: { name: '評估｜想處理的事', type: 'select' },
  situation: { name: '評估｜目前狀況', type: 'select' },
  scope: { name: '評估｜牽涉範圍', type: 'select' },
  researchCapacity: { name: '評估｜團隊研究能力', type: 'select' },
  supportPreference: { name: '評估｜希望的協助方式', type: 'select' },
  recommended: { name: '評估｜推薦方向', type: 'multi_select' },
  submittedAt: { name: '送出時間', type: 'created_time' },
} as const;

export const NOTION_STATUS_NEW = '待回覆';

/** 評估摘要（由 data/projectAssessment.ts 的 summarizeAssessment 產生，這裡只描述形狀以免 import） */
export interface ContactAssessment {
  items: { step: string; question: string; answer: string }[];
  /** 推薦方案的中文名稱（例如「關鍵議題型」） */
  recommendedTitles: string[];
}

/** Notion rich_text 單段上限 2000 字 */
const NOTION_TEXT_LIMIT = 2000;

const richText = (value: string) =>
  value
    ? Array.from({ length: Math.ceil(value.length / NOTION_TEXT_LIMIT) }, (_, index) => ({
        type: 'text',
        text: { content: value.slice(index * NOTION_TEXT_LIMIT, (index + 1) * NOTION_TEXT_LIMIT) },
      }))
    : [];

/** Notion 的 select 選項名稱不可含半形逗號、最長 100 字 */
const selectName = (value: string): string => value.replace(/,/g, '，').slice(0, 100);

/**
 * 組出 Notion「新增頁面」的 properties。只寫欄位、不寫頁面內文：
 * 每筆資料只占一個 block，避免免費版多成員工作區的 1,000 block 上限被很快用完。
 */
export function buildNotionProperties(data: ContactSubmission, assessment?: ContactAssessment): Record<string, unknown> {
  const P = NOTION_PROPERTIES;
  const properties: Record<string, unknown> = {
    [P.name.name]: { title: richText(data.name) },
    [P.email.name]: { email: data.email },
    [P.org.name]: { rich_text: richText(data.org) },
    [P.phone.name]: { phone_number: data.phone || null },
    [P.message.name]: { rich_text: richText(data.message) },
    [P.status.name]: { select: { name: NOTION_STATUS_NEW } },
  };
  if (assessment) {
    for (const item of assessment.items) {
      const column = (P as Record<string, { name: string }>)[item.step];
      if (column) properties[column.name] = { select: { name: selectName(item.answer) } };
    }
    properties[P.recommended.name] = {
      multi_select: assessment.recommendedTitles.map((title) => ({ name: selectName(title) })),
    };
  }
  return properties;
}

/* ---------------------------------------------------------------- 通知信 */

export interface NotificationEmail {
  subject: string;
  text: string;
}

/** 通知信內容：完整附上表單與評估，Notion 寫入失敗時這封信就是備份 */
export function buildNotificationEmail(
  data: ContactSubmission,
  assessment: ContactAssessment | undefined,
  notionUrl: string | undefined,
): NotificationEmail {
  const subject = `【官網詢問】${data.name}${data.org ? `／${data.org}` : ''}`;
  const lines = [
    `${CONTACT_LABELS.name}：${data.name}`,
    `${CONTACT_LABELS.email}：${data.email}`,
    `${CONTACT_LABELS.org}：${data.org || '（未填）'}`,
    `${CONTACT_LABELS.phone}：${data.phone || '（未填）'}`,
    '',
    `${CONTACT_LABELS.message}：`,
    data.message,
  ];
  if (assessment) {
    lines.push('', '— 專案類型評估 —');
    for (const item of assessment.items) lines.push(`${item.question}`, `→ ${item.answer}`);
    lines.push(`推薦方向：${assessment.recommendedTitles.join('、')}`);
  } else {
    lines.push('', '（未附上專案類型評估）');
  }
  lines.push('', notionUrl ? `Notion：${notionUrl}` : '⚠ 這筆資料沒有成功寫入 Notion，請以本信為準手動補登。');
  return { subject, text: lines.join('\n') };
}
