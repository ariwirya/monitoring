import { useState } from 'react';
import { UserPlus, Loader2, RefreshCw } from 'lucide-react';
import { useDrivers } from '../../context/DriverContext';
import DriverCard from './DriverCard';
import DriverAlertPanel from './DriverAlertPanel';
import AddDriverModal from './AddDriverModal';
import DeleteDriverDialog from './DeleteDriverDialog';

export default function DriverListTab() {
  const { drivers, loading, error, loadDrivers, addDriver, deleteDriver } = useDrivers();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (driver) => {
    setDeleting(true);
    try {
      await deleteDriver(driver.id);
      if (selectedDriver?.id === driver.id) setSelectedDriver(null);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-brand">Daftar Sopir</h3>
          <p className="text-sm text-slate-500">
            Kelola data sopir untuk face recognition — klik kartu untuk riwayat peringatan
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadDrivers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-cream-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Muat ulang
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-brand/90"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Sopir
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && drivers.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Memuat data sopir...
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-200 bg-cream-50 py-16 text-center">
          <p className="text-slate-500">Belum ada sopir terdaftar</p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-brand px-4 py-2 text-sm font-medium text-white"
          >
            <UserPlus className="h-4 w-4" />
            Tambah sopir pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {drivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onClick={setSelectedDriver}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <DriverAlertPanel
        driver={selectedDriver}
        isOpen={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
      />

      <AddDriverModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={addDriver}
      />

      <DeleteDriverDialog
        driver={deleteTarget}
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
