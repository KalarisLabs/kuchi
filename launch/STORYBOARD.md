# Kuchi launch film: storyboard

> **Built.** `npm run studio` to preview, `npm run render` for the silent 1080p30 cut, `npm run render:4k` for the master: 3840×2160, 60 fps, with the music (`public/music/launch-in-motion.mp3`). The master is composition `KuchiLaunch4K60`: the film is still authored at 30 fps, and `TimeRemap` (src/lib/time-remap.tsx) plays it on a 60 fps clock so every frame in between is a real in-between, not a repeat; `src/remotion-shim.ts` keeps `useVideoConfig().fps` at 30 inside it. The source of truth for timing is `SHOTS` in `src/Film.tsx`. Where the build changed the plan, it is noted under "As built" at the bottom of this file.

60 seconds · 1920×1080 · 30fps · 1800 frames · Remotion · built only from Kuchi registry components.

## The one idea

Kuchi is a library of real launch videos, each measured frame by frame, that your agent can remake for your product. The film shows that loop in the order people meet it: the library, the agent, the render, the reach. It ends with the name. The film is made with Kuchi, and a viewer who knows that should be able to tell from the cut.

## Mood board (applies to every shot)

| Token | Value | Use |
|---|---|---|
| `paper` | `#FFFFFF` | Every background. No gradient grounds, glows, voids or night shots. |
| `paper-2` | `#FAFAF9` | Cards and panels, where a component needs a second surface |
| `ink` | `#171717` | All type, outlines, cursors |
| `muted` | `#737373` | Secondary words |
| `line` | `rgba(23,23,23,0.08)` | Hairlines and borders |
| `popcorn` | `#ED4035` | The only accent: orbs, highlights, the send/tick moment, the sweep |
| `butter` | `#FFF3D2` | The kernel colour. Used rarely, as a flush or second confetti colour |

- **Type:** use Inter Tight everywhere a component takes `fontFamily` / `font`. The two components that hard-load Inter (Claude Chat, Button Press) are on-screen UI, and Inter sits next to Inter Tight without a visible clash.
- **Popcorn:** the popcorn mark from `web/public/favicon.svg` is the brand symbol. It appears exactly four times: the announce symbol, the spec icon, the gather lockup mark, and the end card. Nowhere else.
- **Cuts:** every scene ends and starts on white, so cuts are hard and nothing dissolves. Motion comes from the components themselves; nothing extra is added between shots.
- **No slop:** no added glows, no lens flares, no stock gradients, no emoji, and a scene has at most one moving accent.
- **Shared theme:** components that take `theme` / `mode` get `mode="light"` and `theme={{ background: "#FFFFFF", foreground: "#171717", accent: "#ED4035" }}` from one `kuchiTheme` constant.

## Timeline at a glance

| # | Time | Frames | Component | Beat |
|---|---|---|---|---|
| 1 | 0:00.0 to 0:05.3 | 0 to 160 | Orb Swarm | Hook |
| 2 | 0:05.3 to 0:09.0 | 160 to 270 | Announce Title | Name |
| 3 | 0:09.0 to 0:12.5 | 270 to 375 | Reel Collage | The library |
| 4 | 0:12.5 to 0:15.5 | 375 to 465 | Spec Sweep | Measured |
| 5 | 0:15.5 to 0:17.5 | 465 to 525 | Logo Enter | Your agent |
| 6 | 0:17.5 to 0:22.0 | 525 to 660 | Claude Chat | Ask |
| 7 | 0:22.0 to 0:29.0 | 660 to 870 | Agent Steps | The MCP works |
| 8 | 0:29.0 to 0:31.0 | 870 to 930 | Drop Upload | Your assets (close) |
| 9 | 0:31.0 to 0:34.5 | 930 to 1035 | File Dropzone | Your assets (wide) |
| 10 | 0:34.5 to 0:38.7 | 1035 to 1161 | Button Press + Confetti | Render |
| 11 | 0:38.7 to 0:41.2 | 1161 to 1236 | Gather Lockup | The payoff |
| 12 | 0:41.2 to 0:46.5 | 1236 to 1395 | Status Cycle | What Kuchi is |
| 13 | 0:46.5 to 0:51.0 | 1395 to 1530 | Caret Dolly | Components |
| 14 | 0:51.0 to 0:55.0 | 1530 to 1650 | Brand Wheel | Reach |
| 15 | 0:55.0 to 1:00.0 | 1650 to 1800 | Title Sweep | End card |

