import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{VERSION} from '../worker.mjs';

test('/mcp/health reports the Kuchi product and version without auth', async () => {
  const r = await worker.fetch(new Request('https://kuchi.kalarislabs.com/mcp/health'), {}, {waitUntil(){}});
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), {status:'ok', product:'Kuchi', version:VERSION});
  const head = await worker.fetch(new Request('https://kuchi.kalarislabs.com/mcp/health',{method:'HEAD'}), {}, {waitUntil(){}});
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  const post = await worker.fetch(new Request('https://kuchi.kalarislabs.com/mcp/health',{method:'POST'}), {}, {waitUntil(){}});
  assert.equal(post.status, 405);
});
