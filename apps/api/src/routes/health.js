import { getDatabaseHealth } from '../lib/db.js';
import { jsonResponse } from '../lib/http.js';

export async function handleHealthRequest(env) {
  const database = await getDatabaseHealth(env.DB);

  return jsonResponse({
    service: 'yield-360-api',
    status: 'ok',
    database
  });
}