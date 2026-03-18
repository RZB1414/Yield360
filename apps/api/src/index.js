import { getKnownErrorResponse } from './lib/api-errors.js';
import { optionsResponse, withCors } from './lib/http.js';
import { handleHealthRequest } from './routes/health.js';
import {
  handleAnalyzePlanRequest,
  handleCreatePlanRequest,
  handleGetPlanRequest,
  handleListPlansRequest,
  handleUpdatePlanRequest
} from './routes/plans.js';

function notFoundResponse() {
  return new Response(JSON.stringify({ message: 'Rota nao encontrada.' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

async function routeRequest(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'GET' && pathname === '/') {
    return new Response(
      JSON.stringify({
        service: 'yield-360-api',
        status: 'ok',
        routes: ['/api/health', '/api/plans', '/api/plans/analyze', '/api/plans/:planId']
      }),
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }

  if (request.method === 'GET' && pathname === '/api/health') {
    return handleHealthRequest(env);
  }

  if (request.method === 'GET' && pathname === '/api/plans') {
    return handleListPlansRequest(env);
  }

  if (request.method === 'POST' && pathname === '/api/plans') {
    return handleCreatePlanRequest(request, env);
  }

  if (request.method === 'POST' && pathname === '/api/plans/analyze') {
    return handleAnalyzePlanRequest(request);
  }

  const planMatch = pathname.match(/^\/api\/plans\/([^/]+)$/);

  if (request.method === 'GET' && planMatch) {
    return handleGetPlanRequest(env, planMatch[1]);
  }

  if (request.method === 'PUT' && planMatch) {
    return handleUpdatePlanRequest(request, env, planMatch[1]);
  }

  return notFoundResponse();
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return optionsResponse();
    }

    try {
      const response = await routeRequest(request, env);
      return withCors(response);
    } catch (error) {
      console.error(error);

      const knownError = getKnownErrorResponse(error);
      const payload = knownError
        ? { message: knownError.message }
        : {
            message: 'Erro interno ao processar o pedido.',
            details: error.message
          };

      return withCors(
        new Response(JSON.stringify(payload), {
          status: knownError?.status ?? 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        })
      );
    }
  }
};