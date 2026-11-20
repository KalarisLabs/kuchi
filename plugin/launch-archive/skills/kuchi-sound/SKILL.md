---
name: kuchi-sound
description: Give a Kuchi remake sound without being able to hear it. Turns the blueprint's per-shot sound cues into placed, open-license sound effects (and an optional music bed or the user's own track), choosing and trimming files by measurement with ffmpeg, logging every license, and placing each sound on its exact frame in Remotion. Use after kuchi_plan_remake, whenever the plan's sound.mode is not "silent".
---

# Sound for a Kuchi remake

You can't listen. So you work the way an editor works from a cue sheet: every sound has a reason (a cut, a transition, a click, a reveal), a frame it must land on, a length and a level. All four come from the blueprint and from measuring files, never from guessing what something sounds like.

Never reuse the reference's music, voice or sound effects, and never re-create its soundtrack. Match its energy only: where it is loud, where it is quiet, where it hits.

## 1. Read the cue sheet

From the `kuchi_plan_remake` result:

- `sound.mode`:
  - `sfx`: sound effects only. This is the default.
  - `music_and_sfx`: an open-license music bed under the effects.
  - `user_track`: the user's own music or voiceover, with sound effects only where it leaves room.
  - `silent`: no audio. Stop here.
- Each blueprint shot's `sound`:
  - `cue` with `at_frame`: one sound on that frame. A `whoosh` also has `lead_frames`, because it builds up before it peaks.
  - `within`: sounds inside the shot: `clicks` on each click or key press, `riser` under a chart drawing in, `ticks` as words land.
- `sound.loudness_per_second` (0-9, when the reference has sound): where the reference is loud and quiet. Keep cues where it is high; drop the softer cues where it is low.

What each cue is:

| Cue | Sound | Typical length |
| --- | --- | --- |
| `whoosh` | swish or air movement peaking on the shot's first frame | 0.3-1.0 s |
| `hit` | short impact, thump or punch | under 0.4 s |
| `tick` | soft click, pop or tick | under 0.15 s |
| `reveal` | soft impact with a shimmer or bloom tail | 0.8-2 s |
| `clicks` | mouse or key clicks, one per action | under 0.1 s each |
| `riser` | rising tone ending as the graphic settles | the draw-in's length |
| `ticks` | quiet ticks as words land, at most one per 4 frames | under 0.1 s |
| `drop` | silence for the empty beat; a low thud may land as it ends | as measured |

Fewer, well-placed sounds beat many. Leave a cue out rather than stack two sounds within a third of a second.

## 2. Get open-license files

Check each file's license before you use it, and record it (step 5). Prefer CC0 (no attribution needed). CC BY is fine with credit. Don't use anything non-commercial (NC) or with no stated license.

1. **Remotion's CC0 set**: direct URLs, no account. Good for UI work:
   `https://remotion.media/whoosh.wav`, `whip.wav`, `page-turn.wav`, `switch.wav`, `mouse-click.wav`, `shutter-modern.wav`, `shutter-old.wav`, `ding.wav`.
   The same set has meme sounds (vine-boom, bruh, sitcom fails and similar). Never use those in a product video.
2. **Kenney** (kenney.nl, everything CC0): the packs *Interface Sounds*, *UI Audio*, *Impact Sounds* and *Digital Audio* cover clicks, ticks, pops, hits and confirmations. Download the zip from the asset page.
3. **Openverse** (openverse.org): searches open-license audio, and its API needs no account. Search for CC0 or public-domain effects:
   `https://api.openverse.org/v1/audio/?q=whoosh&license=cc0,pdm&category=sound_effect&page_size=20`
   For music, use `category=music`, and add `license_type=commercial` if CC BY is acceptable. Each result gives `url` (the file), `license`, `creator`, `foreign_landing_url` (its page) and `duration` (ms).
4. **Freesound** (freesound.org): a large library. Filter to the Creative Commons 0 license. Downloading needs a free account, so use it only if the user has one or gives you an API key.
5. Generate effects only with a tool the user has an account for, and record them as `generated`.

For `user_track`, use only the file the user gave you. For `music_and_sfx`, pick one track whose length is at least the video's, or that loops cleanly.

Put every file under `public/sfx/` or `public/music/`, named for its cue (`hit-01.wav`, `whoosh-01.wav`).

## 3. Choose and prepare by measuring

Run these with `ffmpeg` and `ffprobe` on each candidate.

**Length:** `ffprobe -v error -show_entries format=duration -of csv=p=0 in.wav`. Keep candidates whose length fits the cue table.

