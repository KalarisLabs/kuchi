import test from 'node:test';
import assert from 'node:assert/strict';
import {Client,StreamableHTTPClientTransport,InMemoryResponseCacheStore} from '@modelcontextprotocol/client';
import {z} from 'zod';
import worker from '../worker.mjs';
import {SKILL} from '../skill.mjs';

const env={ARCHIVE_REQUEST_LIMITER:{limit:async()=>({success:true})}};
function harness() {
  const seen=[];
  const fetch=async(url,init={})=>{
    const headers=new Headers(new Request(url,init).headers); headers.set('Host','kuchi.kalarislabs.com');
    let method='-'; try { method=JSON.parse(String(init.body)).method; } catch {}
    const response=await worker.fetch(new Request(url,{method:init.method,headers,body:init.body}),env,{waitUntil(){}});
    seen.push({method,body:await response.clone().text()});
    return response;
  };
  return {seen,transport:()=>new StreamableHTTPClientTransport(new URL('https://kuchi.kalarislabs.com/mcp'),{fetch})};
}

test('2026-era discover and tools/list are cacheable so clients stop re-listing tools on every use', async () => {
  const {seen,transport}=harness();
  const responseCacheStore=new InMemoryResponseCacheStore();
  for (let refresh=0; refresh<3; refresh++) {
    const client=new Client({name:'cache-test',version:'1'},{versionNegotiation:{mode:'auto'},responseCacheStore});
    await client.connect(transport());
    assert.equal((await client.listTools()).tools.length,13);
    await client.close();
  }
  const lists=seen.filter(r=>r.method==='tools/list');
  assert.equal(lists.length,1,'tools/list should be served from the client cache after the first refresh');
  for (const r of seen.filter(r=>['tools/list','server/discover'].includes(r.method))) {
    assert.match(r.body,/"ttlMs":3600000/);
    assert.match(r.body,/"cacheScope":"private"/);
  }
});

test('2025-era clients keep the legacy handshake with no cache fields', async () => {
  const {seen,transport}=harness();
  const client=new Client({name:'legacy-test',version:'1'});
  await client.connect(transport());
  assert.equal((await client.listTools()).tools.length,13);
  await client.close();
  assert.equal(seen[0].method,'initialize');
  assert.doesNotMatch(seen.find(r=>r.method==='tools/list').body,/ttlMs/);
});

test('the skill is served over MCP to hosts that load skills from servers, and as a plain resource to the rest', async () => {
  for (const options of [{versionNegotiation:{mode:'auto'}},undefined]) {
    const {seen,transport}=harness();
    const client=new Client({name:'skill-test',version:'1'},options);
    await client.connect(transport());
    assert.ok(client.getServerCapabilities().extensions['io.modelcontextprotocol/skills'],'the skills extension is declared');
    const {resources}=await client.listResources();
    const uris=resources.map(r=>r.uri);
    for (const uri of ['kuchi://workflow','skill://kuchi/SKILL.md','skill://kuchi-remotion/SKILL.md','skill://kuchi-sound/SKILL.md','skill://kuchi-audio-check/SKILL.md']) assert.ok(uris.includes(uri),uri);
    assert.ok(uris.every(u=>/^(kuchi:\/\/(workflow|videos\/\d+|components\/[a-z0-9-]+)|skill:\/\/kuchi(-[a-z-]+)?\/SKILL\.md)$/.test(u)),'only Kuchi resources are listed');
    const read=await client.readResource({uri:'skill://kuchi/SKILL.md'});
    assert.deepEqual([read.contents[0].mimeType,read.contents[0].text],['text/markdown',SKILL]);
    await client.close();
    assert.equal(seen.some(r=>r.method==='skills/list'),false,'nothing is fetched before a host asks for it');
  }
});

test('skills/list gives the skill with a digest a host can approve', async () => {
  const {transport}=harness();
  const client=new Client({name:'skill-test',version:'1'},{versionNegotiation:{mode:'auto'}});
  await client.connect(transport());
  const listed=await client.request({method:'skills/list',params:{}},z.looseObject({skills:z.array(z.any())}));
  assert.deepEqual(listed.skills.map(s=>s.frontmatter.name).sort(),['kuchi','kuchi-audio-check','kuchi-product-launch-video','kuchi-remotion','kuchi-sound']);
  const skill=listed.skills.find(s=>s.frontmatter.name==='kuchi');
  assert.deepEqual([skill.uri,skill.resources.length],['skill://kuchi/SKILL.md',1]);
  assert.match(skill.resources[0].digest,/^sha256:[0-9a-f]{64}$/);
  assert.equal(skill.resources[0].size,new TextEncoder().encode(SKILL).length);
  const got=await client.request({method:'skills/get',params:{uri:'skill://kuchi/SKILL.md'}},z.looseObject({skill:z.any()}));
  assert.equal(got.skill.resources[0].digest,skill.resources[0].digest);
  await client.close();
});

test('a call that still carries an argument from an older tool list is answered, not rejected', async () => {
  const {transport}=harness();
  const client=new Client({name:'old-list-test',version:'1'});
  await client.connect(transport());
  // Validation runs before the catalog loads, so these never reach the network.
  const kept=await client.callTool({name:'kuchi_get_video',arguments:{intent:'references for a fintech app',surprise:1}});
  // Nothing names a video, so validation still says reference is missing; the unknown key is reported, the retired one isn't.
  assert.equal(kept.isError,true);
  const said=kept.content.map(c=>c.text).join('\n');
  assert.match(said,/reference/); assert.match(said,/surprise: not an argument/); assert.doesNotMatch(said,/intent/);
  const search=await client.callTool({name:'kuchi_search_videos',arguments:{shot_kind:'chart',intent:'x',limit:99}});
  const searched=search.content.map(c=>c.text).join('\n');
  assert.match(searched,/limit: 99 lowered to 20/); assert.doesNotMatch(searched,/shot_kind|intent/);
  // The two ChatGPT tools never had these arguments, so theirs are left alone.
  const untouched=await client.callTool({name:'search',arguments:{intent:'x'}});
  assert.match(untouched.content.map(c=>c.text).join('\n'),/intent/);
  await client.close();
});
