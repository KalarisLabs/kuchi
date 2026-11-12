// A strict per-IP limit. Cloudflare's rate-limit binding is approximate (bursts
// pass before counters sync), so each IP gets its own Durable Object holding
// exact timestamps for a sliding window. One object per IP: no global bottleneck.
// Counts live in memory; if an idle object is evicted, its window starts over.
export const LIMIT = 120;
export const WINDOW_MS = 60 * 1000;

export class IpRateLimiter {
  hits = [];

  // Records one request and says whether it is allowed.
  hit(now = Date.now()) {
    while (this.hits.length && this.hits[0] <= now - WINDOW_MS) this.hits.shift();
    if (this.hits.length >= LIMIT) return {allowed:false, retryAfter:Math.max(1, Math.ceil((this.hits[0] + WINDOW_MS - now) / 1000))};
    this.hits.push(now);
    return {allowed:true};
  }

  async fetch() { return Response.json(this.hit()); }
}

// Presents the Durable Object in the shape request-guard.mjs expects.
export const durableLimiter = namespace => ({
  async limit({key}) {
    const response = await namespace.get(namespace.idFromName(key)).fetch('https://limiter/hit');
    if (!response.ok) throw new Error('Limiter unavailable');
    const {allowed, retryAfter} = await response.json();
    return {success:allowed, retryAfter};
  }
});
