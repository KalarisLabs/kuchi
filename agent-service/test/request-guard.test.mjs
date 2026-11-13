import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker.mjs';
import {guardRequest, MAX_MCP_BODY_BYTES} from '../request-guard.mjs';

const origin = 'https://kuchi.kalarislabs.com';
const allow = {ARCHIVE_REQUEST_LIMITER:{limit:async () => ({success:true})}};
const request = (path='/mcp', init={}) => new Request(origin+path, {...init,headers:{Host:'kuchi.kalarislabs.com',...Object.fromEntries(new Headers(init.headers))}});

test('the shared guard blocks MCP and agent HTTP routes before either can load upstream data', async () => {
  const keys = [];
  const env = {ARCHIVE_REQUEST_LIMITER:{limit:async ({key}) => {keys.push(key); return {success:false};}}};
  for (const [path, method] of [
    ['/mcp?client=a','POST'], ['/mcp?client=b','GET'],
    ['/agent/catalog.json','GET'], ['/agent/manifest.json','HEAD'],
    ['/agent/workflow.md','GET'], ['/agent/SKILL.md','OPTIONS']
  ]) {
    const r = await worker.fetch(request(path,{method,headers:{'CF-Connecting-IP':'192.0.2.10','X-Forwarded-For':crypto.randomUUID(),Authorization:`Bearer ${crypto.randomUUID()}`}}),env,{});
    assert.equal(r.status,429);
    assert.equal(r.headers.get('retry-after'),'60');
    assert.equal(r.headers.get('access-control-allow-origin'),'*');
    assert.match(r.headers.get('access-control-expose-headers'),/Retry-After/);
    assert.equal(r.headers.get('cache-control'),'no-store');
  }
  assert.equal(new Set(keys).size,1);
  assert.equal(keys[0],'kuchi:192.0.2.10');
});

test('different ingress IPs get separate keys; missing IP does not bypass protection', async () => {
  const keys=[];
  const env={ARCHIVE_REQUEST_LIMITER:{limit:async ({key})=>{keys.push(key);return {success:true};}}};
  for (const ip of ['192.0.2.1','192.0.2.2',null,null]) {
    const headers = ip ? {'CF-Connecting-IP':ip} : {};
    assert.equal((await worker.fetch(request('/agent/SKILL.md',{headers}),env,{})).status,200);
  }
  assert.notEqual(keys[0],keys[1]);
  assert.equal(keys[2],keys[3]);
  assert.equal(keys[2],'kuchi:unknown');
});

test('normal requests, MCP preflights and copied setup remain available', async () => {
  const body=JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'guard-test',version:'1.0'}}});
  const req=request(undefined,{method:'POST',body,headers:{'Content-Type':'application/json','Content-Length':String(Buffer.byteLength(body))}});
  const guarded=await guardRequest(req,allow);
  assert.equal(await guarded.request.text(),body);
  assert.equal(guarded.request.headers.get('Content-Type'),'application/json');
  assert.equal((await worker.fetch(request(undefined,{method:'OPTIONS'}),allow,{})).status,200);
  const bootstrap=await worker.fetch(request('/agent/SKILL.md'),allow,{});
  assert.equal(bootstrap.status,200);
  assert.match(await bootstrap.text(),/Call kuchi_plan_remake with what the user has told you/);
});

test('oversized bodies are rejected by both declared length and actual streamed bytes', async () => {
  const declared=request(undefined,{method:'POST',body:'{}',headers:{'Content-Length':String(MAX_MCP_BODY_BYTES+1)}});
  assert.equal((await guardRequest(declared,allow)).response.status,413);
  let cancelled=false;
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(MAX_MCP_BODY_BYTES));c.enqueue(new Uint8Array(1));},cancel(){cancelled=true;}});
  const streamed=request(undefined,{method:'POST',body:stream,duplex:'half',headers:{'Content-Length':'2'}});
  assert.equal((await guardRequest(streamed,allow)).response.status,413);
  assert.equal(cancelled,true);
  const boundary=request(undefined,{method:'POST',body:new Uint8Array(MAX_MCP_BODY_BYTES)});
  assert.equal((await (await guardRequest(boundary,allow)).request.arrayBuffer()).byteLength,MAX_MCP_BODY_BYTES);
});

