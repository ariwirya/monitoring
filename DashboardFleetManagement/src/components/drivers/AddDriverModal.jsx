import { useRef, useState } from 'react';
import { UserPlus, Upload, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { readPhotoAsDataUrl } from '../../services/driverService';

const emptyForm = { name: '', vehiclePlate: '', photoPreview: null, photoFile: null };

export default function AddDriverModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileRef = useRef(null);

  const reset = () => {
    setForm(emptyForm);
    setFormError('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readPhotoAsDataUrl(file);
      setForm((f) => ({ ...f, photoFile: file, photoPreview: dataUrl }));
      setFormError('');
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Nama sopir wajib diisi');
      return;
    }
    if (!form.photoPreview) {
      setFormError('Foto wajah wajib diunggah untuk face recognition');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        name: form.name.trim(),
        vehiclePlate: form.vehiclePlate.trim(),
        photoUrl: form.photoPreview,
      });
      reset();
      onClose();
    } catch (err) {
      setFormError(err.message ?? 'Gagal menambahkan sopir');
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Sopir Baru" wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-slate-500">
          Unggah foto wajah formal (menghadap kamera) untuk pendaftaran face recognition.
        </p>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-cream-200 bg-cream-50 p-6">
          {form.photoPreview ? (
            <img
              src={form.photoPreview}
              alt="Preview foto sopir"
              className="h-40 w-32 rounded-xl object-cover object-top shadow-sm ring-2 ring-white"
            />
          ) : (
            <div className="flex h-40 w-32 items-center justify-center rounded-xl bg-cream-200 text-slate-400">
              <UserPlus className="h-10 w-10" />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-cream-100"
          >
            <Upload className="h-4 w-4" />
            {form.photoPreview ? 'Ganti foto' : 'Unggah foto wajah'}
          </button>
        </div>

        <div>
          <label htmlFor="driver-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nama Sopir <span className="text-rose-500">*</span>
          </label>
          <input
            id="driver-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Contoh: Ahmad Fauzi"
            className="w-full rounded-xl border border-cream-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20"
          />
        </div>

        <div>
          <label htmlFor="driver-plate" className="mb-1.5 block text-sm font-medium text-slate-700">
            Plat Kendaraan
          </label>
          <input
            id="driver-plate"
            type="text"
            value={form.vehiclePlate}
            onChange={(e) => setForm((f) => ({ ...f, vehiclePlate: e.target.value }))}
            placeholder="Contoh: B 1234 XYZ"
            className="w-full rounded-xl border border-cream-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20"
          />
        </div>

        {formError && (
          <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{formError}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-cream-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-brand/90 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Simpan Sopir
          </button>
        </div>
      </form>
    </Modal>
  );
}
