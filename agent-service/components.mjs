// The copy-paste video components on the website's /components page, read at
// runtime from the shadcn registry the site publishes: /r/registry.json lists
// every component and /r/<name>.json carries one with its source inlined. A
// component added to the site shows up here on the site's next deploy, with no
// change to this Worker.
import {readBounded, cachedLoader, SITE_URL} from './catalog.mjs';

export const REGISTRY_URL = `${SITE_URL}/r/registry.json`;
export const COMPONENTS_PAGE = `${SITE_URL}/components`;
export const registryUrl = name => `${SITE_URL}/r/${name}.json`;
// The same command the components page shows.
export const installCommand = name => `npx shadcn@latest add ${registryUrl(name)}`;
// Shared code other components build on. The CLI installs it with them.
export const LIBRARY = 'library';
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
const LIMITS = {index:1024 * 1024, item:1024 * 1024};
const MAX_ITEMS = 1000;

const strings = value => Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];
// Registry dependencies are listed as full /r/<name>.json URLs; agents get names.
const depName = dep => String(dep).match(/\/r\/([a-z0-9-]+)\.json$/)?.[1] ?? String(dep);

async function readJson(fetcher, url, limit) {
  const response = await fetcher(url, {headers:{'User-Agent':'KuchiMCP/1.0', Accept:'application/json'}, cache:'no-store', signal:AbortSignal.timeout(12000)});
  return JSON.parse(await readBounded(response, limit));
}

export async function loadIndex(fetcher = fetch) {
  const registry = await readJson(fetcher, REGISTRY_URL, LIMITS.index);
  const items = registry?.items;
  if (!Array.isArray(items) || !items.length || items.length > MAX_ITEMS) throw new Error('Published component registry schema unavailable');
  if (items.some(i => !NAME.test(i?.name ?? '') || typeof i.title !== 'string' || typeof i.description !== 'string')) throw new Error('Published component registry is invalid');
  return {
    components:items.map(i => ({
      name:i.name, title:i.title, description:i.description,
      category:strings(i.categories)[0] ?? null,
      dependencies:strings(i.dependencies),
      registry_dependencies:strings(i.registryDependencies).map(depName),
      files:(Array.isArray(i.files) ? i.files : []).map(f => f?.target ?? f?.path).filter(p => typeof p === 'string')
    })),
    fetchedAt:new Date().toISOString()
  };
}

export async function loadItem(name, fetcher = fetch) {
  const item = await readJson(fetcher, registryUrl(name), LIMITS.item);
  if (item?.name !== name || !Array.isArray(item.files) || item.files.some(f => typeof f?.content !== 'string' || typeof (f.target ?? f.path) !== 'string'))
    throw new Error('Published component is invalid');
  return {
    docs:typeof item.docs === 'string' ? item.docs : null,
    dev_dependencies:strings(item.devDependencies),
    files:item.files.map(f => ({path:f.target ?? f.path, type:f.type ?? null, content:f.content}))
  };
}

// The index and each component are cached with the catalog's fresh/stale
// policy. Only names in the index are ever fetched, so the cache stays bounded.
export function componentRegistry({fetcher = (...args) => fetch(...args), now = Date.now} = {}) {
  const index = cachedLoader(() => loadIndex(fetcher), now);
  const items = new Map();
  return {
    index,
    item:name => {
      if (!items.has(name)) items.set(name, cachedLoader(() => loadItem(name, fetcher), now));
      return items.get(name)();
    }
  };
}

const words = text => String(text ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

// The agent-facing shape of one component in a listing.
export function componentRecord(c) {
  return {
    name:c.name, title:c.title, description:c.description, category:c.category,
    registry_url:registryUrl(c.name), install:installCommand(c.name),
    dependencies:c.dependencies, registry_dependencies:c.registry_dependencies, files:c.files,
    page_url:c.category === LIBRARY ? COMPONENTS_PAGE : `${COMPONENTS_PAGE}#cmp-${c.name}`
  };
}

export function categories(index) {
  const counts = index.components.reduce((n, c) => (c.category && (n[c.category] = (n[c.category] ?? 0) + 1), n), {});
  return Object.entries(counts).map(([value, components]) => ({value, components})).sort((a, b) => b.components - a.components || a.value.localeCompare(b.value));
}

// Keywords rank by where they match (name and title count most); a category
// filters. Shared library code is left out unless asked for by category.
export function listComponents(index, args = {}) {
  const tokens = words(args.query);
  const category = args.category?.trim().toLowerCase();
  const rows = index.components
    .filter(c => category ? c.category === category : c.category !== LIBRARY)
    .map((c, order) => {
      const head = new Set(words(`${c.name} ${c.title}`));
      const body = `${c.description} ${c.category ?? ''} ${c.dependencies.join(' ')}`.toLowerCase();
      const score = tokens.reduce((n, t) => n + ([...head].some(w => w.startsWith(t)) ? 3 : body.includes(t) ? 1 : 0), 0);
      return {c, score, order};
    })
    .filter(r => !tokens.length || r.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);
  const offset = args.offset ?? 0;
  const limit = args.limit ?? 20;
  const components = rows.slice(offset, offset + limit).map(r => componentRecord(r.c));
  const next = offset + components.length;
  return {total:rows.length, count:components.length, offset, components, has_more:rows.length > next,
    ...(rows.length > next ? {next_offset:next} : {}), categories:categories(index), registry_url:REGISTRY_URL, page_url:COMPONENTS_PAGE};
}

// Accepts a name ("text-reveal"), its registry URL or a components-page link.
export function findComponent(index, reference) {
  const ref = String(reference).trim().toLowerCase().replace(/[?].*$/, '').replace(/\/$/, '');
  const name = ref.match(/\/r\/([a-z0-9-]+)\.json$/)?.[1] ?? ref.match(/#cmp-([a-z0-9-]+)$/)?.[1] ?? ref;
  return index.components.find(c => c.name === name) ?? null;
}

export const USAGE = [
  'Install with the command, or copy each file to its path, which is relative to the project root the shadcn aliases point at (src/ when imports use @/).',
  'Install the npm dependencies, and every registry dependency the same way: the command does both.',
  'Read the props at the top of the main file before using it, and pass the user\'s own text, colors and assets.'
];

// One component with its source. A file longer than `limit` characters comes
// in parts split on line breaks; `part` picks one.
export function componentDetail(c, item, {file = 1, part = 1, limit}) {
  const files = item.files.map((f, i) => ({index:i + 1, path:f.path, type:f.type, characters:f.content.length}));
  const chosen = item.files[file - 1];
  const parts = chosen ? splitLines(chosen.content, limit) : [];
  return {
    ...componentRecord(c),
    dev_dependencies:item.dev_dependencies,
    usage:[...(item.docs ? [item.docs] : []), ...USAGE],
    file_count:files.length, files,
    ...(chosen ? {file:{index:file, path:chosen.path, part:Math.min(part, parts.length), parts:parts.length, content:parts[part - 1] ?? null}} : {})
  };
}

export function splitLines(content, limit) {
  if (content.length <= limit) return [content];
  const parts = [];
  let current = '';
  for (const line of content.split(/(?<=\n)/)) {
    if (current && current.length + line.length > limit) { parts.push(current); current = ''; }
    // A single line longer than the limit is cut where it must be.
    for (let rest = line; rest.length; rest = rest.slice(limit)) {
      if (rest.length > limit) { parts.push(rest.slice(0, limit)); continue; }
      current += rest; break;
    }
  }
  if (current) parts.push(current);
  return parts;
}
