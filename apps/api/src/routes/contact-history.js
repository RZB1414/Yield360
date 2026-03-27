import { getPlanById, updatePlan } from '../lib/db.js';
import { jsonResponse } from '../lib/http.js';

// GET /api/plans/:planId/contact-history
export async function handleListContactHistoryRequest(env, planId) {
  const plan = await getPlanById(env.DB, planId);
  if (!plan) {
    return jsonResponse({ message: 'Plano não encontrado.' }, 404);
  }
  return jsonResponse({ data: plan.input?.metadata?.contactHistory || [] });
}

// POST /api/plans/:planId/contact-history
export async function handleAddContactHistoryRequest(request, env, planId) {
  const plan = await getPlanById(env.DB, planId);
  if (!plan) {
    return jsonResponse({ message: 'Plano não encontrado.' }, 404);
  }
  const payload = await request.json();
  const history = plan.input?.metadata?.contactHistory || [];
  const newItem = { ...payload, id: crypto.randomUUID(), date: payload.date || new Date().toISOString() };
  const nextHistory = [...history, newItem];
  plan.input.metadata = { ...plan.input.metadata, contactHistory: nextHistory };
  await updatePlan(env.DB, {
    id: planId,
    clientName: plan.clientName,
    investorProfile: plan.investorProfile,
    input: plan.input,
    report: plan.report,
    updatedAt: new Date().toISOString()
  });
  return jsonResponse({ data: newItem }, 201);
}

// PATCH /api/plans/:planId/contact-history/:historyId
export async function handleUpdateContactHistoryRequest(request, env, planId, historyId) {
  const plan = await getPlanById(env.DB, planId);
  if (!plan) {
    return jsonResponse({ message: 'Plano não encontrado.' }, 404);
  }
  const payload = await request.json();
  const history = plan.input?.metadata?.contactHistory || [];
  const idx = history.findIndex(item => item.id === historyId);
  if (idx === -1) {
    return jsonResponse({ message: 'Registro não encontrado.' }, 404);
  }
  const updated = { ...history[idx], ...payload };
  const nextHistory = [...history];
  nextHistory[idx] = updated;
  plan.input.metadata = { ...plan.input.metadata, contactHistory: nextHistory };
  await updatePlan(env.DB, {
    id: planId,
    clientName: plan.clientName,
    investorProfile: plan.investorProfile,
    input: plan.input,
    report: plan.report,
    updatedAt: new Date().toISOString()
  });
  return jsonResponse({ data: updated });
}

// DELETE /api/plans/:planId/contact-history/:historyId
export async function handleDeleteContactHistoryRequest(env, planId, historyId) {
  const plan = await getPlanById(env.DB, planId);
  if (!plan) {
    return jsonResponse({ message: 'Plano não encontrado.' }, 404);
  }
  const history = plan.input?.metadata?.contactHistory || [];
  const idx = history.findIndex(item => item.id === historyId);
  if (idx === -1) {
    return jsonResponse({ message: 'Registro não encontrado.' }, 404);
  }
  const nextHistory = history.filter(item => item.id !== historyId);
  plan.input.metadata = { ...plan.input.metadata, contactHistory: nextHistory };
  await updatePlan(env.DB, {
    id: planId,
    clientName: plan.clientName,
    investorProfile: plan.investorProfile,
    input: plan.input,
    report: plan.report,
    updatedAt: new Date().toISOString()
  });
  return jsonResponse({ message: 'Registro removido.' });
}
