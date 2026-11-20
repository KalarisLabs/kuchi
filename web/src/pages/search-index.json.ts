// /search-index.json: everything the command palette (components/CommandPalette.astro)
// can jump to, built once at build time. Loaded by the palette on first use only.
import type { APIRoute } from 'astro';
import { newestFirst } from '../lib/catalog';
import { components, categoryLabels, posterUrl } from '../lib/components-catalog';
import { videoPath } from '../lib/video-links.js';
import { harnesses, harnessPath } from '../lib/harnesses';
import { posts, postPath } from '../lib/blog';
import { useCaseSearchEntries } from '../lib/use-cases';

export const prerender = true;

export interface SearchEntry {
  /** Group: page, video or component. */
  k: 'page' | 'agent' | 'video' | 'component';
  /** Title. */
  t: string;
  /** Secondary line. */
  s: string;
  /** Destination. */
  h: string;
  /** Extra words to match (not shown). */
  w: string;
  /** Thumbnail. */
  i?: string;
}

const pages: SearchEntry[] = [
  { k: 'page', t: 'Home', s: 'Kuchi — launch-video references for your agent', h: '/', w: 'start landing' },
  { k: 'page', t: 'All launch videos', s: 'Browse, filter and sort every reference', h: '/videos', w: 'gallery collection archive browse' },
  { k: 'page', t: 'Video components', s: `${components.length} copy-paste Remotion components`, h: '/components', w: 'registry shadcn remotion library' },
  { k: 'page', t: 'Connect your agent', s: 'Add the Kuchi MCP to Claude, ChatGPT, Codex, Cursor', h: '/#connect', w: 'mcp install claude codex cursor chatgpt agent setup' },
  { k: 'page', t: 'Agent guides', s: 'Make a launch video with Claude Code, Codex, Cursor and more', h: '/agents', w: 'harness guide how to setup install mcp' },
  { k: 'page', t: 'Product launch video skill', s: 'Install the skill that makes a launch video end to end', h: '/skills/product-launch-video', w: 'skill install npx skills claude code codex agent skill launch promo teaser' },
  { k: 'page', t: 'Agent skills', s: 'Every Kuchi skill: launch video, Remotion, sound, audio check', h: '/skills', w: 'skills install skill.md remotion sound audio' },
  { k: 'page', t: 'Blog', s: 'Guides to launch videos with AI agents', h: '/blog', w: 'articles guides posts how to' },
  ...useCaseSearchEntries(),
  ...posts.map((p): SearchEntry => ({ k: 'page', t: p.heading, s: p.summary, h: postPath(p), w: `blog ${p.keywords.join(' ')}` })),
  { k: 'page', t: 'FAQ', s: 'How Kuchi works', h: '/#faq', w: 'questions help' },
  { k: 'page', t: 'Support', s: 'Get help', h: '/support', w: 'contact help email' },
  { k: 'page', t: 'Privacy', s: 'What Kuchi collects', h: '/privacy', w: 'data analytics' },
  { k: 'page', t: 'Terms', s: 'Terms of use', h: '/terms', w: 'legal license' },
  { k: 'page', t: 'Legal notice', s: 'Operator, contact and video removal requests', h: '/legal', w: 'imprint takedown removal trademark contact' },
  { k: 'page', t: 'Analytics preferences', s: 'Turn website analytics off or on', h: '/analytics-preferences', w: 'privacy opt out tracking do not track gpc' },
];

const agents: SearchEntry[] = harnesses.map((h) => ({
  k: 'agent',
  t: `Launch videos with ${h.name}`,
  s: h.tagline,
  h: harnessPath(h),
  w: [h.name, h.maker, ...h.keywords].join(' '),
}));

const videos: SearchEntry[] = newestFirst.map((video) => ({
  k: 'video',
  t: video.title,
  s: `${video.account} · ${video.category}`,
  h: videoPath(video),
  w: [video.originalTitle, ...video.styles, ...video.notes].join(' ').slice(0, 400),
  i: video.poster,
}));

const parts: SearchEntry[] = components.map((item) => ({
  k: 'component',
  t: item.title,
  s: `${categoryLabels[item.category] ?? item.category} · ${item.description}`.slice(0, 120),
  h: `/components/${item.name}`,
  w: `${item.name} ${item.category} ${item.description}`,
  i: posterUrl(item.name),
}));

export const GET: APIRoute = () =>
  new Response(JSON.stringify([...pages, ...agents, ...videos, ...parts]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
