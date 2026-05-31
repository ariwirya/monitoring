import { useEffect, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCcw } from 'lucide-react';

export default function ImageLightbox({ src, alt = 'Bukti dokumentasi', isOpen, onClose }) {
  const [zoom, setZoom] = useState(1);

  const resetZoom = useCallback(() => setZoom(1), []);

  useEffect(() => {
    if (!isOpen) return;
    resetZoom();
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, resetZoom]);

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bukti-dokumentasi-${Date.now()}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement('a');
      link.href = src;
      link.download = `bukti-dokumentasi-${Date.now()}.jpg`;
      link.target = '_blank';
      link.click();
    }
  };

  if (!isOpen || !src) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900/95">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="truncate text-sm font-medium text-white">{alt}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Perkecil"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-white/70">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Perbesar"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Unduh gambar"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4"
        onClick={onClose}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          style={{ transform: `scale(${zoom})` }}
          className="max-h-full max-w-full cursor-zoom-in rounded-lg object-contain shadow-2xl transition-transform duration-200"
          draggable={false}
        />
      </div>
    </div>
  );
}
