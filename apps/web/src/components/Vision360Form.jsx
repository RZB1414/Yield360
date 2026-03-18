import { investorProfiles, maritalRegimes } from '@yield-360/shared';
import { FormField } from './FormField.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatCurrency, formatPlainNumber } from '../lib/formatters.js';

function inputClassName(readOnly = false) {
  return `w-full rounded-2xl border border-slate/10 px-4 py-3 text-slate outline-none transition ${
    readOnly ? 'bg-[#f5f7fa]' : 'bg-white focus:border-deep focus:ring-4 focus:ring-deep/10'
  }`;
}

function blockClassName() {
  return 'rounded-[28px] border border-slate/10 bg-white p-5 shadow-[0_16px_40px_rgba(23,38,50,0.08)]';
}

function booleanValue(value) {
  return value ? 'true' : 'false';
}

function editableNumberValue(value, readOnly) {
  if (readOnly) {
    return value ?? 0;
  }

  return Number(value ?? 0) === 0 ? '' : value;
}

function TextInput({ value, onChange, readOnly = false, type = 'text', step }) {
  return (
    <input
      className={inputClassName(readOnly)}
      type={type}
      step={step}
      value={value ?? ''}
      onChange={readOnly ? undefined : onChange}
      readOnly={readOnly}
    />
  );
}

function NumberInput({ value, onChange, readOnly = false, step }) {
  return (
    <input
      className={inputClassName(readOnly)}
      type="number"
      step={step}
      value={editableNumberValue(value, readOnly)}
      onChange={readOnly ? undefined : onChange}
      readOnly={readOnly}
    />
  );
}

