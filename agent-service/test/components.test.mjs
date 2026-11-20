import test from 'node:test';
import assert from 'node:assert/strict';
import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {createServer, COMPONENT_PART_LIMIT, INSTRUCTIONS} from '../server.mjs';
import {componentRegistry, loadIndex, loadItem, listComponents, findComponent, splitLines, REGISTRY_URL, registryUrl} from '../components.mjs';
import {FRESH_MS} from '../catalog.mjs';

const SITE = 'https://kuchi.kalarislabs.com';
// The one place a vendored file may credit its source: the licence line inside its content.
const LICENCE = '/*! Portions Copyright (c) 2026 Example Author (upstream-kit). MIT License. See THIRD_PARTY_LICENSES. */';
const UPSTREAM = /upstream-kit/i;

const entry = (name, title, category, extra = {}) => ({name, type:'registry:component', title, description:`${title} animation for launch videos.`, categories:[category],
  dependencies:['remotion'], registryDependencies:[`${SITE}/r/kuchi-ui.json`], files:[{path:`components/kuchi/${name}.tsx`, type:'registry:component', target:`components/kuchi/${name}.tsx`}], ...extra});
const index = {$schema:'https://ui.shadcn.com/schema/registry.json', name:'kuchi', items:[
  entry('text-reveal', 'Text Reveal', 'text'),
  entry('word-captions', 'Word Captions', 'captions', {description:'TikTok-style animated subtitles.'}),
  entry('karaoke-captions', 'Karaoke Captions', 'captions'),
  entry('kuchi-ui', 'Kuchi UI', 'library', {registryDependencies:[], files:[{path:'lib/kuchi-ui/index.ts', type:'registry:lib', target:'lib/kuchi-ui/index.ts'}, {path:'lib/kuchi-ui/timeline.ts', type:'registry:lib', target:'lib/kuchi-ui/timeline.ts'}]})
]};
const longSource = `${LICENCE}\n${Array.from({length:3000}, (_, i) => `export const line${i} = ${i}; // \`\`\`\n`).join('')}`;
const items = {
  'text-reveal':{name:'text-reveal', docs:'Needs a Remotion project.', files:[{path:'components/kuchi/text-reveal.tsx', type:'registry:component', target:'components/kuchi/text-reveal.tsx', content:`${LICENCE}\nexport const TextReveal = () => null;\n`}]},
  'kuchi-ui':{name:'kuchi-ui', files:[{path:'lib/kuchi-ui/index.ts', type:'registry:lib', target:'lib/kuchi-ui/index.ts', content:longSource}, {path:'lib/kuchi-ui/timeline.ts', type:'registry:lib', target:'lib/kuchi-ui/timeline.ts', content:'export {};\n'}]}
};

function site({fail = false} = {}) {
  const urls = [];
  const fetcher = async url => {
    urls.push(url);
    if (fail) throw new Error('site down');
    if (url === REGISTRY_URL) return Response.json(index);
    const name = url.match(/\/r\/([a-z0-9-]+)\.json$/)?.[1];
    return items[name] ? Response.json(items[name]) : new Response('Not found', {status:404});
  };
  return {fetcher, urls};
}