Act 1 (0 to 15.5s) is the hook and the library. Act 2 (15.5 to 41.2s) is the workflow. Act 3 (41.2 to 60s) is the scope and the sign-off.

---

## Act 1: Hook and library

### 1. Orb Swarm, 0:00.0 to 0:05.3

**Screen:** white page. Popcorn-red glass orbs burst out of the sentence, split, form a vortex, knot and chain, then shrink away bead by bead around the closing words. The orbs read as kernels popping.

**Copy:** six cards. Cards 3 to 5 reveal word by word.
`launch day | what if | your launch video | was already | made by the best | ever shipped`

```tsx
<OrbSwarm
  script="launch day | what if | your launch video | was already | made by the best | ever shipped"
  background="#FFFFFF" ink="#171717" orbColor="#ED4035"
  fontFamily={interTight} mode="light"
/>
```
Natural length is 128 beats at 24 per second, which is 5.33s. Do not retime it.

### 2. Announce Title, 0:05.3 to 0:09.0

**Screen:** four shots in one component. "Introducing" rushes past the camera on a receding plane, the name assembles word by word on paper, then a macro pan across the tagline that builds last word first while the white sweep drains it.

**Copy:** eyebrow `Introducing` · title `Kuchi` · tagline `AI for viral launch videos.`

```tsx
<AnnounceTitle
  eyebrow="Introducing" title="Kuchi" tagline="AI for viral launch videos."
  voidColor="#FFFFFF" fieldColor="#FFFFFF" paperColor="#FFFFFF" nightColor="#FFFFFF"
  titleColor="#171717" taglineColor="#171717" inkColor="#171717"
  glowStrength={0}
  symbolPath={POPCORN_PATH} symbolColors={["#ED4035", "#FFF3D2"]}
  fontFamily={interTight}
/>
```
The component's own shot list ends at frame 110 (3.67s). `voidColor` and `nightColor` default to dark, so both must be overridden, or the white mood breaks in the second shot.

### 3. Reel Collage, 0:09.0 to 0:12.5

**Screen:** a picture cuts through a fast eight-cut reel between two captions and zooms. It then shuts like an eyelid, the captions fold into one line, the copy swaps, and a collage blooms around it on a butter flush.

**Copy:** `Real launch videos` / `measured frame by frame` → swap → `Every shot.` / `Every cut.`

**Slides:** see the open question on footage. The default is Kuchi's own art (`kuchi-media.kalarislabs.com/components/art/art-*.svg`), so no third-party brand appears on screen.

```tsx
<ReelCollage
  topLine="Real launch videos" bottomLine="measured frame by frame"
  swapTop="Every shot." swapBottom="Every cut."
  slides={ART.slice(0, 8)} collage={ART}
  background="#FFFFFF" glowColor="#FFFFFF" flushColor="#FFF3D2" textColor="#171717"
  fontFamily={interTight} mode="light"
/>
```
The reference is 2.6s long. Hold the end of the collage bloom for about 0.9s.

### 4. Spec Sweep, 0:12.5 to 0:15.5

**Screen:** one line slides in word by word, a highlight runs along it, and the icon charges up. The icon is the popcorn mark, which fills red as it charges.

**Copy:** `Every cut` [popcorn] `measured` `to` `the frame`

```tsx
<SpecSweep
  segments={[
    { text: "Every cut", role: "lead" },
    { role: "icon" },
    { text: "measured", role: "accent" },
    { text: "to", role: "muted" },
    { text: "the frame", role: "accent" },
  ]}
  icon={POPCORN_PATH} iconBox={POPCORN_BOX}
  accentColor="#ED4035" fontFamily={interTight} mode="light"
/>
```

---

## Act 2: The workflow

### 5. Logo Enter, 0:15.5 to 0:17.5

**Screen:** round chips spring in one by one in a horizontal stack: Claude, Codex, Cursor, Gemini, ChatGPT. A single line of Inter Tight sits under them: `Works in the agent you already use.` This line is the film's only custom element.

