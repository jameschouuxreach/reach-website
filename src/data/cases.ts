/**
 * 精選案例資料（順序鎖定：合作金庫 → 好齡居 → 桃園卡 → 綜合所得稅報稅系統）。
 * 問題描述與成果尚未提供正式內容，一律顯示「案例內容整理中」，不得捏造。
 */
export interface CaseItem {
  name: string;
  tag: string;
  description: string;
  mediaNote: string;
}

export const CASES: CaseItem[] = [
  {
    name: '合作金庫銀行',
    tag: '金融服務',
    description: '案例內容整理中',
    mediaNote: '需要素材：網銀流程改造專案代表圖',
  },
  {
    name: '好齡居',
    tag: '生活服務（暫定）',
    description: '案例內容整理中',
    mediaNote: '需要素材：專案代表圖或研究現場照片',
  },
  {
    name: '桃園卡',
    tag: '公共服務',
    description: '案例內容整理中',
    mediaNote: '需要素材：專案代表圖或介面示意（需授權）',
  },
  {
    name: '綜合所得稅報稅系統',
    tag: '政府數位服務',
    description: '案例內容整理中',
    mediaNote: '需要素材：報稅系統專案代表圖（需授權）',
  },
];
