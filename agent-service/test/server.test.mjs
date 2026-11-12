import test from 'node:test';
import assert from 'node:assert/strict';
import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {createServer, INSTRUCTIONS} from '../server.mjs';

const video = (id, extra = {}) => ({id, slug:`demo-${id}`, title:`Demo ${id}`, account:'@demo', category:'AI launch', readmeCategory:'clean-ui-data-graphics',
  styles:['UI motion'], ratio:'16:9', clipSeconds:30, width:1920, height:1080, hasAudio:true, date:`2026-11-${String(id).padStart(2, '0')}`,
  notes:['A cursor glides across a dashboard.'], source:`https://x.com/demo/status/${1000 + id}`, poster:`previews/demo-${id}.jpg`,
  watchUrl:`https://kuchi.kalarislabs.com/assets/${id}.mp4`, detailUrl:`https://kuchi.kalarislabs.com/#video-${id}`, impressions:999, ...extra});
const archive = {
  videos:[video(1), video(2, {title:'Pastel cursor demo', styles:['Cursor demo', 'Kinetic type'], ratio:'9:16', clipSeconds:15, hasAudio:false}), ...Array.from({length:10}, (_, i) => video(i + 3))],
  manifest:{schemaVersion:1}, formats:new Map([['clean-ui-data-graphics', 'Clean UI, Data & Graphics']]),
  workflow:'# Kuchi workflow', sourceRevision:'a'.repeat(40), fetchedAt:'2026-11-12T00:00:00Z'
};

