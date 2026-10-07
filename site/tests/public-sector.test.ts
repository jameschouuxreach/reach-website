/**
 * 公共服務內頁角色資料與 Tab 鍵盤規則測試（規格 doc/開發規格/public-sector-v1 §4、§7）。
 * 執行：npm test；不依賴任何測試框架。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ROLES, illustrationSrc, tabIndexForKey } from '../src/data/public-sector.ts';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

describe('角色資料', () => {
  it('Tab 順序為承辦→資訊廠商，點數 2+2 與 3+3', () => {
    assert.deepEqual(
      ROLES.map((r) => [r.id, r.pains.length, r.solutions.length]),
      [
        ['government', 3, 3],
        ['vendor', 2, 2],
      ],
    );
  });

  it('10 個段落 id 不重複，且對應的插圖都已部署到 public/', () => {
    const ids = ROLES.flatMap((r) => [...r.pains, ...r.solutions].map((p) => p.id));
    assert.equal(ids.length, 10);
    assert.equal(new Set(ids).size, 10);
    for (const id of ids) {
      assert.ok(existsSync(publicDir + illustrationSrc(id)), `缺少插圖：${id}`);
    }
  });
});

describe('Tab 鍵盤規則', () => {
  it('左右方向鍵循環、Home／End 跳到兩端，其他按鍵不處理', () => {
    assert.equal(tabIndexForKey('ArrowRight', 0, 2), 1);
    assert.equal(tabIndexForKey('ArrowRight', 1, 2), 0);
    assert.equal(tabIndexForKey('ArrowLeft', 0, 2), 1);
    assert.equal(tabIndexForKey('Home', 1, 2), 0);
    assert.equal(tabIndexForKey('End', 0, 2), 1);
    assert.equal(tabIndexForKey('Enter', 0, 2), undefined);
    assert.equal(tabIndexForKey(' ', 0, 2), undefined);
  });
});