```tsx
<LogoEnter
  logos={[claude, codex, cursor, gemini, chatgpt]} // from web/public/logos, each on bg "#FFFFFF"
  ringColor="#FFFFFF" orientation="horizontal"
/>
```
The chip shadow is hard-coded at `rgba(0,0,0,0.5)`, which is too heavy on white. Soften it to `0 8px 24px rgba(23,23,23,0.08)` in the vendored copy.

### 6. Claude Chat, 0:17.5 to 0:22.0

**Screen:** the Claude input bounces in. A prompt types itself, and the waveform button turns into the send button as soon as text appears.

**Copy:** greeting `What are we launching?` · prompt `Use Kuchi to make a launch video for my app`

```tsx
<ClaudeChat
  greeting="What are we launching?"
  prompt="Use Kuchi to make a launch video for my app"
  modelName="Opus 5.5" modelTier="Max"
/>
```
Keep Claude's own terracotta send button, because this shot shows Claude's real UI. Override the light theme's `page` (`#F5F4EF`) to `#FFFFFF` so it cuts cleanly into the shots on either side. Typing starts at frame 42 and runs at 22 characters per second, so the 44-character prompt is done by about 3.4s.

### 7. Agent Steps, 0:22.0 to 0:29.0

**Screen:** the prompt lands in a pill, and a log writes itself under it. Each step spins, flips to past tense behind a check, and the column steps up. The steps are the real Kuchi MCP workflow (suggest, breakdown, plan, components), so nothing on screen is invented.

```tsx
<AgentSteps
  query="Use Kuchi to make a launch video for my app"
  steps={[
    { running: "Finding templates that fit your product…", done: "Found 3 templates", icon: "globe" },
    { running: "Reading the shot breakdown…", done: "Read 14 shots, frame by frame" },
    { running: "Planning your remake…", done: "Planned every shot on the template's frames" },
    { running: "Pulling Kuchi components…", done: "Pulled 6 components", icon: "globe" },
    { running: "Writing the scenes…", done: "Wrote the scenes" },
  ]}
  result="Ready to render"
  paperColor="#FFFFFF" glowColor="#FFFFFF" pillColor="#FAFAF9"
  inkColor="#171717" stepColor="#737373" accentColor="#ED4035"
  fontFamily={interTight} mode="light"
/>
```

### 8. Drop Upload, 0:29.0 to 0:31.0 (close-up)

