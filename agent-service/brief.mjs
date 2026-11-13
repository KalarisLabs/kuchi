// Turns a Kuchi reference plus the caller's own product details into a remake
// brief. The reference contributes motion and taste: timing, how shots enter,
// how much moves, layout and color balance. Every piece of content comes from
// the caller. Missing inputs are listed with a question to ask the user.
//
// Kuchi measures the reference. What each shot shows is read from the frames
// by the calling agent and passed in as `shot_analysis`; a curator's reviewed
// label, where one exists, takes its place.
import {SHOT_KINDS, UI_KINDS, LEGEND, colorRoles, sheetUrl, shotFrames, plainLine} from './breakdown.mjs';

export const ASSET_KINDS = ['logo', 'screenshot', 'screen_recording', 'product_photo', 'illustration', 'music', 'voiceover', 'font', 'other'];
export const ENTRANCES = Object.keys(LEGEND.enters).filter(e => e !== 'start');

// Styles whose shots are built from real product UI.
const UI_STYLES = new Set(['UI motion', 'Device motion', 'Cursor demo', 'Terminal', 'Charts', 'Data graphics']);
const MAX_BLUEPRINT_SHOTS = 40;
const MAX_COMPARE_FRAMES = 40;

export const GUARDRAILS = [
  'Replicate motion and taste, not content: timing, beat order, how each shot enters, how much of the frame moves, camera moves, layout, type hierarchy and color balance.',
  "Never reuse the reference's logo, product UI, footage, characters, illustrations, music, voiceover, copy or claims. The original creator owns them. Don't trace or redraw them either.",
  "Every product shot, name, feature, number and claim comes from the user's assets and answers. Never invent features, metrics, customer logos or testimonials.",
  "If an asset is missing, use a clearly marked placeholder and say so. Don't fake a UI that doesn't exist.",
  "Use the user's brand colors in the reference's color roles (background, secondary, accent). Don't copy the reference's exact colors unless they are the user's own.",
  'Kuchi does not render videos or grant rights to any asset. Use your own tools to build the video.'
];

const has = (assets, ...kinds) => assets.some(a => kinds.includes(a.kind));
const round = n => Math.round(n * 10) / 10;
const precise = n => Math.round(n * 1000) / 1000;
const median = values => { const v = [...values].sort((a, b) => a - b); return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2; };

// A generic launch arc scaled to the target length, for references that have
// no measured breakdown yet.
function beatSheet(seconds, features) {
  const shown = features.length ? features.slice(0, 3) : ['Key feature'];
  const beats = [
    ['Hook', 0.1, 'Open on the strongest visual idea borrowed from the reference.'],
    ['Context', 0.15, 'The problem or moment the product answers, in a few words.'],
    ['Reveal', 0.15, 'Logo and product name in, using the reference\'s reveal transition.'],
    ...shown.map(f => [`Feature: ${f}`, 0.45 / shown.length, 'Real UI or product shot from the user\'s assets.']),
    ['Proof', 0.05, 'Only proof the user supplied (a real metric, quote or result), otherwise skip this beat.'],
    ['Call to action', 0.1, 'Logo lockup, call to action and URL.']
  ];
  let t = 0;
  return beats.map(([beat, share, direction]) => {
    const start = t;
    t += share * seconds;
    return {beat, start_s:round(start), end_s:round(t), direction};
  });
}

// Evenly spaced picks that always keep the first and last item.
function spread(items, count) {
  if (count >= items.length) return items;
  if (count <= 1) return [items.at(-1)];
  return Array.from({length:count}, (_, i) => items[Math.round(i * (items.length - 1) / (count - 1))]);
}

// What each reference shot shows: the agent's own reading of the frames, with
// a curator's reviewed label taking its place where one exists.
function shotKindsFor(b, labels, analysis = []) {
  const numbers = new Set(b.shots.map(s => s.n));
  const known = new Map();
  for (const a of analysis) if (numbers.has(a.shot)) known.set(a.shot, {kind:a.kind, shows:plainLine(a.shows ?? ''), source:'yours'});
  for (const [n, label] of labels?.shots ?? []) known.set(n, {...label, source:'reviewed'});
  return known;
}

