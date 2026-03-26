import {
  cloneDefaultPlannerInput,
  investorProfiles,
  maritalRegimes,
  protectionLayerFields
} from '@yield-360/shared';

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toBoolean(value) {
  return Boolean(value);
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
}

function calculateAgeFromBirthDate(birthDateValue) {
  const birthDate = new Date(`${birthDateValue}T00:00:00Z`);

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error('invalid birth date');
  }

  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
}

function annualToMonthlyRate(annualRate) {
  if (annualRate <= -1) {
    return -1;
  }

  return (1 + annualRate) ** (1 / 12) - 1;
}

function calculateFutureValue({ presentValue, monthlyContribution, monthlyRate, totalMonths }) {
  if (totalMonths <= 0) {
    return presentValue;
  }

  if (monthlyRate === 0) {
    return presentValue + monthlyContribution * totalMonths;
  }

  const factor = (1 + monthlyRate) ** totalMonths;
  return presentValue * factor + monthlyContribution * (((factor - 1) / monthlyRate) || 0);
}

function buildAccumulationProjection({ currentAge, targetAge, openingBalance, monthlyContribution, annualRate }) {
  const projection = [];
  const monthlyRate = annualToMonthlyRate(annualRate);
  let portfolioValue = openingBalance;
  let investedTotal = openingBalance;

  projection.push({
    age: currentAge,
    investedTotal: roundCurrency(investedTotal),
    interestValue: 0,
    portfolioValue: roundCurrency(portfolioValue)
  });

  for (let age = currentAge + 1; age <= targetAge; age += 1) {
    portfolioValue = calculateFutureValue({
      presentValue: portfolioValue,
      monthlyContribution,
      monthlyRate,
      totalMonths: 12
    });
    investedTotal += monthlyContribution * 12;

    projection.push({
      age,
      investedTotal: roundCurrency(investedTotal),
      interestValue: roundCurrency(portfolioValue - investedTotal),
      portfolioValue: roundCurrency(portfolioValue)
    });
  }

  return projection;
}

function buildPerpetuityProjection({
  targetAge,
  endingAge,
  openingBalance,
  annualYieldRate,
  desiredMonthlySpend,
  externalMonthlyIncome
}) {
  const projection = [];
  let previousBalance = openingBalance;
  const annualSpend = desiredMonthlySpend * 12;
  const annualExternalIncome = externalMonthlyIncome * 12;

  for (let age = targetAge; age <= endingAge; age += 1) {
    const income = previousBalance * annualYieldRate;
    const currentBalance = previousBalance + income + annualExternalIncome - annualSpend;

    projection.push({
      age,
      openingBalance: roundCurrency(previousBalance),
      yearlyIncome: roundCurrency(income),
      externalIncome: roundCurrency(annualExternalIncome),
      yearlySpend: roundCurrency(annualSpend),
      endingBalance: roundCurrency(currentBalance)
    });

    previousBalance = currentBalance;
  }

  return projection;
}

function normalizeProtectionMatrix(payload = {}, defaults = {}) {
  const normalized = {};

  protectionLayerFields.forEach(({ key }) => {
    normalized[key] = toBoolean(payload[key] ?? defaults[key]);
  });

  return normalized;
}

function normalizeFamilyMembers(payload = [], defaults = []) {
  const desiredLength = Math.max(defaults.length, Array.isArray(payload) ? payload.length : 0);

  return Array.from({ length: desiredLength }, (_, index) => {
    const defaultMember = defaults[index] ?? { name: '', relationship: '', birthDate: '', profession: '' };
    const payloadMember = Array.isArray(payload) ? payload[index] ?? {} : {};

    return {
      name: String(payloadMember.name ?? defaultMember.name ?? '').trim(),
      relationship: String(payloadMember.relationship ?? defaultMember.relationship ?? '').trim(),
      birthDate: String(payloadMember.birthDate ?? defaultMember.birthDate ?? '').trim(),
      profession: String(payloadMember.profession ?? defaultMember.profession ?? '').trim()
    };
  });
}

