import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard.jsx';
import { FuturePanel } from '../components/FuturePanel.jsx';
import { ContactHistory } from '../components/ContactHistory.jsx';
import { ResultsShowcase } from '../components/ResultsShowcase.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Vision360Form } from '../components/Vision360Form.jsx';
import { LocalizedNumberInput } from '../components/LocalizedNumberInput.jsx';
import { contributionMonthLabels, normalizeMonthlyContributions, normalizeSavingsGoals, sumSavingsGoals } from '@yield-360/shared';
import { deletePlan, getPlan, getPlans, updatePlan } from '../lib/api.js';
import { getLastContactStatus, sortPlansByLastContact } from '../lib/last-contact.js';
import { createEmptyPlannerInput, hydratePlannerInput } from '../lib/planner-state.js';
import { formatCurrency, formatDate, formatDateOnly, formatPercent, parseLocalizedNumber } from '../lib/formatters.js';

const contactFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'red', label: 'Vermelho' },
  { id: 'yellow', label: 'Amarelo' },
  { id: 'green', label: 'Verde' },
  { id: 'missing', label: 'Sem contato' }
];

const contactStatusSegments = [
  {
    key: 'red',
    label: 'Vermelho',
    barClass: 'bg-[#d65454]',
    chipClass: 'border-[#f0c7c7] bg-[#fff4f4] text-[#9f3518]'
  },
  {
    key: 'yellow',
    label: 'Amarelo',
    barClass: 'bg-[#e0b631]',
    chipClass: 'border-[#eadca8] bg-[#fff9df] text-[#84600b]'
  },
  {
    key: 'green',
    label: 'Verde',
    barClass: 'bg-[#30b45d]',
    chipClass: 'border-[#c9e8d2] bg-[#eef8f1] text-[#248a47]'
  }
];

function buildContactStatusSummary(plans = []) {
  const totals = {
    red: 0,
    yellow: 0,
    green: 0,
    missing: 0
  };

  plans.forEach((plan) => {
    const statusKey = getLastContactStatus(plan.lastContactAt).filterKey;

    if (statusKey in totals) {
      totals[statusKey] += 1;
    }
  });

  const total = plans.length;
  const percent = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);

  return {
    total,
    missingCount: totals.missing,
    segments: contactStatusSegments.map((segment) => ({
      ...segment,
      count: totals[segment.key],
      percent: percent(totals[segment.key])
    }))
  };
}