// The reference's real shots, re-timed to the target length on whole frames,
// each with the user's content that replaces what the reference shows.
function blueprint(b, known, input, seconds) {
  const fps = input.fps ?? b.fps;
  const ratio = seconds / b.seconds;
  // Close to the reference's length: keep every shot and stretch. Much shorter:
  // keep the rhythm and drop shots instead of speeding everything up.
  const stretch = ratio >= 0.75;
  const kept = stretch ? b.shots : spread(b.shots, Math.max(3, Math.round(b.shots.length * ratio)));
  const total = kept.reduce((n, s) => n + (s.end_s - s.start_s), 0);
  const scale = seconds / total;
  const features = input.key_features ?? [];
  const label = s => known.get(s.n);
  const uiShots = kept.filter(s => UI_KINDS.includes(label(s)?.kind) || label(s)?.kind === 'chart');
  const featureFor = s => features.length ? features[Math.min(features.length - 1, Math.floor(uiShots.indexOf(s) * features.length / uiShots.length))] : null;
  const name = input.product_name;
  const frames = shotFrames(b).seen;
  let t = 0, frame = 0, textShots = 0;
  const shots = kept.map((s, i) => {
    const startFrame = frame;
    t += (s.end_s - s.start_s) * scale;
    // Every shot starts on a whole frame and lasts at least one.
    frame = Math.max(startFrame + 1, Math.round(t * fps));
    const start = startFrame / fps, end = frame / fps;
    const l = label(s);
    let fill = "Not analysed yet. Look at this shot's frame in the storyboard, then put the user's equivalent content in the same place.";
    if (l) {
      fill = SHOT_KINDS[l.kind].fill;
      if (UI_KINDS.includes(l.kind) || l.kind === 'chart') {
        const feature = featureFor(s);
        if (feature) fill = `${name}: "${feature}". ${fill}`;
      } else if (l.kind === 'title_card' || l.kind === 'kinetic_type') {
        const next = kept.slice(i + 1).find(x => uiShots.includes(x));
        const feature = next && featureFor(next);
        fill = textShots++ === 0 ? `A short line saying what ${name} does, in the user's words. ${fill}`
          : feature ? `A headline for "${feature}". ${fill}` : fill;
      } else if (l.kind === 'logo') fill = `The ${name} logo.`;
      else if (l.kind === 'end_card') fill = `The ${name} logo${input.call_to_action ? ` and "${input.call_to_action}"` : ', the call to action and URL'}.`;
    }
    const seen = frames.get(s.n);
    return {
      shot:i + 1, start_s:precise(start), end_s:precise(end), start_frame:startFrame, end_frame:frame - 1,
      reference_shot:s.n, reference_start_s:s.start_s, reference_end_s:s.end_s,
      // The same moment in both videos: the reference frame on the storyboard, and where it falls in the remake.
      ...(seen ? {storyboard_frame_s:seen.s, storyboard_sheet:seen.sheet, compare_at_s:precise(start + (seen.s - s.start_s) / (s.end_s - s.start_s) * (end - start))} : {}),
      enters:s.enters, motion:s.motion, tone:s.tone,
      ...(l ? {kind:l.kind, reference_shows:[SHOT_KINDS[l.kind].name, l.shows].filter(Boolean).join('. ')} : {}),
      your_content:fill
    };
  });
  const analysed = shots.filter(s => s.kind).length;
  const times = `${Math.round(scale * 100) / 100}x`;
  // Long references come one page of shots at a time, so none is dropped to fit a result.
  const offset = Math.min(input.shot_offset ?? 0, shots.length);
  const page = shots.slice(offset, offset + Math.min(input.shot_limit ?? MAX_BLUEPRINT_SHOTS, MAX_BLUEPRINT_SHOTS));
  const next = offset + page.length;
  return {
    mode:stretch ? 'retimed' : 'condensed',
    fps, frames:frame,
    precision:analysed === shots.length ? 'analysed' : analysed ? 'partly_analysed' : 'timing_only',
    note:stretch ? `Every reference shot, re-timed by ${times} to fit ${seconds}s at ${fps} fps.`
      : `The reference runs ${b.seconds}s. To fit ${seconds}s, this keeps ${shots.length} of its ${b.shots.length} shots, evenly spaced and re-timed by ${times}, instead of speeding every shot up.`,
    without_kind:shots.filter(s => !s.kind).map(s => s.reference_shot),
    shot_page:{offset, count:page.length, total:shots.length, has_more:next < shots.length, ...(next < shots.length ? {next_offset:next} : {})},
    shots:page
  };
}

