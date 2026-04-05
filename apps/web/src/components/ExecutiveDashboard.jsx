import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ProtectionChecklist } from './ProtectionChecklist.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatPercent, formatTableNumber } from '../lib/formatters.js';
import { getPlanDocument } from '../lib/api.js';

function glassPanelClassName() {
  return 'rounded-[20px] border border-[#173d5d]/10 bg-white shadow-[0_18px_36px_rgba(23,61,93,0.08)]';
}

function introPanel() {
  return (
    <div className="rounded-[24px] border border-[#173d5d]/12 bg-[linear-gradient(135deg,#f7fbff_0%,#edf5fd_100%)] px-4 sm:px-5 py-3 sm:py-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)]">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">Painel executivo</p>
          <p className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-semibold text-[#173d5d]">Legado, protecao e disciplina de aportes</p>
        </div>
        <p className="text-xs sm:text-sm text-slate/60">Mesmas informacoes, com leitura consolidada e mais limpa</p>
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
                <span className="font-semibold text-[#173d5d]">{formatTableNumber(row.value)}</span>
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

function PolicyDetailsModal({ policy, onClose }) {
  const [opening, setOpening] = useState(false);

  if (!policy) return null;

  const policyCoverage = policy.coverage || policy.name || 'Nao informado';
  const policyCurrentValue = Number(policy.currentValue ?? policy.value ?? 0);
  const policyIdealValue = Number(policy.idealValue ?? 0);
  const policyCoverageYears = Number(policy.coverageYears ?? policy.years ?? 0);
  const policyMonthlyPremium = Number(policy.monthlyPremium ?? 0);

  async function handleOpenPdf() {
    if (!policy.documentId) return;

    setOpening(true);
    try {
      const data = await getPlanDocument(policy.documentId);
      const base64Content = data.contentBase64;
      const contentType = data.contentType || 'application/pdf';

      // Remove data:application/pdf;base64, if exists
      const pureBase64 = base64Content.includes('base64,')
        ? base64Content.split('base64,')[1]
        : base64Content;

      const byteCharacters = atob(pureBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Falha ao abrir o PDF:', error);
      alert('Não foi possível abrir o arquivo PDF.');
    } finally {
      setOpening(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[32px] border border-[#173d5d]/12 bg-white p-8 shadow-[0_24px_48px_rgba(23,61,93,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#173d5d]">Detalhes da Cobertura</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate/5 transition">
            <svg className="h-6 w-6 text-slate/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl bg-[#f8fbff] p-4 border border-[#173d5d]/5">
            <p className="text-[10px] uppercase tracking-widest text-slate/50 font-semibold mb-1">Cobertura</p>
            <p className="text-[#173d5d] font-medium">{policyCoverage}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#f8fbff] p-4 border border-[#173d5d]/5">
              <p className="text-[10px] uppercase tracking-widest text-slate/50 font-semibold mb-1">Valor Atual</p>
              <p className="text-[#173d5d] font-medium">{formatTableNumber(policyCurrentValue)}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] p-4 border border-[#173d5d]/5">
              <p className="text-[10px] uppercase tracking-widest text-slate/50 font-semibold mb-1">Valor Ideal</p>
              <p className="text-[#173d5d] font-medium">{formatTableNumber(policyIdealValue)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#f8fbff] p-4 border border-[#173d5d]/5">
              <p className="text-[10px] uppercase tracking-widest text-slate/50 font-semibold mb-1">Anos de Cobertura</p>
              <p className="text-[#173d5d] font-medium">{policyCoverageYears ? `${policyCoverageYears} anos` : 'Nao informado'}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fbff] p-4 border border-[#173d5d]/5">
              <p className="text-[10px] uppercase tracking-widest text-slate/50 font-semibold mb-1">Parcela Mensal</p>
              <p className="text-[#173d5d] font-medium">{formatTableNumber(policyMonthlyPremium)}</p>
            </div>
          </div>

          {policy.documentId && (
            <button
              type="button"
              onClick={handleOpenPdf}
              disabled={opening}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#173d5d] py-4 font-semibold text-white shadow-lg shadow-[#173d5d]/20 hover:bg-[#1e4b6f] transition disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {opening ? 'Abrindo...' : 'Visualizar Documento PDF'}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 text-sm font-semibold text-slate/40 hover:text-slate/60 transition"
        >
          Fechar
        </button>
      </div>
    </div>,
    document.body
  );
}

export function ExecutiveDashboard({ input, control, succession }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  if (!control) {
    return null;
  }

  const policies = input.protection?.policies || [];

  return (
    <SectionCard
      eyebrow="Aba 5"
      title="Controle executivo"
      description="Painel executivo com progresso dos aportes, cobertura de legado, protecao de renda, futuro e camadas de protecao no mesmo visual claro do restante da pagina."
    >
      <div className="rounded-[30px] border border-[#173d5d]/12 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)] lg:p-5">
        {introPanel()}

        <div className="mt-4 grid gap-3 xl:grid-cols-[0.33fr_0.33fr_0.33fr]">
          <div className="min-w-0">
            <ProtectionColumns
              protectionLayers={control.protectionLayers}
              needCount={control.needCount}
              coveredCount={control.coveredCount}
            />
          </div>

          <div className="grid gap-3 min-w-0">
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

          <div className="min-w-0 flex justify-center">
            <FutureGauge value={control.financialFreedomProgress} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.4fr_0.6fr]">
          <div className={`${glassPanelClassName()} p-4 min-w-0`}>
            <p className="mb-3 text-base font-semibold text-[#173d5d]">Aportes acordados</p>
            <div className="overflow-x-auto overflow-y-hidden rounded-[16px] border border-[#173d5d]/10 bg-[#fbfdff]">
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
                    <td className="px-3 py-2.5 text-right">{formatTableNumber(input.future.agreedMonthlyContribution)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10 bg-[#eef4fb] font-semibold text-[#173d5d]">
                    <td className="px-3 py-2.5">Acordado total</td>
                    <td className="px-3 py-2.5 text-right">{formatTableNumber(control.agreedContributionTarget)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10">
                    <td className="px-3 py-2.5">Total aportado</td>
                    <td className="px-3 py-2.5 text-right">{formatTableNumber(control.totalContributed)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10 bg-[#fbe8e5] text-[#8c2f1f]">
                    <td className="px-3 py-2.5">Quanto falta</td>
                    <td className="px-3 py-2.5 text-right">{formatTableNumber(control.remainingContributionGap)}</td>
                  </tr>
                  <tr className="border-t border-[#173d5d]/10 bg-[#f6f0c8] text-[#5f5400]">
                    <td className="px-3 py-2.5">Quanto superou</td>
                    <td className="px-3 py-2.5 text-right">{formatTableNumber(control.contributionOverage)}</td>
                  </tr>
                  {control.monthlyContributions.map((item) => (
                    <tr key={item.month} className="border-t border-[#173d5d]/10 odd:bg-white even:bg-[#f8fbff]">
                      <td className="px-3 py-2.5">{item.month}</td>
                      <td className="px-3 py-2.5 text-right">{formatTableNumber(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ProtectionChecklist checklist={control.protectionLayers} />
        </div>

        {policies.length > 0 && (
          <div className="mt-4">
            <div className={`${glassPanelClassName()} p-4 sm:p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#355f9b]">Proteção e Garantias</p>
                  <h3 className="text-lg font-semibold text-[#173d5d]">Coberturas e Apólices</h3>
                </div>
                <span className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-semibold text-[#355f9b]">
                  {policies.length} {policies.length === 1 ? 'cobertura' : 'coberturas'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {policies.map((policy) => (
                  <button
                    type="button"
                    key={policy.id}
                    onClick={() => setSelectedPolicy(policy)}
                    className="flex flex-col rounded-xl border border-[#173d5d]/8 bg-[#fbfdff] px-3 py-2 text-left shadow-sm transition hover:border-[#173d5d]/20 hover:shadow-md group"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="shrink-0 rounded bg-[#173d5d]/5 p-1 group-hover:bg-[#173d5d]/10 transition">
                          <svg className="h-3 w-3 text-[#173d5d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <p className="truncate text-sm font-semibold text-[#173d5d]">{policy.coverage || policy.name || 'Cobertura'}</p>
                      </div>
                      <p className="shrink-0 text-base font-bold text-[#173d5d]">{formatTableNumber(Number(policy.currentValue ?? policy.value ?? 0))}</p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between pl-[18px]">
                      <p className="text-[11px] text-slate/40 uppercase tracking-wider truncate">
                        {policy.documentName || (policy.coverageYears ? `${policy.coverageYears} anos` : 'Sem PDF')}
                      </p>
                    {policy.documentId && (
                      <svg className="h-2.5 w-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A1 1 0 0111.293 2.707l5 5a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedPolicy && (
          <PolicyDetailsModal
            policy={selectedPolicy}
            onClose={() => setSelectedPolicy(null)}
          />
        )}
      </div>
    </SectionCard>
  );
}
