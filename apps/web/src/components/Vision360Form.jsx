import { useEffect, useRef, useState } from 'react';
import { familyRelationshipOptions, investorProfiles, maritalRegimes, maritalStatuses } from '@yield-360/shared';
import { FormField } from './FormField.jsx';
import { LocalizedNumberInput } from './LocalizedNumberInput.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatPlainNumber, formatTableNumber } from '../lib/formatters.js';

const patrimonialPresetOptions = [
  { key: 'financial', label: 'Ativos financeiros', kind: 'asset', description: 'Ativos financeiros' },
  { key: 'immobilized', label: 'Ativos imobilizados', kind: 'asset', description: 'Ativos imobilizados' },
  { key: 'loans', label: 'Emprestimos', kind: 'liability', description: 'Emprestimos' },
  { key: 'consortiums', label: 'Consórcios', kind: 'liability', description: 'Consórcios' }
];

function inputClassName(readOnly = false, hasError = false) {
  return `min-w-0 w-full rounded-xl border px-3 py-2 text-sm leading-tight text-slate outline-none transition ${
    hasError
      ? 'border-[#c24d2c] bg-[#fff6f3] focus:border-[#c24d2c] focus:ring-4 focus:ring-[#c24d2c]/15'
      : readOnly
        ? 'border-slate/10 bg-[#f5f7fa]'
        : 'border-slate/10 bg-white focus:border-deep focus:ring-4 focus:ring-deep/10'
  }`;
}

function blockClassName() {
  return 'rounded-[24px] border border-slate/10 bg-white p-4 shadow-[0_14px_32px_rgba(23,38,50,0.07)]';
}

function isFamilyMemberFilled(member) {
  return Boolean(member?.name || member?.relationship || member?.birthDate || member?.profession);
}