export function planRemake(video, input, b = null, labels = null) {
  const assets = input.assets ?? [];
  const features = input.key_features ?? [];
  const name = input.product_name;
  const known = b ? shotKindsFor(b, labels, input.shot_analysis) : new Map();
  const kinds = [...known.values()].map(k => k.kind);
  const count = (...wanted) => kinds.filter(k => wanted.includes(k)).length;
  const needsUi = kinds.length ? count(...UI_KINDS) > 0 : video.styles.some(s => UI_STYLES.has(s));
  const missing = [];
  const need = (field, question, required = true) => missing.push({field, required, question});
  const size = video.width && video.height ? `${video.width}x${video.height} or larger` : 'full resolution';

  if (!input.product_description) need('product_description', `In one or two sentences, what does ${name} do and who is it for?`);
  if (!features.length) need('key_features', 'Which 1 to 3 features or moments should the video show?');
  if (!has(assets, 'logo')) need('assets.logo', `Can you share the ${name} logo (SVG or transparent PNG)?`);
  if (needsUi && !has(assets, 'screenshot', 'screen_recording')) {
    const ui = count(...UI_KINDS);
    need('assets.screenshot', ui
      ? `This reference shows product UI in ${ui} of its ${b.shots.length} shots. Can you share screenshots or screen recordings of ${name}, one for each feature (${size}, ${b.theme === 'dark' ? 'dark mode if you have it' : b.theme === 'light' ? 'light mode if you have it' : 'either theme'})?`
      : `This reference is built from product UI. Can you share screenshots or screen recordings of ${name} for each feature?`);
  }
  if (!input.call_to_action) need('call_to_action', 'What should the video end on: a URL, "Try it free", a launch date, or something else?');
  if (count('product_render') && !has(assets, 'product_photo')) need('assets.product_photo', `The reference shows a physical product. Do you have photos or renders of ${name}?`, false);
  if (count('character') && !has(assets, 'illustration')) need('assets.illustration', `The reference uses a character. Do you have your own mascot or illustration? Otherwise I'll use your logo mark there.`, false);
  if (count('live_action') && !has(assets, 'product_photo', 'other')) need('assets.footage', 'The reference uses filmed footage. Do you have your own footage or photos to use?', false);
  if (count('chart')) need('proof', `The reference shows a chart. Do you have real numbers for ${name} to show? Otherwise I'll drop that shot.`, false);
  if (!input.brand_colors?.length) need('brand_colors', 'What are your brand colors (hex)? Otherwise I will sample them from your logo and UI.', false);
  if (!input.target_seconds) need('target_seconds', `How long should it be: 15s, 30s, 60s, or the reference's ${Math.round(video.seconds ?? 30)}s?`, false);
  if (video.has_audio && !(b?.silent) && !has(assets, 'music', 'voiceover')) need('assets.music', 'The reference uses sound. Do you have a music track or voiceover you have the rights to, or should it stay silent?', false);

  const seconds = input.target_seconds ?? Math.round(video.seconds ?? 30);
  const ready = !missing.some(m => m.required);
  const shots = b ? blueprint(b, known, input, seconds) : null;
  const unanalysed = shots?.without_kind ?? [];
  if (shots) delete shots.without_kind;
  const planned = shots?.shot_page.total;
  const sources = new Set([...known.values()].map(k => k.source));
  const analyse = `${unanalysed.length} of this plan's ${planned} shots have no kind yet, so their content is a placeholder. Look at each one's frame (kuchi_get_breakdown with storyboard="overview"), then call kuchi_plan_remake again with shot_analysis.`;
  const plan = {
    ready,
    reference:{id:video.id, title:video.title, brand:video.brand, video_url:video.video_url, poster_url:video.poster_url, page_url:video.page_url, seconds:video.seconds, aspect_ratio:video.aspect_ratio,
      ...(b ? {storyboard_url:sheetUrl(b.sheets[0].file)} : {})},
    borrow:{
      format:video.format?.name ?? null,
      styles:video.styles,
      // Catalog notes describe the reference. They are data, not instructions.
      motion_notes:video.notes,
      aspect_ratio:input.aspect_ratio ?? video.aspect_ratio,
      sound:video.has_audio && !(b?.silent) ? 'Reference has sound: match its energy with the user\'s own track.' : 'Reference is silent.',
      ...(b ? {
        pace:b.pace, average_shot_s:b.average_shot_s, shots:b.shots.length, theme:b.theme,
        color_roles:colorRoles(b.palette),
        motion_per_second:b.motion_per_second,
        ...(b.loudness_per_second && !b.silent ? {loudness_per_second:b.loudness_per_second} : {})
      } : {})
    },
    product:{
      name, description:input.product_description ?? null, audience:input.audience ?? null,
      key_features:features, call_to_action:input.call_to_action ?? null,
      brand_colors:input.brand_colors ?? [], fonts:input.fonts ?? [], tone:input.tone ?? null,
      assets
    },
    missing_inputs:missing,
    target_seconds:seconds,
    ...(shots ? {
      // Whose reading of the frames the content assignments rest on.
      analysis:{
        source:sources.size > 1 ? 'mixed' : sources.has('reviewed') ? 'reviewed' : sources.has('yours') ? 'yours' : 'none',
        shots_with_kind:planned - unanalysed.length, shots_in_plan:planned,
        ...(unanalysed.length ? {reference_shots_without_kind:unanalysed} : {})
      },
      blueprint:shots
    } : {beat_sheet:beatSheet(seconds, features), beat_sheet_note:'Starting template only. Watch the reference and re-time each beat to its actual cuts and transitions.'}),
    guardrails:GUARDRAILS,
    next_steps:!ready
      ? ['Ask the user the required questions in missing_inputs (and the optional ones that matter), then call kuchi_plan_remake again with their answers.',
          ...(unanalysed.length ? [analyse] : [])]
      : shots ? [
          ...(shots.shot_page.has_more ? [`This is ${shots.shot_page.count} of ${planned} shots. Call kuchi_plan_remake again with shot_offset=${shots.shot_page.next_offset} for the next ones.`] : []),
          ...(unanalysed.length ? [analyse] : ['Open the storyboard (kuchi_get_breakdown with storyboard="overview") and look again at each shot you are about to rebuild.']),
          `Build shot by shot from the blueprint at ${shots.fps} fps: the same start_frame and end_frame, entrance and amount of motion, with the user's content in place of the reference's.`,
          'Before delivering, call kuchi_check_remake with your shot list, giving each shot its reference_shot. Then compare your frames with the reference at the times it returns.',
          'Tell the user what differs from the reference and anything you used a placeholder for.'
        ] : [
          'Watch the reference video end to end and note each cut, transition and timing.', 'Re-time the beat sheet to match it.',
          "Build the video with your own tools, using only the user's assets.",
          'Before delivering, call kuchi_check_remake with your shot list, and compare your output with the reference side by side.'
        ]
  };
  return plan;
}

