import { plannerSections } from '@yield-360/shared';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExecutiveDashboard } from '../components/ExecutiveDashboard.jsx';
import { FuturePanel } from '../components/FuturePanel.jsx';
import { ResultsShowcase } from '../components/ResultsShowcase.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { SuccessionPlanner } from '../components/SuccessionPlanner.jsx';
import { Vision360Form } from '../components/Vision360Form.jsx';
import { analyzePlan, getHealth, getPlan, savePlan, updatePlan, uploadPlanDocument } from '../lib/api.js';
import { getLastContactStatus } from '../lib/last-contact.js';
import { createEmptyPlannerInput, hydratePlannerInput, updateNestedValue } from '../lib/planner-state.js';
import { formatDate } from '../lib/formatters.js';

const fieldTabMap = {
	'client.name': 'visao360',
	'client.birthDate': 'visao360',
	'planning.consultantStartAge': 'visao360',
	'future.targetAge': 'visao360'
};

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

function buildBirthDateFromAge(ageValue) {
	if (ageValue === '') {
		return '';
	}

	const parsedAge = Number(ageValue);

	if (!Number.isFinite(parsedAge) || parsedAge < 0) {
		return null;
	}

	const age = Math.floor(parsedAge);
	const today = new Date();
	const birthYear = today.getUTCFullYear() - age;
	const birthDate = new Date(Date.UTC(birthYear, today.getUTCMonth(), today.getUTCDate()));

	return birthDate.toISOString().slice(0, 10);
}

function sumSuccessionCommonAssetsItems(items = []) {
	return items.reduce((total, item) => total + Number(item?.value ?? 0), 0);
}

function applyDerivedInputRules(input) {
	const nextState = structuredClone(input);
	const annualContributionGoal = Number(nextState.future.agreedMonthlyContribution ?? 0) * 12 + Number(nextState.planning.extraContributions ?? 0);

	nextState.planning.annualContributionGoal = Number.isFinite(annualContributionGoal) ? annualContributionGoal : 0;
	nextState.succession.commonAssets = sumSuccessionCommonAssetsItems(nextState.succession.commonAssetsItems ?? []);

	if (!nextState.vision360.budget.emergencyReserveHas) {
		nextState.vision360.budget.emergencyReserveCurrent = 0;
	}

	if (!nextState.planning.wantsRetirementIncome) {
		nextState.future.desiredMonthlyRetirementSpend = 0;
	}

	if (!nextState.planning.extraIncomeExpected) {
		nextState.planning.extraMonthlyIncome = 0;
	}

	return nextState;
}

function validatePlannerInput(input) {
	const nextFieldErrors = {};
	const currentAge = calculateAgeFromBirthDate(input.client.birthDate);
	const targetAge = Number(input.future.targetAge ?? 0);
	const consultantStartAge = Number(input.planning.consultantStartAge ?? 0);

	if (!input.client.name.trim()) {
		nextFieldErrors['client.name'] = 'Informe o nome do cliente.';
	}

	if (!input.client.birthDate) {
		nextFieldErrors['client.birthDate'] = 'Informe a data de nascimento ou a idade.';
	} else if (currentAge === null) {
		nextFieldErrors['client.birthDate'] = 'Informe uma data de nascimento valida.';
	}

	if (consultantStartAge <= 0) {
		nextFieldErrors['planning.consultantStartAge'] = 'Informe a idade na contratacao da consultoria.';
	}

	if (targetAge <= 0) {
		nextFieldErrors['future.targetAge'] = 'Informe a idade objetivo da aposentadoria.';
	} else if (currentAge !== null && targetAge <= currentAge) {
		nextFieldErrors['future.targetAge'] = 'A idade objetivo deve ser maior que a idade atual.';
	}

	return nextFieldErrors;
}