test('a broken or missing protection binding fails closed with a retryable response', async () => {
  for(const env of [{},{ARCHIVE_REQUEST_LIMITER:{limit:async()=>{throw new Error('private diagnostics');}}}]) {
    const r=await worker.fetch(request('/agent/catalog.json'),env,{});
    assert.equal(r.status,503);assert.equal(r.headers.get('retry-after'),'10');
    assert.doesNotMatch(await r.text(),/private diagnostics/);
  }
});

test('deployment config binds the intended per-IP short-term allowance', async () => {
  const config=JSON.parse(await readFile(new URL('../wrangler.json',import.meta.url),'utf8'));
  assert.deepEqual(config.durable_objects.bindings,[{name:'IP_LIMITER',class_name:'IpRateLimiter'}]);
  assert.ok(config.migrations.some(m=>m.new_sqlite_classes?.includes('IpRateLimiter')));
  assert.equal(config.name,'kuchi-agent');
  // Open server: the only settings are the public analytics token and host, and the media bucket.
  assert.deepEqual(Object.keys(config.vars).sort(),['POSTHOG_HOST','POSTHOG_PROJECT_TOKEN']);
  assert.match(config.vars.POSTHOG_PROJECT_TOKEN,/^phc_/);
  assert.deepEqual(config.r2_buckets,[{binding:'MEDIA',bucket_name:'kuchi-bucket'}]);
});

test('the published SKILL.md copies match the skill the Worker serves', async () => {
  const {SKILL} = await import('../skill.mjs');
  for (const path of ['../../agent/SKILL.md', '../../plugin/launch-archive/skills/kuchi/SKILL.md'])
    assert.equal(await readFile(new URL(path, import.meta.url), 'utf8'), SKILL, path);
});

test('the Durable Object limiter is strict: request 121 in a minute is refused, then the window slides', async () => {
  const {IpRateLimiter, LIMIT, WINDOW_MS, durableLimiter} = await import('../limiter.mjs');
  const limiter = new IpRateLimiter();
  for (let i = 0; i < LIMIT; i++) assert.equal(limiter.hit(1000 + i).allowed, true);
  const refused = limiter.hit(1000 + LIMIT);
  assert.equal(refused.allowed, false);
  assert.equal(refused.retryAfter, 60);
  assert.equal(limiter.hit(1000 + WINDOW_MS).allowed, true); // the first hit has aged out

  // Through the Worker: one object per IP, and the 429 carries its exact Retry-After.
  const objects = new Map();
  const namespace = {idFromName:name => name, get:id => { if (!objects.has(id)) objects.set(id, new IpRateLimiter()); return objects.get(id); }};
  const env = {IP_LIMITER:namespace};
  for (let i = 0; i < LIMIT; i++) assert.equal((await durableLimiter(namespace).limit({key:'a'})).success, true);
  const r = await worker.fetch(request('/agent/SKILL.md',{headers:{'CF-Connecting-IP':'192.0.2.99'}}), {IP_LIMITER:{idFromName:()=>'a', get:namespace.get}}, {});
  assert.equal(r.status, 429);
  assert.match(r.headers.get('retry-after'), /^[1-9][0-9]*$/);
  const other = await worker.fetch(request('/agent/SKILL.md',{headers:{'CF-Connecting-IP':'192.0.2.100'}}), env, {});
  assert.equal(other.status, 200);
});

test('IPv6 clients are counted per /64, so rotating addresses inside one network shares a limit', async () => {
  const {clientKey} = await import('../limiter.mjs');
  assert.equal(clientKey('2001:db8:1:2:aaaa:bbbb:cccc:dddd'), clientKey('2001:db8:1:2::1'));
  assert.equal(clientKey('2001:db8:1:2::1'), '2001:db8:1:2::/64');
  assert.equal(clientKey('2001:0db8:0001:0002:0:0:0:1'), '2001:db8:1:2::/64');
  assert.notEqual(clientKey('2001:db8:1:3::1'), clientKey('2001:db8:1:2::1'));
  assert.equal(clientKey('::1'), '0:0:0:0::/64');
  assert.equal(clientKey('::ffff:192.0.2.7'), '192.0.2.7');
  assert.equal(clientKey('192.0.2.7'), '192.0.2.7');
  assert.equal(clientKey(null), 'unknown');
});