export function planMarkdown(plan) {
  const r = plan.reference;
  const b = plan.borrow;
  const lines = [
    `# Remake plan: ${plan.product.name}, inspired by "${r.title}" (${r.id})`,
    '',
    plan.ready ? '**Ready to build.**' : '**Not ready yet.** Ask the user for the required inputs below first.',
    '',
    `Reference: ${r.page_url} (${r.seconds ?? '?'}s, ${r.aspect_ratio ?? '?'})`,
    `Video file: ${r.video_url}`,
    ...(r.storyboard_url ? [`Storyboard: ${r.storyboard_url}`] : []),
    ''
  ];
  if (plan.missing_inputs.length) {
    lines.push('## Ask the user');
    for (const m of plan.missing_inputs) lines.push(`- ${m.required ? '**Required**' : 'Optional'}: ${m.question}`);
    lines.push('');
  }
  lines.push('## Borrow from the reference (motion and taste only)',
    `- Format: ${b.format ?? 'n/a'}`,
    `- Styles: ${b.styles.join(', ')}`,
    `- Aspect ratio: ${b.aspect_ratio ?? 'n/a'}`,
    `- Sound: ${b.sound}`);
  if (b.pace) lines.push(
    `- Rhythm: ${b.pace} pace, ${b.shots} shots, average ${b.average_shot_s}s each, ${b.theme} theme`,
    `- Color roles to fill with the user's brand colors: ${b.color_roles.map(c => `${c.role} ${c.share_percent}% (${c.character})`).join('; ')}`,
    `- Motion per second, 0-9: ${b.motion_per_second}`,
    ...(b.loudness_per_second ? [`- Loudness per second, 0-9: ${b.loudness_per_second} (place your own track's hits on the peaks)`] : []));
  lines.push(...b.motion_notes.map(n => `- Motion note: ${n}`), '');
  if (plan.blueprint) {
    const a = plan.analysis;
    const p = plan.blueprint.shot_page;
    lines.push(`## Shot blueprint (${plan.target_seconds}s, ${plan.blueprint.mode})`, `_${plan.blueprint.note}_`,
      ...(p.count < p.total ? [`Shots ${p.offset + 1} to ${p.offset + p.count} of ${p.total}.${p.has_more ? ` More: call again with shot_offset=${p.next_offset}.` : ''}`] : []),
      `${plan.blueprint.frames} frames at ${plan.blueprint.fps} fps. Shot analysis: ${a.shots_with_kind} of ${a.shots_in_plan} shots have a kind (${a.source === 'none' ? 'none sent yet' : a.source === 'yours' ? 'from your shot_analysis' : a.source === 'reviewed' ? 'reviewed by Kuchi' : 'yours and Kuchi\'s'}).`, '');
    for (const s of plan.blueprint.shots) lines.push(
      `- **${s.shot}** ${s.start_s}s to ${s.end_s}s (frames ${s.start_frame}-${s.end_frame}) · enters: ${s.enters} · motion: ${s.motion} · ${s.tone} · reference shot ${s.reference_shot} (${s.reference_start_s}s to ${s.reference_end_s}s)` +
      (s.compare_at_s !== undefined ? `\n  - Compare: your frame at ${s.compare_at_s}s with the reference at ${s.storyboard_frame_s}s (${s.storyboard_sheet} sheet)` : '') +
      (s.reference_shows ? `\n  - Reference shows: ${s.reference_shows}` : '') + `\n  - Your content: ${s.your_content}`);
  } else {
    lines.push(`## Beat sheet (${plan.target_seconds}s)`, `_${plan.beat_sheet_note}_`, '',
      ...plan.beat_sheet.map(x => `- ${x.start_s}s to ${x.end_s}s, **${x.beat}**: ${x.direction}`));
  }
  lines.push('', '## Rules', ...plan.guardrails.map(g => `- ${g}`), '', '## Next steps', ...plan.next_steps.map((s, i) => `${i + 1}. ${s}`));
  return lines.join('\n');
}

