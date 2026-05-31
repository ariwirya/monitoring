import { useEffect, useMemo, useState } from 'react';
import { MapPin, Clock, Calendar, ImageIcon, FileDown, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import ImageLightbox from '../ui/ImageLightbox';
import { ALERT_TYPE_LABELS } from '../../data/mockData';
import { getAlertsByDriverId } from '../../utils/alertUtils';
import { formatDisplayDate } from '../../utils/dateUtils';
import { exportDriverReportPdf } from '../../utils/exportDriverReportPdf';
import { getDriverViolations, getSnapshotUrl } from '../../utils/dmsApi';

function getAlertType(alert) {
  return alert.violation_type ?? alert.type ?? 'unknown';
}

function getAlertLabel(alert) {
  const alertType = getAlertType(alert);
  if (alertType === 'camera_covered') return 'Kamera Ditutup';
  return ALERT_TYPE_LABELS[alertType] ?? alertType;
}

function getAlertDate(alert) {
  if (alert.timestamp) return String(alert.timestamp).split('T')[0];
  return String(alert.date ?? '');
}

function getAlertTime(alert) {
  if (alert.timestamp && alert.timestamp.includes('T')) {
    return new Date(alert.timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  return alert.time ?? '-';
}

export default function DriverAlertPanel({ driver, isOpen, onClose }) {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [lightboxAlt, setLightboxAlt] = useState('');
  const [exporting, setExporting] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertError, setAlertError] = useState('');

  const useApiAlerts =
    typeof driver?.id === 'number' || /^\d+$/.test(String(driver?.id ?? ''));

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      if (!isOpen || !driver) return;

      if (!useApiAlerts) {
        setAlerts(getAlertsByDriverId(driver.id));
        setAlertError('');
        setLoadingAlerts(false);
        return;
      }

      setLoadingAlerts(true);
      setAlertError('');
      try {
        const response = await getDriverViolations(driver.id, { limit: 100 });
        const list = response.data ?? [];
        if (active) setAlerts(list);
      } catch (err) {
        if (active) {
          setAlertError('Backend tidak merespons, menampilkan data lokal.');
          setAlerts(getAlertsByDriverId(driver.id));
        }
      } finally {
        if (active) setLoadingAlerts(false);
      }
    };

    loadAlerts();

    return () => {
      active = false;
    };
  }, [driver, isOpen, useApiAlerts]);

  const driverPhoto = useMemo(() => driver?.photoUrl || driver?.photo_url || '', [driver]);

  if (!driver) return null;

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
            src={driverPhoto}
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

        {loadingAlerts ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Memuat riwayat pelanggaran...
          </p>
        ) : alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Belum ada peringatan untuk sopir ini.
          </p>
        ) : (
          <ul className="space-y-4">
            {alerts.map((alert) => {
              const alertType = getAlertType(alert);
              const evidenceUrl =
                getSnapshotUrl(alert.snapshot_path ?? alert.snapshot_url ?? alert.evidenceUrl) ??
                alert.snapshot_url ??
                alert.evidenceUrl ??
                null;

              return (
                <li
                  key={alert.id}
                  className="rounded-xl border border-cream-200 bg-white p-4"
                >
                  <Badge variant={alertType}>{getAlertLabel(alert)}</Badge>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      {formatDisplayDate(getAlertDate(alert))}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                      {getAlertTime(alert)}
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span className="font-mono text-xs">
                        {alert.location ?? alert.violation_description ?? '-'}
                      </span>
                    </p>
                  </div>
                  {evidenceUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        openLightbox(
                          evidenceUrl,
                          `Bukti ${getAlertLabel(alert)} — ${driver.name}`,
                        )
                      }
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-xs font-medium text-accent-teal transition hover:border-accent-teal hover:bg-teal-50"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Lihat bukti
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {alertError && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            {alertError}
          </p>
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
