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

  return {
    id: row.id,
    clientName: row.full_name ?? input.client?.name ?? '',
    investorProfile: row.email ?? input.client?.investorProfile ?? '',
    lastContactAt: input.metadata?.lastContactAt ?? null,
    createdAt: row.created_at ?? input.createdAt ?? null,
    updatedAt: row.updated_at ?? input.updatedAt ?? null,
    currentNetWorth: Number(report.modules?.overview?.netWorth ?? 0),
    futureRealValue: Number(report.modules?.results?.futureRealValue ?? report.modules?.future?.futureRealValue ?? 0),
    retirementAge: Number(report.summary?.retirementAge ?? report.modules?.results?.targetAge ?? 0)
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