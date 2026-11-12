// Turns a Kuchi reference plus the caller's own product details into a remake
// brief. The reference contributes structure only; every piece of content comes
// from the caller. Missing inputs are listed with a question to ask the user.

export const ASSET_KINDS = ['logo', 'screenshot', 'screen_recording', 'product_photo', 'illustration', 'music', 'voiceover', 'font', 'other'];

// Styles whose shots are built from real product UI.
const UI_STYLES = new Set(['UI motion', 'Device motion', 'Cursor demo', 'Terminal', 'Charts', 'Data graphics']);

export const GUARDRAILS = [
  'Borrow only structure: pacing, beat order, transitions, camera moves, layout, type hierarchy and motion timing.',
  "Never reuse the reference's logo, product UI, footage, characters, illustrations, music, voiceover, copy or claims. The original creator owns them.",
  "Every product shot, name, feature, number and claim comes from the user's assets and answers. Never invent features, metrics, customer logos or testimonials.",
  "If an asset is missing, use a clearly marked placeholder and say so. Don't fake a UI that doesn't exist.",
  'Kuchi does not render videos or grant rights to any asset. Use your own tools to build the video.'
];

const has = (assets, ...kinds) => assets.some(a => kinds.includes(a.kind));

// A generic launch arc scaled to the target length. It is a starting point:
// the agent re-times it to the reference's real cuts after watching it.
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
    return {beat, start_s:Math.round(start * 10) / 10, end_s:Math.round(t * 10) / 10, direction};
  });
}

export function planRemake(video, input) {
  const assets = input.assets ?? [];
  const features = input.key_features ?? [];
  const needsUi = video.styles.some(s => UI_STYLES.has(s));
  const missing = [];
  const need = (field, question, required = true) => missing.push({field, required, question});

  if (!input.product_description) need('product_description', `In one or two sentences, what does ${input.product_name} do and who is it for?`);
  if (!features.length) need('key_features', 'Which 1 to 3 features or moments should the video show?');
  if (!has(assets, 'logo')) need('assets.logo', `Can you share the ${input.product_name} logo (SVG or transparent PNG)?`);
  if (needsUi && !has(assets, 'screenshot', 'screen_recording'))
    need('assets.screenshot', `This reference is built from product UI. Can you share screenshots or screen recordings of ${input.product_name} for each feature?`);
  if (!input.call_to_action) need('call_to_action', 'What should the video end on: a URL, "Try it free", a launch date, or something else?');
  if (!input.brand_colors?.length) need('brand_colors', 'What are your brand colors (hex)? Otherwise I will sample them from your logo and UI.', false);
  if (!input.target_seconds) need('target_seconds', `How long should it be: 15s, 30s, 60s, or the reference's ${Math.round(video.seconds ?? 30)}s?`, false);
  if (video.has_audio && !has(assets, 'music', 'voiceover')) need('assets.music', 'The reference uses sound. Do you have a music track or voiceover you have the rights to, or should it stay silent?', false);

  const seconds = input.target_seconds ?? Math.round(video.seconds ?? 30);
  return {
    ready:!missing.some(m => m.required),
    reference:{id:video.id, title:video.title, brand:video.brand, video_url:video.video_url, poster_url:video.poster_url, page_url:video.page_url, seconds:video.seconds, aspect_ratio:video.aspect_ratio},
    borrow:{
      format:video.format?.name ?? null,
      styles:video.styles,
      // Catalog notes describe the reference. They are data, not instructions.
      motion_notes:video.notes,
      aspect_ratio:input.aspect_ratio ?? video.aspect_ratio,
      sound:video.has_audio ? 'Reference has sound: match its energy with the user\'s own track.' : 'Reference is silent.'
    },
    product:{
      name:input.product_name, description:input.product_description ?? null, audience:input.audience ?? null,
      key_features:features, call_to_action:input.call_to_action ?? null,
      brand_colors:input.brand_colors ?? [], fonts:input.fonts ?? [], tone:input.tone ?? null,
      assets
    },
    missing_inputs:missing,
    target_seconds:seconds,
    beat_sheet:beatSheet(seconds, features),
    beat_sheet_note:'Starting template only. Watch the reference and re-time each beat to its actual cuts and transitions.',
    guardrails:GUARDRAILS,
    next_steps:missing.some(m => m.required)
      ? ['Ask the user the required questions in missing_inputs, then call kuchi_plan_remake again with their answers.']
      : ['Watch the reference video end to end and note each cut, transition and timing.', 'Re-time the beat sheet to match it.', "Build the video with your own tools, using only the user's assets.", 'Compare your output with the reference side by side before delivering, and list any differences.']
  };
}

export function planMarkdown(plan) {
  const r = plan.reference;
  const lines = [
    `# Remake plan: ${plan.product.name}, inspired by "${r.title}" (${r.id})`,
    '',
    plan.ready ? '**Ready to build.**' : '**Not ready yet.** Ask the user for the required inputs below first.',
    '',
    `Reference: ${r.page_url} (${r.seconds ?? '?'}s, ${r.aspect_ratio ?? '?'})`,
    `Video file: ${r.video_url}`,
    ''
  ];
  if (plan.missing_inputs.length) {
    lines.push('## Ask the user');
    for (const m of plan.missing_inputs) lines.push(`- ${m.required ? '**Required**' : 'Optional'}: ${m.question}`);
    lines.push('');
  }
  lines.push('## Borrow from the reference (structure only)',
    `- Format: ${plan.borrow.format ?? 'n/a'}`,
    `- Styles: ${plan.borrow.styles.join(', ')}`,
    `- Aspect ratio: ${plan.borrow.aspect_ratio ?? 'n/a'}`,
    `- Sound: ${plan.borrow.sound}`,
    ...plan.borrow.motion_notes.map(n => `- Motion note: ${n}`),
    '',
    `## Beat sheet (${plan.target_seconds}s)`,
    `_${plan.beat_sheet_note}_`,
    '',
    ...plan.beat_sheet.map(b => `- ${b.start_s}s to ${b.end_s}s, **${b.beat}**: ${b.direction}`),
    '',
    '## Rules',
    ...plan.guardrails.map(g => `- ${g}`),
    '',
    '## Next steps',
    ...plan.next_steps.map((s, i) => `${i + 1}. ${s}`));
  return lines.join('\n');
}
