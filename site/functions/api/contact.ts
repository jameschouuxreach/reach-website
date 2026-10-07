/**
 * 聯絡表單後端（Cloudflare Pages Function，POST /api/contact；2026-10-06 上線）。
 *
 * 流程：同源檢查 → 解析 JSON → 誘餌欄位 → Turnstile 人機驗證 → 欄位驗證 → 寫入 Notion → 寄通知信。
 * - Notion 與通知信任一成功就回報成功（通知信完整附上內容，Notion 失敗時信件就是備份）；兩者都失敗才回報錯誤。
 * - 金鑰只存在 Cloudflare 專案的環境變數，不進 git、不送到瀏覽器。變數清單與設定步驟見 site/AGENTS.md「聯絡表單」。
 * - 驗證規則與 Notion 欄位共用 src/lib/contactForm.ts；評估答案由 data/projectAssessment.ts 重新驗證，不信任前端文字。
 */
import {
  buildNotificationEmail,
  buildNotionProperties,
  validateContactSubmission,
  type ContactAssessment,
  type ContactSubmission,
} from '../../src/lib/contactForm';
import { parseAssessmentAnswers, summarizeAssessment } from '../../src/data/projectAssessment';
import { getProjectType } from '../../src/data/services';

interface Env {
  /** Notion integration 的 Internal Integration Secret */
  NOTION_TOKEN?: string;
  /** 表單資料庫的 ID（資料庫網址中 32 碼的那段） */
  NOTION_DATABASE_ID?: string;
  /** Turnstile 的 Secret Key */
  TURNSTILE_SECRET_KEY?: string;
  /** Resend API Key；未設定則不寄信 */
  RESEND_API_KEY?: string;
  /** 收通知的信箱，多個以逗號分隔 */
  NOTIFY_EMAIL_TO?: string;
  /** 寄件人，例如「致遠官網 <form@your-domain.tw>」；網域須先在 Resend 驗證 */
  NOTIFY_EMAIL_FROM?: string;
  /** 僅供本機測試指向假伺服器；正式環境不要設定 */
  NOTION_API_BASE?: string;
  RESEND_API_BASE?: string;
  TURNSTILE_VERIFY_URL?: string;
}

interface Context {
  request: Request;
  env: Env;
}

const MAX_BODY_BYTES = 20_000;
const NOTION_VERSION = '2022-06-28';

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const log = (message: string, detail?: unknown): void => {
  // Cloudflare 的 Functions 即時記錄可看到；不記錄使用者填寫的內容
  console.error(`[contact] ${message}`, detail ?? '');
};

async function verifyTurnstile(env: Env, token: unknown, ip: string | null): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY!);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const response = await fetch(env.TURNSTILE_VERIFY_URL || 'https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const result = (await response.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!result.success) log('Turnstile 驗證未通過', result['error-codes']);
    return result.success === true;
  } catch (error) {
    log('Turnstile 驗證服務無回應', String(error));
    return false;
  }
}

async function createNotionPage(
  env: Env,
  data: ContactSubmission,
  assessment: ContactAssessment | undefined,
): Promise<string | undefined> {
  if (!env.NOTION_TOKEN || !env.NOTION_DATABASE_ID) return undefined;
  try {
    const response = await fetch(`${env.NOTION_API_BASE || 'https://api.notion.com'}/v1/pages`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.NOTION_TOKEN}`,
        'notion-version': NOTION_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_DATABASE_ID },
        properties: buildNotionProperties(data, assessment),
      }),
    });
    if (!response.ok) {
      // Notion 的錯誤訊息會指出哪個欄位名稱或型別不符，不含使用者資料
      log(`Notion 寫入失敗 ${response.status}`, (await response.text()).slice(0, 500));
      return undefined;
    }
    const page = (await response.json()) as { url?: string };
    return page.url ?? '';
  } catch (error) {
    log('Notion 無回應', String(error));
    return undefined;
  }
}

async function sendNotification(
  env: Env,
  data: ContactSubmission,
  assessment: ContactAssessment | undefined,
  notionUrl: string | undefined,
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL_TO || !env.NOTIFY_EMAIL_FROM) return false;
  const email = buildNotificationEmail(data, assessment, notionUrl);
  try {
    const response = await fetch(`${env.RESEND_API_BASE || 'https://api.resend.com'}/emails`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.NOTIFY_EMAIL_FROM,
        to: env.NOTIFY_EMAIL_TO.split(',').map((address) => address.trim()).filter(Boolean),
        reply_to: data.email,
        subject: email.subject,
        text: email.text,
      }),
    });
    if (!response.ok) log(`通知信寄送失敗 ${response.status}`, (await response.text()).slice(0, 500));
    return response.ok;
  } catch (error) {
    log('Resend 無回應', String(error));
    return false;
  }
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  // 只接受本站頁面送出（瀏覽器一定會帶 Origin）
  if (!isSameOrigin(request)) return json(403, { ok: false, code: 'forbidden' });

  const hasNotion = Boolean(env.NOTION_TOKEN && env.NOTION_DATABASE_ID);
  const hasEmail = Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL_TO && env.NOTIFY_EMAIL_FROM);
  if (!env.TURNSTILE_SECRET_KEY || (!hasNotion && !hasEmail)) {
    log('環境變數未設定完整：需要 TURNSTILE_SECRET_KEY，以及 Notion 或通知信至少一組');
    return json(500, { ok: false, code: 'config' });
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return json(413, { ok: false, code: 'too-large' });

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json(413, { ok: false, code: 'too-large' });
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    raw = parsed as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, code: 'bad-request' });
  }

  // 誘餌欄位：真人看不到、不會填；機器人填了就假裝成功、什麼都不存
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    return json(200, { ok: true });
  }

  if (!(await verifyTurnstile(env, raw.turnstileToken, request.headers.get('cf-connecting-ip')))) {
    return json(403, { ok: false, code: 'verification' });
  }

  const validation = validateContactSubmission(raw);
  if (!validation.ok) return json(400, { ok: false, code: 'invalid', errors: validation.errors });

  // 評估答案：不合法就整份略過（不擋送出），合法才轉成文字與推薦方向
  let assessment: ContactAssessment | undefined;
  if (raw.assessment !== undefined && raw.assessment !== null) {
    const answers = parseAssessmentAnswers(raw.assessment);
    if (answers) {
      const summary = summarizeAssessment(answers);
      assessment = {
        items: summary.items,
        recommendedTitles: summary.recommendedSlugs.map((slug) => getProjectType(slug)?.title ?? slug),
      };
    } else {
      log('評估答案不合法，已略過');
    }
  }

  const notionUrl = await createNotionPage(env, validation.data, assessment);
  const emailSent = await sendNotification(env, validation.data, assessment, notionUrl);

  if (notionUrl === undefined && !emailSent) {
    return json(502, { ok: false, code: 'delivery' });
  }
  return json(200, { ok: true });
}
