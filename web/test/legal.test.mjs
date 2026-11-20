// The legal pages and the analytics switch (2026-11-20).
// Run from web/: npm run build && npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const web = new URL('../', import.meta.url);
const dist = new URL('dist/client/', web);
const read = (file) => readFile(new URL(file, dist), 'utf8');
const exists = (url) => access(url).then(() => true, () => false);
const { PREFERENCE_KEY, readPreference, analyticsAllowed } = await import(new URL('src/scripts/analytics-events.mjs', web));
const analytics = await import(new URL('src/scripts/analytics.mjs', web));

const storage = (value) => ({ getItem: (key) => (key === PREFERENCE_KEY ? value : null) });
const throwing = { getItem() { throw new Error('SecurityError'); } };

test('the preference reads "off" only when the switch stored it, and never throws', () => {
  assert.equal(PREFERENCE_KEY, 'kuchi-analytics');
  assert.equal(readPreference(storage('off')), 'off');
  assert.equal(readPreference(storage(null)), 'on');
  assert.equal(readPreference(storage('yes')), 'on');
  assert.equal(readPreference(null), 'on');
  assert.equal(readPreference(throwing), 'on');
  assert.equal(analytics.PREFERENCE_KEY, PREFERENCE_KEY, 'analytics.mjs reads the key the page writes');
});

test('Do Not Track, Global Privacy Control and the switch each turn analytics off', () => {
  assert.equal(analyticsAllowed({}, 'on'), true);
  assert.equal(analyticsAllowed({}, 'off'), false);
  assert.equal(analyticsAllowed({ globalPrivacyControl: true }, 'on'), false);
  assert.equal(analyticsAllowed({ doNotTrack: '1' }, 'on'), false);
  assert.equal(analyticsAllowed({ doNotTrack: '0' }), true);
});

function fakeClient() {
  const client = { sent: [], options: null };
  client.init = (_token, options) => { client.options = options; };
  client.capture = (name) => { client.sent.push(name); };
  return client;
}
const config = { token: 'phc_test', api_host: '/relay', ui_host: 'https://us.posthog.com' };

test('when switched off, analytics loads nothing and sends nothing', async () => {
  let loaded = 0;
  const client = fakeClient();
  const a = analytics.createAnalytics({ privacy: {}, preference: () => 'off', config, loadScript: async () => { loaded++; }, getClient: () => client });
  assert.equal(await a.ready, null);
  assert.equal(await a.track('reference_opened', { reference_id: '3' }), false);
  assert.equal(loaded, 0, 'the PostHog script must not be requested');
  assert.deepEqual(client.sent, []);
});

test('switching off after load stops custom and automatic events at once', async () => {
  let preference = 'on';
  const client = fakeClient();
  const a = analytics.createAnalytics({ privacy: {}, preference: () => preference, config, loadScript: async () => {}, getClient: () => client });
  assert.equal(await a.ready, client);
  assert.equal(await a.track('reference_opened', { reference_id: '3' }), true);
  assert.ok(client.options.before_send({ event: '$pageview', properties: {} }), 'events pass while on');
  preference = 'off';
  assert.equal(await a.track('reference_opened', { reference_id: '3' }), false);
  assert.equal(client.options.before_send({ event: '$autocapture', properties: {} }), null, 'automatic events are dropped too');
  assert.deepEqual(client.sent, ['reference_opened']);
  // A preference that cannot be read never lets analytics through by accident.
  const b = analytics.createAnalytics({ privacy: {}, preference: () => { throw new Error('boom'); }, config, loadScript: async () => {}, getClient: fakeClient });
  assert.equal(await b.ready, null);
});

test('the privacy guarantees still hold in the event options', () => {
  const options = analytics.initOptions(config, false);
  assert.equal(options.persistence, 'memory');
  assert.equal(options.disable_session_recording, true);
  const event = options.before_send({ event: '$pageview', properties: { $ip: '203.0.113.9' } });
  assert.equal(event.properties.$ip, null);
  assert.equal(event.properties.$geoip_disable, true);
});

test('the analytics preferences page is static, has a real switch and loads no analytics', async () => {
  const html = await read('analytics-preferences.html');
  assert.match(html, /<button[^>]*role="switch"[^>]*aria-checked="true"[^>]*data-analytics-switch/);
  assert.match(html, /<code[^>]*>kuchi-analytics<\/code>/, 'the page names the stored key');
  assert.ok(!html.includes('/relay/config'), 'the preferences page must not start analytics');
  assert.match(html, /<link rel="canonical" href="https:\/\/kuchi\.kalarislabs\.com\/analytics-preferences">/);
});

