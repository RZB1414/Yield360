import { useState } from 'react';
import { AreaTrendChart } from './AreaTrendChart.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatDateOnly, formatPercent, formatPlainNumber, formatTableNumber } from '../lib/formatters.js';

function panelClassName(backgroundClass = 'bg-white/88') {
  return `${backgroundClass} min-w-0 overflow-hidden rounded-[24px] border border-[#173d5d]/10 shadow-[0_18px_34px_rgba(23,61,93,0.08)]`;
}

function introPanel({ kicker, title, description }) {
  return (
    <div className="rounded-[24px] border border-[#173d5d]/12 bg-[linear-gradient(135deg,#f7fbff_0%,#edf5fd_100%)] px-4 sm:px-5 py-3 sm:py-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)]">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">{kicker}</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold text-[#173d5d]">{title}</p>
        </div>
        {description ? <p className="text-xs sm:text-sm text-slate/60">{description}</p> : null}
      </div>
    </div>
  );
}

function metricCardClassName(tone = 'light') {
  const tones = {
    light: 'border-[#173d5d]/10 bg-white',
    slate: 'border-[#173d5d]/12 bg-[#f4f8fc]',
    accent: 'border-[#355f9b]/20 bg-[#e9f1fb]',
    success: 'border-[#6cae45]/20 bg-[#edf7e7]',
    warm: 'border-[#e0a06d]/24 bg-[#fbefe5]',
    dark: 'border-[#173d5d]/16 bg-[#173d5d]'
  };

  return `min-w-0 rounded-[18px] border px-4 py-3 shadow-[0_10px_24px_rgba(23,61,93,0.06)] ${tones[tone] ?? tones.light}`;
}

function valueClassName(size = 'md', tone = 'dark') {
  const toneClass = tone === 'light' ? 'text-white' : 'text-[#173d5d]';
  const sizeClass =
    size === 'sm'
      ? 'text-base md:text-lg'
      : size === 'lg'
        ? 'text-xl md:text-2xl xl:text-[1.55rem]'
        : 'text-lg md:text-xl xl:text-[1.25rem]';

  return `mt-2 break-words font-display leading-tight ${toneClass} ${sizeClass}`;
}