**Screen:** the plan asks for your assets (Kuchi's `missing_inputs`). A single file card drops in, the bar fills and a check confirms. This is the close shot of the pair.

**Copy:** title `Add your brand` · file `brand-kit.zip` · kind `ZIP` · size `4.2 MB` · done `Added`

```tsx
<DropUpload
  theme="light" accent="#ED4035" background="#FFFFFF" ink="#171717"
  title="Add your brand" fileName="brand-kit.zip" fileKind="ZIP" fileSize="4.2 MB"
  doneLabel="Added" fontFamily={interTight}
/>
```
Pass `background` so the gradient ground does not render.

### 9. File Dropzone, 0:31.0 to 0:34.5 (wide)

**Screen:** a hard cut wide. The rest of the assets drop into a list, and a toast confirms.

```tsx
<FileDropzone
  theme="light" accent="#ED4035" ink="#171717" background="#FFFFFF"
  title="Your launch" destination="Launch film"
  files={[
    { name: "logo.png", size: 84_000, type: "png" },
    { name: "app-screens.zip", size: 12_400_000, type: "zip" },
    { name: "launch-notes.doc", size: 46_000, type: "doc" },
  ]}
  fontFamily={interTight}
/>
```
The toast is dark (`toastBg #18181B`) by default. That dark toast is the only dark object in the film, and it reads as UI, so keep it.

### 10. Button Press + Confetti, 0:34.5 to 0:38.7

**Screen:** a cursor walks onto the split button, which darkens on hover, gives on press, spins while pending and lands on a drawn tick. Confetti bursts from the button on the tick, in popcorn colours only. The burst is the popcorn popping.

**Copy:** `Render` → `Rendering…` → `Rendered`

```tsx
<ButtonPress label="Render" pending="Rendering…" done="Rendered" mode="light" theme={kuchiTheme} />
<Sequence from={CLICK_AT + PENDING_FRAMES /* 76 */}>
  <Confetti colors={["#ED4035", "#FFF3D2", "#171717"]} particleCount={60} originY={0.5} power={0.8} seed={7} />
</Sequence>
```
`BUTTON_PRESS_FRAMES` is 126 (4.2s). Keep the confetti small (about 60 particles) so it reads as a pop rather than a party.

### 11. Gather Lockup, 0:38.7 to 0:41.2

**Screen:** a wall of finished films sits under a line of type, then the wall gathers into the popcorn mark and the `kuchi` wordmark. This is the payoff: here is what you made.

```tsx
<GatherLockup
  lines={[["Your", "launch", "film"]]}
  images={IMAGES} captions={CAPTIONS} // Kuchi's own art and "Launch film / Product demo / …"
  logo={POPCORN_MARK} wordmark="kuchi" // { width, height, shapes }
  wordmarkColor="#171717" backdrop="#FFFFFF" font={interTight} mode="light"
/>
```
The component runs 45 frames at 24fps (1.9s). Hold the lockup for about 0.6s.

---

## Act 3: Scope and sign-off

### 12. Status Cycle, 0:41.2 to 0:46.5

**Screen:** a centred line whose status pill cycles. The label rolls up behind a clip, the pill width springs past its target, and the line re-centres. Chips name what is inside.

**Copy:** prefix `Kuchi is` · statuses `a launch video library` → `an MCP server` → `a component registry` → `free to start`
**Chips:** `Kinetic type` · `Captions` · `UI screens` · `Cursors` · `Logos`

```tsx
<StatusCycle
  prefix="Kuchi is"
  statuses={["a launch video library", "an MCP server", "a component registry", "free to start"]}
  chips={["Kinetic type", "Captions", "UI screens", "Cursors", "Logos"]}
  fieldColor="#FFFFFF" pageColor="#FFFFFF"
  pillColor="#ED4035" pillLabelColor="#FFFFFF" prefixColor="#171717"
  chipFills="#FAFAF9" chipTextColor="#171717" chipBorderColor="rgba(23,23,23,0.08)"
  fontFamily={interTight}
/>
```
The component crossfades green to cream by default. Setting both `fieldColor` and `pageColor` to white makes that crossfade invisible.

### 13. Caret Dolly, 0:46.5 to 0:51.0

**Screen:** a prompt box types a request while the camera dollies along the caret. This is a callback: the request asks for the orb swarm, which is the scene that opened this film.

**Copy:** `Add the orb swarm scene to my launch video` · focus `orb swarm` · chip `Kuchi` · model `Claude`

```tsx
<CaretDolly
  prompt="Add the orb swarm scene to my launch video" focus="orb swarm"
  chipLabel="Kuchi" modelLabel="Claude"
  theme="light" accent="#ED4035" ink="#171717" background="#FFFFFF"
  fontFamily={interTight}
/>
```
Pass `background` so the `mist` ground does not render. Keep `motionBlur` on.

### 14. Brand Wheel, 0:51.0 to 0:55.0

**Screen:** a lead word and a wheel of brand pills roll through the platforms, with blurred rows above and below, and the cursor clicks the last pill.

**Copy:** lead `launch on` · items `X, YouTube, LinkedIn, Instagram, TikTok, Product Hunt`

```tsx
<BrandWheel lead="launch on" items="X, YouTube, LinkedIn, Instagram, TikTok, Product Hunt"
  accent="#ED4035" cursor mode="light" theme={kuchiTheme} fontFamily={interTight} />
```
Length comes from `brandWheelDuration(6)`. If it runs under 120 frames, hold the last frame.

### 15. Title Sweep, 0:55.0 to 1:00.0

**Screen:** the end title is lit by a gradient travelling through the letters. It cuts, and the URL takes over. On white, the sweep is ink → popcorn → ink rather than the default ember on black.

**Copy:** `Kuchi` → `kuchi.kalarislabs.com`

```tsx
<TitleSweep
  titles={["Kuchi", "kuchi.kalarislabs.com"]}
  background="#FFFFFF"
  stops={[
    { at: -17.5, color: "#171717" }, { at: -6, color: "#171717" },
    { at: -2, color: "#ED4035" }, { at: 0, color: "#F26A4F" }, { at: 2, color: "#ED4035" },
    { at: 6, color: "#171717" }, { at: 17, color: "#171717" },
  ]}
  fontFamily={interTight}
/>
```
Each title runs 36 frames. Hold the URL to frame 1800, with the popcorn mark small above it: the fourth and last time it appears.

---

## Sound (suggested)

- One music bed: minimal, 110 to 120 bpm. Shot 4's sweep, shot 10's tick and the shot 15 cut land on downbeats.
- Five sound effects only: the shot 6 send, the shot 10 click, a single soft "pop" on the confetti, the shot 14 cursor click, and nothing on the end card.
- No voiceover. The type carries the film.

## Build notes

- Install with the 16 `npx shadcn@latest add https://kuchi.kalarislabs.com/r/<name>.json` commands. `kuchi-ui`, `kuchi-kit`, `gradient-ground`, `type-caret` and `cursor-track` come in as dependencies.
- One `Root.tsx` with a single 1800-frame composition and one `<Sequence>` per shot, using the frame ranges in the timeline table. Store the ranges in one `SHOTS` array so a retime is a one-line change.
- `POPCORN_PATH`, `POPCORN_BOX` and `POPCORN_MARK` are built once from `web/public/favicon.svg`. For a one-colour slot (the spec icon), use the bucket silhouette.
- Components measured at 24fps (Orb Swarm, Gather Lockup) already resample to 30fps. Keep `speed={1}` on everything.
- Check the timing with `kuchi_check_remake` once a shot list is rendered.

## Open questions

1. **Library footage in shot 3:** use Kuchi's own art (the default here), or real posters from `previews/`? The posters show the library honestly, but they put other companies' launches on screen in our ad.
2. **Numbers:** add counts ("88 launch videos", "179 components")? They make the film stronger, but they go stale, and counts were already pulled from the footer. The storyboard has none.
3. **Name casing:** components default to lowercase `kuchi` (wordmark, status prefix). The storyboard uses `Kuchi` in sentences and `kuchi` only in the wordmark. Confirm that split.
4. **Music:** do you have a track, or should one be sourced?


## As built (2026-11-19)

- **Final frame budget** (30fps, 1800 total): Orb Swarm 160 · Announce Title 146 · Reel Collage 100 · Spec Sweep 90 · Logo Enter 60 · Claude Chat 120 · Agent Steps 170 · Drop Upload 60 · File Dropzone 115 · Button Press + Confetti 126 · Gather Lockup 65 · Status Cycle 210 · Caret Dolly 115 · Brand Wheel 128 · End card 135.
- **Announce Title** runs to about frame 145 (its wide closing shot follows the macro), not 110. Its mark is off (`symbolPath=""`): at any useful size, the macro shot turned into a red wall. The popcorn appears three times plus the end card.
- **Vendored edits** (our shadcn copies): Announce Title's tagline tint ramp is popcorn → ink instead of maroon → blue, and Logo Enter's chip shadow is a soft hairline instead of `rgba(0,0,0,0.5)`.
- **Scaled up** about the centre, because they are drawn small for their references: Claude Chat 1.25×, Agent Steps 2.1×, Button Press 2×, Brand Wheel 1.25×, Drop Upload `scale` 1.35, File Dropzone `scale` 1.2, Logo Enter `diameter` 200.
- **Status Cycle** has a second act, a scroll of large chips. `chipFontSize={118}` (default 22% of height) keeps the five chips in frame.
- **No audio**, by decision. The render is muted.

### Revision 2 (2026-11-19)

- **Reel Collage** plays real launches from the Kuchi library: 8 in the reel, 6 in the collage, each started on a moment with something on screen. The clips are copied into `public/reel/` and gitignored, like `videos/` in the repo.
- **Drop Upload removed.** It repeated "Add your brand" next to File Dropzone, which already shows the brand files going in.
- **Gather Lockup** holds "Your launch film is ready" for 2 seconds after the confetti, then gathers into the popcorn lockup (124 frames). Its wall uses posters of real launches, and each tile has a hairline edge (vendored edit) so light posters hold an edge on white.
- **Caret Dolly** prompt: "Create me the launch video for my product", which hands straight to Brand Wheel's "launch on …".
- Frame budget: Orb Swarm 160 · Announce 146 · Reel 100 · Spec 90 · Logo Enter 60 · Claude Chat 120 · Agent Steps 170 · File Dropzone 115 · Render + Confetti 126 · Gather 124 · Status Cycle 210 · Caret Dolly 115 · Brand Wheel 128 · End card 136 = 1800.

### Revision 3 (2026-11-19): pacing and transitions

The film is no longer held to 60s. It runs as long as its beats need: 54.4s, 1632 frames.

- **Measured, not eyeballed.** Every frame of the render was diffed against the one before to find frozen stretches and dead cuts (`motion.py`). Before: Spec Sweep froze for 2.1s, Claude Chat for 2.5s, Agent Steps for 1.2s, the Gather hold for 1.6s and Status Cycle for 1.5s, and six cuts went from a frozen frame to a frozen frame. After: nothing holds still for longer than 0.8s, and those holds are reading beats.
- **Blur dissolve on every cut** (10 frames, white over white, a 2% scale handoff), except orb → announce, which stays hard because the announce rush opens on its own move.
- **Slow push-ins** on the shots whose own motion is small: Spec Sweep, Logo Enter, Claude Chat, Agent Steps, File Dropzone, Button Press, Gather Lockup and Status Cycle.
- **Portal Intro** (new, from the registry) sits between Render and Gather: "one prompt, [picture] one launch film". The picture (a real launch, raylight-2) opens to fill the frame and "Your launch film" types over it. It cuts out before its own logo beat and dissolves into Gather's "Your launch film is ready", so the popcorn lockup lands once.
- **Retimed:** Spec 62 · Logo 50 · Claude 112 · Agent 148 · Portal 70 · Gather 104 · Status 190 (`statusHold` 28).

### Revision 4 (2026-11-19): more screen time, Dot Bloom, Shader Text Reveal

62.1s, 1863 frames.

- **Reel Collage (~10s)** plays at `speed={0.75}` over 132 frames, so the eight-cut reel and the collage bloom read instead of flickering.
- **Portal → Gather (~33–36s)**: Portal Intro runs at 0.8× and freezes once "Your launch film" has finished typing (it still never reaches its own logo beat). **Dot Bloom** (new, from the registry) carries the full-bleed picture into Gather: white sparks, cream wash, coral/peach dots thinning into the white wall. It is a hard cut under the cream at `DOT_BLOOM_CUT` (`bloomIn` on the shot). Gather is back to 124 frames, so the popcorn lockup lands and holds.
- **Status Cycle** ends on "free to start" (`statusHold` 34, 166 frames). Its chip scroll is gone.
- **Shader Text Reveal** (new, from the registry) takes the chips' place: "Kinetic type / Captions / UI screens / Cursors / Logos", one word per 32 frames. Vendored edit: `color`, `hue` and `hueSpread` props, so on white paper the liquid edge runs popcorn → orange and the letters settle to ink (the original settles to near-white silver and is blue-violet). It mounts after Inter Tight has loaded (`fontReady` in `brand.ts`), or the canvas rasterizes the fallback serif.
- **Smoother cuts**: the blur dissolve is 14 frames (was 10). Spec Sweep 74, Logo Enter 64.

### Revision 5 (2026-11-19): the opening question, the idea line

61.9s, 1856 frames.

- **Orb Swarm opens on a question.** Script: `launch day? | what if | your launch video | was already made | like the best ones | ever shipped`. "launch day?" fades in and holds for about 1.6s (`openHold={1.4}`, a slow drift through the card's first six beats) before the swarm runs; the shot is 195 frames.
- **Grammar fix.** The component revealed only two words of cards 3 and 4 and three of card 5, so "your launch video" showed as "your launch". Vendored edit: each card's last reveal beat brings in every remaining word. The old "made by the best ever shipped" is now "made like the best ones ever shipped".
- **Shader Text Reveal** no longer lists "Kinetic type / Captions / UI screens / Cursors / Logos". It says "Launch your idea" → "before your product." (44 frames each), and "Available as an MCP server" rises under the second line and holds.

### Revision 6 (2026-11-20): social cut

63.0s, 1890 frames.

- **Status Cycle** ends on "free for everyone" (was "free to start", which read as a paid tier; Kuchi is entirely free).
- **End card** holds 170 frames (was 136) and adds the ask under the URL: "Add it to your agent and make yours. Free, no sign-in." (`CTA_IN` 100).
- Posts for X and LinkedIn are in `SOCIAL_POSTS.md`; the thumbnail is a frame at 38.6s (`out/cover.jpg`).
