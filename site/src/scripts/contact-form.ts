/**
 * 聯絡表單行為（2026-10-06 上線）：
 * - 載入後啟用送出鈕（無 JS 時維持停用）。
 * - 讀取服務頁評估結果的暫存（sessionStorage），合法且未過期才顯示摘要，使用者可取消勾選不附上。
 * - 送出前用 lib/contactForm.ts 驗證並標示錯誤欄位；送出到 /api/contact，成功後換成完成訊息並清除暫存。
 * - Turnstile 權杖只能用一次：送出失敗後重設，讓使用者可以直接再送。
 */
import {
  CONTACT_FIELDS,
  validateContactSubmission,
  type ContactErrors,
} from '../lib/contactForm';
import {
  ASSESSMENT_HANDOFF_KEY,
  ASSESSMENT_HANDOFF_TTL,
  parseAssessmentAnswers,
  summarizeAssessment,
  type AssessmentAnswers,
} from '../data/projectAssessment';

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string | HTMLElement) => void };
  }
}

const MESSAGES = {
  invalid: '有幾個欄位需要修正，請看下方標示。',
  verification: '人機驗證沒有通過或已過期，請重新完成驗證後再送出。',
  verificationPending: '人機驗證還在進行中，請稍候幾秒再送出。',
  failed: '目前無法送出，請稍後再試一次。',
  network: '網路連線似乎中斷了，請確認連線後再送出一次。',
};

function readHandoff(): AssessmentAnswers | undefined {
  try {
    const raw = sessionStorage.getItem(ASSESSMENT_HANDOFF_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { answers?: unknown; savedAt?: unknown };
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > ASSESSMENT_HANDOFF_TTL) {
      sessionStorage.removeItem(ASSESSMENT_HANDOFF_KEY);
      return undefined;
    }
    return parseAssessmentAnswers(parsed.answers);
  } catch {
    return undefined;
  }
}

function clearHandoff(): void {
  try {
    sessionStorage.removeItem(ASSESSMENT_HANDOFF_KEY);
  } catch {
    // 無法存取時不需處理
  }
}

function initContactForm(): void {
  const root = document.querySelector<HTMLElement>('[data-contact-root]');
  const form = root?.querySelector<HTMLFormElement>('[data-contact-form]');
  const submit = root?.querySelector<HTMLButtonElement>('[data-contact-submit]');
  const alertBox = root?.querySelector<HTMLElement>('[data-contact-alert]');
  const formWrap = root?.querySelector<HTMLElement>('[data-contact-form-wrap]');
  const success = root?.querySelector<HTMLElement>('[data-contact-success]');
  if (!root || !form || !submit || !alertBox || !formWrap || !success) return;

  const fallbackEmail = root.dataset.fallbackEmail ?? '';
  const withFallback = (message: string): string =>
    fallbackEmail ? `${message}也可以直接寫信到 ${fallbackEmail}。` : message;

  /* ---------------------------------------------------------------- 評估摘要 */

  const answers = readHandoff();
  const assessmentBox = root.querySelector<HTMLElement>('[data-contact-assessment]');
  const includeBox = root.querySelector<HTMLInputElement>('[data-contact-assessment-include]');
  if (answers && assessmentBox) {
    try {
      const titles = JSON.parse(root.dataset.projectTitles ?? '{}') as Record<string, string>;
      const summary = summarizeAssessment(answers);
      const list = assessmentBox.querySelector('[data-contact-assessment-list]');
      const result = assessmentBox.querySelector('[data-contact-assessment-result]');
      summary.items.forEach((item) => {
        const wrapper = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = item.question;
        dd.textContent = item.answer;
        wrapper.append(dt, dd);
        list?.append(wrapper);
      });
      if (result) result.textContent = summary.recommendedSlugs.map((slug) => titles[slug] ?? slug).join('、');
      assessmentBox.hidden = false;
    } catch {
      assessmentBox.hidden = true;
    }
  }

  /* ---------------------------------------------------------------- 錯誤顯示 */

  const fieldFor = (name: string): HTMLInputElement | HTMLTextAreaElement | null =>
    form.querySelector(`[name="${name}"]`);

  const clearErrors = (): void => {
    alertBox.hidden = true;
    alertBox.textContent = '';
    form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((element) => {
      element.hidden = true;
      element.textContent = '';
    });
    form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
  };

  const showFieldErrors = (errors: ContactErrors): void => {
    let first: HTMLElement | null = null;
    for (const [name, message] of Object.entries(errors)) {
      const slot = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
      const field = fieldFor(name);
      if (slot && message) {
        slot.textContent = message;
        slot.hidden = false;
      }
      field?.setAttribute('aria-invalid', 'true');
      // 依畫面順序找第一個有錯的欄位
      if (field && (!first || first.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_PRECEDING)) first = field;
    }
    (first ?? alertBox).focus();
  };

  const showAlert = (message: string): void => {
    alertBox.textContent = message;
    alertBox.hidden = false;
    alertBox.focus();
  };

  // 使用者修改欄位後，移除該欄的錯誤標示
  form.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target?.name || target.getAttribute('aria-invalid') !== 'true') return;
    target.removeAttribute('aria-invalid');
    const slot = form.querySelector<HTMLElement>(`[data-error-for="${target.name}"]`);
    if (slot) slot.hidden = true;
  });

  /* ---------------------------------------------------------------- 送出 */

  let sending = false;

  const setSending = (value: boolean): void => {
    sending = value;
    submit.disabled = value;
    submit.textContent = value ? '送出中…' : '送出';
    form.setAttribute('aria-busy', String(value));
  };

  const resetTurnstile = (): void => {
    try {
      window.turnstile?.reset();
    } catch {
      // 驗證元件尚未載入時略過
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    clearErrors();

    const formData = new FormData(form);
    const raw: Record<string, unknown> = {};
    for (const field of CONTACT_FIELDS) raw[field] = formData.get(field) ?? '';

    const validation = validateContactSubmission(raw);
    if (!validation.ok) {
      showFieldErrors(validation.errors);
      return;
    }

    const token = formData.get('cf-turnstile-response');
    if (typeof token !== 'string' || !token) {
      const slot = form.querySelector<HTMLElement>('[data-error-for="turnstile"]');
      if (slot) {
        slot.textContent = MESSAGES.verificationPending;
        slot.hidden = false;
      }
      showAlert(MESSAGES.verificationPending);
      return;
    }

    const payload: Record<string, unknown> = {
      ...validation.data,
      website: formData.get('website') ?? '',
      turnstileToken: token,
    };
    if (answers && includeBox?.checked && assessmentBox && !assessmentBox.hidden) payload.assessment = answers;

    setSending(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; code?: string; errors?: ContactErrors };

      if (response.ok && result.ok) {
        clearHandoff();
        formWrap.hidden = true;
        success.hidden = false;
        success.focus();
        return;
      }

      resetTurnstile();
      if (result.code === 'invalid' && result.errors) {
        showAlert(MESSAGES.invalid);
        showFieldErrors(result.errors);
      } else if (result.code === 'verification') {
        showAlert(MESSAGES.verification);
      } else {
        showAlert(withFallback(MESSAGES.failed));
      }
    } catch {
      resetTurnstile();
      showAlert(withFallback(MESSAGES.network));
    } finally {
      setSending(false);
    }
  });

  submit.disabled = false;
}

initContactForm();