async function connect(components) {
  const server = createServer(async () => { throw new Error('the video catalog is not needed for components'); }, {components});
  const client = new Client({name:'test', version:'1.0.0'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  return {client, close:async () => { await client.close(); await server.close(); }};
}
const call = (client, name, args) => client.callTool({name, arguments:args});
const json = async (client, name, args) => (await call(client, name, {...args, response_format:'json'})).structuredContent;
// Everything an agent sees except the source itself.
const outside = result => JSON.stringify({...result, ...(result.file ? {file:{...result.file, content:null}} : {})});

test('the index and components are read from the site registry and validated', async () => {
  const {fetcher, urls} = site();
  const loaded = await loadIndex(fetcher);
  assert.deepEqual(urls, [`${SITE}/r/registry.json`]);
  assert.equal(loaded.components.length, 4);
  assert.deepEqual(loaded.components[0], {name:'text-reveal', title:'Text Reveal', description:'Text Reveal animation for launch videos.', category:'text',
    dependencies:['remotion'], registry_dependencies:['kuchi-ui'], files:['components/kuchi/text-reveal.tsx']});
  const item = await loadItem('text-reveal', fetcher);
  assert.equal(item.files[0].path, 'components/kuchi/text-reveal.tsx');
  await assert.rejects(loadIndex(async () => Response.json({items:[]})), /schema/);
  await assert.rejects(loadIndex(async () => Response.json({items:[{name:'../etc', title:'x', description:'y'}]})), /invalid/);
  await assert.rejects(loadItem('text-reveal', async () => Response.json({...items['text-reveal'], name:'other'})), /invalid/);
  await assert.rejects(loadItem('missing', fetcher), /unavailable/);
});

test('the registry caches like the catalog and fetches a component only once a minute', async () => {
  let clock = 0;
  const {fetcher, urls} = site();
  const registry = componentRegistry({fetcher, now:() => clock});
  await registry.index(); await registry.index();
  await registry.item('text-reveal'); await registry.item('text-reveal');
  assert.equal(urls.length, 2);
  clock += FRESH_MS;
  await registry.index();
  assert.equal(urls.length, 3);
});

test('listing ranks by keyword, filters by category and leaves library code out by default', async () => {
  const loaded = await loadIndex(site().fetcher);
  const all = listComponents(loaded, {});
  assert.deepEqual(all.components.map(c => c.name), ['text-reveal', 'word-captions', 'karaoke-captions']);
  assert.deepEqual(listComponents(loaded, {query:'captions'}).components.map(c => c.name), ['word-captions', 'karaoke-captions']);
  assert.deepEqual(listComponents(loaded, {query:'tiktok'}).components.map(c => c.name), ['word-captions']);
  assert.deepEqual(listComponents(loaded, {category:'library'}).components.map(c => c.name), ['kuchi-ui']);
  const page = listComponents(loaded, {limit:2});
  assert.deepEqual([page.count, page.total, page.has_more, page.next_offset], [2, 3, true, 2]);
  assert.equal(findComponent(loaded, `${SITE}/r/word-captions.json`).name, 'word-captions');
  assert.equal(findComponent(loaded, `${SITE}/components#cmp-text-reveal`).name, 'text-reveal');
  assert.equal(findComponent(loaded, 'nope'), null);
});

test('long files split on line breaks into parts that rebuild the file', () => {
  const parts = splitLines(longSource, 10_000);
  assert.ok(parts.length > 1 && parts.every(p => p.length <= 10_000));
  assert.equal(parts.join(''), longSource);
  assert.ok(parts.slice(0, -1).every(p => p.endsWith('\n')));
  assert.equal(splitLines('x'.repeat(25), 10).join(''), 'x'.repeat(25));
});

test('the component tools are read-only, titled and validate their input', async () => {
  const {client, close} = await connect(componentRegistry({fetcher:site().fetcher}));
  try {
    const {tools} = await client.listTools();
    for (const name of ['kuchi_list_components', 'kuchi_get_component']) {
      const t = tools.find(x => x.name === name);
      assert.ok(t.title && t.annotations.title === t.title, name);
      assert.deepEqual([t.annotations.readOnlyHint, t.annotations.destructiveHint, t.annotations.openWorldHint, t.annotations.idempotentHint], [true, false, false, true], name);
      assert.equal(t.inputSchema.additionalProperties, false);
      assert.doesNotMatch(t.description, /\byou (must|should)\b/i, 'the description says what the tool does');
    }
    assert.ok(INSTRUCTIONS.includes('kuchi_list_components') && INSTRUCTIONS.includes('kuchi_get_component'));
    // search and fetch keep ChatGPT's shape.
    assert.deepEqual(Object.keys(tools.find(t => t.name === 'search').inputSchema.properties), ['query']);
    assert.deepEqual(Object.keys(tools.find(t => t.name === 'fetch').inputSchema.properties), ['id']);
    // Out-of-range and unknown arguments are repaired and reported, not rejected.
    const bad = await call(client, 'kuchi_get_component', {name:'text-reveal', file:0});
    assert.equal(bad.isError, undefined);
    assert.match(bad.content.at(-1).text, /file: 0 raised to 1/);
    const extra = await call(client, 'kuchi_list_components', {context:'collect me'});
    assert.equal(extra.isError, undefined);
    assert.match(extra.content.at(-1).text, /context: not an argument of this tool/);
  } finally { await close(); }
});

test('kuchi_list_components returns names, install commands and categories, without the video catalog', async () => {
  const {client, close} = await connect(componentRegistry({fetcher:site().fetcher}));
  try {
    const page = await json(client, 'kuchi_list_components', {query:'captions'});
    assert.equal(page.total, 2);
    assert.deepEqual(page.components[0], {name:'word-captions', title:'Word Captions', description:'TikTok-style animated subtitles.', category:'captions',
      registry_url:`${SITE}/r/word-captions.json`, install:`npx shadcn@latest add ${SITE}/r/word-captions.json`, dependencies:['remotion'], registry_dependencies:['kuchi-ui'],
      files:['components/kuchi/word-captions.tsx'], page_url:`${SITE}/components#cmp-word-captions`});
    assert.ok(page.categories.some(c => c.value === 'library'));
    const markdown = (await call(client, 'kuchi_list_components', {})).content[0].text;
    assert.match(markdown, /### Text Reveal \(`text-reveal`\)/);
    assert.match(markdown, /Install: `npx shadcn@latest add https:\/\/kuchi\.kalarislabs\.com\/r\/text-reveal\.json`/);
    assert.doesNotMatch(markdown, UPSTREAM);
  } finally { await close(); }
});

test('kuchi_get_component returns source, dependencies and usage, one file and part at a time', async () => {
  const {client, close} = await connect(componentRegistry({fetcher:site().fetcher}));
  try {
    const one = await json(client, 'kuchi_get_component', {name:'text-reveal'});
    assert.equal(one.registry_url, registryUrl('text-reveal'));
    assert.deepEqual(one.registry_dependencies, ['kuchi-ui']);
    assert.equal(one.usage[0], 'Needs a Remotion project.');
    assert.deepEqual([one.file.index, one.file.part, one.file.parts], [1, 1, 1]);
    assert.equal(one.file.content, items['text-reveal'].files[0].content);
    // The licence line stays inside the file; nothing around it names the upstream project.
    assert.match(one.file.content, UPSTREAM);
    assert.doesNotMatch(outside(one), UPSTREAM);

    const parts = [];
    for (let part = 1; ; part++) {
      const p = await json(client, 'kuchi_get_component', {name:'kuchi-ui', part});
      parts.push(p.file.content);
      assert.ok(p.file.content.length <= COMPONENT_PART_LIMIT);
      if (part === p.file.parts) break;
    }
    assert.ok(parts.length > 1);
    assert.equal(parts.join(''), longSource);
    const md = (await call(client, 'kuchi_get_component', {name:'kuchi-ui'})).content[0].text;
    assert.ok(md.length < 25_000, 'a part fits in one result');
    assert.match(md, /Call again with file=1, part=2/);
    assert.match(md, /````ts\n/, 'the fence outlasts backticks in the source');
    const last = (await call(client, 'kuchi_get_component', {name:'kuchi-ui', part:parts.length})).content[0].text;
    assert.match(last, /Next file: call again with file=2/);
    const second = await json(client, 'kuchi_get_component', {name:`${SITE}/r/kuchi-ui.json`, file:2});
    assert.equal(second.file.path, 'lib/kuchi-ui/timeline.ts');

    // A miss is an answer with the closest names, not a failed call.
    const missing = await call(client, 'kuchi_get_component', {name:'text reveal fx'});
    assert.equal(missing.isError, undefined);
    assert.match(missing.content[0].text, /No Kuchi component is named[\s\S]+text-reveal[\s\S]+kuchi_list_components/);
    const noFile = await call(client, 'kuchi_get_component', {name:'text-reveal', file:3});
    assert.equal(noFile.isError, undefined);
    assert.match(noFile.content[0].text, /You asked for file 3, part 1\. text-reveal has 1 file .+so this is file 1, part 1/);
    assert.match(noFile.content[1].text, /# Text Reveal/);
    const noPart = await call(client, 'kuchi_get_component', {name:'text-reveal', part:2});
    assert.match(noPart.content[0].text, /so this is file 1, part 1/);
  } finally { await close(); }
});

test('an unreachable registry is reported as temporary, not as a missing component', async () => {
  const {client, close} = await connect(componentRegistry({fetcher:site({fail:true}).fetcher}));
  const log = console.error; console.error = () => {};
  try {
    for (const [name, args] of [['kuchi_list_components', {}], ['kuchi_get_component', {name:'text-reveal'}]]) {
      const result = await call(client, name, args);
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /component registry is temporarily unavailable/);
    }
  } finally { console.error = log; await close(); }
});
