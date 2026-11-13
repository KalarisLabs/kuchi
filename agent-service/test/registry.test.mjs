// server.json is what the official MCP Registry publishes. It has to describe
// the server that is deployed, within the registry's limits.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {VERSION} from '../server.mjs';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('server.json matches the deployed server and the registry limits', async () => {
  const [entry, pkg, manifest] = await Promise.all([json('../../server.json'), json('../package.json'), json('../../agent/manifest.json')]);
  assert.match(entry.$schema, /^https:\/\/static\.modelcontextprotocol\.io\/schemas\/[\d-]+\/server\.schema\.json$/);
  assert.equal(entry.name, 'io.github.KalarisLabs/kuchi');
  assert.equal(entry.name, manifest.registryName);
  assert.equal(entry.version, VERSION);
  assert.equal(entry.version, pkg.version);
  assert.ok(entry.description.length <= 100, `description is ${entry.description.length} characters; the registry allows 100`);
  assert.ok(entry.title.length <= 100);
  assert.deepEqual(entry.remotes, [{type:'streamable-http', url:manifest.mcpUrl}]);
  assert.equal(entry.repository.source, 'github');
  assert.equal(entry.repository.url.toLowerCase(), manifest.sourceRepository.toLowerCase());
  for (const icon of entry.icons) {
    assert.ok(icon.src.startsWith('https://kuchi.kalarislabs.com/') && icon.src.length <= 255);
    assert.match(icon.mimeType, /^image\/(png|svg\+xml)$/);
    assert.ok(icon.sizes.every(size => /^(\d+x\d+|any)$/.test(size)));
  }
});

test('the registry is only published by hand, from main, without stored secrets', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/publish-registry.yml', import.meta.url), 'utf8');
  assert.match(workflow, /^on:\r?\n  workflow_dispatch:\r?\n\r?\n/m);
  assert.doesNotMatch(workflow, /^\s+(push|pull_request|pull_request_target|schedule):/m);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.match(workflow, /cosign verify-blob/);
});
