import {
  ALERT_TYPE_LABELS,
  ALERT_TYPES,
  driverAlerts,
  solarClarityAlerts,
} from '../data/mockData';

/** Semua peringatan (termasuk solar) dengan nama sopir */
export function getAllAlerts() {
  const solarAsAlerts = solarClarityAlerts.map((a) => ({
    ...a,
    evidenceUrl: null,
  }));
  return [...driverAlerts, ...solarAsAlerts];
}

/** Gabungkan semua log untuk tabel keseluruhan */
export function getAllAlertLogs() {
  return getAllAlerts()
    .map((a) => ({
      id: a.id,
      type: a.type,
      typeLabel: ALERT_TYPE_LABELS[a.type],
      driverName: a.driverName,
      date: a.date,
      time: a.time,
      location: a.location,
      evidenceUrl: a.evidenceUrl ?? null,
    }))
    .sort(
      (a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`),
    );
}

export function getAlertsByDriverId(driverId) {
  return getAllAlerts()
    .filter((a) => a.driverId === driverId)
    .sort(
      (a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`),
    );
}

export function countAlertsByType(type) {
  return getAllAlerts().filter((a) => a.type === type).length;
}

export function getSummaryCounts() {
  return {
    microsleep: countAlertsByType(ALERT_TYPES.MICROSLEEP),
    smoking: countAlertsByType(ALERT_TYPES.SMOKING),
    solarClarity: countAlertsByType(ALERT_TYPES.SOLAR_CLARITY),
  };
}
