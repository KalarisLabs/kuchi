// The published Kuchi catalog: data/videos.json, agent/manifest.json and
// agent/workflow.md, read at one immutable commit of the public repository.
const REPO = 'kalarislabs/kuchi';
const SOURCE_PATHS = {catalog:'data/videos.json', manifest:'agent/manifest.json', workflow:'agent/workflow.md'};
export const SITE_URL = 'https://kuchi.kalarislabs.com';
export const MEDIA_URL = 'https://kuchi-media.kalarislabs.com';
// A fresh copy is fetched at most once a minute per isolate. If GitHub is
// unreachable, the last good copy keeps serving for up to a day.
export const FRESH_MS = 60 * 1000;
export const STALE_MS = 24 * 60 * 60 * 1000;

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
// read every file at that commit.
export async function loadArchive(fetcher = fetch) {
  const options = () => ({headers:{'User-Agent':'KuchiMCP/1.0'}, cache:'no-store', signal:AbortSignal.timeout(12000)});
  const refs = await readBounded(await fetcher(`https://github.com/${REPO}.git/info/refs?service=git-upload-pack`, options()), 128 * 1024);
  const sourceRevision = refs.match(/([0-9a-f]{40}) refs\/heads\/main(?:\0|\n)/)?.[1];
  if (!sourceRevision) throw new Error('Published main revision unavailable');
  // Raw files for a commit pushed seconds ago can briefly 404, so retry.
  const read = async (path, limit) => {
    for (let attempt = 0; ; attempt++) {
      try { return await readBounded(await fetcher(`https://raw.githubusercontent.com/${REPO}/${sourceRevision}/${path}`, options()), limit); }
      catch (error) { if (attempt >= 2) throw error; await new Promise(r => setTimeout(r, 750 * (attempt + 1))); }
    }
  };
  const raw = Object.fromEntries(await Promise.all(Object.entries(SOURCE_PATHS).map(async ([key, path]) =>
    [key, await read(path, key === 'catalog' ? 4 * 1024 * 1024 : 65536)])));
  const catalog = JSON.parse(raw.catalog);
  const videos = Array.isArray(catalog) ? catalog : catalog?.videos;
  const manifest = JSON.parse(raw.manifest);
  if (manifest.schemaVersion !== 1 || !Array.isArray(videos) || !videos.length || videos.length > 5000) throw new Error('Published archive schema unavailable');
  if (videos.some(v => !Number.isInteger(v.id) || !v.title || !v.source || !Array.isArray(v.styles))) throw new Error('Published catalog is invalid');
  const formats = new Map((manifest.formats ?? []).map(f => [f.id, f.name]));
  return {videos, manifest, formats, workflow:raw.workflow, sourceRevision, fetchedAt:new Date().toISOString()};
}

// Wraps a loader with the fresh/stale policy above. One wrapper lives at
// module scope in the Worker, so every request in an isolate shares it.
export function cachedLoader(load = loadArchive, now = Date.now) {
  let entry = null;
  let pending = null;
  return async () => {
    if (entry && now() - entry.at < FRESH_MS) return entry.value;
    pending ??= load().then(value => { entry = {value, at:now()}; return value; }).finally(() => { pending = null; });
    try { return await pending; }
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
    aspect_ratios:count(v.map(x => x.ratio).filter(Boolean))
  };
}

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

export function search(archive, args = {}) {
  const tokens = (args.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const rows = archive.videos.map(v => {
    const title = `${v.title} ${v.account}`.toLowerCase();
    const text = `${title} ${v.category} ${v.readmeCategory} ${archive.formats.get(v.readmeCategory) ?? ''} ${v.styles.join(' ')} ${(v.notes ?? []).join(' ')}`.toLowerCase();
    return {v, score:tokens.reduce((n, t) => n + (title.includes(t) ? 3 : text.includes(t) ? 1 : 0), 0)};
  }).filter(({v, score}) =>
    (!tokens.length || score > 0) &&
    (!args.style || v.styles.some(s => same(s, args.style))) &&
    (!args.category || same(v.category, args.category)) &&
    (!args.format || same(v.readmeCategory, args.format) || same(archive.formats.get(v.readmeCategory), args.format)) &&
    (!args.aspect_ratio || v.ratio === args.aspect_ratio) &&
    (!args.max_seconds || (v.clipSeconds ?? v.originalSeconds ?? Infinity) <= args.max_seconds));
  rows.sort((a, b) => (args.sort === 'newest' ? String(b.v.date).localeCompare(String(a.v.date)) : b.score - a.score || String(b.v.date).localeCompare(String(a.v.date))) || a.v.id - b.v.id);
  const offset = args.offset ?? 0;
  const limit = args.limit ?? 6;
  const videos = rows.slice(offset, offset + limit).map(({v}) => record(archive, v));
  const next = offset + videos.length;
  return {total:rows.length, count:videos.length, offset, videos, has_more:rows.length > next, ...(rows.length > next ? {next_offset:next} : {})};
}

// Accepts an id ("34"), a slug, a Kuchi page link (#video-34) or the X post URL.
export function findVideo(archive, reference) {
  const ref = String(reference).trim().replace(/\?.*$/, '').replace(/\/video\/\d+\/?$/, '').replace(/\/$/, '');
  const page = ref.match(/#video-(\d+)$/)?.[1];
  const status = ref.match(/status\/(\d+)/)?.[1];
  return archive.videos.find(v => String(v.id) === (page ?? ref) || v.slug === ref || v.source === ref ||
    (status && status === v.source.match(/status\/(\d+)/)?.[1]));
}
