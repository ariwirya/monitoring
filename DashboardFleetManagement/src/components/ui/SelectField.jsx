import { ChevronDown } from 'lucide-react';

export default function SelectField({ value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-cream-200 bg-cream-50 py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-brand focus:ring-2 focus:ring-slate-brand/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
