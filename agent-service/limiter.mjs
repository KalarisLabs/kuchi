// A strict per-client limit. Cloudflare's rate-limit binding is approximate
// (bursts pass before counters sync), so each client gets its own Durable Object
// with exact counts. One object per client: no global bottleneck.
//
// Two windows:
//   120 a minute   stops bursts; exact sliding window
//   1,500 an hour  stops a client that sits just under the minute limit all day
//
// Counts live in memory, and an idle object is dropped from memory after about
// 10 seconds. So counts are also saved to the object's storage: every
// SAVE_EVERY units and whenever a client is refused. A client that pauses to
// get its object dropped wins back at most SAVE_EVERY - 1 units. Saving is
// sparse on purpose (storage writes are metered), and a failed save never
// blocks a request.
export const LIMIT = 120;
export const WINDOW_MS = 60 * 1000;
export const HOUR_LIMIT = 1500;
export const HOUR_MS = 60 * 60 * 1000;
// One HTTP request can carry several JSON-RPC messages. Each one counts.
export const MAX_COST = 10;
export const SAVE_EVERY = 10;

export class IpRateLimiter {
  hits = [];            // one timestamp per unit in the last minute
  minutes = new Map();  // minute number -> units, for the last hour
  blocked = false;
  unsaved = 0;
  restored = null;
  cleanup = false;

  constructor(state) { this.storage = state?.storage ?? null; }

  // Records `cost` units and says whether the request is allowed.
  // `hour` is how many units the client has used in the last hour.
  hit(now = Date.now(), cost = 1) {
    cost = Math.min(MAX_COST, Math.max(1, Math.floor(cost) || 1));
    while (this.hits.length && this.hits[0] <= now - WINDOW_MS) this.hits.shift();
    const minute = Math.floor(now / WINDOW_MS);
    for (const key of this.minutes.keys()) if (key <= minute - 60) this.minutes.delete(key);
    let hour = 0;
    for (const units of this.minutes.values()) hour += units;

    let retryAfter = 0, window = null;
    if (this.hits.length + cost > LIMIT) {
      window = 'minute';
      // When enough of the oldest hits expire to fit this request.
      retryAfter = (this.hits[this.hits.length + cost - LIMIT - 1] + WINDOW_MS - now) / 1000;
    } else if (hour + cost > HOUR_LIMIT) {
      window = 'hour';
      retryAfter = ((Math.min(...this.minutes.keys()) + 61) * WINDOW_MS - now) / 1000;
    }
    if (window) {
      // `first` lets the caller log one event per blocked spell, not one per request.
      const first = !this.blocked;
      this.blocked = true;
      return {allowed:false, window, first, hour, retryAfter:Math.max(1, Math.ceil(retryAfter))};
    }
    this.blocked = false;
    for (let i = 0; i < cost; i++) this.hits.push(now);
    this.minutes.set(minute, (this.minutes.get(minute) ?? 0) + cost);
    this.unsaved += cost;
    return {allowed:true, hour:hour + cost};
  }

  async fetch(request) {
    await (this.restored ??= this.restore());
    const result = this.hit(Date.now(), Number(new URL(request.url ?? request).searchParams.get('cost')));
    if (this.unsaved >= SAVE_EVERY || (result.first && this.unsaved)) this.save();
    return Response.json(result);
  }

  // Reads back the counts saved before this object was last dropped from memory.
  async restore() {
    try {
      const saved = await this.storage?.get('counts');
      if (!saved) return;
      this.hits = saved.hits.filter(Number.isFinite).slice(-LIMIT);
      this.minutes = new Map(saved.minutes);
    } catch { /* Start from zero rather than refuse the client. */ }
  }

  save() {
    this.unsaved = 0;
    if (!this.storage) return;
    try {
      Promise.resolve(this.storage.put('counts', {hits:this.hits, minutes:[...this.minutes]})).catch(() => {});
      // One alarm per waking removes the counts once they are an hour old.
      if (!this.cleanup) { this.cleanup = true; Promise.resolve(this.storage.setAlarm(Date.now() + HOUR_MS + WINDOW_MS)).catch(() => {}); }
    } catch { /* Counting in memory still works. */ }
  }

  // Deletes a client's counts when it has been quiet for an hour.
  async alarm() {
    await (this.restored ??= this.restore());
    const latest = Math.max(-1, ...this.minutes.keys());
    if (latest >= Math.floor(Date.now() / WINDOW_MS) - 60) return this.storage.setAlarm((latest + 61) * WINDOW_MS);
    this.hits = [];
    this.minutes.clear();
    await this.storage.deleteAll();
  }
}

// The key a client is counted under. An IPv6 customer usually holds a whole /64
// and can change address on every request, so IPv6 is counted per /64.
export function clientKey(ip) {
  if (!ip) return 'unknown';
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = ip.includes('::') ? (tail ? tail.split(':') : []) : [];
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return groups.slice(0, 4).map(g => g.replace(/^0+(?=.)/, '')).join(':') + '::/64';
}

// Presents the Durable Object in the shape request-guard.mjs expects.
export const durableLimiter = namespace => ({
  async limit({key, cost = 1}) {
    const response = await namespace.get(namespace.idFromName(key)).fetch(`https://limiter/hit?cost=${cost}`);
    if (!response.ok) throw new Error('Limiter unavailable');
    const {allowed, retryAfter, window, first, hour} = await response.json();
    return {success:allowed, retryAfter, window, first, hour};
  }
});
