import { plannerSections } from '@yield-360/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard.jsx';
import { FuturePanel } from '../components/FuturePanel.jsx';
import { ResultsShowcase } from '../components/ResultsShowcase.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { SuccessionPlanner } from '../components/SuccessionPlanner.jsx';
import { Vision360Form } from '../components/Vision360Form.jsx';
import { analyzePlan, getHealth, getPlan, savePlan, updatePlan } from '../lib/api.js';
import { getLastContactStatus } from '../lib/last-contact.js';
import { createEmptyPlannerInput, hydratePlannerInput, updateNestedValue } from '../lib/planner-state.js';
import { formatDate } from '../lib/formatters.js';

function TabButton({ active, label, description, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-[24px] border px-5 py-4 text-left transition ${
				active
					? 'border-[#173d5d] bg-[#173d5d] text-white shadow-[0_18px_40px_rgba(23,61,93,0.28)]'
					: 'border-slate/10 bg-white text-slate hover:border-[#173d5d]/30'
			}`}
		>
			<p className="font-semibold uppercase tracking-[0.16em]">{label}</p>
			<p className={`mt-2 text-sm ${active ? 'text-white/72' : 'text-slate/64'}`}>{description}</p>
		</button>
	);
}

function LastContactBadge({ lastContactAt }) {
	const status = getLastContactStatus(lastContactAt);

	return (
		<div className="flex items-center gap-3 text-sm text-white/82">
			<span className={`h-3.5 w-3.5 rounded-full ${status.colorClass}`} aria-hidden="true" />
			<div className="grid gap-0.5">
				<p className="font-semibold text-white">{status.label}</p>
				<p className="text-white/74">{status.formattedDate}</p>
				<p className="text-white/74">{status.daysLabel}</p>
			</div>
		</div>
	);
}

export function InputDataPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const planId = searchParams.get('planId') ?? '';
	const [input, setInput] = useState(() => createEmptyPlannerInput());
	const [report, setReport] = useState(null);
	const [health, setHealth] = useState(null);
	const [activePlanId, setActivePlanId] = useState(planId);
	const [activeTab, setActiveTab] = useState(plannerSections[0].id);
	const [loading, setLoading] = useState(true);
	const [analyzing, setAnalyzing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		let cancelled = false;

		async function bootstrap() {
			setLoading(true);
			setError('');

			try {
				const healthData = await getHealth();

				if (cancelled) {
					return;
				}

				setHealth(healthData);

				if (!planId) {
					setActivePlanId('');
					setInput(createEmptyPlannerInput());
					setReport(null);
					return;
				}

				const data = await getPlan(planId);

				if (!cancelled) {
					setActivePlanId(data.planId);
					setInput(hydratePlannerInput(data.input));
					setReport(data.report);
				}
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
	}, [planId]);

	function handleFieldChange(path, value, type = 'text') {
		setInput((currentState) => updateNestedValue(currentState, path, value, type));
	}

	async function handleAnalyze() {
		setAnalyzing(true);
		setError('');

		try {
			const data = await analyzePlan(input);
			setReport(data.report);
			setInput(hydratePlannerInput(data.input));
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setAnalyzing(false);
		}
	}

	async function handleSave() {
		setSaving(true);
		setError('');

		try {
			const data = activePlanId ? await updatePlan(activePlanId, input) : await savePlan(input);

			setActivePlanId(data.planId);
			setInput(hydratePlannerInput(data.input));
			setReport(data.report);

			if (!planId || planId !== data.planId) {
				setSearchParams({ planId: data.planId });
			}
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	}

	async function handleUpdateLastContact() {
		if (!activePlanId) {
			return;
		}

		setSaving(true);
		setError('');

		try {
			const nextInput = hydratePlannerInput({
				...input,
				metadata: {
					...input.metadata,
					lastContactAt: new Date().toISOString()
				}
			});

			const data = await updatePlan(activePlanId, nextInput);

			setActivePlanId(data.planId);
			setInput(hydratePlannerInput(data.input));
			setReport(data.report);
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	}

	const overview = report?.modules?.overview;
	const future = report?.modules?.future;
	const succession = report?.modules?.succession;
	const control = report?.modules?.control;
	const results = report?.modules?.results;
	const lastContactAt = input.metadata?.lastContactAt ?? '';
	const activeSection = plannerSections.find((section) => section.id === activeTab) ?? plannerSections[0];

	function renderActiveTab() {
		if (!report && activeTab !== 'visao360') {
			return (
				<SectionCard
					eyebrow={activeSection.title}
					title="Calcule o cliente para liberar esta aba"
					description="A aba Visao 360 aceita edicao direta. As abas de resultados dependem do processamento do backend."
				>
					<div className="rounded-[24px] border border-dashed border-slate/20 bg-white/80 p-8 text-center text-slate/68">
						Preencha os dados e clique em calcular para gerar os indicadores.
					</div>
				</SectionCard>
			);
		}

		if (activeTab === 'visao360') {
			return <Vision360Form input={input} overview={overview} onFieldChange={handleFieldChange} />;
		}

		if (activeTab === 'resultados') {
			return <ResultsShowcase input={input} results={results} />;
		}

		if (activeTab === 'futuro') {
			return <FuturePanel future={future} />;
		}

		if (activeTab === 'sucessorio') {
			return <SuccessionPlanner input={input} succession={succession} onFieldChange={handleFieldChange} />;
		}

		return <ExecutiveDashboard input={input} control={control} succession={succession} />;
	}

	return (
		<div className="grid gap-6">
			<SectionCard
				eyebrow={activePlanId ? 'Editar cliente' : 'Adicionar cliente'}
				title={activePlanId ? 'Edicao do cadastro e simulacao' : 'Novo cliente'}
				description="Os campos iniciam vazios. Valores numericos iguais a zero ficam em branco para o preenchimento manual, e o mesmo formulario serve para criar ou editar clientes."
			>
				<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
					<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
						{plannerSections.map((section) => (
							<TabButton
								key={section.id}
								active={activeTab === section.id}
								label={section.title}
								description={section.description}
								onClick={() => setActiveTab(section.id)}
							/>
						))}
					</div>

					<div className="grid gap-3 rounded-[28px] border border-slate/10 bg-[#173d5d] p-5 text-white">
						<div className="flex items-center justify-between gap-3">
							<span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Estado da API</span>
							<span className={`rounded-full px-3 py-1 text-xs font-semibold ${health?.database?.pingOk ? 'bg-white/15 text-white' : 'bg-[#f67a42] text-white'}`}>
								{health?.database?.pingOk ? 'Online' : 'A verificar'}
							</span>
						</div>
						<p className="font-display text-4xl">{report?.summary?.clientName || input.client.name || 'Novo cliente'}</p>
						<p className="text-sm text-white/74">
							{report
								? `Ultimo calculo: ${formatDate(report.generatedAt)} · Perfil ${report.summary.investorProfile || 'Nao informado'}`
								: 'Preencha os dados para gerar o snapshot do cliente.'}
						</p>
						<LastContactBadge lastContactAt={lastContactAt} />
						<div className="mt-2 flex flex-wrap gap-3">
							<button
								type="button"
								onClick={handleAnalyze}
								disabled={analyzing || saving || loading}
								className="rounded-full bg-white px-5 py-3 font-semibold text-slate transition hover:bg-[#eef2f5] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{analyzing ? 'A calcular...' : 'Calcular plano'}
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving || analyzing || loading}
								className="rounded-full border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? 'A guardar...' : activePlanId ? 'Atualizar cliente' : 'Guardar cliente'}
							</button>
							{activePlanId ? (
								<button
									type="button"
									onClick={handleUpdateLastContact}
									disabled={saving || analyzing || loading}
									className="rounded-full border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Atualizar ultimo contato
								</button>
							) : null}
						</div>
						{error ? <p className="text-sm text-[#ffd5c6]">{error}</p> : null}
					</div>
				</div>
			</SectionCard>

			{loading ? (
				<SectionCard title="A carregar cliente">
					<p className="text-sm text-slate/65">A carregar dados do cliente selecionado...</p>
				</SectionCard>
			) : (
				renderActiveTab()
			)}
		</div>
	);
}