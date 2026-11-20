---
name: kuchi-audio-check
description: Check a rendered Kuchi remake's audio by measurement, since agents can't listen. Confirms there is an audio track as long as the video, measures integrated loudness and true peak against the plan's targets and fixes them, detects clipping and unintended silence, and checks that every sound effect starts on its cue frame. Use after placing sound with kuchi-sound and before delivering the video.
---

# Check a remake's audio by measuring it

Run every check on the exported file, not the project. Each one gives a number to compare with a target. Fix what is off, render again and measure again. When everything passes, tell the user what you measured and which moments to listen to, because you couldn't hear them.

Targets come from the plan's `sound.levels`. The defaults are -14 LUFS integrated and a true peak under -1 dBTP.

## 1. There is audio, and it is as long as the video

```sh
ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 out/remake.mp4
```

You want one `video` line and one `audio` line, whose durations differ by less than one frame (1/fps s). No audio line means the composition rendered muted. Check that `<Audio>` elements are inside the composition and that the render didn't use `--muted`.

## 2. Loudness and true peak

```sh
ffmpeg -hide_banner -nostats -i out/remake.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
```

The `I:` line is the integrated loudness in LUFS. The `Peak:` line is the true peak in dBFS (the same as dBTP here).

- **I is off by more than 1 LU:** change the master gain by `target - I` dB. In Remotion, multiply every `volume` by `10 ** ((target - I) / 20)`. Or correct the file with a two-pass `loudnorm`:
  ```sh
  ffmpeg -hide_banner -i out/remake.mp4 -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | tail -n 12
  ffmpeg -y -i out/remake.mp4 -af loudnorm=I=-14:TP=-1:LRA=11:measured_I=<input_i>:measured_TP=<input_tp>:measured_LRA=<input_lra>:measured_thresh=<input_thresh>:offset=<target_offset>:linear=true -c:v copy -c:a aac -b:a 192k out/remake-final.mp4
  ```
  The values in angle brackets come from the first pass's JSON output.
- **The true peak is above -1 dBTP:** lower the loudest cue's gain. Or keep the second `loudnorm` pass, which limits the peaks.

## 3. No clipping, no unintended silence

```sh
ffmpeg -hide_banner -i out/remake.mp4 -af volumedetect -f null - 2>&1 | grep -E "max_volume|mean_volume"
ffmpeg -hide_banner -i out/remake.mp4 -af silencedetect=n=-50dB:d=1.5 -f null - 2>&1 | grep -E "silence_(start|end)"
```

- `max_volume` at 0.0 dB means samples are clipping. Lower the gain.
- Each silence of 1.5 s or longer must be a planned `drop` cue or a `silent` stretch. Otherwise a sound is missing or muted.
- The last 0.5 s should fade, or end on a deliberate hit. A track cut off mid-note shows as loud audio right up to the last frame.

## 4. Every sound lands on its frame

Render the effects on their own, with the composition's `stem` prop (see kuchi-sound):

```sh
npx remotion render src/index.ts Remake out/sfx.wav --codec=wav --props='{"stem":"sfx"}'
ffmpeg -hide_banner -i out/sfx.wav -af silencedetect=n=-40dB:d=0.03 -f null - 2>&1 | grep silence_end
```

Each `silence_end` time `t` is where a sound starts, at frame `round(t * fps)`. Line them up with your cue list in order:

- **hit, tick, clicks, ticks:** the onset should be within 1 frame of `at_frame`.
- **whoosh, reveal, riser:** the onset should be within 1 frame of `at_frame - lead`. Check the peak too: cut a window around the cue (`ffmpeg -i out/sfx.wav -ss <start> -t <length> cue.wav`) and run kuchi-sound's peak command on it. The peak should be within 2 frames of `at_frame`.
- **Two sounds closer than the 0.03 s gap** merge into one onset. Space them out or drop one.

A sound more than 1 frame late almost always has silence at its start. Trim it, as kuchi-sound says, and render again.

## 5. Music sits under the effects

If there is a music bed, render it alone (`{"stem":"music"}`) and measure both stems with step 2. The music's integrated loudness should be about 8 dB below the effects stem's. If there is a voiceover, about 12 dB below the voice while it speaks.

## 6. Report

Tell the user:

- The measured loudness, true peak and duration, against the targets.
- That every cue landed within 1 frame, or which ones didn't, and why.
- The files used and their licenses (`sound-credits.md`).
- The 3 to 5 moments to listen to (the reveal, the biggest hit, the end) as timestamps. You checked levels and timing, not taste.
