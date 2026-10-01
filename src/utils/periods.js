export const getPeriodKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const generatePeriods = () => {
  const now = new Date();
  const result = [];
  for (let monthOffset = 0; monthOffset <= 12; monthOffset += 1) {
    const base = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    [1, 16].forEach((day) => {
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result.push(key);
    });
  }
  return [...new Set(result)].sort((a, b) => new Date(b) - new Date(a));
};

export const getTodayPeriod = () => {
  const periods = generatePeriods();
  const today = getPeriodKey();
  return periods.find((p) => p >= today) || periods[periods.length - 1] || getPeriodKey();
};

export const isClosed = (period) => {
  const closeAt = new Date(`${period}T14:00:00+07:00`);
  return new Date() >= closeAt;
};

export const getTimeToClose = (period) => {
  const closeAt = new Date(`${period}T14:00:00+07:00`);
  const ms = closeAt - new Date();
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)} วัน ${minutes % 1440} นาที`;
  return `${minutes} นาที`;
};
