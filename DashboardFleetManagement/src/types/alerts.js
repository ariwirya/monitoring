/**
 * @typedef {'microsleep' | 'smoking' | 'solar_clarity'} AlertType
 */

/**
 * @typedef {Object} Driver
 * @property {string} id
 * @property {string} name
 * @property {string} photoUrl
 * @property {string} [vehiclePlate]
 */

/**
 * @typedef {Object} DriverAlert
 * @property {string} id
 * @property {AlertType} type
 * @property {string} driverId
 * @property {string} driverName
 * @property {string} date - YYYY-MM-DD
 * @property {string} time - HH:mm:ss
 * @property {string} location
 * @property {string} evidenceUrl
 */

/**
 * @typedef {Object} SolarClarityAlert
 * @property {string} id
 * @property {'solar_clarity'} type
 * @property {string} driverId
 * @property {string} driverName
 * @property {string} date
 * @property {string} time
 * @property {string} location
 */

/**
 * @typedef {Object} UnifiedAlertLogRow
 * @property {string} id
 * @property {AlertType} type
 * @property {string} typeLabel
 * @property {string} driverName
 * @property {string} date
 * @property {string} time
 * @property {string} location
 * @property {string|null} evidenceUrl
 */

export {};