export function ResultsShowcase({ input, results, onFieldChange, readOnly = false }) {
  const [isEditingInflation, setIsEditingInflation] = useState(false);
  const [tempInflation, setTempInflation] = useState(input?.future?.inflationRate ?? 6);

  if (!results) {
    return null;
  }

  const chartRows = (results.accumulationProjection ?? []).map((row) => ({
    age: row.age,
    investedTotal: row.investedTotal,
    interestValue: row.interestValue
  }));

  const handleInflationSubmit = () => {
    setIsEditingInflation(false);
    if (onFieldChange) {
      onFieldChange('future.inflationRate', tempInflation, 'number');
    }
  };

  return (
    <SectionCard
      eyebrow="Aba 2"
      title="Planejamento inicial"
      description="Replica a aba de resultados da planilha com a fase de acumulo, os indicadores de retorno e a projecao patrimonial ate a idade objetivo."
    >
      <div className="grid gap-4 sm:gap-5 rounded-[24px] sm:rounded-[30px] border border-[#173d5d]/12 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-3 sm:p-4 lg:p-5">
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-[26px] border border-[#355f9b]/18 bg-[linear-gradient(135deg,#173d5d_0%,#2b5d8e_58%,#4d82b6_100%)] px-4 sm:px-5 py-4 sm:py-5 text-white shadow-[0_20px_40px_rgba(23,61,93,0.22)]">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-8 h-20 w-20 rounded-full bg-[#f0c36b]/18 blur-2xl" aria-hidden="true" />
          <div className="min-w-0 relative z-10">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] text-white/72">Portfel</p>
            <h3 className="mt-1 sm:mt-1.5 font-display text-[1.75rem] sm:text-3xl leading-none md:text-4xl text-balance">Planejamento inicial</h3>
          </div>
          <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end relative z-10">
            <div className="min-w-0 rounded-[16px] sm:rounded-[18px] border border-white/14 bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-white/68">Cliente</p>
              <p className="mt-1 break-words font-display text-xl sm:text-2xl leading-tight text-white md:text-3xl">{input.client.name}</p>
            </div>
            <div className="rounded-[16px] sm:rounded-[18px] border border-white/14 bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 sm:text-right backdrop-blur-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">Data atual</p>
              <p className="mt-1 text-lg sm:text-xl font-semibold md:text-2xl">{formatDateOnly(results.currentDate)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <div className={panelClassName()}>
            <div className="p-4 md:p-5">
              {introPanel({
                kicker: 'Acumulacao',
                title: 'Contexto e ritmo de acumulo',
                description: 'Perfil, patrimonio, horizonte e aportes'
              })}
              <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <div className={metricCardClassName('slate')}>
                  <p className="text-xs leading-snug text-slate/60">Perfil de risco</p>
                  <p className={valueClassName('md')}>{input.client.investorProfile}</p>
                </div>
                <div className={metricCardClassName('accent')}>
                  <p className="text-xs leading-snug text-slate/60">Patrimonio atual</p>
                  <p className={valueClassName('md')}>{formatTableNumber(results.currentInvestableAssets)}</p>
                </div>
                <div className={metricCardClassName('success')}>
                  <p className="text-xs leading-snug text-slate/60">Aportes mensais</p>
                  <p className={valueClassName('md')}>{formatTableNumber(input.future.agreedMonthlyContribution)}</p>
                </div>
                <div className={metricCardClassName('light')}>
                  <p className="text-xs leading-snug text-slate/60">Valor total investido</p>
                  <p className={valueClassName('md')}>{formatTableNumber(results.totalInvested)}</p>
                </div>
                <div className={metricCardClassName('dark')}>
                  <p className="text-xs leading-snug text-white/70">Idade atual</p>
                  <p className={valueClassName('sm', 'light')}>{formatPlainNumber(results.currentAge)}</p>
                </div>
                <div className={metricCardClassName('dark')}>
                  <p className="text-xs leading-snug text-white/70">Idade objetivo</p>
                  <p className={valueClassName('sm', 'light')}>{formatPlainNumber(results.targetAge)}</p>
                </div>
                <div className={metricCardClassName('light')}>
                  <p className="text-xs leading-snug text-slate/60">Tempo de contribuicao</p>
                  <p className={valueClassName('sm')}>{formatPlainNumber(results.contributionYears)} anos</p>
                </div>
                <div
                  className={`${metricCardClassName('warm')} ${!readOnly ? 'cursor-pointer transition hover:border-[#e0a06d]/40' : ''}`}
                  onClick={() => {
                    if (!readOnly && !isEditingInflation) {
                      setTempInflation(input?.future?.inflationRate ?? 6);
                      setIsEditingInflation(true);
                    }
                  }}
                >
                  <p className="text-xs leading-snug text-slate/60">Inflacao media</p>
                  {isEditingInflation ? (
                    <input
                      autoFocus
                      type="number"
                      step="0.1"
                      value={tempInflation}
                      onChange={(e) => setTempInflation(e.target.value)}
                      onBlur={handleInflationSubmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInflationSubmit();
                        if (e.key === 'Escape') setIsEditingInflation(false);
                      }}
                      className="mt-2 w-full bg-transparent font-display text-lg leading-tight text-[#173d5d] focus:outline-none"
                    />
                  ) : (
                    <p className={valueClassName('sm')}>{formatPercent(results.inflationAnnualRate)}</p>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className={panelClassName('bg-[#f8fbff]')}>
            <div className="p-4 md:p-5">
              {introPanel({
                kicker: 'Resultados',
                title: 'Taxas e resultados projetados',
                description: 'Nominal, real e retornos acumulados'
              })}
              <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <div className={metricCardClassName('light')}>
                  <p className="text-xs leading-snug text-slate/60">Taxa nominal (a.a.)</p>
                  <p className={valueClassName('sm')}>{formatPercent(results.nominalAnnualRate)}</p>
                </div>
                <div className={metricCardClassName('success')}>
                  <p className="text-xs leading-snug text-slate/60">Taxa real (a.a.)</p>
                  <p className={valueClassName('sm')}>{formatPercent(results.realAnnualRate)}</p>
                </div>
                <div className={metricCardClassName('warm')}>
                  <p className="text-xs leading-snug text-slate/60">Valor nominal final</p>
                  <p className={valueClassName('lg')}>{formatTableNumber(results.futureNominalValue)}</p>
                </div>
                <div className={metricCardClassName('success')}>
                  <p className="text-xs leading-snug text-slate/60">Valor real final</p>
                  <p className={valueClassName('lg')}>{formatTableNumber(results.futureRealValue)}</p>
                </div>
                <div className={metricCardClassName('accent')}>
                  <p className="text-xs leading-snug text-slate/60">Retorno nominal</p>
                  <p className={valueClassName('md')}>{formatTableNumber(results.nominalReturn)}</p>
                </div>
                <div className={metricCardClassName('slate')}>
                  <p className="text-xs leading-snug text-slate/60">Retorno real</p>
                  <p className={valueClassName('md')}>{formatTableNumber(results.realReturn)}</p>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <div className={panelClassName('bg-white')}>
          <div className="p-3 md:p-4">
            <AreaTrendChart
              title="Projecao de acumulo"
              data={chartRows}
              valueFormatter={(value) =>
                formatTableNumber(Math.max(value, 0))
              }
              series={[
                {
                  key: 'investedTotal',
                  label: 'Total Investido',
                  stroke: '#4f9a20',
                  fill: '#4f9a20',
                  fillOpacity: 0.72
                },
                {
                  key: 'interestValue',
                  label: 'Total Juros',
                  stroke: '#9bc47f',
                  fill: '#9bc47f',
                  fillOpacity: 0.64
                }
              ]}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
