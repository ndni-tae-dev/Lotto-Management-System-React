export const LOTTO_TYPES = [
  ['3 ตัวบน', 3, 900],
  ['3 ตัวโต๊ด', 3, 150],
  ['3 ตัวล่าง', 3, 450],
  ['2 ตัวบน', 2, 90],
  ['2 ตัวล่าง', 2, 90],
  ['วิ่งบน', 1, 3.2],
  ['วิ่งล่าง', 1, 3.2],
];

export const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];
export const ADMIN_PASSWORD = '888888';
export const DEFAULT_RATES = Object.fromEntries(LOTTO_TYPES.map(([label, , value]) => [label, value]));

export const TAB_CONFIG = [
  { key: 'entry', icon: '✎', title: 'คีย์โพย', adminOnly: false },
  { key: 'list', icon: '☰', title: 'รายการโพย', adminOnly: false },
  { key: 'receipt', icon: '🧾', title: 'ใบรับโพย', adminOnly: false },
  { key: 'customers', icon: '☺', title: 'สรุปลูกค้า', adminOnly: false },
  { key: 'result', icon: '🎰', title: 'ผลรางวัล', adminOnly: false },
  { key: 'check', icon: '✓', title: 'เช็กโพย', adminOnly: false },
  { key: 'dashboard', icon: '📊', title: 'แดชบอร์ด', adminOnly: true },
  { key: 'random', icon: '🎲', title: 'สุ่มเลข', adminOnly: false },
  { key: 'news', icon: '📢', title: 'ข่าวสาร', adminOnly: false },
  { key: 'settings', icon: '⚙️', title: 'ตั้งค่า', adminOnly: false },
];
