// /robots.txt. Cloudflare's managed robots.txt (content signals) is added in front of
// this at the edge; this file only allows crawling and points to the sitemap.
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
