// The use-case pages (/use-cases and /use-cases/<slug>, from lib/use-cases.ts), checked in the
// built HTML. Run from web/: npm run build && npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const dist = new URL('../dist/client/', import.meta.url);
const read = (file) => readFile(new URL(file, dist), 'utf8');
const exists = (file) => access(new URL(file, dist)).then(() => true, () => false);
const SITE = 'https://kuchi.kalarislabs.com';

if (!(await exists('use-cases.html'))) {
  throw new Error('web/dist/client/use-cases.html is missing. Run `npm run build` in web/ before `npm test`.');
}

const hub = await read('use-cases.html');
const slugs = [...new Set([...hub.matchAll(/href="\/use-cases\/([\w-]+)"/g)].map((m) => m[1]))];
const pages = await Promise.all(slugs.map(async (slug) => ({ slug, html: await read(`use-cases/${slug}.html`) })));

const main = (html) => html.match(/<main[\s\S]*<\/main>/)[0];
const text = (html) => main(html).replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
const ld = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

// Owner decisions: everything is free, positive messaging; no GitHub links; no shell download
// of SKILL.md; never name upstream component projects or the old music provider.
const BANNED = [
  /pricing/i, /\bpaid\b/i, /\bpro\b/i, /discount/i, /\btrial\b/i, /for now/i, /usage limit/i, /rate limit/i,
  /requests a minute/i, /upgrade/i, /subscription plan/i, /\bpremium tier/i, /epidemic/i, /remocn/i, /snap-?cn/i,
];

test('the hub is indexable and links at least four use cases', () => {
  assert.ok(hub.includes(`<link rel="canonical" href="${SITE}/use-cases">`), 'hub canonical');
  assert.deepEqual(ld(hub).map((x) => x['@type']), ['CollectionPage', 'BreadcrumbList'], 'hub JSON-LD types');
  assert.ok(slugs.length >= 4, `the hub links only ${slugs.length} use cases`);
  assert.ok(!/^Kuchi/i.test(hub.match(/<title>([^<]+)<\/title>/)[1]), 'hub title leads with the product name');
  for (const slug of ['startup-founders', 'product-marketing', 'developers', 'indie-hackers']) assert.ok(slugs.includes(slug), `hub misses ${slug}`);
});

test('every use-case page has a unique title and description, a canonical and the right JSON-LD', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const { slug, html } of pages) {
    const url = `${SITE}/use-cases/${slug}`;
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${slug}: canonical`);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(!titles.has(title), `${slug}: duplicate title`);
    assert.ok(!descriptions.has(description), `${slug}: duplicate description`);
    titles.add(title);
    descriptions.add(description);
    assert.ok(!/^Kuchi/i.test(title), `${slug}: title leads with the product name`);
    assert.ok(title.length <= 90, `${slug}: title is ${title.length} characters`);
    const data = ld(html);
    assert.deepEqual(data.map((x) => x['@type']), ['WebPage', 'HowTo', 'FAQPage', 'BreadcrumbList'], `${slug}: JSON-LD types`);
    assert.equal(data[0].author?.name, 'Sayan Chowdhury', `${slug}: WebPage author`);
    assert.equal(data[1].step.length, 5, `${slug}: HowTo steps`);
    assert.ok(data[2].mainEntity.length >= 5, `${slug}: FAQ`);
    assert.equal(data[3].itemListElement.at(-1).item, url, `${slug}: breadcrumb`);
    assert.ok(html.includes('href="https://kalarislabs.com/team/sayan-chowdhury" rel="author"'), `${slug}: author byline`);
    assert.equal((main(html).match(/<h1\b/g) ?? []).length, 1, `${slug}: one h1`);
    for (const h2 of main(html).match(/<h2\b[^>]*>/g) ?? []) {
      assert.match(h2, /\bid="[\w-]+"/, `${slug}: h2 without an id: ${h2}`);
    }
  }
});

test('use-case pages are long, link real pages and keep the owner rules', async () => {
  for (const { slug, html } of pages) {
    const words = text(html).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
    assert.ok(words >= 1500, `${slug}: only ${words} words`);
    assert.ok((html.match(/class="video-card"/g) ?? []).length >= 6, `${slug}: featured videos`);
    assert.ok(html.includes(`${SITE}/mcp`), `${slug}: MCP URL`);

    const body = main(html);
    const agents = [...new Set([...body.matchAll(/href="\/agents\/([\w-]+)"/g)].map((m) => m[1]))];
    assert.ok(agents.length >= 3, `${slug}: links ${agents.length} agent guides`);
    for (const a of agents) assert.ok(await exists(`agents/${a}.html`), `${slug}: links /agents/${a}, which does not exist`);
    for (const [, kind, name] of body.matchAll(/href="\/(blog|components|videos)\/([\w-]+)"/g)) {
      assert.ok(await exists(`${kind}/${name}.html`), `${slug}: links /${kind}/${name}, which does not exist`);
    }
    assert.ok(/href="\/blog\/[\w-]+"/.test(body), `${slug}: no related posts`);

    const copy = text(html);
    for (const pattern of BANNED) assert.ok(!pattern.test(copy), `${slug}: banned wording ${pattern}`);
    assert.ok(!/<a[^>]+github\.com/.test(body), `${slug}: links GitHub`);
    assert.ok(!/curl[^<]*SKILL\.md|Invoke-WebRequest|\birm\s+https?:/i.test(body), `${slug}: shell skill install`);
  }
});
