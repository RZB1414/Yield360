function getDatabaseBinding(database) {
  if (!database?.prepare) {
    throw new Error('D1 binding is not configured.');
  }

  return database;
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function resolveGlobalSavingsGoal(input = {}) {
  const savingsGoals = input.planning?.savingsGoals;

  if (Array.isArray(savingsGoals)) {
    return savingsGoals.reduce((total, item) => total + Math.max(0, toNumber(item?.amount)), 0);
  }

  return Math.max(0, toNumber(input.planning?.globalSavingsGoal));
}

function resolveGlobalSavingsContributed(input = {}) {
  const monthlyContributions = input.control?.monthlyContributions;

  if (!Array.isArray(monthlyContributions)) {
    return Math.max(0, toNumber(input.control?.totalContributed));
  }

  return monthlyContributions.reduce((monthlyTotal, month) => {
    if (Array.isArray(month?.entries) && month.entries.length > 0) {
      return monthlyTotal + month.entries.reduce((entryTotal, entry) => entryTotal + Math.max(0, toNumber(entry?.amount)), 0);
    }

    return monthlyTotal + Math.max(0, toNumber(month?.amount));
  }, 0);
}

function toStoredProfile(row) {
  if (!row) {
    return null;
  }

  const input = parseJson(row.profile_json, {});
  const report = parseJson(row.dashboard_snapshot_json, null);

  return {
    id: row.id,
    clientName: row.full_name ?? input.client?.name ?? '',
    investorProfile: row.email ?? input.client?.investorProfile ?? '',
    lastContactAt: input.metadata?.lastContactAt ?? null,
    input,
    report,
    createdAt: row.created_at ?? input.createdAt ?? null,
    updatedAt: row.updated_at ?? input.updatedAt ?? null
  };
}

function toProfileListItem(row) {
  const input = parseJson(row.profile_json, {});
  const report = parseJson(row.dashboard_snapshot_json, null);

  if (!report?.modules || !input?.client?.name) {
    return null;
  }

  const globalSavingsGoal = resolveGlobalSavingsGoal(input);
  const globalSavingsContributed = resolveGlobalSavingsContributed(input);
  const globalSavingsProgress = globalSavingsGoal > 0
    ? Math.min((globalSavingsContributed / globalSavingsGoal) * 100, 100)
    : 0;

  return {
    id: row.id,
    clientName: row.full_name ?? input.client?.name ?? '',
    investorProfile: row.email ?? input.client?.investorProfile ?? '',
    lastContactAt: input.metadata?.lastContactAt ?? null,
    createdAt: row.created_at ?? input.createdAt ?? null,
    updatedAt: row.updated_at ?? input.updatedAt ?? null,
    currentNetWorth: Number(report.modules?.overview?.netWorth ?? 0),
    futureRealValue: Number(report.modules?.results?.futureRealValue ?? report.modules?.future?.futureRealValue ?? 0),
    retirementAge: Number(report.summary?.retirementAge ?? report.modules?.results?.targetAge ?? 0),
    globalSavingsGoal,
    globalSavingsContributed,
    globalSavingsProgress
  };
}

export async function getDatabaseHealth(database) {
  const binding = getDatabaseBinding(database);
  const result = await binding.prepare('SELECT 1 AS ok').first();

  return {
    connected: true,
    engine: 'cloudflare-d1',
    pingOk: result?.ok === 1
  };
}

export async function createPlan(database, planRecord) {
  const binding = getDatabaseBinding(database);

  await binding
    .prepare(
      `INSERT INTO profiles (
        id,
        full_name,
        email,
        profile_json,
        dashboard_snapshot_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      planRecord.id,
      planRecord.clientName,
      planRecord.investorProfile,
      JSON.stringify(planRecord.input),
      JSON.stringify(planRecord.report),
      planRecord.createdAt,
      planRecord.updatedAt
    )
    .run();

  return planRecord.id;
}

export async function updatePlan(database, planRecord) {
  const binding = getDatabaseBinding(database);

  await binding
    .prepare(
      `UPDATE profiles
      SET
        full_name = ?,
        email = ?,
        profile_json = ?,
        dashboard_snapshot_json = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .bind(
      planRecord.clientName,
      planRecord.investorProfile,
      JSON.stringify(planRecord.input),
      JSON.stringify(planRecord.report),
      planRecord.updatedAt,
      planRecord.id
    )
    .run();

  return planRecord.id;
}

export async function deletePlan(database, planId) {
  const binding = getDatabaseBinding(database);

  await binding
    .prepare('DELETE FROM profiles WHERE id = ?')
    .bind(planId)
    .run();

  return planId;
}

export async function getPlanById(database, planId) {
  const binding = getDatabaseBinding(database);
  const row = await binding
    .prepare(
      `SELECT
        id,
        full_name,
        email,
        profile_json,
        dashboard_snapshot_json,
        created_at,
        updated_at
      FROM profiles
      WHERE id = ?`
    )
    .bind(planId)
    .first();

  return toStoredProfile(row);
}

export async function listPlans(database) {
  const binding = getDatabaseBinding(database);
  const result = await binding
    .prepare(
      `SELECT
        id,
        full_name,
        email,
        profile_json,
        dashboard_snapshot_json,
        created_at,
        updated_at
      FROM profiles
      ORDER BY updated_at DESC, created_at DESC`
    )
    .all();

  return (result.results ?? []).map(toProfileListItem).filter(Boolean);
}

export async function uploadDocument(database, doc) {
  const binding = getDatabaseBinding(database);

  await binding
    .prepare(
      `INSERT INTO documents (
        id,
        plan_id,
        file_name,
        content_type,
        object_key,
        object_size,
        content_base64,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      doc.id,
      doc.planId,
      doc.fileName,
      doc.contentType,
      doc.objectKey ?? null,
      doc.objectSize ?? null,
      doc.contentBase64 ?? '',
      doc.createdAt
    )
    .run();

  return doc.id;
}

export async function getDocumentById(database, documentId) {
  const binding = getDatabaseBinding(database);
  const row = await binding
    .prepare(
      `SELECT
        id,
        plan_id as planId,
        file_name as fileName,
        content_type as contentType,
        object_key as objectKey,
        object_size as objectSize,
        content_base64 as contentBase64,
        created_at as createdAt
      FROM documents
      WHERE id = ?`
    )
    .bind(documentId)
    .first();

  return row;
}

export async function deleteDocument(database, documentId) {
  const binding = getDatabaseBinding(database);

  await binding
    .prepare('DELETE FROM documents WHERE id = ?')
    .bind(documentId)
    .run();

  return documentId;
}

export async function listDocumentsByPlanId(database, planId) {
  const binding = getDatabaseBinding(database);
  const result = await binding
    .prepare(
      `SELECT
        id,
        plan_id as planId,
        file_name as fileName,
        content_type as contentType,
        object_key as objectKey,
        object_size as objectSize,
        created_at as createdAt
      FROM documents
      WHERE plan_id = ?
      ORDER BY created_at DESC`
    )
    .bind(planId)
    .all();

  return result.results ?? [];
}
