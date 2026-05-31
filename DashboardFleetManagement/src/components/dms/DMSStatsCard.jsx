/**
 * DMSStatsCard Component
 * Komponen kartu statistik untuk dashboard DMS
 * Menampilkan ringkasan data pelanggaran
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Users, RefreshCw } from 'lucide-react';
import { getViolationStats } from '../../utils/dmsApi';

export default function DMSStatsCard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getViolationStats();
      
      if (response.success) {
        setStats(response.stats);
        setOffline(false);
      } else {
        setOffline(true);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setOffline(true);
      setStats({
        total: 0,
        today_count: 0,
        by_type: [],
        by_driver: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Polling setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-24 animate-pulse bg-cream-200 rounded"></div>
            <div className="mt-2 h-8 w-16 animate-pulse bg-cream-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pelanggaran',
      value: stats?.total || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Pelanggaran Hari Ini',
      value: stats?.today_count || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Driver Terlibat',
      value: stats?.by_driver?.length || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Tipe Pelanggaran',
      value: stats?.by_type?.length || 0,
      icon: AlertTriangle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-brand">Statistik Pelanggaran</h3>
        <div className="flex items-center gap-3">
          {offline && !loading && (
            <span className="text-xs text-slate-500">Mode offline: backend belum tersambung</span>
          )}
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-cream-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl ${card.bgColor} p-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-brand">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional stats by type */}
      {stats?.by_type && stats.by_type.length > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <h4 className="mb-4 font-semibold text-slate-brand">Pelanggaran per Tipe</h4>
          <div className="space-y-3">
            {stats.by_type.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 capitalize">
                  {item.violation_type.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-brand">
                    {item.count} kali
                  </span>
                  {item.avg_duration && (
                    <span className="text-xs text-slate-500">
                      Avg: {item.avg_duration.toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
