/**
 * 聯絡表單規則測試：欄位驗證、Notion 欄位、通知信，以及評估答案的還原與摘要。
 * 執行：npm test；不依賴任何測試框架。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTACT_LIMITS,
  NOTION_PROPERTIES,
  NOTION_STATUS_NEW,
  buildNotificationEmail,
  buildNotionProperties,
  validateContactSubmission,
  type ContactAssessment,
} from '../src/lib/contactForm.ts';
import {
  parseAssessmentAnswers,
  summarizeAssessment,
  type AssessmentAnswers,
} from '../src/data/projectAssessment.ts';

const valid = { name: '王小明', email: 'ming@example.com', org: '', phone: '', message: '想改善網站', consent: true };

describe('validateContactSubmission', () => {
  it('必填齊全即通過，並去除頭尾空白', () => {
    const result = validateContactSubmission({ ...valid, name: '  王小明 ', org: ' 某機關 ' });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.data.name, '王小明');
      assert.equal(result.data.org, '某機關');
    }
  });

  it('缺必填欄位與未勾同意時逐欄回報', () => {
    const result = validateContactSubmission({ name: ' ', email: '', message: '', consent: false });
    assert.equal(result.ok, false);
    if (!result.ok) assert.deepEqual(Object.keys(result.errors).sort(), ['consent', 'email', 'message', 'name']);
  });

  it('Email 格式與電話字元', () => {
    const result = validateContactSubmission({ ...valid, email: 'not-an-email', phone: '02-1234 abc' });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.email);
      assert.ok(result.errors.phone);
    }
    assert.ok(validateContactSubmission({ ...valid, phone: '+886 (2) 2345-6789#12' }).ok);
  });

  it('超過長度上限時說明目前字數', () => {
    const result = validateContactSubmission({ ...valid, message: 'a'.repeat(CONTACT_LIMITS.message + 1) });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.errors.message ?? '', /最多 2000 字/);
  });

  it('非字串欄位與表單式勾選值', () => {
    assert.equal(validateContactSubmission({ ...valid, name: 123 }).ok, false);
    assert.ok(validateContactSubmission({ ...valid, consent: 'on' }).ok);
  });
});

const fullAnswers: AssessmentAnswers = {
  stage: 'existing',
  situation: 'findability',
  scope: 'cross-domain',
  researchCapacity: 'research-squeezed',
  supportPreference: 'ongoing-support',
};

describe('parseAssessmentAnswers', () => {
  it('完整合法答案原樣還原', () => {
    assert.deepEqual(parseAssessmentAnswers(fullAnswers), fullAnswers);
  });

  it('established-research 不需要第 5 題，帶了反而不合法', () => {
    const four = { ...fullAnswers, researchCapacity: 'established-research' as const, supportPreference: undefined };
    assert.ok(parseAssessmentAnswers(four));
    assert.equal(parseAssessmentAnswers({ ...four, supportPreference: 'ongoing-support' }), undefined);
  });

  it('不存在的值、錯分支的第 2 題、缺題、多餘欄位一律拒絕', () => {
    assert.equal(parseAssessmentAnswers({ ...fullAnswers, scope: 'everything' }), undefined);
    assert.equal(parseAssessmentAnswers({ ...fullAnswers, situation: 'audience-needs' }), undefined);
    assert.equal(parseAssessmentAnswers({ ...fullAnswers, scope: undefined }), undefined);
    assert.equal(parseAssessmentAnswers({ ...fullAnswers, extra: 'x' }), undefined);
    assert.equal(parseAssessmentAnswers('existing'), undefined);
    assert.equal(parseAssessmentAnswers(null), undefined);
  });
});

describe('summarizeAssessment', () => {
  it('依題序列出題目與所選文字，推薦與 recommend() 一致', () => {
    const summary = summarizeAssessment(fullAnswers);
    assert.equal(summary.items.length, 5);
    assert.deepEqual(summary.items.map((item) => item.step), ['stage', 'situation', 'scope', 'researchCapacity', 'supportPreference']);
    assert.equal(summary.items[1].answer, '使用者找不到需要的內容或功能');
    assert.deepEqual(summary.recommendedSlugs, ['architecture-restructuring', 'cross-domain-integration']);
  });
});

describe('buildNotionProperties', () => {
  const data = { name: '王小明', email: 'ming@example.com', org: '', phone: '', message: 'x'.repeat(4500) };

  it('基本欄位、空的選填欄位與長文字分段', () => {
    const properties = buildNotionProperties(data) as Record<string, any>;
    assert.equal(properties[NOTION_PROPERTIES.name.name].title[0].text.content, '王小明');
    assert.equal(properties[NOTION_PROPERTIES.email.name].email, 'ming@example.com');
    assert.equal(properties[NOTION_PROPERTIES.phone.name].phone_number, null);
    assert.deepEqual(properties[NOTION_PROPERTIES.org.name].rich_text, []);
    assert.deepEqual(properties[NOTION_PROPERTIES.message.name].rich_text.map((part: any) => part.text.content.length), [2000, 2000, 500]);
    assert.equal(properties[NOTION_PROPERTIES.status.name].select.name, NOTION_STATUS_NEW);
    assert.equal(properties[NOTION_PROPERTIES.recommended.name], undefined);
  });

  it('附上評估時寫入各題選項與推薦方向，半形逗號改全形', () => {
    const assessment: ContactAssessment = {
      items: summarizeAssessment(fullAnswers).items.map((item, index) => (index === 0 ? { ...item, answer: 'a,b' } : item)),
      recommendedTitles: ['架構重整型', '跨域整合型'],
    };
    const properties = buildNotionProperties(data, assessment) as Record<string, any>;
    assert.equal(properties[NOTION_PROPERTIES.stage.name].select.name, 'a，b');
    assert.equal(properties[NOTION_PROPERTIES.situation.name].select.name, '使用者找不到需要的內容或功能');
    assert.deepEqual(properties[NOTION_PROPERTIES.recommended.name].multi_select, [{ name: '架構重整型' }, { name: '跨域整合型' }]);
  });
});

describe('buildNotificationEmail', () => {
  const data = { name: '王小明', email: 'ming@example.com', org: '某機關', phone: '', message: '想改善網站' };

  it('主旨含姓名與組織，內文含所有欄位與 Notion 連結', () => {
    const email = buildNotificationEmail(data, undefined, 'https://www.notion.so/abc');
    assert.equal(email.subject, '【官網詢問】王小明／某機關');
    assert.match(email.text, /Email：ming@example\.com/);
    assert.match(email.text, /電話：（未填）/);
    assert.match(email.text, /未附上專案類型評估/);
    assert.match(email.text, /Notion：https:\/\/www\.notion\.so\/abc/);
  });

  it('Notion 寫入失敗時提醒以信件為準', () => {
    const email = buildNotificationEmail(data, { items: [], recommendedTitles: ['關鍵議題型'] }, undefined);
    assert.match(email.text, /推薦方向：關鍵議題型/);
    assert.match(email.text, /沒有成功寫入 Notion/);
  });
});
