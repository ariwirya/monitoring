import { useState } from 'react';
import { MapPin, Clock, Calendar, ImageIcon, FileDown, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import ImageLightbox from '../ui/ImageLightbox';
import { ALERT_TYPE_LABELS } from '../../data/mockData';
import { getAlertsByDriverId } from '../../utils/alertUtils';
import { formatDisplayDate } from '../../utils/dateUtils';
import { exportDriverReportPdf } from '../../utils/exportDriverReportPdf';

export default function DriverAlertPanel({ driver, isOpen, onClose }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState('');
  const [exporting, setExporting] = useState(false);

  if (!driver) return null;

  const alerts = getAlertsByDriverId(driver.id);

  const openLightbox = (url, alt) => {
    setLightboxSrc(url);
    setLightboxAlt(alt);
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportDriverReportPdf(driver, alerts);
    } finally {
      setExporting(false);
    }
  };

  const pdfButton = (
    <button
      type="button"
      onClick={handleExportPdf}
      disabled={exporting}
      className="inline-flex items-center gap-2 rounded-lg bg-slate-brand px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-brand/90 disabled:opacity-60"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Unduh PDF
    </button>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        wide
        title={`Riwayat Peringatan — ${driver.name}`}
        headerAction={pdfButton}
      >
        <div className="mb-6 flex shrink-0 items-center gap-4 rounded-xl border border-cream-200 bg-cream-50 p-4">
          <img
            src={driver.photoUrl}
            alt={driver.name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
          />
          <div>
            <p className="font-semibold text-slate-brand">{driver.name}</p>
            <p className="text-sm text-slate-500">ID: {driver.id}</p>
            {driver.vehiclePlate && (
              <p className="text-sm text-slate-500">Kendaraan: {driver.vehiclePlate}</p>
            )}
          </div>
          <div className="ml-auto rounded-xl bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-brand">{alerts.length}</p>
            <p className="text-xs text-slate-500">Total peringatan</p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Belum ada peringatan untuk sopir ini.
          </p>
        ) : (
          <ul className="space-y-4">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="rounded-xl border border-cream-200 bg-white p-4"
              >
                <Badge variant={alert.type}>{ALERT_TYPE_LABELS[alert.type]}</Badge>
                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                    {formatDisplayDate(alert.date)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    {alert.time}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="font-mono text-xs">{alert.location}</span>
                  </p>
                </div>
                {alert.evidenceUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      openLightbox(
                        alert.evidenceUrl,
                        `Bukti ${ALERT_TYPE_LABELS[alert.type]} — ${driver.name}`,
                      )
                    }
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-xs font-medium text-accent-teal transition hover:border-accent-teal hover:bg-teal-50"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Lihat bukti
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ImageLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        isOpen={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  );
}
