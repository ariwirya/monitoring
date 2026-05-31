import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as driverService from '../services/driverService';

const DriverContext = createContext(null);

export function DriverProvider({ children }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await driverService.fetchDrivers();
      setDrivers(list);
    } catch (err) {
      setError(err.message ?? 'Gagal memuat data sopir');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const addDriver = useCallback(async (payload) => {
    const created = await driverService.addDriver(payload);
    setDrivers((prev) => [created, ...prev]);
    return created;
  }, []);

  const deleteDriver = useCallback(async (driverId) => {
    await driverService.removeDriver(driverId);
    setDrivers((prev) => prev.filter((d) => d.id !== driverId));
  }, []);

  const value = useMemo(
    () => ({ drivers, loading, error, loadDrivers, addDriver, deleteDriver }),
    [drivers, loading, error, loadDrivers, addDriver, deleteDriver],
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDrivers() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error('useDrivers harus digunakan di dalam DriverProvider');
  return ctx;
}
