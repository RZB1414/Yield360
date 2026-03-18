export const investorProfiles = ['Conservador', 'Moderado', 'Arrojado'];

export const maritalRegimes = [
  'Nao Aplicavel',
  'Comunhao parcial',
  'Comunhao universal',
  'Separacao total',
  'Participacao final nos aquestos'
];

export const protectionLayerFields = [
  { key: 're100', label: 'RE - 100%' },
  { key: 'assetAllocation', label: 'Asset Allocation' },
  { key: 'lifeInsurance', label: 'Seguro de Vida' },
  { key: 'assetShield', label: 'Blindagem Patrimonial' },
  { key: 'healthPlan', label: 'Plano de saude' },
  { key: 'vgblPrivatePension', label: 'Previdencia VGBL' },
  { key: 'additionalCoverage', label: 'Cobertura Adicional' }
];

export const defaultPlannerInput = {
  metadata: {
    lastContactAt: ''
  },
  client: {
    name: '',
    birthDate: '',
    investorProfile: '',
    profession: ''
  },
  family: {
    members: [
      { name: '', relationship: '', birthDate: '', profession: '' },
      { name: '', relationship: '', birthDate: '', profession: '' },
      { name: '', relationship: '', birthDate: '', profession: '' },
      { name: '', relationship: '', birthDate: '', profession: '' }
    ]
  },
  vision360: {
    assets: {
      financial: 0,
      immobilized: 0,
      other: 0
    },
    liabilities: {
      loans: 0,
      financing: 0,
      consortiums: 0,
      other: 0
    },
    budget: {
      workRegime: '',
      taxDeclaration: '',
      monthlyIncome: 0,
      monthlyExpenses: 0,
      emergencyReserveHas: false,
      emergencyReserveComment: '',
      emergencyReserveNeed: 0,
      shortTermReserveTarget: 0,
      emergencyReserveCurrent: 0,
      hasPGBL: false,
      notes: ''
    }
  },
  planning: {
    consultantStartAge: 0,
    initialConsultingValue: 0,
    lifePhase: '',
    phaseDurationYears: 0,
    contributionDay: 0,
    extraContributions: 0,
    annualContributionGoal: 0,
    wantsRetirementIncome: false,
    extraIncomeExpected: false,
    extraMonthlyIncome: 0,
    otherObjectivesComment: ''
  },
  future: {
    targetAge: 0,
    agreedMonthlyContribution: 0,
    nominalAnnualRate: 0,
    inflationRate: 0,
    desiredMonthlyRetirementSpend: 0
  },
  profileValidation: {
    suggestedProfile: '',
    financialCapacity: '',
    emotionalCapacity: '',
    benchmarkLabel: '',
    benchmarkRate: 0,
    term: '',
    validated: false,
    notes: ''
  },
  protection: {
    totalDisability: false,
    totalDisabilityCoverage: 0,
    criticalIllness: false,
    criticalIllnessCoverage: 0,
    surgeries: false,
    surgeriesCoverage: 0,
    hospitalDaily: false,
    hospitalDailyCoverage: 0,
    temporaryDisability: false,
    temporaryDisabilityCoverage: 0,
    dependentEducationInterest: false,
    dependentEducationYears: 0,
    dependentEducationMonthlyAid: 0,
    dependentEducationIdealCoverage: 0
  },
  succession: {
    maritalStatus: '',
    maritalRegime: '',
    hasChildren: false,
    childCount: 0,
    parentsAlive: false,
    privateAssets: 0,
    commonAssets: 0,
    debts: 0,
    vgbl: 0,
    lifeInsurance: 0,
    conflictsComment: '',
    hasWill: false,
    hasLifetimeDonations: false,
    hasHolding: false,
    hasOffshore: false,
    observations: ''
  },
  control: {
    totalContributed: 0,
    agreedContributionTarget: 0,
    desiredMonthlyIncome: 0,
    monthlyContributions: [
      { month: 'Novembro', amount: 0 },
      { month: 'Dezembro', amount: 0 },
      { month: 'Janeiro', amount: 0 },
      { month: 'Fevereiro', amount: 0 },
      { month: 'Mes 5', amount: 0 },
      { month: 'Mes 6', amount: 0 },
      { month: 'Mes 7', amount: 0 },
      { month: 'Mes 8', amount: 0 },
      { month: 'Mes 9', amount: 0 },
      { month: 'Mes 10', amount: 0 },
      { month: 'Mes 11', amount: 0 },
      { month: 'Mes 12', amount: 0 }
    ],
    protectionNeeds: {
      re100: false,
      assetAllocation: false,
      lifeInsurance: false,
      assetShield: false,
      healthPlan: false,
      vgblPrivatePension: false,
      additionalCoverage: false
    },
    protectionCoverage: {
      re100: false,
      assetAllocation: false,
      lifeInsurance: false,
      assetShield: false,
      healthPlan: false,
      vgblPrivatePension: false,
      additionalCoverage: false
    }
  }
};

export const plannerSections = [
  {
    id: 'visao360',
    title: 'Aba 1 · Visao 360',
    description: 'Diagnostico patrimonial, familiar, orcamentario e de protecao.'
  },
  {
    id: 'resultados',
    title: 'Aba 2 · Resultados',
    description: 'Planejamento inicial, fase de acumulo e projecao de patrimonio.'
  },
  {
    id: 'futuro',
    title: 'Aba 3 · Futuro',
    description: 'Usufruto, renda passiva potencial e perpetuidade patrimonial.'
  },
  {
    id: 'sucessorio',
    title: 'Aba 4 · Sucessorio',
    description: 'Checklist de sucessao, inventario e recursos disponiveis.'
  },
  {
    id: 'controle',
    title: 'Aba 5 · Controle',
    description: 'Painel executivo de protecao, legado e acompanhamento de aportes.'
  }
];

export function cloneDefaultPlannerInput() {
  return JSON.parse(JSON.stringify(defaultPlannerInput));
}