// Catalog fields reach the page as links and attributes (gallery.js, /videos/<slug>), and
// data/videos.json is edited by hand in pull requests. Each field that becomes a URL or
// markup must keep its expected shape, so a bad entry fails CI before it deploys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { escapeHTML } from '../src/lib/format.js';
import { safeUrl } from '../src/lib/safe-url.js';

const data = JSON.parse(await readFile(new URL('../../data/videos.json', import.meta.url), 'utf8'));
const videos = Array.isArray(data) ? data : data.videos;

const SHAPES = {
  source: /^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,30}\/status\/[0-9]{1,25}$/,
  poster: /^previews\/[a-z0-9-]+\.jpg$/,
  slug: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  date: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  ratio: /^[0-9]{1,2}(\.[0-9]{1,3})?:[0-9]{1,2}$/,
};

test('catalog link and markup fields keep their expected shape', () => {
  for (const video of videos) {
    for (const [field, shape] of Object.entries(SHAPES)) {
      assert.match(String(video[field]), shape, `video ${video.id} has an unexpected ${field}`);
    }
    assert.ok(Number.isInteger(video.id), `video id ${video.id} is not an integer`);
  }
});

test('safeUrl lets only https links through', () => {
  assert.equal(safeUrl('https://x.com/a/status/1'), 'https://x.com/a/status/1');
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('JaVaScRiPt:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,x'), '#');
  assert.equal(safeUrl('not a url'), '#');
  assert.equal(escapeHTML(safeUrl('https://x.com/a"><img>')), 'https://x.com/a&quot;&gt;&lt;img&gt;');
});
