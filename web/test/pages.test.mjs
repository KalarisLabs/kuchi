// The built pages, checked against what the scripts and the old site expect.
// Run from web/: npm run build && npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';

const web = new URL('../', import.meta.url);
const dist = new URL('dist/client/', web);
const read = (base, file) => readFile(new URL(file, base), 'utf8');
const exists = (url) => access(url).then(() => true, () => false);

if (!(await exists(new URL('index.html', dist)))) {
  throw new Error('web/dist/client/index.html is missing. Run `npm run build` in web/ before `npm test`.');
}
const index = await read(dist, 'index.html');
// The masthead (header.masthead) was redesigned in web/ on purpose (Kuchi by Kalaris Labs
// lockup) and no longer follows the reference pages, so it is left out of every comparison.
// The footer was redesigned in web/ on purpose too (dark parallax footer on every page,
// including the legal pages, which have none in the reference), so it is left out as well;
// its own content is checked by the footer test below.
const body = (html) => html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1]
  .replace(/<header class="masthead[\s"][\s\S]*?<\/header>/, '')
  .replace(/<footer\b[\s\S]*?<\/footer>/, '')
  // Copy that exists only in web/ on purpose (e.g. the theme-storage note on the privacy
  // page) is marked data-web-only and left out; everything else must match the reference.
  .replace(/<p data-web-only[^>]*>[\s\S]*?<\/p>/g, '');

test('every element id the scripts look up is rendered by the Astro components', async () => {
  for (const file of ['gallery.js', 'connect.js']) {
    const source = await read(web, `src/scripts/${file}`);
    const queried = new Set([...source.matchAll(/\$\('#([\w-]+)'\)|getElementById\('([\w-]+)'\)/g)].map((m) => m[1] ?? m[2]));
    // Ids the script itself writes into the page (dialog contents) are not the components' job.
    const created = new Set([...source.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]));
    for (const id of queried) {
      if (created.has(id)) continue;
      assert.match(index, new RegExp(`\\bid="${id}"`), `${file} needs #${id}, but index.html does not render it`);
    }
  }
  for (const id of ['delta-videos', 'delta-impressions', 'category', 'style', 'sort']) {
    assert.match(index, new RegExp(`\\bid="${id}"`), `index.html is missing #${id}`);
  }
});

test('index.html keeps the structure and copy of the reference page', async () => {
  // .generated/index.html is the old site's page, rebuilt by every `npm run build`.
  const outline = (html) => {
    const tokens = [];
    let skip = null; // text inside these elements is data-driven or script-owned
    const source = body(html)
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '')
      // The hero (section.intro) and the connect section (section.agent-connect) were
      // redesigned in web/ on purpose and no longer follow the reference page; their
      // script-facing ids and links are still checked by the tests above and below.
      .replace(/<section class="intro[\s"][\s\S]*?<\/section>/, '')
      .replace(/<section class="agent-connect[\s"][\s\S]*?<\/section>/, '')
      // The workflow and FAQ sections exist only in web/ (added on the owner's
      // instruction, 2026-11-14); their content is checked by the test further down.
      .replace(/<section class="workflow[\s"][\s\S]*?<\/section>/, '')
      .replace(/<section class="faq[\s"][\s\S]*?<\/section>/, '');
    for (const part of source.split(/(<[^>]+>)/)) {
      const tag = part.match(/^<(\/?)([a-zA-Z][\w-]*)([^>]*)>$/);
      if (!tag) {
        const text = part.replace(/\s+/g, ' ').trim();
        if (text && !skip) tokens.push(`"${text}"`);
        continue;
      }
      const [, closing, name, attributes] = tag;
      if (closing) { if (skip === name) skip = null; continue; }
      if (name === 'option') { skip = 'option'; continue; } // filter options come from the catalog
      const id = attributes.match(/\bid="([^"]*)"/)?.[1];
      const classes = attributes.match(/\bclass="([^"]*)"/)?.[1];
      tokens.push(`<${name}${id ? '#' + id : ''}${classes ? '.' + classes.trim().split(/\s+/).join('.') : ''}>`);
      if (id === 'featured-duration') skip = 'span'; // rendered from the catalog instead of a fixed string
    }
    return tokens;
  };
  assert.deepEqual(outline(index), outline(await read(web, '.generated/index.html')),
    'The built page and the reference page differ in elements, ids, classes or copy. If ../site/index.html changed, port the change into the Astro components.');
});

