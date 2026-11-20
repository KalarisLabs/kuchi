---
name: kuchi-remotion
description: Build a Kuchi remake in Remotion, frame-exact to the blueprint from kuchi_plan_remake, starting each shot from Kuchi's own components. Covers project setup, the @ alias Kuchi components need, one Sequence per shot, transitions, fonts, the user's assets, rendering and exporting frames to compare with the reference. Use after kuchi_plan_remake returns ready=true and before writing any video code.
---

# Build a Kuchi remake in Remotion

The blueprint from `kuchi_plan_remake` is the spec. Each shot has `start_frame`, `end_frame`, `enters`, `motion`, `kind`, `your_content`, `components` and `sound`. The plan's `build` block has the composition's `width`, `height`, `fps` and `duration_in_frames`. Build to those numbers exactly.

## 1. Set up the project once

1. Create the project: `npx create-video@latest` and pick the Blank template with TypeScript. In an existing Remotion project, skip this.
2. Add Remotion's own agent skills, so you follow its current API: `npx remotion skills add` (or `npx skills add remotion-dev/skills`). They cover animation, sequencing, media, fonts and rendering. This skill only covers what is specific to Kuchi.
3. Make `@/` point at `src/`, both for TypeScript and for Remotion's bundler. Kuchi components import `@/lib/kuchi-ui` and similar paths, and **they fail to build without the bundler alias**.

   `tsconfig.json`, inside `compilerOptions`:
   ```json
   "baseUrl": ".",
   "paths": { "@/*": ["./src/*"] }
   ```

   `remotion.config.ts`:
   ```ts
   import path from "node:path";
   import { Config } from "@remotion/cli/config";

   Config.overrideWebpackConfig((config) => ({
     ...config,
     resolve: {
       ...config.resolve,
       alias: { ...(config.resolve?.alias ?? {}), "@": path.join(process.cwd(), "src") },
     },
   }));
   ```
   Any custom `render.mjs` that calls `bundle()` from `@remotion/bundler` needs the same alias in its `webpackOverride`.
4. Add `components.json` at the project root, so the shadcn CLI knows where Kuchi components go, and create an empty `src/styles.css`:
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema.json",
     "style": "new-york",
     "rsc": false,
     "tsx": true,
     "tailwind": { "config": "", "css": "src/styles.css", "baseColor": "neutral", "cssVariables": true },
     "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" }
   }
   ```

## 2. Install the components the blueprint names

For each shot, start from the first component in its `components` list that fits what the shot needs to show.

1. Read it first: `kuchi_get_component` with its name gives the props at the top of the main file, its dependencies and its install command.
2. Install it with that command, for example `npx shadcn@latest add https://kuchi.kalarislabs.com/r/text-reveal.json`. It also installs the Kuchi code it builds on (such as `kuchi-ui`) and its npm packages. Install all of them at once with one command listing every URL.
3. If the CLI can't run, write each file from `kuchi_get_component` to its path under `src/`, and `npm install` the listed dependencies.
4. Pass the user's words, colors, fonts and assets in its props. Never leave a component's sample text, logos or brand in the video.

Write a shot from scratch only when no listed component fits. Then call `kuchi_list_components` with a query first. A template (category `templates`) is a whole video. Use it when its structure matches the blueprint, and replace every scene's content.

## 3. Lay the video out on the blueprint's frames

Make one composition with the plan's numbers, and one `<Sequence>` per blueprint shot:

```tsx
// src/Root.tsx
import { Composition } from "remotion";
import { Remake } from "./Remake";
import { SHOTS, FPS, WIDTH, HEIGHT, DURATION } from "./blueprint";

export const RemotionRoot = () => (
  <Composition id="Remake" component={Remake} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={DURATION} />
);
```

```tsx
// src/blueprint.ts: copied from the plan, never re-rounded
export const FPS = 30, WIDTH = 1920, HEIGHT = 1080, DURATION = 450;
export const SHOTS = [
  { shot: 1, start_frame: 0, end_frame: 41, enters: "cut", kind: "logo" },
  { shot: 2, start_frame: 42, end_frame: 97, enters: "transition", kind: "ui_screen" },
  // ...
] as const;
```

