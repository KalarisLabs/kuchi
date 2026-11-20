// 1.4.1: the calls that failed in production (PostHog, 2026-11-14 to 11-20)
// are answered, and plans name Kuchi's components and sound cues per shot.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Client, InMemoryTransport} from '@modelcontextprotocol/client';
import {z} from 'zod';
import {createServer} from '../server.mjs';
import {indexBreakdowns} from '../breakdown.mjs';
import {repairArguments, matchEnum} from '../repair.mjs';
import {soundCues} from '../sound.mjs';
import {SHOT_COMPONENTS, STYLE_COMPONENTS, componentsForShot} from '../components.mjs';
import {loadArchive} from '../catalog.mjs';
import {SKILL_NAMES, skillFiles, EXTRA_SKILLS} from '../skill.mjs';
import {readSkills, render} from '../scripts/build-skills.mjs';

const video = (id, extra = {}) => ({id, slug:`demo-${id}`, title:`Demo ${id}`, account:'@demo', category:'AI launch', readmeCategory:'ui',
  styles:['UI motion'], ratio:'16:9', clipSeconds:30, width:1920, height:1080, hasAudio:true, date:`2026-11-${String(id).padStart(2, '0')}`,
  notes:['A cursor glides across a dashboard.'], source:`https://x.com/demo/status/${1000 + id}`, poster:`previews/demo-${id}.jpg`,
  watchUrl:`https://kuchi.kalarislabs.com/assets/${id}.mp4`, detailUrl:`https://kuchi.kalarislabs.com/#video-${id}`, ...extra});
const shot = (n, start, end, enters, motion = 'medium') => ({n, start_s:start, end_s:end, start_frame:start * 30, end_frame:end * 30 - 1, enters, motion, tone:'light', palette:[['#ffffff', 80], ['#ff3355', 12]]});
const raw = {id:1, schema:1, file:'assets/1.mp4', fps:30, frames:900, seconds:30, width:1920, height:1080, shot_changes:5, changes_per_10s:1.67, pace:'medium', average_shot_s:5, theme:'light',
  palette:[['#ffffff', 70], ['#111111', 15], ['#ff3355', 10]], motion_per_second:'0'.repeat(30), loudness_per_second:'5'.repeat(30), silent:false,
  shots:[shot(1, 0, 3, 'start'), shot(2, 3, 8, 'cut', 'high'), shot(3, 8, 14, 'transition'), shot(4, 14, 20, 'hold'), shot(5, 20, 26, 'cut', 'low'), shot(6, 26, 30, 'blank_white')],
  sheets:[{file:'frames/01/overview.jpg', kind:'overview', width:100, height:100, cells:[[1.5, 1], [5.5, 2], [11, 3], [17, 4], [23, 5], [28, 6]]}]};
const archive = {
  ...indexBreakdowns([raw], {}),
  videos:[video(1), video(2, {title:'GitHub stars counter', styles:['Charts']}), video(3)],
  manifest:{schemaVersion:1}, formats:new Map([['ui', 'UI']]), workflow:'# Kuchi workflow', sourceRevision:'a'.repeat(40), fetchedAt:'2026-11-20T00:00:00Z'
};
const names = ['text-reveal', 'screenshot-tour', 'click-type', 'cursor', 'logo-assemble', 'animated-line-chart', 'url-bar-cta'];
const components = {
  index:async () => ({components:names.map(name => ({name, title:name, description:`The ${name} component`, category:'text', dependencies:[], registry_dependencies:[], files:[`components/kuchi/${name}.tsx`]}))}),
  item:async () => ({docs:null, dev_dependencies:[], files:[{path:'components/kuchi/x.tsx', type:'registry:component', content:'export const X = 1;\n'}]})
};

async function connect() {
  const server = createServer(async () => archive, {components});
  const client = new Client({name:'resilience', version:'1'});
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  return {client, close:async () => { await client.close(); await server.close(); }};
}
const call = (client, name, args) => client.callTool({name, arguments:args});
const all = result => result.content.map(c => c.text ?? '').join('\n');
const analysis = [[1, 'title_card'], [2, 'ui_screen'], [3, 'ui_closeup'], [4, 'chart'], [5, 'logo'], [6, 'end_card']].map(([shot, kind]) => ({shot, kind}));

