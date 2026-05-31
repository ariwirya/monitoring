import { ALERT_TYPES } from '../data/mockData';

export const ALERT_TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua Peringatan' },
  { value: ALERT_TYPES.MICROSLEEP, label: 'Microsleep' },
  { value: ALERT_TYPES.SMOKING, label: 'Merokok' },
  { value: ALERT_TYPES.SOLAR_CLARITY, label: 'Kejernihan Solar' },
];

export const CHART_LINE_COLORS = {
  total: '#1e293b',
  microsleep: '#2563eb',
  smoking: '#dc2626',
  solarClarity: '#16a34a',
};
