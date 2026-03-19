const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export function withCors(response) {
  const nextHeaders = new Headers(response.headers);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    nextHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: nextHeaders
  });
}

export function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export function optionsResponse() {
  return withCors(
    new Response(null, {
      status: 204
    })
  );
}