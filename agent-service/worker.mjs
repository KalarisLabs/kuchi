import { createMcpHandler } from 'agents/mcp/server';
import { loadArchive, cachedLoader, record, filters, findVideo, SITE_URL } from './catalog.mjs';
import { breakdown } from './breakdown.mjs';
import { createServer, VERSION } from './server.mjs';
import { guardRequest } from './request-guard.mjs';
import { IpRateLimiter, durableLimiter } from './limiter.mjs';
import { createAnalytics, startSession, withSessionToken } from './analytics.mjs';

import { SKILL, SKILL_NAMES, skillFiles, skillCatalog } from './skill.mjs';

// The entry module may only export handlers and Durable Object classes.
export { IpRateLimiter };
// One catalog cache per isolate, shared by every request.
const load = cachedLoader(previous => loadArchive(fetch, {previous}));
const CLAUDE_CONNECT_URL = 'https://claude.ai/customize/connectors?' + new URLSearchParams({ modal: 'add-custom-connector', connectorName: 'Kuchi', connectorUrl: `${SITE_URL}/mcp` });
// Past this many requests in an hour, a client's calls are still answered but no
// longer counted in analytics, so one client can't use up the analytics quota.
const ANALYTICS_HOURLY_CAP = 300;
const MCP_OPTIONS = { route: '/mcp', legacy: 'stateless', allowedHostnames: ['kuchi.kalarislabs.com', 'localhost', '127.0.0.1'], allowedOriginHostnames: '*' };

// Arguments that earlier versions advertised. Clients can keep a tool list for
// a long time, so a call that still carries one is answered with it dropped.
const RETIRED_ARGUMENTS = { intent: tool => tool.startsWith('kuchi_'), shot_kind: tool => tool === 'kuchi_search_videos' };
function dropRetiredArguments(request, messages, batch) {
  let changed = false;
  for (const message of messages) {
    const args = message?.method === 'tools/call' ? message.params?.arguments : null;
    if (!args || typeof args !== 'object') continue;
    for (const [name, applies] of Object.entries(RETIRED_ARGUMENTS))
      if (Object.hasOwn(args, name) && applies(String(message.params.name))) { delete args[name]; changed = true; }
  }
  return changed ? new Request(request, { body: JSON.stringify(batch ? messages : messages[0]) }) : request;
}

const HEADERS = { 'Cache-Control': 'no-store, max-age=0', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' };
function response(body, type = 'application/json', status = 200) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { ...HEADERS, 'Content-Type': `${type}; charset=utf-8` } });
}

