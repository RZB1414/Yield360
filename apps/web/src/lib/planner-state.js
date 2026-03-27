import { cloneDefaultPlannerInput } from '@yield-360/shared';
import { parseLocalizedNumber } from './formatters.js';

export function hydratePlannerInput(payload = {}) {
  const defaults = cloneDefaultPlannerInput();

  if (defaults.future) {
    defaults.future.inflationRate = 6;
  }

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
        items: Array.isArray(payload.vision360?.assets?.items)
          ? payload.vision360.assets.items.map((item) => ({
              description: String(item?.description ?? ''),
              value: item?.value ?? 0
            }))
          : defaults.vision360.assets.items
      },
      liabilities: {
        items: Array.isArray(payload.vision360?.liabilities?.items)
          ? payload.vision360.liabilities.items.map((item) => ({
              description: String(item?.description ?? ''),
              value: item?.value ?? 0
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
      ...(payload.protection ?? {}),
      policies: Array.isArray(payload.protection?.policies)
        ? payload.protection.policies.map(policy => ({
            id: String(policy?.id ?? crypto.randomUUID()),
            name: String(policy?.name ?? ''),
            years: Number(policy?.years ?? 0),
            company: String(policy?.company ?? ''),
            value: Number(policy?.value ?? 0),
            documentId: policy?.documentId ? String(policy.documentId) : null,
            documentName: policy?.documentName ? String(policy.documentName) : null
          }))
        : defaults.protection.policies
    },
    succession: {
      ...defaults.succession,
      ...(payload.succession ?? {})
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

  cursor[segments.at(-1)] = type === 'number'
    ? (typeof rawValue === 'number' ? rawValue : (rawValue === '' ? 0 : Number(parseLocalizedNumber(rawValue))))
    : rawValue;
  return nextState;
}