// Storyboard sheets attached to kuchi_get_breakdown as images. A popular
// reference is studied by many agents, so a sheet is read from R2 once and then
// served from memory (already base64-encoded) or this location's cache.
// Agents that read sheet links fetch them from the media domain, where the CDN
// caches them; this path is only for the inline image.
import {edgeCache, cacheKey, cacheGet, cachePut, SizedLru, singleFlight} from './cache.mjs';

// Storyboard sheets are a few hundred KB. Anything much larger is not one.
export const MAX_SHEET_BYTES = 1536 * 1024;
// About 40 sheets per isolate.
export const SHEET_MEMORY_BYTES = 16 * 1024 * 1024;
const SHEET_SECONDS = 24 * 60 * 60;

// Returns read(media, url, {revision, waitUntil}) -> base64 or null. `revision`
// is the catalog commit: a sheet redrawn by a later analysis gets a new key.
// Null when the sheet can't be read, so the caller can fall back to the link.
export function sheetReader({maxBytes = SHEET_MEMORY_BYTES, cache = edgeCache} = {}) {
  const memory = new SizedLru(maxBytes);
  const once = singleFlight();
  return (media, url, {revision = '', waitUntil} = {}) => {
    const path = new URL(url).pathname.slice(1);
    const key = `${revision}/${path}`;
    const held = memory.get(key);
    if (held) return Promise.resolve(held);
    return once(key, async () => {
      const store = cache();
      const edgeKey = cacheKey('sheet', revision, path);
      let bytes = null;
      const hit = await cacheGet(store, edgeKey);
      if (hit) bytes = await hit.arrayBuffer().catch(() => null);
      if (!bytes) {
        if (!media) return null;
        const object = await media.get(path);
        if (!object || object.size > MAX_SHEET_BYTES) return null;
        bytes = await object.arrayBuffer();
        await cachePut(store, edgeKey, bytes, {seconds:SHEET_SECONDS, type:'image/jpeg', waitUntil});
      }
      if (bytes.byteLength > MAX_SHEET_BYTES) return null;
      const base64 = Buffer.from(bytes).toString('base64');
      memory.set(key, base64, base64.length);
      return base64;
    }).catch(() => null);
  };
}