function ContactStatusOverview({ summary, activeFilter, onFilterChange }) {
  return (
    <div className="mb-6 rounded-[24px] border border-slate/10 bg-white/82 p-4 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate/52">Status de contato</p>
          <p className="mt-1 text-sm text-slate/68">
            Percentual da base por tempo desde o ultimo contato.
          </p>
        </div>
        <p className="rounded-full border border-slate/10 bg-[#f7fafc] px-3 py-1.5 text-xs font-semibold text-slate/58">
          {summary.total} cliente{summary.total === 1 ? '' : 's'} no total
        </p>
      </div>

      <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate/10">
        {summary.total > 0 ? (
          <div className="flex h-full">
            {summary.segments.map((segment) => (
              <button
                key={segment.key}
                type="button"
                onClick={() => onFilterChange(segment.key)}
                className={`${segment.barClass} min-w-0 cursor-pointer transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-white/80`}
                style={{ width: `${segment.percent}%` }}
                title={`Mostrar clientes no ${segment.label.toLowerCase()}: ${segment.percent}%`}
                aria-label={`Mostrar clientes no ${segment.label.toLowerCase()}`}
              />
            ))}
            {summary.missingCount > 0 ? (
              <div
                className="min-w-0 bg-slate/25 transition-all"
                style={{ width: `${Math.round((summary.missingCount / summary.total) * 100)}%` }}
                title={`Sem contato: ${Math.round((summary.missingCount / summary.total) * 100)}%`}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {summary.segments.map((segment) => (
          <button
            key={segment.key}
            type="button"
            onClick={() => onFilterChange(segment.key)}
            className={`rounded-[18px] border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(23,38,50,0.08)] focus:outline-none focus:ring-4 focus:ring-[#355f9b]/10 ${
              activeFilter === segment.key ? 'ring-2 ring-[#173d5d]/25' : ''
            } ${segment.chipClass}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em]">{segment.label}</p>
              <p className="font-display text-2xl leading-none">{segment.percent}%</p>
            </div>
            <p className="mt-1 text-xs opacity-75">
              {segment.count} cliente{segment.count === 1 ? '' : 's'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function toNumber(value) {
  const normalizedValue = typeof value === 'string' && value.includes(',')
    ? parseLocalizedNumber(value)
    : value;
  const numericValue = Number(normalizedValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function buildLocalDateInputValue() {
  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeContributionDate(value, fallback = buildLocalDateInputValue()) {
  const normalizedValue = String(value ?? '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return fallback;
  }

  const [year, month, day] = normalizedValue.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return fallback;
  }

  return normalizedValue;
}

function resolveContributionMonthIndex(value) {
  return Number(normalizeContributionDate(value).slice(5, 7)) - 1;
}

function createContributionEntry({ amount, date, savingsGoalId }) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `contribution-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    amount: Math.max(0, toNumber(amount)),
    date: normalizeContributionDate(date),
    savingsGoalId: String(savingsGoalId ?? '').trim()
  };
}

function createSavingsGoal({ title, amount }) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    title: String(title ?? '').trim(),
    amount: Math.max(0, toNumber(amount))
  };
}

function sumMonthlyContributionAmounts(items = []) {
  return items.reduce((total, item) => total + toNumber(item?.amount), 0);
}

function normalizeGoalMatchKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function resolveEntrySavingsGoalId(entry, goals) {
  const rawGoalId = String(entry?.savingsGoalId ?? '').trim();
  const exactGoal = goals.find((goal) => goal.id === rawGoalId);

  if (exactGoal) {
    return exactGoal.id;
  }

  const normalizedGoalId = normalizeGoalMatchKey(rawGoalId);
  const textMatchGoal = normalizedGoalId
    ? goals.find((goal) => normalizeGoalMatchKey(goal.title) === normalizedGoalId || normalizeGoalMatchKey(goal.id) === normalizedGoalId)
    : null;

  if (textMatchGoal) {
    return textMatchGoal.id;
  }

  return !rawGoalId && goals.length === 1 ? goals[0].id : '';
}

function buildGoalsModalSummary(input) {
  const goals = normalizeSavingsGoals(input.planning?.savingsGoals);
  const contributions = normalizeMonthlyContributions(input.control?.monthlyContributions);
  const entries = contributions.flatMap((month, monthIndex) =>
    (month.entries ?? []).map((entry) => {
      const resolvedSavingsGoalId = resolveEntrySavingsGoalId(entry, goals);

      return {
        ...entry,
        month: month.month,
        monthIndex,
        resolvedSavingsGoalId
      };
    })
  );
  const totalGoal = sumSavingsGoals(goals);
  const totalContributed = entries.reduce((total, entry) => total + toNumber(entry.amount), 0);
  const goalRows = goals.map((goal, index) => {
    const goalEntries = entries.filter((entry) => entry.resolvedSavingsGoalId === goal.id);
    const contributed = goalEntries.reduce((total, entry) => total + toNumber(entry.amount), 0);

    return {
      id: goal.id,
      title: String(goal.title ?? '').trim() || `Meta ${index + 1}`,
      amount: toNumber(goal.amount),
      contributed,
      remaining: Math.max(toNumber(goal.amount) - contributed, 0),
      progress: toNumber(goal.amount) > 0 ? Math.min((contributed / toNumber(goal.amount)) * 100, 100) : 0,
      entries: goalEntries
    };
  });
  const unlinkedEntries = entries.filter((entry) => !entry.resolvedSavingsGoalId);
  const totalProgress = totalGoal > 0 ? Math.min((totalContributed / totalGoal) * 100, 100) : 0;

  return {
    totalGoal,
    totalContributed,
    totalProgress,
    goalRows,
    unlinkedEntries
  };
}

function getPlanGlobalSavingsProgress(plan) {
  const progress = toNumber(plan?.globalSavingsProgress);

  if (progress > 0) {
    return Math.min(progress, 100);
  }

  const goal = toNumber(plan?.globalSavingsGoal);
  const contributed = toNumber(plan?.globalSavingsContributed);

  return goal > 0 ? Math.min((contributed / goal) * 100, 100) : 0;
}

function isContributionModalView(view) {
  return view === 'contribution' || view === 'contributionEditor' || view === 'goalEditor';
}

function VerticalDotsButton({ label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate/10 bg-white text-slate/58 transition hover:border-[#173d5d]/20 hover:text-[#173d5d] disabled:cursor-not-allowed disabled:opacity-45"
      aria-label={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  );
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPlanIdFromUrl = searchParams.get('planId') ?? '';
  const [input, setInput] = useState(() => createEmptyPlannerInput());
  const [report, setReport] = useState(null);
  const [planCreatedAt, setPlanCreatedAt] = useState('');
  const [recentPlans, setRecentPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingLastContact, setUpdatingLastContact] = useState(false);
  const [updatingPerpetuityRate, setUpdatingPerpetuityRate] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [showDeletePlanDialog, setShowDeletePlanDialog] = useState(false);
  const [deletePlanConfirmationText, setDeletePlanConfirmationText] = useState('');
  const [goalsModal, setGoalsModal] = useState(null);
  const [loadingGoalsModal, setLoadingGoalsModal] = useState(false);
  const [savingGoalsContribution, setSavingGoalsContribution] = useState(false);
  const [savingGoalsGoal, setSavingGoalsGoal] = useState(false);
  const [goalsContributionDraft, setGoalsContributionDraft] = useState(() => ({
    amount: 0,
    date: buildLocalDateInputValue(),
    savingsGoalId: ''
  }));
  const [editingGoalsContribution, setEditingGoalsContribution] = useState(null);
  const [activeGoalsContributionMenuKey, setActiveGoalsContributionMenuKey] = useState('');
  const [editingGoalsGoalId, setEditingGoalsGoalId] = useState('');
  const [activeGoalsGoalMenuId, setActiveGoalsGoalMenuId] = useState('');
  const [goalsGoalDraft, setGoalsGoalDraft] = useState(() => ({
    title: '',
    amount: 0
  }));
  const [goalsGoalReturnView, setGoalsGoalReturnView] = useState('contributionEditor');
  const [goalsModalError, setGoalsModalError] = useState('');
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

        enrichPlansWithGoalSummaries(plans ?? []).then((enrichedPlans) => {
          if (!cancelled) {
            setRecentPlans(enrichedPlans);
          }
        });

        if (!selectedPlanIdFromUrl) {
          setActivePlanId('');
          setPlanCreatedAt('');
          setInput(createEmptyPlannerInput());
          setReport(null);
          return;
        }

        const data = await getPlan(selectedPlanIdFromUrl);

        if (cancelled) {
          return;
        }

        setActivePlanId(data.planId);
  setPlanCreatedAt(data.createdAt ?? '');
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

  async function enrichPlansWithGoalSummaries(plans = []) {
    const enrichedPlans = await Promise.all((plans ?? []).map(async (plan) => {
      try {
        const data = await getPlan(plan.id);
        const hydratedInput = hydratePlannerInput(data.input);
        const summary = buildGoalsModalSummary(hydratedInput);

        return {
          ...plan,
          clientName: hydratedInput.client?.name || plan.clientName,
          globalSavingsGoal: summary.totalGoal,
          globalSavingsContributed: summary.totalContributed,
          globalSavingsProgress: summary.totalProgress
        };
      } catch {
        return plan;
      }
    }));

    return sortPlansByLastContact(enrichedPlans);
  }

  async function handleOpenGoalsModal(plan, initialView = 'goals') {
    setGoalsModal({
      planId: plan.id,
      clientName: plan.clientName,
      initialView,
      input: null,
      summary: {
        totalGoal: toNumber(plan.globalSavingsGoal),
        totalContributed: 0,
        totalProgress: getPlanGlobalSavingsProgress(plan),
        goalRows: [],
        unlinkedEntries: []
      }
    });
    setGoalsModalError('');
    setLoadingGoalsModal(true);

    try {
      const data = await getPlan(plan.id);
      const hydratedInput = hydratePlannerInput(data.input);

      setGoalsModal({
        planId: plan.id,
        clientName: hydratedInput.client?.name || plan.clientName,
        initialView,
        input: hydratedInput,
        summary: buildGoalsModalSummary(hydratedInput)
      });
    } catch (requestError) {
      setGoalsModalError(requestError.message);
    } finally {
      setLoadingGoalsModal(false);
    }
  }

  function handleCloseGoalsModal() {
    setGoalsModal(null);
    setGoalsModalError('');
    setLoadingGoalsModal(false);
    setSavingGoalsContribution(false);
    setSavingGoalsGoal(false);
    setGoalsContributionDraft({
      amount: 0,
      date: buildLocalDateInputValue(),
      savingsGoalId: ''
    });
    setEditingGoalsContribution(null);
    setActiveGoalsContributionMenuKey('');
    setEditingGoalsGoalId('');
    setActiveGoalsGoalMenuId('');
    setGoalsGoalDraft({
      title: '',
      amount: 0
    });
    setGoalsGoalReturnView('contributionEditor');
  }

  function handleOpenGoalsContributionEditor() {
    const goalRows = goalsModal?.summary?.goalRows ?? [];

    setGoalsModal((currentModal) => currentModal
      ? { ...currentModal, initialView: 'contributionEditor' }
      : currentModal
    );
    setGoalsContributionDraft({
      amount: 0,
      date: buildLocalDateInputValue(),
      savingsGoalId: goalRows.length === 1 ? goalRows[0].id : ''
    });
    setEditingGoalsContribution(null);
    setActiveGoalsContributionMenuKey('');
  }

  function handleOpenGoalsGoalEditor(returnView = 'contributionEditor', goal = null) {
    setGoalsGoalReturnView(returnView);
    setEditingGoalsGoalId(goal?.id ?? '');
    setActiveGoalsGoalMenuId('');
    setGoalsGoalDraft({
      title: goal?.title ?? '',
      amount: goal?.amount ?? 0
    });
    setGoalsModal((currentModal) => currentModal
      ? { ...currentModal, initialView: 'goalEditor' }
      : currentModal
    );
  }

  function updateRecentPlanGoalSummary(plans, planId, hydratedInput, fallbackClientName) {
    const summary = buildGoalsModalSummary(hydratedInput);

    return sortPlansByLastContact((plans ?? []).map((plan) => (
      plan.id === planId
        ? {
          ...plan,
          clientName: hydratedInput.client?.name || fallbackClientName || plan.clientName,
          globalSavingsGoal: summary.totalGoal,
          globalSavingsContributed: summary.totalContributed,
          globalSavingsProgress: summary.totalProgress
        }
        : plan
    )));
  }

  async function persistGoalsModalInput(nextInput, nextView) {
    const currentPlanId = goalsModal?.planId;

    if (!currentPlanId) {
      return null;
    }

    const data = await updatePlan(currentPlanId, nextInput);
    const hydratedInput = hydratePlannerInput(data.input);
    const plans = await getPlans();

    setRecentPlans(updateRecentPlanGoalSummary(plans, currentPlanId, hydratedInput, goalsModal.clientName));
    setGoalsModal((currentModal) => currentModal
      ? {
        ...currentModal,
        input: hydratedInput,
        clientName: hydratedInput.client?.name || currentModal.clientName,
        summary: buildGoalsModalSummary(hydratedInput),
        initialView: nextView ?? currentModal.initialView
      }
      : currentModal
    );

    if (activePlanId === currentPlanId) {
      setPlanCreatedAt(data.createdAt ?? planCreatedAt);
      setInput(hydratePlannerInput(data.input));
      setReport(data.report);
    }

    return hydratedInput;
  }

  function buildInputWithMonthlyContributions(baseInput, monthlyContributions, currentContributionDate) {
    return hydratePlannerInput({
      ...baseInput,
      control: {
        ...(baseInput.control ?? {}),
        currentContributionDate,
        monthlyContributions,
        totalContributed: sumMonthlyContributionAmounts(monthlyContributions)
      }
    });
  }

  function handleEditGoalsContribution(entry) {
    setEditingGoalsContribution({
      monthIndex: entry.monthIndex,
      id: entry.id
    });
    setActiveGoalsContributionMenuKey('');
    setGoalsContributionDraft({
      amount: entry.amount,
      date: normalizeContributionDate(entry.date),
      savingsGoalId: entry.resolvedSavingsGoalId ?? entry.savingsGoalId ?? ''
    });
    setGoalsModal((currentModal) => currentModal
      ? { ...currentModal, initialView: 'contributionEditor' }
      : currentModal
    );
  }

  async function handleSaveGoalsContribution() {
    if (!goalsModal?.input || savingGoalsContribution || toNumber(goalsContributionDraft.amount) <= 0) {
      return;
    }

    setSavingGoalsContribution(true);
    setGoalsModalError('');

    try {
      const normalizedDate = normalizeContributionDate(goalsContributionDraft.date);
      const monthIndex = resolveContributionMonthIndex(normalizedDate);
      const monthlyContributions = normalizeMonthlyContributions(goalsModal.input.control?.monthlyContributions);

      if (editingGoalsContribution) {
        const currentMonth = monthlyContributions[editingGoalsContribution.monthIndex];
        const currentEntry = currentMonth?.entries?.find((entry) => entry.id === editingGoalsContribution.id);

        if (!currentEntry) {
          throw new Error('Aporte nao encontrado para edicao.');
        }

        const updatedEntry = {
          ...currentEntry,
          amount: Math.max(0, toNumber(goalsContributionDraft.amount)),
          date: normalizedDate,
          savingsGoalId: String(goalsContributionDraft.savingsGoalId ?? '').trim()
        };
        const entriesWithoutCurrent = (currentMonth.entries ?? []).filter((entry) => entry.id !== editingGoalsContribution.id);
        const currentLatestEntry = entriesWithoutCurrent.at(-1);

        monthlyContributions[editingGoalsContribution.monthIndex] = {
          month: contributionMonthLabels[editingGoalsContribution.monthIndex],
          amount: entriesWithoutCurrent.reduce((total, entry) => total + toNumber(entry?.amount), 0),
          date: currentLatestEntry?.date ?? '',
          savingsGoalId: currentLatestEntry?.savingsGoalId ?? '',
          entries: entriesWithoutCurrent
        };

        const targetMonth = monthlyContributions[monthIndex] ?? {
          month: contributionMonthLabels[monthIndex],
          amount: 0,
          date: '',
          savingsGoalId: '',
          entries: []
        };
        const targetEntries = [...(targetMonth.entries ?? []), updatedEntry];
        const targetLatestEntry = targetEntries.at(-1);

        monthlyContributions[monthIndex] = {
          month: contributionMonthLabels[monthIndex],
          amount: targetEntries.reduce((total, entry) => total + toNumber(entry?.amount), 0),
          date: targetLatestEntry?.date ?? '',
          savingsGoalId: targetLatestEntry?.savingsGoalId ?? '',
          entries: targetEntries
        };
      } else {
        const currentMonth = monthlyContributions[monthIndex] ?? {
          month: contributionMonthLabels[monthIndex],
          amount: 0,
          date: '',
          savingsGoalId: '',
          entries: []
        };
        const nextEntry = createContributionEntry({
          amount: goalsContributionDraft.amount,
          date: normalizedDate,
          savingsGoalId: goalsContributionDraft.savingsGoalId
        });
        const nextEntries = [...(currentMonth.entries ?? []), nextEntry];

        monthlyContributions[monthIndex] = {
          month: contributionMonthLabels[monthIndex],
          amount: nextEntries.reduce((total, entry) => total + toNumber(entry?.amount), 0),
          date: normalizedDate,
          savingsGoalId: nextEntry.savingsGoalId,
          entries: nextEntries
        };
      }

      const nextInput = buildInputWithMonthlyContributions(goalsModal.input, monthlyContributions, normalizedDate);
      await persistGoalsModalInput(nextInput, 'contribution');
      setGoalsContributionDraft({
        amount: 0,
        date: buildLocalDateInputValue(),
        savingsGoalId: ''
      });
      setEditingGoalsContribution(null);
    } catch (requestError) {
      setGoalsModalError(requestError.message);
    } finally {
      setSavingGoalsContribution(false);
    }
  }

  async function handleDeleteGoalsContribution(entry) {
    if (!goalsModal?.input || savingGoalsContribution) {
      return;
    }

    setActiveGoalsContributionMenuKey('');

    if (!window.confirm(`Excluir o aporte de ${formatCurrency(entry.amount)}?`)) {
      return;
    }

    setSavingGoalsContribution(true);
    setGoalsModalError('');

    try {
      const monthlyContributions = normalizeMonthlyContributions(goalsModal.input.control?.monthlyContributions);
      const currentMonth = monthlyContributions[entry.monthIndex];

      if (!currentMonth) {
        throw new Error('Mes do aporte nao encontrado.');
      }

      const nextEntries = (currentMonth.entries ?? []).filter((item) => item.id !== entry.id);
      const latestEntry = nextEntries.at(-1);

      monthlyContributions[entry.monthIndex] = {
        month: contributionMonthLabels[entry.monthIndex],
        amount: nextEntries.reduce((total, item) => total + toNumber(item?.amount), 0),
        date: latestEntry?.date ?? '',
        savingsGoalId: latestEntry?.savingsGoalId ?? '',
        entries: nextEntries
      };

      const nextInput = buildInputWithMonthlyContributions(
        goalsModal.input,
        monthlyContributions,
        normalizeContributionDate(goalsModal.input.control?.currentContributionDate)
      );

      await persistGoalsModalInput(nextInput, goalsModal.initialView);
    } catch (requestError) {
      setGoalsModalError(requestError.message);
    } finally {
      setSavingGoalsContribution(false);
    }
  }

  async function handleSaveGoalsGoal() {
    if (!goalsModal?.input || savingGoalsGoal || !goalsGoalDraft.title.trim() || toNumber(goalsGoalDraft.amount) <= 0) {
      return;
    }

    setSavingGoalsGoal(true);
    setGoalsModalError('');

    try {
      const currentGoals = normalizeSavingsGoals(goalsModal.input.planning?.savingsGoals);
      const nextGoal = editingGoalsGoalId
        ? {
          ...(currentGoals.find((goal) => goal.id === editingGoalsGoalId) ?? createSavingsGoal(goalsGoalDraft)),
          title: goalsGoalDraft.title,
          amount: Math.max(0, toNumber(goalsGoalDraft.amount))
        }
        : createSavingsGoal(goalsGoalDraft);
      const nextGoals = editingGoalsGoalId
        ? currentGoals.map((goal) => (goal.id === editingGoalsGoalId ? nextGoal : goal))
        : [...currentGoals, nextGoal];
      const nextInput = hydratePlannerInput({
        ...goalsModal.input,
        planning: {
          ...(goalsModal.input.planning ?? {}),
          savingsGoals: nextGoals,
          globalSavingsGoal: sumSavingsGoals(nextGoals)
        }
      });

      await persistGoalsModalInput(nextInput, goalsGoalReturnView);
      if (!editingGoalsGoalId) {
        setGoalsContributionDraft((draft) => ({
          ...draft,
          savingsGoalId: nextGoal.id
        }));
      }
      setEditingGoalsGoalId('');
      setGoalsGoalDraft({
        title: '',
        amount: 0
      });
    } catch (requestError) {
      setGoalsModalError(requestError.message);
    } finally {
      setSavingGoalsGoal(false);
    }
  }

  async function handleDeleteGoalsGoal(goal) {
    if (!goalsModal?.input || savingGoalsGoal || !goal?.id) {
      return;
    }

    setActiveGoalsGoalMenuId('');

    if (!window.confirm(`Excluir a meta "${goal.title}"? Os aportes vinculados ficarao em Sem categoria.`)) {
      return;
    }

    setSavingGoalsGoal(true);
    setGoalsModalError('');

    try {
      const currentGoals = normalizeSavingsGoals(goalsModal.input.planning?.savingsGoals);
      const nextGoals = currentGoals.filter((item) => item.id !== goal.id);
      const nextInput = hydratePlannerInput({
        ...goalsModal.input,
        planning: {
          ...(goalsModal.input.planning ?? {}),
          savingsGoals: nextGoals,
          globalSavingsGoal: sumSavingsGoals(nextGoals)
        }
      });

      await persistGoalsModalInput(nextInput, goalsModal.initialView);
    } catch (requestError) {
      setGoalsModalError(requestError.message);
    } finally {
      setSavingGoalsGoal(false);
    }
  }

  function handleClosePlan() {
    setSearchParams({});
    setActivePlanId('');
    setPlanCreatedAt('');
    setInput(createEmptyPlannerInput());
    setReport(null);
    setShowDeletePlanDialog(false);
    setDeletePlanConfirmationText('');
    setError('');
  }

  function handleOpenDeleteSelectedPlan() {
    if (!activePlanId || deletingPlan) {
      return;
    }

    setDeletePlanConfirmationText('');
    setError('');
    setShowDeletePlanDialog(true);
  }

  function handleCancelDeleteSelectedPlan() {
    if (deletingPlan) {
      return;
    }

    setShowDeletePlanDialog(false);
    setDeletePlanConfirmationText('');
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

      setPlanCreatedAt(data.createdAt ?? planCreatedAt);
      setInput(hydratePlannerInput(data.input));
      setReport(data.report);
      setRecentPlans(sortPlansByLastContact(plans ?? []));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingLastContact(false);
    }
  }

  async function handlePersistPerpetuityRate(nextRate) {
    if (!activePlanId) {
      throw new Error('Selecione um cliente para guardar a nova taxa.');
    }

    setUpdatingPerpetuityRate(true);
    setError('');

    try {
      const nextInput = hydratePlannerInput({
        ...input,
        future: {
          ...input.future,
          perpetuityRate: nextRate
        }
      });
      const data = await updatePlan(activePlanId, nextInput);

      setPlanCreatedAt(data.createdAt ?? planCreatedAt);
      setInput(hydratePlannerInput(data.input));
      setReport(data.report);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setUpdatingPerpetuityRate(false);
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
        setPlanCreatedAt(updatedData.createdAt ?? planCreatedAt);
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

    if (deletePlanConfirmationText !== deletePlanConfirmationPhrase) {
      setError(`Digite exatamente "${deletePlanConfirmationPhrase}" para confirmar a exclusao.`);
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
  const selectedClientName = report?.summary?.clientName || input.client.name || 'Cliente';
  const deletePlanConfirmationPhrase = `Deletar cliente ${selectedClientName}`;
  const selectedLastContactAt = input.metadata?.lastContactAt || selectedPlan?.lastContactAt || '';
  const filteredPlans = recentPlans.filter((plan) => {
    if (contactFilter === 'all') {
      return true;
    }

    return getLastContactStatus(plan.lastContactAt).filterKey === contactFilter;
  });
  const contactStatusSummary = buildContactStatusSummary(recentPlans);

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

    const confirmed = window.confirm('Tem certeza de que deseja excluir esta conversa do historico?');

    if (!confirmed) {
      return;
    }

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
                  onClick={handleOpenDeleteSelectedPlan}
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
              <ContactHistory
                history={input.metadata?.contactHistory}
                onEdit={handleEditContactHistory}
                onDelete={handleDeleteContactHistory}
              />
            </div>

            <div className="rounded-[24px] border border-slate/10 bg-[#f6f8fb] p-5">
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
            </div>
            {error ? <p className="mt-4 text-sm text-[#c24d2c]">{error}</p> : null}
          </section>

          {showDeletePlanDialog ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate/45 px-4 py-6">
              <div className="w-full max-w-lg rounded-[28px] border border-[#c24d2c]/15 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="delete-client-title">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9f3518]">Confirmacao obrigatoria</p>
                <h3 id="delete-client-title" className="mt-3 font-display text-2xl text-slate">Excluir cliente</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate/72">
                  Para excluir este cliente em definitivo, digite a frase abaixo exatamente como aparece e depois clique em Confirmar exclusão.
                </p>
                <div className="mt-4 rounded-[20px] border border-slate/10 bg-[#fff8f4] px-4 py-3 text-sm font-semibold text-[#9f3518]">
                  {deletePlanConfirmationPhrase}
                </div>
                <label className="mt-4 block text-sm font-semibold text-slate" htmlFor="delete-plan-confirmation-input">
                  Frase de confirmacao
                </label>
                <input
                  id="delete-plan-confirmation-input"
                  type="text"
                  value={deletePlanConfirmationText}
                  onChange={(event) => {
                    setDeletePlanConfirmationText(event.target.value);
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder={deletePlanConfirmationPhrase}
                  className="mt-2 w-full rounded-[16px] border border-slate/15 bg-white px-4 py-3 text-sm text-slate outline-none transition focus:border-[#c24d2c]/50 focus:ring-2 focus:ring-[#c24d2c]/10"
                />
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelDeleteSelectedPlan}
                    disabled={deletingPlan}
                    className="rounded-full border border-slate/15 bg-white px-5 py-3 font-semibold text-slate transition hover:border-slate/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedPlan}
                    disabled={deletingPlan || deletePlanConfirmationText !== deletePlanConfirmationPhrase}
                    className="rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-5 py-3 font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40 hover:bg-[#ffe9df] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingPlan ? 'A excluir cliente...' : 'Confirmar exclusao'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="min-w-0 w-full">
            <Vision360Form input={input} overview={overview} onFieldChange={() => { }} readOnly />
          </div>
          <div className="min-w-0 w-full">
            <ResultsShowcase input={input} results={results} readOnly={true} />
          </div>
          <div className="min-w-0 w-full">
            <FuturePanel
              future={future}
              onPersistPerpetuityRate={handlePersistPerpetuityRate}
              isPersistingPerpetuityRate={updatingPerpetuityRate}
            />
          </div>
          <div className="min-w-0 w-full">
            <ExecutiveDashboard input={input} control={control} succession={succession} planCreatedAt={planCreatedAt} readOnly />
          </div>
        </>
      ) : (
        <SectionCard
          eyebrow="Dashboard"
          title="Clientes cadastrados"
          description="No carregamento inicial o dashboard mostra apenas a lista de clientes. Clique em um item para abrir a visualizacao completa."
        >
          <ContactStatusOverview
            summary={contactStatusSummary}
            activeFilter={contactFilter}
            onFilterChange={setContactFilter}
          />

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
                    const globalSavingsProgress = getPlanGlobalSavingsProgress(plan);
                    return (
                      <div
                        key={plan.id}
                        className="flex flex-col gap-4 rounded-[22px] border border-slate/10 bg-white px-5 py-4 shadow-[0_10px_25px_rgba(23,38,50,0.04)] transition hover:border-[#173d5d]/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex min-w-0 flex-wrap items-center gap-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleSelectPlan(plan.id)}
                              className="group flex min-w-0 items-center gap-3 text-left transition"
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
                            <button
                              type="button"
                              onClick={() => handleOpenGoalsModal(plan, 'goals')}
                              title={`Meta global: ${formatCurrency(plan.globalSavingsGoal ?? 0)} | Aportado: ${formatCurrency(plan.globalSavingsContributed ?? 0)}`}
                              className="shrink-0 rounded-full border border-[#173d5d]/10 bg-[#eef4fb] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#355f9b] transition hover:border-[#173d5d]/25 hover:bg-[#dfeaf6]"
                            >
                              Meta global {formatPercent(globalSavingsProgress)}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenGoalsModal(plan, 'contribution')}
                              className="shrink-0 rounded-full bg-[#173d5d] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#24577f]"
                            >
                              + Aporte
                            </button>
                          </div>
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

          {goalsModal ? createPortal((
            <div className="fixed inset-0 z-50 h-dvh w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#f7fafc] p-0 text-slate">
              <div className="box-border flex min-h-dvh w-full max-w-full flex-col gap-4 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
                <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-3 border-b border-slate/10 bg-[#f7fafc]/95 py-3 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#355f9b]">
                      {isContributionModalView(goalsModal.initialView) ? 'Aportes e metas' : 'Metas do cliente'}
                    </p>
                    <h3 className="mt-1 font-display text-3xl text-[#173d5d]">
                      {isContributionModalView(goalsModal.initialView) ? `Controle de aportes - ${goalsModal.clientName}` : goalsModal.clientName}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isContributionModalView(goalsModal.initialView) ? (
                      <button
                        type="button"
                        onClick={() => handleOpenGoalsGoalEditor(goalsModal.initialView === 'goalEditor' ? goalsGoalReturnView : goalsModal.initialView)}
                        disabled={savingGoalsGoal}
                        className="rounded-full bg-[#173d5d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24577f] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        Criar Nova Meta
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleCloseGoalsModal}
                      className="rounded-full border border-slate/10 bg-white px-5 py-3 text-sm font-semibold text-slate transition hover:border-[#173d5d]/20"
                    >
                      Fechar
                    </button>
                  </div>
                </div>

                {goalsModal.initialView === 'contribution' ? (
                  <div className="w-full max-w-full overflow-hidden rounded-[20px] border border-[#173d5d]/10 bg-white p-5 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">Lancamento de aporte</p>
                        <h4 className="mt-1 font-display text-2xl text-[#173d5d]">Registrar novo aporte</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenGoalsContributionEditor}
                        className="rounded-full bg-[#173d5d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24577f]"
                      >
                        + Aporte
                      </button>
                    </div>
                  </div>
                ) : null}

                {goalsModal.initialView === 'goalEditor' ? (
                  <div className="w-full max-w-full overflow-hidden rounded-[20px] border border-[#173d5d]/10 bg-white p-5 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">{editingGoalsGoalId ? 'Meta salva' : 'Nova meta'}</p>
                        <h4 className="mt-1 font-display text-2xl text-[#173d5d]">{editingGoalsGoalId ? 'Editar meta' : 'Criar Nova Meta'}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGoalsModal((currentModal) => currentModal ? { ...currentModal, initialView: goalsGoalReturnView } : currentModal)}
                        disabled={savingGoalsGoal}
                        className="rounded-full border border-slate/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate transition hover:border-[#173d5d]/20 disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        Voltar
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(180px,0.6fr)_auto] lg:items-end">
                      <label className="grid min-w-0 gap-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Nome da meta</span>
                        <input
                          value={goalsGoalDraft.title}
                          onChange={(event) => setGoalsGoalDraft((draft) => ({ ...draft, title: event.target.value }))}
                          data-field-path="dashboardGoal.title"
                          className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 text-sm font-semibold text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
                          placeholder="Ex: Viagem para Europa"
                          autoFocus
                        />
                      </label>
                      <label className="grid min-w-0 gap-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Valor da meta</span>
                        <LocalizedNumberInput
                          value={goalsGoalDraft.amount}
                          onChange={(event) => setGoalsGoalDraft((draft) => ({ ...draft, amount: event.target.value }))}
                          step="0.01"
                          fieldPath="dashboardGoal.amount"
                          clearOnFocus
                          className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 font-display text-xl leading-tight text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveGoalsGoal}
                        disabled={savingGoalsGoal || !goalsModal.input || !goalsGoalDraft.title.trim() || toNumber(goalsGoalDraft.amount) <= 0}
                        className="h-[46px] rounded-[14px] bg-[#173d5d] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#24577f] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {savingGoalsGoal ? 'Salvando...' : editingGoalsGoalId ? 'Salvar alteracao' : 'Salvar meta'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {goalsModal.initialView === 'contributionEditor' ? (
                  <div className="w-full max-w-full overflow-hidden rounded-[20px] border border-[#173d5d]/10 bg-white p-5 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">{editingGoalsContribution ? 'Editar aporte' : 'Salvar aporte'}</p>
                        <h4 className="mt-1 font-display text-2xl text-[#173d5d]">{editingGoalsContribution ? 'Editar aporte salvo' : `Novo aporte para ${goalsModal.clientName}`}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGoalsModal((currentModal) => currentModal ? { ...currentModal, initialView: 'contribution' } : currentModal)}
                        className="rounded-full border border-slate/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate transition hover:border-[#173d5d]/20"
                      >
                        Voltar ao resumo
                      </button>
                    </div>

                    <div className="mt-4 grid w-full max-w-full grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3 lg:items-end">
                      <label className="grid min-w-0 gap-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Valor do aporte</span>
                        <LocalizedNumberInput
                          value={goalsContributionDraft.amount}
                          onChange={(event) => setGoalsContributionDraft((draft) => ({ ...draft, amount: event.target.value }))}
                          step="0.01"
                          fieldPath="dashboardContribution.amount"
                          clearOnFocus
                          className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 font-display text-xl leading-tight text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
                        />
                      </label>
                      <label className="grid min-w-0 gap-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Data do aporte</span>
                        <input
                          type="date"
                          value={goalsContributionDraft.date}
                          onChange={(event) => setGoalsContributionDraft((draft) => ({ ...draft, date: event.target.value }))}
                          data-field-path="dashboardContribution.date"
                          className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 text-sm font-semibold text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
                        />
                      </label>
                      <label className="grid min-w-0 gap-1.5">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Usar em qual meta?</span>
                        <select
                          value={goalsContributionDraft.savingsGoalId}
                          onChange={(event) => setGoalsContributionDraft((draft) => ({ ...draft, savingsGoalId: event.target.value }))}
                          data-field-path="dashboardContribution.savingsGoalId"
                          className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 text-sm font-semibold text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
                        >
                          <option value="">Sem meta vinculada</option>
                          {goalsModal.summary.goalRows.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveGoalsContribution}
                        disabled={savingGoalsContribution || !goalsModal.input || toNumber(goalsContributionDraft.amount) <= 0}
                        className="h-[46px] w-full rounded-[14px] bg-[#173d5d] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#24577f] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        {savingGoalsContribution ? 'Salvando...' : editingGoalsContribution ? 'Salvar alteracao' : 'Salvar aporte'}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[20px] border border-slate/10 bg-white p-4 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/52">Meta global</p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                      <p className="font-display text-3xl text-[#173d5d]">{formatCurrency(goalsModal.summary.totalGoal)}</p>
                      <p className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#355f9b]">
                        {formatPercent(goalsModal.summary.totalProgress)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-slate/10 bg-white p-4 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/52">Aportado nas metas</p>
                    <p className="mt-2 font-display text-3xl text-[#173d5d]">{formatCurrency(goalsModal.summary.totalContributed)}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate/10 bg-white p-4 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/52">Metas cadastradas</p>
                    <p className="mt-2 font-display text-3xl text-[#173d5d]">{goalsModal.summary.goalRows.length}</p>
                  </div>
                </div>

                {loadingGoalsModal ? (
                  <div className="rounded-[20px] border border-slate/10 bg-white p-6 text-sm text-slate/65">
                    A carregar metas do cliente...
                  </div>
                ) : goalsModalError ? (
                  <div className="rounded-[20px] border border-[#c24d2c]/15 bg-[#fff4ef] p-6 text-sm text-[#9f3518]">
                    {goalsModalError}
                  </div>
                ) : goalsModal.summary.goalRows.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate/20 bg-white p-8 text-center text-slate/65">
                    Nenhuma meta cadastrada para este cliente.
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {goalsModal.summary.goalRows.map((goal) => (
                      <div key={goal.id} className="relative rounded-[20px] border border-slate/10 bg-white p-4 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-display text-2xl text-[#173d5d]">{goal.title}</p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate/45">
                              {goal.entries.length} aporte{goal.entries.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-bold text-[#355f9b]">
                              {formatCurrency(goal.amount)}
                            </span>
                            <VerticalDotsButton
                              label={`Opcoes da meta ${goal.title}`}
                              onClick={() => setActiveGoalsGoalMenuId(activeGoalsGoalMenuId === goal.id ? '' : goal.id)}
                              disabled={savingGoalsGoal}
                            />
                          </div>
                          {activeGoalsGoalMenuId === goal.id ? (
                            <div className="absolute right-4 top-14 z-20 grid min-w-[130px] gap-1 rounded-[14px] border border-slate/10 bg-white p-1.5 text-slate shadow-[0_18px_42px_rgba(23,38,50,0.16)]">
                              <button
                                type="button"
                                onClick={() => handleOpenGoalsGoalEditor(goalsModal.initialView, goal)}
                                className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-slate transition hover:bg-[#eef4fb]"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGoalsGoal(goal)}
                                className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-[#c24d2c] transition hover:bg-[#fff4ef]"
                              >
                                Excluir
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate/10">
                          <div className="h-full rounded-full bg-[#3dc259]" style={{ width: `${goal.progress}%` }} />
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-[14px] bg-[#f7fafc] px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate/45">Aportado</p>
                            <p className="mt-1 font-semibold text-[#173d5d]">{formatCurrency(goal.contributed)}</p>
                          </div>
                          <div className="rounded-[14px] bg-[#f7fafc] px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate/45">Restante</p>
                            <p className="mt-1 font-semibold text-[#173d5d]">{formatCurrency(goal.remaining)}</p>
                          </div>
                          <div className="rounded-[14px] bg-[#f7fafc] px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate/45">Progresso</p>
                            <p className="mt-1 font-semibold text-[#173d5d]">{Math.round(goal.progress)}%</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {goal.entries.length === 0 ? (
                            <p className="rounded-[14px] border border-dashed border-slate/15 bg-[#f7fafc] px-3 py-3 text-sm text-slate/55">
                              Nenhum aporte vinculado a esta meta.
                            </p>
                          ) : (
                            goal.entries.map((entry, entryIndex) => {
                              const menuKey = `${entry.monthIndex}-${entry.id || entryIndex}`;

                              return (
                                <div key={entry.id || entryIndex} className="relative flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-slate/10 bg-[#f7fafc] px-3 py-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate">{entry.month}</p>
                                    <p className="text-xs text-slate/55">{entry.date ? formatDateOnly(entry.date) : 'Sem data'}</p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <p className="font-display text-lg text-[#173d5d]">{formatCurrency(entry.amount)}</p>
                                    <VerticalDotsButton
                                      label={`Opcoes do aporte ${entryIndex + 1} de ${entry.month}`}
                                      onClick={() => setActiveGoalsContributionMenuKey(activeGoalsContributionMenuKey === menuKey ? '' : menuKey)}
                                      disabled={savingGoalsContribution}
                                    />
                                  </div>
                                  {activeGoalsContributionMenuKey === menuKey ? (
                                    <div className="absolute right-3 top-11 z-20 grid min-w-[120px] gap-1 rounded-[14px] border border-slate/10 bg-white p-1.5 text-slate shadow-[0_18px_42px_rgba(23,38,50,0.16)]">
                                      <button
                                        type="button"
                                        onClick={() => handleEditGoalsContribution(entry)}
                                        className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-slate transition hover:bg-[#eef4fb]"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteGoalsContribution(entry)}
                                        className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-[#c24d2c] transition hover:bg-[#fff4ef]"
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {goalsModal.summary.unlinkedEntries.length > 0 ? (
                  <div className="rounded-[20px] border border-slate/10 bg-white p-4 shadow-[0_14px_30px_rgba(23,38,50,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/52">Sem categoria</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {goalsModal.summary.unlinkedEntries.map((entry, entryIndex) => {
                        const menuKey = `${entry.monthIndex}-${entry.id || entryIndex}`;

                        return (
                          <div key={entry.id || entryIndex} className="relative flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-slate/10 bg-[#f7fafc] px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-slate">{entry.month}</p>
                              <p className="text-xs text-slate/55">{entry.date ? formatDateOnly(entry.date) : 'Sem data'}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <p className="font-display text-lg text-[#173d5d]">{formatCurrency(entry.amount)}</p>
                              <VerticalDotsButton
                                label={`Opcoes do aporte sem meta ${entryIndex + 1}`}
                                onClick={() => setActiveGoalsContributionMenuKey(activeGoalsContributionMenuKey === menuKey ? '' : menuKey)}
                                disabled={savingGoalsContribution}
                              />
                            </div>
                            {activeGoalsContributionMenuKey === menuKey ? (
                              <div className="absolute right-3 top-11 z-20 grid min-w-[120px] gap-1 rounded-[14px] border border-slate/10 bg-white p-1.5 text-slate shadow-[0_18px_42px_rgba(23,38,50,0.16)]">
                                <button
                                  type="button"
                                  onClick={() => handleEditGoalsContribution(entry)}
                                  className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-slate transition hover:bg-[#eef4fb]"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGoalsContribution(entry)}
                                  className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-[#c24d2c] transition hover:bg-[#fff4ef]"
                                >
                                  Excluir
                                </button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ), document.body) : null}

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
