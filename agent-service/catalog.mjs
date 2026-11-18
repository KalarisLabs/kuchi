// The published Kuchi catalog: data/videos.json, the frame-by-frame breakdowns,
// agent/manifest.json and agent/workflow.md, read at one immutable commit of the
// public repository.
import {indexBreakdowns, breakdownSummary, SHOT_KINDS, shotKinds} from './breakdown.mjs';
import {edgeCache, cacheKey, cacheGet, cachePut} from './cache.mjs';

const REPO = 'kalarislabs/kuchi';
const SOURCE_PATHS = {catalog:'data/videos.json', manifest:'agent/manifest.json', workflow:'agent/workflow.md', breakdowns:'data/breakdowns.json', labels:'data/shot_labels.json'};
const LIMITS = {catalog:4 * 1024 * 1024, breakdowns:4 * 1024 * 1024, labels:1024 * 1024};
// Breakdowns enrich the catalog. If they can't be read, the catalog still serves.
const OPTIONAL = new Set(['breakdowns', 'labels']);
export const SITE_URL = 'https://kuchi.kalarislabs.com';
export const MEDIA_URL = 'https://kuchi-media.kalarislabs.com';
// Every minute an isolate checks which commit main is at (a 444-byte read).
// The files are downloaded again only when that commit changes. Meanwhile
// requests keep being answered from memory: a refresh runs in the background
// and no caller waits for GitHub. If GitHub is unreachable, the last good copy
// keeps serving for up to a day.
export const FRESH_MS = 60 * 1000;
export const STALE_MS = 24 * 60 * 60 * 1000;
// After a failed refresh, wait this long before trying again.
export const RETRY_MS = 10 * 1000;
// Files read at a commit never change, so a location keeps them for a month.
const PINNED_SECONDS = 30 * 24 * 60 * 60;
// Isolates in one location share the answer to "which commit is main at?".
const REVISION_SECONDS = 30;

export async function readBounded(response, limit) {
  if (!response.ok) throw new Error('Published source unavailable');
  if (Number(response.headers.get('content-length')) > limit) throw new Error('Published source exceeds size limit');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Published source exceeds size limit');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
  return new TextDecoder().decode(bytes);
}

// Raw branch URLs can be stale, so resolve the current main commit first and
// read every file at that commit. `previous` is the copy already in memory:
// when main has not moved it is returned as is, with nothing downloaded.
export async function loadArchive(fetcher = fetch, {previous = null, cache = edgeCache()} = {}) {
  const options = () => ({headers:{'User-Agent':'KuchiMCP/1.0'}, cache:'no-store', signal:AbortSignal.timeout(12000)});
  const sourceRevision = await mainRevision(fetcher, options, cache);
  if (previous?.sourceRevision === sourceRevision) return previous;
  // Raw files for a commit pushed seconds ago can briefly 404, so retry.
  const read = async (path, limit) => {
    const key = cacheKey('github', REPO, sourceRevision, path);
    const hit = await cacheGet(cache, key);
    if (hit) { try { return await readBounded(hit, limit); } catch { /* A bad cached copy is read again from GitHub. */ } }
    for (let attempt = 0; ; attempt++) {
      try {
        const body = await readBounded(await fetcher(`https://raw.githubusercontent.com/${REPO}/${sourceRevision}/${path}`, options()), limit);
        await cachePut(cache, key, body, {seconds:PINNED_SECONDS, type:'text/plain; charset=utf-8'});
        return body;
      }
      catch (error) { if (attempt >= 2) throw error; await new Promise(r => setTimeout(r, 750 * (attempt + 1))); }
    }
  };
  const raw = Object.fromEntries(await Promise.all(Object.entries(SOURCE_PATHS).map(async ([key, path]) =>
    [key, await read(path, LIMITS[key] ?? 65536).catch(error => { if (OPTIONAL.has(key)) return null; throw error; })])));
  const parse = text => { try { return JSON.parse(text); } catch { return null; } };
  const catalog = JSON.parse(raw.catalog);
  const videos = Array.isArray(catalog) ? catalog : catalog?.videos;
  const manifest = JSON.parse(raw.manifest);
  if (manifest.schemaVersion !== 1 || !Array.isArray(videos) || !videos.length || videos.length > 5000) throw new Error('Published archive schema unavailable');
  if (videos.some(v => !Number.isInteger(v.id) || !v.title || !v.source || !Array.isArray(v.styles))) throw new Error('Published catalog is invalid');
  const formats = new Map((manifest.formats ?? []).map(f => [f.id, f.name]));
  return {videos, manifest, formats, workflow:raw.workflow, ...indexBreakdowns(parse(raw.breakdowns), parse(raw.labels)), sourceRevision, fetchedAt:new Date().toISOString()};
}

