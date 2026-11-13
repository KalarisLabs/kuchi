// This is an abuse throttle, not a daily allowance or a global billing limit.
// Order matters: bound the body first (cheap), count its messages, then charge
// the client's limit for each one.
import {clientKey, MAX_COST} from './limiter.mjs';

export const MAX_MCP_BODY_BYTES = 64 * 1024;
const RETRY_SECONDS = 60;

function reject(status, error, retryAfter) {
  const headers = {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Expose-Headers':'Retry-After',
    'X-Content-Type-Options':'nosniff'
  };
  if (retryAfter) headers['Retry-After'] = String(retryAfter);
  return new Response(JSON.stringify({error}), {status, headers});
}

// Returns {response} to send as is, or {request, messages, batch, hour} to carry on with.
// `messages` are the parsed JSON-RPC messages of an MCP POST (empty otherwise),
// `batch` says whether they arrived as an array, and `hour` is how many
// requests this client has made in the last hour.
export async function guardRequest(request, env) {
  const body = await readBoundedBody(request);
  if (body.response) return body;

  let messages = [], hour = 0, batch = false;
  if (body.bytes) {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(body.bytes));
      batch = Array.isArray(parsed);
      messages = batch ? parsed : [parsed];
    } catch { /* The MCP handler answers malformed JSON with a parse error. */ }
    if (messages.length > MAX_COST) return {response:reject(400, `Send at most ${MAX_COST} JSON-RPC messages in one request.`)};
  }

  try {
    // CF-Connecting-IP is set by Cloudflare at ingress. Never trust the
    // caller-supplied X-Forwarded-For, query string, client name or Bearer token.
    // One key covers MCP, bootstrap and HTTP catalog routes together.
    const key = `kuchi:${clientKey(request.headers.get('CF-Connecting-IP'))}`;
    if (!env?.ARCHIVE_REQUEST_LIMITER) throw new Error('Missing rate limit binding');
    const {success, retryAfter = RETRY_SECONDS, window = 'minute', first = false, hour:used = 0} = await env.ARCHIVE_REQUEST_LIMITER.limit({key, cost:Math.max(1, messages.length)});
    hour = used;
    if (!success) {
      const allowance = window === 'hour' ? '1,500 an hour' : '120 a minute';
      return {limited:{window, first}, response:reject(429, `Too many requests: Kuchi allows ${allowance} per IP. Retry after ${retryAfter} seconds.`, retryAfter)};
    }
  } catch {
    console.error(JSON.stringify({event:'archive_rate_limiter_unavailable'}));
    return {response:reject(503, 'Request protection temporarily unavailable. Retry shortly.', 10)};
  }
  return {request:body.request, messages, batch, hour};
}

async function readBoundedBody(request) {
  if (request.method !== 'POST' || new URL(request.url).pathname !== '/mcp') return {request};
  const declaredLength = request.headers.get('Content-Length');
  if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_MCP_BODY_BYTES)) {
    if (request.body) await request.body.cancel().catch(() => {});
    return {response:reject(413, 'MCP request body must not exceed 64 KiB.')};
  }
  if (!request.body) return {request};

  // Check actual bytes too: Content-Length can be absent or dishonest.
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MCP_BODY_BYTES) return {response:reject(413, 'MCP request body must not exceed 64 KiB.')};
      chunks.push(value);
    }
  } catch {
    return {response:reject(400, 'Could not read MCP request body.')};
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
  const headers = new Headers(request.headers);
  headers.delete('Content-Length');
  return {request:new Request(request, {headers, body:bytes}), bytes};
}