const PAGES = [
  ['privacy.html', '/privacy', 'WebPage', 'Kuchi privacy'],
  ['terms.html', '/terms', 'WebPage', 'Kuchi terms'],
  ['legal.html', '/legal', 'AboutPage', 'Kuchi legal notice'],
  ['analytics-preferences.html', '/analytics-preferences', 'WebPage', 'Analytics preferences'],
];

for (const [file, path, type, heading] of PAGES) {
  test(`${file}: prerendered, linkable sections, table of contents, JSON-LD, dated`, async () => {
    const html = await read(file);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}</h1>`), 'heading');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://kuchi\\.kalarislabs\\.com${path}">`));
    assert.match(html, /<meta name="description" content="[^"]{80,}"/);
    assert.match(html, /Last updated: <time datetime="2026-11-20"[^>]*>/);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(ld['@type'], type);
    assert.equal(ld.dateModified, '2026-11-20');
    assert.equal(ld.publisher.name, 'Kalaris Labs');
    const toc = [...html.match(/<nav class="legal-toc[\s\S]*?<\/nav>/)[0].matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]);
    assert.ok(toc.length >= 5, 'table of contents');
    for (const id of toc) assert.match(html, new RegExp(`<h2 id="${id}"`), `${file}: #${id} has no section`);
  });
}

test('the privacy policy keeps every guarantee and the required sections', async () => {
  const text = (await read('privacy.html')).replace(/<[^>]+>/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, ' ');
  for (const promise of [
    'Kuchi has no accounts and no sign-in.',
    'Kuchi uses them to answer that one request and does not store them or send them to analytics.',
    'Nothing is stored in your browser for this: no cookies and no local storage',
    'Your IP address is used to deliver the request and is not saved with the event',
    'Analytics are switched off completely when your browser sends Do Not Track or Global Privacy Control.',
    'We do not record your product details, the plans Kuchi returns, or IP addresses.',
    'deleted after about an hour without requests',
    'We do not sell personal information',
    'Data Protection Board of India',
    'Grievance officer',
    'Nomination',
    'within 72 hours',
  ]) assert.ok(text.includes(promise), `privacy.html lost: ${promise}`);
  for (const id of ['who-we-are', 'categories', 'purposes', 'retention', 'processors', 'transfers', 'children', 'rights', 'grievance', 'changes']) {
    assert.match(await read('privacy.html'), new RegExp(`<h2 id="${id}"`));
  }
});

test('owner rules hold on the legal pages: free, no licence or library names, no GitHub buttons', async () => {
  for (const [file] of PAGES) {
    const html = await read(file);
    // The page's own content; the shared header and footer are checked elsewhere.
    const text = html.match(/<main[\s\S]*<\/main>/)[0].replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
    assert.ok(!/\bMIT\b|open[- ]source licen[cs]e|Epidemic Sound|remotion|snap-?cn|remocn|shadcn/i.test(text), `${file} names a licence or library`);
    assert.ok(!/pricing|\bpaid tier|\bpro plan|for now\b|free trial/i.test(text), `${file} implies a paid tier`);
    assert.ok(!/href="https:\/\/github\.com/.test(html.match(/<main[\s\S]*<\/main>/)[0]), `${file} links GitHub`);
    assert.ok(!/curl |Invoke-WebRequest/.test(text), `${file} has a shell install command`);
  }
});

test('the legal pages link each other and every link resolves', async () => {
  for (const [file] of PAGES) {
    const main = (await read(file)).match(/<main[\s\S]*<\/main>/)[0];
    for (const [, path] of main.matchAll(/href="(\/[^"#?]*)/g)) {
      if (path === '/') continue;
      const found = await exists(new URL(path.slice(1), dist)) || await exists(new URL(`${path.slice(1)}.html`, dist));
      assert.ok(found, `${file} links ${path}, which is not built`);
    }
  }
  const legal = await read('legal.html');
  for (const href of ['/privacy', '/terms', '/analytics-preferences']) assert.ok(legal.includes(`href="${href}"`));
  assert.match(legal, /<h2 id="content-concerns"/);
});
