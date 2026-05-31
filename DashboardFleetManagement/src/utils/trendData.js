import { getAllAlerts } from './alertUtils';
import {
  isWithinPeriod,
  formatDayLabel,
  formatMonthLabel,
  formatYearLabel,
  parseDate,
  getMonthKey,
  getYearFromDate,
} from './dateUtils';

const REFERENCE_DATE = new Date('2026-05-21');

function matchesTypeFilter(alert, typeFilter) {
  if (typeFilter === 'all') return true;
  return alert.type === typeFilter;
}

function getBucketKey(dateStr, periodKey) {
  switch (periodKey) {
    case 'week':
      return dateStr;
    case 'month':
      return getMonthKey(dateStr);
    case 'year':
    case 'all':
    default:
      return getYearFromDate(dateStr);
  }
}

function getBucketLabel(bucketKey, periodKey) {
  switch (periodKey) {
    case 'week':
      return formatDayLabel(bucketKey);
    case 'month': {
      const [y, m] = bucketKey.split('-').map(Number);
      return formatMonthLabel(y, m - 1);
    }
    case 'year':
    case 'all':
    default:
      return formatYearLabel(bucketKey);
  }
}

function sortBucketKeys(keys, periodKey) {
  return keys.sort((a, b) => {
    if (periodKey === 'week') return parseDate(a) - parseDate(b);
    if (periodKey === 'month') return a.localeCompare(b);
    return Number(a) - Number(b);
  });
}

function createEmptyBucket(bucketKey, label) {
  return {
    bucketKey,
    label,
    total: 0,
    microsleep: 0,
    smoking: 0,
    solarClarity: 0,
  };
}

/** Agregasi tren peringatan — sumbu X mengikuti filter periode */
export function buildTrendChartData(periodKey, typeFilter = 'all') {
  const alerts = getAllAlerts().filter(
    (a) =>
      isWithinPeriod(a.date, periodKey, REFERENCE_DATE) &&
      matchesTypeFilter(a, typeFilter),
  );

  const buckets = new Map();

  for (const alert of alerts) {
    const bucketKey = getBucketKey(alert.date, periodKey);
    const label = getBucketLabel(bucketKey, periodKey);

    const existing =
      buckets.get(bucketKey) ?? createEmptyBucket(bucketKey, label);

    existing.total += 1;
    if (alert.type === 'microsleep') existing.microsleep += 1;
    if (alert.type === 'smoking') existing.smoking += 1;
    if (alert.type === 'solar_clarity') existing.solarClarity += 1;

    buckets.set(bucketKey, existing);
  }

  const sortedKeys = sortBucketKeys([...buckets.keys()], periodKey);
  return sortedKeys.map((key) => buckets.get(key));
}
