import { useMemo, useState } from 'react';
import { Search, Calendar, MapPin, ImageIcon } from 'lucide-react';
import Badge from '../ui/Badge';
import ImageLightbox from '../ui/ImageLightbox';
import SelectField from '../ui/SelectField';
import { getAllAlertLogs } from '../../utils/alertUtils';
import { formatDisplayDate } from '../../utils/dateUtils';
import { ALERT_TYPE_FILTER_OPTIONS } from '../../constants/alerts';

export default function AlertLogTable() {
  const allLogs = useMemo(() => getAllAlertLogs(), []);
  const [searchName, setSearchName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState('');

  const filteredLogs = useMemo(() => {
    return allLogs.filter((row) => {
      const matchName =
        !searchName.trim() ||
        row.driverName.toLowerCase().includes(searchName.trim().toLowerCase());
      const matchDate = !filterDate || row.date === filterDate;
      const matchType = filterType === 'all' || row.type === filterType;
      return matchName && matchDate && matchType;
    });
  }, [allLogs, searchName, filterDate, filterType]);

  const hasActiveFilter = searchName || filterDate || filterType !== 'all';

  return (
    <div className="space-y-6">
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
        <SelectField
          value={filterType}
          onChange={setFilterType}
          options={ALERT_TYPE_FILTER_OPTIONS}
          className="min-w-[200px]"
        />
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

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50">
                <th className="px-5 py-4 font-semibold text-slate-brand">Jenis Peringatan</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Nama Sopir</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Tanggal</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Jam</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Lokasi</th>
                <th className="px-5 py-4 font-semibold text-slate-brand">Bukti</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Tidak ada log yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                filteredLogs.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-cream-100 transition hover:bg-cream-50/50"
                  >
                    <td className="px-5 py-4">
                      <Badge variant={row.type}>{row.typeLabel}</Badge>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">{row.driverName}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {formatDisplayDate(row.date)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{row.time}</td>
                    <td className="max-w-xs px-5 py-4 font-mono text-xs text-slate-600">
                      <span className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{row.location}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {row.evidenceUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxSrc(row.evidenceUrl);
                            setLightboxAlt(`Bukti ${row.typeLabel} — ${row.driverName}`);
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
          Menampilkan {filteredLogs.length} dari {allLogs.length} log peringatan
        </div>
      </div>

      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
