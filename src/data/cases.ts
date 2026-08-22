/**
 * 精選案例資料（順序鎖定：合作金庫 → 好齡居 → 桃園卡 → 綜合所得稅報稅系統）。
 * 專案類型（types）僅使用已提供素材（合作客戶logo.pdf）中的描述；
 * 未提供者顯示「案例整理中」，不得捏造。
 */
export interface CaseItem {
  name: string;
  tag: string;
  types: string[];
  mediaNote: string;
}

export const CASES: CaseItem[] = [
  {
    name: '合作金庫銀行',
    tag: '金融服務',
    types: ['網銀流程改造'],
    mediaNote: '需要素材：網銀流程改造專案代表圖',
  },
  {
    name: '好齡居',
    tag: '生活服務（暫定）',
    types: ['案例整理中'],
    mediaNote: '需要素材：專案代表圖或研究現場照片',
  },
  {
    name: '桃園卡',
    tag: '公共服務',
    types: ['案例整理中'],
    mediaNote: '需要素材：專案代表圖或介面示意（需授權）',
  },
  {
    name: '綜合所得稅報稅系統',
    tag: '政府數位服務',
    types: ['報稅系統 Mac／手機版'],
    mediaNote: '需要素材：報稅系統專案代表圖（需授權）',
  },
];
