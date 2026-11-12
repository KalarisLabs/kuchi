import test from 'node:test';
import assert from 'node:assert/strict';
import {loadArchive, cachedLoader, FRESH_MS, STALE_MS} from '../catalog.mjs';

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

test('the cache refreshes after a minute and serves the last good copy if GitHub fails', async () => {
  let clock = 0, calls = 0, fail = false;
  const load = cachedLoader(async () => { calls++; if (fail) throw new Error('down'); return {n:calls}; }, () => clock);
  assert.deepEqual(await load(), {n:1});
  assert.deepEqual(await load(), {n:1});
  assert.equal(calls, 1);
  clock += FRESH_MS;
  assert.deepEqual(await load(), {n:2});
  fail = true; clock += FRESH_MS;
  assert.deepEqual(await load(), {n:2});
  clock += STALE_MS;
  await assert.rejects(load(), /down/);
});

test('concurrent requests share one upstream load', async () => {
  let calls = 0;
  const load = cachedLoader(async () => { calls++; await new Promise(r => setTimeout(r, 10)); return {}; });
  await Promise.all([load(), load(), load()]);
  assert.equal(calls, 1);
});
