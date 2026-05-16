import { useEffect, useState } from 'react';
import { AreaTrendChart } from './AreaTrendChart.jsx';
import { LocalizedNumberInput } from './LocalizedNumberInput.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatTableNumber } from '../lib/formatters.js';

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
    <div className="rounded-[24px] border border-[#173d5d]/12 bg-[linear-gradient(135deg,#f7fbff_0%,#edf5fd_100%)] px-4 sm:px-5 py-3 sm:py-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)]">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">{kicker}</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold text-[#173d5d]">{title}</p>
        </div>
        <p className="text-xs sm:text-sm text-slate/60">{description}</p>
      </div>
    </div>
  );
}

function EditablePerpetuityRateCard({ value, onApply, isSaving = false }) {
  const [draftValue, setDraftValue] = useState(() => (value == null ? '' : String(value)));
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftValue(value == null ? '' : String(value));
  }, [value]);

  const numericDraftValue = Number(draftValue);
  const canApply = !isSaving && draftValue !== '' && Number.isFinite(numericDraftValue) && numericDraftValue >= 0 && numericDraftValue !== Number(value ?? 0);

  async function handleApply() {
    if (!canApply) {
      if (draftValue === '' || !Number.isFinite(numericDraftValue) || numericDraftValue < 0) {
        setError('Informe uma taxa de juros real valida.');
      }

      return;
    }

    setError('');

    try {
      await onApply?.(numericDraftValue);
    } catch (applyError) {
      setError(applyError?.message || 'Falha ao salvar a taxa de juros real.');
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-[18px] border border-[#173d5d]/10 bg-white px-4 py-3 shadow-[0_12px_24px_rgba(23,61,93,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-snug text-slate/60">Taxa de Juros real</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#355f9b]">Apenas no grafico</p>
      </div>
      <div className="mt-3 grid gap-3">
        <LocalizedNumberInput
          value={draftValue}
          onChange={(event) => {
            setDraftValue(event.target.value);

            if (error) {
              setError('');
            }
          }}
          step="0.01"
          fieldPath="future.perpetuityRate"
          clearOnFocus="always"
          formatWhileTyping={false}
          className="w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2 font-display text-xl leading-tight text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10 md:text-2xl xl:text-[1.55rem]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate/55">Essa alteracao afeta somente o grafico de patrimonio na perpetuidade.</p>
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="rounded-full border border-[#173d5d]/15 bg-[#f4f7fb] px-3 py-1.5 text-xs font-semibold text-[#173d5d] transition hover:border-[#173d5d]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Salvando grafico...' : 'Atualizar grafico'}
          </button>
        </div>
        {error ? <p className="text-xs font-medium text-[#c24d2c]">{error}</p> : null}
      </div>
    </div>
  );
}

export function FuturePanel({ future, onPersistPerpetuityRate, isPersistingPerpetuityRate = false }) {
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
          <div className="grid gap-4 min-w-0">
            <div className={frameClassName()}>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-[#173d5d]">Renda e taxa</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">Base mensal</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
                  <EditablePerpetuityRateCard
                    value={future.perpetuityRate}
                    onApply={onPersistPerpetuityRate}
                    isSaving={isPersistingPerpetuityRate}
                  />
                  <div className="grid gap-3 content-start">
                    {statCard('Renda passiva potencial (PL)', formatTableNumber(future.passivePortfolioIncome), 'success', true)}
                    {statCard('INSS + Outras receitas', formatTableNumber(future.externalMonthlyIncome), 'light')}
                    {statCard('Renda passiva potencial (PL + Outras receitas)', formatTableNumber(future.combinedMonthlyIncome), 'slate', true)}
                  </div>
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
                  {statCard('Objetivo Gasto Mensal', formatTableNumber(future.desiredMonthlyRetirementSpend), 'light', true)}
                  {statCard('Superavit / Deficit', formatTableNumber(future.surplusDeficit), future.surplusDeficit >= 0 ? 'success' : 'accent', true)}
                </div>
              </div>
            </div>
          </div>

          <div className={`${frameClassName()} min-w-0`}>
            <div className="p-3 md:p-4 h-full min-h-[300px]">
              <AreaTrendChart
                title="Patrimonio na Perpetuidade"
                className="min-h-full rounded-[22px]"
                data={chartRows}
                hideFloatingTooltip={true}
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
