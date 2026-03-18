const productionWorkerUrl = 'https://yield-360-api.yield360app.workers.dev';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || productionWorkerUrl;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  const rawPayload = await response.text();
  let payload = null;

  if (rawPayload) {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      payload = { message: rawPayload };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Falha ao comunicar com a API.');
  }

  return payload?.data;
}

export function analyzePlan(input) {
  return request('/api/plans/analyze', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function savePlan(input) {
  return request('/api/plans', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function updatePlan(planId, input) {
  return request(`/api/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function getPlans() {
  return request('/api/plans');
}

export function getPlan(planId) {
  return request(`/api/plans/${planId}`);
}

export function getHealth() {
  return request('/api/health');
}