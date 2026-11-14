// The ported browser scripts, checked without a browser.
// Run from web/: npm test   (needs --experimental-vm-modules, set in package.json)
//
// Two kinds of checks:
//   1. Behaviour: the gallery and connect scripts still boot against the element ids
//      the Astro components render, even when analytics fails to load.
//   2. Drift: until the old site (../site) is retired it stays the reference. If one
//      of its scripts changes, these tests fail so the change gets ported here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, createContext } from 'node:vm';

const scripts = new URL('../src/scripts/', import.meta.url);
const reference = new URL('../../site/', import.meta.url);
const read = (base, file) => readFile(new URL(file, base), 'utf8');
const lines = (text) => text.replace(/\r\n/g, '\n').split('\n');

async function boot(file) {
  const nodes = new Map();
  function node(selector) {
    const key = selector.startsWith('#') ? selector.slice(1) : selector;
    if (!nodes.has(key)) nodes.set(key, { value: key === 'search' ? '' : key === 'sort' ? 'impressions' : 'all', dataset: {}, innerHTML: '', textContent: '', classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, setAttribute() {}, pause() {} });
    return nodes.get(key);
  }
  const video = { id: 3, title: 'Test reference', account: 'test', date: '2026-11-09', category: 'Demo', styles: ['UI motion'], notes: [], originalNotes: [], video: 'https://kuchi.kalarislabs.com/assets/03.mp4', poster: 'https://example.com/poster.jpg', clipSeconds: 12, originalSeconds: 12, impressions: 1 };
  const context = createContext({
    document: { querySelector: node, getElementById: (id) => node('#' + id), querySelectorAll: () => [], addEventListener() {} },
    location: { href: 'https://kuchi.kalarislabs.com/', hash: '' }, URL, URLSearchParams, setTimeout, clearTimeout, console,
    fetch: async (url) => ({ ok: true, json: async () => (url === 'videos.json' ? [video] : { timeZone: 'America/Los_Angeles', snapshots: [] }) }),
  });
  // Analytics is only ever imported dynamically; make that fail, as an ad blocker would.
  const failAnalytics = async () => { throw new Error('Analytics module 404 (regression fixture)'); };
  const load = async (url) => new SourceTextModule(await readFile(url, 'utf8'), { context, identifier: url.href, importModuleDynamically: failAnalytics });
  const module = await load(new URL(file, scripts));
  await module.link((specifier, referencing) => load(new URL(specifier, referencing.identifier)));
  await module.evaluate();
  for (let i = 0; i < 6; i++) await new Promise((resolve) => setImmediate(resolve));
  return nodes;
}

test('video collection renders when the analytics module is missing', async () => {
  const nodes = await boot('gallery.js');
  assert.match(nodes.get('collection').innerHTML, /Test reference/);
  assert.match(nodes.get('collection').innerHTML, /video-card/);
  assert.equal(nodes.get('total-videos').textContent, 1);
});

test('desktop quick connect still initializes when analytics is missing', async () => {
  const nodes = await boot('connect.js');
  assert.match(nodes.get('[data-client="claude"]').href, /^claude:\/\/claude.ai\/new\?/);
  assert.match(nodes.get('[data-client="claude-code"]').href, /^claude:\/\/code\/new\?/);
  assert.match(nodes.get('[data-client="codex"]').href, /^codex:\/\/new\?/);
});

const PORT_ME = 'changed in ../site: port the change into web/src/scripts, then update this test.';

for (const file of ['analytics.mjs', 'analytics-events.mjs', 'daily-stats.mjs']) {
  test(`${file} is identical to the reference site (privacy rules must not drift)`, async () => {
    assert.equal(await read(scripts, file), await read(reference, file), `${file} ${PORT_ME}`);
  });
}

test('connect.js matches the reference site apart from its header comment', async () => {
  const ported = lines(await read(scripts, 'connect.js')).slice(2); // two comment lines replace 'use strict'
  const original = lines(await read(reference, 'connect.js')).slice(1);
  assert.deepEqual(ported, original, `connect.js ${PORT_ME}`);
});

test('gallery.js matches the reference app.js apart from the shared formatting helpers', async () => {
  const ported = lines(await read(scripts, 'gallery.js'));
  const original = lines(await read(reference, 'app.js'));
  // Reference: 'use strict', the daily-stats import, two telemetry lines, a blank line, `$`,
  // ten lines of helpers (now in src/lib/format.js), then the rest.
  assert.deepEqual(ported.slice(7, 11), original.slice(2, 6), `app.js ${PORT_ME}`);
  assert.deepEqual(ported.slice(11), original.slice(16), `app.js ${PORT_ME}`);
});

test('the shared formatting helpers are the ones the reference app.js defines', async () => {
  const helpers = lines(await read(new URL('../src/lib/', import.meta.url), 'format.js')).filter((line) => !line.startsWith('//')).map((line) => line.replace(/^export /, ''));
  const original = lines(await read(reference, 'app.js')).slice(6, 16);
  assert.deepEqual(helpers.filter(Boolean), original, `app.js ${PORT_ME}`);
});