function SelectInput({ value, onChange, options, readOnly = false, emptyLabel = 'Selecione' }) {
  return (
    <select className={inputClassName(readOnly)} value={value ?? ''} onChange={readOnly ? undefined : onChange} disabled={readOnly}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function BooleanSelect({ value, onChange, readOnly = false }) {
  return (
    <select
      className={inputClassName(readOnly)}
      value={booleanValue(value)}
      onChange={readOnly ? undefined : (event) => onChange(event.target.value === 'true')}
      disabled={readOnly}
    >
      <option value="true">Sim</option>
      <option value="false">Nao</option>
    </select>
  );
}

function SummaryValue({ label, value, tone = 'currency' }) {
  const renderedValue = tone === 'number' ? formatPlainNumber(value) : formatCurrency(value);

  return (
    <div className="rounded-[22px] border border-slate/10 bg-[#f7faf7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate/50">{label}</p>
      <p className="mt-3 font-display text-3xl text-slate">{renderedValue}</p>
    </div>
  );
}

export function Vision360Form({ input, overview, onFieldChange, readOnly = false }) {
  const familyInputs = input.family?.members ?? [];
  const familyMembers = overview?.familyMembers ?? [];
  const balanceRows = [
    { label: 'Ativos financeiros', path: 'vision360.assets.financial', value: input.vision360.assets.financial },
    { label: 'Ativos imobilizados', path: 'vision360.assets.immobilized', value: input.vision360.assets.immobilized },
    { label: 'Ativos outros', path: 'vision360.assets.other', value: input.vision360.assets.other },
    { label: 'Passivos emprestimos', path: 'vision360.liabilities.loans', value: input.vision360.liabilities.loans },
    { label: 'Passivos financiamentos', path: 'vision360.liabilities.financing', value: input.vision360.liabilities.financing },
    { label: 'Passivos consorcios', path: 'vision360.liabilities.consortiums', value: input.vision360.liabilities.consortiums },
    { label: 'Passivos outros', path: 'vision360.liabilities.other', value: input.vision360.liabilities.other }
  ];

  const protectionRows = [
    ['Cobertura para invalidez total', 'protection.totalDisability', 'protection.totalDisabilityCoverage'],
    ['Cobertura para doencas graves', 'protection.criticalIllness', 'protection.criticalIllnessCoverage'],
    ['Cirurgias', 'protection.surgeries', 'protection.surgeriesCoverage'],
    ['Diaria por internacao', 'protection.hospitalDaily', 'protection.hospitalDailyCoverage'],
    ['DIT (diaria por incapacidade temporaria)', 'protection.temporaryDisability', 'protection.temporaryDisabilityCoverage']
  ];

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
      <div className="grid gap-6">
        <div className={blockClassName()}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">1. Informacoes do cliente</p>
              <h3 className="mt-2 font-display text-3xl text-slate">Diagnostico principal</h3>
            </div>
            <div className="rounded-[20px] bg-[#355f9b] px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Idade</p>
              <p className="mt-1 font-display text-3xl">{formatPlainNumber(overview?.age ?? 0)}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FormField label="Nome">
              <TextInput value={input.client.name} onChange={(event) => onFieldChange('client.name', event.target.value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Perfil do investidor">
              <SelectInput
                value={input.client.investorProfile}
                onChange={(event) => onFieldChange('client.investorProfile', event.target.value)}
                options={investorProfiles}
                readOnly={readOnly}
              />
            </FormField>
            <FormField label="Nascimento">
              <TextInput value={input.client.birthDate} type="date" onChange={(event) => onFieldChange('client.birthDate', event.target.value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Idade calculada">
              <TextInput value={overview?.age ?? ''} readOnly />
            </FormField>
            <FormField label="Profissao">
              <TextInput value={input.client.profession} onChange={(event) => onFieldChange('client.profession', event.target.value)} readOnly={readOnly} />
            </FormField>
          </div>
        </div>

        <div className={blockClassName()}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">2. Informacoes familiares</p>
          <div className="overflow-hidden rounded-[22px] border border-slate/10">
            <table className="min-w-full border-collapse text-sm text-slate">
              <thead className="bg-[#e8f0fb] text-slate">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Parentesco</th>
                  <th className="px-4 py-3 text-left">Nascimento</th>
                  <th className="px-4 py-3 text-left">Idade</th>
                  <th className="px-4 py-3 text-left">Profissao</th>
                </tr>
              </thead>
              <tbody>
                {familyInputs.map((member, index) => (
                  <tr key={`family-${index}`} className="border-t border-slate/10">
                    <td className="px-3 py-2"><TextInput value={member.name} onChange={(event) => onFieldChange(`family.members.${index}.name`, event.target.value)} readOnly={readOnly} /></td>
                    <td className="px-3 py-2"><TextInput value={member.relationship} onChange={(event) => onFieldChange(`family.members.${index}.relationship`, event.target.value)} readOnly={readOnly} /></td>
                    <td className="px-3 py-2"><TextInput value={member.birthDate} type="date" onChange={(event) => onFieldChange(`family.members.${index}.birthDate`, event.target.value)} readOnly={readOnly} /></td>
                    <td className="px-3 py-2"><TextInput value={familyMembers[index]?.age ?? ''} readOnly /></td>
                    <td className="px-3 py-2"><TextInput value={member.profession} onChange={(event) => onFieldChange(`family.members.${index}.profession`, event.target.value)} readOnly={readOnly} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">3. Balanco patrimonial</p>
            <div className="grid gap-4 md:grid-cols-2">
              {balanceRows.map((row) => (
                <FormField key={row.path} label={row.label}>
                  <NumberInput value={row.value} step="0.01" onChange={(event) => onFieldChange(row.path, event.target.value, 'number')} readOnly={readOnly} />
                </FormField>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SummaryValue label="Ativos totais" value={overview?.totalAssets ?? 0} />
              <SummaryValue label="Passivos totais" value={overview?.totalLiabilities ?? 0} />
              <SummaryValue label="Patrimonio liquido" value={overview?.netWorth ?? 0} />
            </div>
          </div>

          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">4. Dados orcamentarios</p>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Regime de trabalho">
                <TextInput value={input.vision360.budget.workRegime} onChange={(event) => onFieldChange('vision360.budget.workRegime', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Tipo de declaracao de IR">
                <TextInput value={input.vision360.budget.taxDeclaration} onChange={(event) => onFieldChange('vision360.budget.taxDeclaration', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Ganho mensal aproximado">
                <NumberInput value={input.vision360.budget.monthlyIncome} step="0.01" onChange={(event) => onFieldChange('vision360.budget.monthlyIncome', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Ganho anual aproximado">
                <TextInput value={formatCurrency(overview?.annualIncome ?? 0)} readOnly />
              </FormField>
              <FormField label="Despesa mensal aproximada">
                <NumberInput value={input.vision360.budget.monthlyExpenses} step="0.01" onChange={(event) => onFieldChange('vision360.budget.monthlyExpenses', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Despesa anual aproximada">
                <TextInput value={formatCurrency(overview?.annualExpenses ?? 0)} readOnly />
              </FormField>
              <FormField label="Reserva de emergencia - Ja possui?">
                <BooleanSelect value={input.vision360.budget.emergencyReserveHas} onChange={(value) => onFieldChange('vision360.budget.emergencyReserveHas', value)} readOnly={readOnly} />
              </FormField>
              <FormField label="PGBL?">
                <BooleanSelect value={input.vision360.budget.hasPGBL} onChange={(value) => onFieldChange('vision360.budget.hasPGBL', value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Reserva de emergencia - Necessidade">
                <NumberInput value={input.vision360.budget.emergencyReserveNeed} step="0.01" onChange={(event) => onFieldChange('vision360.budget.emergencyReserveNeed', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Reserva adicional - Objetivo de curto prazo">
                <NumberInput value={input.vision360.budget.shortTermReserveTarget} step="0.01" onChange={(event) => onFieldChange('vision360.budget.shortTermReserveTarget', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Reserva de emergencia - Valor atual">
                <NumberInput value={input.vision360.budget.emergencyReserveCurrent} step="0.01" onChange={(event) => onFieldChange('vision360.budget.emergencyReserveCurrent', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Observacoes / comentarios">
                <TextInput value={input.vision360.budget.notes} onChange={(event) => onFieldChange('vision360.budget.notes', event.target.value)} readOnly={readOnly} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">5. Objetivos e plano de investimentos</p>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Idade na data da contratacao da consultoria">
                <NumberInput value={input.planning.consultantStartAge} onChange={(event) => onFieldChange('planning.consultantStartAge', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Valor inicial sob consultoria">
                <NumberInput value={input.planning.initialConsultingValue} step="0.01" onChange={(event) => onFieldChange('planning.initialConsultingValue', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Qual a sua fase de vida?">
                <TextInput value={input.planning.lifePhase} onChange={(event) => onFieldChange('planning.lifePhase', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Quantos anos pretende ficar nesta fase?">
                <NumberInput value={input.planning.phaseDurationYears} onChange={(event) => onFieldChange('planning.phaseDurationYears', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Qual e o aporte mensal acordado?">
                <NumberInput value={input.future.agreedMonthlyContribution} step="0.01" onChange={(event) => onFieldChange('future.agreedMonthlyContribution', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Qual o dia do aporte acordado?">
                <NumberInput value={input.planning.contributionDay} onChange={(event) => onFieldChange('planning.contributionDay', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Aportes adicionais">
                <NumberInput value={input.planning.extraContributions} step="0.01" onChange={(event) => onFieldChange('planning.extraContributions', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Aporte anual">
                <NumberInput value={input.planning.annualContributionGoal} step="0.01" onChange={(event) => onFieldChange('planning.annualContributionGoal', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Quer renda dos investimentos na aposentadoria?">
                <BooleanSelect value={input.planning.wantsRetirementIncome} onChange={(value) => onFieldChange('planning.wantsRetirementIncome', value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Se sim, qual a renda mensal desejada?">
                <NumberInput value={input.future.desiredMonthlyRetirementSpend} step="0.01" onChange={(event) => onFieldChange('future.desiredMonthlyRetirementSpend', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Tem renda extra prevista?">
                <BooleanSelect value={input.planning.extraIncomeExpected} onChange={(value) => onFieldChange('planning.extraIncomeExpected', value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Se sim, qual a renda mensal prevista?">
                <NumberInput value={input.planning.extraMonthlyIncome} step="0.01" onChange={(event) => onFieldChange('planning.extraMonthlyIncome', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Existem outros objetivos?">
                <TextInput value={input.planning.otherObjectivesComment} onChange={(event) => onFieldChange('planning.otherObjectivesComment', event.target.value)} readOnly={readOnly} />
              </FormField>
            </div>
          </div>

          <div className={blockClassName()}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">6. Validacao do perfil do investidor</p>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Perfil sugerido">
                <SelectInput
                  value={input.profileValidation.suggestedProfile}
                  onChange={(event) => onFieldChange('profileValidation.suggestedProfile', event.target.value)}
                  options={investorProfiles}
                  readOnly={readOnly}
                />
              </FormField>
              <FormField label="Capacidade financeira">
                <TextInput value={input.profileValidation.financialCapacity} onChange={(event) => onFieldChange('profileValidation.financialCapacity', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Capacidade emocional">
                <TextInput value={input.profileValidation.emotionalCapacity} onChange={(event) => onFieldChange('profileValidation.emotionalCapacity', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Benchmark referencia para longo prazo">
                <TextInput value={input.profileValidation.benchmarkLabel} onChange={(event) => onFieldChange('profileValidation.benchmarkLabel', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Taxa do benchmark (%)">
                <NumberInput value={input.profileValidation.benchmarkRate} step="0.01" onChange={(event) => onFieldChange('profileValidation.benchmarkRate', event.target.value, 'number')} readOnly={readOnly} />
              </FormField>
              <FormField label="Prazo">
                <TextInput value={input.profileValidation.term} onChange={(event) => onFieldChange('profileValidation.term', event.target.value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Itens validados?">
                <BooleanSelect value={input.profileValidation.validated} onChange={(value) => onFieldChange('profileValidation.validated', value)} readOnly={readOnly} />
              </FormField>
              <FormField label="Comentario">
                <TextInput value={input.profileValidation.notes} onChange={(event) => onFieldChange('profileValidation.notes', event.target.value)} readOnly={readOnly} />
              </FormField>
            </div>
          </div>
        </div>

        <div className={blockClassName()}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">7. Blindagem patrimonial</p>
          <div className="overflow-hidden rounded-[22px] border border-slate/10">
            <table className="min-w-full border-collapse text-sm text-slate">
              <thead className="bg-[#e8f0fb]">
                <tr>
                  <th className="px-4 py-3 text-left">Cobertura</th>
                  <th className="px-4 py-3 text-left">Possui?</th>
                  <th className="px-4 py-3 text-left">Valor</th>
                </tr>
              </thead>
              <tbody>
                {protectionRows.map(([label, booleanPath, valuePath]) => {
                  const hasCoverage = booleanPath.split('.').reduce((cursor, key) => cursor?.[key], input);
                  const coverageValue = valuePath.split('.').reduce((cursor, key) => cursor?.[key], input);

                  return (
                    <tr key={label} className="border-t border-slate/10">
                      <td className="px-4 py-3 font-semibold">{label}</td>
                      <td className="px-4 py-3"><BooleanSelect value={hasCoverage} onChange={(value) => onFieldChange(booleanPath, value)} readOnly={readOnly} /></td>
                      <td className="px-4 py-3"><NumberInput value={coverageValue} step="0.01" onChange={(event) => onFieldChange(valuePath, event.target.value, 'number')} readOnly={readOnly} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <FormField label="Cobertura adicional - educacao e dependentes">
              <BooleanSelect value={input.protection.dependentEducationInterest} onChange={(value) => onFieldChange('protection.dependentEducationInterest', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Anos de cobertura">
              <NumberInput value={input.protection.dependentEducationYears} onChange={(event) => onFieldChange('protection.dependentEducationYears', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Valor do auxilio mensal">
              <NumberInput value={input.protection.dependentEducationMonthlyAid} step="0.01" onChange={(event) => onFieldChange('protection.dependentEducationMonthlyAid', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Valor ideal para cobertura adicional">
              <NumberInput value={input.protection.dependentEducationIdealCoverage} step="0.01" onChange={(event) => onFieldChange('protection.dependentEducationIdealCoverage', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
          </div>
        </div>

        <div className={blockClassName()}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-clay">8. Planejamento sucessorio</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Estado civil">
              <TextInput value={input.succession.maritalStatus} onChange={(event) => onFieldChange('succession.maritalStatus', event.target.value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Regime de bens">
              <SelectInput
                value={input.succession.maritalRegime}
                onChange={(event) => onFieldChange('succession.maritalRegime', event.target.value)}
                options={maritalRegimes}
                readOnly={readOnly}
              />
            </FormField>
            <FormField label="Filhos?">
              <BooleanSelect value={input.succession.hasChildren} onChange={(value) => onFieldChange('succession.hasChildren', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Quantidade de filhos">
              <NumberInput value={input.succession.childCount} onChange={(event) => onFieldChange('succession.childCount', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Ascendentes vivos (pais)?">
              <BooleanSelect value={input.succession.parentsAlive} onChange={(value) => onFieldChange('succession.parentsAlive', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="VGBL">
              <NumberInput value={input.succession.vgbl} step="0.01" onChange={(event) => onFieldChange('succession.vgbl', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Seguro de vida">
              <NumberInput value={input.succession.lifeInsurance} step="0.01" onChange={(event) => onFieldChange('succession.lifeInsurance', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Bens comuns (aquestos) - total do casal">
              <NumberInput value={input.succession.commonAssets} step="0.01" onChange={(event) => onFieldChange('succession.commonAssets', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Bens particulares">
              <NumberInput value={input.succession.privateAssets} step="0.01" onChange={(event) => onFieldChange('succession.privateAssets', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Dividas">
              <NumberInput value={input.succession.debts} step="0.01" onChange={(event) => onFieldChange('succession.debts', event.target.value, 'number')} readOnly={readOnly} />
            </FormField>
            <FormField label="Potenciais conflitos na sucessao?">
              <TextInput value={input.succession.conflictsComment} onChange={(event) => onFieldChange('succession.conflictsComment', event.target.value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Voce tem testamento?">
              <BooleanSelect value={input.succession.hasWill} onChange={(value) => onFieldChange('succession.hasWill', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Ja fez ou faz doacoes em vida?">
              <BooleanSelect value={input.succession.hasLifetimeDonations} onChange={(value) => onFieldChange('succession.hasLifetimeDonations', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Voce tem holding patrimonial?">
              <BooleanSelect value={input.succession.hasHolding} onChange={(value) => onFieldChange('succession.hasHolding', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Voce tem negocios offshore?">
              <BooleanSelect value={input.succession.hasOffshore} onChange={(value) => onFieldChange('succession.hasOffshore', value)} readOnly={readOnly} />
            </FormField>
            <FormField label="Observacoes / comentarios">
              <TextInput value={input.succession.observations} onChange={(event) => onFieldChange('succession.observations', event.target.value)} readOnly={readOnly} />
            </FormField>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