```tsx
// src/Remake.tsx
import { AbsoluteFill, Sequence } from "remotion";
import { SHOTS } from "./blueprint";
import { ShotView } from "./shots";

export const Remake = () => (
  <AbsoluteFill style={{ background: "var(--bg, #000)" }}>
    {SHOTS.map((s) => (
      <Sequence key={s.shot} from={s.start_frame} durationInFrames={s.end_frame - s.start_frame + 1} premountFor={30} name={`Shot ${s.shot}`}>
        <ShotView shot={s} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
```

`end_frame` is inclusive, so a shot lasts `end_frame - start_frame + 1` frames. Inside a `<Sequence>`, `useCurrentFrame()` starts at 0, so each shot animates from its own start.

### Entrances

- `cut`: the new shot's first frame is a different picture. Nothing animates across the cut.
- `transition`: the change *finishes* on the shot's first frames. Start the incoming shot a few frames early (`from={start_frame - T}`, with `T` read from the detail sheets, often 6 to 15 frames at 30 fps) and animate the wipe, zoom, morph or dissolve over `T` frames above the outgoing shot. Keep the outgoing shot running until the transition is done. Don't use `TransitionSeries` with an overlap unless you add the overlap back to the shot lengths, or every later shot lands early.
- `hold`: freeze the previous picture, then move. Render the last frame of the previous shot as a still for the held frames.
- `blank_black` or `blank_white`: an empty frame of that color for the frames the breakdown measured.

### Amount of motion

Match the shot's `motion`: `still` holds still, `low` moves one small thing, `medium` moves a panel or a block of text, `high` moves the whole frame. Put the biggest moves where `motion_per_second` peaks.

## 4. Rules that keep renders deterministic

- Drive every animation from `useCurrentFrame()` with `interpolate()` (with `extrapolateLeft: "clamp", extrapolateRight: "clamp"`) or `spring({ frame, fps })`. No CSS transitions or keyframes, no `setTimeout`, no `Math.random()` (use `random("seed")` from `remotion`).
- Images: `<Img src={staticFile("logo.svg")} />`. Video: `<OffthreadVideo src={staticFile("demo.mp4")} />`. Put the user's files in `public/`, never a hotlinked URL that might change.
- Fonts: `loadFont()` from `@remotion/google-fonts/<Family>` for Google fonts, or `loadFont({ family, url: staticFile("Brand.woff2") })` from `@remotion/fonts` for the user's own. Load them at module level so the first frame has them.
- Colors: put the user's brand colors in the reference's color roles from the plan (`color_roles`: background, secondary, accent, with their share of the frame). Keep them in one theme object and pass it to every component.
- Text: only the user's words. Check each component's defaults and replace them.

## 5. Sound

Unless the plan's `sound.mode` is `silent`, follow `kuchi_get_skill` with `name="kuchi-sound"`. It places each shot's cue with `<Audio>` from `@remotion/media` inside a `<Sequence>` on the cue's frame.

## 6. Render and compare

- Preview: `npx remotion studio`.
- Render: `npx remotion render src/index.ts Remake out/remake.mp4` (add `--crf=18` for a high-quality master).
- One frame: `npx remotion still src/index.ts Remake out/compare-90.png --frame=90`.
- For each `compare_frames` entry from `kuchi_check_remake`, export the frame at `Math.round(your_s * fps)` and set it beside the reference frame on the named storyboard sheet. Position, scale, amount on screen and stage of the move should match. Nothing on screen should.

## Before you deliver

1. The render's frame count equals `duration_in_frames`. Check with `npx remotion compositions src/index.ts`, or `ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames out/remake.mp4`.
2. `kuchi_check_remake` passes, with every shot's `reference_shot`.
3. Every placeholder is marked on screen and listed for the user.
4. Deliver the MP4 and the project source.
