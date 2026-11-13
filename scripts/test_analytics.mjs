// The site's analytics promises, checked without a browser.
// Run: node --test scripts/test_analytics.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalytics, initOptions} from '../site/analytics.mjs';
import {eventProperties, EVENTS} from '../site/analytics-events.mjs';

const config = {token:'phc_test', api_host:'/relay', ui_host:'https://us.posthog.com', country:'IN'};
function harness(overrides = {}) {
  const calls = {scripts:[], init:[], captured:[]};
  const client = {init:(token, options) => calls.init.push({token, options}), capture:(name, properties) => calls.captured.push({name, properties})};
  const analytics = createAnalytics({config, privacy:{}, loadScript:async src => { calls.scripts.push(src); }, getClient:() => client, ...overrides});
  return {analytics, calls};
}

test('PostHog loads from this site and keeps nothing in the browser', async () => {
  const {analytics, calls} = harness();
  assert.equal(await analytics.track('reference_opened', {reference_id:34, surface:'collection', search_text:'my secret product'}), true);
  assert.deepEqual(calls.scripts, ['/relay/static/array.js']);
  const {token, options} = calls.init[0];
  assert.equal(token, 'phc_test');
  assert.deepEqual([options.api_host, options.persistence, options.person_profiles], ['/relay', 'memory', 'never']);
  assert.deepEqual([options.disable_session_recording, options.disable_surveys], [true, true]);
  assert.deepEqual(calls.captured, [{name:'reference_opened', properties:{reference_id:34, surface:'collection'}}]);
});

test('no event keeps an IP address or a location derived from one', () => {
  const sent = initOptions(config, false).before_send({event:'$pageview', properties:{$current_url:'https://kuchi.kalarislabs.com/', $ip:'203.0.113.9'}});
  assert.deepEqual([sent.properties.$ip, sent.properties.$geoip_disable, sent.properties.country, sent.properties.app], [null, true, 'IN', 'kuchi']);
  assert.equal(initOptions(config, false).before_send(null), null);
});

test('Do Not Track and Global Privacy Control switch analytics off before anything loads', async () => {
  for (const privacy of [{doNotTrack:'1'}, {globalPrivacyControl:true}]) {
    const {analytics, calls} = harness({privacy});
    assert.equal(await analytics.track('reference_opened', {reference_id:1}), false);
    assert.deepEqual([calls.scripts, calls.init, calls.captured], [[], [], []]);
  }
});

test('analytics stay off without a project token and never break the page', async () => {
  const off = harness({config:{...config, token:''}});
  assert.equal(await off.analytics.track('reference_opened', {reference_id:1}), false);
  assert.deepEqual(off.calls.scripts, []);
  const blocked = harness({loadScript:async () => { throw new Error('blocked by an extension'); }});
  assert.equal(await blocked.analytics.track('reference_opened', {reference_id:1}), false);
  const unknown = harness();
  assert.equal(await unknown.analytics.track('made_up_event', {}), false);
  assert.deepEqual(unknown.calls.captured, []);
});

test('custom events carry only short, listed values', () => {
  assert.deepEqual(eventProperties('collection_filtered', {query_length:12, result_count:3, category:'ai', query:'private words', style:'a@b.com', sort:'https://x.y'}), {query_length:12, result_count:3, category:'ai'});
  assert.throws(() => eventProperties('community_post_opened', {}), /Unknown analytics event/);
  assert.equal(EVENTS.length, 10);
});

test('the relay never passes the visitor\'s IP address or cookies on to PostHog', async () => {
  const {readFile} = await import('node:fs/promises');
  const relay = await readFile(new URL('../web/src/pages/relay/[...path].ts', import.meta.url), 'utf8');
  const forwarded = relay.match(/for \(const name of \[([^\]]+)\]\)/)[1];
  assert.doesNotMatch(forwarded, /cookie|authorization|forwarded|connecting|real-ip/i);
  assert.doesNotMatch(relay, /headers\.set\('(X-Forwarded-For|X-Real-IP|CF-Connecting-IP|Forwarded)'/i);
});
