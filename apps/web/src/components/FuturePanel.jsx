import { AreaTrendChart } from './AreaTrendChart.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatPercent, formatTableNumber } from '../lib/formatters.js';

function statCard(label, value, tone = 'light', large = false) {
  const tones = {
    light: 'border-[#173d5d]/10 bg-white',
    slate: 'border-[#173d5d]/12 bg-[#f5f8fc]',
    success: 'border-[#6cae45]/20 bg-[#edf7e7]',
    accent: 'border-[#355f9b]/18 bg-[#eaf1fb]',
    dark: 'border-[#173d5d]/16 bg-[#173d5d] text-white'
  };

  return (
    <div className={`min-w-0 overflow-hidden rounded-[18px] border px-4 py-3 shadow-[0_12px_24px_rgba(23,61,93,0.06)] ${tones[tone] ?? tones.light}`}>
      <p className={`text-xs leading-snug ${tone === 'dark' ? 'text-white/70' : 'text-slate/60'}`}>{label}</p>
      <p className={`mt-2 break-words font-display leading-tight ${tone === 'dark' ? 'text-white' : 'text-[#173d5d]'} ${large ? 'text-xl md:text-2xl xl:text-[1.55rem]' : 'text-lg md:text-xl xl:text-[1.25rem]'}`}>{value}</p>
    </div>
  );
}

function frameClassName() {
  return 'rounded-[24px] border border-[#173d5d]/10 bg-white/88 shadow-[0_18px_34px_rgba(23,61,93,0.08)]';
}

function introPanel(kicker, title, description) {
  return (
    <div className="rounded-[24px] border border-[#173d5d]/12 bg-[linear-gradient(135deg,#f7fbff_0%,#edf5fd_100%)] px-5 py-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">{kicker}</p>
          <p className="mt-1 text-xl font-semibold text-[#173d5d]">{title}</p>
        </div>
        <p className="text-sm text-slate/60">{description}</p>
      </div>
    </div>
  );
}

export function FuturePanel({ future }) {
  if (!future) {
    return null;
  }

  const chartRows = (future.perpetuityProjection ?? []).map((row) => ({
    age: row.age,
    balance: row.endingBalance
  }));

  return (
    <SectionCard
      eyebrow="Aba 3"
      title="Fase de usufruto"
      description="Painel espelhado na planilha de futuro, com taxa real de juros, renda passiva potencial, receitas complementares e saldo patrimonial em perpetuidade."
    >
      <div className="grid gap-4 rounded-[30px] border border-[#173d5d]/12 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-4 lg:p-5">
        {introPanel('Aposentadoria e usufruto', 'Fase de usufruto', 'Leitura consolidada da renda passiva, receitas extras e gasto alvo')}

        <div className="grid gap-4 xl:grid-cols-[0.42fr_0.58fr]">
          <div className="grid gap-4">
            <div className={frameClassName()}>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-[#173d5d]">Renda e taxa</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">Base mensal</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  {statCard('Taxa de Juros real', formatPercent(future.perpetuityRate), 'success')}
                  {statCard('Renda passiva potencial (PL)', formatTableNumber(future.passivePortfolioIncome), 'success', true)}
                  {statCard('INSS + Outras receitas', formatTableNumber(future.externalMonthlyIncome), 'dark')}
                  {statCard('Renda passiva potencial (PL + INSS)', formatTableNumber(future.combinedMonthlyIncome), 'slate', true)}
                </div>
              </div>
            </div>

            <div className={frameClassName()}>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-[#173d5d]">Consumo e saldo</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">Comparativo</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  {statCard('Objetivo Gasto Mensal', formatTableNumber(future.desiredMonthlyRetirementSpend), 'dark', true)}
                  {statCard('Superavit / Deficit', formatTableNumber(future.surplusDeficit), future.surplusDeficit >= 0 ? 'success' : 'accent', true)}
                </div>
              </div>
            </div>
          </div>

          <div className={frameClassName()}>
            <div className="p-3 md:p-4">
              <AreaTrendChart
                title="Patrimonio na Perpetuidade"
                className="min-h-full rounded-[22px]"
                data={chartRows}
                valueFormatter={(value) =>
                  formatTableNumber(Math.abs(value))
                }
                series={[
                  {
                    key: 'balance',
                    label: 'Patrimonio projetado',
                    stroke: '#58ad1b',
                    fill: '#58ad1b',
                    fillOpacity: 0.82
                  }
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
