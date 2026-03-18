import { AreaTrendChart } from './AreaTrendChart.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatCurrency, formatPercent, formatPlainNumber } from '../lib/formatters.js';

function tileClassName(backgroundClass = 'bg-white') {
  return `${backgroundClass} rounded-[22px] border-l-4 border-[#142d67] px-4 py-3`;
}

function dateOnly(value) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function ResultsShowcase({ input, results }) {
  if (!results) {
    return null;
  }

  const chartRows = (results.accumulationProjection ?? []).map((row) => ({
    age: row.age,
    investedTotal: row.investedTotal,
    interestValue: row.interestValue
  }));

  return (
    <SectionCard
      eyebrow="Aba 2"
      title="Planejamento inicial"
      description="Replica a aba de resultados da planilha com a fase de acumulo, os indicadores de retorno e a projecao patrimonial ate a idade objetivo."
    >
      <div className="grid gap-6 rounded-[30px] border border-[#1f4b89] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-6 bg-[#355f9b] px-6 py-5 text-white rounded-[26px]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/72">Portfel</p>
            <h3 className="mt-2 font-display text-5xl">Planejamento inicial</h3>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-white/78">Data atual</p>
            <p className="mt-2 text-3xl font-semibold">{dateOnly(results.currentDate)}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-semibold text-[#17255c]">Nome:</p>
              <p className="mt-2 border-b-4 border-[#17255c] pb-1 font-display text-4xl text-[#17255c]">{input.client.name}</p>
            </div>
            <div className="rounded-[24px] border border-[#1f4b89] p-5">
              <p className="mb-5 text-xl font-semibold text-[#17255c]">Fase de acumulo</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className={tileClassName('bg-[#efeff2]')}>
                  <p className="text-sm text-[#17255c]">Qual seu perfil de risco?</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{input.client.investorProfile}</p>
                </div>
                <div className={tileClassName()}>
                  <p className="text-sm text-[#17255c]">Taxa nominal (a.a.)</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatPercent(results.nominalAnnualRate)}</p>
                </div>
                <div className={tileClassName('bg-[#eeab80]')}>
                  <p className="text-sm text-[#17255c]">Valor nominal final</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatCurrency(results.futureNominalValue)}</p>
                </div>
                <div className={tileClassName('bg-[#355f9b] text-white')}>
                  <p className="text-sm text-white/76">Patrimonio atual</p>
                  <p className="mt-3 font-display text-3xl">{formatCurrency(results.currentInvestableAssets)}</p>
                </div>
                <div className={tileClassName('bg-[#b9e69b]')}>
                  <p className="text-sm text-[#17255c]">Taxa real (a.a.)</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatPercent(results.realAnnualRate)}</p>
                </div>
                <div className={tileClassName('bg-[#b9e69b]')}>
                  <p className="text-sm text-[#17255c]">Valor real final</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatCurrency(results.futureRealValue)}</p>
                </div>
                <div className={tileClassName()}>
                  <p className="text-sm text-[#17255c]">Retorno total nominal</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatCurrency(results.nominalReturn)}</p>
                </div>
                <div className={tileClassName()}>
                  <p className="text-sm text-[#17255c]">Retorno total real</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatCurrency(results.realReturn)}</p>
                </div>
                <div className={tileClassName('bg-[#355f9b] text-white')}>
                  <p className="text-sm text-white/76">Idade atual</p>
                  <p className="mt-3 font-display text-3xl">{formatPlainNumber(results.currentAge)}</p>
                </div>
                <div className={tileClassName('bg-[#355f9b] text-white')}>
                  <p className="text-sm text-white/76">Idade objetivo</p>
                  <p className="mt-3 font-display text-3xl">{formatPlainNumber(results.targetAge)}</p>
                </div>
                <div className={tileClassName()}>
                  <p className="text-sm text-[#17255c]">Tempo de contribuicao</p>
                  <p className="mt-3 font-display text-3xl text-[#17255c]">{formatPlainNumber(results.contributionYears)} anos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={tileClassName('bg-[#b9e69b]')}>
              <p className="text-sm text-[#17255c]">Aportes mensais acordados</p>
              <p className="mt-3 font-display text-4xl text-[#17255c]">{formatCurrency(input.future.agreedMonthlyContribution)}</p>
            </div>
            <div className={tileClassName('bg-[#eeab80]')}>
              <p className="text-sm text-[#17255c]">Inflacao (IPCA) medio 20 anos</p>
              <p className="mt-3 font-display text-4xl text-[#17255c]">{formatPercent(results.inflationAnnualRate)}</p>
            </div>
            <div className={tileClassName('bg-[#d8f0c0]')}>
              <p className="text-sm text-[#17255c]">Valor total investido</p>
              <p className="mt-3 font-display text-4xl text-[#17255c]">{formatCurrency(results.totalInvested)}</p>
            </div>
          </div>
        </div>

        <AreaTrendChart
          title="Projecao de acumulo"
          data={chartRows}
          valueFormatter={(value) =>
            new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Math.max(value, 0))
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
    </SectionCard>
  );
}
