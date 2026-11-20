// Agents get arguments slightly wrong all the time: a key named video_id
// instead of reference, a description 30 characters over the limit, an asset
// sent as a plain string, "fade" where the enum says "transition". A strict
// schema turns each of these into a failed call the agent has to retry.
//
// Kuchi keeps its advertised schemas strict (directories require
// additionalProperties:false), and repairs a call's arguments against that same
// schema before the SDK validates them. Every change is reported back to the
// agent, so it learns the right shape. What can't be repaired is left as sent,
// and validation explains it as before.

// Keys agents use for a field under another name. Applied only when the tool
// has the target field and lacks the key that was sent.
const ALIASES = {
  reference:['video_id', 'videoId', 'video', 'id', 'ref', 'reference_id', 'url', 'link', 'video_url', 'slug', 'template', 'template_id'],
  product_name:['product', 'name', 'productName', 'brand', 'brand_name', 'app_name'],
  product_description:['description', 'productDescription', 'about', 'summary'],
  key_features:['features', 'keyFeatures', 'highlights'],
  call_to_action:['cta', 'callToAction', 'ending'],
  brand_colors:['colors', 'colours', 'palette', 'brandColors'],
  target_seconds:['duration', 'duration_s', 'length', 'length_s', 'seconds', 'targetSeconds'],
  aspect_ratio:['ratio', 'aspect', 'aspectRatio'],
  shot_analysis:['analysis', 'shots_analysis', 'shotAnalysis'],
  looking_for:['description', 'query', 'product', 'prompt', 'brief'],
  available_assets:['assets', 'asset_kinds'],
  query:['q', 'search', 'keywords', 'term'],
  response_format:['format', 'responseFormat'],
  storyboard:['sheet', 'storyboard_type'],
  shows:['description', 'content', 'notes', 'note'],
  on_screen_text:['text', 'texts', 'copy', 'onScreenText'],
  start_s:['start', 'start_time', 'from'],
  end_s:['end', 'end_time', 'to'],
  reference_shot:['ref_shot', 'referenceShot', 'source_shot'],
  enters:['entrance', 'enter', 'transition'],
  shot:['n', 'number', 'shot_number', 'index'],
  kind:['type', 'category'],
  description:['desc', 'label', 'what', 'shows'],
  location:['path', 'file', 'src', 'href', 'url'],
  name:['component', 'component_name', 'id', 'slug']
};