const REVISION = /^[0-9a-f]{40}$/;
async function mainRevision(fetcher, options, cache) {
  const key = cacheKey('github', REPO, 'main');
  const hit = await cacheGet(cache, key);
  const shared = hit && (await hit.text().catch(() => '')).trim();
  if (REVISION.test(shared ?? '')) return shared;
  const refs = await readBounded(await fetcher(`https://github.com/${REPO}.git/info/refs?service=git-upload-pack`, options()), 128 * 1024);
  const revision = refs.match(/([0-9a-f]{40}) refs\/heads\/main(?:\0|\n)/)?.[1];
  if (!revision) throw new Error('Published main revision unavailable');
  await cachePut(cache, key, revision, {seconds:REVISION_SECONDS, type:'text/plain'});
  return revision;
}

// Wraps a loader with the policy above: fresh for a minute, then served while a
// background refresh runs, for up to a day. The loader receives the copy it is
// replacing, so it can keep it when nothing changed. One wrapper lives at
// module scope in the Worker, so every request in an isolate shares it.
// Pass `waitUntil` (the request's ctx.waitUntil) so the Worker keeps a
// background refresh alive after the response has gone out.
export function cachedLoader(load = previous => loadArchive(fetch, {previous}), now = Date.now) {
  let entry = null;
  let pending = null;
  let retryAt = 0;
  const refresh = () => pending ??= Promise.resolve().then(() => load(entry?.value ?? null))
    .then(value => { entry = {value, at:now()}; retryAt = 0; return value; })
    .catch(error => { retryAt = now() + RETRY_MS; throw error; })
    .finally(() => { pending = null; });
  return async ({waitUntil} = {}) => {
    const age = entry ? now() - entry.at : Infinity;
    if (age < FRESH_MS) return entry.value;
    if (age < STALE_MS) {
      if (now() >= retryAt) {
        const background = refresh().catch(error => console.error(JSON.stringify({event:'background_refresh_failed', message:error.message})));
        waitUntil?.(background);
      }
      return entry.value;
    }
    try { return await refresh(); }
    catch (error) {
      if (entry && now() - entry.at < STALE_MS) return entry.value;
      throw error;
    }
  };
}

const posterUrl = poster => poster ? `${MEDIA_URL}/previews/${poster.split('/').pop()}` : null;
// Catalog watchUrls name the site host; the files are served from the media domain.
const videoUrl = url => url?.startsWith(`${SITE_URL}/assets/`) ? MEDIA_URL + url.slice(SITE_URL.length) : url;

// The agent-facing shape of one video. Popularity metrics stay on the website:
// references are chosen by fit, never by views.
export function record(archive, v) {
  return {
    id:v.id, slug:v.slug, title:v.title, brand:v.account,
    category:v.category,
    format:v.readmeCategory ? {id:v.readmeCategory, name:archive.formats.get(v.readmeCategory) ?? v.readmeCategory} : null,
    styles:v.styles, aspect_ratio:v.ratio ?? null,
    seconds:v.clipSeconds ?? v.originalSeconds ?? null,
    width:v.width ?? null, height:v.height ?? null, has_audio:v.hasAudio ?? null,
    posted:v.date ?? null,
    notes:v.notes ?? [],
    // Measured from every frame; kuchi_get_breakdown has the shot list.
    breakdown:breakdownSummary(archive, v.id),
    video_url:videoUrl(v.watchUrl), poster_url:posterUrl(v.poster),
    page_url:v.detailUrl ?? `${SITE_URL}/#video-${v.id}`,
    source_post:v.source
  };
}