function booleanValue(value) {
  return value ? 'true' : 'false';
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function sumPatrimonialItems(items = []) {
  return items.reduce((total, item) => total + toNumber(item?.value), 0);
}

function buildSelectOptions(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [currentValue, ...options];
}

function normalizePatrimonialDescription(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function buildPatrimonialRows(input) {
  const assetItems = input.vision360.assets.items ?? [];
  const liabilityItems = input.vision360.liabilities.items ?? [];
  const usedAssetIndices = new Set();
  const usedLiabilityIndices = new Set();

  const presetRows = patrimonialPresetOptions.flatMap((option) => {
    const sourceItems = option.kind === 'asset' ? assetItems : liabilityItems;
    const usedIndices = option.kind === 'asset' ? usedAssetIndices : usedLiabilityIndices;
    const optionDescription = normalizePatrimonialDescription(option.description);
    const itemIndex = sourceItems.findIndex(
      (item, index) => !usedIndices.has(index) && normalizePatrimonialDescription(item?.description) === optionDescription
    );

    if (itemIndex === -1) {
      return [];
    }

    usedIndices.add(itemIndex);

    return [
      {
        id: `${option.kind}-${itemIndex}`,
        group: option.kind,
        index: itemIndex,
        description: sourceItems[itemIndex]?.description ?? option.description,
        value: sourceItems[itemIndex]?.value ?? 0,
        comment: sourceItems[itemIndex]?.comment ?? '',
        presetKey: option.key,
        isCustom: false
      }
    ];
  });

  const customAssetRows = assetItems
    .map((item, index) => ({
      id: `asset-${index}`,
      group: 'asset',
      index,
      description: item?.description ?? '',
      value: item?.value ?? 0,
      comment: item?.comment ?? '',
      isCustom: !usedAssetIndices.has(index)
    }))
    .filter((row) => row.isCustom);

  const customLiabilityRows = liabilityItems
    .map((item, index) => ({
      id: `liability-${index}`,
      group: 'liability',
      index,
      description: item?.description ?? '',
      value: item?.value ?? 0,
      comment: item?.comment ?? '',
      isCustom: !usedLiabilityIndices.has(index)
    }))
    .filter((row) => row.isCustom);

  return [...presetRows, ...customAssetRows, ...customLiabilityRows];
}

function calculateAgeFromBirthDate(birthDateValue) {
  if (!birthDateValue) {
    return null;
  }

  const birthDate = new Date(`${birthDateValue}T00:00:00Z`);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function TextInput({ value, onChange, readOnly = false, type = 'text', step, fieldPath, hasError = false }) {
  return (
    <input
      className={inputClassName(readOnly, hasError)}
      type={type}
      step={step}
      value={value ?? ''}
      onChange={readOnly ? undefined : onChange}
      readOnly={readOnly}
      data-field-path={fieldPath}
      aria-invalid={hasError}
    />
  );
}

function SelectInput({ value, onChange, options, readOnly = false, emptyLabel = 'Selecione', fieldPath, hasError = false }) {
  return (
    <select
      className={inputClassName(readOnly, hasError)}
      value={value ?? ''}
      onChange={readOnly ? undefined : onChange}
      disabled={readOnly}
      data-field-path={fieldPath}
      aria-invalid={hasError}
    >
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function BooleanSelect({ value, onChange, readOnly = false, fieldPath, hasError = false }) {
  return (
    <select
      className={inputClassName(readOnly, hasError)}
      value={booleanValue(value)}
      onChange={readOnly ? undefined : (event) => onChange(event.target.value === 'true')}
      disabled={readOnly}
      data-field-path={fieldPath}
      aria-invalid={hasError}
    >
      <option value="true">Sim</option>
      <option value="false">Nao</option>
    </select>
  );
}

function SummaryValue({ label, value, tone = 'currency' }) {
  const renderedValue = tone === 'number' ? formatPlainNumber(value) : formatTableNumber(value);

  return (
    <div className="min-w-0 rounded-[18px] border border-slate/10 bg-[#f7faf7] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate/50">{label}</p>
      <p className="mt-2 break-words font-display text-[1.35rem] leading-tight text-slate xl:text-[1.6rem]">{renderedValue}</p>
    </div>
  );
}

export function Vision360Form({
  input,
  overview,
  onFieldChange,
  onClientAgeChange = () => {},
  onFamilyMemberAgeChange = () => {},
  onAddFamilyMember = () => {},
  onRemoveFamilyMember = () => {},
  onAddAsset = () => {},
  onRemoveAsset = () => {},
  onAddLiability = () => {},
  onRemoveLiability = () => {},
  fieldErrors = {},
  readOnly = false
}) {
  const [isBalanceMenuOpen, setIsBalanceMenuOpen] = useState(false);
  const [expandedPatrimonialComments, setExpandedPatrimonialComments] = useState({});
  const balanceMenuRef = useRef(null);
  const familyInputs = input.family?.members ?? [];
  const familyMembers = overview?.familyMembers ?? [];
  const annualIncome = toNumber(input.vision360.budget.monthlyIncome) * 12;
  const annualExpenses = toNumber(input.vision360.budget.monthlyExpenses) * 12;
  const annualContribution = toNumber(input.future.agreedMonthlyContribution) * 12 + toNumber(input.planning.extraContributions);
  const calculatedClientAge = calculateAgeFromBirthDate(input.client.birthDate);
  const displayedClientAge = readOnly ? overview?.age ?? calculatedClientAge ?? '' : calculatedClientAge ?? '';
  const patrimonialRows = buildPatrimonialRows(input);
  const liveTotalAssets = sumPatrimonialItems(input.vision360.assets.items);
  const liveTotalLiabilities = sumPatrimonialItems(input.vision360.liabilities.items);
  const liveNetWorth = liveTotalAssets - liveTotalLiabilities;
  const addedPatrimonialPresetKeys = new Set(
    patrimonialRows.filter((row) => row.presetKey).map((row) => row.presetKey)
  );
  const availablePatrimonialOptions = patrimonialPresetOptions.filter((option) => !addedPatrimonialPresetKeys.has(option.key));
  const visibleFamilyRows = readOnly
    ? familyInputs
        .map((member, index) => ({ member, index }))
        .filter(({ member }) => isFamilyMemberFilled(member))
    : familyInputs.map((member, index) => ({ member, index }));

  const protectionRows = [
    ['Cobertura para invalidez total', 'protection.totalDisability', 'protection.totalDisabilityCoverage'],
    ['Cobertura para doencas graves', 'protection.criticalIllness', 'protection.criticalIllnessCoverage'],
    ['Cirurgias', 'protection.surgeries', 'protection.surgeriesCoverage'],
    ['Diaria por internacao', 'protection.hospitalDaily', 'protection.hospitalDailyCoverage'],
    ['DIT (diaria por incapacidade temporaria)', 'protection.temporaryDisability', 'protection.temporaryDisabilityCoverage']
  ];
  const maritalStatusOptions = buildSelectOptions(maritalStatuses, input.succession.maritalStatus);

  function handleAddPatrimonialOption(option) {
    if (option.kind === 'asset') {
      onAddAsset({ description: option.description, value: 0 });
    } else if (option.kind === 'liability') {
      onAddLiability({ description: option.description, value: 0 });
    } else {
      onAddAsset({ description: '', value: 0 });
    }

    setIsBalanceMenuOpen(false);
  }

  function handleCustomPatrimonialTypeChange(row, nextGroup) {
    if (nextGroup === row.group) {
      return;
    }

    const nextItem = {
      description: row.description,
      value: row.value,
      comment: row.comment
    };

    if (nextGroup === 'asset') {
      onAddAsset(nextItem);
      onRemoveLiability(row.index);
      return;
    }

    onAddLiability(nextItem);
    onRemoveAsset(row.index);
  }

  function handleRemovePatrimonialRow(row) {
    if (row.group === 'asset') {
      onRemoveAsset(row.index);
      return;
    }

    onRemoveLiability(row.index);
  }

  function togglePatrimonialComment(rowId) {
    setExpandedPatrimonialComments((currentState) => ({
      ...currentState,
      [rowId]: !currentState[rowId]
    }));
  }

  useEffect(() => {
    if (!isBalanceMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!balanceMenuRef.current?.contains(event.target)) {
        setIsBalanceMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isBalanceMenuOpen]);

  return (
    <SectionCard
      eyebrow={readOnly ? 'Cliente selecionado' : 'Aba 1'}
      title={readOnly ? 'Dados completos do cliente' : 'Visao 360 | Diagnostico e Plano Patrimonial'}
      description={
        readOnly
          ? 'Visualizacao somente leitura com todos os dados cadastrais, patrimoniais, orcamentarios, de protecao e sucessao do cliente.'
          : 'Estrutura espelhada na planilha: dados do cliente, familia, patrimonio, orcamento, objetivos, perfil, blindagem e sucessao em uma unica aba de entrada.'
      }
    >
      <div className="grid gap-4">
        <div className={blockClassName()}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate/10 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">1. Informacoes do cliente</p>
              <h3 className="mt-1 font-display text-2xl text-slate">Diagnostico principal</h3>
            </div>
            <div className="rounded-[18px] bg-[#355f9b] px-3 py-2 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Idade</p>
              <p className="mt-1 font-display text-2xl leading-none">{displayedClientAge === '' ? '-' : formatPlainNumber(displayedClientAge)}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <FormField label="Nome" error={fieldErrors['client.name']}>
              <TextInput
                value={input.client.name}
                onChange={(event) => onFieldChange('client.name', event.target.value)}
                readOnly={readOnly}
                fieldPath="client.name"
                hasError={Boolean(fieldErrors['client.name'])}
              />
            </FormField>
            <FormField label="Perfil do investidor">
              <SelectInput
                value={input.client.investorProfile}
                onChange={(event) => onFieldChange('client.investorProfile', event.target.value)}
                options={investorProfiles}
                readOnly={readOnly}
                fieldPath="client.investorProfile"
              />
            </FormField>
            <FormField label="Nascimento" error={fieldErrors['client.birthDate']}>
              <TextInput
                value={input.client.birthDate}
                type="date"
                onChange={(event) => onFieldChange('client.birthDate', event.target.value)}
                readOnly={readOnly}
                fieldPath="client.birthDate"
                hasError={Boolean(fieldErrors['client.birthDate'])}
              />
            </FormField>
            <FormField label="Idade" error={fieldErrors['client.birthDate']}>
              <LocalizedNumberInput
                value={displayedClientAge}
                onChange={(event) => onClientAgeChange(event.target.value)}
                readOnly={readOnly}
                fieldPath="client.birthDate"
                hasError={Boolean(fieldErrors['client.birthDate'])}
                min="0"
                fractionDigits={0}
                allowBlank
                className={inputClassName(readOnly, Boolean(fieldErrors['client.birthDate']))}
              />
            </FormField>
            <FormField label="Profissao">
              <TextInput
                value={input.client.profession}
                onChange={(event) => onFieldChange('client.profession', event.target.value)}
                readOnly={readOnly}
                fieldPath="client.profession"
              />
            </FormField>
          </div>
        </div>

        <div className={blockClassName()}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">2. Informacoes familiares</p>
            {!readOnly ? (
              <button
                type="button"
                onClick={onAddFamilyMember}
                className="rounded-full border border-slate/15 bg-[#f4f7fb] px-4 py-2 text-sm font-semibold text-slate transition hover:border-slate/30"
              >
                Adicionar familiar
              </button>
            ) : null}
          </div>
          {visibleFamilyRows.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate/15 bg-[#fafbfd] px-4 py-5 text-sm text-slate/60">
              {readOnly ? 'Nenhum familiar informado.' : 'Nenhum familiar adicionado ainda.'}
            </div>
          ) : (
          <div className="overflow-x-auto rounded-[18px] border border-slate/10">
            <table className="min-w-full border-collapse text-sm text-slate">
              <thead className="bg-[#e8f0fb] text-slate">
                <tr>
                  <th className="px-3 py-2 text-left">Nome</th>
                  <th className="px-3 py-2 text-left">Parentesco</th>
                  <th className="px-3 py-2 text-left">Nascimento</th>
                  <th className="px-3 py-2 text-left">Idade</th>
                  <th className="px-3 py-2 text-left">Profissao</th>
                  {!readOnly ? <th className="px-3 py-2 text-right">Acao</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleFamilyRows.map(({ member, index }) => (
                  <tr key={`family-${index}`} className="border-t border-slate/10">
                    {(() => {
                      const displayedFamilyAge = readOnly
                        ? familyMembers[index]?.age ?? calculateAgeFromBirthDate(member.birthDate) ?? ''
                        : calculateAgeFromBirthDate(member.birthDate) ?? '';

                      return (
                        <>
                    <td className="min-w-[180px] px-2 py-2"><TextInput value={member.name} onChange={(event) => onFieldChange(`family.members.${index}.name`, event.target.value)} readOnly={readOnly} fieldPath={`family.members.${index}.name`} /></td>
                    <td className="min-w-[170px] px-2 py-2"><SelectInput value={member.relationship} onChange={(event) => onFieldChange(`family.members.${index}.relationship`, event.target.value)} options={familyRelationshipOptions} readOnly={readOnly} fieldPath={`family.members.${index}.relationship`} emptyLabel="Selecione" /></td>
                    <td className="min-w-[150px] px-2 py-2"><TextInput value={member.birthDate} type="date" onChange={(event) => onFieldChange(`family.members.${index}.birthDate`, event.target.value)} readOnly={readOnly} fieldPath={`family.members.${index}.birthDate`} /></td>
                    <td className="w-[96px] min-w-[96px] px-2 py-2"><LocalizedNumberInput value={displayedFamilyAge} onChange={(event) => onFamilyMemberAgeChange(index, event.target.value)} readOnly={readOnly} fieldPath={`family.members.${index}.birthDate`} min="0" fractionDigits={0} allowBlank className={inputClassName(readOnly)} /></td>
                    <td className="min-w-[170px] px-2 py-2"><TextInput value={member.profession} onChange={(event) => onFieldChange(`family.members.${index}.profession`, event.target.value)} readOnly={readOnly} fieldPath={`family.members.${index}.profession`} /></td>
                    {!readOnly ? (
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveFamilyMember(index)}
                          className="rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-3 py-1.5 text-xs font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40"
                        >
                          Remover
                        </button>
                      </td>
                    ) : null}
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className={blockClassName()}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">3. Balanco patrimonial</p>
              {!readOnly ? (
                <div ref={balanceMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBalanceMenuOpen((currentValue) => !currentValue)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate/15 bg-[#f4f7fb] text-xl font-semibold text-slate transition hover:border-slate/30"
                    aria-expanded={isBalanceMenuOpen}
                    aria-label="Adicionar item patrimonial"
                  >
                    +
                  </button>
                  {isBalanceMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] z-10 w-64 rounded-[20px] border border-slate/10 bg-white p-2 shadow-[0_20px_40px_rgba(23,38,50,0.12)]">
                      <div className="grid gap-1">
                        {availablePatrimonialOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleAddPatrimonialOption(option)}
                            className="rounded-[14px] px-3 py-2 text-left text-sm font-semibold text-slate transition hover:bg-[#f4f7fb]"
                          >
                            {option.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddPatrimonialOption({ kind: 'custom' })}
                          className="rounded-[14px] px-3 py-2 text-left text-sm font-semibold text-slate transition hover:bg-[#f4f7fb]"
                        >
                          Adicionar outro item patrimonial
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            {patrimonialRows.length === 0 ? (
              <div className="min-h-[92px] rounded-[28px] border border-dashed border-[#d7dee8] bg-[#f9fbfe] px-6 py-8 text-[1.05rem] text-slate/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {readOnly ? 'Nenhum item patrimonial informado.' : 'Use o botao + para adicionar itens patrimoniais um por vez.'}
              </div>
            ) : (
              <div className="grid gap-3">
                {patrimonialRows.map((row) => {
                  const valuePath = `vision360.${row.group === 'asset' ? 'assets' : 'liabilities'}.items.${row.index}.value`;
                  const descriptionPath = `vision360.${row.group === 'asset' ? 'assets' : 'liabilities'}.items.${row.index}.description`;
                  const commentPath = `vision360.${row.group === 'asset' ? 'assets' : 'liabilities'}.items.${row.index}.comment`;
                  const commentLines = String(row.comment ?? '').split(/\r?\n/);
                  const firstCommentLine = commentLines.find((line) => line.trim()) ?? '';
                  const isCommentExpanded = Boolean(expandedPatrimonialComments[row.id]);
                  const hasComment = firstCommentLine.trim().length > 0;

                  return (
                    <div key={row.id} className="rounded-[20px] border border-slate/10 bg-[#fbfcfe] p-4">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate/45">
                            {row.group === 'asset' ? 'Ativo' : 'Passivo'}
                          </p>
                          <p className="mt-1 font-semibold text-slate">{row.description || 'Outra opcao'}</p>
                        </div>
                        {!readOnly ? (
                          <button
                            type="button"
                            onClick={() => handleRemovePatrimonialRow(row)}
                            className="rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-3 py-1.5 text-xs font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40"
                          >
                            Remover
                          </button>
                        ) : null}
                      </div>
                      {readOnly ? (
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_320px] md:items-start">
                          <FormField label="Descricao">
                            <TextInput
                              value={row.description}
                              onChange={(event) => onFieldChange(descriptionPath, event.target.value)}
                              readOnly
                              fieldPath={descriptionPath}
                            />
                          </FormField>
                          <FormField label="Valor">
                            <LocalizedNumberInput
                              value={row.value}
                              step="0.01"
                              onChange={(event) => onFieldChange(valuePath, event.target.value, 'number')}
                              readOnly
                              fieldPath={valuePath}
                              clearOnFocus
                              className={inputClassName(true)}
                            />
                          </FormField>
                          <div className="rounded-[18px] border border-slate/10 bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate/45">Observações</p>
                            {hasComment ? (
                              <>
                                <p
                                  className={`mt-2 text-sm leading-6 text-slate/80 ${isCommentExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}
                                  data-field-path={commentPath}
                                >
                                  {isCommentExpanded ? row.comment : firstCommentLine}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => togglePatrimonialComment(row.id)}
                                  className="mt-3 text-sm font-semibold text-[#355f9b] transition hover:text-[#23456f]"
                                >
                                  {isCommentExpanded ? 'Ocultar' : 'Ler'}
                                </button>
                              </>
                            ) : (
                              <p className="mt-2 text-sm leading-6 text-slate/80" data-field-path={commentPath}>
                                Sem comentario.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`grid gap-3 ${row.isCustom ? 'md:grid-cols-[180px_minmax(0,1fr)_220px]' : 'md:grid-cols-[minmax(0,1fr)_220px]'}`}>
                            {row.isCustom ? (
                              <FormField label="Tipo">
                                <select
                                  className={inputClassName(readOnly)}
                                  value={row.group}
                                  onChange={readOnly ? undefined : (event) => handleCustomPatrimonialTypeChange(row, event.target.value)}
                                  disabled={readOnly}
                                >
                                  <option value="asset">Ativo</option>
                                  <option value="liability">Passivo</option>
                                </select>
                              </FormField>
                            ) : null}
                            <FormField label="Descricao">
                              <TextInput
                                value={row.description}
                                onChange={(event) => onFieldChange(descriptionPath, event.target.value)}
                                readOnly={readOnly || !row.isCustom}
                                fieldPath={descriptionPath}
                              />
                            </FormField>
                            <FormField label="Valor">
                              <LocalizedNumberInput
                                value={row.value}
                                step="0.01"
                                onChange={(event) => onFieldChange(valuePath, event.target.value, 'number')}
                                readOnly={readOnly}
                                fieldPath={valuePath}
                                clearOnFocus
                                className={inputClassName(readOnly)}
                              />
                            </FormField>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
                          <FormField label="Comentario">
                            <textarea
                              className={`${inputClassName(readOnly)} min-h-[96px] resize-y`}
                              value={row.comment ?? ''}
                              onChange={readOnly ? undefined : (event) => onFieldChange(commentPath, event.target.value)}
                              readOnly={readOnly}
                              data-field-path={commentPath}
                            />
                          </FormField>
                          <div className="rounded-[18px] border border-slate/10 bg-white px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate/45">Observações</p>
                            {hasComment ? (
                              <>
                                <p className={`mt-2 text-sm leading-6 text-slate/80 ${isCommentExpanded ? 'whitespace-pre-wrap' : 'truncate'}`}>
                                  {isCommentExpanded ? row.comment : firstCommentLine}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => togglePatrimonialComment(row.id)}
                                  className="mt-3 text-sm font-semibold text-[#355f9b] transition hover:text-[#23456f]"
                                >
                                  {isCommentExpanded ? 'Ocultar' : 'Ler'}
                                </button>
                              </>
                            ) : (
                              <p className="mt-2 text-sm text-slate/50">Sem comentario.</p>
                            )}
                          </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {patrimonialRows.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <SummaryValue label="Ativos totais" value={liveTotalAssets} />
                <SummaryValue label="Passivos totais" value={liveTotalLiabilities} />
                <SummaryValue label="Patrimonio liquido" value={liveNetWorth} />
              </div>
            ) : null}
          </div>

          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">4. Dados orcamentarios</p>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Regime de trabalho">
                <TextInput value={input.vision360.budget.workRegime} onChange={(event) => onFieldChange('vision360.budget.workRegime', event.target.value)} readOnly={readOnly} fieldPath="vision360.budget.workRegime" />
              </FormField>
              <FormField label="Tipo de declaracao de IR">
                <TextInput value={input.vision360.budget.taxDeclaration} onChange={(event) => onFieldChange('vision360.budget.taxDeclaration', event.target.value)} readOnly={readOnly} fieldPath="vision360.budget.taxDeclaration" />
              </FormField>
              <FormField label="Ganho mensal aproximado">
                <LocalizedNumberInput value={input.vision360.budget.monthlyIncome} step="0.01" onChange={(event) => onFieldChange('vision360.budget.monthlyIncome', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.monthlyIncome" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Ganho anual aproximado">
                <TextInput value={formatTableNumber(annualIncome)} readOnly />
              </FormField>
              <FormField label="Despesa mensal aproximada">
                <LocalizedNumberInput value={input.vision360.budget.monthlyExpenses} step="0.01" onChange={(event) => onFieldChange('vision360.budget.monthlyExpenses', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.monthlyExpenses" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Despesa anual aproximada">
                <TextInput value={formatTableNumber(annualExpenses)} readOnly />
              </FormField>
              <FormField label="Reserva de emergencia - Ja possui?">
                <BooleanSelect value={input.vision360.budget.emergencyReserveHas} onChange={(value) => onFieldChange('vision360.budget.emergencyReserveHas', value)} readOnly={readOnly} fieldPath="vision360.budget.emergencyReserveHas" />
              </FormField>
              <FormField label="PGBL?">
                <BooleanSelect value={input.vision360.budget.hasPGBL} onChange={(value) => onFieldChange('vision360.budget.hasPGBL', value)} readOnly={readOnly} fieldPath="vision360.budget.hasPGBL" />
              </FormField>
              <FormField label="Reserva de emergencia - Necessidade">
                <LocalizedNumberInput value={input.vision360.budget.emergencyReserveNeed} step="0.01" onChange={(event) => onFieldChange('vision360.budget.emergencyReserveNeed', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.emergencyReserveNeed" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Reserva adicional - Objetivo de curto prazo">
                <LocalizedNumberInput value={input.vision360.budget.shortTermReserveTarget} step="0.01" onChange={(event) => onFieldChange('vision360.budget.shortTermReserveTarget', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.shortTermReserveTarget" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Reserva de emergencia - Valor atual">
                <LocalizedNumberInput
                  value={input.vision360.budget.emergencyReserveCurrent}
                  step="0.01"
                  onChange={(event) => onFieldChange('vision360.budget.emergencyReserveCurrent', event.target.value, 'number')}
                  readOnly={readOnly}
                  disabled={!input.vision360.budget.emergencyReserveHas}
                  fieldPath="vision360.budget.emergencyReserveCurrent"
                  clearOnFocus
                  className={inputClassName(readOnly || !input.vision360.budget.emergencyReserveHas)}
                />
              </FormField>
              <FormField label="Observacoes / comentarios">
                <TextInput value={input.vision360.budget.notes} onChange={(event) => onFieldChange('vision360.budget.notes', event.target.value)} readOnly={readOnly} fieldPath="vision360.budget.notes" />
              </FormField>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">5. Objetivos e plano de investimentos</p>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Idade na data da contratacao da consultoria" error={fieldErrors['planning.consultantStartAge']}>
                <LocalizedNumberInput value={input.planning.consultantStartAge} onChange={(event) => onFieldChange('planning.consultantStartAge', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.consultantStartAge" hasError={Boolean(fieldErrors['planning.consultantStartAge'])} min="0" fractionDigits={0} className={inputClassName(readOnly, Boolean(fieldErrors['planning.consultantStartAge']))} />
              </FormField>
              <FormField label="Valor inicial sob consultoria">
                <LocalizedNumberInput value={input.planning.initialConsultingValue} step="0.01" onChange={(event) => onFieldChange('planning.initialConsultingValue', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.initialConsultingValue" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Qual a sua fase de vida?">
                <TextInput value={input.planning.lifePhase} onChange={(event) => onFieldChange('planning.lifePhase', event.target.value)} readOnly={readOnly} fieldPath="planning.lifePhase" />
              </FormField>
              <FormField label="Quantos anos pretende ficar nesta fase?">
                <LocalizedNumberInput value={input.planning.phaseDurationYears} onChange={(event) => onFieldChange('planning.phaseDurationYears', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.phaseDurationYears" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Idade objetivo da aposentadoria" error={fieldErrors['future.targetAge']}>
                <LocalizedNumberInput value={input.future.targetAge} onChange={(event) => onFieldChange('future.targetAge', event.target.value, 'number')} readOnly={readOnly} fieldPath="future.targetAge" hasError={Boolean(fieldErrors['future.targetAge'])} min="0" fractionDigits={0} className={inputClassName(readOnly, Boolean(fieldErrors['future.targetAge']))} />
              </FormField>
              <FormField label="Qual e o aporte mensal acordado?">
                <LocalizedNumberInput value={input.future.agreedMonthlyContribution} step="0.01" onChange={(event) => onFieldChange('future.agreedMonthlyContribution', event.target.value, 'number')} readOnly={readOnly} fieldPath="future.agreedMonthlyContribution" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Qual o dia do aporte acordado?">
                <LocalizedNumberInput value={input.planning.contributionDay} onChange={(event) => onFieldChange('planning.contributionDay', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.contributionDay" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Aportes adicionais">
                <LocalizedNumberInput value={input.planning.extraContributions} step="0.01" onChange={(event) => onFieldChange('planning.extraContributions', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.extraContributions" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Aporte anual">
                <TextInput value={formatTableNumber(annualContribution)} readOnly fieldPath="planning.annualContributionGoal" />
              </FormField>
              <FormField label="Quer renda dos investimentos na aposentadoria?">
                <BooleanSelect value={input.planning.wantsRetirementIncome} onChange={(value) => onFieldChange('planning.wantsRetirementIncome', value)} readOnly={readOnly} fieldPath="planning.wantsRetirementIncome" />
              </FormField>
              <FormField label="Se sim, qual a renda mensal desejada?">
                <LocalizedNumberInput
                  value={input.future.desiredMonthlyRetirementSpend}
                  step="0.01"
                  onChange={(event) => onFieldChange('future.desiredMonthlyRetirementSpend', event.target.value, 'number')}
                  readOnly={readOnly}
                  disabled={!input.planning.wantsRetirementIncome}
                  fieldPath="future.desiredMonthlyRetirementSpend"
                  clearOnFocus
                  className={inputClassName(readOnly || !input.planning.wantsRetirementIncome)}
                />
              </FormField>
              <FormField label="Tem renda extra prevista?">
                <BooleanSelect value={input.planning.extraIncomeExpected} onChange={(value) => onFieldChange('planning.extraIncomeExpected', value)} readOnly={readOnly} fieldPath="planning.extraIncomeExpected" />
              </FormField>
              <FormField label="Se sim, qual a renda mensal prevista?">
                <LocalizedNumberInput
                  value={input.planning.extraMonthlyIncome}
                  step="0.01"
                  onChange={(event) => onFieldChange('planning.extraMonthlyIncome', event.target.value, 'number')}
                  readOnly={readOnly}
                  disabled={!input.planning.extraIncomeExpected}
                  fieldPath="planning.extraMonthlyIncome"
                  clearOnFocus
                  className={inputClassName(readOnly || !input.planning.extraIncomeExpected)}
                />
              </FormField>
              <FormField label="Existem outros objetivos?">
                <TextInput value={input.planning.otherObjectivesComment} onChange={(event) => onFieldChange('planning.otherObjectivesComment', event.target.value)} readOnly={readOnly} fieldPath="planning.otherObjectivesComment" />
              </FormField>
            </div>
          </div>

          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">6. Validacao do perfil do investidor</p>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Perfil sugerido">
                <SelectInput
                  value={input.profileValidation.suggestedProfile}
                  onChange={(event) => onFieldChange('profileValidation.suggestedProfile', event.target.value)}
                  options={investorProfiles}
                  readOnly={readOnly}
                  fieldPath="profileValidation.suggestedProfile"
                />
              </FormField>
              <FormField label="Capacidade financeira">
                <TextInput value={input.profileValidation.financialCapacity} onChange={(event) => onFieldChange('profileValidation.financialCapacity', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.financialCapacity" />
              </FormField>
              <FormField label="Capacidade emocional">
                <TextInput value={input.profileValidation.emotionalCapacity} onChange={(event) => onFieldChange('profileValidation.emotionalCapacity', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.emotionalCapacity" />
              </FormField>
              <FormField label="Benchmark referencia para longo prazo">
                <TextInput value={input.profileValidation.benchmarkLabel} onChange={(event) => onFieldChange('profileValidation.benchmarkLabel', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.benchmarkLabel" />
              </FormField>
              <FormField label="Taxa do benchmark (%)">
                <LocalizedNumberInput value={input.profileValidation.benchmarkRate} step="0.01" onChange={(event) => onFieldChange('profileValidation.benchmarkRate', event.target.value, 'number')} readOnly={readOnly} fieldPath="profileValidation.benchmarkRate" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Prazo">
                <TextInput value={input.profileValidation.term} onChange={(event) => onFieldChange('profileValidation.term', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.term" />
              </FormField>
              <FormField label="Itens validados?">
                <BooleanSelect value={input.profileValidation.validated} onChange={(value) => onFieldChange('profileValidation.validated', value)} readOnly={readOnly} fieldPath="profileValidation.validated" />
              </FormField>
              <FormField label="Comentario">
                <TextInput value={input.profileValidation.notes} onChange={(event) => onFieldChange('profileValidation.notes', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.notes" />
              </FormField>
            </div>
          </div>
        </div>

        <div className={blockClassName()}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">7. Blindagem patrimonial</p>
          <div className="overflow-x-auto rounded-[18px] border border-slate/10">
            <table className="min-w-full border-collapse text-sm text-slate">
              <thead className="bg-[#e8f0fb]">
                <tr>
                  <th className="px-3 py-2 text-left">Cobertura</th>
                  <th className="px-3 py-2 text-left">Possui?</th>
                  <th className="px-3 py-2 text-left">Valor</th>
                </tr>
              </thead>
              <tbody>
                {protectionRows.map(([label, booleanPath, valuePath]) => {
                  const hasCoverage = booleanPath.split('.').reduce((cursor, key) => cursor?.[key], input);
                  const coverageValue = valuePath.split('.').reduce((cursor, key) => cursor?.[key], input);

                  return (
                    <tr key={label} className="border-t border-slate/10">
                      <td className="min-w-[220px] px-3 py-2 font-semibold">{label}</td>
                      <td className="min-w-[120px] px-3 py-2"><BooleanSelect value={hasCoverage} onChange={(value) => onFieldChange(booleanPath, value)} readOnly={readOnly} fieldPath={booleanPath} /></td>
                      <td className="min-w-[160px] px-3 py-2"><LocalizedNumberInput value={coverageValue} step="0.01" onChange={(event) => onFieldChange(valuePath, event.target.value, 'number')} readOnly={readOnly} fieldPath={valuePath} clearOnFocus className={inputClassName(readOnly)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <FormField label="Cobertura adicional - educacao e dependentes">
              <BooleanSelect value={input.protection.dependentEducationInterest} onChange={(value) => onFieldChange('protection.dependentEducationInterest', value)} readOnly={readOnly} fieldPath="protection.dependentEducationInterest" />
            </FormField>
            <FormField label="Anos de cobertura">
              <LocalizedNumberInput value={input.protection.dependentEducationYears} onChange={(event) => onFieldChange('protection.dependentEducationYears', event.target.value, 'number')} readOnly={readOnly} fieldPath="protection.dependentEducationYears" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Valor do auxilio mensal">
              <LocalizedNumberInput value={input.protection.dependentEducationMonthlyAid} step="0.01" onChange={(event) => onFieldChange('protection.dependentEducationMonthlyAid', event.target.value, 'number')} readOnly={readOnly} fieldPath="protection.dependentEducationMonthlyAid" clearOnFocus className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Valor ideal para cobertura adicional">
              <LocalizedNumberInput value={input.protection.dependentEducationIdealCoverage} step="0.01" onChange={(event) => onFieldChange('protection.dependentEducationIdealCoverage', event.target.value, 'number')} readOnly={readOnly} fieldPath="protection.dependentEducationIdealCoverage" clearOnFocus className={inputClassName(readOnly)} />
            </FormField>
          </div>
        </div>

        <div className={blockClassName()}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">8. Planejamento sucessorio</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Estado civil">
              <SelectInput
                value={input.succession.maritalStatus}
                onChange={(event) => onFieldChange('succession.maritalStatus', event.target.value)}
                options={maritalStatusOptions}
                readOnly={readOnly}
                emptyLabel="Selecione"
                fieldPath="succession.maritalStatus"
              />
            </FormField>
            <FormField label="Regime de bens">
              <SelectInput
                value={input.succession.maritalRegime}
                onChange={(event) => onFieldChange('succession.maritalRegime', event.target.value)}
                options={maritalRegimes}
                readOnly={readOnly}
                fieldPath="succession.maritalRegime"
              />
            </FormField>
            <FormField label="Filhos?">
              <BooleanSelect value={input.succession.hasChildren} onChange={(value) => onFieldChange('succession.hasChildren', value)} readOnly={readOnly} fieldPath="succession.hasChildren" />
            </FormField>
            <FormField label="Quantidade de filhos">
              <LocalizedNumberInput value={input.succession.childCount} onChange={(event) => onFieldChange('succession.childCount', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.childCount" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Ascendentes vivos (pais)?">
              <BooleanSelect value={input.succession.parentsAlive} onChange={(value) => onFieldChange('succession.parentsAlive', value)} readOnly={readOnly} fieldPath="succession.parentsAlive" />
            </FormField>
            <FormField label="VGBL">
              <LocalizedNumberInput value={input.succession.vgbl} step="0.01" onChange={(event) => onFieldChange('succession.vgbl', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.vgbl" clearOnFocus className={inputClassName(readOnly)} />
            </FormField>
            <div className="md:col-span-2 xl:col-span-2">
              <FormField label="Seguro de vida">
                <LocalizedNumberInput value={input.succession.lifeInsurance} step="0.01" onChange={(event) => onFieldChange('succession.lifeInsurance', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.lifeInsurance" clearOnFocus className={inputClassName(readOnly)} />
              </FormField>
            </div>
            <FormField label="Bens comuns (aquestos) - total do casal">
              <LocalizedNumberInput value={input.succession.commonAssets} step="0.01" onChange={(event) => onFieldChange('succession.commonAssets', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.commonAssets" clearOnFocus className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Bens particulares">
              <LocalizedNumberInput value={input.succession.privateAssets} step="0.01" onChange={(event) => onFieldChange('succession.privateAssets', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.privateAssets" clearOnFocus className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Dividas">
              <LocalizedNumberInput value={input.succession.debts} step="0.01" onChange={(event) => onFieldChange('succession.debts', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.debts" clearOnFocus className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Potenciais conflitos na sucessao?">
              <TextInput value={input.succession.conflictsComment} onChange={(event) => onFieldChange('succession.conflictsComment', event.target.value)} readOnly={readOnly} fieldPath="succession.conflictsComment" />
            </FormField>
            <FormField label="Voce tem testamento?">
              <BooleanSelect value={input.succession.hasWill} onChange={(value) => onFieldChange('succession.hasWill', value)} readOnly={readOnly} fieldPath="succession.hasWill" />
            </FormField>
            <FormField label="Ja fez ou faz doacoes em vida?">
              <BooleanSelect value={input.succession.hasLifetimeDonations} onChange={(value) => onFieldChange('succession.hasLifetimeDonations', value)} readOnly={readOnly} fieldPath="succession.hasLifetimeDonations" />
            </FormField>
            <FormField label="Voce tem holding patrimonial?">
              <BooleanSelect value={input.succession.hasHolding} onChange={(value) => onFieldChange('succession.hasHolding', value)} readOnly={readOnly} fieldPath="succession.hasHolding" />
            </FormField>
            <FormField label="Voce tem negocios offshore?">
              <BooleanSelect value={input.succession.hasOffshore} onChange={(value) => onFieldChange('succession.hasOffshore', value)} readOnly={readOnly} fieldPath="succession.hasOffshore" />
            </FormField>
            <FormField label="Observacoes / comentarios">
              <TextInput value={input.succession.observations} onChange={(event) => onFieldChange('succession.observations', event.target.value)} readOnly={readOnly} fieldPath="succession.observations" />
            </FormField>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
