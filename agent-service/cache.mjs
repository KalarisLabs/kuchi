// How Kuchi avoids fetching the same thing twice. Every read goes through up to
// three layers, cheapest first:
//
//   1. isolate memory   free; shared by every request this isolate serves
//   2. location cache   Cloudflare's Cache API (caches.default), shared by every
//                       isolate in one Cloudflare location
//   3. origin           R2, GitHub or the site's registry: paid, slow, rate-limited
//
// Callers asking for the same key at the same time share one read (`inflight`),
// so a burst of agents studying one reference costs a single origin read.
//
// Keys at layer 2 live under CACHE_ORIGIN, a path no route serves, so they never
// collide with what the CDN caches for real URLs.
export const CACHE_ORIGIN = 'https://kuchi.kalarislabs.com/__kuchi_cache';

// The location cache, or null where there is none (Node tests, local dev without it).
export const edgeCache = () => globalThis.caches?.default ?? null;

export const cacheKey = (...parts) => `${CACHE_ORIGIN}/${parts.map(p => encodeURIComponent(String(p))).join('/')}`;

// Reads one key from the location cache. A cache fault is a miss, never an error.
export async function cacheGet(cache, key) {
  if (!cache) return null;
  try {
    const hit = await cache.match(key);
    return hit?.ok ? hit : null;
  } catch { return null; }
}

// Stores a body for `seconds`. `waitUntil` lets the response go out first; without
// it the write is awaited. A failed write is ignored: the next request reads origin.
export async function cachePut(cache, key, body, {seconds, type = 'application/octet-stream', waitUntil} = {}) {
  if (!cache) return;
  const write = Promise.resolve().then(() => cache.put(key, new Response(body, {headers:{'Content-Type':type, 'Cache-Control':`public, max-age=${seconds}`}}))).catch(() => {});
  if (waitUntil) waitUntil(write); else await write;
}

// Least-recently-used memory bounded by total size, so a few large entries
// can't crowd out the isolate's 128 MB.
export class SizedLru {
  constructor(maxBytes) { this.maxBytes = maxBytes; this.bytes = 0; this.map = new Map(); }
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    this.map.delete(key); this.map.set(key, entry);
    return entry.value;
  }
  set(key, value, size) {
    if (size > this.maxBytes) return;
    if (this.map.has(key)) { this.bytes -= this.map.get(key).size; this.map.delete(key); }
    this.map.set(key, {value, size});
    this.bytes += size;
    for (const [k, e] of this.map) {
      if (this.bytes <= this.maxBytes) break;
      this.map.delete(k); this.bytes -= e.size;
    }
  }
  get size() { return this.map.size; }
}

// One read per key at a time: later callers wait for the first one's result.
export function singleFlight() {
  const inflight = new Map();
  return (key, read) => {
    if (inflight.has(key)) return inflight.get(key);
    const pending = Promise.resolve().then(read).finally(() => inflight.delete(key));
    inflight.set(key, pending);
    return pending;
  };
}