// Words agents use for an enum value. Matched after case and punctuation are normalised.
const SYNONYMS = {
  cut:['hard_cut', 'jump_cut', 'smash_cut', 'straight_cut', 'none', 'instant'],
  transition:['fade', 'dissolve', 'crossfade', 'cross_fade', 'wipe', 'zoom', 'morph', 'slide', 'push', 'whip', 'whip_pan', 'match_cut', 'animated', 'blur', 'mask', 'reveal', 'swipe'],
  hold:['freeze', 'still', 'pause', 'static'],
  blank_black:['black', 'fade_to_black', 'dip_to_black', 'blank', 'empty'],
  blank_white:['white', 'fade_to_white', 'dip_to_white', 'flash'],
  logo:['wordmark', 'icon', 'mark', 'brand_mark', 'logomark', 'svg'],
  screenshot:['screen', 'ui', 'image', 'png', 'jpg', 'jpeg', 'picture', 'mockup', 'app_screenshot', 'screen_shot'],
  screen_recording:['recording', 'video', 'screencast', 'mp4', 'clip', 'demo', 'screen_capture', 'footage'],
  product_photo:['photo', 'render', 'product_render', 'photograph', 'packshot'],
  illustration:['mascot', 'character', 'drawing', 'artwork', 'art', 'graphic'],
  music:['audio', 'track', 'song', 'soundtrack', 'bgm', 'mp3', 'wav', 'sound'],
  voiceover:['vo', 'voice', 'narration', 'voice_over'],
  font:['typeface', 'fonts', 'type'],
  title_card:['title', 'text', 'headline', 'text_card', 'caption', 'intro'],
  kinetic_type:['typography', 'kinetic_text', 'animated_text', 'kinetic_typography', 'motion_text', 'words'],
  ui_screen:['ui', 'screen', 'product_ui', 'app', 'app_screen', 'dashboard', 'interface', 'product_screen', 'screenshot', 'ui_motion'],
  ui_closeup:['closeup', 'close_up', 'ui_detail', 'zoom', 'detail', 'cursor', 'click', 'button'],
  device:['phone', 'laptop', 'mockup', 'device_mockup', 'browser', 'framed_ui', 'mobile', 'iphone', 'tablet'],
  chart:['graph', 'data', 'stat', 'stats', 'metric', 'metrics', 'numbers', 'counter', 'data_graphic'],
  character:['mascot', 'avatar', 'person', 'figure'],
  product_render:['product', 'render', '3d', 'hardware', 'product_shot', 'packshot'],
  live_action:['footage', 'b_roll', 'broll', 'video', 'filmed', 'people', 'camera'],
  collage:['grid', 'montage', 'cards', 'gallery', 'mosaic'],
  abstract:['shapes', 'gradient', 'background', 'particles', 'abstract_motion', 'pattern', 'motion_graphics'],
  end_card:['cta', 'outro', 'end', 'ending', 'closing', 'call_to_action', 'endcard', 'end_screen', 'lockup'],
  blank:['empty_beat', 'pause', 'black', 'empty', 'silence'],
  user:['provided', 'own', 'client', 'customer', 'supplied', 'users', 'user_provided', 'given'],
  generated:['ai', 'ai_generated', 'created', 'made', 'synthesized', 'synthetic'],
  stock:['library', 'royalty_free', 'cc0', 'open_license', 'free', 'licensed_stock', 'freesound', 'kenney', 'openverse', 'sfx'],
  licensed:['license', 'royalty_free', 'stock', 'cc0', 'open_license', 'bought', 'purchased'],
  placeholder:['temp', 'temporary', 'dummy', 'mock', 'tbd', 'missing'],
  reference:['original', 'from_reference', 'copied'],
  none:['silent', 'no', 'no_music', 'mute', 'muted', 'nothing'],
  markdown:['md', 'text', 'plain', 'txt'],
  json:['structured', 'object'],
  overview:['overview_sheet', 'summary', 'main', 'yes', 'true', 'image'],
  detail:['details', 'detailed', 'full'],
  links:['link', 'urls', 'no', 'false'],
  slow:['calm', 'relaxed', 'gentle', 'slow_paced'],
  medium:['moderate', 'normal', 'average', 'mid'],
  fast:['quick', 'snappy', 'energetic', 'fast_paced', 'punchy'],
  rapid:['very_fast', 'frantic', 'hyper', 'rapid_fire'],
  dark:['dark_mode', 'night', 'black'],
  light:['light_mode', 'bright', 'white'],
  mixed:['both', 'any', 'either'],
  relevance:['relevant', 'best', 'fit'],
  newest:['new', 'latest', 'recent', 'date'],
  all:['full', 'everything', 'whole'],
  sfx:['sound_effects', 'effects', 'sfx_only', 'open_license', 'cc0'],
  music_and_sfx:['music', 'both', 'music_sfx', 'sfx_and_music', 'bed'],
  user_track:['own_track', 'my_track', 'user_music', 'track', 'provided'],
  silent:['none', 'no', 'mute', 'no_sound', 'nothing']
};

const norm = value => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// The closest enum value for what was sent, or undefined.
export function matchEnum(values, sent) {
  if (sent === undefined || sent === null) return undefined;
  if (values.includes(sent)) return sent;
  const n = norm(sent);
  if (!n) return undefined;
  const byNorm = values.find(v => norm(v) === n);
  if (byNorm !== undefined) return byNorm;
  const bySynonym = values.find(v => (SYNONYMS[v] ?? []).includes(n));
  if (bySynonym !== undefined) return bySynonym;
  // A value inside a longer phrase ("hard cut to black" -> cut), longest first.
  const words = n.split('_');
  for (const v of [...values].sort((a, b) => String(b).length - String(a).length)) {
    const nv = norm(v);
    if (nv.length >= 3 && (n.includes(nv) || nv.includes(n) && n.length >= 4)) return v;
    if ((SYNONYMS[v] ?? []).some(s => words.includes(s))) return v;
  }
  return undefined;
}

const typeOf = schema => Array.isArray(schema?.type) ? schema.type.find(t => t !== 'null') : schema?.type;
const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

// A string that holds JSON (an agent that serialised an array or object).
function parsed(value, type) {
  if (typeof value !== 'string') return value;
  const t = value.trim();
  if ((type === 'array' && t.startsWith('[')) || (type === 'object' && t.startsWith('{'))) {
    try { return JSON.parse(t); } catch { /* not JSON: handled below */ }
  }
  return value;
}