// A self-check for a finished or drafted remake. Flags reuse of the reference's
// brand, assets the user didn't supply, and drift from the reference's timing.
const STOP = new Set(['launch', 'video', 'demo', 'intro', 'introducing', 'online', 'product', 'with', 'from', 'your', 'this', 'that', 'the', 'and', 'for', 'new', 'now', 'study', 'motion', 'film', 'teaser', 'trailer', 'feature', 'update']);

// Compares each reported shot with the reference shot it rebuilds. The remake
// may run at a different length, so shots are judged against the reference
// scaled by the remake's own typical ratio.
function checkTiming(b, shots, add) {
  const byNumber = new Map(b.shots.map(s => [s.n, s]));
  const pairs = [];
  shots.forEach((s, i) => {
    if (s.reference_shot === undefined) return;
    const r = byNumber.get(s.reference_shot);
    if (!r) return add('error', i + 1, `reference_shot ${s.reference_shot} is not a shot of this reference.`, `Use a shot number from 1 to ${b.shots.length} (kuchi_get_breakdown lists them).`);
    if (s.end_s > s.start_s) pairs.push({n:i + 1, s, r, seconds:s.end_s - s.start_s, reference:r.end_s - r.start_s});
  });
  if (!pairs.length) return null;
  const scale = median(pairs.map(p => p.seconds / p.reference));
  let late = 0, worst = 0;
  for (const p of pairs) {
    const expected = p.reference * scale;
    const drift = p.seconds - expected;
    worst = Math.max(worst, Math.abs(drift));
    if (Math.abs(drift) > Math.max(0.1, expected * 0.1)) {
      late++;
      add('warning', p.n, `It runs ${precise(p.seconds)}s. Reference shot ${p.r.n}, at your video's scale, runs ${precise(expected)}s.`, `${drift > 0 ? 'Shorten' : 'Lengthen'} it by ${precise(Math.abs(drift))}s, or tell the user the difference is intended.`);
    }
    if (p.s.enters && p.r.enters !== 'start' && p.s.enters !== p.r.enters)
      add('warning', p.n, `It enters by ${p.s.enters}. Reference shot ${p.r.n} enters by ${p.r.enters} (${LEGEND.enters[p.r.enters]}).`, 'Match the entrance, or tell the user the difference is intended.');
  }
  if (pairs.some((p, i) => i && p.r.n < pairs[i - 1].r.n)) add('warning', null, "Your shots are not in the reference's order.", 'Keep the order of the reference shots, or tell the user the difference is intended.');
  const {seen} = shotFrames(b);
  return {
    timing:{matched_shots:pairs.length, scale:Math.round(scale * 100) / 100, on_time:pairs.length - late, largest_drift_s:precise(worst)},
    // The same moment in both videos, for a side-by-side look.
    compare_frames:pairs.filter(p => seen.has(p.r.n)).slice(0, MAX_COMPARE_FRAMES).map(p => {
      const frame = seen.get(p.r.n);
      return {shot:p.n, your_s:precise(p.s.start_s + (frame.s - p.r.start_s) / p.reference * p.seconds), reference_shot:p.r.n, reference_s:frame.s, reference_sheet:frame.sheet};
    })
  };
}

