/**
 * DMSViolationTable Component
 * Komponen tabel untuk menampilkan data pelanggaran DMS dari backend API
 * Menggunakan polling untuk update real-time
 */

import { useState, useEffect } from 'react';
import { Search, Calendar, ImageIcon, RefreshCw } from 'lucide-react';
import Badge from '../ui/Badge';
import ImageLightbox from '../ui/ImageLightbox';
import { getViolations, getSnapshotUrl } from '../../utils/dmsApi';
import { formatDisplayDate } from '../../utils/dateUtils';

// Opsi filter tipe pelanggaran
const VIOLATION_TYPE_OPTIONS = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'smoking', label: 'Merokok' },
  { value: 'microsleep', label: 'Microsleep' },
  { value: 'camera_covered', label: 'Kamera Ditutup' },
];

export default function DMSViolationTable() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch data pelanggaran dari API
  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        driver_name: searchName || undefined,
        violation_type: filterType !== 'all' ? filterType : undefined,
        start_date: filterDate || undefined,
      };
      
      const response = await getViolations(params);
      
      if (response.success) {
        setViolations(response.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError('Gagal mengambil data pelanggaran');
      }
    } catch (err) {
      setError('Error koneksi ke backend API');
      console.error('Error fetching violations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch dan polling setiap 3 detik
  useEffect(() => {
    fetchViolations();
    
    const interval = setInterval(fetchViolations, 3000); // Polling setiap 3 detik
    
    return () => clearInterval(interval);
  }, [searchName, filterType, filterDate]);

  // Filter violations
  const filteredViolations = violations.filter((violation) => {
    const matchName = !searchName.trim() || 
      violation.driver_name?.toLowerCase().includes(searchName.trim().toLowerCase());
    const matchType = filterType === 'all' || violation.violation_type === filterType;
    const matchDate = !filterDate || violation.timestamp?.startsWith(filterDate);
    return matchName && matchType && matchDate;
  });

  // Get badge variant berdasarkan tipe pelanggaran
  const getBadgeVariant = (violationType) => {
    switch (violationType) {
      case 'smoking':
        return 'warning';
      case 'microsleep':
        return 'danger';
      case 'camera_covered':
        return 'danger';
      default:
        return 'info';
    }
  };

  // Get label tipe pelanggaran
  const getViolationTypeLabel = (violationType) => {
    switch (violationType) {
      case 'smoking':
        return 'Merokok';
      case 'microsleep':
        return 'Microsleep';
      case 'camera_covered':
        return 'Kamera Ditutup';
      default:
        return violationType;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return '-';
    return `${duration.toFixed(2)} detik`;
  };

  const hasActiveFilter = searchName || filterDate || filterType !== 'all';

  return (
    <div className="space-y-6">
      {/* Header dengan refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-brand">Log Pelanggaran DMS</h2>
          {lastUpdated && (
            <p className="text-sm text-slate-500">
              Terakhir diupdate: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={fetchViolations}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-cream-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama sopir..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20"
        >
          {VIOLATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20"
          />
        </div>
        
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setSearchName('');
              setFilterDate('');
              setFilterType('all');
            }}
            className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-cream-100"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50">
                <th className="px-5 py-4 font-semibold text-slate-brand">Tipe Pelanggaran</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Nama Sopir</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Waktu</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Durasi</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Deskripsi</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Bukti Foto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {violations.length === 0 
                      ? 'Belum ada data pelanggaran' 
                      : 'Tidak ada log yang cocok dengan filter'}
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation) => (
                  <tr
                    key={violation.id}
                    className="border-b border-cream-100 transition hover:bg-cream-50/50"
                  >
                    <td className="px-5 py-4">
                      <Badge variant={getBadgeVariant(violation.violation_type)}>
                        {getViolationTypeLabel(violation.violation_type)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {violation.driver_name || 'Unknown'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatTimestamp(violation.timestamp)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatDuration(violation.duration_seconds)}
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {violation.violation_description || '-'}
                    </td>
                    <td className="px-5 py-4">
                      {violation.snapshot_path ? (
                        <button
                          type="button"
                          onClick={() => {
                            const snapshotUrl = getSnapshotUrl(violation.snapshot_path);
                            setLightboxSrc(snapshotUrl);
                            setLightboxAlt(`Bukti ${getViolationTypeLabel(violation.violation_type)} — ${violation.driver_name}`);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-xs font-medium text-accent-teal transition hover:border-accent-teal hover:bg-teal-50"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Lihat bukti
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Tidak tersedia</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-cream-200 bg-cream-50 px-5 py-3 text-xs text-slate-500">
          Menampilkan {filteredViolations.length} dari {violations.length} pelanggaran
        </div>
      </div>

      {/* Lightbox untuk melihat foto */}
      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
