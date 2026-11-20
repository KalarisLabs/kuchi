// Sound for a remake. An agent can't listen, so Kuchi gives it what listening
// would: one cue per moment that wants a sound, on an exact frame, derived from
// what the breakdown measured (how each shot enters, how much moves, what kind
// of shot it is). Picking files, trimming them and checking the mix by
// measurement is in the kuchi-sound and kuchi-audio-check skills.

export const SOUND_MODES = ['sfx', 'music_and_sfx', 'user_track', 'silent'];
export const SOUND_MODE_TEXT = {
  sfx:'Open-license sound effects on the cues below, no music.',
  music_and_sfx:'An open-license music bed under the sound effects, cut to the cues.',
  user_track:"The user's own track, with its hits on the cues. Add sound effects only where the track leaves room.",
  silent:'No sound. Skip the cues.'
};

// What each cue is, for the skill and the plan text.
export const CUES = {
  whoosh:'a whoosh or swish that peaks on the first frame of the shot (start it lead_frames earlier)',
  hit:'a short impact or thump on the first frame',
  tick:'a soft tick, click or pop on the first frame',
  reveal:'a soft impact with a short shimmer or bloom tail, for a logo or end card',
  clicks:'a mouse click on every click or key press inside the shot',
  riser:'a short rising tone under the draw-in, ending as it settles',
  ticks:'quiet ticks on each word or line as it lands, never more than one every 4 frames',
  drop:'cut every sound for the empty beat; a low thud may land as it ends'
};

const UI_ACTION = new Set(['ui_closeup']);

// How the user's sound is chosen when they haven't said: their own track if
// they gave one, else open-license sound effects.
export function soundMode(input, assets) {
  if (input.sound) return input.sound;
  return assets.some(a => a.kind === 'music' || a.kind === 'voiceover') ? 'user_track' : 'sfx';
}

// The cues for a re-timed blueprint, in order. `shots` carry start_frame,
// end_frame, enters, motion and (when analysed) kind. Cues closer together
// than about a third of a second are thinned, keeping the stronger one, so a
// rapid montage doesn't turn into a drum roll.
export function soundCues(shots, fps, mode) {
  if (mode === 'silent') return new Map();
  const gap = Math.max(2, Math.round(fps * 0.35));
  const strength = {reveal:4, whoosh:3, hit:3, drop:2, riser:2, clicks:1, ticks:1, tick:1};
  const cues = new Map();
  let last = null;
  shots.forEach((s, i) => {
    let cue = null;
    if (s.kind === 'logo' || s.kind === 'end_card') cue = 'reveal';
    else if (s.enters === 'transition') cue = 'whoosh';
    else if (s.enters === 'blank_black' || s.enters === 'blank_white' || s.kind === 'blank') cue = 'drop';
    else if (i > 0 && s.enters === 'cut') cue = s.motion === 'high' || s.motion === 'medium' ? 'hit' : 'tick';
    const within = UI_ACTION.has(s.kind) ? 'clicks' : s.kind === 'chart' ? 'riser' : s.kind === 'kinetic_type' ? 'ticks' : null;
    if (!cue && !within) return;
    if (cue && last && s.start_frame - last.at < gap) {
      if ((strength[cue] ?? 0) <= (strength[last.cue] ?? 0)) cue = null;
      else {
        // The weaker earlier cue goes; anything inside that shot stays.
        const previous = cues.get(last.shot);
        if (previous?.within) cues.set(last.shot, {within:previous.within}); else cues.delete(last.shot);
      }
    }
    if (!cue && !within) return;
    const entry = {
      ...(cue ? {cue, at_frame:s.start_frame, ...(cue === 'whoosh' ? {lead_frames:Math.max(3, Math.round(fps * 0.3))} : {})} : {}),
      ...(within ? {within} : {})
    };
    cues.set(s.shot, entry);
    if (cue) last = {cue, at:s.start_frame, shot:s.shot};
  });
  return cues;
}

export function soundPlan(mode, {referenceHasSound, loudness}) {
  return {
    mode,
    what:SOUND_MODE_TEXT[mode],
    reference_has_sound:referenceHasSound,
    ...(loudness ? {loudness_per_second:loudness} : {}),
    ...(mode === 'silent' ? {} : {
      levels:{integrated_lufs:-14, true_peak_dbtp:-1, music_bed_under_sfx_db:-8, music_under_voice_db:-12},
      cues_note:'Each blueprint shot with a sound cue says which one and on which frame. ' +
        (loudness ? "Where loudness_per_second is high in the reference, keep the cues; where it is low, drop the softer ones." : 'The reference is silent: keep the cues sparse and quiet.'),
      how:'Call kuchi_get_skill with name="kuchi-sound" to choose and place the files, and name="kuchi-audio-check" to measure the mix before delivering. Never reuse the reference\'s music or sound.'
    })
  };
}
