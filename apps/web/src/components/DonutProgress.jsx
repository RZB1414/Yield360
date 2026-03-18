import { formatPercent } from '../lib/formatters.js';

export function DonutProgress({ value, label }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, 0), 100);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="grid place-items-center gap-4 rounded-[28px] border border-white/80 bg-white/74 p-6">
      <div className="relative grid h-40 w-40 place-items-center">
        <svg viewBox="0 0 140 140" className="h-40 w-40 -rotate-90">
          <circle cx="70" cy="70" r={radius} stroke="rgba(23,38,50,0.1)" strokeWidth="14" fill="none" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="url(#yield360-donut)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            fill="none"
          />
          <defs>
            <linearGradient id="yield360-donut" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c46a2f" />
              <stop offset="55%" stopColor="#d49a3a" />
              <stop offset="100%" stopColor="#0f6a66" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <span className="font-display text-4xl text-slate">{formatPercent(clampedValue)}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">Indicador</p>
        <p className="mt-2 text-sm text-slate/75">{label}</p>
      </div>
    </div>
  );
}