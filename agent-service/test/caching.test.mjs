import test from 'node:test';
import assert from 'node:assert/strict';
import {SizedLru, singleFlight, cacheKey, CACHE_ORIGIN} from '../cache.mjs';
import {sheetReader, MAX_SHEET_BYTES} from '../sheets.mjs';
import {componentRegistry, loadIndex} from '../components.mjs';
import {FRESH_MS} from '../catalog.mjs';
import worker from '../worker.mjs';

const fakeCache = () => {
  const store = new Map();
  return {store, match:async k => store.get(String(k))?.clone(), put:async (k, r) => { store.set(String(k), r); }};
};
const SHEET = 'https://kuchi-media.kalarislabs.com/frames/07/overview.jpg';

test('memory is bounded by size and evicts the least recently used entry', () => {
  const lru = new SizedLru(10);
  lru.set('a', 'A', 4); lru.set('b', 'B', 4);
  lru.get('a');
  lru.set('c', 'C', 4);
  assert.deepEqual([lru.get('a'), lru.get('b'), lru.get('c')], ['A', undefined, 'C']);
  lru.set('huge', 'X', 11);
  assert.equal(lru.get('huge'), undefined, 'an entry larger than the budget is never kept');
});

test('simultaneous reads of one key share a single read', async () => {
  const once = singleFlight();
  let reads = 0;
  const read = async () => { reads++; await new Promise(r => setTimeout(r, 5)); return reads; };
  assert.deepEqual(await Promise.all([once('k', read), once('k', read), once('k', read)]), [1, 1, 1]);
  assert.equal(await once('k', read), 2, 'a later read goes to origin again');
});

test('cache keys sit under a path no route serves', () => {
  assert.equal(cacheKey('sheet', 'abc', 'frames/01/overview.jpg'), `${CACHE_ORIGIN}/sheet/abc/frames%2F01%2Foverview.jpg`);
});

test('a storyboard sheet is read from R2 once, then served from memory or the location cache', async () => {
  let gets = 0;
  const media = {get:async () => { gets++; await new Promise(r => setTimeout(r, 5)); return {size:3, arrayBuffer:async () => new Uint8Array([1, 2, 3]).buffer}; }};
  const edge = fakeCache();
  const read = sheetReader({cache:() => edge});
  const writes = [];
  const results = await Promise.all(Array.from({length:5}, () => read(media, SHEET, {revision:'r1', waitUntil:p => writes.push(p)})));
  assert.deepEqual(new Set(results), new Set(['AQID']));
  assert.equal(gets, 1, 'five simultaneous agents cost one R2 read');
  await Promise.all(writes);
  assert.equal(await read(media, SHEET, {revision:'r1'}), 'AQID');
  assert.equal(gets, 1, 'memory serves the next call');

  // Another isolate in the same location: empty memory, shared location cache.
  const other = sheetReader({cache:() => edge});
  assert.equal(await other(null, SHEET, {revision:'r1'}), 'AQID', 'no R2 binding needed on a location-cache hit');
  assert.equal(gets, 1);

  // A new catalog commit can redraw a sheet, so it is read again.
  await read(media, SHEET, {revision:'r2'});
  assert.equal(gets, 2);
});

test('a sheet that is missing, oversized or failing gives null and is not remembered', async () => {
  const read = sheetReader({cache:() => null});
  assert.equal(await read(null, SHEET), null);
  assert.equal(await read({get:async () => null}, SHEET), null);
  assert.equal(await read({get:async () => ({size:MAX_SHEET_BYTES + 1})}, SHEET), null);
  assert.equal(await read({get:async () => { throw new Error('R2 down'); }}, SHEET), null);
  assert.equal(await read({get:async () => ({size:1, arrayBuffer:async () => new Uint8Array([7]).buffer})}, SHEET), 'Bw==');
});

test('an unchanged component registry is revalidated with a 304 and not parsed again', async () => {
  const etag = '"v1"';
  const seen = [];
  const body = {items:[{name:'text-reveal', title:'Text Reveal', description:'d', categories:['text'], files:[]}]};
  const fetcher = async (url, init) => {
    seen.push(init.headers['If-None-Match'] ?? null);
    if (init.headers['If-None-Match'] === etag) return new Response(null, {status:304});
    return new Response(JSON.stringify(body), {headers:{ETag:etag}});
  };
  const first = await loadIndex(fetcher);
  assert.equal(first.etag, etag);
  assert.equal(await loadIndex(fetcher, first), first, 'a 304 keeps the copy in memory');
  assert.deepEqual(seen, [null, etag]);

  let clock = 0;
  const registry = componentRegistry({fetcher, now:() => clock});
  await registry.index();
  clock += FRESH_MS;
  const background = [];
  await registry.index({waitUntil:p => background.push(p)});
  await Promise.all(background);
  assert.equal(background.length, 1, 'a stale registry is revalidated in the background');
});

test('the HTTP mirror sends an ETag, caches for a minute and answers a matching If-None-Match with 304', async () => {
  const env = {ARCHIVE_REQUEST_LIMITER:{limit:async () => ({success:true})}};
  const ctx = {waitUntil() {}};
  const url = 'https://kuchi.kalarislabs.com/agent/SKILL.md';
  const first = await worker.fetch(new Request(url), env, ctx);
  assert.equal(first.status, 200);
  assert.match(first.headers.get('cache-control'), /public, max-age=60/);
  const etag = first.headers.get('etag');
  assert.match(etag, /^W\/"[0-9a-f]+"$/);
  const again = await worker.fetch(new Request(url, {headers:{'If-None-Match':etag}}), env, ctx);
  assert.equal(again.status, 304);
  assert.equal(await again.text(), '');
  const strong = await worker.fetch(new Request(url, {headers:{'If-None-Match':etag.slice(2)}}), env, ctx);
  assert.equal(strong.status, 304, 'the tag matches with or without W/');
  const list = await worker.fetch(new Request(url, {headers:{'If-None-Match':`"other", ${etag}`}}), env, ctx);
  assert.equal(list.status, 304, 'a list of tags matches when any one does');
  const other = await worker.fetch(new Request(url, {headers:{'If-None-Match':'"stale"'}}), env, ctx);
  assert.equal(other.status, 200);
});

test('the mirror ETag depends on the commit, not on bytes that differ between isolates', async () => {
  // Two isolates load the same commit at different times, so catalog.json's
  // fetched_at differs. A fresh module instance stands in for a second isolate.
  const env = {ARCHIVE_REQUEST_LIMITER:{limit:async () => ({success:true})}};
  const ctx = {waitUntil() {}};
  const url = 'https://kuchi.kalarislabs.com/agent/SKILL.md';
  const second = (await import(`../worker.mjs?isolate=${Date.now()}`)).default;
  const a = await worker.fetch(new Request(url), env, ctx);
  const b = await second.fetch(new Request(url), env, ctx);
  assert.equal(a.headers.get('etag'), b.headers.get('etag'));
});
