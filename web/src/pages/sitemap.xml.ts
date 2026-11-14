// /sitemap.xml: the site's pages, built once at build time. Keep in step with src/pages.
import type { APIRoute } from 'astro';

export const prerender = true;

const PAGES = ['/', '/privacy', '/terms', '/support'];

export const GET: APIRoute = ({ site }) => {
  const urls = PAGES.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
