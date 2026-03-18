export function ProgressThermometer({ value }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const clampedValue = Math.min(Math.max(safeValue, 0), 100);

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/72 p-5">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate/55">
            Barra de progresso dos aportes acordados
          </p>
          <h3 className="mt-2 font-display text-3xl text-slate">{safeValue.toFixed(1)}%</h3>
        </div>
        <p className="max-w-xs text-right text-sm text-slate/70">
          Percentual do total aportado face ao compromisso financeiro definido para o plano.
        </p>
      </div>
      <div className="relative h-4 overflow-hidden rounded-full bg-fog">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-clay via-amber to-deep transition-all duration-700"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}