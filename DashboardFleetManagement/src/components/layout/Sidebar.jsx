import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Camera,
  Truck,
  Bell,
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';

const ICON_MAP = {
  LayoutDashboard,
  Users,
  ClipboardList,
  Camera,
};

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-cream-200 bg-white">
      <div className="flex items-center gap-3 border-b border-cream-200 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-brand text-white">
          <Truck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-slate-brand">
            Smart Fleet Management
          </p>
          <h1 className="text-xs font-medium text-slate-500">PT. Indoefti</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-brand text-white shadow-md shadow-slate-brand/20'
                  : 'text-slate-600 hover:bg-cream-100'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-cream-100' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-cream-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-cream-50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-teal/15 text-accent-teal">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">Monitoring aktif</p>
            <p className="text-xs text-slate-400">Perangkat IoT terhubung</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
