import { ProtectionChecklist } from './ProtectionChecklist.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatCurrency, formatPercent } from '../lib/formatters.js';

function ProgressBar({ value }) {
  const clampedValue = Math.min(Math.max(Number(value ?? 0), 0), 100);

  return (
    <div className="rounded-[22px] border border-white/12 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-4 text-white">
        <p className="font-semibold uppercase tracking-[0.18em] text-white/70">Progresso dos aportes</p>
        <p className="font-display text-3xl">{formatPercent(value)}</p>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gradient-to-r from-[#5fae2b] to-[#9adf52]" style={{ width: `${clampedValue}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-xs text-white/48">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function ComparisonBars({ title, rows }) {
  const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row.value ?? 0))), 1);

  return (
    <div className="rounded-[22px] border border-white/12 bg-white/5 p-4">
      <p className="mb-4 text-center text-xl font-semibold uppercase tracking-[0.08em] text-white">{title}</p>
      <div className="grid gap-4">
        {rows.map((row) => {
          const width = `${(Math.abs(Number(row.value ?? 0)) / maxValue) * 100}%`;

          return (
            <div key={row.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-4 text-sm text-white/74">
                <span>{row.label}</span>
                <span className="font-semibold text-white">{formatCurrency(row.value)}</span>
              </div>
              <div className="h-5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width, backgroundColor: row.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProtectionColumns({ needCount, coveredCount }) {
  return (
    <div className="rounded-[22px] border border-white/12 bg-white/5 p-4">
      <p className="mb-6 text-center text-xl font-semibold uppercase tracking-[0.08em] text-white">Niveis de protecao</p>
      <div className="grid grid-cols-[0.8fr_0.2fr] gap-5">
        <div className="flex items-end justify-center gap-12 rounded-[18px] border border-white/8 px-6 py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-56 w-20 items-end overflow-hidden rounded-t-2xl bg-white/8">
              <div className="w-full bg-gradient-to-t from-[#9cd58a] to-[#5aaa1d]" style={{ height: `${Math.max((needCount / 7) * 100, 8)}%` }} />
            </div>
            <span className="text-sm font-semibold text-white">Necessidade</span>
            <span className="text-sm text-white/70">{needCount}</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-56 w-20 items-end overflow-hidden rounded-t-2xl bg-white/8">
              <div className="w-full bg-gradient-to-t from-[#2dc04e] to-[#6ad02c]" style={{ height: `${Math.max((coveredCount / 7) * 100, 8)}%` }} />
            </div>
            <span className="text-sm font-semibold text-white">Coberto</span>
            <span className="text-sm text-white/70">{coveredCount}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-5 text-sm font-semibold text-white/72">
          <span>4</span>
          <span>3</span>
          <span>2</span>
          <span>1</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}

function FutureGauge({ value }) {
  const clampedValue = Math.min(Math.max(Number(value ?? 0), 0), 100);

  return (
    <div className="rounded-[22px] border border-white/12 bg-white/5 p-4 text-white">
      <p className="text-center font-display text-5xl">FUTURO</p>
      <div className="mt-8 grid gap-4">
        {Array.from({ length: 11 }, (_, index) => 100 - index * 10).map((tick) => (
          <div key={tick} className="flex items-center gap-3 text-white/70">
            <span className="w-10 text-right text-2xl font-semibold">{tick}%</span>
            <div className="h-px flex-1 bg-white/18" />
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-end justify-center">
        <div className="flex h-56 w-24 items-end overflow-hidden rounded-t-3xl bg-white/8">
          <div className="w-full bg-[#2b6e9e] text-center text-lg font-bold text-[#f6df1b]" style={{ height: `${clampedValue}%` }}>
            <span className="relative top-2">{formatPercent(value)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExecutiveDashboard({ input, control, succession }) {
  if (!control) {
    return null;
  }

  return (
    <SectionCard
      eyebrow="Aba 5"
      title="Controle executivo"
      description="Painel escuro inspirado no dashboard da planilha com progresso dos aportes, cobertura de legado, protecao de renda, futuro e camadas de protecao."
    >
      <div className="rounded-[32px] bg-[#3d3d3d] p-6 text-white shadow-panel">
        <div className="grid gap-4 xl:grid-cols-[0.33fr_0.47fr_0.2fr]">
          <ProtectionColumns needCount={control.needCount} coveredCount={control.coveredCount} />

          <div className="grid gap-4">
            <ProgressBar value={control.contributedProgress} />
            <ComparisonBars
              title="Indicadores de legado e protecao"
              rows={[
                { label: 'Patrimonio Exposto a Inventario', value: control.exposedPatrimony, color: '#4c76b8' },
                { label: 'Custo estimado com inventario', value: succession?.inventoryCost ?? 0, color: '#5c5c5c' },
                { label: 'Cobertura atual para legado', value: control.legacyCoverageCurrent, color: '#3dc259' }
              ]}
            />
            <ComparisonBars
              title="Indicadores de protecao de renda"
              rows={[
                { label: 'Protecao Invalidez Ideal (0,5% a.m.)', value: control.disabilityProtectionIdeal, color: '#4c76b8' },
                { label: 'Protecao Invalidez Atual', value: control.disabilityProtectionCurrent, color: '#888888' },
                { label: 'Cobertura adicional', value: control.disabilityProtectionGap, color: '#3dc259' }
              ]}
            />
          </div>

          <FutureGauge value={control.financialFreedomProgress} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
          <div className="rounded-[22px] border border-white/12 bg-white/5 p-4">
            <p className="mb-4 text-xl font-semibold text-white">Aportes acordados</p>
            <div className="overflow-hidden rounded-[18px] border border-white/10">
              <table className="min-w-full border-collapse text-sm text-white">
                <thead className="bg-[#355f9b]">
                  <tr>
                    <th className="px-4 py-3 text-left">Aportes</th>
                    <th className="px-4 py-3 text-right">Efetivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-white/10 bg-[#1f3252] font-semibold text-white">
                    <td className="px-4 py-3">Acordado por mes</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(input.future.agreedMonthlyContribution)}</td>
                  </tr>
                  <tr className="border-t border-white/10 bg-[#1f3252] font-semibold text-white">
                    <td className="px-4 py-3">Acordado total</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(control.agreedContributionTarget)}</td>
                  </tr>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3">Total aportado</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(control.totalContributed)}</td>
                  </tr>
                  <tr className="border-t border-white/10 bg-[#9a0000] text-[#fff06d]">
                    <td className="px-4 py-3">Quanto falta</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(control.remainingContributionGap)}</td>
                  </tr>
                  <tr className="border-t border-white/10 bg-[#ece300] text-[#111]">
                    <td className="px-4 py-3">Quanto superou</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(control.contributionOverage)}</td>
                  </tr>
                  {control.monthlyContributions.map((item) => (
                    <tr key={item.month} className="border-t border-white/10">
                      <td className="px-4 py-3">{item.month}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ProtectionChecklist checklist={control.protectionLayers} />
        </div>
      </div>
    </SectionCard>
  );
}