export function normalizePlannerInput(payload = {}) {
  const defaults = cloneDefaultPlannerInput();
  const input = {
    ...defaults,
    ...payload,
    metadata: {
      ...defaults.metadata,
      ...(payload.metadata ?? {})
    },
    client: {
      ...defaults.client,
      ...(payload.client ?? {})
    },
    family: {
      ...defaults.family,
      ...(payload.family ?? {})
    },
    vision360: {
      ...defaults.vision360,
      ...(payload.vision360 ?? {}),
      assets: {
        items: Array.isArray(payload.vision360?.assets?.items)
          ? payload.vision360.assets.items.map((item) => ({
              description: String(item?.description ?? '').trim(),
              value: Math.max(0, toNumber(item?.value))
            }))
          : defaults.vision360.assets.items
      },
      liabilities: {
        items: Array.isArray(payload.vision360?.liabilities?.items)
          ? payload.vision360.liabilities.items.map((item) => ({
              description: String(item?.description ?? '').trim(),
              value: Math.max(0, toNumber(item?.value))
            }))
          : defaults.vision360.liabilities.items
      },
      budget: {
        ...defaults.vision360.budget,
        ...(payload.vision360?.budget ?? {})
      }
    },
    planning: {
      ...defaults.planning,
      ...(payload.planning ?? {})
    },
    future: {
      ...defaults.future,
      ...(payload.future ?? {})
    },
    profileValidation: {
      ...defaults.profileValidation,
      ...(payload.profileValidation ?? {})
    },
    protection: {
      ...defaults.protection,
      ...(payload.protection ?? {})
    },
    succession: {
      ...defaults.succession,
      ...(payload.succession ?? {})
    },
    control: {
      ...defaults.control,
      ...(payload.control ?? {}),
      monthlyContributions: Array.isArray(payload.control?.monthlyContributions)
        ? payload.control.monthlyContributions
        : defaults.control.monthlyContributions,
      protectionNeeds: normalizeProtectionMatrix(payload.control?.protectionNeeds, defaults.control.protectionNeeds),
      protectionCoverage: normalizeProtectionMatrix(
        payload.control?.protectionCoverage,
        defaults.control.protectionCoverage
      )
    }
  };

  input.client.name = String(input.client.name ?? '').trim();
  input.metadata.lastContactAt = String(input.metadata.lastContactAt ?? '').trim();
  input.client.birthDate = String(input.client.birthDate ?? '').trim();
  input.client.profession = String(input.client.profession ?? '').trim();
  input.client.investorProfile = investorProfiles.includes(input.client.investorProfile)
    ? input.client.investorProfile
    : defaults.client.investorProfile;

  input.family.members = normalizeFamilyMembers(payload.family?.members, defaults.family.members);

  [

    ['vision360', 'budget', 'monthlyIncome'],
    ['vision360', 'budget', 'monthlyExpenses'],
    ['vision360', 'budget', 'emergencyReserveNeed'],
    ['vision360', 'budget', 'shortTermReserveTarget'],
    ['vision360', 'budget', 'emergencyReserveCurrent'],
    ['planning', null, 'consultantStartAge'],
    ['planning', null, 'initialConsultingValue'],
    ['planning', null, 'phaseDurationYears'],
    ['planning', null, 'contributionDay'],
    ['planning', null, 'extraContributions'],
    ['planning', null, 'annualContributionGoal'],
    ['planning', null, 'extraMonthlyIncome'],
    ['future', null, 'targetAge'],
    ['future', null, 'agreedMonthlyContribution'],
    ['future', null, 'nominalAnnualRate'],
    ['future', null, 'inflationRate'],
    ['future', null, 'desiredMonthlyRetirementSpend'],
    ['profileValidation', null, 'benchmarkRate'],
    ['protection', null, 'totalDisabilityCoverage'],
    ['protection', null, 'criticalIllnessCoverage'],
    ['protection', null, 'surgeriesCoverage'],
    ['protection', null, 'hospitalDailyCoverage'],
    ['protection', null, 'temporaryDisabilityCoverage'],
    ['protection', null, 'dependentEducationYears'],
    ['protection', null, 'dependentEducationMonthlyAid'],
    ['protection', null, 'dependentEducationIdealCoverage'],
    ['succession', null, 'commonAssets'],
    ['succession', null, 'debts'],
    ['succession', null, 'vgbl'],
    ['succession', null, 'lifeInsurance'],
    ['succession', null, 'childCount'],
    ['control', null, 'totalContributed'],
    ['control', null, 'agreedContributionTarget'],
    ['control', null, 'desiredMonthlyIncome']
  ].forEach(([group, nestedGroup, field]) => {
    if (nestedGroup) {
      input[group][nestedGroup][field] = Math.max(0, toNumber(input[group][nestedGroup][field]));
      return;
    }

    input[group][field] = Math.max(0, toNumber(input[group][field]));
  });

  input.succession.privateAssets = toNumber(input.succession.privateAssets);
  input.succession.hasChildren = toBoolean(input.succession.hasChildren);
  input.succession.parentsAlive = toBoolean(input.succession.parentsAlive);
  input.succession.hasWill = toBoolean(input.succession.hasWill);
  input.succession.hasLifetimeDonations = toBoolean(input.succession.hasLifetimeDonations);
  input.succession.hasHolding = toBoolean(input.succession.hasHolding);
  input.succession.hasOffshore = toBoolean(input.succession.hasOffshore);
  input.succession.maritalStatus = String(input.succession.maritalStatus ?? '').trim();
  input.succession.maritalRegime = maritalRegimes.includes(input.succession.maritalRegime)
    ? input.succession.maritalRegime
    : defaults.succession.maritalRegime;
  input.succession.conflictsComment = String(input.succession.conflictsComment ?? '').trim();
  input.succession.observations = String(input.succession.observations ?? '').trim();

  input.vision360.budget.workRegime = String(input.vision360.budget.workRegime ?? '').trim();
  input.vision360.budget.taxDeclaration = String(input.vision360.budget.taxDeclaration ?? '').trim();
  input.vision360.budget.emergencyReserveHas = toBoolean(input.vision360.budget.emergencyReserveHas);
  input.vision360.budget.emergencyReserveComment = String(input.vision360.budget.emergencyReserveComment ?? '').trim();
  input.vision360.budget.hasPGBL = toBoolean(input.vision360.budget.hasPGBL);
  input.vision360.budget.notes = String(input.vision360.budget.notes ?? '').trim();

  input.planning.lifePhase = String(input.planning.lifePhase ?? '').trim();
  input.planning.wantsRetirementIncome = toBoolean(input.planning.wantsRetirementIncome);
  input.planning.extraIncomeExpected = toBoolean(input.planning.extraIncomeExpected);
  input.planning.otherObjectivesComment = String(input.planning.otherObjectivesComment ?? '').trim();

  input.profileValidation.suggestedProfile = String(input.profileValidation.suggestedProfile ?? '').trim();
  input.profileValidation.financialCapacity = String(input.profileValidation.financialCapacity ?? '').trim();
  input.profileValidation.emotionalCapacity = String(input.profileValidation.emotionalCapacity ?? '').trim();
  input.profileValidation.benchmarkLabel = String(input.profileValidation.benchmarkLabel ?? '').trim();
  input.profileValidation.term = String(input.profileValidation.term ?? '').trim();
  input.profileValidation.validated = toBoolean(input.profileValidation.validated);
  input.profileValidation.notes = String(input.profileValidation.notes ?? '').trim();

  ['totalDisability', 'criticalIllness', 'surgeries', 'hospitalDaily', 'temporaryDisability', 'dependentEducationInterest'].forEach(
    (field) => {
      input.protection[field] = toBoolean(input.protection[field]);
    }
  );

  input.control.monthlyContributions = input.control.monthlyContributions.map((item, index) => ({
    month: String(item?.month ?? defaults.control.monthlyContributions[index]?.month ?? `Mes ${index + 1}`).trim(),
    amount: Math.max(0, toNumber(item?.amount ?? 0))
  }));

  return input;
}

