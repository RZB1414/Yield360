import { createPlan, getPlanById, listPlans, updatePlan } from '../lib/db.js';
import { jsonResponse } from '../lib/http.js';
import { buildPlannerReport, normalizePlannerInput } from '../services/planner.service.js';

async function parseRequestInput(request) {
  const payload = await request.json();
  const input = normalizePlannerInput(payload);

  if (!input.client.name.trim()) {
    throw new Error('client name is required');
  }

  return input;
}

export async function handleAnalyzePlanRequest(request) {
  const input = await parseRequestInput(request);
  const report = buildPlannerReport(input);

  return jsonResponse({
    data: {
      input,
      report
    }
  });
}

export async function handleCreatePlanRequest(request, env) {
  const input = await parseRequestInput(request);
  const report = buildPlannerReport(input);
  const timestamp = new Date().toISOString();
  const planId = crypto.randomUUID();

  await createPlan(env.DB, {
    id: planId,
    clientName: input.client.name,
    investorProfile: input.client.investorProfile,
    input,
    report,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return jsonResponse(
    {
      message: 'Cenario guardado com sucesso.',
      data: {
        planId,
        input,
        report,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    },
    201
  );
}

export async function handleListPlansRequest(env) {
  const plans = await listPlans(env.DB);
  return jsonResponse({ data: plans });
}

export async function handleGetPlanRequest(env, planId) {
  const plan = await getPlanById(env.DB, planId);

  if (!plan?.report?.modules) {
    return jsonResponse({ message: 'Cenario nao encontrado.' }, 404);
  }

  return jsonResponse({
    data: {
      planId: plan.id,
      input: plan.input,
      report: plan.report,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    }
  });
}

export async function handleUpdatePlanRequest(request, env, planId) {
  const existingPlan = await getPlanById(env.DB, planId);

  if (!existingPlan?.id) {
    return jsonResponse({ message: 'Cenario nao encontrado.' }, 404);
  }

  const input = await parseRequestInput(request);
  const report = buildPlannerReport(input);
  const timestamp = new Date().toISOString();

  await updatePlan(env.DB, {
    id: planId,
    clientName: input.client.name,
    investorProfile: input.client.investorProfile,
    input,
    report,
    updatedAt: timestamp
  });

  return jsonResponse({
    message: 'Cliente atualizado com sucesso.',
    data: {
      planId,
      input,
      report,
      createdAt: existingPlan.createdAt,
      updatedAt: timestamp
    }
  });
}