test('collection totals and filter options come from the catalog', async () => {
  const videos = JSON.parse(await read(dist, 'videos.json'));
  const { compact } = await import(new URL('src/lib/format.js', web));
  assert.match(index, new RegExp(`id="total-videos">${videos.length}<`));
  assert.match(index, new RegExp(`id="result-count"[^>]*>${videos.length}<`));
  assert.ok(index.includes(`id="total-impressions">${compact(videos.reduce((n, v) => n + (v.impressions ?? 0), 0))}<`));
  const options = (id) => [...index.match(new RegExp(`<select id="${id}">([\\s\\S]*?)</select>`))[1].matchAll(/<option(?: value="[^"]*")?>([^<]*)</g)].map((m) => m[1].replace(/&amp;/g, '&'));
  assert.deepEqual(options('category').slice(1), [...new Set(videos.map((v) => v.category))].sort());
  assert.deepEqual(options('style').slice(1), [...new Set(videos.flatMap((v) => v.styles))].sort());
});

test('the featured player starts on the reference the gallery script starts on', async () => {
  const start = Number((await read(web, 'src/scripts/gallery.js')).match(/\n  setFeature\((\d+)\);/)[1]);
  const videos = JSON.parse(await read(dist, 'videos.json'));
  const first = videos.find((v) => v.id === start);
  assert.match(index, new RegExp(`<button data-feature="${start}" aria-pressed="true"`));
  assert.ok(index.includes(`poster="${first.poster}" src="${first.video}"`), 'featured poster/src do not match the catalog');
});

test('quick-connect links keep their clients, schemes and the MCP URL', () => {
  const link = (client) => index.match(new RegExp(`<a class="client-link" data-client="${client}" href="([^"]*)"`))?.[1];
  const prompt = encodeURIComponent('Connect to Kuchi MCP at https://kuchi.kalarislabs.com/mcp.');
  assert.equal(link('claude'), `claude://claude.ai/new?q=${prompt}`);
  assert.equal(link('claude-code'), `claude://code/new?q=${prompt}`);
  assert.equal(link('codex'), `codex://new?prompt=${prompt}`);
  assert.equal(link('cursor'), 'https://cursor.com/en/install-mcp?name=kuchi&amp;config=eyJ1cmwiOiJodHRwczovL2t1Y2hpLmthbGFyaXNsYWJzLmNvbS9tY3AifQ%3D%3D');
  assert.match(index, /<button data-client="more" aria-expanded="false" aria-controls="client-setup">/);
});

test('accessibility features of the old page survive', () => {
  assert.match(index, /<a class="skip-link" href="#archive">/);
  assert.match(index, /id="result-count" role="status" aria-live="polite"/);
  assert.match(index, /id="toast" class="toast" role="status" aria-live="polite"/);
  assert.match(index, /<dialog id="video-dialog" aria-labelledby="dialog-title"/);
  assert.match(index, /<input id="search" type="search"[^>]*aria-label=/);
  assert.match(index, /<html lang="en">/);
});

for (const [file, title, heading] of [['privacy.html', 'Privacy — Kuchi', 'Kuchi privacy'], ['terms.html', 'Terms — Kuchi', 'Kuchi terms'], ['support.html', 'Support — Kuchi', 'Kuchi support']]) {
  test(`${file} keeps the reference page's text`, async () => {
    const built = await read(dist, file);
    assert.ok(built.includes(`<title>${title}</title>`));
    const text = (html) => body(html).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
    assert.ok(text(built).includes(heading));
    assert.equal(text(built), text(await read(web, `.generated/${file}`)),
      `${file} differs from ../site/${file}. If the reference changed, port the change into src/pages.`);
  });
}

test('every page ends with the site footer and its links', async () => {
  for (const file of ['index.html', 'privacy.html', 'terms.html', 'support.html']) {
    const footer = (await read(dist, file)).match(/<footer\b[\s\S]*?<\/footer>/)?.[0] ?? '';
    for (const href of ['/privacy', '/terms', '/support', '/status.html', 'https://x.com/sayanchowdhuryai']) {
      assert.ok(footer.includes(`href="${href}"`), `${file}: the footer does not link ${href}`);
    }
    // Section anchors are same-page on the gallery and point back to it from the legal pages.
    assert.ok(footer.includes(`href="${file === 'index.html' ? '#connect' : '/#connect'}"`), `${file}: wrong connect link in the footer`);
    assert.ok(!footer.includes('github.com'), `${file}: the footer must not link GitHub`);
  }
});

test('owner decisions of 2026-11-14 hold: no GitHub buttons, no shell skill installs, the right X account', () => {
  const hero = index.match(/<section class="intro[\s"][\s\S]*?<\/section>/)[0];
  const connect = index.match(/<section class="agent-connect[\s"][\s\S]*?<\/section>/)[0];
  assert.ok(!hero.includes('github.com'), 'the hero must not carry the "Open source" GitHub button');
  assert.ok(!connect.includes('Source on GitHub'), 'the connect section must not carry "Source on GitHub"');
  assert.ok(!/curl |Invoke-WebRequest|macOS|Windows/.test(connect), 'the macOS/Linux and Windows skill install commands were removed');
  assert.ok(connect.includes('href="https://x.com/sayanchowdhuryai"'));
  assert.ok(!index.includes('x.com/kalarislabs'));
});

