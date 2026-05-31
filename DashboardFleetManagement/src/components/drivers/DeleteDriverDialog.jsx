import { Loader2, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';

export default function DeleteDriverDialog({
  driver,
  isOpen,
  onClose,
  onConfirm,
  deleting,
}) {
  if (!driver) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hapus Sopir">
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl border border-cream-200 bg-cream-50 p-4">
          <img
            src={driver.photoUrl}
            alt={driver.name}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
          />
          <div>
            <p className="font-semibold text-slate-brand">{driver.name}</p>
            <p className="text-sm text-slate-500">{driver.id}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Sopir ini akan dihapus dari daftar dan data face recognition. Riwayat peringatan
          lama tetap tersimpan di log. Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-cream-100"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(driver)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Hapus Sopir
          </button>
        </div>
      </div>
    </Modal>
  );
}
