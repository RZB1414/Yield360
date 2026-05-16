import { cloneDefaultPlannerInput, normalizePlannerInput } from '@yield-360/shared';
import { parseLocalizedNumber } from './formatters.js';

export function hydratePlannerInput(payload = {}) {
  return normalizePlannerInput(payload);
}

export function createEmptyPlannerInput() {
  return hydratePlannerInput(cloneDefaultPlannerInput());
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
