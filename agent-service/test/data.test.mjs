// Checks the published breakdowns and shot labels against the catalog, so a
// bad measurement or a mistyped label can't reach agents.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SHOT_KINDS, LEGEND, signature, indexBreakdowns} from '../breakdown.mjs';

const read = async path => JSON.parse(await readFile(new URL(`../../data/${path}`, import.meta.url), 'utf8'));
const videos = await read('videos.json');
const breakdowns = await read('breakdowns.json');
const labels = await read('shot_labels.json');
const close = (a, b, tolerance = 0.002) => Math.abs(a - b) <= tolerance;

test('every catalog video has one measured breakdown', () => {
  assert.deepEqual(breakdowns.map(b => b.id).sort((a, b) => a - b), videos.map(v => v.id).sort((a, b) => a - b));
  assert.equal(indexBreakdowns(breakdowns, labels).breakdowns.size, videos.length, 'the server accepts every breakdown');
});

test('shots cover every frame exactly once and every label is from a closed set', () => {
  for (const b of breakdowns) {
    const at = `video ${b.id}`;
    assert.ok(b.fps > 0 && b.frames > 0, at);
    assert.ok(close(b.seconds, b.frames / b.fps), `${at}: seconds match frames / fps`);
    assert.ok(Object.hasOwn(LEGEND.pace, b.pace) && ['dark', 'light', 'mixed'].includes(b.theme), at);
    assert.equal(b.shot_changes, b.shots.length - 1, at);
    assert.equal(b.motion_per_second.length, Math.ceil(b.seconds), at);
    assert.match(b.motion_per_second, /^[0-9]+$/, at);
    if (b.loudness_per_second) assert.match(b.loudness_per_second, /^[0-9]+$/, at);
    b.shots.forEach((s, i) => {
      const shot = `${at} shot ${s.n}`;
      assert.equal(s.n, i + 1, shot);
      assert.equal(s.start_frame, i ? b.shots[i - 1].end_frame + 1 : 0, `${shot}: starts where the last one ended`);
      assert.ok(s.end_frame >= s.start_frame, shot);
      assert.ok(close(s.start_s, s.start_frame / b.fps) && close(s.end_s, (s.end_frame + 1) / b.fps), `${shot}: seconds match frames`);
      assert.ok(Object.hasOwn(LEGEND.enters, s.enters), `${shot}: enters ${s.enters}`);
      assert.equal(s.enters === 'start', i === 0, shot);
      assert.ok(Object.hasOwn(LEGEND.motion, s.motion) && ['dark', 'mid', 'light'].includes(s.tone), shot);
      assert.ok(s.palette.length && s.palette.every(([hex, share]) => /^#[0-9a-f]{6}$/.test(hex) && share > 0 && share <= 100), shot);
    });
    assert.equal(b.shots.at(-1).end_frame, b.frames - 1, `${at}: the last shot ends on the last frame`);
    assert.equal(b.sheets[0].kind, 'overview', at);
    for (const sheet of b.sheets) {
      assert.match(sheet.file, new RegExp(`^frames/${String(b.id).padStart(2, '0')}/(overview|detail-\\d+)\\.jpg$`), at);
      for (const [t, n] of sheet.cells) {
        const s = b.shots[n - 1];
        assert.ok(s && t >= s.start_s - 0.01 && t <= s.end_s + 0.01, `${at}: storyboard frame at ${t}s is inside shot ${n}`);
      }
    }
  }
});

test('shot labels name real shots, use known kinds and match the current measurement', () => {
  const byId = new Map(breakdowns.map(b => [String(b.id), b]));
  for (const [id, entry] of Object.entries(labels)) {
    const b = byId.get(id);
    assert.ok(b, `labels for unknown video ${id}`);
    assert.equal(entry.measured, signature(b), `video ${id}: labels were written against an older measurement; review them and update "measured"`);
    assert.match(entry.reviewed, /^\d{4}-\d{2}-\d{2}$/, `video ${id}`);
    for (const [n, [kind, shows]] of Object.entries(entry.shots)) {
      assert.ok(b.shots[Number(n) - 1], `video ${id}: no shot ${n}`);
      assert.ok(Object.hasOwn(SHOT_KINDS, kind), `video ${id} shot ${n}: unknown kind "${kind}"`);
      assert.ok(typeof shows === 'string' && shows.length >= 8 && shows.length <= 200, `video ${id} shot ${n}: description length`);
    }
  }
});
