/**
 * DMS API Service
 * Service untuk komunikasi dengan Backend Node.js DMS
 * Base URL: http://localhost:3000
 */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Helper function untuk fetch API dengan error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Mendapatkan semua data pelanggaran
 * @param {Object} params - Parameter filter (limit, offset, driver_name, violation_type, start_date, end_date)
 * @returns {Promise<Object>} - Data pelanggaran
 */
export async function getViolations(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/violations${queryString ? `?${queryString}` : ''}`;
  return fetchAPI(endpoint);
}

/**
 * Mendapatkan statistik pelanggaran
 * @returns {Promise<Object>} - Data statistik
 */
export async function getViolationStats() {
  return fetchAPI('/violations/stats');
}

/**
 * Mengirim data pelanggaran baru (untuk testing)
 * @param {Object} violationData - Data pelanggaran
 * @returns {Promise<Object>} - Response dari server
 */
export async function createViolation(violationData) {
  return fetchAPI('/violations', {
    method: 'POST',
    body: JSON.stringify(violationData),
  });
}

/**
 * Mendapatkan semua data driver
 * @returns {Promise<Object>} - Data driver
 */
export async function getDrivers() {
  return fetchAPI('/drivers');
}

/**
 * Menambahkan driver baru
 * @param {Object} driverData - Data driver
 * @returns {Promise<Object>} - Response dari server
 */
export async function createDriver(driverData) {
  return fetchAPI('/drivers', {
    method: 'POST',
    body: JSON.stringify(driverData),
  });
}

/**
 * Menghapus driver berdasarkan ID
 * @param {string} driverId - ID driver
 * @returns {Promise<Object>} - Response dari server
 */
export async function deleteDriver(driverId) {
  return fetchAPI(`/drivers/${driverId}`, {
    method: 'DELETE',
  });
}

/**
 * Mendapatkan status monitoring terbaru
 * @returns {Promise<Object>} - Status monitoring
 */
export async function getMonitoringStatus() {
  return fetchAPI('/monitoring/status');
}

/**
 * Mengirim heartbeat ke server
 * @param {Object} heartbeatData - Data heartbeat
 * @returns {Promise<Object>} - Response dari server
 */
export async function sendHeartbeat(heartbeatData) {
  return fetchAPI('/monitoring/heartbeat', {
    method: 'POST',
    body: JSON.stringify(heartbeatData),
  });
}

/**
 * Mendapatkan log sistem
 * @param {Object} params - Parameter filter (limit)
 * @returns {Promise<Object>} - Data log sistem
 */
export async function getSystemLogs(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/logs${queryString ? `?${queryString}` : ''}`;
  return fetchAPI(endpoint);
}

/**
 * Mendapatkan URL snapshot lengkap
 * @param {string} snapshotPath - Path snapshot dari API
 * @returns {string} - URL lengkap snapshot
 */
export function getSnapshotUrl(snapshotPath) {
  if (!snapshotPath) return null;
  // Jika path sudah full URL, return as-is
  if (snapshotPath.startsWith('http')) return snapshotPath;
  // Jika path relative, gabungkan dengan base URL
  return `${API_BASE_URL.replace('/api', '')}${snapshotPath}`;
}
