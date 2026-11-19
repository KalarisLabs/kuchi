// GET /stats.json: live usage totals for the hero counter ({ agents, visits, live }).
//
// Counted in PostHog with a HogQL query (src/lib/usage.js). The query needs a personal
// API key with query:read scope, kept as the Worker secret POSTHOG_PERSONAL_API_KEY; it
// never reaches the browser. Answers are cached at the edge for 5 minutes, so PostHog
// sees at most one query per data centre every 5 minutes, however many people visit.
// Without the secret, or when PostHog fails, the build-time baseline is returned.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { USAGE_QUERY, readUsage, atLeastBaseline } from '../lib/usage.js';

export const prerender = false;

const settings = env as { POSTHOG_PERSONAL_API_KEY?: string; POSTHOG_PROJECT_ID?: string; POSTHOG_APP_HOST?: string };
const FRESH = 300;

const answer = (body: unknown, maxAge: number) =>
  new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  });

async function liveUsage() {
  const key = settings.POSTHOG_PERSONAL_API_KEY;
  if (!key) return null;
  const host = settings.POSTHOG_APP_HOST || 'https://us.posthog.com';
  const project = settings.POSTHOG_PROJECT_ID || '539141';
  try {
    const response = await fetch(`${host}/api/projects/${project}/query/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: USAGE_QUERY }, name: 'kuchi-site-usage-counter' }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? readUsage(await response.json()) : null;
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ request }) => {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const cacheKey = new Request(new URL('/stats.json', request.url).href);
  const hit = await cache?.match(cacheKey).catch(() => undefined);
  if (hit) return hit;

  const live = await liveUsage();
  const response = answer({ ...atLeastBaseline(live), live: live !== null }, live ? FRESH : 60);
  await cache?.put(cacheKey, response.clone()).catch(() => undefined);
  return response;
};
