import { useEffect, useState } from 'react';
import {
  buildDefaultMonthlyContributions,
  contributionMonthLabels,
  normalizeSavingsGoals,
  protectionLayerFields,
  sumSavingsGoals
} from '@yield-360/shared';
import { LocalizedNumberInput } from './LocalizedNumberInput.jsx';
import { SectionCard } from './SectionCard.jsx';
import { ProtectionColumns } from './executive-dashboard/ProtectionColumns.jsx';
import { formatDateOnly, formatPercent, formatTableNumber } from '../lib/formatters.js';

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const contributionMonthIndexByKey = contributionMonthLabels.reduce((indexes, month, index) => {
  indexes[normalizeKey(month)] = index;
  return indexes;
}, {});

function buildLocalDateInputValue() {
  const today = new Date();
  const year = String(today.getFullYear());
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidContributionDate(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return false;
  }

  const [year, month, day] = normalizedValue.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

function normalizeStoredContributionDate(value) {
  return isValidContributionDate(value) ? String(value).trim() : '';
}

function normalizeContributionDate(value, fallback = buildLocalDateInputValue()) {
  return normalizeStoredContributionDate(value) || fallback;
}

function resolveContributionMonthIndex(value) {
  return Number(normalizeContributionDate(value).slice(5, 7)) - 1;
}

function resolveContributionMonthIndexFromLabel(value) {
  const normalizedValue = normalizeKey(value);

  if (normalizedValue in contributionMonthIndexByKey) {
    return contributionMonthIndexByKey[normalizedValue];
  }

  const placeholderMatch = normalizedValue.match(/^mes\s+(\d+)$/i);

  if (!placeholderMatch) {
    return null;
  }

  const placeholderIndex = Number(placeholderMatch[1]) - 1;
  return placeholderIndex >= 0 && placeholderIndex < contributionMonthLabels.length ? placeholderIndex : null;
}

function resolveContributionMonthIndexFromItem(item, fallbackIndex) {
  const monthIndexFromDate = isValidContributionDate(item?.date)
    ? Number(String(item.date).slice(5, 7)) - 1
    : null;

  if (monthIndexFromDate != null) {
    return monthIndexFromDate;
  }

  const monthIndexFromLabel = resolveContributionMonthIndexFromLabel(item?.month);

  if (monthIndexFromLabel != null) {
    return monthIndexFromLabel;
  }

  return fallbackIndex >= 0 && fallbackIndex < contributionMonthLabels.length ? fallbackIndex : null;
}

function normalizeMonthlyContributions(items = []) {
  const normalizedItems = buildDefaultMonthlyContributions();

  if (!Array.isArray(items)) {
    return normalizedItems;
  }

  items.forEach((item, index) => {
    const monthIndex = resolveContributionMonthIndexFromItem(item, index);

    if (monthIndex == null) {
      return;
    }

    const fallbackDate = normalizeStoredContributionDate(item?.date);
    const fallbackGoalId = String(item?.savingsGoalId ?? '').trim();
    const sourceEntries = Array.isArray(item?.entries) && item.entries.length > 0
      ? item.entries
      : Math.max(0, toNumber(item?.amount)) > 0 || fallbackDate
        ? [{ id: item?.id, amount: item?.amount, date: fallbackDate, savingsGoalId: fallbackGoalId }]
        : [];
    const nextEntries = sourceEntries
      .map((entry, entryIndex) => ({
        id: String(entry?.id ?? `${contributionMonthLabels[monthIndex]}-${entryIndex}`).trim() || `${contributionMonthLabels[monthIndex]}-${entryIndex}`,
        amount: Math.max(0, toNumber(entry?.amount)),
        date: normalizeStoredContributionDate(entry?.date) || fallbackDate,
        savingsGoalId: String(entry?.savingsGoalId ?? fallbackGoalId).trim()
      }))
      .filter((entry) => entry.amount > 0 || entry.date || entry.savingsGoalId);

    if (nextEntries.length === 0) {
      return;
    }

    const currentItem = normalizedItems[monthIndex];
    const entries = [...(currentItem.entries ?? []), ...nextEntries];
    const amount = entries.reduce((total, entry) => total + toNumber(entry?.amount), 0);
    const latestEntry = entries.at(-1);

    normalizedItems[monthIndex] = {
      month: contributionMonthLabels[monthIndex],
      amount,
      date: latestEntry?.date ?? '',
      savingsGoalId: latestEntry?.savingsGoalId ?? '',
      entries
    };
  });

  return normalizedItems;
}

function getContributionStatus(amount, monthlyTarget) {
  const remaining = Math.max(monthlyTarget - amount, 0);
  const overage = Math.max(amount - monthlyTarget, 0);

  if (amount <= 0) {
    return {
      tone: 'danger',
      label: 'Sem aporte',
      deltaLabel: monthlyTarget > 0 ? `Faltam ${formatTableNumber(monthlyTarget)}` : 'Sem valor lancado'
    };
  }

  if (amount >= monthlyTarget) {
    return {
      tone: 'success',
      label: amount > monthlyTarget ? 'Meta superada' : 'Meta atingida',
      deltaLabel: overage > 0 ? `Excedente ${formatTableNumber(overage)}` : 'Na meta planejada'
    };
  }

  return {
    tone: 'warning',
    label: 'Abaixo da meta',
    deltaLabel: `Faltam ${formatTableNumber(remaining)}`
  };
}

function glassPanelClassName() {
  return 'rounded-[20px] border border-[#173d5d]/10 bg-white shadow-[0_18px_36px_rgba(23,61,93,0.08)]';
}

function tallTrackingPanelHeightClassName() {
  return 'lg:h-[640px]';
}

function normalizePlanCreatedAt(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function buildVisibleMonthlyContributions(monthlyContributions, planCreatedAt) {
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const createdAt = normalizePlanCreatedAt(planCreatedAt);

  if (!createdAt) {
    return [monthlyContributions[currentMonthIndex] ?? monthlyContributions[0]].filter(Boolean);
  }

  const monthSpan = (today.getFullYear() - createdAt.getFullYear()) * 12 + (today.getMonth() - createdAt.getMonth());
  const visibleCount = Math.min(Math.max(monthSpan + 1, 1), 12);

  return Array.from({ length: visibleCount }, (_, index) => {
    const offset = visibleCount - 1 - index;
    const monthIndex = (currentMonthIndex - offset + 12) % 12;
    return monthlyContributions[monthIndex];
  }).filter(Boolean);
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

function ProgressBar({ value, totalContributed, target }) {
  const clampedValue = Math.min(Math.max(Number(value ?? 0), 0), 100);

  return (
    <div className={`${glassPanelClassName()} flex h-full flex-col justify-between p-3.5`}>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[#173d5d]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60">Progresso dos aportes</p>
        <p className="font-display text-2xl leading-none text-[#173d5d]">{formatPercent(value)}</p>
      </div>
      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-[#e8eef5]">
          <div className="h-full bg-gradient-to-r from-[#5fae2b] to-[#9adf52]" style={{ width: `${clampedValue}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-slate/45">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate/58">
        <span>Aportado: <span className="font-semibold text-[#173d5d]">{formatTableNumber(totalContributed)}</span></span>
        <span>Meta anual: <span className="font-semibold text-[#173d5d]">{formatTableNumber(target)}</span></span>
      </div>
    </div>
  );
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

function createSavingsGoal() {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return { id, title: '', amount: 0 };
}

function getSavingsGoalLabel(goal, index) {
  return String(goal?.title ?? '').trim() || `Meta ${index + 1}`;
}

function findSavingsGoalLabel(goals, goalId) {
  const normalizedGoalId = String(goalId ?? '').trim();

  if (!normalizedGoalId) {
    return 'Sem meta vinculada';
  }

  const goalIndex = goals.findIndex((goal) => goal.id === normalizedGoalId);

  if (goalIndex === -1) {
    return 'Meta nao encontrada';
  }

  return getSavingsGoalLabel(goals[goalIndex], goalIndex);
}

function SavingsGoalsCard({ goals, readOnly, onFieldChange, onSaveGoals, isSavingGoals = false, onOpenContributions }) {
  const normalizedGoals = normalizeSavingsGoals(goals);
  const globalGoal = sumSavingsGoals(normalizedGoals);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState(null);
  const [activeGoalMenuIndex, setActiveGoalMenuIndex] = useState(null);
  const [draftGoalTitle, setDraftGoalTitle] = useState('');
  const [draftGoalAmount, setDraftGoalAmount] = useState(0);

  function persistGoals(nextGoals) {
    onFieldChange?.('planning.savingsGoals', nextGoals);
  }

  function resetDraftGoal() {
    setEditingGoalIndex(null);
    setActiveGoalMenuIndex(null);
    setDraftGoalTitle('');
    setDraftGoalAmount(0);
  }

  function handleOpenGoalModal() {
    resetDraftGoal();
    setIsGoalModalOpen(true);
  }

  function handleEditGoal(goalIndex) {
    const goal = normalizedGoals[goalIndex];

    if (!goal) {
      return;
    }

    setEditingGoalIndex(goalIndex);
    setActiveGoalMenuIndex(null);
    setDraftGoalTitle(goal.title);
    setDraftGoalAmount(goal.amount);
    setIsGoalModalOpen(true);
  }

  function handleCloseGoalModal() {
    if (isSavingGoals) {
      return;
    }

    resetDraftGoal();
    setIsGoalModalOpen(false);
  }

  async function handleSaveGoal() {
    const nextGoal = {
      ...(editingGoalIndex == null ? createSavingsGoal() : normalizedGoals[editingGoalIndex]),
      title: draftGoalTitle,
      amount: Math.max(0, toNumber(draftGoalAmount))
    };
    const nextGoals = editingGoalIndex == null
      ? [...normalizedGoals, nextGoal]
      : normalizedGoals.map((goal, index) => (index === editingGoalIndex ? nextGoal : goal));

    persistGoals(nextGoals);

    if (onSaveGoals) {
      await onSaveGoals(nextGoals);
    }

    resetDraftGoal();
    setIsGoalModalOpen(false);
  }

  async function handleDeleteGoal(goalIndex) {
    const goal = normalizedGoals[goalIndex];

    if (!window.confirm(`Excluir a meta "${getSavingsGoalLabel(goal, goalIndex)}"?`)) {
      setActiveGoalMenuIndex(null);
      return;
    }

    const nextGoals = normalizedGoals.filter((_, index) => index !== goalIndex);
    setActiveGoalMenuIndex(null);

    persistGoals(nextGoals);

    if (onSaveGoals) {
      await onSaveGoals(nextGoals);
    }
  }

  const canSaveDraftGoal = draftGoalTitle.trim().length > 0 && toNumber(draftGoalAmount) > 0;
  const goalModalTitle = editingGoalIndex == null ? 'Adicionar meta' : 'Editar meta';

  return (
    <div className={`${glassPanelClassName()} p-3.5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60">Metas do cliente</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#355f9b]">Meta global</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl text-[#173d5d]">{formatTableNumber(globalGoal)}</p>
            <button
              type="button"
              onClick={onOpenContributions}
              className="rounded-full bg-[#173d5d] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#24577f]"
            >
              + Aporte
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(190px,0.55fr)_minmax(0,1fr)]">
        <div className="rounded-[16px] border border-[#173d5d]/10 bg-[#f7fafc] p-3">
          {!readOnly ? (
            <button
              type="button"
              onClick={handleOpenGoalModal}
              className="h-[44px] w-full rounded-[14px] bg-[#173d5d] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#24577f]"
            >
              Adicionar nova meta
            </button>
          ) : null}
        </div>

        <div className="rounded-[16px] border border-[#173d5d]/10 bg-[#f7fafc] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate/48">Metas salvas</p>
          <div className="mt-2 grid gap-2">
            {normalizedGoals.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-slate/15 bg-white px-3 py-4 text-sm text-slate/58">
                Nenhuma meta cadastrada.
              </p>
            ) : (
              normalizedGoals.map((goal, index) => (
                <div key={goal.id || index} className="relative flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-[14px] border border-slate/10 bg-white px-3 py-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-slate">{getSavingsGoalLabel(goal, index)}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-[#eef4fb] px-2.5 py-1 text-xs font-bold text-[#355f9b]">
                      {formatTableNumber(goal.amount)}
                    </span>
                    {!readOnly ? (
                      <VerticalDotsButton
                        label={`Opcoes da meta ${getSavingsGoalLabel(goal, index)}`}
                        onClick={() => setActiveGoalMenuIndex(activeGoalMenuIndex === index ? null : index)}
                        disabled={isSavingGoals}
                      />
                    ) : null}
                  </div>
                  {activeGoalMenuIndex === index ? (
                    <div className="absolute right-3 top-11 z-20 grid min-w-[130px] gap-1 rounded-[14px] border border-slate/10 bg-white p-1.5 shadow-[0_18px_42px_rgba(23,38,50,0.16)]">
                      <button
                        type="button"
                        onClick={() => handleEditGoal(index)}
                        className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-slate transition hover:bg-[#eef4fb]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(index)}
                        className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-[#c24d2c] transition hover:bg-[#fff4ef]"
                      >
                        Excluir
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isGoalModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-[24px] border border-slate/10 bg-white p-5 shadow-[0_24px_70px_rgba(23,38,50,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/52">{editingGoalIndex == null ? 'Nova meta' : 'Meta salva'}</p>
                <h3 className="mt-1 font-display text-2xl text-[#173d5d]">{goalModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseGoalModal}
                disabled={isSavingGoals}
                className="rounded-full border border-slate/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate/58 transition hover:border-slate/25 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate/55">
                Titulo
                <input
                  className="min-w-0 rounded-xl border border-slate/10 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate outline-none transition focus:border-deep focus:ring-4 focus:ring-deep/10"
                  value={draftGoalTitle}
                  onChange={(event) => setDraftGoalTitle(event.target.value)}
                  data-field-path="planning.newSavingsGoal.title"
                  placeholder="Ex: Viagem para Europa"
                  autoFocus
                />
              </label>
              <label className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate/55">
                Valor
                <LocalizedNumberInput
                  value={draftGoalAmount}
                  step="0.01"
                  onChange={(event) => setDraftGoalAmount(event.target.value)}
                  fieldPath="planning.newSavingsGoal.amount"
                  clearOnFocus
                  className="min-w-0 rounded-xl border border-slate/10 bg-white px-3 py-2 text-sm font-medium text-slate outline-none transition focus:border-deep focus:ring-4 focus:ring-deep/10"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseGoalModal}
                disabled={isSavingGoals}
                className="rounded-full border border-slate/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate transition hover:border-slate/25 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={!canSaveDraftGoal || isSavingGoals}
                className="rounded-full bg-[#173d5d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24577f] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSavingGoals ? 'Salvando...' : 'Salvar meta'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CurrentContributionCard({
  readOnly,
  monthlyTarget,
  contributionAmount,
  contributionDate,
  contributionEntryDate,
  contributionGoalId,
  savingsGoals = [],
  onSaveContribution,
  isSavingContribution = false
}) {
  const normalizedSavingsGoals = normalizeSavingsGoals(savingsGoals);
  const [draftAmount, setDraftAmount] = useState(0);
  const [draftDate, setDraftDate] = useState(() => contributionEntryDate || contributionDate);
  const [draftGoalId, setDraftGoalId] = useState('');

  useEffect(() => {
    setDraftDate(contributionEntryDate || contributionDate);
  }, [contributionDate, contributionEntryDate]);

  const previewDate = normalizeContributionDate(draftDate);
  const previewMonthIndex = resolveContributionMonthIndex(previewDate);
  const previewMonthLabel = contributionMonthLabels[previewMonthIndex] ?? contributionMonthLabels[0];
  const canSaveContribution = toNumber(draftAmount) > 0;

  function handleDraftDateChange(event) {
    const nextDate = normalizeContributionDate(event.target.value);

    setDraftDate(nextDate);
    setDraftAmount(0);
    setDraftGoalId('');
  }

  function handleSaveContribution() {
    onSaveContribution?.({
      amount: Math.max(0, toNumber(draftAmount)),
      date: previewDate,
      savingsGoalId: draftGoalId
    });
    setDraftAmount(0);
    setDraftGoalId('');
  }

  return (
    <div className={`${glassPanelClassName()} h-full p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60">Aporte do mes</p>
          <p className="mt-1 text-xs text-slate/58">
            {readOnly ? `Ultimo registro vinculado a ${previewMonthLabel}.` : `Lancamento sera aplicado em ${previewMonthLabel}.`}
          </p>
        </div>
        <span className="rounded-full border border-[#355f9b]/12 bg-[#eef4fb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#355f9b]">
          Meta mensal {formatTableNumber(monthlyTarget)}
        </span>
      </div>

      {readOnly ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[16px] border border-[#173d5d]/10 bg-[#f8fbfe] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Valor</p>
            <p className="mt-1 font-display text-2xl text-[#173d5d]">{formatTableNumber(contributionAmount)}</p>
          </div>
          <div className="rounded-[16px] border border-[#173d5d]/10 bg-[#f8fbfe] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Data</p>
            <p className="mt-1 text-sm font-semibold text-[#173d5d]">{formatDateOnly(contributionEntryDate || contributionDate)}</p>
          </div>
          <div className="rounded-[16px] border border-[#173d5d]/10 bg-[#f8fbfe] px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Meta</p>
            <p className="mt-1 text-sm font-semibold text-[#173d5d]">{findSavingsGoalLabel(normalizedSavingsGoals, contributionGoalId)}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3">
          <label className="grid min-w-0 gap-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Valor do aporte</span>
            <LocalizedNumberInput
              value={draftAmount}
              onChange={(event) => setDraftAmount(event.target.value)}
              step="0.01"
              fieldPath="control.pendingContributionAmount"
              clearOnFocus
              className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 font-display text-xl leading-tight text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
            />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Data do aporte</span>
            <input
              type="date"
              value={previewDate}
              onChange={handleDraftDateChange}
              data-field-path="control.pendingContributionDate"
              className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 text-sm font-semibold text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
            />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/48">Usar em qual meta?</span>
            <select
              value={draftGoalId}
              onChange={(event) => setDraftGoalId(event.target.value)}
              data-field-path="control.pendingContributionSavingsGoalId"
              className="min-w-0 w-full rounded-[14px] border border-[#173d5d]/12 bg-white px-3 py-2.5 text-sm font-semibold text-[#173d5d] outline-none transition focus:border-[#355f9b]/40 focus:ring-4 focus:ring-[#355f9b]/10"
            >
              <option value="">Sem meta vinculada</option>
              {normalizedSavingsGoals.map((goal, index) => (
                <option key={goal.id || index} value={goal.id}>
                  {getSavingsGoalLabel(goal, index)}
                </option>
              ))}
            </select>
          </label>
          <div className="col-span-full flex justify-start sm:justify-end">
            <button
              type="button"
              onClick={handleSaveContribution}
              disabled={!canSaveContribution || isSavingContribution || !onSaveContribution}
              className="h-[46px] w-full rounded-[14px] border border-[#173d5d]/15 bg-[#173d5d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#21496d] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
            >
              {isSavingContribution ? 'Salvando...' : 'Salvar aporte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyContributionStatusGrid({
  monthlyContributions,
  monthlyTarget,
  savingsGoals = [],
  onUpdateContribution,
  onDeleteContribution,
  isDeletingContribution = false
}) {
  const normalizedSavingsGoals = normalizeSavingsGoals(savingsGoals);
  const [activeContributionMenuKey, setActiveContributionMenuKey] = useState('');
  const [editingContribution, setEditingContribution] = useState(null);
  const [draftContributionAmount, setDraftContributionAmount] = useState(0);
  const [draftContributionDate, setDraftContributionDate] = useState('');
  const [draftContributionGoalId, setDraftContributionGoalId] = useState('');
  const toneClasses = {
    success: 'border-[#cae7d1] bg-[linear-gradient(180deg,#fbfefb_0%,#edf8ef_100%)] text-[#237541]',
    warning: 'border-[#ecdca8] bg-[linear-gradient(180deg,#fffdf6_0%,#fff6dc_100%)] text-[#9b6c05]',
    danger: 'border-[#efcfcb] bg-[linear-gradient(180deg,#fff8f6_0%,#ffe9e4_100%)] text-[#b44529]'
  };

  function handleEditContribution(monthIndex, entry) {
    setActiveContributionMenuKey('');
    setEditingContribution({ monthIndex, id: entry.id });
    setDraftContributionAmount(entry.amount);
    setDraftContributionDate(normalizeContributionDate(entry.date));
    setDraftContributionGoalId(entry.savingsGoalId ?? '');
  }

  function handleCloseContributionModal() {
    if (isDeletingContribution) {
      return;
    }

    setEditingContribution(null);
    setDraftContributionAmount(0);
    setDraftContributionDate('');
    setDraftContributionGoalId('');
  }

  function handleSaveContributionEdit() {
    if (!editingContribution) {
      return;
    }

    onUpdateContribution?.(editingContribution.monthIndex, editingContribution.id, {
      amount: Math.max(0, toNumber(draftContributionAmount)),
      date: normalizeContributionDate(draftContributionDate),
      savingsGoalId: draftContributionGoalId
    });
    handleCloseContributionModal();
  }

  function handleDeleteContribution(monthIndex, entry) {
    setActiveContributionMenuKey('');

    if (!window.confirm(`Excluir o aporte de ${formatTableNumber(entry.amount)}?`)) {
      return;
    }

    onDeleteContribution?.(monthIndex, entry.id);
  }

  return (
    <div className={`${glassPanelClassName()} ${tallTrackingPanelHeightClassName()} flex flex-col p-3.5`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2.5">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#173d5d]">Aportes por mes</p>
          <p className="mt-1 text-[11px] leading-5 text-slate/52">Verde quando bate a meta mensal, amarelo quando fica abaixo e vermelho quando nao ha aporte.</p>
        </div>
        <span className="rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate/52">
          Meta: {formatTableNumber(monthlyTarget)}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(148px,1fr))]">
        {monthlyContributions.map((item) => {
          const status = getContributionStatus(item.amount, monthlyTarget);
          const monthIndex = contributionMonthLabels.indexOf(item.month);
          const entries = item.entries ?? [];

          return (
            <div
              key={item.month}
              className={`flex min-h-[132px] flex-col rounded-[16px] border px-3 py-2.5 shadow-[0_10px_18px_rgba(23,61,93,0.04)] ${toneClasses[status.tone]}`}
            >
              <div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em]">{item.month}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] opacity-70">{status.label}</p>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] opacity-80">{status.deltaLabel}</p>
                  {item.date ? <p className="mt-1 text-[10px] opacity-70">{formatDateOnly(item.date)}</p> : null}
                </div>
              </div>
              {entries.length > 0 ? (
                <div className="mt-2 grid gap-1.5">
                  {entries.map((entry, entryIndex) => (
                    <div key={entry.id || entryIndex} className="relative rounded-[12px] bg-white/75 px-2 py-1.5 text-[10px] shadow-[0_8px_16px_rgba(255,255,255,0.22)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold">{formatTableNumber(entry.amount)}</p>
                          <p className="truncate opacity-75">{findSavingsGoalLabel(normalizedSavingsGoals, entry.savingsGoalId)}</p>
                          {entry.date ? <p className="opacity-60">{formatDateOnly(entry.date)}</p> : null}
                        </div>
                        {onUpdateContribution || onDeleteContribution ? (
                          <VerticalDotsButton
                            label={`Opcoes do aporte ${entryIndex + 1} de ${item.month}`}
                            onClick={() => {
                              const menuKey = `${monthIndex}-${entry.id || entryIndex}`;
                              setActiveContributionMenuKey(activeContributionMenuKey === menuKey ? '' : menuKey);
                            }}
                            disabled={isDeletingContribution || monthIndex < 0}
                          />
                        ) : null}
                      </div>
                      {activeContributionMenuKey === `${monthIndex}-${entry.id || entryIndex}` ? (
                        <div className="absolute right-2 top-9 z-20 grid min-w-[120px] gap-1 rounded-[14px] border border-slate/10 bg-white p-1.5 text-slate shadow-[0_18px_42px_rgba(23,38,50,0.16)]">
                          {onUpdateContribution ? (
                            <button
                              type="button"
                              onClick={() => handleEditContribution(monthIndex, entry)}
                              className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-slate transition hover:bg-[#eef4fb]"
                            >
                              Editar
                            </button>
                          ) : null}
                          {onDeleteContribution ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteContribution(monthIndex, entry)}
                              className="rounded-[10px] px-3 py-2 text-left text-xs font-semibold text-[#c24d2c] transition hover:bg-[#fff4ef]"
                            >
                              Excluir
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-auto pt-3">
                <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 font-display text-lg font-semibold leading-none shadow-[0_8px_18px_rgba(255,255,255,0.35)] sm:text-[1.45rem]">
                  {formatTableNumber(item.amount)}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {editingContribution ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-[24px] border border-slate/10 bg-white p-5 text-slate shadow-[0_24px_70px_rgba(23,38,50,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/52">Aporte realizado</p>
                <h3 className="mt-1 font-display text-2xl text-[#173d5d]">Editar aporte</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseContributionModal}
                disabled={isDeletingContribution}
                className="rounded-full border border-slate/10 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate/58 transition hover:border-slate/25 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate/55">
                Valor
                <LocalizedNumberInput
                  value={draftContributionAmount}
                  step="0.01"
                  onChange={(event) => setDraftContributionAmount(event.target.value)}
                  fieldPath="control.editContribution.amount"
                  clearOnFocus
                  className="min-w-0 rounded-xl border border-slate/10 bg-white px-3 py-2 text-sm font-medium text-slate outline-none transition focus:border-deep focus:ring-4 focus:ring-deep/10"
                />
              </label>
              <label className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate/55">
                Data
                <input
                  type="date"
                  value={draftContributionDate}
                  onChange={(event) => setDraftContributionDate(event.target.value)}
                  className="min-w-0 rounded-xl border border-slate/10 bg-white px-3 py-2 text-sm font-medium text-slate outline-none transition focus:border-deep focus:ring-4 focus:ring-deep/10"
                  data-field-path="control.editContribution.date"
                />
              </label>
              <label className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate/55">
                Meta
                <select
                  value={draftContributionGoalId}
                  onChange={(event) => setDraftContributionGoalId(event.target.value)}
                  className="min-w-0 rounded-xl border border-slate/10 bg-white px-3 py-2 text-sm font-medium text-slate outline-none transition focus:border-deep focus:ring-4 focus:ring-deep/10"
                  data-field-path="control.editContribution.savingsGoalId"
                >
                  <option value="">Sem meta vinculada</option>
                  {normalizedSavingsGoals.map((goal, index) => (
                    <option key={goal.id || index} value={goal.id}>
                      {getSavingsGoalLabel(goal, index)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseContributionModal}
                disabled={isDeletingContribution}
                className="rounded-full border border-slate/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate transition hover:border-slate/25 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveContributionEdit}
                disabled={toNumber(draftContributionAmount) <= 0 || isDeletingContribution || !onUpdateContribution}
                className="rounded-full bg-[#173d5d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24577f] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Salvar aporte
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ComparisonBars({ title, rows }) {
  const maxValue = Math.max(...rows.map((row) => Math.abs(Number(row.value ?? 0))), 1);

  return (
    <div className={`${glassPanelClassName()} p-3.5`}>
      <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#173d5d]">{title}</p>
      <div className="grid gap-2.5">
        {rows.map((row) => {
          const width = `${(Math.abs(Number(row.value ?? 0)) / maxValue) * 100}%`;

          return (
            <div key={row.label} className="grid gap-1">
              <div className="flex items-center justify-between gap-3 text-xs text-slate/65">
                <span className="leading-snug">{row.label}</span>
                <span className="font-semibold text-[#173d5d]">{formatTableNumber(row.value)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e8eef5]">
                <div className="h-full rounded-full" style={{ width, backgroundColor: row.color }} />
              </div>
            </div>
          );
        })}
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
    <div className={`${glassPanelClassName()} flex flex-col p-3.5 text-[#173d5d]`}>
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#355f9b]">Projecao</p>
        <p className="mt-1 font-display text-3xl">FUTURO</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative h-48 w-48 sm:h-52 sm:w-52">
          <div className="absolute inset-0 rounded-full" style={gaugeStyle} />
          <div className="absolute inset-[14px] rounded-full bg-white shadow-[0_10px_24px_rgba(23,61,93,0.08)]" />
          <div className="absolute inset-[27px] rounded-full border border-[#dbe5ef] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f8fe_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <p className="font-display text-[2rem] text-[#173d5d]">{formatPercent(value)}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate/55">
          Liberdade Financeira
        </p>
      </div>
    </div>
  );
}

export function ExecutiveDashboard({
  input,
  control,
  succession,
  planCreatedAt,
  readOnly = true,
  onFieldChange,
  onSaveContribution,
  onUpdateContribution,
  onDeleteContribution,
  isPersistingContribution = false,
  onSaveGoals,
  isSavingGoals = false
}) {
  const [isContributionsModalOpen, setIsContributionsModalOpen] = useState(false);

  if (!control) {
    return null;
  }

  const monthlyTarget = Math.max(0, toNumber(input.future?.agreedMonthlyContribution));
  const normalizedContributionDate = normalizeContributionDate(input.control?.currentContributionDate);
  const selectedMonthIndex = resolveContributionMonthIndex(normalizedContributionDate);
  const monthlyContributions = normalizeMonthlyContributions(
    input.control?.monthlyContributions?.length ? input.control.monthlyContributions : control.monthlyContributions
  );
  const visibleMonthlyContributions = buildVisibleMonthlyContributions(monthlyContributions, planCreatedAt);
  const selectedContribution = monthlyContributions[selectedMonthIndex] ?? monthlyContributions[0];
  const selectedContributionDate = normalizeStoredContributionDate(selectedContribution?.date) || normalizedContributionDate;
  const monthlyContributionsTotal = monthlyContributions.reduce((total, item) => total + item.amount, 0);
  const explicitTotalContributed = Math.max(0, toNumber(input.control?.totalContributed ?? control.totalContributed));
  const effectiveTotalContributed = monthlyContributionsTotal > 0 || explicitTotalContributed === 0
    ? monthlyContributionsTotal
    : explicitTotalContributed;
  const agreedContributionTarget = Math.max(
    0,
    toNumber(input.control?.agreedContributionTarget || input.planning?.annualContributionGoal || control.agreedContributionTarget)
  );
  const contributedProgress = agreedContributionTarget > 0
    ? (effectiveTotalContributed / agreedContributionTarget) * 100
    : 0;

  const protectionLayers = protectionLayerFields.map(({ key, label }) => ({
    key,
    label,
    needed: Boolean(input.control?.protectionNeeds?.[key]),
    covered: Boolean(input.control?.protectionCoverage?.[key])
  }));
  const needCount = protectionLayers.filter((item) => item.needed).length;
  const coveredCount = protectionLayers.filter((item) => item.covered).length;
  const savingsGoals = normalizeSavingsGoals(input.planning?.savingsGoals);

  return (
    <SectionCard
      eyebrow="Aba 5"
      title="Controle executivo"
      description="Painel executivo com progresso dos aportes, cobertura de legado, protecao de renda, futuro e camadas de protecao no mesmo visual claro do restante da pagina."
    >
      <div className="rounded-[30px] border border-[#173d5d]/12 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-4 shadow-[0_18px_34px_rgba(23,61,93,0.08)] lg:p-5">
        {introPanel()}

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(280px,0.88fr)_minmax(0,1.2fr)_minmax(220px,0.66fr)] xl:items-start">
          <div className="min-w-0">
            <ProtectionColumns
              protectionLayers={protectionLayers}
              needCount={needCount}
              coveredCount={coveredCount}
              readOnly={readOnly}
              onFieldChange={onFieldChange}
            />
          </div>

          <div className="grid min-w-0 gap-3 content-start">
            <ProgressBar
              value={contributedProgress}
              totalContributed={effectiveTotalContributed}
              target={agreedContributionTarget}
            />
            <SavingsGoalsCard
              goals={savingsGoals}
              readOnly={readOnly}
              onFieldChange={onFieldChange}
              onSaveGoals={onSaveGoals}
              isSavingGoals={isSavingGoals}
              onOpenContributions={() => setIsContributionsModalOpen(true)}
            />
            <div className="grid gap-3 2xl:grid-cols-2">
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
          </div>

          <div className="flex min-w-0 justify-center xl:justify-start">
            <FutureGauge value={control.financialFreedomProgress} />
          </div>
        </div>

        {isContributionsModalOpen ? (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7fafc] px-4 py-5 text-slate sm:px-6">
            <div className="mx-auto flex min-h-full max-w-[1400px] flex-col gap-4">
              <div className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-3 border-b border-slate/10 bg-[#f7fafc]/95 py-3 backdrop-blur">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#355f9b]">Aportes e metas</p>
                  <h3 className="mt-1 font-display text-3xl text-[#173d5d]">Controle de aportes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContributionsModalOpen(false)}
                  className="rounded-full border border-slate/10 bg-white px-5 py-3 text-sm font-semibold text-slate transition hover:border-[#173d5d]/20"
                >
                  Fechar
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(280px,0.75fr)_minmax(280px,0.65fr)]">
                <CurrentContributionCard
                  readOnly={readOnly}
                  monthlyTarget={monthlyTarget}
                  contributionAmount={selectedContribution?.amount ?? 0}
                  contributionDate={normalizedContributionDate}
                  contributionEntryDate={selectedContributionDate}
                  contributionGoalId={selectedContribution?.savingsGoalId ?? ''}
                  savingsGoals={savingsGoals}
                  onSaveContribution={onSaveContribution}
                  isSavingContribution={isPersistingContribution}
                />
                <ProgressBar
                  value={contributedProgress}
                  totalContributed={effectiveTotalContributed}
                  target={agreedContributionTarget}
                />
                <div className={`${glassPanelClassName()} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate/60">Metas do cliente</p>
                      <p className="mt-1 font-display text-2xl text-[#173d5d]">{formatTableNumber(sumSavingsGoals(savingsGoals))}</p>
                    </div>
                    <span className="rounded-full bg-[#eef4fb] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#355f9b]">
                      Meta global
                    </span>
                  </div>
                  <div className="mt-3 grid max-h-[320px] gap-2 overflow-y-auto pr-1">
                    {savingsGoals.length === 0 ? (
                      <p className="rounded-[14px] border border-dashed border-slate/15 bg-white px-3 py-4 text-sm text-slate/58">
                        Nenhuma meta cadastrada.
                      </p>
                    ) : (
                      savingsGoals.map((goal, index) => (
                        <div key={goal.id || index} className="flex min-w-0 items-center justify-between gap-3 rounded-[14px] border border-slate/10 bg-white px-3 py-2">
                          <p className="min-w-0 truncate text-sm font-semibold text-slate">{getSavingsGoalLabel(goal, index)}</p>
                          <span className="shrink-0 rounded-full bg-[#eef4fb] px-2.5 py-1 text-xs font-bold text-[#355f9b]">
                            {formatTableNumber(goal.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <MonthlyContributionStatusGrid
                monthlyContributions={visibleMonthlyContributions}
                monthlyTarget={monthlyTarget}
                savingsGoals={savingsGoals}
                onUpdateContribution={readOnly ? undefined : onUpdateContribution}
                onDeleteContribution={readOnly ? undefined : onDeleteContribution}
                isDeletingContribution={isPersistingContribution}
              />
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
