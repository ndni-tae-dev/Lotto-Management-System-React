export const money = (value) => `฿${Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 })};
export const fmt = (value) => Number(value || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
export const thaiDate = (dateStr) => {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const escape = (str) =>
  String(str).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

export const sortDigits = (value) => [...String(value || '')].sort().join('');
