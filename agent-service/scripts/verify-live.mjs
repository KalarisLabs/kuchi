// Checks the deployed server as a real client would, with both the current
// and the legacy SDK. Usage: npm run verify:live [-- https://host/mcp]
//
// Requests carry a kuchi-verify User-Agent, which the server leaves out of
// analytics. One last pass without it checks the path real clients take.
import assert from 'node:assert/strict';
import {Client as Modern, StreamableHTTPClientTransport as ModernHTTP} from '@modelcontextprotocol/client';
import {Client as Legacy} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport as LegacyHTTP} from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = process.argv[2] ?? 'https://kuchi.kalarislabs.com/mcp';
const QUIET = {'User-Agent':'kuchi-verify/1.1'};
const TOOLS = ['fetch', 'kuchi_check_remake', 'kuchi_get_breakdown', 'kuchi_get_video', 'kuchi_list_filters', 'kuchi_plan_remake', 'kuchi_search_videos', 'search'];
const parse = r => r.structuredContent ?? JSON.parse(r.content[0].text);
const head = async link => (await fetch(link, {method:'HEAD', headers:QUIET})).status;

for (const [name, Client, Transport] of [['modern', Modern, ModernHTTP], ['legacy', Legacy, LegacyHTTP]]) {
  const c = new Client({name:`kuchi-verify-${name}`, version:'1.1.0'});
  try {
    await c.connect(new Transport(new URL(url), {requestInit:{headers:QUIET}}));
    const tools = (await c.listTools()).tools.map(t => t.name).sort();
    assert.deepEqual(tools, TOOLS);
    const call = async (tool, args) => parse(await c.callTool({name:tool, arguments:{...args, response_format:'json'}}));

    const page = await call('kuchi_search_videos', {limit:2});
    assert.ok(page.total > 0 && page.videos.length === 2);
    const video = await call('kuchi_get_video', {reference:String(page.videos[0].id)});
    assert.equal(await head(video.video_url), 200, video.video_url);
    assert.equal(await head(video.poster_url), 200, video.poster_url);

    // Every video is measured, and its storyboard sheets are published.
    assert.ok(video.breakdown?.shots > 0, 'the video has a breakdown');
    const breakdown = await call('kuchi_get_breakdown', {reference:String(video.id)});
    assert.equal(breakdown.shots[0].start_frame, 0);
    assert.equal(breakdown.measured.shots, video.breakdown.shots);
    for (const sheet of breakdown.storyboard.slice(0, 2)) assert.equal(await head(sheet.url), 200, sheet.url);
    const withSheet = await c.callTool({name:'kuchi_get_breakdown', arguments:{reference:String(video.id), storyboard:'overview', shot_limit:1}});
    assert.ok(withSheet.content.some(part => part.type === 'image' && part.data.length > 1000), 'the storyboard sheet arrives as an image');
    const filters = await call('kuchi_list_filters', {});
    assert.ok(filters.paces.length && filters.themes.length && filters.shot_kinds.length);

    const plan = await call('kuchi_plan_remake', {reference:String(video.id), product_name:'Verify'});
    assert.equal(plan.ready, false);
    assert.ok(plan.missing_inputs.some(m => m.required));
    const check = await call('kuchi_check_remake', {reference:String(video.id), product_name:'Verify', shots:[{start_s:0, end_s:2, assets:[{kind:'screenshot', source:'reference'}]}]});
    assert.equal(check.passed, false);

    assert.ok(parse(await c.callTool({name:'search', arguments:{query:'launch'}})).results.length > 0);
    assert.equal((await c.listPrompts()).prompts.length, 2);
    console.log(JSON.stringify({client:name, tools:tools.length, videos:page.total, checked:video.id, shots:breakdown.measured.shots}));
  } finally { await c.close().catch(() => {}); }
}

for (const path of ['manifest.json', 'catalog.json', 'workflow.md', 'SKILL.md', 'breakdowns/1.json'])
  assert.equal((await fetch(new URL(`/agent/${path}`, url), {headers:QUIET})).status, 200, path);

// The path real clients take: analytics on, the ChatGPT tools untouched.
const rpc = (id, method, params) => ({jsonrpc:'2.0', id, method, ...(params ? {params} : {})});
const post = (body, headers = {}) => fetch(url, {method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json, text/event-stream', ...headers}, body:JSON.stringify(body)});
const read = async response => { const text = await response.text(); return JSON.parse(text.startsWith('{') ? text : text.split('\n').find(l => l.startsWith('data: ')).slice(6)); };
const init = await post(rpc(1, 'initialize', {protocolVersion:'2025-06-18', capabilities:{}, clientInfo:{name:'kuchi-verify-live', version:'1.1.0'}}));
assert.equal(init.status, 200);
await init.text();
const session = init.headers.get('mcp-session-id');
const listed = (await read(await post(rpc(2, 'tools/list'), session ? {'Mcp-Session-Id':session} : {}))).result.tools;
const search = listed.find(t => t.name === 'search');
assert.deepEqual(Object.keys(search.inputSchema.properties), ['query'], 'analytics adds nothing to the ChatGPT search tool');
assert.ok(listed.filter(t => t.name !== 'kuchi_send_feedback').every(t => t.annotations?.readOnlyHint === true), 'every catalog tool is read-only');
console.log(JSON.stringify({analytics:Boolean(session), feedback_tool:listed.some(t => t.name === 'kuchi_send_feedback'), tools:listed.length}));

const oversized = await post(Array.from({length:11}, (_, i) => rpc(i, 'tools/list')), QUIET);
assert.equal(oversized.status, 400, 'a batch of 11 messages is refused');
console.log('Live checks passed');
