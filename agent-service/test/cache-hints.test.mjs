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
    assert.equal((await client.listTools()).tools.length,10);
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
  assert.equal((await client.listTools()).tools.length,10);
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
    assert.deepEqual(resources.map(r=>r.uri).sort(),['kuchi://workflow','skill://kuchi/SKILL.md']);
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
  const [skill]=listed.skills;
  assert.deepEqual([skill.uri,skill.frontmatter.name,skill.resources.length],['skill://kuchi/SKILL.md','kuchi',1]);
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
  assert.equal(kept.isError,true);
  assert.match(kept.content[0].text,/surprise/); assert.doesNotMatch(kept.content[0].text,/intent/);
  const search=await client.callTool({name:'kuchi_search_videos',arguments:{shot_kind:'chart',intent:'x',limit:99}});
  assert.match(search.content[0].text,/limit/); assert.doesNotMatch(search.content[0].text,/shot_kind|intent/);
  // The two ChatGPT tools never had these arguments, so theirs are left alone.
  const untouched=await client.callTool({name:'search',arguments:{intent:'x'}});
  assert.match(untouched.content[0].text,/intent/);
  await client.close();
});