test('owner decisions of 2026-11-14: no Collection link, no video count or glow in the footer, workflow removed, SEO FAQ present', async () => {
  const masthead = index.match(/<header class="masthead[\s"][\s\S]*?<\/header>/)[0];
  assert.ok(!/Collection/.test(masthead), 'the "Collection" link was removed from the masthead');
  const videos = JSON.parse(await read(dist, 'videos.json'));
  for (const file of ['index.html', 'privacy.html']) {
    const footer = (await read(dist, file)).match(/<footer\b[\s\S]*?<\/footer>/)[0];
    assert.ok(!new RegExp(`\\b${videos.length} launch videos`).test(footer) && !/\d+ launch videos/.test(footer), `${file}: the footer must not state the number of videos`);
    assert.ok(!footer.includes('footer-glow'), `${file}: the glow behind the footer wordmark was removed`);
    // The wordmark is a canvas, with the live text kept as the no-JavaScript fallback.
    assert.match(footer, /<canvas class="footer-ascii"/);
    assert.match(footer, /class="footer-word"/);
  }
  // Workflow section was removed and replaced by FAQ.
  assert.ok(!index.includes('class="workflow"'), 'the workflow section was removed');
  const faq = index.match(/<section class="faq[\s"][\s\S]*?<\/section>/)?.[0] ?? '';
  assert.ok(faq, 'the FAQ section is present');
  // Verify high-quality, product-specific Q&As covering required topics
  for (const topic of [
    'What is Kuchi?',
    'How do the launch video inspiration templates work?',
    'How does the MCP server connect with AI coding agents',
    'Are the videos real or AI-generated?',
    'What does Kuchi cost?',
  ]) {
    assert.ok(faq.includes(topic), `the FAQ is missing question for ${topic}`);
  }
  // FAQPage JSON-LD structured data for Google rich snippets
  const jsonLdMatch = faq.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch, 'the FAQ section has Schema.org JSON-LD script');
  const schema = JSON.parse(jsonLdMatch[1]);
  assert.equal(schema['@type'], 'FAQPage');
  assert.ok(Array.isArray(schema.mainEntity) && schema.mainEntity.length >= 8, 'FAQPage mainEntity contains questions');
  for (const entry of schema.mainEntity) {
    assert.equal(entry['@type'], 'Question');
    assert.ok(entry.name, 'Question has name');
    assert.equal(entry.acceptedAnswer?.['@type'], 'Answer');
    assert.ok(entry.acceptedAnswer?.text, 'Answer has text');
  }
  // Must not link GitHub
  assert.ok(!/github\.com/.test(faq), 'the FAQ section must not link GitHub');
  // Reachable from the footer of every page, and workflow is no longer linked
  const legalFooter = (await read(dist, 'terms.html')).match(/<footer\b[\s\S]*?<\/footer>/)[0];
  assert.ok(legalFooter.includes('href="/#faq"'), 'the footer links #faq');
  assert.ok(!legalFooter.includes('href="/#workflow"'), 'the footer does not link #workflow');
});

