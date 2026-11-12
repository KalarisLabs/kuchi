// Checks the deployed server as a real client would, with both the current
// and the legacy SDK. Usage: npm run verify:live [-- https://host/mcp]
import assert from 'node:assert/strict';
import {Client as Modern, StreamableHTTPClientTransport as ModernHTTP} from '@modelcontextprotocol/client';
import {Client as Legacy} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport as LegacyHTTP} from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = process.argv[2] ?? 'https://kuchi.kalarislabs.com/mcp';
const parse = r => r.structuredContent ?? JSON.parse(r.content[0].text);
for (const [name, Client, Transport] of [['modern', Modern, ModernHTTP], ['legacy', Legacy, LegacyHTTP]]) {
  const c = new Client({name:`kuchi-verify-${name}`, version:'1.0.0'});
  try {
    await c.connect(new Transport(new URL(url)));
    const tools = (await c.listTools()).tools.map(t => t.name).sort();
    assert.deepEqual(tools, ['fetch', 'kuchi_get_video', 'kuchi_list_filters', 'kuchi_plan_remake', 'kuchi_search_videos', 'search']);
    const page = parse(await c.callTool({name:'kuchi_search_videos', arguments:{limit:2, response_format:'json'}}));
    assert.ok(page.total > 0 && page.videos.length === 2);
    const video = parse(await c.callTool({name:'kuchi_get_video', arguments:{reference:String(page.videos[0].id), response_format:'json'}}));
    assert.equal((await fetch(video.video_url, {method:'HEAD'})).status, 200, video.video_url);
    assert.equal((await fetch(video.poster_url, {method:'HEAD'})).status, 200, video.poster_url);
    const plan = parse(await c.callTool({name:'kuchi_plan_remake', arguments:{reference:String(video.id), product_name:'Verify', response_format:'json'}}));
    assert.equal(plan.ready, false);
    assert.ok(parse(await c.callTool({name:'search', arguments:{query:'launch'}})).results.length > 0);
    assert.equal((await c.listPrompts()).prompts.length, 2);
    console.log(JSON.stringify({client:name, tools:tools.length, videos:page.total, checked:video.id}));
  } finally { await c.close(); }
}
for (const path of ['manifest.json', 'catalog.json', 'workflow.md', 'SKILL.md'])
  assert.equal((await fetch(new URL(`/agent/${path}`, url))).status, 200, path);
console.log('Live checks passed');
