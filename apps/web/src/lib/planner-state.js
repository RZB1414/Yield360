import { cloneDefaultPlannerInput } from '@yield-360/shared';
import { parseLocalizedNumber } from './formatters.js';

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizePatrimonialDescription(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const legacyProtectionPolicies = [
  {
    coverage: 'Cobertura para invalidez total',
    flagField: 'totalDisability',
    currentValueField: 'totalDisabilityCoverage'
  },
  {
    coverage: 'Cobertura para doencas graves',
    flagField: 'criticalIllness',
    currentValueField: 'criticalIllnessCoverage'
  },
  {
    coverage: 'Cirurgias',
    flagField: 'surgeries',
    currentValueField: 'surgeriesCoverage'
  },
  {
    coverage: 'Diaria por internacao',
    flagField: 'hospitalDaily',
    currentValueField: 'hospitalDailyCoverage'
  },
  {
    coverage: 'DIT (Diaria por incapacidade temporaria)',
    flagField: 'temporaryDisability',
    currentValueField: 'temporaryDisabilityCoverage'
  },
  {
    coverage: 'Cobertura adicional (Educacao)',
    flagField: 'dependentEducationInterest',
    idealValueField: 'dependentEducationIdealCoverage',
    coverageYearsField: 'dependentEducationYears',
    monthlyPremiumField: 'dependentEducationMonthlyAid'
  }
];

function isProtectionPolicyFilled(policy) {
  return Boolean(
    String(policy?.coverage ?? '').trim() ||
      toNumber(policy?.idealValue) > 0 ||
      toNumber(policy?.currentValue) > 0 ||
      toNumber(policy?.coverageYears) > 0 ||
      toNumber(policy?.monthlyPremium) > 0 ||
      String(policy?.documentId ?? '').trim() ||
      String(policy?.documentName ?? '').trim()
  );
}

function buildLegacyProtectionPolicies(protection = {}) {
  return legacyProtectionPolicies
    .map((definition, index) => {
      const currentValue = toNumber(protection?.[definition.currentValueField] ?? 0);
      const idealValue = toNumber(protection?.[definition.idealValueField] ?? 0);
      const coverageYears = toNumber(protection?.[definition.coverageYearsField] ?? 0);
      const monthlyPremium = toNumber(protection?.[definition.monthlyPremiumField] ?? 0);
      const enabled = Boolean(protection?.[definition.flagField]);

      if (!enabled && currentValue === 0 && idealValue === 0 && coverageYears === 0 && monthlyPremium === 0) {
        return null;
      }

      return {
        id: `legacy-protection-${index + 1}`,
        coverage: definition.coverage,
        idealValue,
        currentValue,
        coverageYears,
        monthlyPremium,
        company: '',
        documentId: null,
        documentName: null
      };
    })
    .filter(Boolean);
}

function normalizeProtectionPolicies(protection = {}) {
  const policies = Array.isArray(protection?.policies) && protection.policies.length > 0
    ? protection.policies
    : buildLegacyProtectionPolicies(protection);

  return policies
    .map((policy, index) => ({
      ...policy,
      id: String(policy?.id ?? `protection-policy-${index + 1}`),
      coverage: String(policy?.coverage ?? policy?.name ?? '').trim(),
      idealValue: Math.max(0, toNumber(policy?.idealValue ?? 0)),
      currentValue: Math.max(0, toNumber(policy?.currentValue ?? policy?.value ?? 0)),
      coverageYears: Math.max(0, toNumber(policy?.coverageYears ?? policy?.years ?? 0)),
      monthlyPremium: Math.max(0, toNumber(policy?.monthlyPremium ?? 0)),
      company: String(policy?.company ?? '').trim(),
      documentId: policy?.documentId ? String(policy.documentId) : null,
      documentName: policy?.documentName ? String(policy.documentName).trim() : null,
      contentBase64: policy?.contentBase64 ?? undefined
    }))
    .filter(isProtectionPolicyFilled);
}

function resolvePatrimonialGroup(description, fallbackGroup) {
  const normalizedDescription = normalizePatrimonialDescription(description);

  if (
    normalizedDescription === 'ativos financeiros' ||
    normalizedDescription === 'ativos imobilizados' ||
    normalizedDescription === 'consorcios'
  ) {
    return 'asset';
  }

  if (normalizedDescription === 'emprestimos') {
    return 'liability';
  }

  return fallbackGroup;
}

function normalizePatrimonialItems(assets = [], liabilities = []) {
  const normalizedAssets = [];
  const normalizedLiabilities = [];

  [
    ...(Array.isArray(assets) ? assets.map((item) => ({ item, fallbackGroup: 'asset' })) : []),
    ...(Array.isArray(liabilities) ? liabilities.map((item) => ({ item, fallbackGroup: 'liability' })) : [])
  ].forEach(({ item, fallbackGroup }) => {
    const normalizedItem = {
      description: String(item?.description ?? '').trim(),
      value: Math.max(0, toNumber(item?.value)),
      comment: String(item?.comment ?? '').trim()
    };

    if (!normalizedItem.description && normalizedItem.value === 0 && !normalizedItem.comment) {
      return;
    }

    if (resolvePatrimonialGroup(normalizedItem.description, fallbackGroup) === 'asset') {
      normalizedAssets.push(normalizedItem);
      return;
    }

    normalizedLiabilities.push(normalizedItem);
  });

  return {
    assets: normalizedAssets,
    liabilities: normalizedLiabilities
  };
}

function normalizeSuccessionCommonAssetsItems(items = [], fallbackTotal = 0) {
  const sourceItems = Array.isArray(items) && items.length > 0
    ? items
    : toNumber(fallbackTotal) > 0
      ? [{ name: 'Bem comum do casal', value: fallbackTotal, notes: '' }]
      : [];

  return sourceItems
    .map((item, index) => ({
      id: String(item?.id ?? `succession-common-asset-${index + 1}`),
      name: String(item?.name ?? item?.label ?? '').trim(),
      value: Math.max(0, toNumber(item?.value)),
      notes: String(item?.notes ?? item?.comment ?? '').trim()
    }))
    .filter((item) => item.name || item.value > 0 || item.notes);
}

function sumSuccessionCommonAssetsItems(items = []) {
  return items.reduce((total, item) => total + toNumber(item?.value), 0);
}

export function hydratePlannerInput(payload = {}) {
  const defaults = cloneDefaultPlannerInput();
  const normalizedPatrimonialItems = normalizePatrimonialItems(
    payload.vision360?.assets?.items,
    payload.vision360?.liabilities?.items
  );
  const normalizedSuccessionCommonAssetsItems = normalizeSuccessionCommonAssetsItems(
    payload.succession?.commonAssetsItems,
    payload.succession?.commonAssets
  );

  return {
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
      ...(payload.family ?? {}),
      members: Array.isArray(payload.family?.members)
        ? payload.family.members.map((member, index) => ({
            ...(defaults.family.members[index] ?? defaults.family.members[0]),
            ...(member ?? {})
          }))
        : defaults.family.members
    },
    vision360: {
      ...defaults.vision360,
      ...(payload.vision360 ?? {}),
      assets: {
        ...defaults.vision360.assets,
        ...(payload.vision360?.assets ?? {}),
        items: normalizedPatrimonialItems.assets
      },
      liabilities: {
        ...defaults.vision360.liabilities,
        ...(payload.vision360?.liabilities ?? {}),
        items: normalizedPatrimonialItems.liabilities
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
      ...(payload.protection ?? {}),
      policies: normalizeProtectionPolicies(payload.protection ?? {})
    },
    succession: {
      ...defaults.succession,
      ...(payload.succession ?? {}),
      commonAssetsItems: normalizedSuccessionCommonAssetsItems,
      commonAssets: sumSuccessionCommonAssetsItems(normalizedSuccessionCommonAssetsItems)
    },
    control: {
      ...defaults.control,
      ...(payload.control ?? {}),
      monthlyContributions: Array.isArray(payload.control?.monthlyContributions)
        ? payload.control.monthlyContributions.map((item, index) => ({
            ...(defaults.control.monthlyContributions[index] ?? defaults.control.monthlyContributions[0]),
            ...(item ?? {})
          }))
        : defaults.control.monthlyContributions,
      protectionNeeds: {
        ...defaults.control.protectionNeeds,
        ...(payload.control?.protectionNeeds ?? {})
      },
      protectionCoverage: {
        ...defaults.control.protectionCoverage,
        ...(payload.control?.protectionCoverage ?? {})
      }
    }
  };
}

export function createEmptyPlannerInput() {
  return hydratePlannerInput();
}

export function updateNestedValue(currentState, path, rawValue, type = 'text') {
  const segments = path.split('.');
  const nextState = structuredClone(currentState);
  let cursor = nextState;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const nextSegment = segments[index + 1];

    if (cursor[segments[index]] == null) {
      cursor[segments[index]] = /^\d+$/.test(nextSegment) ? [] : {};
    }

    cursor = cursor[segments[index]];
  }

  cursor[segments.at(-1)] = type === 'number' ? (rawValue === '' ? 0 : Number(parseLocalizedNumber(rawValue))) : rawValue;
  return nextState;
}