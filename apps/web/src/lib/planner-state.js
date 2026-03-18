import { cloneDefaultPlannerInput } from '@yield-360/shared';

export function hydratePlannerInput(payload = {}) {
  const defaults = cloneDefaultPlannerInput();

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
        ...(payload.vision360?.assets ?? {})
      },
      liabilities: {
        ...defaults.vision360.liabilities,
        ...(payload.vision360?.liabilities ?? {})
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

  cursor[segments.at(-1)] = type === 'number' ? (rawValue === '' ? 0 : Number(rawValue)) : rawValue;
  return nextState;
}