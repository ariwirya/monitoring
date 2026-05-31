import { ChevronRight, AlertTriangle, Trash2 } from 'lucide-react';
import { getAlertsByDriverId } from '../../utils/alertUtils';

export default function DriverCard({ driver, onClick, onDelete }) {
  const alertCount = getAlertsByDriverId(driver.id).length;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:border-slate-brand/30 hover:shadow-md">
      <button
        type="button"
        onClick={() => onClick(driver)}
        className="flex w-full flex-col text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-brand/30"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
          <img
            src={driver.photoUrl}
            alt={driver.name}
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
          />
          {alertCount > 0 && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
              <AlertTriangle className="h-3 w-3" />
              {alertCount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold text-slate-brand">{driver.name}</p>
            <p className="text-xs text-slate-500">{driver.id}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:text-slate-brand" />
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(driver);
        }}
        className="absolute left-3 top-3 rounded-lg bg-white/90 p-2 text-slate-400 opacity-0 shadow-sm backdrop-blur transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
        aria-label={`Hapus ${driver.name}`}
        title="Hapus sopir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
