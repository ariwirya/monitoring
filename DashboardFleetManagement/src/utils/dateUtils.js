const PERIOD_OPTIONS = {
  week: { label: 'Minggu', days: 7 },
  month: { label: 'Bulan', days: 365 },
  year: { label: 'Tahun', days: 1825 },
  all: { label: 'All Time', days: null },
};

export { PERIOD_OPTIONS };

export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isWithinPeriod(dateStr, periodKey, referenceDate = new Date()) {
  const config = PERIOD_OPTIONS[periodKey];
  if (!config || config.days === null) return true;

  const alertDate = parseDate(dateStr);
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - config.days + 1);

  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  return alertDate >= start && alertDate <= end;
}

export function formatDisplayDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDayLabel(dateStr) {
  return parseDate(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatMonthLabel(year, monthIndex) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
}

export function formatYearLabel(year) {
  return String(year);
}

export function getMonthKey(dateStr) {
  const [y, m] = dateStr.split('-');
  return `${y}-${m}`;
}

export function getYearFromDate(dateStr) {
  return dateStr.split('-')[0];
}