// Cuts a string to `max` characters on a word boundary where one is close.
function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.7 ? cut.slice(0, space) : cut).trimEnd();
}

// Repairs `value` against JSON Schema `schema`. Returns {value} or {drop:true}
// when nothing usable is left. `path` names the value in the notes.
function repair(schema, value, path, notes) {
  if (!schema || value === undefined) return {value};
  const type = typeOf(schema);
  value = parsed(value, type);

  if (schema.enum) {
    const match = matchEnum(schema.enum, value);
    if (match === undefined) return {drop:true, why:`${path}: "${String(value).slice(0, 40)}" is not one of ${schema.enum.join(', ')}`};
    if (match !== value) notes.push(`${path}: "${String(value).slice(0, 40)}" read as "${match}"`);
    return {value:match};
  }

  if (type === 'string') {
    if (typeof value === 'number' || typeof value === 'boolean') { notes.push(`${path}: converted to text`); value = String(value); }
    else if (Array.isArray(value) && value.every(v => typeof v === 'string')) { notes.push(`${path}: list joined into one line`); value = value.join(', '); }
    else if (isObject(value)) {
      const text = value.name ?? value.text ?? value.url ?? value.value ?? value.id ?? value.description;
      if (typeof text !== 'string' && typeof text !== 'number') return {drop:true, why:`${path}: expected text`};
      notes.push(`${path}: read "${String(text).slice(0, 40)}" from an object`); value = String(text);
    }
    if (typeof value !== 'string') return {drop:true, why:`${path}: expected text`};
    if (schema.maxLength && value.length > schema.maxLength) {
      notes.push(`${path}: shortened from ${value.length} to ${schema.maxLength} characters`);
      value = clip(value, schema.maxLength);
    }
    if (schema.minLength && value.trim().length < schema.minLength) return {drop:true, why:`${path}: empty`};
    return {value};
  }

  if (type === 'number' || type === 'integer') {
    let n = typeof value === 'string' ? Number(value.trim().replace(/s$|fps$|seconds?$/i, '').trim()) : value;
    if (typeof n !== 'number' || !Number.isFinite(n)) return {drop:true, why:`${path}: expected a number`};
    if (n !== value) notes.push(`${path}: "${value}" read as ${n}`);
    if (type === 'integer' && !Number.isInteger(n)) { notes.push(`${path}: ${n} rounded to ${Math.round(n)}`); n = Math.round(n); }
    const min = schema.minimum ?? (schema.exclusiveMinimum !== undefined ? schema.exclusiveMinimum + (type === 'integer' ? 1 : 1e-9) : undefined);
    const max = schema.maximum ?? (schema.exclusiveMaximum !== undefined ? schema.exclusiveMaximum - (type === 'integer' ? 1 : 1e-9) : undefined);
    if (min !== undefined && n < min) { notes.push(`${path}: ${n} raised to ${min}`); n = min; }
    if (max !== undefined && n > max) { notes.push(`${path}: ${n} lowered to ${max}`); n = max; }
    return {value:n};
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') return {value};
    const b = {true:true, yes:true, '1':true, false:false, no:false, '0':false}[norm(value)];
    return b === undefined ? {drop:true, why:`${path}: expected true or false`} : {value:b};
  }

  if (type === 'array') {
    if (!Array.isArray(value)) {
      if (value === null || value === '') return {drop:true, why:`${path}: empty`};
      // "a, b, c" for a list of short strings or enum values.
      const itemType = typeOf(schema.items);
      if (typeof value === 'string' && (itemType === 'string' || schema.items?.enum) && /[,;\n]/.test(value)) value = value.split(/\s*[,;\n]\s*/).filter(Boolean);
      else value = [value];
      notes.push(`${path}: wrapped in a list`);
    }
    const out = [];
    value.forEach((item, i) => {
      const r = repair(schema.items, item, `${path}[${i}]`, notes);
      if (r.drop) notes.push(`${r.why ?? `${path}[${i}]: unusable`}, so it was left out`);
      else out.push(r.value);
    });
    if (schema.maxItems && out.length > schema.maxItems) { notes.push(`${path}: kept the first ${schema.maxItems} of ${out.length}`); out.length = schema.maxItems; }
    if (schema.minItems && out.length < schema.minItems) return {drop:true, why:`${path}: needs at least ${schema.minItems}`};
    return {value:out};
  }

  if (type === 'object') {
    if (!isObject(value)) {
      // A plain string for an object: it fills the object's text field, and an
      // enum field is read from the same words ("logo.svg" -> kind logo).
      if (typeof value !== 'string' || !value.trim()) return {drop:true, why:`${path}: expected an object`};
      const props = schema.properties ?? {};
      const textKey = (schema.required ?? []).find(k => typeOf(props[k]) === 'string' && !props[k].enum) ?? Object.keys(props).find(k => typeOf(props[k]) === 'string' && !props[k].enum);
      if (!textKey) return {drop:true, why:`${path}: expected an object`};
      const built = {[textKey]:value};
      for (const [k, p] of Object.entries(props)) {
        if (!p.enum || !(schema.required ?? []).includes(k)) continue;
        const words = norm(value).split('_');
        built[k] = p.enum.find(v => words.includes(norm(v)) || (SYNONYMS[v] ?? []).some(s => words.includes(s))) ?? (p.enum.includes('other') ? 'other' : undefined);
        if (built[k] === undefined) return {drop:true, why:`${path}: expected an object with ${k}`};
      }
      notes.push(`${path}: text turned into ${JSON.stringify(Object.keys(built))}`);
      value = built;
    }
    return repairObject(schema, value, path, notes);
  }
  return {value};
}

