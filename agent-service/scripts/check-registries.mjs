// Checks Kuchi's listing in every MCP registry and directory against server.json.
// Usage: npm run check:registries [-- --before-publish]
//
// --before-publish: fail unless the deployed server runs server.json's version,
// and exit 0 with "already published" when the official registry has it (a
// published version cannot be replaced).
// Without it: fail unless the official registry lists server.json's version as
// the latest. The other directories are reported, never failed on: listing
// there is a portal submission (directory-submission/EXTERNAL_REGISTRIES.md).
import {readFile, appendFile} from 'node:fs/promises';

const entry = JSON.parse(await readFile(new URL('../../server.json', import.meta.url), 'utf8'));
const before = process.argv.includes('--before-publish');
const UA = {'User-Agent':'kuchi-registry-check', Accept:'application/json, text/html'};
const OFFICIAL = `https://registry.modelcontextprotocol.io/v0.1/servers?search=${encodeURIComponent(entry.name)}`;

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, {headers:UA, signal:AbortSignal.timeout(15000), redirect:'follow'});
      return {status:r.status, text:await r.text()};
    } catch (error) {
      if (attempt === 3) return {status:0, text:String(error.message)};
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function official() {
  const {status, text} = await get(OFFICIAL);
  if (status !== 200) return {status, versions:[], latest:null};
  const servers = JSON.parse(text).servers.filter(s => s.server?.name === entry.name);
  const latest = servers.find(s => s._meta?.['io.modelcontextprotocol.registry/official']?.isLatest)?.server.version ?? null;
  return {status, versions:servers.map(s => s.server.version), latest};
}

// Directories that list servers through their own portal. A 200 page that
// names the server counts as listed.
const DIRECTORIES = [
  ['Smithery', 'https://registry.smithery.ai/servers/@kalarislabs/kuchi', t => t.includes('kuchi.kalarislabs.com')],
  ['Glama', 'https://glama.ai/mcp/servers/@KalarisLabs/kuchi', t => /kuchi/i.test(t)],
  ['mcp.so', 'https://mcp.so/server/kuchi/KalarisLabs', t => /kuchi/i.test(t)],
  ['mcpservers.org', 'https://mcpservers.org/servers/KalarisLabs/kuchi', t => /kuchi/i.test(t)],
  ['PulseMCP', 'https://www.pulsemcp.com/servers/kalarislabs-kuchi', t => /kuchi/i.test(t)]
];

const report = [];
const line = text => { report.push(text); console.log(text); };
let failed = false;

if (before) {
  const health = await get(entry.remotes[0].url.replace(/\/mcp$/, '/mcp/health'));
  const live = health.status === 200 ? JSON.parse(health.text).version : null;
  line(`Deployed server: ${live ?? `unreachable (${health.status})`}, server.json: ${entry.version}`);
  if (live !== entry.version) { line(`FAIL: deploy ${entry.version} to main before publishing it.`); failed = true; }
}

// The registry can take a minute to index a new version.
let reg = await official();
for (let i = 0; !before && reg.latest !== entry.version && i < 6; i++) { await new Promise(r => setTimeout(r, 10000)); reg = await official(); }
line(`Official MCP Registry: latest ${reg.latest ?? 'none'} (versions: ${reg.versions.join(', ') || 'none'})`);
if (before) {
  if (reg.versions.includes(entry.version)) line(`ALREADY_PUBLISHED: ${entry.version} is in the registry; raise server.json's version to publish again.`);
} else if (reg.latest !== entry.version) { line(`FAIL: the registry's latest is not ${entry.version}.`); failed = true; }

if (!before) for (const [name, url, names] of DIRECTORIES) {
  const {status, text} = await get(url);
  line(`${name}: ${status === 200 && names(text) ? 'listed' : `not listed (${status || 'unreachable'}), submit through its portal`} ${url}`);
}

if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### MCP registries\n\n${report.map(l => `- ${l}`).join('\n')}\n`);
if (process.env.GITHUB_OUTPUT && before) await appendFile(process.env.GITHUB_OUTPUT, `published=${reg.versions.includes(entry.version)}\n`);
process.exit(failed ? 1 : 0);
