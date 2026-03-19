import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard.jsx';
import { FuturePanel } from '../components/FuturePanel.jsx';
import { ResultsShowcase } from '../components/ResultsShowcase.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Vision360Form } from '../components/Vision360Form.jsx';
import { deletePlan, getPlan, getPlans, updatePlan } from '../lib/api.js';
import { getLastContactStatus, sortPlansByLastContact } from '../lib/last-contact.js';
import { createEmptyPlannerInput, hydratePlannerInput } from '../lib/planner-state.js';
import { formatCurrency, formatDate } from '../lib/formatters.js';

const contactFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'red', label: 'Vermelho' },
  { id: 'yellow', label: 'Amarelo' },
  { id: 'green', label: 'Verde' },
  { id: 'missing', label: 'Sem contato' }
];

function LastContactBadge({ lastContactAt }) {
  const status = getLastContactStatus(lastContactAt);

  return (
    <div className="grid gap-1 text-sm text-slate/72">
      <div className="flex items-center gap-3">
        <span className={`h-3.5 w-3.5 rounded-full ${status.colorClass}`} aria-hidden="true" />
        <p className="font-semibold text-slate">{status.label}</p>
      </div>
      <p>{status.formattedDate}</p>
      <p>{status.daysLabel}</p>
    </div>
  );
}

