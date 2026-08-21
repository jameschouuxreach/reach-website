/**
 * 合作對象 Logo（素材來源：03_公司營運/公司官網/合作客戶logo.pdf，皆為已提供的真實 Logo）。
 * 分組名稱「合作企業」「合作政府單位」依素材原稿。
 */
export interface Partner {
  slug: string;
  name: string;
}

export const PARTNER_COMPANIES: Partner[] = [
  { slug: 'tzuchi', name: '佛教慈濟基金會' },
  { slug: 'hope', name: '財團法人癌症希望基金會' },
  { slug: 'dentall', name: '台灣牙e通' },
  { slug: 'post', name: '中華郵政' },
  { slug: 'tcb', name: '合作金庫銀行' },
  { slug: 'ibm', name: 'IBM' },
  { slug: 'sinica', name: '中央研究院' },
];

export const PARTNER_GOVERNMENT: Partner[] = [
  { slug: 'moda', name: '數位發展部' },
  { slug: 'fia', name: '財政部財政資訊中心' },
  { slug: 'doc', name: '經濟部商業司' },
  { slug: 'dgbas', name: '行政院主計總處' },
  { slug: 'afa', name: '行政院農業委員會農糧署' },
  { slug: 'ner', name: '國立教育廣播電台' },
  { slug: 'csptc', name: '臺北市政府公務人員訓練處' },
];
