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
    <div className="flex flex-col gap-0.5 text-right text-sm text-slate/72">
      <div className="flex items-center justify-end gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${status.colorClass}`} aria-hidden="true" />
        <p className="font-semibold text-slate">{status.daysSinceContact != null ? `${status.daysSinceContact} dias sem contato` : 'Sem registro'}</p>
      </div>
      <p className="text-[11px] opacity-60">Ultimo contato: {status.formattedDate.replace('Ultimo contato: ', '')}</p>
    </div>
  );
}



function ConversationHistory({ history = [], onEdit, onDelete }) {
  const [showAll, setShowAll] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  if (history.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-slate/15 bg-white/40 p-5 text-center text-sm text-slate/50">
        Nenhuma conversa registrada para este cliente.
      </div>
    );
  }

  const lastMessage = history[history.length - 1];
  const messagesToShow = showAll ? [...history].reverse() : [lastMessage];

  function handleEditClick(idx, item) {
    setEditingIndex(idx);
    setEditNotes(item.notes || '');
  }

  function handleEditSave(idx, item) {
    if (onEdit) {
      onEdit(idx, { ...item, notes: editNotes });
    }
    setEditingIndex(null);
    setEditNotes('');
  }

  function handleEditCancel() {
    setEditingIndex(null);
    setEditNotes('');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#355f9b]">Conversas e Interacoes</p>
        <p className="text-[10px] font-medium text-slate/40">{history.length} registro(s)</p>
      </div>
      <div className="grid gap-3 max-h-[280px] overflow-y-auto pr-1">
        {messagesToShow.map((item, idx) => {
          // idx é o índice reverso se showAll, senão sempre 0 (última mensagem)
          const realIdx = showAll ? history.length - 1 - idx : history.length - 1;
          const isEditing = editingIndex === realIdx;
          return (
            <div key={realIdx} className="rounded-[20px] border border-slate/8 bg-white p-4 shadow-sm transition hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.result === 'success' ? 'bg-[#eef8f1] text-[#248a47]' : 'bg-[#fbe8e8] text-[#9f3518]'}`}>{item.result === 'success' ? 'Sucesso' : 'Sem sucesso'}</span>
                    <span className="text-xs font-semibold text-slate/40">{formatDate(item.date)}</span>
                  </div>
                  {isEditing ? (
                    <>
                      <textarea
                        className="mt-2 w-full rounded border border-slate/20 p-2 text-sm"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="mt-2 flex gap-2">
                        <button className="rounded bg-[#173d5d] px-3 py-1 text-xs text-white" onClick={() => handleEditSave(realIdx, item)}>Salvar</button>
                        <button className="rounded bg-slate/10 px-3 py-1 text-xs text-slate" onClick={handleEditCancel}>Cancelar</button>
                      </div>
                    </>
                  ) : (
                    item.notes && <p className="text-sm text-slate/80 leading-relaxed whitespace-pre-wrap">{item.notes}</p>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex flex-col gap-1 items-end">
                    <button className="text-xs text-[#355f9b] hover:underline" onClick={() => handleEditClick(realIdx, item)}>Editar</button>
                    <button className="text-xs text-[#c24d2c] hover:underline" onClick={() => onDelete && onDelete(realIdx)}>Excluir</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {history.length > 1 && (
        <button
          type="button"
          className="self-end mt-2 rounded-full border border-slate/15 bg-white px-4 py-2 text-xs font-semibold text-slate transition hover:border-slate/30"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Mostrar menos' : 'Mostrar todo o histórico'}
        </button>
      )}
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

  // Contato registration state
  const [registeringPlan, setRegisteringPlan] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null); // 'success' | 'failure'
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [savingRegistration, setSavingRegistration] = useState(false);

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

  async function handleRegisterContact(plan) {
    setRegisteringPlan(plan);
    setRegistrationResult(null);
    setRegistrationNotes('');
  }

  async function handleSaveRegistration() {
    if (!registeringPlan || savingRegistration) return;

    setSavingRegistration(true);
    try {
      const planData = await getPlan(registeringPlan.id);

      const isSuccess = registrationResult === 'success';
      const lastContactAt = isSuccess ? new Date().toISOString() : (planData.input.metadata?.lastContactAt || registeringPlan.lastContactAt);

      const nextInput = hydratePlannerInput({
        ...planData.input,
        metadata: {
          ...planData.input.metadata,
          lastContactAt,
          contactHistory: [
            ...(planData.input.metadata?.contactHistory || []),
            {
              date: new Date().toISOString(),
              result: registrationResult,
              notes: registrationNotes
            }
          ]
        }
      });

      await updatePlan(registeringPlan.id, nextInput);
      const plans = await getPlans();

      setRecentPlans(sortPlansByLastContact(plans ?? []));

      if (activePlanId === registeringPlan.id) {
        const updatedData = await getPlan(activePlanId);
        setInput(hydratePlannerInput(updatedData.input));
        setReport(updatedData.report);
      }

      setRegisteringPlan(null);
    } catch (requestError) {
      setError('Falha ao registrar contato: ' + requestError.message);
    } finally {
      setSavingRegistration(false);
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

  // As funções devem estar fora do JSX, dentro do componente DashboardPage
  async function handleEditContactHistory(idx, newItem) {
    if (!activePlanId) return;
    const history = input.metadata?.contactHistory || [];
    const nextHistory = [...history];
    nextHistory[idx] = newItem;
    const nextInput = hydratePlannerInput({
      ...input,
      metadata: {
        ...input.metadata,
        contactHistory: nextHistory
      }
    });
    try {
      const data = await updatePlan(activePlanId, nextInput);
      setInput(hydratePlannerInput(data.input));
      setReport(data.report);
    } catch (err) {
      setError('Falha ao editar conversa: ' + err.message);
    }
  }

  async function handleDeleteContactHistory(idx) {
    if (!activePlanId) return;
    const history = input.metadata?.contactHistory || [];
    const nextHistory = history.filter((_, i) => i !== idx);
    const nextInput = hydratePlannerInput({
      ...input,
      metadata: {
        ...input.metadata,
        contactHistory: nextHistory
      }
    });
    try {
      const data = await updatePlan(activePlanId, nextInput);
      setInput(hydratePlannerInput(data.input));
      setReport(data.report);
    } catch (err) {
      setError('Falha ao excluir conversa: ' + err.message);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {activePlanId ? (
        <>
          <section className="glass-panel rounded-[30px] border border-white/85 bg-white/72 p-6 shadow-panel">
            <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">Cliente selecionado</p>
                <h2 className="mt-2 font-display text-3xl text-slate">{report?.summary?.clientName || input.client.name || 'Cliente'}</h2>
                <div className="mt-2 flex flex-col gap-1 max-w-2xl text-sm text-slate/70">
                  <p>
                    {report
                      ? `Ultimo calculo: ${formatDate(report.generatedAt)} · Perfil ${report.summary.investorProfile || 'Nao informado'}`
                      : 'Visualizacao completa do cadastro selecionado.'}
                  </p>
                  <div className="flex items-center gap-2 font-medium text-slate/80">
                    <span className={`h-2 w-2 rounded-full ${getLastContactStatus(selectedLastContactAt).colorClass}`} aria-hidden="true" />
                    <p>{getLastContactStatus(selectedLastContactAt).formattedDate} · {getLastContactStatus(selectedLastContactAt).daysLabel}</p>
                  </div>
                </div>
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

            <div className="mb-6">
              <ConversationHistory
                history={input.metadata?.contactHistory}
                onEdit={handleEditContactHistory}
                onDelete={handleDeleteContactHistory}
              />
            </div>

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

          <div className="min-w-0 w-full">
            <Vision360Form input={input} overview={overview} onFieldChange={() => { }} readOnly />
          </div>
          <div className="min-w-0 w-full">
            <ResultsShowcase input={input} results={results} readOnly={true} />
          </div>
          <div className="min-w-0 w-full">
            <FuturePanel future={future} />
          </div>
          <div className="min-w-0 w-full">
            <ExecutiveDashboard input={input} control={control} succession={succession} />
          </div>
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
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
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
                <div className="flex flex-col gap-3">
                  {filteredPlans.map((plan) => {
                    const status = getLastContactStatus(plan.lastContactAt);
                    return (
                      <div
                        key={plan.id}
                        className="flex flex-col gap-4 rounded-[22px] border border-slate/10 bg-white px-5 py-4 shadow-[0_10px_25px_rgba(23,38,50,0.04)] transition hover:border-[#173d5d]/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleSelectPlan(plan.id)}
                            className="group flex min-w-0 items-center gap-3 py-2 text-left transition"
                          >
                            <span className="truncate font-display text-xl text-slate transition group-hover:text-[#173d5d] sm:text-2xl">
                              {plan.clientName}
                            </span>
                            <svg
                              className="h-5 w-5 opacity-0 -translate-x-2 transition-all group-hover:opacity-40 group-hover:translate-x-0 text-[#173d5d]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-6 sm:justify-end">
                          <div className="flex flex-col gap-0.5 text-right text-sm text-slate/72">
                            <p className="font-semibold text-slate">{status.formattedDate.replace('Ultimo contato: ', '')}</p>
                            <p className="text-xs opacity-60 text-slate/60">{status.daysSinceContact != null ? `${status.daysSinceContact} dias sem contato` : 'Sem registro'}</p>
                          </div>

                          <span className={`h-3 w-3 shrink-0 rounded-full ${status.colorClass}`} aria-hidden="true" />

                          <button
                            type="button"
                            onClick={() => handleRegisterContact(plan)}
                            className="rounded-full bg-[#eef4fb] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#355f9b] transition hover:bg-[#dfeaf6]"
                          >
                            Contato
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-[#c24d2c]">{error}</p> : null}
        </SectionCard>
      )}
      {registeringPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] border border-[#173d5d]/12 bg-white p-8 shadow-[0_24px_48px_rgba(23,61,93,0.18)]">
            <h3 className="font-display text-3xl text-[#173d5d]">Registrar Contato</h3>
            <div className="mt-4 flex flex-col gap-1 text-sm text-slate/60">
              <p className="font-semibold text-slate text-lg">{registeringPlan.clientName}</p>
              <p className="text-base">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="mt-8 flex flex-col gap-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate/40">Resultado:</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRegistrationResult('success')}
                    className={`flex-1 rounded-2xl py-4 font-bold transition-all ${registrationResult === 'success'
                        ? 'bg-[#30b45d] text-white shadow-lg shadow-[#30b45d]/20 scale-[1.02]'
                        : 'bg-[#f0f9f4] text-[#248a47] hover:bg-[#e1f2e6]'
                      }`}
                  >
                    Sucesso
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationResult('failure')}
                    className={`flex-1 rounded-2xl py-4 font-bold transition-all ${registrationResult === 'failure'
                        ? 'bg-[#d65454] text-white shadow-lg shadow-[#d65454]/20 scale-[1.02]'
                        : 'bg-[#fef2f2] text-[#9f3518] hover:bg-[#fce7e7]'
                      }`}
                  >
                    Sem sucesso
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate/40">Assuntos discutidos nessa reuniao:</p>
                <textarea
                  value={registrationNotes}
                  onChange={(e) => setRegistrationNotes(e.target.value)}
                  placeholder="Escreva aqui os principais pontos..."
                  className="w-full min-h-[140px] rounded-2xl border border-slate/15 bg-[#fbfdff] p-5 text-slate placeholder:text-slate/30 focus:border-[#173d5d]/40 focus:ring-4 focus:ring-[#173d5d]/5 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={() => setRegisteringPlan(null)}
                className="flex-1 rounded-2xl border border-slate/10 bg-white py-4 font-bold text-slate/60 transition hover:border-slate/30 hover:text-slate"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRegistration}
                disabled={savingRegistration || !registrationResult}
                className="flex-1 rounded-2xl bg-[#173d5d] py-4 font-bold text-white shadow-xl shadow-[#173d5d]/20 transition hover:bg-[#1e4b6f] hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                {savingRegistration ? 'A registrar...' : 'Salvar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
