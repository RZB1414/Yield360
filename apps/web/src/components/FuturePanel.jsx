import { AreaTrendChart } from './AreaTrendChart.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatCurrency, formatPercent } from '../lib/formatters.js';

function statCard(label, value, backgroundClass, dark = false) {
  return (
    <div className={`${backgroundClass} rounded-[22px] border-l-4 border-[#142d67] px-4 py-4`}>
      <p className={`text-sm ${dark ? 'text-white/76' : 'text-[#17255c]'}`}>{label}</p>
      <p className={`mt-3 font-display text-4xl ${dark ? 'text-white' : 'text-[#0d145a]'}`}>{value}</p>
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
      <div className="rounded-[30px] border border-[#1f4b89] bg-white p-6">
        <p className="mb-5 text-2xl font-semibold text-[#17255c]">Fase de Usufruto</p>
        <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
          <div className="grid gap-4">
            {statCard('Taxa de Juros real', formatPercent(future.perpetuityRate), 'bg-[#c9ecb5]')}
            {statCard('RENDA PASSIVA POTENCIAL (PL)', formatCurrency(future.passivePortfolioIncome), 'bg-[#c9ecb5]')}
            {statCard('INSS + Outras receitas', formatCurrency(future.externalMonthlyIncome), 'bg-[#355f9b] text-white', true)}
            {statCard('RENDA PASSIVA POTENCIAL (PL + INSS)', formatCurrency(future.combinedMonthlyIncome), 'bg-[#dedede]')}
            {statCard('Objetivo Gasto Mensal', formatCurrency(future.desiredMonthlyRetirementSpend), 'bg-[#355f9b] text-white', true)}
            {statCard('Superavit / Deficit', formatCurrency(future.surplusDeficit), future.surplusDeficit >= 0 ? 'bg-[#d8f0c0]' : 'bg-[#f7ccd2]')}
          </div>

          <AreaTrendChart
            title="Patrimonio na Perpetuidade"
            className="min-h-full"
            data={chartRows}
            valueFormatter={(value) =>
              new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.abs(value))
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
    </SectionCard>
  );
}
