// First-party path for the site's product analytics (PostHog).
//
//   GET /relay/config   which PostHog project the page should use, if any
//   everything else     forwarded to PostHog without the visitor's IP address
//                       or cookies
//
// Analytics are off unless POSTHOG_PROJECT_TOKEN is set in wrangler.jsonc.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const settings = env as { POSTHOG_PROJECT_TOKEN?: string; POSTHOG_HOST?: string };
const API_HOST = new URL(settings.POSTHOG_HOST || 'https://us.i.posthog.com').host;
// PostHog serves its scripts from a second host: us.i.posthog.com -> us-assets.i.posthog.com
const ASSET_HOST = API_HOST.replace('.i.posthog.com', '-assets.i.posthog.com');
const MAX_BODY_BYTES = 1024 * 1024;
// The only PostHog paths the page's SDK uses. Nothing else is forwarded.
const FORWARDED = /^\/(e|i\/v\d+\/e|batch|flags|decide|engage)\/?$/;
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, 'Cache-Control': 'no-store', ...headers } });

export const ALL: APIRoute = async ({ request }) => {
  const token = settings.POSTHOG_PROJECT_TOKEN ?? '';
  const url = new URL(request.url);
  // Taken from the URL so a trailing slash reaches PostHog unchanged.
  const path = url.pathname.slice('/relay'.length) || '/';

  if (path === '/config') {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    // The country comes from Cloudflare's edge, so the page never needs the visitor's IP address.
    const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? null;
    return json({ token, api_host: '/relay', ui_host: 'https://us.posthog.com', country });
  }
  if (!token) return json({ error: 'Analytics are not configured' }, 404);
  if (!['GET', 'POST', 'OPTIONS'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);

  if (path.startsWith('/static/') || path.startsWith('/array/')) {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const asset = await fetch(`https://${ASSET_HOST}${path}${url.search}`, { cf: { cacheEverything: true, cacheTtl: 3600 } } as RequestInit);
    const headers = new Headers(asset.headers);
    headers.set('Cache-Control', asset.ok ? 'public, max-age=3600' : 'no-store');
    headers.delete('Set-Cookie');
    return new Response(asset.body, { status: asset.status, headers });
  }

  if (!FORWARDED.test(path)) return json({ error: 'Not found' }, 404);
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413);
  const body = request.method === 'POST' ? await request.arrayBuffer() : null;
  if (body && body.byteLength > MAX_BODY_BYTES) return json({ error: 'Request too large' }, 413);

  // Forward only what PostHog needs. Cookies and credentials never leave this site.
  const headers = new Headers();
  for (const name of ['Content-Type', 'Content-Encoding', 'Accept', 'Accept-Language', 'User-Agent', 'Origin', 'Referer']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // The visitor's IP address is deliberately not forwarded: PostHog saves whatever
  // address it sees with the event, so it only ever sees Cloudflare's.
  const upstream = await fetch(`https://${API_HOST}${path}${url.search}`, { method: request.method, headers, body, redirect: 'manual' });
  const answer = new Headers(upstream.headers);
  answer.delete('Set-Cookie');
  return new Response(upstream.body, { status: upstream.status, headers: answer });
};
