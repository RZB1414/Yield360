import { ProtectionChecklist } from './ProtectionChecklist.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatCurrency, formatPercent } from '../lib/formatters.js';

function glassPanelClassName() {
  return 'rounded-[20px] border border-[#173d5d]/10 bg-white shadow-[0_18px_36px_rgba(23,61,93,0.08)]';
}

function introPanel() {
  return (
    <div className="rounded-[24px] border border-[#173d5d]/12 bg-[linear-gradient(135deg,#f7fbff_0%,#edf5fd_100%)] px-5 py-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">Painel executivo</p>
          <p className="mt-1 text-xl font-semibold text-[#173d5d]">Legado, protecao e disciplina de aportes</p>
        </div>
        <p className="text-sm text-slate/60">Mesmas informacoes, com leitura consolidada e mais limpa</p>
      </div>
    </div>
  );
}

function ProgressBar({ value }) {
  const clampedValue = Math.min(Math.max(Number(value ?? 0), 0), 100);

  return (
    <div className={`${glassPanelClassName()} p-4`}>
      <div className="mb-2 flex items-center justify-between gap-3 text-[#173d5d]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate/60">Progresso dos aportes</p>
        <p className="font-display text-2xl leading-none text-[#173d5d]">{formatPercent(value)}</p>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-[#e8eef5]">
        <div className="h-full bg-gradient-to-r from-[#5fae2b] to-[#9adf52]" style={{ width: `${clampedValue}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate/45">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function ComparisonBars({ title, rows }) {
  const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row.value ?? 0))), 1);

  return (
    <div className={`${glassPanelClassName()} p-4`}>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#173d5d]">{title}</p>
      <div className="grid gap-3">
        {rows.map((row) => {
          const width = `${(Math.abs(Number(row.value ?? 0)) / maxValue) * 100}%`;

          return (
            <div key={row.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs text-slate/65">
                <span className="leading-snug">{row.label}</span>
                <span className="font-semibold text-[#173d5d]">{formatCurrency(row.value)}</span>
              </div>
              <div className="h-3.5 overflow-hidden rounded-full bg-[#e8eef5]">
                <div className="h-full rounded-full" style={{ width, backgroundColor: row.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProtectionColumns({ protectionLayers = [], needCount, coveredCount }) {
  const totalProtectionLayers = protectionLayers.length;
  const cards = [
    {
      title: 'Necessidade',
      value: needCount,
      statusKey: 'needed',
      accentClass: 'from-[#9fdf7d] via-[#74cb35] to-[#56a91c]',
      chipClass: 'bg-[#eef8e8] text-[#44741d]',
      surfaceClass: 'bg-[linear-gradient(180deg,#fbfef8_0%,#f1f8ea_100%)]'
    },
    {
      title: 'Coberto',
      value: coveredCount,
      statusKey: 'covered',
      accentClass: 'from-[#7ee08d] via-[#37c85a] to-[#229a42]',
      chipClass: 'bg-[#e9f7ee] text-[#1f7a40]',
      surfaceClass: 'bg-[linear-gradient(180deg,#f9fefa_0%,#ecf9f0_100%)]'
    }
  ];

  return (
    <div className={`${glassPanelClassName()} flex h-full flex-col p-4`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#173d5d]">Niveis de protecao</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/45">Camadas</p>
      </div>
      <div className="grid flex-1 gap-3 xl:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`flex h-full min-h-[420px] flex-col rounded-[18px] border border-[#173d5d]/8 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${card.surfaceClass}`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate/55">{card.title}</p>
                <p className="mt-1 text-sm text-slate/60">Camadas reais do checklist</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${card.chipClass}`}>
                {card.value}/{totalProtectionLayers}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-2">
              {protectionLayers.map((layer) => {
                const active = Boolean(layer[card.statusKey]);

                return (
                  <div key={`${card.title}-${layer.key}`} className="grid gap-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate/52">{layer.label}</p>
                    <div className="h-5 overflow-hidden rounded-full border border-[#d8e2ec] bg-white/80 p-[2px]">
                      <div
                        className={`h-full rounded-full transition ${active ? `bg-[linear-gradient(90deg,var(--tw-gradient-stops))] ${card.accentClass}` : 'bg-[#dfe7ef]'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate/40">
              <span>0 ativas</span>
              <span>Total de {totalProtectionLayers} camadas</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FutureGauge({ value }) {
  const clampedValue = Math.min(Math.max(Number(value ?? 0), 0), 100);
  const gaugeDegrees = Math.max((clampedValue / 100) * 360, 0);
  const gaugeStyle = {
    background: `conic-gradient(#3b78af 0deg, #69a8dd ${gaugeDegrees}deg, #dce6f2 ${gaugeDegrees}deg 360deg)`
  };

  return (
    <div className={`${glassPanelClassName()} flex h-full flex-col p-4 text-[#173d5d]`}>
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">Projecao</p>
        <p className="mt-1 font-display text-3xl">FUTURO</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative h-60 w-60">
          <div className="absolute inset-0 rounded-full" style={gaugeStyle} />
          <div className="absolute inset-[18px] rounded-full bg-white shadow-[0_10px_24px_rgba(23,61,93,0.08)]" />
          <div className="absolute inset-[34px] rounded-full border border-[#dbe5ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f8fe_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <p className="font-display text-4xl text-[#173d5d]">{formatPercent(value)}</p>
          </div>
        </div>
        <p className="mt-5 text-center text-sm font-semibold uppercase tracking-[0.14em] text-slate/55">
          Liberdade Financeira
        </p>
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
      description="Painel executivo com progresso dos aportes, cobertura de legado, protecao de renda, futuro e camadas de protecao no mesmo visual claro do restante da pagina."
    >
      <div className="rounded-[30px] border border-[#173d5d]/12 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)] lg:p-5">
        {introPanel()}

        <div className="mt-4 grid gap-3 xl:grid-cols-[0.33fr_0.33fr_0.33fr]">
          <ProtectionColumns
            protectionLayers={control.protectionLayers}
            needCount={control.needCount}
            coveredCount={control.coveredCount}
          />

          <div className="grid gap-3">
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

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.4fr_0.6fr]">
          <div className={`${glassPanelClassName()} p-4`}>
            <p className="mb-3 text-base font-semibold text-[#173d5d]">Aportes acordados</p>
            <div className="overflow-hidden rounded-[16px] border border-[#173d5d]/10 bg-[#fbfdff]">
              <table className="min-w-full border-collapse text-xs text-slate md:text-sm">
                <thead className="bg-[#355f9b]">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Aportes</th>
                    <th className="px-3 py-2.5 text-right">Efetivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#173d5d]/10 bg-[#eef4fb] font-semibold text-[#173d5d]">
                    <td className="px-3 py-2.5">Acordado por mes</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(input.future.agreedMonthlyContribution)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10 bg-[#eef4fb] font-semibold text-[#173d5d]">
                    <td className="px-3 py-2.5">Acordado total</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(control.agreedContributionTarget)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10">
                    <td className="px-3 py-2.5">Total aportado</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(control.totalContributed)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10 bg-[#fbe8e5] text-[#8c2f1f]">
                    <td className="px-3 py-2.5">Quanto falta</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(control.remainingContributionGap)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10 bg-[#f6f0c8] text-[#5f5400]">
                    <td className="px-3 py-2.5">Quanto superou</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(control.contributionOverage)}</td>
                  </tr>
                  {control.monthlyContributions.map((item) => (
                    <tr key={item.month} className="border-t border-[#173d5d]/10 odd:bg-white even:bg-[#f8fbff]">
                      <td className="px-3 py-2.5">{item.month}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(item.amount)}</td>
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
