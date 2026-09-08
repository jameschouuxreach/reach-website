/**
 * 專案類型評估推薦規則測試（規格 §16.2 功能矩陣＋§7.2 狀態規則＋§15 全組合防護）。
 * 執行：npm test（= node --experimental-strip-types --test tests/*.test.ts）；不依賴任何測試框架。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSESSMENT_COPY,
  ASSESSMENT_MAX_STEPS,
  ASSESSMENT_QUESTIONS,
  PROJECT_ASSESSMENT_SLUGS,
  RECOMMENDATION_REASONS,
  applyAnswer,
  getAdvisoryLevel,
  getQuestionSequence,
  getStepCount,
  isAssessmentComplete,
  recommend,
  type AssessmentAnswers,
} from '../src/data/projectAssessment.ts';

const answersOf = (
  stage: AssessmentAnswers['stage'],
  situation: AssessmentAnswers['situation'],
  scope: AssessmentAnswers['scope'],
  researchCapacity: AssessmentAnswers['researchCapacity'],
  supportPreference?: AssessmentAnswers['supportPreference'],
): AssessmentAnswers => ({ stage, situation, scope, researchCapacity, supportPreference });

describe('§16.2 功能測試矩陣', () => {
  it('新服務探索：全面探索型，第 4 題後直接顯示結果', () => {
    const answers = answersOf('new', 'audience-needs', 'single-system', 'established-research');
    assert.deepEqual(recommend(answers).recommendedSlugs, ['comprehensive-discovery']);
    assert.equal(getQuestionSequence(answers).length, 4);
  });

  it('構想驗證：關鍵議題型', () => {
    const r = recommend(answersOf('new', 'validate-concept', 'single-system', 'established-research'));
    assert.deepEqual(r.recommendedSlugs, ['key-issue']);
  });

  it('資訊難找：架構重整型', () => {
    const r = recommend(answersOf('existing', 'findability', 'single-system', 'established-research'));
    assert.deepEqual(r.recommendedSlugs, ['architecture-restructuring']);
  });

  it('操作卡關：流程優化型', () => {
    const r = recommend(answersOf('existing', 'task-friction', 'single-system', 'established-research'));
    assert.deepEqual(r.recommendedSlugs, ['flow-optimization']);
  });

  it('跨域流程：流程優化型＋跨域整合型', () => {
    const r = recommend(answersOf('existing', 'task-friction', 'cross-domain', 'established-research'));
    assert.deepEqual(r.recommendedSlugs, ['flow-optimization', 'cross-domain-integration']);
    assert.equal(r.advisoryNote, undefined);
  });

  it('研究資源不足：關鍵議題型＋顧問陪跑型（強推薦，無「可進一步評估」）', () => {
    const r = recommend(answersOf('existing', 'unknown-performance', 'single-system', 'no-research-capacity', 'ongoing-support'));
    assert.deepEqual(r.recommendedSlugs, ['key-issue', 'advisory-partnership']);
    assert.equal(r.advisoryLevel, 'strong');
    assert.deepEqual(r.tentativeSlugs, []);
  });

  it('三重條件：主要＋跨域兩張卡，顧問陪跑改為卡片下方提示、不出第三張', () => {
    const r = recommend(answersOf('existing', 'task-friction', 'cross-domain', 'research-squeezed', 'ongoing-support'));
    assert.deepEqual(r.recommendedSlugs, ['flow-optimization', 'cross-domain-integration']);
    assert.equal(r.advisoryLevel, 'strong');
    assert.equal(r.advisoryNote, ASSESSMENT_COPY.result.advisoryNote);
  });

  it('一次性研究：只顯示關鍵議題型，不推薦顧問陪跑', () => {
    const r = recommend(answersOf('existing', 'unknown-performance', 'single-system', 'no-research-capacity', 'one-off-research'));
    assert.deepEqual(r.recommendedSlugs, ['key-issue']);
    assert.equal(r.advisoryLevel, undefined);
    assert.equal(r.advisoryNote, undefined);
  });

  it('複雜未知：跨域整合型＋顧問陪跑型（標記「可進一步評估」），跨域不重複', () => {
    const r = recommend(answersOf('unclear', 'many-parts', 'cross-domain', 'research-unknown', 'support-unknown'));
    assert.deepEqual(r.recommendedSlugs, ['cross-domain-integration', 'advisory-partnership']);
    assert.equal(r.advisoryLevel, 'possible');
    assert.deepEqual(r.tentativeSlugs, ['advisory-partnership']);
  });

  it('範圍未知：關鍵議題型＋影響範圍待釐清提示，不推薦跨域整合', () => {
    const r = recommend(answersOf('unclear', 'recurring-unknown', 'scope-unknown', 'established-research'));
    assert.deepEqual(r.recommendedSlugs, ['key-issue']);
    assert.equal(r.scopeNote, ASSESSMENT_COPY.result.scopeNote);
  });
});

describe('§8.3 顧問陪跑條件', () => {
  it('established-research 一律不推薦', () => {
    assert.equal(getAdvisoryLevel({ researchCapacity: 'established-research' }), undefined);
  });

  it('one-off-research 一律不推薦', () => {
    for (const capacity of ['research-squeezed', 'no-research-capacity', 'research-unknown'] as const) {
      assert.equal(getAdvisoryLevel({ researchCapacity: capacity, supportPreference: 'one-off-research' }), undefined);
    }
  });

  it('資源不足＋持續支援 → strong；其餘符合條件者 → possible', () => {
    assert.equal(getAdvisoryLevel({ researchCapacity: 'research-squeezed', supportPreference: 'ongoing-support' }), 'strong');
    assert.equal(getAdvisoryLevel({ researchCapacity: 'no-research-capacity', supportPreference: 'ongoing-support' }), 'strong');
    assert.equal(getAdvisoryLevel({ researchCapacity: 'research-unknown', supportPreference: 'ongoing-support' }), 'possible');
    assert.equal(getAdvisoryLevel({ researchCapacity: 'research-squeezed', supportPreference: 'support-unknown' }), 'possible');
    assert.equal(getAdvisoryLevel({ researchCapacity: 'no-research-capacity', supportPreference: 'support-unknown' }), 'possible');
    assert.equal(getAdvisoryLevel({ researchCapacity: 'research-unknown', supportPreference: 'support-unknown' }), 'possible');
  });

  it('主要方案本身是跨域整合且符合顧問陪跑 → 跨域整合＋顧問陪跑兩張', () => {
    const r = recommend(answersOf('unclear', 'many-parts', 'single-system', 'no-research-capacity', 'ongoing-support'));
    assert.deepEqual(r.recommendedSlugs, ['cross-domain-integration', 'advisory-partnership']);
  });
});

describe('§7.2 上游答案變更', () => {
  const full = answersOf('existing', 'task-friction', 'cross-domain', 'research-squeezed', 'ongoing-support');

  it('第 1 題改變 → 清除 situation 及其後全部答案', () => {
    assert.deepEqual(applyAnswer(full, 'stage', 'new'), { stage: 'new' });
  });

  it('答案未變 → 原樣回傳，不清除', () => {
    assert.equal(applyAnswer(full, 'stage', 'existing'), full);
    assert.equal(applyAnswer(full, 'researchCapacity', 'research-squeezed'), full);
  });

  it('第 4 題改成 established-research → 清除 supportPreference', () => {
    const next = applyAnswer(full, 'researchCapacity', 'established-research');
    assert.equal(next.researchCapacity, 'established-research');
    assert.equal(next.supportPreference, undefined);
    assert.equal(next.situation, 'task-friction');
  });

  it('第 4 題在非 established 之間改變 → 保留 supportPreference', () => {
    const next = applyAnswer(full, 'researchCapacity', 'no-research-capacity');
    assert.equal(next.supportPreference, 'ongoing-support');
  });

  it('第 2、3 題改變 → 只改該題，不清除其他答案', () => {
    assert.deepEqual(applyAnswer(full, 'scope', 'single-system'), { ...full, scope: 'single-system' });
  });
});

describe('§7.3 題序', () => {
  it('未答第 1 題只有一題；答完後依分支給對應的第 2 題', () => {
    assert.deepEqual(getQuestionSequence({}).map((q) => q.id), ['stage']);
    assert.deepEqual(getQuestionSequence({ stage: 'new' }).map((q) => q.id), [
      'stage', 'situation-new', 'scope', 'researchCapacity', 'supportPreference',
    ]);
    assert.equal(getQuestionSequence({ stage: 'unclear' })[1].id, 'situation-unclear');
  });

  it('第 4 題 established-research → 沒有第 5 題；最多題數為 5', () => {
    assert.equal(getQuestionSequence({ stage: 'existing', researchCapacity: 'established-research' }).length, 4);
    assert.equal(getQuestionSequence({ stage: 'existing', researchCapacity: 'research-unknown' }).length, ASSESSMENT_MAX_STEPS);
  });

  it('getStepCount：第 1 題未答時為 5（不可誤判為最後一題）；答 established-research 才是 4', () => {
    assert.equal(getStepCount({}), ASSESSMENT_MAX_STEPS);
    assert.equal(getStepCount({ stage: 'new' }), 5);
    assert.equal(getStepCount({ stage: 'new', researchCapacity: 'research-squeezed' }), 5);
    assert.equal(getStepCount({ stage: 'new', researchCapacity: 'established-research' }), 4);
  });

  it('完整性判斷', () => {
    assert.equal(isAssessmentComplete(answersOf('new', 'audience-needs', 'single-system', 'established-research')), true);
    assert.equal(isAssessmentComplete(answersOf('new', 'audience-needs', 'single-system', 'research-unknown')), false);
    assert.equal(isAssessmentComplete(answersOf('new', 'audience-needs', 'single-system', 'research-unknown', 'support-unknown')), true);
    assert.throws(() => recommend({ stage: 'new' }));
  });
});

describe('§15 全部合法組合防護', () => {
  it('每個組合都得到 1–2 個不重複、可對應推薦理由的方案', () => {
    const byStep = (step: string) => ASSESSMENT_QUESTIONS.filter((q) => q.step === step);
    let combos = 0;
    for (const stageQ of byStep('stage')) {
      for (const stage of stageQ.options) {
        const situationQ = ASSESSMENT_QUESTIONS.find((q) => q.step === 'situation' && q.forStage === stage.value)!;
        for (const situation of situationQ.options) {
          for (const scope of byStep('scope')[0].options) {
            for (const capacity of byStep('researchCapacity')[0].options) {
              const supports = capacity.value === 'established-research' ? [undefined] : byStep('supportPreference')[0].options;
              for (const support of supports) {
                const answers = answersOf(
                  stage.value as AssessmentAnswers['stage'],
                  situation.value as AssessmentAnswers['situation'],
                  scope.value as AssessmentAnswers['scope'],
                  capacity.value as AssessmentAnswers['researchCapacity'],
                  support?.value as AssessmentAnswers['supportPreference'],
                );
                const r = recommend(answers);
                combos += 1;
                assert.ok(r.recommendedSlugs.length >= 1 && r.recommendedSlugs.length <= 2, JSON.stringify(answers));
                assert.equal(new Set(r.recommendedSlugs).size, r.recommendedSlugs.length, '不得重複');
                for (const slug of r.recommendedSlugs) {
                  assert.ok(PROJECT_ASSESSMENT_SLUGS.includes(slug));
                  assert.ok(RECOMMENDATION_REASONS[slug].length > 0);
                }
                // 同一組答案重算必須完全一致（確定性）
                assert.deepEqual(recommend(answers), r);
              }
            }
          }
        }
      }
    }
    // 3 stage × 3 situation × 3 scope × (1 + 3×3) = 270
    assert.equal(combos, 270);
  });
});