function repairObject(schema, input, path, notes) {
  const props = schema.properties ?? {};
  const value = {...input};
  const where = key => path ? `${path}.${key}` : key;

  // Wrapped arguments: {"arguments":{...}} or {"input":{...}} around the real ones.
  for (const wrapper of ['arguments', 'args', 'input', 'params', 'parameters']) {
    if (!props[wrapper] && isObject(value[wrapper]) && Object.keys(value).length === 1) {
      notes.push(`${where(wrapper)}: unwrapped`);
      Object.assign(value, value[wrapper]); delete value[wrapper];
    }
  }
  const aliasFor = k => Object.keys(ALIASES).find(t => props[t] && ALIASES[t].includes(k));
  // A nested object whose keys belong to this one: {"product":{"name":...}} -> product_name.
  for (const [key, inner] of Object.entries(value)) {
    if (props[key] || !isObject(inner)) continue;
    let used = false;
    for (const [k, v] of Object.entries(inner)) {
      const target = [`${key}_${k}`, k, aliasFor(k)].find(t => t && props[t] && value[t] === undefined);
      if (target) { value[target] = v; used = true; }
    }
    if (used) { delete value[key]; notes.push(`${where(key)}: its fields were moved up`); }
  }
  // Keys under another name.
  for (const [target, names] of Object.entries(ALIASES)) {
    if (!props[target] || value[target] !== undefined) continue;
    const from = names.find(n => !props[n] && value[n] !== undefined && value[n] !== null);
    if (!from) continue;
    value[target] = value[from]; delete value[from];
    notes.push(`${where(from)} read as ${target}`);
  }
  // Camel case for snake case keys.
  for (const key of Object.keys(value)) {
    if (props[key]) continue;
    const snake = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    if (snake !== key && props[snake] && value[snake] === undefined) { value[snake] = value[key]; delete value[key]; notes.push(`${where(key)} read as ${snake}`); }
  }
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    if (!props[key]) {
      if (schema.additionalProperties === false) { notes.push(`${where(key)}: not an argument of this tool, so it was ignored`); continue; }
      out[key] = v; continue;
    }
    if (v === null || v === undefined) continue;
    const r = repair(props[key], v, where(key), notes);
    if (r.drop) {
      if (!(schema.required ?? []).includes(key)) notes.push(`${r.why ?? where(key)}, so it was left out`);
      // A required field that can't be read: inside a list, the entry goes; at the
      // top, the value is passed on so validation can say what is wrong.
      else if (path) return {drop:true, why:r.why ?? `${where(key)} is unusable`};
      else out[key] = v;
    } else out[key] = r.value;
  }
  for (const key of schema.required ?? []) if (out[key] === undefined) return {drop:true, why:`${where(key)} is missing`};
  return {value:out};
}

// The repaired arguments for one call, and what changed. Top-level arguments
// are never dropped as a whole: a call missing a required field is passed on
// with what could be repaired, so validation can say what is missing.
export function repairArguments(schema, args) {
  const notes = [];
  if (!schema) return {args, notes};
  let input = parsed(args, 'object');
  if (input === undefined || input === null) input = {};
  if (!isObject(input)) return {args, notes};
  const r = repairObject({...schema, required:[]}, input, '', notes);
  return {args:r.value, notes};
}