export function buildPlannerReport(rawInput) {
  const input = normalizePlannerInput(rawInput);
  const age = calculateAgeFromBirthDate(input.client.birthDate);
  const familyMembers = input.family.members.map((member) => ({
    ...member,
    age: member.birthDate ? calculateAgeFromBirthDate(member.birthDate) : null
  }));

  const totalAssets = input.vision360.assets.items.reduce((sum, item) => sum + toNumber(item.value), 0);
  const totalLiabilities = input.vision360.liabilities.items.reduce((sum, item) => sum + toNumber(item.value), 0);
  const netWorth = totalAssets - totalLiabilities;
  const annualIncome = input.vision360.budget.monthlyIncome * 12;
  const annualExpenses = input.vision360.budget.monthlyExpenses * 12;
  const monthlyContributionCapacity =
    input.vision360.budget.monthlyIncome - input.vision360.budget.monthlyExpenses;
  const investableAssets = totalAssets;

  if (input.future.targetAge <= age) {
    throw new Error('target age must be greater than current age');
  }

  const contributionYears = input.future.targetAge - age;
  const totalMonths = contributionYears * 12;
  const nominalAnnualRate = input.future.nominalAnnualRate / 100;
  const inflationAnnualRate = input.future.inflationRate / 100;
  const realAnnualRate = (1 + nominalAnnualRate) / (1 + inflationAnnualRate) - 1;
  const monthlyNominalRate = annualToMonthlyRate(nominalAnnualRate);
  const monthlyRealRate = annualToMonthlyRate(realAnnualRate);
  const totalInvested = investableAssets + input.future.agreedMonthlyContribution * 12 * contributionYears;
  const futureNominalValue = calculateFutureValue({
    presentValue: investableAssets,
    monthlyContribution: input.future.agreedMonthlyContribution,
    monthlyRate: monthlyNominalRate,
    totalMonths
  });
  const futureRealValue = calculateFutureValue({
    presentValue: investableAssets,
    monthlyContribution: input.future.agreedMonthlyContribution,
    monthlyRate: monthlyRealRate,
    totalMonths
  });
  const nominalReturn = futureNominalValue - totalInvested;
  const realReturn = futureRealValue - totalInvested;
  const accumulationProjection = buildAccumulationProjection({
    currentAge: age,
    targetAge: input.future.targetAge,
    openingBalance: investableAssets,
    monthlyContribution: input.future.agreedMonthlyContribution,
    annualRate: nominalAnnualRate
  });

  const benchmarkRate = input.profileValidation.benchmarkRate / 100;
  const externalMonthlyIncome = input.planning.extraIncomeExpected ? input.planning.extraMonthlyIncome : 0;
  const passivePortfolioIncome = (futureRealValue * benchmarkRate) / 12;
  const combinedMonthlyIncome = passivePortfolioIncome + externalMonthlyIncome;
  const surplusDeficit = combinedMonthlyIncome - input.future.desiredMonthlyRetirementSpend;
  const perpetuityProjection = buildPerpetuityProjection({
    targetAge: input.future.targetAge,
    endingAge: 95,
    openingBalance: futureRealValue,
    annualYieldRate: benchmarkRate,
    desiredMonthlySpend: input.future.desiredMonthlyRetirementSpend,
    externalMonthlyIncome
  });

  const successionPrivateAssets = input.succession.privateAssets === 0 ? netWorth : input.succession.privateAssets;
  const spouseShare = input.succession.commonAssets / 2;
  const grossEstate = successionPrivateAssets + spouseShare;
  const netEstate = grossEstate - input.succession.debts;
  const inventoryCost = netEstate > 0 ? netEstate * 0.2 : 0;
  const offInventoryResources = input.succession.lifeInsurance + input.succession.vgbl;
  const additionalNeed = Math.max(inventoryCost - offInventoryResources, 0);

  const desiredMonthlyIncome = input.control.desiredMonthlyIncome || input.future.desiredMonthlyRetirementSpend;
  const disabilityProtectionIdeal = desiredMonthlyIncome / 0.005;
  const financialFreedomProgress = futureNominalValue > 0 ? (investableAssets / futureNominalValue) * 100 : 0;
  const agreedContributionTarget = input.control.agreedContributionTarget || input.planning.annualContributionGoal;
  const contributedProgress =
    agreedContributionTarget > 0 ? (input.control.totalContributed / agreedContributionTarget) * 100 : 0;
  const remainingContributionGap = Math.max(agreedContributionTarget - input.control.totalContributed, 0);
  const contributionOverage = Math.max(input.control.totalContributed - agreedContributionTarget, 0);
  const protectionLayers = protectionLayerFields.map(({ key, label }) => ({
    key,
    label,
    needed: Boolean(input.control.protectionNeeds[key]),
    covered: Boolean(input.control.protectionCoverage[key])
  }));
  const needCount = protectionLayers.filter((item) => item.needed).length;
  const coveredCount = protectionLayers.filter((item) => item.covered).length;

  const totalContribution = input.future.agreedMonthlyContribution * 12 * contributionYears;
  const opportunityCost = futureRealValue - investableAssets - totalContribution;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      clientName: input.client.name,
      investorProfile: input.client.investorProfile,
      retirementAge: input.future.targetAge
    },
    modules: {
      overview: {
        age,
        profession: input.client.profession,
        familyMembers,
        totalAssets: roundCurrency(totalAssets),
        totalLiabilities: roundCurrency(totalLiabilities),
        netWorth: roundCurrency(netWorth),
        annualIncome: roundCurrency(annualIncome),
        annualExpenses: roundCurrency(annualExpenses),
        monthlyContributionCapacity: roundCurrency(monthlyContributionCapacity),
        emergencyReserveGap: roundCurrency(
          Math.max(input.vision360.budget.emergencyReserveNeed - input.vision360.budget.emergencyReserveCurrent, 0)
        )
      },
      results: {
        contributionYears,
        totalMonths,
        currentDate: new Date().toISOString(),
        currentAge: age,
        targetAge: input.future.targetAge,
        realAnnualRate: roundCurrency(realAnnualRate * 100),
        nominalAnnualRate: roundCurrency(input.future.nominalAnnualRate),
        inflationAnnualRate: roundCurrency(input.future.inflationRate),
        totalInvested: roundCurrency(totalInvested),
        currentInvestableAssets: roundCurrency(investableAssets),
        futureNominalValue: roundCurrency(futureNominalValue),
        futureRealValue: roundCurrency(futureRealValue),
        nominalReturn: roundCurrency(nominalReturn),
        realReturn: roundCurrency(realReturn),
        accumulationProjection
      },
      future: {
        targetAge: input.future.targetAge,
        perpetuityRate: roundCurrency(input.profileValidation.benchmarkRate),
        desiredMonthlyRetirementSpend: roundCurrency(input.future.desiredMonthlyRetirementSpend),
        passivePortfolioIncome: roundCurrency(passivePortfolioIncome),
        externalMonthlyIncome: roundCurrency(externalMonthlyIncome),
        combinedMonthlyIncome: roundCurrency(combinedMonthlyIncome),
        surplusDeficit: roundCurrency(surplusDeficit),
        futureRealValue: roundCurrency(futureRealValue),
        perpetuityProjection
      },
      succession: {
        maritalStatus: input.succession.maritalStatus,
        maritalRegime: input.succession.maritalRegime,
        hasChildren: input.succession.hasChildren,
        childCount: input.succession.childCount,
        parentsAlive: input.succession.parentsAlive,
        spouseShare: roundCurrency(spouseShare),
        privateAssets: roundCurrency(successionPrivateAssets),
        grossEstate: roundCurrency(grossEstate),
        netEstate: roundCurrency(netEstate),
        inventoryCost: roundCurrency(inventoryCost),
        offInventoryResources: roundCurrency(offInventoryResources),
        additionalNeed: roundCurrency(additionalNeed),
        lifeInsurance: roundCurrency(input.succession.lifeInsurance),
        vgbl: roundCurrency(input.succession.vgbl)
      },
      control: {
        disabilityProtectionIdeal: roundCurrency(disabilityProtectionIdeal),
        disabilityProtectionCurrent: roundCurrency(input.protection.totalDisabilityCoverage),
        disabilityProtectionGap: roundCurrency(
          Math.max(disabilityProtectionIdeal - input.protection.totalDisabilityCoverage, 0)
        ),
        exposedPatrimony: roundCurrency(netEstate),
        legacyCoverageCurrent: roundCurrency(offInventoryResources),
        inventoryAdditionalNeed: roundCurrency(additionalNeed),
        financialFreedomProgress: roundCurrency(financialFreedomProgress),
        financialFreedomProgressCapped: roundCurrency(clampPercent(financialFreedomProgress)),
        contributedProgress: roundCurrency(contributedProgress),
        contributedProgressCapped: roundCurrency(clampPercent(contributedProgress)),
        totalContributed: roundCurrency(input.control.totalContributed),
        agreedContributionTarget: roundCurrency(agreedContributionTarget),
        remainingContributionGap: roundCurrency(remainingContributionGap),
        contributionOverage: roundCurrency(contributionOverage),
        needCount,
        coveredCount,
        monthlyContributions: input.control.monthlyContributions.map((item) => ({
          month: item.month,
          amount: roundCurrency(item.amount)
        })),
        protectionLayers
      },
      insights: {
        retirementAge: input.future.targetAge,
        desiredMonthlyRetirementSpend: roundCurrency(input.future.desiredMonthlyRetirementSpend),
        currentNetWorth: roundCurrency(netWorth),
        totalContribution: roundCurrency(totalContribution),
        opportunityCost: roundCurrency(opportunityCost),
        totalAccumulated: roundCurrency(futureRealValue)
      }
    }
  };
}