const count = values => Object.entries(values.reduce((n, value) => (n[value] = (n[value] ?? 0) + 1, n), {}))
  .map(([value, videos]) => ({value, videos})).sort((a, b) => b.videos - a.videos || a.value.localeCompare(b.value));

export function filters(archive) {
  const v = archive.videos;
  return {
    total_videos:v.length,
    styles:count(v.flatMap(x => x.styles)),
    categories:count(v.map(x => x.category).filter(Boolean)),
    formats:[...archive.formats].map(([id, name]) => ({id, name, videos:v.filter(x => x.readmeCategory === id).length})),
    aspect_ratios:count(v.map(x => x.ratio).filter(Boolean)),
    paces:count(v.map(x => archive.breakdowns?.get(x.id)?.pace).filter(Boolean)),
    themes:count(v.map(x => archive.breakdowns?.get(x.id)?.theme).filter(Boolean)),
    // The kinds a shot is classified into, for an agent analysing a storyboard.
    shot_kinds:shotKinds()
  };
}

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

export function search(archive, args = {}) {
  const tokens = (args.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const rows = archive.videos.map(v => {
    const title = `${v.title} ${v.account}`.toLowerCase();
    const shots = [...(archive.labels?.get(v.id)?.shots.values() ?? [])];
    const text = `${title} ${v.category} ${v.readmeCategory} ${archive.formats.get(v.readmeCategory) ?? ''} ${v.styles.join(' ')} ${(v.notes ?? []).join(' ')} ${shots.map(l => `${SHOT_KINDS[l.kind].name} ${l.shows}`).join(' ')}`.toLowerCase();
    return {v, score:tokens.reduce((n, t) => n + (title.includes(t) ? 3 : text.includes(t) ? 1 : 0), 0)};
  }).filter(({v, score}) =>
    (!tokens.length || score > 0) &&
    (!args.style || v.styles.some(s => same(s, args.style))) &&
    (!args.category || same(v.category, args.category)) &&
    (!args.format || same(v.readmeCategory, args.format) || same(archive.formats.get(v.readmeCategory), args.format)) &&
    (!args.aspect_ratio || v.ratio === args.aspect_ratio) &&
    (!args.pace || archive.breakdowns?.get(v.id)?.pace === args.pace) &&
    (!args.theme || archive.breakdowns?.get(v.id)?.theme === args.theme) &&
    (!args.shot_kind || [...(archive.labels?.get(v.id)?.shots.values() ?? [])].some(l => l.kind === args.shot_kind)) &&
    (!args.max_seconds || (v.clipSeconds ?? v.originalSeconds ?? Infinity) <= args.max_seconds));
  rows.sort((a, b) => (args.sort === 'newest' ? String(b.v.date).localeCompare(String(a.v.date)) : b.score - a.score || String(b.v.date).localeCompare(String(a.v.date))) || a.v.id - b.v.id);
  const offset = args.offset ?? 0;
  const limit = args.limit ?? 6;
  const videos = rows.slice(offset, offset + limit).map(({v}) => record(archive, v));
  const next = offset + videos.length;
  return {total:rows.length, count:videos.length, offset, videos, has_more:rows.length > next, ...(rows.length > next ? {next_offset:next} : {})};
}

// Accepts an id ("34"), a slug, a Kuchi page link (#video-34) or the X post URL.
// A link may sit inside a pasted sentence, such as the website's remake brief.
export function findVideo(archive, reference) {
  const ref = String(reference).trim().replace(/\?.*$/, '').replace(/\/video\/\d+\/?$/, '').replace(/\/$/, '');
  const page = ref.match(/#video-(\d+)(?!\d)/)?.[1];
  const status = ref.match(/status\/(\d+)/)?.[1];
  return archive.videos.find(v => String(v.id) === (page ?? ref) || v.slug === ref || v.source === ref ||
    (status && status === v.source.match(/status\/(\d+)/)?.[1]));
}