// The open HTTP copies of what the MCP tools return, for agents without MCP.
// Each file is rendered once per catalog commit and kept in memory. Clients
// may reuse a copy for a minute, and one sending If-None-Match with the
// current ETag gets an empty 304.
//
// The ETag names what the content is made from (the file, the catalog commit
// and this server's version), not a hash of the bytes: catalog.json carries
// the fetched_at of the isolate that loaded it, so its bytes differ between
// isolates while its content does not. It is weak (W/) for that reason, and
// every isolate gives the same ETag for the same commit.
const MIRROR_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const rendered = new Map();
const hash = text => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16);
};
const opaque = tag => tag.trim().replace(/^W\//, '');
function mirrored(key, revision, render) {
  const held = rendered.get(key);
  if (held?.revision === revision) return held;
  const {body, type} = render();
  const entry = {revision, body, type, etag:`W/"${hash(`${key}|${revision}|${VERSION}`)}"`};
  rendered.set(key, entry);
  return entry;
}
function mirrorResponse(request, {body, type, etag}) {
  const headers = {...HEADERS, 'Cache-Control':MIRROR_CACHE, ETag:etag, 'Content-Type':`${type}; charset=utf-8`};
  const sent = request.headers.get('If-None-Match');
  if (sent && (sent.trim() === '*' || sent.split(',').map(opaque).includes(opaque(etag)))) return new Response(null, {status:304, headers});
  return new Response(body, {status:200, headers});
}

async function agentFile(request, path, options) {
  // SKILL changes only on deploy, so its own text stands in for a commit.
  if (path === '/agent/SKILL.md') return mirrorResponse(request, mirrored(path, hash(SKILL), () => ({body:SKILL, type:'text/markdown'})));
  // The bundled build skills, for agents without MCP: /agent/skills/<name>/<file>.md
  const bundled = path.match(/^\/agent\/skills\/([a-z0-9-]{1,40})\/([A-Za-z0-9_-]{1,60}\.md)$/);
  if (bundled) {
    const text = skillFiles(bundled[1])?.[bundled[2]];
    if (text === undefined) return response({ error: 'Not found', skills: SKILL_NAMES }, 'application/json', 404);
    return mirrorResponse(request, mirrored(path, hash(text), () => ({body:text, type:'text/markdown'})));
  }
  const breakdownId = path.match(/^\/agent\/breakdowns\/(\d{1,6})\.json$/)?.[1];
  if (!breakdownId && !['/agent/manifest.json', '/agent/catalog.json', '/agent/workflow.md'].includes(path)) return response({ error: 'Not found' }, 'application/json', 404);
  try {
    const archive = await load(options);
    if (breakdownId) {
      const video = findVideo(archive, breakdownId);
      const data = video && breakdown(archive, record(archive, video), { limit: 1000 });
      if (!data) return response({ error: `No breakdown for video ${breakdownId}.` }, 'application/json', 404);
      return mirrorResponse(request, mirrored(`/agent/breakdowns/${video.id}.json`, archive.sourceRevision, () => ({body:JSON.stringify(data), type:'application/json'})));
    }
    return mirrorResponse(request, mirrored(path, archive.sourceRevision, () =>
      path.endsWith('workflow.md') ? {body:archive.workflow, type:'text/markdown'}
        : path.endsWith('catalog.json') ? {body:JSON.stringify({ source_revision: archive.sourceRevision, fetched_at: archive.fetchedAt, ...filters(archive), videos: archive.videos.map(v => record(archive, v)) }), type:'application/json'}
          : {body:JSON.stringify({ ...archive.manifest, version: VERSION, source_revision: archive.sourceRevision }), type:'application/json'}));
  } catch (error) {
    console.error(JSON.stringify({ event: 'catalog_unavailable', path, message: error.message }));
    return response({ error: "Kuchi's catalog is temporarily unavailable. Retry in a minute." }, 'application/json', 503);
  }
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    // Liveness probe, outside the rate limit.
    if (path === '/mcp/health') {
      if (!['GET', 'HEAD'].includes(request.method)) return response({ error: 'Method not allowed' }, 'application/json', 405);
      const health = response({ status: 'ok', product: 'Kuchi', version: VERSION });
      return request.method === 'HEAD' ? new Response(null, { status: 200, headers: health.headers }) : health;
    }
    // Background cache refreshes and writes outlive the response through this.
    const cacheOptions = {waitUntil:promise => ctx.waitUntil(promise)};
    const analytics = createAnalytics(request, env);
    const done = result => analytics ? analytics.finish(ctx, result) : result;
    // The strict per-client Durable Object replaces the approximate binding when bound.
    const guarded = await guardRequest(request, env.IP_LIMITER ? { ...env, ARCHIVE_REQUEST_LIMITER: durableLimiter(env.IP_LIMITER) } : env);
    if (guarded.response) {
      // One event when a client first hits the limit, not one per rejected request.
      if (guarded.limited?.first) analytics?.capture('kuchi_rate_limited', { window: guarded.limited.window, path: path === '/mcp' ? '/mcp' : '/agent' });
      return done(guarded.response);
    }
    request = guarded.request;
    const muted = guarded.hour > ANALYTICS_HOURLY_CAP;

    if (path === '/mcp') {
      request = dropRetiredArguments(request, guarded.messages, guarded.batch);
      const session = analytics ? startSession(request, guarded.messages) : { request, token: null };
      // The skill is an extra. If it can't be built, the tools still serve.
      const skills = await skillCatalog().catch(error => { console.error(JSON.stringify({ event: 'skill_catalog_unavailable', message: error.message })); return null; });
      const server = () => createServer(load, { posthog: analytics?.posthog, media: env.MEDIA, properties: analytics?.properties, muted, skills, waitUntil: cacheOptions.waitUntil });
      const result = await createMcpHandler(server, MCP_OPTIONS)(session.request, env, ctx);
      return done(withSessionToken(result, session.token));
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (!['GET', 'HEAD'].includes(request.method)) return response({ error: 'Method not allowed' }, 'application/json', 405);
    // OpenAI checks that this domain belongs to the submitter by reading back
    // the token its portal issued. Unset means there is nothing to verify.
    if (path === '/.well-known/openai-apps-challenge') {
      const token = String(env.OPENAI_APPS_CHALLENGE ?? '').trim();
      if (!token) return response({ error: 'Not found' }, 'application/json', 404);
      const proof = new Response(token, { status: 200, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } });
      return request.method === 'HEAD' ? new Response(null, { status: 200, headers: proof.headers }) : proof;
    }
    if (path === '/agent/connect/claude') {
      if (!muted) analytics?.capture('kuchi_connect_redirect', { client: 'claude' });
      return done(new Response(null, { status: 302, headers: { ...HEADERS, Location: CLAUDE_CONNECT_URL } }));
    }
    if (path === '/agent' || path === '/agent/') return Response.redirect(`${SITE_URL}/#connect`, 302);
    const file = await agentFile(request, path, cacheOptions);
    if (file.status < 400 && !muted) analytics?.capture('kuchi_agent_file_fetched', { file: path.startsWith('/agent/breakdowns/') ? 'breakdown' : path.slice('/agent/'.length) });
    return done(request.method === 'HEAD' ? new Response(null, { status: file.status, headers: file.headers }) : file);
  }
};
