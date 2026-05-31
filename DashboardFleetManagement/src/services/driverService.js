import { drivers as initialDrivers } from '../data/mockData';
import * as dmsApi from '../utils/dmsApi';

const STORAGE_KEY = 'fleet_drivers';
const USE_API = import.meta.env.VITE_USE_DRIVER_API !== 'false';

function normalizeDriver(driver) {
  if (!driver) return driver;
  return {
    ...driver,
    id: driver.id,
    name: driver.name,
    vehiclePlate: driver.vehiclePlate ?? driver.license_plate ?? '',
    license_plate: driver.license_plate ?? driver.vehiclePlate ?? '',
    photoUrl: driver.photoUrl ?? driver.photo_url ?? '',
    photo_url: driver.photo_url ?? driver.photoUrl ?? '',
    faceEncodingPath: driver.faceEncodingPath ?? driver.face_encoding_path ?? '',
    face_encoding_path: driver.face_encoding_path ?? driver.faceEncodingPath ?? '',
    alertCount:
      driver.alertCount ?? driver.violation_count ?? driver.violationCount ?? 0,
    violation_count:
      driver.violation_count ?? driver.alertCount ?? driver.violationCount ?? 0,
  };
}

function readLocalDrivers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw).map(normalizeDriver);
  } catch {
    /* fallback ke data awal */
  }
  return initialDrivers.map(normalizeDriver);
}

function writeLocalDrivers(drivers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
}

function generateDriverId(existing) {
  const nums = existing
    .map((d) => d.id.match(/^DRV-(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `DRV-${String(next).padStart(3, '0')}`;
}

/** @returns {Promise<import('../types/alerts').Driver[]>} */
export async function fetchDrivers() {
  if (USE_API) {
    try {
      const res = await dmsApi.getDrivers();
      const list = res.data ?? res.drivers ?? res;
      if (Array.isArray(list)) return list.map(normalizeDriver);
    } catch (err) {
      console.warn('API drivers gagal, fallback localStorage:', err);
    }
  }
  return readLocalDrivers();
}

/**
 * @param {{ name: string, vehiclePlate?: string, photoUrl: string }} payload
 * @returns {Promise<import('../types/alerts').Driver>}
 */
export async function addDriver(payload) {
  if (USE_API) {
    try {
      const res = await dmsApi.createDriver(payload);
      return normalizeDriver(res.data ?? res.driver ?? res);
    } catch (err) {
      console.warn('API create driver gagal, fallback localStorage:', err);
    }
  }

  const drivers = readLocalDrivers();
  const driver = {
    id: generateDriverId(drivers),
    name: payload.name.trim(),
    photoUrl: payload.photoUrl,
    vehiclePlate: payload.vehiclePlate?.trim() || '',
  };
  writeLocalDrivers([driver, ...drivers]);
  return driver;
}

/** @param {string} driverId */
export async function removeDriver(driverId) {
  if (USE_API) {
    try {
      await dmsApi.deleteDriver(driverId);
      return;
    } catch (err) {
      console.warn('API delete driver gagal, fallback localStorage:', err);
    }
  }

  const drivers = readLocalDrivers().filter((d) => d.id !== driverId);
  writeLocalDrivers(drivers);
}

/** Konversi file foto wajah ke data URL (untuk penyimpanan lokal / preview) */
export function readPhotoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('File harus berupa gambar'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gagal membaca file foto'));
    reader.readAsDataURL(file);
  });
}