test('every call that failed in production is now answered', async () => {
  const {client, close} = await connect();
  try {
    const cases = [
      // kuchi_get_video, 80%: registry health checks probing with words.
      ['kuchi_get_video', {reference:'github'}],
      ['kuchi_get_video', {reference:'hello'}],
      // kuchi_get_breakdown: a guessed argument name.
      ['kuchi_get_breakdown', {video_id:'1'}],
      // kuchi_list_components: limit over the maximum.
      ['kuchi_list_components', {limit:100}],
      // kuchi_suggest_templates: over-long text and asset kinds outside the enum.
      ['kuchi_suggest_templates', {looking_for:'x'.repeat(420), available_assets:['logo', 'screenshots', 'demo video', 'brand guidelines']}],
      // kuchi_plan_remake: no product_name, a nested product object, an over-long shows, over-long features and tone, assets as strings.
      ['kuchi_plan_remake', {reference:'1', product:{name:'Acme', description:'Ships invoices'}, shot_analysis:[{shot:1, kind:'title_card', shows:'y'.repeat(260)}]}],
      ['kuchi_plan_remake', {reference:'1', product_name:'Acme', key_features:['z'.repeat(150)], tone:'t'.repeat(130)}],
      ['kuchi_plan_remake', {reference:'1', product_name:'Acme', assets:['logo.svg', 'dashboard screenshot', 'demo.mp4', 'launch track.mp3', 'brand book']}],
      ['kuchi_plan_remake', {reference:'1'}],
      // kuchi_check_remake: assets with a description, entrances outside the enum, no product_name.
      ['kuchi_check_remake', {reference:'1', shots:[{start_s:0, end_s:3, enters:'fade', assets:[{kind:'image', source:'provided', description:'Hero'}]}, {start_s:3, end_s:8, enters:'hard cut'}]}],
      ['kuchi_check_remake', {reference:'1', product_name:'Acme', shots:[{start_s:0, end_s:3, enters:'whip pan', assets:[{kind:'logo', source:'user', description:'Logo'}]}]}]
    ];
    for (const [tool, args] of cases) {
      const result = await call(client, tool, args);
      assert.notEqual(result.isError, true, `${tool} ${JSON.stringify(args).slice(0, 80)}: ${all(result).slice(0, 300)}`);
    }
    const probe = all(await call(client, 'kuchi_get_video', {reference:'github'}));
    assert.match(probe, /Closest videos:\n- id 2: GitHub stars counter/);
    const nested = all(await call(client, 'kuchi_plan_remake', {reference:'1', product:{name:'Acme', description:'Ships invoices'}, response_format:'json'}));
    assert.match(nested, /"name": "Acme"/); assert.match(nested, /"description": "Ships invoices"/);
    const strings = all(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', assets:['logo.svg', 'dashboard screenshot'], response_format:'json'}));
    assert.match(strings, /"kind": "logo"/); assert.match(strings, /"kind": "screenshot"/);
    const nameless = all(await call(client, 'kuchi_plan_remake', {reference:'1'}));
    assert.match(nameless, /\*\*Required\*\*: What is the product called\?/);
  } finally { await close(); }
});

test('repair keeps strict schemas and reports what it changed', () => {
  const schema = z.toJSONSchema(z.strictObject({
    reference:z.string().max(20), count:z.number().int().min(1).max(6).default(3),
    tags:z.array(z.enum(['logo', 'screenshot', 'other'])).max(2).optional(),
    shots:z.array(z.strictObject({shot:z.number().int().min(1), kind:z.enum(['title_card', 'ui_screen'])})).optional()
  }), {io:'input'});
  const {args, notes} = repairArguments(schema, {videoId:34, count:'9', tags:'logo, screenshot, pdf', shots:[{shot:'2', kind:'UI'}, {shot:3, kind:'mystery'}], extra:1});
  assert.deepEqual(args, {reference:'34', count:6, tags:['logo', 'screenshot'], shots:[{shot:2, kind:'ui_screen'}]});
  assert.ok(notes.some(n => /videoId read as reference/.test(n)));
  assert.ok(notes.some(n => /extra: not an argument/.test(n)));
  assert.ok(notes.some(n => /shots\[1\]\.kind: "mystery" is not one of/.test(n)), 'an entry with an unknown required kind is left out');
  // Nothing to repair: nothing changes and nothing is said.
  assert.deepEqual(repairArguments(schema, {reference:'34'}), {args:{reference:'34'}, notes:[]});
  assert.equal(matchEnum(['cut', 'transition', 'hold', 'blank_black', 'blank_white'], 'Cross Fade'), 'transition');
  assert.equal(matchEnum(['cut', 'transition', 'hold', 'blank_black', 'blank_white'], 'dip to black'), 'blank_black');
  assert.equal(matchEnum(['dark', 'light', 'mixed'], 'purple'), undefined);
});

test('plans name Kuchi components and a sound cue per shot, and point to the build skills', async () => {
  const {client, close} = await connect();
  try {
    const plan = JSON.parse(all(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', shot_analysis:analysis, response_format:'json'})).split('\nKuchi adjusted')[0]);
    const byKind = Object.fromEntries(plan.blueprint.shots.map(s => [s.kind, s]));
    // Only names the live registry holds, best fit first; the UI style puts nothing extra first here.
    assert.deepEqual(byKind.title_card.components, ['text-reveal']);
    assert.deepEqual(byKind.ui_closeup.components, ['click-type', 'cursor']);
    assert.deepEqual(byKind.end_card.components, ['url-bar-cta']);
    assert.deepEqual([plan.build.width, plan.build.height, plan.build.fps, plan.build.duration_in_frames], [1920, 1080, 30, 900]);
    assert.equal(plan.sound.mode, 'sfx');
    assert.deepEqual(plan.sound.levels, {integrated_lufs:-14, true_peak_dbtp:-1, music_bed_under_sfx_db:-8, music_under_voice_db:-12});
    // The cues follow the measured entrances and the shot kinds.
    const cues = plan.blueprint.shots.map(s => s.sound ?? null);
    assert.equal(cues[0], null, 'the first shot has no entrance to mark');
    assert.deepEqual(cues[1], {cue:'hit', at_frame:90}, 'a cut on high motion hits');
    assert.deepEqual(cues[2], {cue:'whoosh', at_frame:240, lead_frames:9, within:'clicks'}, 'a transition whooshes; clicks inside a UI close-up');
    assert.deepEqual(cues[3], {within:'riser'}, 'a hold has no hit; the chart rises');
    assert.equal(cues[4].cue, 'reveal');
    assert.equal(cues[5].cue, 'reveal');
    assert.match(plan.build.remotion, /kuchi_get_skill with name="kuchi-remotion"/);
    assert.match(plan.sound.how, /name="kuchi-sound"[\s\S]+name="kuchi-audio-check"/);
    const ready = JSON.parse(all(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', product_description:'Invoices in one click', key_features:['Send'], call_to_action:'acme.com',
      assets:[{kind:'logo', description:'Logo'}, {kind:'screenshot', description:'Dashboard'}], shot_analysis:analysis, response_format:'json'})));
    assert.equal(ready.ready, true);
    assert.ok(ready.next_steps.some(s => /kuchi-remotion/.test(s) && /kuchi-sound/.test(s)));
    assert.ok(ready.next_steps.some(s => /kuchi-audio-check/.test(s)));
    const md = all(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', shot_analysis:analysis}));
    assert.match(md, /- Components: `click-type`, `cursor`/);
    assert.match(md, /- Sound: whoosh at frame 240 \(start it 9 frames earlier so it peaks there\); clicks inside the shot/);
    assert.match(md, /## Build\n- Composition: 1920x1080, 30 fps, 900 frames\./);
    // Silent plans carry no cues, and the user's own track becomes the default when they gave one.
    const silent = JSON.parse(all(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', shot_analysis:analysis, sound:'silent', response_format:'json'})));
    assert.equal(silent.blueprint.shots.some(s => s.sound), false);
    const own = JSON.parse(all(await call(client, 'kuchi_plan_remake', {reference:'1', product_name:'Acme', assets:[{kind:'music', description:'Our anthem'}], response_format:'json'})));
    assert.equal(own.sound.mode, 'user_track');
  } finally { await close(); }
});

test('sound cues closer than a third of a second keep only the stronger one', () => {
  const shots = [
    {shot:1, start_frame:0, enters:'start', motion:'high'},
    {shot:2, start_frame:30, enters:'cut', motion:'low'},
    {shot:3, start_frame:35, enters:'transition', motion:'high'},
    {shot:4, start_frame:38, enters:'cut', motion:'high'},
    {shot:5, start_frame:90, enters:'cut', motion:'high', kind:'logo'}
  ];
  const cues = soundCues(shots, 30, 'sfx');
  assert.deepEqual([...cues.keys()], [3, 5]);
  assert.equal(cues.get(5).cue, 'reveal');
  assert.equal(soundCues(shots, 30, 'silent').size, 0);
});

test('every component a plan can name is in the published registry', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../web/src/registry/manifest.json', import.meta.url), 'utf8'));
  const published = new Set(manifest.map(i => i.name));
  for (const name of [...Object.values(SHOT_COMPONENTS), ...Object.values(STYLE_COMPONENTS)].flat()) assert.ok(published.has(name), name);
  assert.deepEqual(componentsForShot('ui_screen', ['Terminal'], null, 2), ['terminal-simulator', 'terminal-session']);
  assert.deepEqual(componentsForShot(undefined), []);
});

test('the build skills are bundled, served by kuchi_get_skill and in step with agent/skills', async () => {
  assert.equal(render(await readSkills()), await readFile(new URL('../skills.generated.mjs', import.meta.url), 'utf8'), 'run npm run build:skills');
  for (const [name, files] of Object.entries(EXTRA_SKILLS)) {
    const plugin = await readFile(new URL(`../../plugin/launch-archive/skills/${name}/SKILL.md`, import.meta.url), 'utf8');
    assert.equal(plugin.replace(/\r\n/g, '\n'), files['SKILL.md'], `${name} plugin copy`);
    assert.match(files['SKILL.md'], new RegExp(`^---\\nname: ${name}\\ndescription: .{80,1024}\\n---\\n`), `${name} frontmatter`);
    assert.doesNotMatch(files['SKILL.md'], /epidemic/i);
  }
  assert.deepEqual(SKILL_NAMES, ['kuchi', 'kuchi-audio-check', 'kuchi-product-launch-video', 'kuchi-remotion', 'kuchi-sound']);
  const {client, close} = await connect();
  try {
    const remotion = await call(client, 'kuchi_get_skill', {name:'kuchi-remotion'});
    assert.equal(remotion.content[0].text, skillFiles('kuchi-remotion')['SKILL.md'].trim());
    assert.match(remotion.content[0].text, /overrideWebpackConfig[\s\S]+"@": path\.join/);
    const guessed = await call(client, 'kuchi_get_skill', {name:'sound'});
    assert.notEqual(guessed.isError, true);
    assert.match(guessed.content[0].text, /^---\nname: kuchi-sound/);
  } finally { await close(); }
});

test('a cold isolate falls back to the GitHub API, then to the last good commit, when GitHub refs fail', async () => {
  const sha = 'b'.repeat(40);
  const files = {'data/videos.json':JSON.stringify([video(1)]), 'agent/manifest.json':'{"schemaVersion":1}', 'agent/workflow.md':'# W'};
  const store = new Map();
  const cache = {match:async key => store.has(key) ? new Response(store.get(key)) : undefined, put:async (key, r) => { store.set(key, await r.text()); }};
  let api = true;
  const fetcher = async url => {
    if (url.includes('info/refs')) return new Response('down', {status:503});
    if (url.includes('api.github.com')) return api ? new Response(sha) : new Response('down', {status:503});
    const path = Object.keys(files).find(p => url.endsWith(`/${sha}/${p}`));
    return path ? new Response(files[path]) : new Response('missing', {status:404});
  };
  assert.equal((await loadArchive(fetcher, {cache})).sourceRevision, sha, 'the API answers when refs do not');
  // Both down: the shared "main is at" answer expires, the last good commit still serves.
  api = false;
  for (const key of store.keys()) if (key.endsWith('/main')) store.delete(key);
  const quiet = console.error; console.error = () => {};
  try { assert.equal((await loadArchive(fetcher, {cache})).sourceRevision, sha); } finally { console.error = quiet; }
});
