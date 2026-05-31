/**
 * DMSTab Component
 * Tab utama untuk Dashboard DMS
 * Mengintegrasikan semua komponen DMS (Stats, Monitoring Status, Violation Table)
 */

import DMSStatsCard from './DMSStatsCard';
import DMSMonitoringStatus from './DMSMonitoringStatus';
import DMSViolationTable from './DMSViolationTable';

export default function DMSTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-brand">Dashboard Driver Monitoring System</h1>
        <p className="mt-1 text-slate-600">
          Monitor pelanggaran pengemudi secara real-time dengan deteksi AI
        </p>
      </div>

      {/* Stats Cards */}
      <DMSStatsCard />

      {/* Grid Layout untuk Monitoring Status dan Violation Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monitoring Status (1/3 width) */}
        <div className="lg:col-span-1">
          <DMSMonitoringStatus />
        </div>

        {/* Violation Table (2/3 width) */}
        <div className="lg:col-span-2">
          <DMSViolationTable />
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-brand">Informasi Sistem</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Teknologi Deteksi</p>
            <p className="mt-1 text-sm text-slate-600">YOLOv8 + Face Recognition</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Jenis Pelanggaran</p>
            <p className="mt-1 text-sm text-slate-600">Merokok, Microsleep, Kamera Ditutup</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Update Real-time</p>
            <p className="mt-1 text-sm text-slate-600">Polling 2-5 detik</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Backend API</p>
            <p className="mt-1 text-sm text-slate-600">Node.js Express + SQLite</p>
          </div>
        </div>
      </div>
    </div>
  );
}
