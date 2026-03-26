import { formatPercent, formatTableNumber } from '../lib/formatters.js';

export function MetricCard({ label, value, accent = 'bg-slate', helper, tone = 'currency' }) {
  const formattedValue =
    tone === 'percent'
      ? formatPercent(value)
      : tone === 'number'
        ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number(value ?? 0))
        : formatTableNumber(value);

  return (
    <article className="glass-panel rounded-[26px] border border-white/80 bg-white/78 p-5 shadow-panel">
      <div className={`mb-4 h-2 w-16 rounded-full ${accent}`} />
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate/55">{label}</p>
      <p className="mt-3 font-display text-4xl text-slate">{formattedValue}</p>
      {helper ? <p className="mt-2 text-sm text-slate/70">{helper}</p> : null}
    </article>
  );
}