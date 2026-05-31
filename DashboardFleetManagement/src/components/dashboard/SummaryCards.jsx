import { Moon, Cigarette, Sun } from 'lucide-react';
import { getSummaryCounts } from '../../utils/alertUtils';

const cards = [
  {
    key: 'microsleep',
    label: 'Total Peringatan Microsleep',
    icon: Moon,
    color: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600 bg-amber-100',
    valueKey: 'microsleep',
  },
  {
    key: 'smoking',
    label: 'Total Peringatan Merokok',
    icon: Cigarette,
    color: 'bg-rose-50 border-rose-100',
    iconColor: 'text-rose-600 bg-rose-100',
    valueKey: 'smoking',
  },
  {
    key: 'solar',
    label: 'Total Peringatan Kejernihan Solar',
    icon: Sun,
    color: 'bg-teal-50 border-teal-100',
    iconColor: 'text-teal-600 bg-teal-100',
    valueKey: 'solarClarity',
  },
];

export default function SummaryCards() {
  const counts = getSummaryCounts();

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`rounded-2xl border p-6 shadow-sm ${card.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-brand">
                  {counts[card.valueKey]}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${card.iconColor}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
