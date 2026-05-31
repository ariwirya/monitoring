/**
 * DMSMonitoringStatus Component
 * Komponen untuk menampilkan status real-time monitoring kamera
 * Menampilkan heartbeat terakhir dari edge device
 */

import { useState, useEffect } from 'react';
import { Activity, Camera, User, Clock } from 'lucide-react';
import { getMonitoringStatus } from '../../utils/dmsApi';

export default function DMSMonitoringStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await getMonitoringStatus();
      if (response.success && response.data) {
        setStatus(response.data);
        setOffline(false);
      } else {
        setOffline(true);
      }
    } catch (err) {
      console.error('Error fetching monitoring status:', err);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // Polling setiap 2 detik
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case 'safe':
        return 'bg-green-500';
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (currentStatus) => {
    switch (currentStatus) {
      case 'safe':
        return 'Aman';
      case 'danger':
        return 'Bahaya';
      case 'warning':
        return 'Peringatan';
      default:
        return 'Tidak Aktif';
    }
  };

  const formatLastHeartbeat = (timestamp) => {
    if (!timestamp) return 'Tidak ada data';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs} detik yang lalu`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} menit yang lalu`;
    return `${Math.floor(diffSecs / 3600)} jam yang lalu`;
  };

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-brand">Status Monitoring</h3>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${status ? getStatusColor(status.current_status) : 'bg-gray-400'} ${status?.current_status === 'safe' ? 'animate-pulse' : ''}`} />
          <span className="text-sm text-slate-600">
            {loading ? 'Memuat...' : status ? getStatusText(status.current_status) : 'Offline'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse bg-cream-100 rounded" />
          ))}
        </div>
      ) : status ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-cream-50 p-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-slate-600" />
              <span className="text-sm text-slate-600">Driver</span>
            </div>
            <span className="text-sm font-medium text-slate-brand">
              {status.driver_name || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-cream-50 p-3">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-slate-600" />
              <span className="text-sm text-slate-600">Kamera</span>
            </div>
            <span className={`text-sm font-medium ${status.camera_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
              {status.camera_status === 'active' ? 'Aktif' : 'Non-Aktif'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-cream-50 p-3">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-600" />
              <span className="text-sm text-slate-600">Status</span>
            </div>
            <span className={`text-sm font-medium capitalize ${
              status.current_status === 'safe' ? 'text-green-600' :
              status.current_status === 'danger' ? 'text-red-600' :
              status.current_status === 'warning' ? 'text-orange-600' :
              'text-gray-600'
            }`}>
              {getStatusText(status.current_status)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-cream-50 p-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-600" />
              <span className="text-sm text-slate-600">Heartbeat</span>
            </div>
            <span className="text-sm font-medium text-slate-brand">
              {formatLastHeartbeat(status.last_heartbeat)}
            </span>
          </div>

          {status.last_violation_type && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-600">
                Pelanggaran Terakhir: {status.last_violation_type.replace('_', ' ')}
              </p>
              {status.last_violation_time && (
                <p className="mt-1 text-xs text-red-500">
                  {formatLastHeartbeat(status.last_violation_time)}
                </p>
              )}
            </div>
          )}
          {offline && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
              Backend belum tersambung. Menampilkan status terakhir yang tersedia.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-cream-200 bg-cream-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            {offline
              ? 'Backend belum tersambung. Pastikan server DMS sedang berjalan.'
              : 'Tidak ada data monitoring. Pastikan edge device sedang berjalan.'}
          </p>
        </div>
      )}
    </div>
  );
}
