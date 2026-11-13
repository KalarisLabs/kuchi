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
const QUIET = {'User-Agent':'kuchi-verify/1.2'};
const TOOLS = ['fetch', 'kuchi_check_remake', 'kuchi_get_breakdown', 'kuchi_get_video', 'kuchi_get_workflow', 'kuchi_list_filters', 'kuchi_plan_remake', 'kuchi_search_videos', 'kuchi_suggest_templates', 'search'];
const parse = r => r.structuredContent ?? JSON.parse(r.content[0].text);
const head = async link => (await fetch(link, {method:'HEAD', headers:QUIET})).status;

let checkedId = null;
for (const [name, Client, Transport] of [['modern', Modern, ModernHTTP], ['legacy', Legacy, LegacyHTTP]]) {
  const c = new Client({name:`kuchi-verify-${name}`, version:'1.2.0'});
  try {
    await c.connect(new Transport(new URL(url), {requestInit:{headers:QUIET}}));
    const tools = (await c.listTools()).tools.map(t => t.name).sort();
    assert.deepEqual(tools, TOOLS);
    const call = async (tool, args) => parse(await c.callTool({name:tool, arguments:{...args, response_format:'json'}}));

    const page = await call('kuchi_search_videos', {limit:2});
    assert.ok(page.total > 0 && page.videos.length === 2);
    // Choosing a template: a numbered short list, a question for the user, and the website route.
    const offer = await call('kuchi_suggest_templates', {looking_for:'verification run', theme:'dark', available_assets:['logo', 'screenshot'], count:3});
    assert.deepEqual(offer.choices.map(c => c.choice), [1, 2, 3]);
    assert.ok(offer.ask_user.includes(offer.gallery.url) && offer.choices.every(c => c.watch_url && c.poster_url && c.needs_from_user.length));
    assert.equal(await head(offer.choices[0].poster_url), 200, offer.choices[0].poster_url);
    const pastedLink = await call('kuchi_get_video', {reference:`Use this Kuchi video as the template: ${offer.choices[0].watch_url}`});
    assert.equal(pastedLink.id, offer.choices[0].id, 'a link pasted from the website selects that video');
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

    // The common instruction layer: the workflow as a tool result, and the shot analysis handed to the agent.
    const workflow = (await c.callTool({name:'kuchi_get_workflow', arguments:{}})).content[0].text;
    assert.match(workflow, /## 2\. Study it shot by shot[\s\S]+## 5\. Check against the reference/);
    const step = (await c.callTool({name:'kuchi_get_workflow', arguments:{step:'build'}})).content[0].text;
    assert.ok(step.startsWith('## 4. ') && step.length < workflow.length, 'one step is returned on its own');
    assert.equal(breakdown.analysis.kinds.length, filters.shot_kinds.length);
    assert.ok(breakdown.shots.some(s => s.storyboard_frame_s >= 0), 'shots say where their frame is on the overview sheet');
    assert.ok(breakdown.shots.every(s => s.storyboard_frame_s >= 0 || s.detail_sheets?.length), 'every shot can be seen on some sheet');

    const plan = await call('kuchi_plan_remake', {reference:String(video.id), product_name:'Verify'});
    assert.equal(plan.ready, false);
    assert.ok(plan.missing_inputs.some(m => m.required));
    const analysed = await call('kuchi_plan_remake', {reference:String(video.id), product_name:'Verify', fps:30,
      shot_analysis:breakdown.shots.map(s => ({shot:s.n, kind:'abstract', shows:'Verification run'}))});
    const planned = analysed.blueprint.shots;
    assert.equal(planned[0].start_frame, 0);
    const sent = new Set(breakdown.shots.map(s => s.n));
    assert.ok(planned.some(s => sent.has(s.reference_shot)) && planned.every(s => s.end_frame >= s.start_frame && (!sent.has(s.reference_shot) || s.kind === 'abstract')),
      "the caller's shot analysis drives the blueprint, on whole frames");
    const check = await call('kuchi_check_remake', {reference:String(video.id), product_name:'Verify', shots:[{start_s:0, end_s:2, assets:[{kind:'screenshot', source:'reference'}]}]});
    assert.equal(check.passed, false);
    const timed = await call('kuchi_check_remake', {reference:String(video.id), product_name:'Verify',
      shots:planned.map(s => ({start_s:s.start_s, end_s:s.end_s, reference_shot:s.reference_shot, on_screen_text:['Verify']}))});
    assert.equal(timed.timing.on_time, planned.length, 'a remake built from the blueprint is on time');
    assert.ok(timed.compare_frames.length > 0 && timed.compare_frames.every(f => f.reference_sheet), 'each compared frame names the sheet it is on');
    assert.equal(timed.compare_frames.length, Math.min(planned.length, 40), 'every planned shot has a frame to compare');

    assert.ok(parse(await c.callTool({name:'search', arguments:{query:'launch'}})).results.length > 0);
    assert.equal((await c.listPrompts()).prompts.length, 2);
    checkedId = video.id;
    console.log(JSON.stringify({client:name, tools:tools.length, videos:page.total, checked:video.id, shots:breakdown.measured.shots}));
  } finally { await c.close().catch(() => {}); }
}

for (const path of ['manifest.json', 'catalog.json', 'workflow.md', 'SKILL.md', `breakdowns/${checkedId}.json`])
  assert.equal((await fetch(new URL(`/agent/${path}`, url), {headers:QUIET})).status, 200, path);

// The skill is served over MCP as well, for hosts that load skills from servers.
{
  const c = new Modern({name:'kuchi-verify-skill', version:'1.2.0'}, {versionNegotiation:{mode:'auto'}});
  try {
    await c.connect(new ModernHTTP(new URL(url), {requestInit:{headers:QUIET}}));
    assert.ok(c.getServerCapabilities().extensions?.['io.modelcontextprotocol/skills'], 'the skills extension is declared');
    const skill = (await c.readResource({uri:'skill://kuchi/SKILL.md'})).contents[0].text;
    assert.equal(skill, await (await fetch(new URL('/agent/SKILL.md', url), {headers:QUIET})).text(), 'the MCP skill and the published file are the same text');
    console.log(JSON.stringify({skill:'skill://kuchi/SKILL.md', bytes:skill.length, icons:c.getServerVersion().icons?.length ?? 0}));
  } finally { await c.close().catch(() => {}); }
}

// The path real clients take: analytics on, the ChatGPT tools untouched.
const rpc = (id, method, params) => ({jsonrpc:'2.0', id, method, ...(params ? {params} : {})});
const post = (body, headers = {}) => fetch(url, {method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json, text/event-stream', ...headers}, body:JSON.stringify(body)});
const read = async response => { const text = await response.text(); return JSON.parse(text.startsWith('{') ? text : text.split('\n').find(l => l.startsWith('data: ')).slice(6)); };
const init = await post(rpc(1, 'initialize', {protocolVersion:'2025-06-18', capabilities:{}, clientInfo:{name:'kuchi-verify-live', version:'1.2.0'}}));
assert.equal(init.status, 200);
await init.text();
const session = init.headers.get('mcp-session-id');
const listed = (await read(await post(rpc(2, 'tools/list'), session ? {'Mcp-Session-Id':session} : {}))).result.tools;
const search = listed.find(t => t.name === 'search');
assert.deepEqual(Object.keys(search.inputSchema.properties), ['query'], 'analytics adds nothing to the ChatGPT search tool');
assert.ok(listed.filter(t => t.name !== 'kuchi_send_feedback').every(t => t.annotations?.readOnlyHint === true), 'every catalog tool is read-only');
// What the Claude and ChatGPT directories check on every tool.
for (const t of listed) {
  assert.ok(t.title && t.description && t.name.length <= 64, `${t.name} has a title and a description`);
  for (const hint of ['readOnlyHint', 'destructiveHint', 'openWorldHint']) assert.equal(typeof t.annotations?.[hint], 'boolean', `${t.name}.${hint}`);
  assert.equal(Object.hasOwn(t.inputSchema.properties ?? {}, 'intent'), false, `${t.name} asks for nothing beyond its job`);
}
console.log(JSON.stringify({analytics:Boolean(session), feedback_tool:listed.some(t => t.name === 'kuchi_send_feedback'), tools:listed.length}));

const oversized = await post(Array.from({length:11}, (_, i) => rpc(i, 'tools/list')), QUIET);
assert.equal(oversized.status, 400, 'a batch of 11 messages is refused');
console.log('Live checks passed');