test('every JSON-RPC message in a request counts, and oversized batches are refused', async () => {
  const costs = [];
  const env = {ARCHIVE_REQUEST_LIMITER:{limit:async ({cost}) => { costs.push(cost); return {success:true}; }}};
  const post = body => request(undefined, {method:'POST', body:JSON.stringify(body), headers:{'Content-Type':'application/json'}});
  const ping = id => ({jsonrpc:'2.0', id, method:'ping'});
  assert.equal((await guardRequest(post(ping(1)), env)).messages.length, 1);
  assert.equal((await guardRequest(post([ping(1), ping(2), ping(3)]), env)).messages.length, 3);
  await guardRequest(request('/agent/catalog.json'), env);
  assert.deepEqual(costs, [1, 3, 1]);
  const big = await guardRequest(post(Array.from({length:11}, (_, i) => ping(i))), env);
  assert.equal(big.response.status, 400);
  assert.equal(costs.length, 3, 'an oversized batch is refused before it is counted');
  // Malformed JSON still costs one and is passed on for the MCP handler to answer.
  const bad = await guardRequest(request(undefined, {method:'POST', body:'{nope'}), env);
  assert.ok(bad.request); assert.deepEqual(bad.messages, []);
});

test('the limiter charges by cost and enforces the hourly allowance', async () => {
  const {IpRateLimiter, LIMIT, HOUR_LIMIT, WINDOW_MS} = await import('../limiter.mjs');
  const burst = new IpRateLimiter();
  assert.equal(burst.hit(0, 10).allowed, true);
  for (let i = 0; i < LIMIT - 10; i++) assert.equal(burst.hit(1).allowed, true);
  const refused = burst.hit(2, 5);
  assert.deepEqual([refused.allowed, refused.window, refused.first], [false, 'minute', true]);
  assert.equal(burst.hit(3).first, false, 'only the first refusal of a spell is flagged');
  assert.equal(burst.hit(1e9, 9999).allowed, true, 'cost is capped');

  const steady = new IpRateLimiter();
  let used = 0, now = 0;
  while (used + 100 <= HOUR_LIMIT) { for (let i = 0; i < 100; i++) steady.hit(now); used += 100; now += WINDOW_MS + 1; }
  const over = steady.hit(now);
  assert.deepEqual([over.allowed, over.window], [false, 'hour']);
  assert.ok(over.retryAfter >= 1 && over.retryAfter <= 3600);
  assert.equal(steady.hit(now + 61 * WINDOW_MS).allowed, true, 'the hour window slides');
});

test('counts survive the Durable Object being dropped from memory', async () => {
  const {IpRateLimiter, LIMIT, SAVE_EVERY} = await import('../limiter.mjs');
  const rows = new Map();
  let writes = 0, alarms = 0;
  const storage = {get:async key => structuredClone(rows.get(key)), put:async (key, value) => { writes++; rows.set(key, structuredClone(value)); },
    setAlarm:async () => { alarms++; }, deleteAll:async () => rows.clear()};
  const call = async object => (await object.fetch('https://limiter/hit?cost=1')).json();
  let object = new IpRateLimiter({storage});
  for (let i = 0; i < LIMIT; i++) assert.equal((await call(object)).allowed, true);
  assert.equal(writes, LIMIT / SAVE_EVERY, 'saved every few units, not on every request');
  assert.equal(alarms, 1);
  assert.equal((await call(object)).allowed, false);

  // The idle object is dropped; the next request builds a new one from storage.
  object = new IpRateLimiter({storage});
  const after = await call(object);
  assert.deepEqual([after.allowed, after.window, after.hour], [false, 'minute', LIMIT]);

  // Pausing mid-burst wins back fewer than SAVE_EVERY units.
  rows.clear();
  object = new IpRateLimiter({storage});
  for (let i = 0; i < SAVE_EVERY + 4; i++) await call(object);
  object = new IpRateLimiter({storage});
  assert.equal((await call(object)).hour, SAVE_EVERY + 1);

  // Storage that fails never blocks a client.
  const broken = new IpRateLimiter({storage:{get:async () => { throw new Error('down'); }, put:async () => { throw new Error('down'); }, setAlarm:async () => { throw new Error('down'); }}});
  for (let i = 0; i < SAVE_EVERY * 2; i++) assert.equal((await call(broken)).allowed, true);

  // An hour after the last request, the alarm removes what was stored.
  rows.set('counts', {hits:[1], minutes:[[0, 5]]});
  const stale = new IpRateLimiter({storage});
  await stale.alarm();
  assert.equal(rows.size, 0);
});