async function connect(load = async () => archive) {
  const server = createServer(load);
  const client = new Client({name:'test', version:'1.0.0'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  return {client, close:async () => { await client.close(); await server.close(); }};
}
const call = (client, name, args) => client.callTool({name, arguments:args});
const data = result => result.structuredContent ?? JSON.parse(result.content[0].text);

test('the server advertises six read-only tools, two prompts, a resource and instructions', async () => {
  const {client, close} = await connect();
  try {
    assert.match(client.getInstructions(), /inspiration templates/);
    assert.equal(client.getInstructions(), INSTRUCTIONS);
    const {tools} = await client.listTools();
    assert.deepEqual(tools.map(t => t.name).sort(), ['fetch', 'kuchi_get_video', 'kuchi_list_filters', 'kuchi_plan_remake', 'kuchi_search_videos', 'search']);
    for (const t of tools) {
      assert.ok(t.title && t.description, t.name);
      assert.equal(t.annotations.readOnlyHint, true);
      assert.equal(t.annotations.destructiveHint, false);
    }
    assert.deepEqual((await client.listPrompts()).prompts.map(p => p.name).sort(), ['find_launch_inspiration', 'remake_launch_video']);
    const resource = await client.readResource({uri:'kuchi://workflow'});
    assert.equal(resource.contents[0].text, '# Kuchi workflow');
  } finally { await close(); }
});

test('search filters, paginates and never exposes popularity metrics', async () => {
  const {client, close} = await connect();
  try {
    const first = data(await call(client, 'kuchi_search_videos', {limit:5, response_format:'json'}));
    assert.equal(first.total, 12); assert.equal(first.count, 5); assert.equal(first.has_more, true); assert.equal(first.next_offset, 5);
    const last = data(await call(client, 'kuchi_search_videos', {limit:5, offset:10, response_format:'json'}));
    assert.equal(last.count, 2); assert.equal(last.has_more, false); assert.equal(last.next_offset, undefined);
    const vertical = data(await call(client, 'kuchi_search_videos', {aspect_ratio:'9:16', max_seconds:20, response_format:'json'}));
    assert.deepEqual(vertical.videos.map(v => v.id), [2]);
    assert.equal(vertical.videos[0].poster_url, 'https://kuchi-media.kalarislabs.com/previews/demo-2.jpg');
    assert.equal(JSON.stringify(first).includes('impressions'), false);
    const markdown = await call(client, 'kuchi_search_videos', {query:'pastel'});
    assert.match(markdown.content[0].text, /Pastel cursor demo \(id 2\)/);
    assert.equal(markdown.structuredContent, undefined);
    const none = await call(client, 'kuchi_search_videos', {query:'zzzz'});
    assert.match(none.content[0].text, /No videos match/);
  } finally { await close(); }
});

test('videos resolve by id, slug, Kuchi link and X URL; misses explain how to recover', async () => {
  const {client, close} = await connect();
  try {
    for (const ref of ['2', 'demo-2', 'https://kuchi.kalarislabs.com/#video-2', 'https://x.com/demo/status/1002?s=20'])
      assert.equal(data(await call(client, 'kuchi_get_video', {reference:ref, response_format:'json'})).id, 2, ref);
    const miss = await call(client, 'kuchi_get_video', {reference:'999'});
    assert.equal(miss.isError, true); assert.match(miss.content[0].text, /kuchi_search_videos/);
    const filters = data(await call(client, 'kuchi_list_filters', {response_format:'json'}));
    assert.equal(filters.total_videos, 12);
    assert.deepEqual(filters.formats, [{id:'clean-ui-data-graphics', name:'Clean UI, Data & Graphics', videos:12}]);
  } finally { await close(); }
});

test('plan_remake asks for the user\'s own assets until it is ready', async () => {
  const {client, close} = await connect();
  try {
    const draft = data(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', response_format:'json'}));
    assert.equal(draft.ready, false);
    const required = draft.missing_inputs.filter(m => m.required).map(m => m.field);
    assert.deepEqual(required, ['product_description', 'key_features', 'assets.logo', 'assets.screenshot', 'call_to_action']);
    assert.ok(draft.guardrails.some(g => /Never reuse/.test(g)));
    assert.match(draft.next_steps[0], /Ask the user/);

    const ready = data(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', product_description:'Invoices that pay themselves.',
      key_features:['Auto reminders', 'One-click pay'], call_to_action:'acme.com', target_seconds:20,
      assets:[{kind:'logo', description:'Acme mark'}, {kind:'screen_recording', description:'Invoice flow'}], response_format:'json'}));
    assert.equal(ready.ready, true);
    assert.equal(ready.target_seconds, 20);
    assert.equal(ready.beat_sheet.at(-1).end_s, 20);
    assert.ok(ready.beat_sheet.some(b => b.beat === 'Feature: Auto reminders'));
    assert.equal(ready.product.name, 'Acme');
    assert.ok(ready.missing_inputs.every(m => !m.required));

    const markdown = await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme'});
    assert.match(markdown.content[0].text, /Not ready yet/);
    const bad = await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', assets:[{kind:'sticker', description:'x'}]});
    assert.equal(bad.isError, true);
  } finally { await close(); }
});

test('ChatGPT search and fetch return the documented shapes', async () => {
  const {client, close} = await connect();
  try {
    const {results} = JSON.parse((await call(client, 'search', {query:'pastel'})).content[0].text);
    assert.deepEqual(results[0], {id:'2', title:'Pastel cursor demo', url:'https://kuchi.kalarislabs.com/#video-2'});
    const doc = JSON.parse((await call(client, 'fetch', {id:'2'})).content[0].text);
    assert.equal(doc.id, '2'); assert.equal(doc.url, 'https://kuchi.kalarislabs.com/#video-2');
    assert.match(doc.text, /Video file: https:\/\/kuchi\.kalarislabs\.com\/assets\/2\.mp4/);
    assert.ok(Object.values(doc.metadata).every(v => typeof v === 'string'));
  } finally { await close(); }
});

test('prompts frame references as templates for the user\'s own product', async () => {
  const {client, close} = await connect();
  try {
    const remake = await client.getPrompt({name:'remake_launch_video', arguments:{product_name:'Acme', reference:'34'}});
    assert.match(remake.messages[0].content.text, /Acme/);
    assert.match(remake.messages[0].content.text, /never the reference's brand/);
    const find = await client.getPrompt({name:'find_launch_inspiration', arguments:{product:'a budgeting app', vibe:'playful'}});
    assert.match(find.messages[0].content.text, /playful/);
  } finally { await close(); }
});

test('an unavailable catalog returns a retryable tool error, not a crash', async () => {
  const {client, close} = await connect(async () => { throw new Error('GitHub down'); });
  try {
    const r = await call(client, 'kuchi_search_videos', {});
    assert.equal(r.isError, true); assert.match(r.content[0].text, /Retry in a minute/);
  } finally { await close(); }
});
