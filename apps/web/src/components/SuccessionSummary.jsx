import { formatTableNumber } from '../lib/formatters.js';

export function SuccessionSummary({ data }) {
  const needsCoverage = (data?.additionalNeed || 0) > 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="rounded-[20px] sm:rounded-[24px] border border-white/80 bg-white/72 p-4 sm:p-5">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-slate/55">Espolio bruto</p>
        <h3 className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl text-slate">{formatTableNumber(data?.grossEstate)}</h3>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate/70">Bens particulares mais metade dos bens comuns.</p>
      </article>
      <article className="rounded-[20px] sm:rounded-[24px] border border-white/80 bg-white/72 p-4 sm:p-5">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-slate/55">Custo do inventario</p>
        <h3 className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl text-slate">{formatTableNumber(data?.inventoryCost)}</h3>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate/70">Estimativa simplificada de 20% sobre o espolio liquido positivo.</p>
      </article>
      <article className="rounded-[20px] sm:rounded-[24px] border border-white/80 bg-white/72 p-4 sm:p-5">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-slate/55">Necessidade adicional</p>
        <h3 className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl text-slate">{formatTableNumber(data?.additionalNeed)}</h3>
        <p className="mt-2 text-sm text-slate/70">
          {needsCoverage
            ? 'Existe um gap entre o custo estimado e os recursos fora do inventario.'
            : 'Os recursos extra-inventario ja cobrem o custo estimado do inventario.'}
        </p>
      </article>
    </div>
  );
}