import { maritalRegimes, maritalStatuses } from '@yield-360/shared';
import { FormField } from './FormField.jsx';
import { SectionCard } from './SectionCard.jsx';
import { formatCurrency } from '../lib/formatters.js';

function inputClassName() {
  return 'min-w-0 w-full rounded-[18px] border border-slate/10 bg-white px-3 py-2.5 text-sm leading-tight text-slate outline-none transition focus:border-deep focus:ring-4 focus:ring-deep/10';
}

function booleanValue(value) {
  return value ? 'true' : 'false';
}

function BooleanSelect({ value, onChange }) {
  return (
    <select className={inputClassName()} value={booleanValue(value)} onChange={(event) => onChange(event.target.value === 'true')}>
      <option value="true">Sim</option>
      <option value="false">Nao</option>
    </select>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="grid grid-cols-[1.15fr_0.85fr] border-t border-slate/10">
      <div className="px-3 py-2.5 text-sm font-medium leading-snug text-slate">{label}</div>
      <div className="px-3 py-2.5 text-right text-sm font-semibold leading-snug text-slate">{value}</div>
    </div>
  );
}

function buildSelectOptions(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) {
    return options;
  }

  return [currentValue, ...options];
}

export function SuccessionPlanner({ input, succession, onFieldChange }) {
  const maritalStatusOptions = buildSelectOptions(maritalStatuses, input.succession.maritalStatus);

  return (
    <SectionCard
      eyebrow="Aba 4"
      title="Checkup de planejamento sucessorio"
      description="Replica a aba sucessoria da planilha com perguntas essenciais, patrimonio de base, calculo automatico e cobertura disponivel fora do inventario."
    >
      <div className="rounded-[30px] border border-slate/10 bg-white p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-2xl leading-tight text-slate md:text-3xl">Checkup de planejamento sucessorio</h3>
            <p className="mt-1 text-sm text-slate/70">Gerado no app com os mesmos campos centrais mostrados na planilha de referencia.</p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#355f9b]">Resumo compacto</p>
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate/10">
          <div className="bg-[#111111] px-3 py-2.5 text-sm font-semibold text-white">1) Dados e perguntas essenciais</div>
          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Estado civil">
              <select className={inputClassName()} value={input.succession.maritalStatus} onChange={(event) => onFieldChange('succession.maritalStatus', event.target.value)}>
                <option value="">Selecione</option>
                {maritalStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Regime de bens">
              <select className={inputClassName()} value={input.succession.maritalRegime} onChange={(event) => onFieldChange('succession.maritalRegime', event.target.value)}>
                <option value="">Selecione</option>
                {maritalRegimes.map((regime) => (
                  <option key={regime} value={regime}>{regime}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Tem filhos?">
              <BooleanSelect value={input.succession.hasChildren} onChange={(value) => onFieldChange('succession.hasChildren', value)} />
            </FormField>
            <FormField label="Qtd. de filhos">
              <input className={inputClassName()} type="number" value={input.succession.childCount} onChange={(event) => onFieldChange('succession.childCount', event.target.value, 'number')} />
            </FormField>
            <FormField label="Ascendentes vivos?">
              <BooleanSelect value={input.succession.parentsAlive} onChange={(value) => onFieldChange('succession.parentsAlive', value)} />
            </FormField>
            <FormField label="Observacao">
              <input className={inputClassName()} value={input.succession.observations} onChange={(event) => onFieldChange('succession.observations', event.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate/10">
          <div className="bg-[#111111] px-3 py-2.5 text-sm font-semibold text-white">2) Patrimonio para calculo</div>
          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Bens COMUNS (aquestos)">
              <input className={inputClassName()} type="number" step="0.01" value={input.succession.commonAssets} onChange={(event) => onFieldChange('succession.commonAssets', event.target.value, 'number')} />
            </FormField>
            <FormField label="Bens PARTICULARES do falecido">
              <input className={inputClassName()} type="number" step="0.01" value={input.succession.privateAssets} onChange={(event) => onFieldChange('succession.privateAssets', event.target.value, 'number')} />
            </FormField>
            <FormField label="DIVIDAS dedutiveis do falecido">
              <input className={inputClassName()} type="number" step="0.01" value={input.succession.debts} onChange={(event) => onFieldChange('succession.debts', event.target.value, 'number')} />
            </FormField>
            <FormField label="Recursos FORA do inventario">
              <input className={`${inputClassName()} bg-[#f5f7fa]`} readOnly value={formatCurrency((input.succession.lifeInsurance ?? 0) + (input.succession.vgbl ?? 0))} />
            </FormField>
            <div className="md:col-span-2 xl:col-span-2">
              <FormField label="Seguro de vida com beneficiario">
                <input className={inputClassName()} type="number" step="0.01" value={input.succession.lifeInsurance} onChange={(event) => onFieldChange('succession.lifeInsurance', event.target.value, 'number')} />
              </FormField>
            </div>
            <FormField label="VGBL / previdencia privada">
              <input className={inputClassName()} type="number" step="0.01" value={input.succession.vgbl} onChange={(event) => onFieldChange('succession.vgbl', event.target.value, 'number')} />
            </FormField>
            <FormField label="Tem testamento?">
              <BooleanSelect value={input.succession.hasWill} onChange={(value) => onFieldChange('succession.hasWill', value)} />
            </FormField>
            <FormField label="Tem holding patrimonial?">
              <BooleanSelect value={input.succession.hasHolding} onChange={(value) => onFieldChange('succession.hasHolding', value)} />
            </FormField>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate/10 bg-[#fbfcfd]">
          <div className="bg-[#111111] px-3 py-2.5 text-sm font-semibold text-white">3) Calculo automatico</div>
          <SummaryRow label="Meacao do conjuge/companheiro" value={formatCurrency(succession?.spouseShare ?? 0)} />
          <SummaryRow label="ESPOLIO BRUTO (vai para inventario)" value={formatCurrency(succession?.grossEstate ?? 0)} />
          <SummaryRow label="ESPOLIO LIQUIDO (apos dividas)" value={formatCurrency(succession?.netEstate ?? 0)} />
          <SummaryRow label="CUSTO ESTIMADO DO INVENTARIO (20% da base liquida)" value={formatCurrency(succession?.inventoryCost ?? 0)} />
          <SummaryRow label="Recursos disponiveis para custas (fora do inventario)" value={formatCurrency(succession?.offInventoryResources ?? 0)} />
          <SummaryRow label="NECESSIDADE ADICIONAL para inventario" value={formatCurrency(succession?.additionalNeed ?? 0)} />
        </div>
      </div>
    </SectionCard>
  );
}
