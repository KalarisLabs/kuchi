import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
import {VERSION} from '../server.mjs';

test('/mcp/health reports the Kuchi product and version without auth', async () => {
  const r = await worker.fetch(new Request('https://kuchi.kalarislabs.com/mcp/health'), {}, {waitUntil(){}});
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), {status:'ok', product:'Kuchi', version:VERSION});
  const head = await worker.fetch(new Request('https://kuchi.kalarislabs.com/mcp/health',{method:'HEAD'}), {}, {waitUntil(){}});
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  const post = await worker.fetch(new Request('https://kuchi.kalarislabs.com/mcp/health',{method:'POST'}), {}, {waitUntil(){}});
  assert.equal(post.status, 405);
});

test('the Worker entry exports only handlers and Durable Object classes', async () => {
  // workerd refuses to start a Worker whose entry module exports a plain value.
  const entry = await import('../worker.mjs');
  for (const [name, value] of Object.entries(entry))
    assert.ok(name === 'default' ? typeof value.fetch === 'function' : typeof value === 'function', `export "${name}" is a ${typeof value}`);
});
