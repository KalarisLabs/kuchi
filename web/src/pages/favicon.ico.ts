// /favicon.ico. Crawlers, link unfurlers and older browsers request this exact path
// regardless of the <link rel="icon"> tags, so it must exist. Built once at build time.
import type { APIRoute } from 'astro';
import { FAVICON_ICO_BASE64 } from '../lib/favicon-ico';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(Uint8Array.from(atob(FAVICON_ICO_BASE64), (c) => c.charCodeAt(0)), {
    headers: { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' },
  });
