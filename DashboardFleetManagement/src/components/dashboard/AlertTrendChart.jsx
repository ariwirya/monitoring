import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { PERIOD_OPTIONS } from '../../utils/dateUtils';
import { buildTrendChartData } from '../../utils/trendData';
import { ALERT_TYPE_FILTER_OPTIONS, CHART_LINE_COLORS } from '../../constants/alerts';
import SelectField from '../ui/SelectField';

const PERIOD_KEYS = ['week', 'month', 'year', 'all'];

const PERIOD_OPTIONS_SELECT = PERIOD_KEYS.map((key) => ({
  value: key,
  label: PERIOD_OPTIONS[key].label,
}));

const LINE_CONFIG = [
  { key: 'total', name: 'Total', color: CHART_LINE_COLORS.total, types: ['all'] },
  {
    key: 'microsleep',
    name: 'Microsleep',
    color: CHART_LINE_COLORS.microsleep,
    types: ['all', 'microsleep'],
  },
  {
    key: 'smoking',
    name: 'Merokok',
    color: CHART_LINE_COLORS.smoking,
    types: ['all', 'smoking'],
  },
  {
    key: 'solarClarity',
    name: 'Kejernihan Solar',
    color: CHART_LINE_COLORS.solarClarity,
    types: ['all', 'solar_clarity'],
  },
];

export default function AlertTrendChart() {
  const [period, setPeriod] = useState('week');
  const [typeFilter, setTypeFilter] = useState('all');

  const chartData = useMemo(
    () => buildTrendChartData(period, typeFilter),
    [period, typeFilter],
  );

  const visibleLines = LINE_CONFIG.filter((line) => line.types.includes(typeFilter));

  const xAxisHint = {
    week: 'Sumbu X: per hari',
    month: 'Sumbu X: nama bulan',
    year: 'Sumbu X: per tahun',
    all: 'Sumbu X: per tahun (semua waktu)',
  };

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-brand/10 p-2.5 text-slate-brand">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-brand">Grafik Tren Peringatan</h3>
            <p className="text-sm text-slate-500">
              {xAxisHint[period]} — filter jenis & periode waktu
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <SelectField
            value={typeFilter}
            onChange={setTypeFilter}
            options={ALERT_TYPE_FILTER_OPTIONS}
            className="min-w-[180px]"
          />
          <SelectField
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS_SELECT}
            className="min-w-[140px]"
          />
        </div>
      </div>

      <div className="h-80 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Tidak ada data untuk filter ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebe3d6" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#ebe3d6' }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#ebe3d6' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #ebe3d6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend />
              {visibleLines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={line.key === 'total' ? 2.5 : 2}
                  dot={{ r: 4, fill: line.color }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