function CompactLastContactStatus({ lastContactAt }) {
  const status = getLastContactStatus(lastContactAt);

  return (
    <div className="flex items-center gap-3 text-sm text-slate/72">
      <span className={`h-3.5 w-3.5 rounded-full ${status.colorClass}`} aria-hidden="true" />
      <p className="font-semibold text-slate">{status.daysLabel}</p>
    </div>
  );
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlanIdFromUrl = searchParams.get('planId') ?? '';
  const [input, setInput] = useState(() => createEmptyPlannerInput());
  const [report, setReport] = useState(null);
  const [recentPlans, setRecentPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingLastContact, setUpdatingLastContact] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError('');

      try {
        const plans = await getPlans();

        if (cancelled) {
          return;
        }

        setRecentPlans(sortPlansByLastContact(plans ?? []));

        if (!selectedPlanIdFromUrl) {
          setActivePlanId('');
          setInput(createEmptyPlannerInput());
          setReport(null);
          return;
        }

        const data = await getPlan(selectedPlanIdFromUrl);

        if (cancelled) {
          return;
        }

        setActivePlanId(data.planId);
        setInput(hydratePlannerInput(data.input));
        setReport(data.report);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [selectedPlanIdFromUrl]);

  function handleSelectPlan(planId) {
    setSearchParams({ planId });
  }

  function handleClosePlan() {
    setSearchParams({});
    setActivePlanId('');
    setInput(createEmptyPlannerInput());
    setReport(null);
    setError('');
  }

  async function handleUpdateLastContact() {
    if (!activePlanId) {
      return;
    }

    setUpdatingLastContact(true);
    setError('');

    const nextInput = hydratePlannerInput({
      ...input,
      metadata: {
        ...input.metadata,
        lastContactAt: new Date().toISOString()
      }
    });

    try {
      const data = await updatePlan(activePlanId, nextInput);
      const plans = await getPlans();

      setInput(hydratePlannerInput(data.input));
      setReport(data.report);
      setRecentPlans(sortPlansByLastContact(plans ?? []));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingLastContact(false);
    }
  }

  async function handleDeleteSelectedPlan() {
    if (!activePlanId || deletingPlan) {
      return;
    }

    const confirmed = window.confirm('Tem a certeza de que deseja excluir este cliente? Esta acao nao pode ser desfeita.');

    if (!confirmed) {
      return;
    }

    setDeletingPlan(true);
    setError('');

    try {
      await deletePlan(activePlanId);
      const plans = await getPlans();

      handleClosePlan();
      setRecentPlans(sortPlansByLastContact(plans ?? []));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingPlan(false);
    }
  }

  const overview = report?.modules?.overview;
  const future = report?.modules?.future;
  const succession = report?.modules?.succession;
  const control = report?.modules?.control;
  const results = report?.modules?.results;
  const selectedPlan = recentPlans.find((plan) => plan.id === activePlanId);
  const selectedLastContactAt = input.metadata?.lastContactAt || selectedPlan?.lastContactAt || '';
  const filteredPlans = recentPlans.filter((plan) => {
    if (contactFilter === 'all') {
      return true;
    }

    return getLastContactStatus(plan.lastContactAt).filterKey === contactFilter;
  });

  return (
    <div className="grid gap-6">
      {activePlanId ? (
        <>
          <section className="glass-panel rounded-[30px] border border-white/85 bg-white/72 p-6 shadow-panel">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">Cliente selecionado</p>
                <h2 className="mt-2 font-display text-3xl text-slate">{report?.summary?.clientName || input.client.name || 'Cliente'}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate/70">
                  {report
                    ? `Ultimo calculo: ${formatDate(report.generatedAt)} · Perfil ${report.summary.investorProfile || 'Nao informado'}`
                    : 'Visualizacao completa do cadastro selecionado.'}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleUpdateLastContact}
                  disabled={updatingLastContact || loading}
                  className="rounded-full border border-slate/15 bg-white px-5 py-3 font-semibold text-slate transition hover:border-slate/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingLastContact ? 'A atualizar contato...' : 'Atualizar ultimo contato'}
                </button>
                <Link
                  to={`/adicionar-cliente?planId=${activePlanId}`}
                  className="rounded-full bg-slate px-5 py-3 font-semibold text-white transition hover:bg-[#0f2436]"
                >
                  Editar cliente
                </Link>
                <button
                  type="button"
                  onClick={handleDeleteSelectedPlan}
                  disabled={deletingPlan || loading}
                  className="rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-5 py-3 font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40 hover:bg-[#ffe9df] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingPlan ? 'A excluir cliente...' : 'Excluir cliente'}
                </button>
                <button
                  type="button"
                  onClick={handleClosePlan}
                  className="rounded-full border border-slate/15 bg-white px-5 py-3 font-semibold text-slate transition hover:border-slate/30"
                >
                  Fechar cliente
                </button>
              </div>
            </header>

            <div className="grid gap-4 rounded-[24px] border border-slate/10 bg-[#f6f8fb] p-5 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="grid gap-4">
                <div className="grid gap-3 text-sm text-slate/72 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-slate/10 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate/52">Patrimonio liquido</p>
                    <p className="mt-2 font-display text-2xl text-slate">{formatCurrency(overview?.netWorth ?? 0)}</p>
                  </div>
                  <div className="rounded-[18px] border border-slate/10 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate/52">Valor futuro</p>
                    <p className="mt-2 font-display text-2xl text-slate">{formatCurrency(results?.futureRealValue ?? future?.futureRealValue ?? 0)}</p>
                  </div>
                  <div className="rounded-[18px] border border-slate/10 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate/52">Atualizado</p>
                    <p className="mt-2 text-sm font-semibold text-slate">{formatDate(report?.generatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-slate/10 bg-white px-4 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate/52">Status de contato</p>
                <LastContactBadge lastContactAt={selectedLastContactAt} />
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-[#c24d2c]">{error}</p> : null}
          </section>

          <Vision360Form input={input} overview={overview} onFieldChange={() => {}} readOnly />
          <ResultsShowcase input={input} results={results} />
          <FuturePanel future={future} />
          <ExecutiveDashboard input={input} control={control} succession={succession} />
        </>
      ) : (
        <SectionCard
          eyebrow="Dashboard"
          title="Clientes cadastrados"
          description="No carregamento inicial o dashboard mostra apenas a lista de clientes. Clique em um item para abrir a visualizacao completa."
        >
          <div className="mb-6 grid gap-4 rounded-[22px] border border-slate/10 bg-[#f7fafc] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate/52">Base de clientes</p>
                <p className="mt-1 text-sm text-slate/68">
                  {filteredPlans.length} cliente{filteredPlans.length === 1 ? '' : 's'} visiveis de {recentPlans.length} no total.
                </p>
              </div>
              <p className="text-sm text-slate/60">Lista otimizada para volume alto com rolagem interna e filtros por contato.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {contactFilters.map((filter) => {
                const isActive = contactFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setContactFilter(filter.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-slate text-white shadow-[0_12px_24px_rgba(23,38,50,0.18)]'
                        : 'border border-slate/10 bg-white text-slate hover:border-slate/25'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate/65">A carregar clientes guardados...</p>
          ) : recentPlans.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate/20 bg-white/80 p-8 text-center text-slate/68">
              Ainda nao existem clientes guardados na base.
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate/20 bg-white/80 p-8 text-center text-slate/68">
              Nenhum cliente encontrado para o filtro selecionado.
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate/10 bg-[#f8fafc] p-3">
              <div className="max-h-[68vh] overflow-y-auto pr-1">
                <div className="grid gap-3 2xl:grid-cols-2">
              {filteredPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className="rounded-[22px] border border-slate/10 bg-white px-4 py-4 text-left text-slate shadow-[0_10px_25px_rgba(23,38,50,0.04)] transition hover:border-[#173d5d]/30 hover:shadow-[0_16px_34px_rgba(23,38,50,0.08)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-display text-[1.75rem] leading-none">{plan.clientName}</p>
                    <div className="rounded-[18px] border border-slate/10 bg-[#f8fafc] px-4 py-3">
                      <CompactLastContactStatus lastContactAt={plan.lastContactAt} />
                    </div>
                  </div>
                </button>
              ))}
                </div>
              </div>
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-[#c24d2c]">{error}</p> : null}
        </SectionCard>
      )}
    </div>
  );
}
