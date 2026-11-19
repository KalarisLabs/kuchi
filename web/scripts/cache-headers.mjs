// Astro integration: appends browser caching rules for the prerendered pages and data
// files to dist/client/_headers (Workers Static Assets reads it). The Cloudflare adapter
// writes the immutable rule for /_astro/* into the same file; these rules never overlap
// with it, because Cloudflare joins the values of every rule that matches a path.
//
// Pages: fresh for 2 minutes, then served from the browser cache while a background
// revalidation (ETag, usually a 304) fetches any new deploy, for up to a week.
import { appendFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PAGE = 'public, max-age=120, stale-while-revalidate=604800';
const DATA = 'public, max-age=600, stale-while-revalidate=86400';

const RULES = [
  [['/', '/videos', '/videos/*', '/components', '/components/*', '/agents', '/agents/*', '/blog', '/blog/*', '/privacy', '/terms', '/support'], PAGE],
  [['/r/*', '/search-index.json', '/videos.json', '/llms.txt', '/sitemap.xml', '/robots.txt'], DATA],
];

export function cacheHeaders() {
  return {
    name: 'kuchi-cache-headers',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const file = new URL('_headers', dir);
        const existing = await readFile(file, 'utf8').catch(() => '');
        if (existing.includes('# kuchi-cache-headers')) return;
        const block = RULES.flatMap(([paths, value]) => paths.map((path) => `${path}\n  Cache-Control: ${value}\n  X-Content-Type-Options: nosniff`)).join('\n');
        await appendFile(file, `${existing && !existing.endsWith('\n') ? '\n' : ''}# kuchi-cache-headers\n${block}\n`);
        logger.info(`Cache-Control for pages and data appended to ${fileURLToPath(file)}`);
      },
    },
  };
}