export function checkRemake(video, input, b = null) {
  const issues = [];
  const add = (severity, shot, problem, fix) => issues.push({severity, ...(shot ? {shot} : {}), problem, fix});
  const own = input.product_name.toLowerCase();
  // Words that would mean the reference's brand ended up in the user's video.
  // The account name always counts; title words only when they aren't everyday words.
  const titleWords = String(video.title).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4 && !STOP.has(w));
  const brandWords = [...new Set([video.brand?.replace(/^@/, '').toLowerCase(), ...titleWords])].filter(w => w && w.length >= 3 && !own.includes(w));
  const shots = input.shots;
  let previousEnd = 0;
  shots.forEach((s, i) => {
    const n = i + 1;
    if (s.end_s <= s.start_s) add('error', n, 'The shot ends before it starts.', 'Fix start_s and end_s.');
    if (i && Math.abs(s.start_s - previousEnd) > 0.25) add('warning', n, `There is a ${s.start_s > previousEnd ? 'gap' : 'overlap'} of ${round(Math.abs(s.start_s - previousEnd))}s before this shot.`, 'Make shots meet end to start, unless the gap is an intended empty beat.');
    previousEnd = s.end_s;
    const text = (s.on_screen_text ?? []).join(' ').toLowerCase();
    const reused = brandWords.filter(w => new RegExp(`(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}\\p{N}])`, 'u').test(text));
    if (reused.length) add('error', n, `On-screen text contains "${reused.join('", "')}", which comes from the reference's brand or title.`, "Replace it with the user's own words.");
    for (const a of s.assets ?? []) {
      if (a.source === 'reference') add('error', n, `A ${a.kind} is taken from the reference.`, "Remove it and use the user's own asset. The reference's creator owns it.");
      if (a.source === 'placeholder') add('warning', n, `A ${a.kind} is a placeholder.`, 'Mark it clearly in the video and tell the user what you still need.');
      if (a.source === 'generated' && ['logo', 'screenshot', 'screen_recording'].includes(a.kind)) add('error', n, `A ${a.kind} was generated rather than supplied by the user.`, "Don't invent a logo or product UI. Ask the user for the real one.");
      if (a.source === 'stock' && ['music', 'voiceover'].includes(a.kind)) add('warning', n, `Stock ${a.kind} is used.`, 'Confirm the license covers this use and tell the user where it came from.');
    }
  });
  if (input.music_source === 'reference') add('error', null, "The soundtrack is the reference's.", "Use the user's own track, a licensed track, or no music.");
  const length = shots.length ? shots.at(-1).end_s - shots[0].start_s : 0;
  if (input.target_seconds && Math.abs(length - input.target_seconds) > Math.max(1, input.target_seconds * 0.05)) add('warning', null, `The shots run ${round(length)}s, not the ${input.target_seconds}s target.`, 'Trim or extend to the target length.');
  const texts = shots.flatMap(s => s.on_screen_text ?? []).join(' ').toLowerCase();
  if (texts && !texts.includes(own)) add('warning', null, `"${input.product_name}" never appears in the on-screen text.`, 'Show the product name at least once, usually at the reveal and on the end card.');
  const rhythm = b && shots.length ? {reference_average_shot_s:b.average_shot_s, yours_average_shot_s:round(length / shots.length), reference_pace:b.pace} : null;
  const timed = b ? checkTiming(b, shots, add) : null;
  // The average only matters when shots were not matched one by one.
  if (rhythm && !timed && (rhythm.yours_average_shot_s > b.average_shot_s * 1.5 || rhythm.yours_average_shot_s < b.average_shot_s / 1.5))
    add('warning', null, `Your average shot is ${rhythm.yours_average_shot_s}s; the reference's is ${b.average_shot_s}s.`, 'The pacing has drifted from the reference. Re-time to the blueprint, or tell the user it is intentionally different.');
  const errors = issues.filter(i => i.severity === 'error').length;
  return {
    passed:errors === 0, errors, warnings:issues.length - errors, issues,
    ...(rhythm ? {rhythm} : {}),
    ...(timed ?? {}),
    still_to_do:[
      'Play the exported file from start to end. Check it is the right length, size and has no blank or broken frames.',
      timed?.compare_frames.length
        ? `Export a frame of your render at each your_s in compare_frames and set it beside the reference at reference_s (${video.video_url}, or the storyboard sheets). Position, scale, amount on screen and stage of the move should match; nothing on screen should.`
        : `Compare with the reference at matching timestamps (${video.video_url}). Timing, entrances and amount of motion should match; nothing on screen should.${b ? ' Give each shot its reference_shot to have its timing checked and get the exact times to compare.' : ''}`,
      'Tell the user every placeholder, every difference from the reference and anything you could not verify.'
    ],
    note:'This checks what you reported, not the rendered file. Kuchi never sees your video.'
  };
}