**Where it starts:** sounds often begin with silence, which would make them land late.
`ffmpeg -hide_banner -i in.wav -af silencedetect=n=-45dB:d=0.01 -f null - 2>&1 | grep silence_end`
The first `silence_end` is the onset, in seconds. No line means it starts at once. Trim it off:
`ffmpeg -y -i in.wav -af silenceremove=start_periods=1:start_threshold=-45dB -ar 48000 trimmed.wav`

**Where it peaks** (needed for whoosh, reveal and riser, which build up to a peak). This measures the loudness of every 10 ms window and prints the loudest one:
```sh
ffmpeg -hide_banner -i trimmed.wav -af "aresample=48000,asetnsamples=n=480,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null - 2>&1 \
  | awk '/pts_time/{split($0,a,"pts_time:");t=a[2]} /RMS_level=/{split($0,b,"=");v=b[2]; if(v!="-inf" && (best==""||v+0>best+0)){best=v;bt=t}} END{print bt}'
```
That time `p` (in seconds) is the peak. The sound must start `round(p * fps)` frames before its cue frame. Use that measured lead, not a guess. Change `print bt` to `print t, v` inside the second block to list every window: that is the RMS listing used below to find a track's beats.

**Peak level:** `ffmpeg -hide_banner -i trimmed.wav -af volumedetect -f null - 2>&1 | grep max_volume`. Normalise every effect to a -3 dB peak with `volume=<-3 minus max_volume>dB`, so the levels in step 4 mean the same for every file.

**Character, roughly:** compare how much energy sits in the lows and in the highs:
`-af "lowpass=f=200,volumedetect"` against `-af "highpass=f=4000,volumedetect"`.
A hit should be strong below 200 Hz. A tick or click should be mostly above 4 kHz and short. A whoosh is broad and swells. Reject files that don't measure like their cue.

## 4. Place them in Remotion

Use `<Audio>` from `@remotion/media` inside a `<Sequence>` that starts on the cue frame, minus the measured lead:

```tsx
import { Sequence, staticFile, interpolate } from "remotion";
import { Audio } from "@remotion/media";

// Generated from the blueprint: one entry per placed sound.
const CUES = [
  { at: 42, lead: 9, src: "sfx/whoosh-01.wav", gain: 0.4 },
  { at: 98, lead: 0, src: "sfx/hit-01.wav", gain: 0.5 },
];

export const Sfx = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={i} from={Math.max(0, c.at - c.lead)} name={`sfx ${i}`}>
        <Audio src={staticFile(c.src)} volume={c.gain} />
      </Sequence>
    ))}
  </>
);
```

Starting gains, for effects normalised to a -3 dB peak:

| Cue | Gain |
| --- | --- |
| reveal | 0.6 |
| hit | 0.5 |
| whoosh | 0.4 |
| clicks | 0.3 |
| tick, ticks | 0.25 |
| riser | 0.3 |

Then fix the overall level in the audio check.

**Music bed:**
- Place it at frame 0, or offset it so that its strongest beats fall on the most cue frames. Find its beats with the 10 ms RMS listing above: the beats are the regular peaks.
- Never move a cut more than 2 frames to meet a beat. Move the music instead.
- Keep it about 8 dB under the effects (volume 0.35-0.4), and duck it under a voiceover (about 12 dB down, volume 0.25), easing over 6 frames: `volume={(f) => interpolate(f, [voStart - 6, voStart, voEnd, voEnd + 6], [0.4, 0.25, 0.25, 0.4], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}`.
- Fade it out over the last 0.5 to 1 s, unless the track ends there itself.

**The user's track:** align its hits to the cue frames the same way. Add sound effects only on cues where the track is quiet, which you can see in its RMS listing.

Give the composition a `stem` prop (`"all"`, `"sfx"` or `"music"`) that mutes the other layer. The audio check renders the effects on their own with it.

## 5. Log every license

Write `sound-credits.md` next to the video:

| File | Cue | Source page | Creator | License |
| --- | --- | --- | --- | --- |

Give it to the user with the video. Credit every CC BY file wherever the user publishes. In `kuchi_check_remake`, report each effect as an asset with `kind: "sound_effect"` and `source: "stock"` (or `"generated"`), and set `music_source`.

## 6. Then measure

Follow `kuchi_get_skill` with `name="kuchi-audio-check"`: loudness, peaks, and that every sound lands on its frame. Tell the user the times of the cues to listen to, because you couldn't hear them.
