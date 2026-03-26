import { familyRelationshipOptions, financialCapacityOptions, investorProfiles, lifePhaseOptions, maritalRegimes, maritalStatuses } from '@yield-360/shared';
import { FormField } from './FormField.jsx';
import { LocalizedNumberInput } from './LocalizedNumberInput.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatPlainNumber, formatTableNumber } from '../lib/formatters.js';

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

function buildSelectOptions(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [currentValue, ...options];
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
  onAddPolicy = () => {},
  onRemovePolicy = () => {},
  onPolicyFieldChange = () => {},
  onPolicyFileChange = () => {},
  fieldErrors = {},
  readOnly = false
}) {
  const familyInputs = input.family?.members ?? [];
  const familyMembers = overview?.familyMembers ?? [];
  const annualIncome = toNumber(input.vision360.budget.monthlyIncome) * 12;
  const annualExpenses = toNumber(input.vision360.budget.monthlyExpenses) * 12;
  const annualContribution = toNumber(input.future.agreedMonthlyContribution) * 12 + toNumber(input.planning.extraContributions);
  const calculatedClientAge = calculateAgeFromBirthDate(input.client.birthDate);
  const displayedClientAge = readOnly ? overview?.age ?? calculatedClientAge ?? '' : calculatedClientAge ?? '';
  const visibleFamilyRows = readOnly
    ? familyInputs
        .map((member, index) => ({ member, index }))
        .filter(({ member }) => isFamilyMemberFilled(member))
    : familyInputs.map((member, index) => ({ member, index }));
  const assetItems = input.vision360.assets.items ?? [];
  const liabilityItems = input.vision360.liabilities.items ?? [];
  const totalAssets = assetItems.reduce((sum, item) => sum + toNumber(item.value), 0);
  const totalLiabilities = liabilityItems.reduce((sum, item) => sum + toNumber(item.value), 0);
  const netWorth = totalAssets - totalLiabilities;
  const policies = input.protection.policies ?? [];

  const maritalStatusOptions = buildSelectOptions(maritalStatuses, input.succession.maritalStatus);
  const lifePhaseOptionsFormatted = buildSelectOptions(lifePhaseOptions, input.planning.lifePhase);
  const financialCapacityOptionsFormatted = buildSelectOptions(financialCapacityOptions, input.profileValidation.financialCapacity);

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

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">3. Balanco patrimonial</p>

            <div className="mb-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate">Ativos</p>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={onAddAsset}
                    className="rounded-full border border-slate/15 bg-[#f4f7fb] px-4 py-2 text-sm font-semibold text-slate transition hover:border-slate/30"
                  >
                    Adicionar ativo
                  </button>
                ) : null}
              </div>
              {assetItems.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-slate/15 bg-[#fafbfd] px-4 py-5 text-sm text-slate/60">
                  {readOnly ? 'Nenhum ativo informado.' : 'Nenhum ativo adicionado ainda.'}
                </div>
              ) : (
                <div className="grid gap-3">
                  {assetItems.map((item, index) => (
                    <div key={`asset-${index}`} className="flex flex-wrap items-end gap-3 rounded-[18px] border border-slate/10 bg-[#fafbfd] p-3">
                      <div className="min-w-[200px] flex-1">
                        <FormField label="Descricao">
                          <TextInput
                            value={item.description}
                            onChange={(event) => onFieldChange(`vision360.assets.items.${index}.description`, event.target.value)}
                            readOnly={readOnly}
                            fieldPath={`vision360.assets.items.${index}.description`}
                          />
                        </FormField>
                      </div>
                      <div className="min-w-[160px] flex-1">
                        <FormField label="Valor">
                          <LocalizedNumberInput
                            value={item.value}
                            step="0.01"
                            onChange={(event) => onFieldChange(`vision360.assets.items.${index}.value`, event.target.value, 'number')}
                            readOnly={readOnly}
                            fieldPath={`vision360.assets.items.${index}.value`}
                            className={inputClassName(readOnly)}
                          />
                        </FormField>
                      </div>
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => onRemoveAsset(index)}
                          className="mb-1 rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-3 py-1.5 text-xs font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40"
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate">Passivos</p>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={onAddLiability}
                    className="rounded-full border border-slate/15 bg-[#f4f7fb] px-4 py-2 text-sm font-semibold text-slate transition hover:border-slate/30"
                  >
                    Adicionar passivo
                  </button>
                ) : null}
              </div>
              {liabilityItems.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-slate/15 bg-[#fafbfd] px-4 py-5 text-sm text-slate/60">
                  {readOnly ? 'Nenhum passivo informado.' : 'Nenhum passivo adicionado ainda.'}
                </div>
              ) : (
                <div className="grid gap-3">
                  {liabilityItems.map((item, index) => (
                    <div key={`liability-${index}`} className="flex flex-wrap items-end gap-3 rounded-[18px] border border-slate/10 bg-[#fafbfd] p-3">
                      <div className="min-w-[200px] flex-1">
                        <FormField label="Descricao">
                          <TextInput
                            value={item.description}
                            onChange={(event) => onFieldChange(`vision360.liabilities.items.${index}.description`, event.target.value)}
                            readOnly={readOnly}
                            fieldPath={`vision360.liabilities.items.${index}.description`}
                          />
                        </FormField>
                      </div>
                      <div className="min-w-[160px] flex-1">
                        <FormField label="Valor">
                          <LocalizedNumberInput
                            value={item.value}
                            step="0.01"
                            onChange={(event) => onFieldChange(`vision360.liabilities.items.${index}.value`, event.target.value, 'number')}
                            readOnly={readOnly}
                            fieldPath={`vision360.liabilities.items.${index}.value`}
                            className={inputClassName(readOnly)}
                          />
                        </FormField>
                      </div>
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => onRemoveLiability(index)}
                          className="mb-1 rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-3 py-1.5 text-xs font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40"
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <SummaryValue label="Ativos totais" value={overview?.totalAssets ?? totalAssets} />
              <SummaryValue label="Passivos totais" value={overview?.totalLiabilities ?? totalLiabilities} />
              <SummaryValue label="Patrimonio liquido" value={overview?.netWorth ?? netWorth} />
            </div>
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
                <LocalizedNumberInput value={input.vision360.budget.monthlyIncome} step="0.01" onChange={(event) => onFieldChange('vision360.budget.monthlyIncome', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.monthlyIncome" className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Ganho anual aproximado">
                <TextInput value={formatTableNumber(annualIncome)} readOnly />
              </FormField>
              <FormField label="Despesa mensal aproximada">
                <LocalizedNumberInput value={input.vision360.budget.monthlyExpenses} step="0.01" onChange={(event) => onFieldChange('vision360.budget.monthlyExpenses', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.monthlyExpenses" className={inputClassName(readOnly)} />
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
                <LocalizedNumberInput value={input.vision360.budget.emergencyReserveNeed} step="0.01" onChange={(event) => onFieldChange('vision360.budget.emergencyReserveNeed', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.emergencyReserveNeed" className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Reserva adicional - Objetivo de curto prazo">
                <LocalizedNumberInput value={input.vision360.budget.shortTermReserveTarget} step="0.01" onChange={(event) => onFieldChange('vision360.budget.shortTermReserveTarget', event.target.value, 'number')} readOnly={readOnly} fieldPath="vision360.budget.shortTermReserveTarget" className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Reserva de emergencia - Valor atual">
                <LocalizedNumberInput
                  value={input.vision360.budget.emergencyReserveCurrent}
                  step="0.01"
                  onChange={(event) => onFieldChange('vision360.budget.emergencyReserveCurrent', event.target.value, 'number')}
                  readOnly={readOnly}
                  disabled={!input.vision360.budget.emergencyReserveHas}
                  fieldPath="vision360.budget.emergencyReserveCurrent"
                  className={inputClassName(readOnly || !input.vision360.budget.emergencyReserveHas)}
                />
              </FormField>
              <FormField label="Observacoes / comentarios">
                <TextInput value={input.vision360.budget.notes} onChange={(event) => onFieldChange('vision360.budget.notes', event.target.value)} readOnly={readOnly} fieldPath="vision360.budget.notes" />
              </FormField>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">5. Objetivos e plano de investimentos</p>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Idade na data da contratacao da consultoria" error={fieldErrors['planning.consultantStartAge']}>
                <LocalizedNumberInput value={input.planning.consultantStartAge} onChange={(event) => onFieldChange('planning.consultantStartAge', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.consultantStartAge" hasError={Boolean(fieldErrors['planning.consultantStartAge'])} min="0" fractionDigits={0} className={inputClassName(readOnly, Boolean(fieldErrors['planning.consultantStartAge']))} />
              </FormField>
              <FormField label="Valor inicial sob consultoria">
                <LocalizedNumberInput value={input.planning.initialConsultingValue} step="0.01" onChange={(event) => onFieldChange('planning.initialConsultingValue', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.initialConsultingValue" className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Qual a sua fase de vida?">
                <SelectInput
                  value={input.planning.lifePhase}
                  onChange={(event) => onFieldChange('planning.lifePhase', event.target.value)}
                  options={lifePhaseOptionsFormatted}
                  readOnly={readOnly}
                  fieldPath="planning.lifePhase"
                />
              </FormField>
              <FormField label="Quantos anos pretende ficar nesta fase?">
                <LocalizedNumberInput value={input.planning.phaseDurationYears} onChange={(event) => onFieldChange('planning.phaseDurationYears', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.phaseDurationYears" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Idade objetivo da aposentadoria" error={fieldErrors['future.targetAge']}>
                <LocalizedNumberInput value={input.future.targetAge} onChange={(event) => onFieldChange('future.targetAge', event.target.value, 'number')} readOnly={readOnly} fieldPath="future.targetAge" hasError={Boolean(fieldErrors['future.targetAge'])} min="0" fractionDigits={0} className={inputClassName(readOnly, Boolean(fieldErrors['future.targetAge']))} />
              </FormField>
              <FormField label="Qual e o aporte mensal acordado?">
                <LocalizedNumberInput value={input.future.agreedMonthlyContribution} step="0.01" onChange={(event) => onFieldChange('future.agreedMonthlyContribution', event.target.value, 'number')} readOnly={readOnly} fieldPath="future.agreedMonthlyContribution" className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Qual o dia do aporte acordado?">
                <LocalizedNumberInput value={input.planning.contributionDay} onChange={(event) => onFieldChange('planning.contributionDay', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.contributionDay" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
              </FormField>
              <FormField label="Aportes adicionais">
                <LocalizedNumberInput value={input.planning.extraContributions} step="0.01" onChange={(event) => onFieldChange('planning.extraContributions', event.target.value, 'number')} readOnly={readOnly} fieldPath="planning.extraContributions" className={inputClassName(readOnly)} />
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
                <SelectInput
                  value={input.profileValidation.financialCapacity}
                  onChange={(event) => onFieldChange('profileValidation.financialCapacity', event.target.value)}
                  options={financialCapacityOptionsFormatted}
                  readOnly={readOnly}
                  fieldPath="profileValidation.financialCapacity"
                />
              </FormField>
              <FormField label="Capacidade emocional">
                <TextInput value={input.profileValidation.emotionalCapacity} onChange={(event) => onFieldChange('profileValidation.emotionalCapacity', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.emotionalCapacity" />
              </FormField>
              <FormField label="Benchmark referencia para longo prazo">
                <TextInput value={input.profileValidation.benchmarkLabel} onChange={(event) => onFieldChange('profileValidation.benchmarkLabel', event.target.value)} readOnly={readOnly} fieldPath="profileValidation.benchmarkLabel" />
              </FormField>
              <FormField label="Taxa do benchmark (%)">
                <LocalizedNumberInput value={input.profileValidation.benchmarkRate} step="0.01" onChange={(event) => onFieldChange('profileValidation.benchmarkRate', event.target.value, 'number')} readOnly={readOnly} fieldPath="profileValidation.benchmarkRate" className={inputClassName(readOnly)} />
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate/10 pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">7. Blindagem patrimonial</p>
            {!readOnly ? (
              <button
                type="button"
                onClick={onAddPolicy}
                className="rounded-full border border-slate/15 bg-[#f4f7fb] px-4 py-2 text-sm font-semibold text-slate transition hover:border-slate/30"
              >
                Adicionar cobertura
              </button>
            ) : null}
          </div>

          {policies.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-slate/15 bg-[#fafbfd] px-4 py-5 text-sm text-slate/60 mb-6">
              {readOnly ? 'Nenhuma cobertura de seguro/blindagem informada.' : 'Nenhuma cobertura adicionada ainda.'}
            </div>
          ) : (
            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              {policies.map((policy, index) => (
                <div key={`policy-${policy.id}`} className="grid gap-3 rounded-[18px] border border-slate/10 bg-[#fafbfd] p-4">
                  <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
                    <FormField label="Nome da cobertura">
                      <TextInput
                        value={policy.name}
                        onChange={(event) => onPolicyFieldChange(index, 'name', event.target.value)}
                        readOnly={readOnly}
                        fieldPath={`protection.policies.${index}.name`}
                      />
                    </FormField>
                    <FormField label="Anos de cobertura">
                      <LocalizedNumberInput
                        value={policy.years}
                        onChange={(event) => onPolicyFieldChange(index, 'years', event.target.value, 'number')}
                        readOnly={readOnly}
                        fieldPath={`protection.policies.${index}.years`}
                        min="0"
                        fractionDigits={0}
                        className={inputClassName(readOnly)}
                      />
                    </FormField>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    <FormField label="Empresa (Seguradora)">
                      <TextInput
                        value={policy.company}
                        onChange={(event) => onPolicyFieldChange(index, 'company', event.target.value)}
                        readOnly={readOnly}
                        fieldPath={`protection.policies.${index}.company`}
                      />
                    </FormField>
                    <FormField label="Valor coberto">
                      <LocalizedNumberInput
                        value={policy.value}
                        step="0.01"
                        onChange={(event) => onPolicyFieldChange(index, 'value', event.target.value, 'number')}
                        readOnly={readOnly}
                        fieldPath={`protection.policies.${index}.value`}
                        className={inputClassName(readOnly)}
                      />
                    </FormField>
                  </div>
                  <div className="border-t border-slate/10 pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-semibold text-slate">Apolice (PDF)</p>
                      {policy.documentId || policy.documentName ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate rounded-lg bg-white px-3 py-1 text-xs border border-slate/10 text-slate/70 max-w-[200px]">
                            {policy.documentName || 'Documento carregado'}
                          </span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => onPolicyFileChange(index, null)}
                              className="text-xs font-semibold text-[#c24d2c] hover:underline"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ) : !readOnly ? (
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              onPolicyFileChange(index, e.target.files[0]);
                            }
                          }}
                          className="w-full text-xs text-slate file:mr-3 file:rounded-full file:border-0 file:bg-[#173d5d] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-[#112d45]"
                        />
                      ) : (
                        <p className="text-xs text-slate/50">Nenhum documento.</p>
                      )}
                    </div>
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => onRemovePolicy(index)}
                        className="rounded-full border border-[#c24d2c]/20 bg-[#fff4ef] px-3 py-1.5 text-xs font-semibold text-[#9f3518] transition hover:border-[#c24d2c]/40"
                      >
                        Excluir cobertura
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-4 border-t border-slate/10 pt-4">
            <FormField label="Cobertura adicional - educacao e dependentes">
              <BooleanSelect value={input.protection.dependentEducationInterest} onChange={(value) => onFieldChange('protection.dependentEducationInterest', value)} readOnly={readOnly} fieldPath="protection.dependentEducationInterest" />
            </FormField>
            <FormField label="Anos de cobertura">
              <LocalizedNumberInput value={input.protection.dependentEducationYears} onChange={(event) => onFieldChange('protection.dependentEducationYears', event.target.value, 'number')} readOnly={readOnly} fieldPath="protection.dependentEducationYears" min="0" fractionDigits={0} className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Valor do auxilio mensal">
              <LocalizedNumberInput value={input.protection.dependentEducationMonthlyAid} step="0.01" onChange={(event) => onFieldChange('protection.dependentEducationMonthlyAid', event.target.value, 'number')} readOnly={readOnly} fieldPath="protection.dependentEducationMonthlyAid" className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Valor ideal para cobertura adicional">
              <LocalizedNumberInput value={input.protection.dependentEducationIdealCoverage} step="0.01" onChange={(event) => onFieldChange('protection.dependentEducationIdealCoverage', event.target.value, 'number')} readOnly={readOnly} fieldPath="protection.dependentEducationIdealCoverage" className={inputClassName(readOnly)} />
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
              <LocalizedNumberInput value={input.succession.vgbl} step="0.01" onChange={(event) => onFieldChange('succession.vgbl', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.vgbl" className={inputClassName(readOnly)} />
            </FormField>
            <div className="md:col-span-2 xl:col-span-2">
              <FormField label="Seguro de vida">
                <LocalizedNumberInput value={input.succession.lifeInsurance} step="0.01" onChange={(event) => onFieldChange('succession.lifeInsurance', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.lifeInsurance" className={inputClassName(readOnly)} />
              </FormField>
            </div>
            <FormField label="Bens comuns (aquestos) - total do casal">
              <LocalizedNumberInput value={input.succession.commonAssets} step="0.01" onChange={(event) => onFieldChange('succession.commonAssets', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.commonAssets" className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Bens particulares">
              <LocalizedNumberInput value={input.succession.privateAssets} step="0.01" onChange={(event) => onFieldChange('succession.privateAssets', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.privateAssets" className={inputClassName(readOnly)} />
            </FormField>
            <FormField label="Dividas">
              <LocalizedNumberInput value={input.succession.debts} step="0.01" onChange={(event) => onFieldChange('succession.debts', event.target.value, 'number')} readOnly={readOnly} fieldPath="succession.debts" className={inputClassName(readOnly)} />
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
