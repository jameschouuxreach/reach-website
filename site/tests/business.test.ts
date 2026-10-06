/**
 * 企業頁內容資料測試（規格 doc/開發規格/business-v1 §4、§5）：點數、id 與插圖對應。
 * 執行：npm test；不依賴任何測試框架。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BUSINESS_PAINS, BUSINESS_SOLUTIONS } from '../src/data/business.ts';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

describe('企業頁內容', () => {
  it('3 個痛點＋3 個解法，id 不重複', () => {
    const ids = [...BUSINESS_PAINS, ...BUSINESS_SOLUTIONS].map((p) => p.id);
    assert.equal(BUSINESS_PAINS.length, 3);
    assert.equal(BUSINESS_SOLUTIONS.length, 3);
    assert.equal(new Set(ids).size, 6);
  });

  it('每列插圖使用自己的 id、位於 business/ 且已部署', () => {
    for (const point of [...BUSINESS_PAINS, ...BUSINESS_SOLUTIONS]) {
      assert.equal(point.image.src, `/images/business/illustrations/final/${point.id}.png`);
      assert.ok(existsSync(publicDir + point.image.src), `缺少插圖：${point.id}`);
    }
  });
});
