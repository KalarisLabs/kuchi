import test from 'node:test';
import assert from 'node:assert/strict';
import {loadArchive, cachedLoader, FRESH_MS, STALE_MS, RETRY_MS} from '../catalog.mjs';

test('loadArchive reads every file at the resolved main commit', async () => {
  const urls = [];
  const fetcher = async url => {
    urls.push(url);
    if (url.includes('info/refs')) return new Response(`003f${'c'.repeat(40)} refs/heads/main\n`);
    if (url.endsWith('videos.json')) return Response.json([{id:1, title:'A', source:'https://x.com/a/status/1', styles:['UI motion'], readmeCategory:'f'}]);
    if (url.endsWith('manifest.json')) return Response.json({schemaVersion:1, formats:[{id:'f', name:'Format F'}]});
    return new Response('# workflow');
  };
  const archive = await loadArchive(fetcher);
  assert.equal(archive.sourceRevision, 'c'.repeat(40));
  assert.equal(archive.formats.get('f'), 'Format F');
  assert.ok(urls.slice(1).every(u => u.includes(`/${'c'.repeat(40)}/`)));
  await assert.rejects(loadArchive(async url => url.includes('info/refs') ? new Response(`003f${'c'.repeat(40)} refs/heads/main\n`) : Response.json({schemaVersion:2})));
});

test('a stale copy is served at once while one background refresh replaces it, for up to a day', async () => {
  let clock = 0, calls = 0, fail = false;
  const background = [];
  const load = cachedLoader(async previous => { calls++; if (fail) throw new Error('down'); return {n:calls, previous:previous?.n ?? null}; }, () => clock);
  assert.deepEqual(await load(), {n:1, previous:null});
  assert.deepEqual(await load(), {n:1, previous:null});
  assert.equal(calls, 1);
  clock += FRESH_MS;
  // Stale: the caller gets the copy in memory without waiting, and the refresh is handed to waitUntil.
  assert.deepEqual(await load({waitUntil:p => background.push(p)}), {n:1, previous:null});
  assert.equal(background.length, 1);
  await Promise.all(background);
  assert.deepEqual(await load(), {n:2, previous:1}, 'the loader is given the copy it replaces');
  fail = true; clock += FRESH_MS;
  assert.deepEqual(await load(), {n:2, previous:1});
  await new Promise(r => setTimeout(r, 0));
  // A failed refresh is not retried on every request.
  const before = calls;
  await load(); await load();
  assert.equal(calls, before);
  clock += RETRY_MS;
  await load(); await new Promise(r => setTimeout(r, 0));
  assert.equal(calls, before + 1);
  clock += STALE_MS;
  await assert.rejects(load(), /down/);
});

test('an unchanged main commit downloads nothing, and files at a commit come from the location cache', async () => {
  const rev = 'd'.repeat(40);
  const urls = [];
  const fetcher = async url => {
    urls.push(url);
    if (url.includes('info/refs')) return new Response(`003f${rev} refs/heads/main
`);
    if (url.endsWith('videos.json')) return Response.json([{id:1, title:'A', source:'https://x.com/a/status/1', styles:['UI motion']}]);
    if (url.endsWith('manifest.json')) return Response.json({schemaVersion:1, formats:[]});
    return new Response('# workflow');
  };
  const first = await loadArchive(fetcher, {cache:null});
  urls.length = 0;
  assert.equal(await loadArchive(fetcher, {previous:first, cache:null}), first);
  assert.deepEqual(urls.map(u => new URL(u).hostname), ['github.com'], 'only the commit is checked');

  // A new isolate in the same location reads the files from the location cache, not GitHub.
  const store = new Map();
  const cache = {match:async k => store.get(String(k))?.clone(), put:async (k, r) => { store.set(String(k), r); }};
  await loadArchive(fetcher, {cache});
  urls.length = 0;
  const fresh = await loadArchive(fetcher, {cache});
  assert.equal(fresh.sourceRevision, rev);
  assert.deepEqual(urls, [], 'the commit and every file came from the location cache');
});

test('concurrent requests share one upstream load', async () => {
  let calls = 0;
  const load = cachedLoader(async () => { calls++; await new Promise(r => setTimeout(r, 10)); return {}; });
  await Promise.all([load(), load(), load()]);
  assert.equal(calls, 1);
});
