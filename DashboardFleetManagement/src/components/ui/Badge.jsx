const VARIANTS = {
  microsleep: 'bg-amber-100 text-amber-800 border-amber-200',
  smoking: 'bg-rose-100 text-rose-800 border-rose-200',
  solar_clarity: 'bg-teal-100 text-teal-800 border-teal-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.default} ${className}`}
    >
      {children}
    </span>
  );
}
