// Anonymous usage analytics, sent to PostHog. Off unless POSTHOG_PROJECT_TOKEN
// is set. Nothing here may slow down or fail a request: events are queued and
// flushed after the response has been sent.
//
// What is sent: which tool ran, how long it took, whether it failed, the MCP
// client's name and version, catalog search terms and the reference asked for.
// What is never sent: the user's product name, description, features, copy or
// assets, and IP addresses. server.mjs strips those before an event is queued.
import {PostHog, MCP_SESSION_HEADER, encodeSessionId, newSessionId} from '@posthog/mcp';

const clean = (value, max = 120) => typeof value === 'string' ? value.replace(/[\x00-\x1F\x7F]/g, '').slice(0, max) : undefined;

export function createAnalytics(request, env) {
  const token = env?.POSTHOG_PROJECT_TOKEN;
  // Kuchi's own health checks and live verification identify themselves and are not counted.
  if (!token || /^kuchi-verify/i.test(request.headers.get('User-Agent') ?? '')) return null;
  const posthog = new PostHog(token, {host:env.POSTHOG_HOST || 'https://us.i.posthog.com', flushAt:50, flushInterval:0, disableGeoip:true});
  // Country comes from Cloudflare's edge, so no IP address is forwarded.
  const properties = {country:clean(request.cf?.country, 2), mcp_user_agent:clean(request.headers.get('User-Agent'))};
  return {
    posthog, properties,
    // An event that is not an MCP request (a rate limit, a file fetched over HTTP).
    capture(event, extra = {}) {
      posthog.capture({distinctId:crypto.randomUUID(), event, properties:{app:'kuchi', $process_person_profile:false, ...properties, ...extra}});
    },
    // Sends queued events once the response body has been delivered.
    finish(ctx, response) {
      const flush = () => posthog.shutdown().catch(() => {});
      if (!response?.body) { ctx.waitUntil(flush()); return response; }
      const {readable, writable} = new TransformStream();
      ctx.waitUntil(response.body.pipeTo(writable).catch(() => {}).then(flush));
      return new Response(readable, response);
    }
  };
}

// This server keeps no sessions. So that one client's calls can still be
// grouped, initialize mints a token holding a random session id and the
// client's name and version. It is attached to the request (so the initialize
// event carries it) and returned to the client, which sends it back afterwards.
export function startSession(request, messages) {
  const init = messages.find(m => m?.method === 'initialize');
  if (!init || request.headers.get(MCP_SESSION_HEADER)) return {request, token:null};
  const token = encodeSessionId({sessionId:newSessionId(), clientName:clean(init.params?.clientInfo?.name), clientVersion:clean(init.params?.clientInfo?.version, 40)});
  const headers = new Headers(request.headers);
  headers.set(MCP_SESSION_HEADER, token);
  return {request:new Request(request, {headers}), token};
}

export function withSessionToken(response, token) {
  if (!token || !response.ok) return response;
  const headers = new Headers(response.headers);
  headers.set(MCP_SESSION_HEADER, token);
  const exposed = headers.get('Access-Control-Expose-Headers');
  if (!/mcp-session-id/i.test(exposed ?? '')) headers.set('Access-Control-Expose-Headers', [exposed, MCP_SESSION_HEADER].filter(Boolean).join(', '));
  return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
}