test('the hero agent tile carries every agent logo, the first one visible without JavaScript', () => {
  const tile = index.match(/<span class="logo-cycle"[\s\S]*?<\/span><\/span>/)?.[0] ?? '';
  for (const logo of ['claude', 'chatgpt', 'codex', 'cursor', 'gemini', 'grok']) {
    assert.ok(tile.includes(`/logos/${logo}.svg`), `the hero tile is missing the ${logo} logo`);
  }
  assert.equal(tile.match(/data-state="active"/g)?.length, 1);
  assert.match(tile, /data-state="active"><img src="\/logos\/claude\.svg"/);
});

test('no page references files that do not exist', async () => {
  for (const file of ['index.html', 'privacy.html', 'terms.html', 'support.html']) {
    const html = await read(dist, file);
    assert.ok(!html.includes('/shared/site-header'), `${file} still links the missing /shared/site-header files`);
    for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#?]*)[^"]*"/g)) {
      if (path === '/' || path.startsWith('/agent/')) continue; // /agent/* is served by the MCP Worker
      const candidates = [path.slice(1), `${path.slice(1)}.html`];
      const found = (await Promise.all(candidates.map((c) => exists(new URL(c, dist))))).some(Boolean);
      assert.ok(found, `${file} links ${path}, which is not in the build output`);
    }
  }
});

test('the frontend build stays out of the backend routes and ships no stale copies', async () => {
  const top = await readdir(dist);
  // Owned by the kuchi-agent Worker (agent-service/wrangler.json) or by server routes in this app.
  for (const reserved of ['mcp', 'agent', '.well-known', 'relay', 'assets', 'community']) {
    assert.ok(!top.includes(reserved), `dist/client/${reserved} would shadow a backend route`);
  }
  for (const stale of ['app.js', 'connect.js', 'style.css', 'analytics.mjs', 'analytics-events.mjs', 'daily-stats.mjs']) {
    assert.ok(!top.includes(stale), `dist/client/${stale} is a stale copy of a file Astro now bundles`);
  }
  for (const needed of ['videos.json', 'daily-stats.json', 'llms.txt', 'favicon.svg', 'logos']) {
    assert.ok(top.includes(needed), `dist/client/${needed} is missing`);
  }
});

test('every page has link-preview tags, a canonical URL and an existing preview image', async () => {
  for (const [file, path] of [['index.html', '/'], ['privacy.html', '/privacy'], ['terms.html', '/terms'], ['support.html', '/support']]) {
    const html = await read(dist, file);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://kuchi\.kalarislabs\.com${path.replace('/', '\/')}"`), `${file} canonical`);
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) assert.match(html, new RegExp(`property="${tag}" content="[^"]+"`), `${file} is missing ${tag}`);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    const image = html.match(/property="og:image" content="https:\/\/kuchi\.kalarislabs\.com(\/[^"]+)"/)?.[1];
    assert.ok(image && await exists(new URL(image.slice(1), dist)), `${file}: og:image ${image} is not in the build output`);
  }
});

test('the sitemap lists every page and robots.txt points to it', async () => {
  const sitemap = await read(dist, 'sitemap.xml');
  for (const path of ['/', '/privacy', '/terms', '/support']) assert.ok(sitemap.includes(`<loc>https://kuchi.kalarislabs.com${path}</loc>`), `sitemap is missing ${path}`);
  assert.match(await read(dist, 'robots.txt'), /^Sitemap: https:\/\/kuchi\.kalarislabs\.com\/sitemap\.xml$/m);
});