export function checkMarkdown(result, name) {
  const t = result.timing;
  return [
    `# Remake check: ${name}`,
    result.passed ? `**Passed** with ${result.warnings} warning${result.warnings === 1 ? '' : 's'}.` : `**Not ready:** ${result.errors} error${result.errors === 1 ? '' : 's'}, ${result.warnings} warning${result.warnings === 1 ? '' : 's'}.`,
    '',
    ...(result.issues.length ? ['## Issues', ...result.issues.map(i => `- **${i.severity}**${i.shot ? ` (shot ${i.shot})` : ''}: ${i.problem} ${i.fix}`), ''] : []),
    ...(result.rhythm ? [`Rhythm: your average shot is ${result.rhythm.yours_average_shot_s}s; the reference's is ${result.rhythm.reference_average_shot_s}s (${result.rhythm.reference_pace} pace).`, ''] : []),
    ...(t ? [`Timing: ${t.on_time} of ${t.matched_shots} matched shots are on time at ${t.scale}x the reference's length. Largest drift: ${t.largest_drift_s}s.`, ''] : []),
    ...(result.compare_frames?.length ? ['## Frames to compare', ...result.compare_frames.map(f => `- Shot ${f.shot}: your frame at ${f.your_s}s, reference shot ${f.reference_shot} at ${f.reference_s}s (${f.reference_sheet} sheet)`), ''] : []),
    '## Still to do yourself', ...result.still_to_do.map((s, i) => `${i + 1}. ${s}`),
    '', `_${result.note}_`
  ].join('\n');
}
