// /sitemap.xml: every page, built once at build time. Keep in step with src/pages.
// Video and component pages carry video-sitemap entries (thumbnail, title, description,
// file), so search engines can index the previews.
import type { APIRoute } from 'astro';
import { components, posterUrl, videoUrl } from '../lib/components-catalog';
import { newestFirst } from '../lib/catalog';
import { videoPath } from '../lib/video-links.js';
import { harnesses, harnessPath } from '../lib/harnesses';
import { posts, postPath } from '../lib/blog';

export const prerender = true;

interface Entry { path: string; lastmod?: string; video?: { thumb: string; title: string; description: string; file: string; date?: string; seconds?: number } }

const xml = (value: string) => value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
const clip = (text: string, max = 2000) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const latest = newestFirst[0]?.date;

const ENTRIES: Entry[] = [
  { path: '/', lastmod: latest },
  { path: '/videos', lastmod: latest },
  ...newestFirst.map((video) => ({
    path: videoPath(video),
    lastmod: video.snapshotDate || video.date,
    video: {
      thumb: video.poster,
      title: video.title,
      description: clip(video.notes.join(' ') || `${video.title} launch video by ${video.account}.`),
      file: video.video,
      date: video.date,
      seconds: Math.round(video.originalSeconds || video.clipSeconds),
    },
  })),
  { path: '/components' },
  ...components.map((item) => ({
    path: `/components/${item.name}`,
    video: { thumb: posterUrl(item.name), title: `${item.title} — Remotion component`, description: clip(item.description), file: videoUrl(item.name) },
  })),
  { path: '/agents', lastmod: latest },
  ...harnesses.map((h) => ({ path: harnessPath(h), lastmod: latest })),
  { path: '/blog', lastmod: posts.map((p) => p.updated).sort().at(-1) },
  ...posts.map((p) => ({ path: postPath(p), lastmod: p.updated })),
  { path: '/support' },
  { path: '/privacy' },
  { path: '/terms' },
];

export const GET: APIRoute = ({ site }) => {
  const urls = ENTRIES.map(({ path, lastmod, video }) => {
    const parts = [`<loc>${xml(new URL(path, site).href)}</loc>`];
    if (lastmod) parts.push(`<lastmod>${lastmod}</lastmod>`);
    if (video) {
      parts.push(
        `<video:video><video:thumbnail_loc>${xml(video.thumb)}</video:thumbnail_loc><video:title>${xml(video.title)}</video:title><video:description>${xml(video.description)}</video:description><video:content_loc>${xml(video.file)}</video:content_loc>${video.seconds ? `<video:duration>${video.seconds}</video:duration>` : ''}${video.date ? `<video:publication_date>${video.date}T12:00:00-08:00</video:publication_date>` : ''}</video:video>`,
      );
    }
    return `  <url>${parts.join('')}</url>`;
  }).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
