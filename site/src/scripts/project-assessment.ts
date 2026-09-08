/**
 * 專案類型評估 Modal 行為（評估 Modal 規格 §5、§7、§12、§15）：
 * 開關、一題一頁、分支題序、答案狀態與下游清除、返回／重置、焦點管理、結果顯示與錯誤防護。
 * - 題目、文案、題序與推薦規則一律 import 自 data/projectAssessment.ts，本檔不複製任何規則。
 * - 原生 <dialog>.showModal()：背景 inert、Tab 不外漏、Escape 關閉皆由瀏覽器處理；不監聽 backdrop click（避免誤觸丟失答案）。
 * - 不支援 <dialog>、找不到節點或 showModal 失敗時不攔截 CTA，連結照常前往 /contact/。
 * - 答案只存在記憶體；關閉即清除，不用 localStorage／sessionStorage／cookie／網址參數，也不發送任何請求。
 */
import {
  ASSESSMENT_COPY,
  applyAnswer,
  getQuestionSequence,
  getStepCount,
  recommend,
  type AssessmentAnswers,
  type AssessmentQuestion,
  type AssessmentStepId,
} from '../data/projectAssessment';

type View = 'questions' | 'result' | 'error';

function initProjectAssessment(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-project-assessment]');
  const trigger = document.querySelector<HTMLAnchorElement>('[data-pa-open]');
  if (!dialog || !trigger || typeof dialog.showModal !== 'function') return;

  const find = <T extends HTMLElement>(selector: string): T | null => dialog.querySelector<T>(selector);
  const form = find<HTMLFormElement>('[data-pa-form]');
  const body = find('[data-pa-body]');
  const views: Record<View, HTMLElement | null> = {
    questions: find('[data-pa-view="questions"]'),
    result: find('[data-pa-view="result"]'),
    error: find('[data-pa-view="error"]'),
  };
  const fieldsets = [...dialog.querySelectorAll<HTMLFieldSetElement>('[data-pa-question]')];
  const progressText = find('[data-pa-progress-text]');
  const progressBar = find('[data-pa-progress-bar]');
  const status = find('[data-pa-status]');
  const prevButton = find<HTMLButtonElement>('[data-pa-prev]');
  const nextButton = find<HTMLButtonElement>('[data-pa-next]');
  const restartButton = find<HTMLButtonElement>('[data-pa-restart]');
  const contactLink = find<HTMLAnchorElement>('[data-pa-contact]');
  const closeButton = find<HTMLButtonElement>('[data-pa-close]');
  const cardsContainer = find('[data-pa-cards]');
  const resultTitle = find('#pa-result-title');
  const errorMessage = find('[data-pa-error]');
  const advisoryNote = find('[data-pa-note="advisory"]');
  const advisoryNoteBadge = find('[data-pa-note-badge]');
  const scopeNote = find('[data-pa-note="scope"]');
  const cards = new Map<string, HTMLElement>();
  dialog.querySelectorAll<HTMLElement>('[data-pa-card]').forEach((card) => {
    const slug = card.dataset.paCard;
    if (slug) cards.set(slug, card);
  });

  if (
    !form || !body || !views.questions || !views.result || !views.error ||
    !progressText || !progressBar || !status || !prevButton || !nextButton || !restartButton ||
    !contactLink || !closeButton || !cardsContainer || !resultTitle || !errorMessage ||
    !advisoryNote || !advisoryNoteBadge || !scopeNote || fieldsets.length === 0
  ) {
    return;
  }

  /* ---------------------------------------------------------------- 狀態 */

  let answers: AssessmentAnswers = {};
  let index = 0;
  let view: View = 'questions';
  let sequence: AssessmentQuestion[] = getQuestionSequence(answers);

  const fieldsetFor = (question: AssessmentQuestion): HTMLFieldSetElement | undefined =>
    fieldsets.find((fieldset) => fieldset.dataset.paQuestion === question.id);

  const selectedValue = (fieldset: HTMLFieldSetElement | undefined): string | undefined =>
    fieldset?.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value;

  /** 讓每個 radio 的 checked 對齊目前答案（被清除的下游答案會一併取消勾選） */
  const syncRadios = (): void => {
    fieldsets.forEach((fieldset) => {
      const step = fieldset.dataset.paStep as AssessmentStepId | undefined;
      fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
        input.checked = step !== undefined && answers[step] === input.value;
      });
    });
  };

  const focusElement = (element: HTMLElement | null | undefined): void => {
    element?.focus({ preventScroll: true });
  };

  const setView = (next: View): void => {
    view = next;
    (Object.keys(views) as View[]).forEach((key) => {
      const element = views[key];
      if (element) element.hidden = key !== next;
    });
  };

  const setProgress = (text: string, ratio: number): void => {
    progressText.textContent = text;
    progressBar.style.width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
  };

  /** 下方操作列：第一題只有「下一題」、第二題起加「上一題」、最後一題改「查看結果」；結果／錯誤頁改「重新評估」＋「與我們討論需求」 */
  const updateFooter = (): void => {
    if (view === 'questions') {
      const question = sequence[index];
      const value = selectedValue(fieldsetFor(question));
      // 第 4 題一選到 established-research，右側即改為「查看結果」（跳過第 5 題）
      const tentative = value ? applyAnswer(answers, question.step, value) : answers;
      const isLast = index >= getStepCount(tentative) - 1;
      nextButton.hidden = false;
      nextButton.disabled = !value;
      nextButton.textContent = isLast ? ASSESSMENT_COPY.buttons.result : ASSESSMENT_COPY.buttons.next;
      prevButton.hidden = index === 0;
      restartButton.hidden = true;
      contactLink.hidden = true;
      return;
    }
    nextButton.hidden = true;
    prevButton.hidden = view === 'error';
    restartButton.hidden = false;
    contactLink.hidden = false;
  };

  /* ---------------------------------------------------------------- 畫面 */

  const renderQuestion = (focus = true): void => {
    sequence = getQuestionSequence(answers);
    if (index > sequence.length - 1) index = sequence.length - 1;
    if (index < 0) index = 0;
    const question = sequence[index];

    setView('questions');
    fieldsets.forEach((fieldset) => {
      const active = fieldset.dataset.paQuestion === question.id;
      fieldset.hidden = !active;
      if (active) {
        // 重新觸發淡入（強制 reflow 讓 animation 重跑）
        fieldset.classList.remove('pa-enter');
        void fieldset.offsetWidth;
        fieldset.classList.add('pa-enter');
      }
    });
    setProgress(ASSESSMENT_COPY.progress(index + 1), (index + 1) / getStepCount(answers));
    updateFooter();
    body.scrollTop = 0;
    if (focus) focusElement(fieldsetFor(question)?.querySelector<HTMLElement>('legend'));
  };

  const showError = (): void => {
    setView('error');
    updateFooter();
    status.textContent = ASSESSMENT_COPY.error;
    body.scrollTop = 0;
    focusElement(errorMessage);
  };

  const showResult = (): void => {
    try {
      const result = recommend(answers);

      cards.forEach((card) => {
        card.hidden = true;
        const badge = card.querySelector<HTMLElement>('[data-pa-badge]');
        if (badge) badge.hidden = true;
      });
      result.recommendedSlugs.forEach((slug) => {
        const card = cards.get(slug);
        if (!card) throw new Error(`[project-assessment] 找不到方案「${slug}」的結果卡`);
        card.hidden = false;
        const badge = card.querySelector<HTMLElement>('[data-pa-badge]');
        if (badge) badge.hidden = !result.tentativeSlugs.includes(slug);
        cardsContainer.append(card); // 依推薦優先序排列
      });
      cardsContainer.dataset.count = String(result.recommendedSlugs.length);

      advisoryNote.hidden = !result.advisoryNote;
      advisoryNoteBadge.hidden = !(result.advisoryNote && result.advisoryLevel === 'possible');
      scopeNote.hidden = !result.scopeNote;

      setView('result');
      setProgress('評估完成', 1);
      updateFooter();
      status.textContent = `評估完成，為你整理了 ${result.recommendedSlugs.length} 個專案方向`;
      body.scrollTop = 0;
      focusElement(resultTitle);
    } catch {
      showError();
    }
  };

  /* ---------------------------------------------------------------- 操作 */

  const goNext = (): void => {
    if (view !== 'questions') return;
    const question = sequence[index];
    const value = selectedValue(fieldsetFor(question));
    if (!value) return;

    // 只有真正選了不同答案並前進，才清除受影響的下游答案（applyAnswer 內處理）
    answers = applyAnswer(answers, question.step, value);
    syncRadios();
    sequence = getQuestionSequence(answers);
    if (index < sequence.length - 1) {
      index += 1;
      renderQuestion();
    } else {
      showResult();
    }
  };

  const goPrev = (): void => {
    if (view === 'result') {
      // 有回答第 5 題就回第 5 題；未顯示第 5 題則回第 4 題
      sequence = getQuestionSequence(answers);
      index = sequence.length - 1;
      renderQuestion();
      return;
    }
    if (view === 'questions' && index > 0) {
      index -= 1;
      renderQuestion();
    }
  };

  const reset = (): void => {
    answers = {};
    index = 0;
    syncRadios();
    status.textContent = '';
  };

  const restart = (): void => {
    reset();
    renderQuestion();
  };

  const open = (): void => {
    reset();
    dialog.showModal();
    document.documentElement.classList.add('pa-lock');
    renderQuestion(); // 無標題畫面（2026-09-08 業主指示），開啟即聚焦第 1 題題幹
  };

  const close = (): void => {
    if (dialog.open) dialog.close();
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      open();
    } catch {
      // Modal 無法開啟時退回無 JS 行為：前往 /contact/
      window.location.assign(trigger.href);
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    goNext();
  });
  form.addEventListener('change', (event) => {
    if ((event.target as HTMLElement | null)?.matches('input[type="radio"]')) updateFooter();
  });
  prevButton.addEventListener('click', goPrev);
  restartButton.addEventListener('click', restart);
  closeButton.addEventListener('click', close);

  // 關閉（× 或 Escape）：還原背景捲動、清除答案、焦點回到「開始評估」CTA
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('pa-lock');
    reset();
    setView('questions');
    trigger.focus();
  });
}

initProjectAssessment();
