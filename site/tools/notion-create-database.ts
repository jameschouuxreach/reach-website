/**
 * 一次性工具：在指定的 Notion 頁面底下建立「官網聯絡表單」資料庫，欄位名稱與型別完全對應 src/lib/contactForm.ts。
 *
 * 用法（在 site/ 內執行；金鑰只放在環境變數，不要寫進任何檔案）：
 *   NOTION_TOKEN=secret_xxx NOTION_PARENT_PAGE_ID=頁面ID node --experimental-strip-types tools/notion-create-database.ts
 *
 * 完成後會印出資料庫 ID，把它設為 Cloudflare 的 NOTION_DATABASE_ID。詳細步驟見 site/AGENTS.md「聯絡表單」。
 */
import { NOTION_PROPERTIES, NOTION_STATUS_NEW } from '../src/lib/contactForm.ts';
import { ASSESSMENT_QUESTIONS, PROJECT_ASSESSMENT_SLUGS } from '../src/data/projectAssessment.ts';

const token = process.env.NOTION_TOKEN;
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
if (!token || !parentPageId) {
  console.error('請設定環境變數 NOTION_TOKEN 與 NOTION_PARENT_PAGE_ID。');
  process.exit(1);
}

/** 方案中文名稱（與 data/services.ts 的 PROJECT_TYPES 相同；該檔會 import 其他模組，這裡不直接載入） */
const PROJECT_TITLES: Record<string, string> = {
  'key-issue': '關鍵議題型',
  'comprehensive-discovery': '全面探索型',
  'advisory-partnership': '顧問陪跑型',
  'cross-domain-integration': '跨域整合型',
  'architecture-restructuring': '架構重整型',
  'flow-optimization': '流程優化型',
};

const optionsFor = (step: string) =>
  ASSESSMENT_QUESTIONS.filter((question) => question.step === step)
    .flatMap((question) => question.options)
    .map((option) => ({ name: option.label.replace(/,/g, '，') }));

const P = NOTION_PROPERTIES;
const properties: Record<string, unknown> = {
  [P.name.name]: { title: {} },
  [P.email.name]: { email: {} },
  [P.org.name]: { rich_text: {} },
  [P.phone.name]: { phone_number: {} },
  [P.message.name]: { rich_text: {} },
  [P.status.name]: { select: { options: [{ name: NOTION_STATUS_NEW, color: 'red' }, { name: '已回覆', color: 'green' }, { name: '不適合', color: 'gray' }] } },
  [P.stage.name]: { select: { options: optionsFor('stage') } },
  [P.situation.name]: { select: { options: optionsFor('situation') } },
  [P.scope.name]: { select: { options: optionsFor('scope') } },
  [P.researchCapacity.name]: { select: { options: optionsFor('researchCapacity') } },
  [P.supportPreference.name]: { select: { options: optionsFor('supportPreference') } },
  [P.recommended.name]: { multi_select: { options: PROJECT_ASSESSMENT_SLUGS.map((slug) => ({ name: PROJECT_TITLES[slug] })) } },
  [P.submittedAt.name]: { created_time: {} },
};

const response = await fetch('https://api.notion.com/v1/databases', {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'notion-version': '2022-06-28', 'content-type': 'application/json' },
  body: JSON.stringify({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '官網聯絡表單' } }],
    properties,
  }),
});
const result = (await response.json()) as { id?: string; url?: string; message?: string };
if (!response.ok) {
  console.error(`建立失敗（${response.status}）：${result.message ?? ''}`);
  console.error('常見原因：頁面 ID 錯誤，或還沒在該頁面的「⋯ → 連線」加入這個 integration。');
  process.exit(1);
}
console.log('已建立資料庫：', result.url);
console.log('NOTION_DATABASE_ID =', result.id?.replace(/-/g, ''));