function mapRequestErrorToFieldErrors(message) {
	if (!message) {
		return {};
	}

	if (message.includes('client name is required')) {
		return { 'client.name': 'Informe o nome do cliente.' };
	}

	if (message.includes('invalid birth date')) {
		return { 'client.birthDate': 'Informe uma data de nascimento valida.' };
	}

	if (message.includes('target age must be greater than current age')) {
		return { 'future.targetAge': 'A idade objetivo deve ser maior que a idade atual.' };
	}

	return {};
}

function scrollToField(path) {
	if (!path) {
		return;
	}

	let remainingAttempts = 6;

	function attemptScroll() {
		const element = document.querySelector(`[data-field-path="${path}"]`);

		if (!element) {
			remainingAttempts -= 1;

			if (remainingAttempts > 0) {
				window.setTimeout(attemptScroll, 60);
			}

			return;
		}

		element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		element.focus({ preventScroll: true });
	}

	window.setTimeout(attemptScroll, 50);
}

function TabButton({ active, label, description, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-[24px] border px-5 py-4 text-left transition ${active
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
	const navigate = useNavigate();
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
	const [fieldErrors, setFieldErrors] = useState({});

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
					setInput(applyDerivedInputRules(hydratePlannerInput(data.input)));
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
		setFieldErrors((currentErrors) => {
			if (!currentErrors[path] && !(path === 'client.birthDate' && currentErrors['planning.consultantStartAge'])) {
				return currentErrors;
			}

			const nextErrors = { ...currentErrors };
			delete nextErrors[path];

			if (path === 'client.birthDate') {
				delete nextErrors['planning.consultantStartAge'];
			}

			return nextErrors;
		});

		setInput((currentState) => {
			const previousClientAge = calculateAgeFromBirthDate(currentState.client.birthDate);
			let nextState = updateNestedValue(currentState, path, value, type);

			if (path === 'client.birthDate') {
				const nextClientAge = calculateAgeFromBirthDate(nextState.client.birthDate);
				const shouldSyncConsultantAge =
					currentState.planning.consultantStartAge === 0 || currentState.planning.consultantStartAge === previousClientAge;

				if (shouldSyncConsultantAge && nextClientAge !== null) {
					nextState = updateNestedValue(nextState, 'planning.consultantStartAge', nextClientAge, 'number');
				}
			}

			if (
				path === 'client.investorProfile' || 
				path === 'profileValidation.suggestedProfile' || 
				path === 'future.inflationRate' ||
				path === 'profileValidation.benchmarkRate'
			) {
				const isProfileUpdate = path === 'client.investorProfile' || path === 'profileValidation.suggestedProfile';
				const profileValue = isProfileUpdate ? value : nextState.client.investorProfile;

				if (isProfileUpdate) {
					const otherPath = path === 'client.investorProfile' ? 'profileValidation.suggestedProfile' : 'client.investorProfile';
					nextState = updateNestedValue(nextState, otherPath, value);
				}

				const profileConfigs = {
					'Conservador': {
						emotionalCapacity: 'Não tolera perdas',
						benchmarkLabel: 'IPCA+ 4%',
						benchmarkRate: 4,
						term: '1 ano - 3 anos'
					},
					'Moderado': {
						emotionalCapacity: 'Tolera quedas moderadas (-2% a -5%)',
						benchmarkLabel: 'IPCA+ 5%',
						benchmarkRate: 5,
						term: '3 anos - 5 anos'
					},
					'Arrojado': {
						emotionalCapacity: 'Tolera quedas maiores (-5% a -15%)',
						benchmarkLabel: 'IPCA+ 6%',
						benchmarkRate: 6,
						term: '5 anos - 7 anos'
					},
					'Agressivo': {
						emotionalCapacity: 'Tolera quedas significativas (> -15%)',
						benchmarkLabel: 'IPCA+ 8%',
						benchmarkRate: 8,
						term: '+ 7 anos'
					}
				};

				const config = profileConfigs[profileValue];
				if (config) {
					if (isProfileUpdate) {
						nextState = updateNestedValue(nextState, 'profileValidation.emotionalCapacity', config.emotionalCapacity);
						nextState = updateNestedValue(nextState, 'profileValidation.benchmarkLabel', config.benchmarkLabel);
						nextState = updateNestedValue(nextState, 'profileValidation.benchmarkRate', config.benchmarkRate, 'number');
						nextState = updateNestedValue(nextState, 'profileValidation.term', config.term);
					}

					const realRate = Number(nextState.profileValidation.benchmarkRate ?? config.benchmarkRate) / 100;
					const inflationRate = Number(nextState.future.inflationRate ?? 0) / 100;
					const nominalRate = ((1 + realRate) * (1 + inflationRate) - 1) * 100;
					nextState = updateNestedValue(nextState, 'future.nominalAnnualRate', nominalRate, 'number');
				}
			}

			return applyDerivedInputRules(nextState);
		});
	}

	function handleClientAgeChange(ageValue) {
		setFieldErrors((currentErrors) => {
			const nextErrors = { ...currentErrors };
			delete nextErrors['client.birthDate'];
			delete nextErrors['planning.consultantStartAge'];
			return nextErrors;
		});

		setInput((currentState) => {
			const previousClientAge = calculateAgeFromBirthDate(currentState.client.birthDate);
			const nextBirthDate = buildBirthDateFromAge(ageValue);

			if (nextBirthDate === null) {
				return currentState;
			}

			let nextState = updateNestedValue(currentState, 'client.birthDate', nextBirthDate);
			const nextClientAge = calculateAgeFromBirthDate(nextBirthDate);
			const shouldSyncConsultantAge =
				currentState.planning.consultantStartAge === 0 || currentState.planning.consultantStartAge === previousClientAge;

			if (shouldSyncConsultantAge) {
				nextState = updateNestedValue(nextState, 'planning.consultantStartAge', nextClientAge ?? 0, 'number');
			}

			return applyDerivedInputRules(nextState);
		});
	}

	function handleFamilyMemberAgeChange(index, ageValue) {
		const nextBirthDate = buildBirthDateFromAge(ageValue);

		if (nextBirthDate === null) {
			return;
		}

		setInput((currentState) => applyDerivedInputRules(updateNestedValue(currentState, `family.members.${index}.birthDate`, nextBirthDate)));
	}

	function handleAddFamilyMember() {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.family.members = [
				...(nextState.family.members ?? []),
				{ name: '', relationship: '', birthDate: '', profession: '' }
			];
			return applyDerivedInputRules(nextState);
		});
	}

	function handleRemoveFamilyMember(index) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.family.members = (nextState.family.members ?? []).filter((_, memberIndex) => memberIndex !== index);
			return applyDerivedInputRules(nextState);
		});
	}

	function handleAddAsset(item = { description: '', value: 0 }) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.vision360.assets.items = [
				...(nextState.vision360.assets.items ?? []),
				{ description: item.description ?? '', value: Number(item.value ?? 0), comment: item.comment ?? '' }
			];
			return applyDerivedInputRules(nextState);
		});
	}

	function handleRemoveAsset(index) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.vision360.assets.items = (nextState.vision360.assets.items ?? []).filter((_, i) => i !== index);
			return applyDerivedInputRules(nextState);
		});
	}

	function handleAddLiability(item = { description: '', value: 0 }) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.vision360.liabilities.items = [
				...(nextState.vision360.liabilities.items ?? []),
				{ description: item.description ?? '', value: Number(item.value ?? 0), comment: item.comment ?? '' }
			];
			return applyDerivedInputRules(nextState);
		});
	}

	function handleRemoveLiability(index) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.vision360.liabilities.items = (nextState.vision360.liabilities.items ?? []).filter((_, i) => i !== index);
			return applyDerivedInputRules(nextState);
		});
	}

	function handleAddSuccessionCommonAsset() {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.succession.commonAssetsItems = [
				...(nextState.succession.commonAssetsItems ?? []),
				{ id: crypto.randomUUID(), name: '', value: 0, notes: '' }
			];
			return applyDerivedInputRules(nextState);
		});
	}

	function handleRemoveSuccessionCommonAsset(index) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.succession.commonAssetsItems = (nextState.succession.commonAssetsItems ?? []).filter((_, itemIndex) => itemIndex !== index);
			return applyDerivedInputRules(nextState);
		});
	}

	function handleAddPolicy(policy = {}) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.protection.policies = [
				...(nextState.protection.policies ?? []),
				{
					id: crypto.randomUUID(),
					coverage: String(policy.coverage ?? '').trim(),
					idealValue: Number(policy.idealValue ?? 0),
					currentValue: Number(policy.currentValue ?? 0),
					coverageYears: Number(policy.coverageYears ?? 0),
					monthlyPremium: Number(policy.monthlyPremium ?? 0),
					company: String(policy.company ?? '').trim(),
					documentId: policy.documentId ?? null,
					documentName: policy.documentName ?? null
				}
			];
			return applyDerivedInputRules(nextState);
		});
	}

	function handleRemovePolicy(index) {
		setInput((currentState) => {
			const nextState = structuredClone(currentState);
			nextState.protection.policies = (nextState.protection.policies ?? []).filter((_, i) => i !== index);
			return applyDerivedInputRules(nextState);
		});
	}

	function handlePolicyFieldChange(index, field, value, type = 'text') {
		setInput((currentState) => applyDerivedInputRules(updateNestedValue(currentState, `protection.policies.${index}.${field}`, value, type)));
	}

	function handlePolicyFileChange(index, file) {
		if (!file) {
			setInput((currentState) => {
				const nextState = structuredClone(currentState);
				const policy = nextState.protection.policies[index];

				if (!policy) {
					return applyDerivedInputRules(nextState);
				}

				delete policy.contentBase64;
				policy.documentName = null;
				policy.documentId = null;
				return applyDerivedInputRules(nextState);
			});
			return;
		}

		const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

		if (!isPdf) {
			setError('Anexe apenas arquivos PDF nas coberturas da blindagem patrimonial.');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const base64 = e.target.result;
			setInput((currentState) => {
				const nextState = structuredClone(currentState);
				const policy = nextState.protection.policies[index];

				if (!policy) {
					return applyDerivedInputRules(nextState);
				}

				policy.contentBase64 = base64;
				policy.documentName = file.name;
				policy.documentId = null;
				return applyDerivedInputRules(nextState);
			});
		};
		reader.readAsDataURL(file);
	}

	function applyValidationErrors(nextFieldErrors) {
		setFieldErrors(nextFieldErrors);

		const firstInvalidPath = Object.keys(nextFieldErrors)[0];

		if (!firstInvalidPath) {
			return;
		}

		const nextTab = fieldTabMap[firstInvalidPath] ?? 'visao360';

		if (activeTab !== nextTab) {
			setActiveTab(nextTab);
		}

		scrollToField(firstInvalidPath);
	}

	function handleCloseClient() {
		setActivePlanId('');
		setInput(createEmptyPlannerInput());
		setReport(null);
		setFieldErrors({});
		navigate('/dashboard');
	}

	async function handleAnalyze() {
		setAnalyzing(true);
		setError('');

		try {
			const data = await analyzePlan(input);
			setReport(data.report);
			setInput(applyDerivedInputRules(hydratePlannerInput(data.input)));
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setAnalyzing(false);
		}
	}

	async function handleSave() {
		const nextFieldErrors = validatePlannerInput(input);

		if (Object.keys(nextFieldErrors).length > 0) {
			applyValidationErrors(nextFieldErrors);
			setError('Corrija os campos destacados antes de guardar o cliente.');
			return;
		}

		setSaving(true);
		setError('');
		setFieldErrors({});

		try {
			const inputToSave = structuredClone(input);
			const pendingUploads = [];

			if (inputToSave.protection?.policies) {
				inputToSave.protection.policies.forEach((policy, index) => {
					if (policy.contentBase64) {
						pendingUploads.push({ index, name: policy.documentName, base64: policy.contentBase64 });
					}
					delete policy.contentBase64;
				});
			}

			const isEditingExistingPlan = Boolean(activePlanId);
			let data = activePlanId ? await updatePlan(activePlanId, inputToSave) : await savePlan(inputToSave);
			const currentPlanId = data.planId;

			if (pendingUploads.length > 0) {
				let uploadedAny = false;
				for (const upload of pendingUploads) {
					try {
						const docInfo = await uploadPlanDocument(currentPlanId, {
							file_name: upload.name,
							content_type: 'application/pdf',
							content_base64: upload.base64
						});
						inputToSave.protection.policies[upload.index].documentId = docInfo.id || docInfo.data?.id;
						uploadedAny = true;
					} catch (err) {
						console.error("Falha ao fazer upload da apolice", err);
					}
				}

				if (uploadedAny) {
					data = await updatePlan(currentPlanId, inputToSave);
				}
			}

			setActivePlanId(currentPlanId);
			setInput(applyDerivedInputRules(hydratePlannerInput(data.input)));
			setReport(data.report);
			setFieldErrors({});

			if (isEditingExistingPlan) {
				navigate(`/dashboard?planId=${currentPlanId}`, { replace: true });
				return;
			}

			if (!planId || planId !== currentPlanId) {
				setSearchParams({ planId: currentPlanId });
			}
		} catch (requestError) {
			const nextFieldErrorsFromRequest = mapRequestErrorToFieldErrors(requestError.message);

			if (Object.keys(nextFieldErrorsFromRequest).length > 0) {
				applyValidationErrors(nextFieldErrorsFromRequest);
			}

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
			setInput(applyDerivedInputRules(hydratePlannerInput(data.input)));
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
			return (
				<Vision360Form
					input={input}
					overview={overview}
					onFieldChange={handleFieldChange}
					onClientAgeChange={handleClientAgeChange}
					onFamilyMemberAgeChange={handleFamilyMemberAgeChange}
					onAddFamilyMember={handleAddFamilyMember}
					onRemoveFamilyMember={handleRemoveFamilyMember}
					onAddAsset={handleAddAsset}
					onRemoveAsset={handleRemoveAsset}
					onAddLiability={handleAddLiability}
					onRemoveLiability={handleRemoveLiability}
					onAddSuccessionCommonAsset={handleAddSuccessionCommonAsset}
					onRemoveSuccessionCommonAsset={handleRemoveSuccessionCommonAsset}
					onAddPolicy={handleAddPolicy}
					onRemovePolicy={handleRemovePolicy}
					onPolicyFieldChange={handlePolicyFieldChange}
					onPolicyFileChange={handlePolicyFileChange}
					fieldErrors={fieldErrors}
				/>
			);
		}

		if (activeTab === 'resultados') {
			return <ResultsShowcase input={input} results={results} onFieldChange={handleFieldChange} readOnly={false} />;
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
		<div className="flex flex-col gap-6 w-full min-w-0">
			<div className="flex flex-col xl:grid gap-6 xl:grid-cols-[1.2fr_0.8fr] w-full min-w-0">
				<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
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

				<div className="min-w-0 shrink-0 grid gap-3 rounded-[28px] border border-slate/10 bg-[#173d5d] p-5 text-white">
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
							<>
								<button
									type="button"
									onClick={handleUpdateLastContact}
									disabled={saving || analyzing || loading}
									className="rounded-full border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Atualizar ultimo contato
								</button>
								<button
									type="button"
									onClick={handleCloseClient}
									disabled={saving || analyzing || loading}
									className="rounded-full border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60"
								>
									Fechar cliente
								</button>
							</>
						) : null}
					</div>
					{error ? <p className="text-sm text-[#ffd5c6]">{error}</p> : null}
				</div>
			</div>

			{loading ? (
				<SectionCard title="A carregar cliente">
					<p className="text-sm text-slate/65">A carregar dados do cliente selecionado...</p>
				</SectionCard>
			) : (
				<div className="min-w-0 w-full">
					{renderActiveTab()}
				</div>
			)}
		</div>
	);
}
