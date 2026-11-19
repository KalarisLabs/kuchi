import { useEffect, useState } from "react";
import type React from "react";
import { AbsoluteFill, Easing, Freeze, Img, interpolate, Sequence, staticFile, useCurrentFrame, useDelayRender } from "remotion";
import { C, FONT, fontReady, POPCORN_ICON, POPCORN_LOGO, theme } from "./brand";
import { Caption } from "./Caption";
import { EndCard } from "./EndCard";

import { AgentSteps } from "@/components/kuchi/agent-steps";
import { AnnounceTitle } from "@/components/kuchi/announce-title";
import { BrandWheel } from "@/components/kuchi/brand-wheel";
import { ButtonPress, CLICK_AT, PENDING_FRAMES } from "@/components/kuchi/button-press";
import { CaretDolly } from "@/components/kuchi/caret-dolly";
import { ClaudeChat } from "@/components/kuchi/claude-chat";
import { Confetti } from "@/components/kuchi/confetti";
import { DotBloom, DOT_BLOOM_CUT, DOT_BLOOM_FRAMES } from "@/components/kuchi/dot-bloom";
import { FileDropzone } from "@/components/kuchi/file-dropzone";
import { GatherLockupScene, type GatherLockupProps } from "@/components/kuchi/gather-lockup";
import { LogoEnter } from "@/components/kuchi/logo-enter";
import { OrbSwarm, openHoldFrames } from "@/components/kuchi/orb-swarm";
import { PortalIntro } from "@/components/kuchi/portal-intro";
import { ReelCollage } from "@/components/kuchi/reel-collage";
import { ShaderTextReveal } from "@/components/kuchi/shader-text-reveal";
import { SpecSweep } from "@/components/kuchi/spec-sweep";
import { StatusCycle } from "@/components/kuchi/status-cycle";
import { TitleSweep } from "@/components/kuchi/title-sweep";

export const FPS = 30;

// Real launches from the Kuchi library, each started on a moment with something on screen.
const clip = (slug: string, t: number) => staticFile(`reel/${slug}.mp4`) + `#t=${t}`;
const REEL = [
  clip("claude-managed-agents-dynamic-workflows", 23.2),
  clip("photonhq-omnichannel-kinetic-type", 8.8),
  clip("crowdreply-citation-outreach", 23.2),
  clip("design-to-code", 14),
  clip("mcp-for-iphone", 23.4),
  clip("notion-ai-agents-more", 14),
  clip("vida-desktop-agent", 24.8),
  clip("commas-highlevel", 20.4),
];
const COLLAGE = [
  clip("danieltian-photon-imessage-agent", 16.9),
  clip("terminus-notes", 18),
  clip("shipper-build-bots-with-ai", 9.2),
  clip("notion-shared-brain", 21),
  clip("athrix-design-to-code-skill", 17),
  clip("cursor-computer-use", 8.4),
];

/** Posters of real launches for Gather Lockup's wall: seven on the wall, four in the row, four they swap to. */
const POSTERS = [
  "varcyyyy-do-dots-kinetic-type",
  "coinbase-over-under",
  "treg-social-api",
  "cash-app-weekly-bitcoin-rewards",
  "ai-workspace-motion-study",
  "grok-bot-action-button",
  "opptics-payments-motion-study",
  "motion-fable-5-5",
  "holo-marketing-motion-study",
  "nexo-claude-opus-3d-scene",
  "instagram-reminders-motion-concept",
  "lightreel",
  "go-lo-live-scores",
  "commas-highlevel",
  "photonhq-omnichannel-kinetic-type",
].map((slug) => staticFile(`reel/posters/${slug}.jpg`));

const PROMPT = "Use Kuchi to make a launch video for my app";

/** Scale a component that is drawn small for its reference about the frame centre. */
const Zoom: React.FC<{ k: number; children: React.ReactNode }> = ({ k, children }) => (
  <AbsoluteFill style={{ transform: `scale(${k})`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
);

/**
 * Gather Lockup with its opening line held: "Your launch film is ready" sits over
 * the wall for two seconds (drifting through the clip's first quarter-second so it
 * never freezes), then the rest plays at normal speed into the popcorn lockup.
 */
const HOLD = 60;
const HOLD_T = 6 / 24;
const HeldGather: React.FC<GatherLockupProps> = (props) => {
  const f = useCurrentFrame();
  const t = f < HOLD ? (f / HOLD) * HOLD_T : HOLD_T + (f - HOLD) / FPS;
  return <GatherLockupScene {...props} t={t} />;
};

/**
 * Portal Intro, slowed, and held once "Your launch film" has finished typing, so the
 * title reads before Dot Bloom takes it. It never reaches its own logo beat: the
 * popcorn lockup lands once, in Gather.
 */
const PORTAL_SPEED = 0.8;
const PORTAL_HOLD_AT = Math.ceil(71 / PORTAL_SPEED); // TITLE_TO + LEAD, at this speed
const HeldPortal: React.FC = () => (
  <Freeze frame={PORTAL_HOLD_AT} active={(f) => f >= PORTAL_HOLD_AT}>
    <PortalIntro
      lead="one prompt,"
      trail="one launch film"
      image={staticFile("reel/posters/raylight-2.jpg")}
      title="Your launch film"
      overlay={C.paper}
      fontFamily={FONT}
      mode="light"
      theme={theme}
      speed={PORTAL_SPEED}
    />
  </Freeze>
);

/**
 * Shader Text Reveal draws its words onto a canvas once, so it mounts only after
 * Inter Tight has loaded, or the words rasterize in the fallback serif.
 * The line is told in two beats; the second stays, and the MCP line rises under it.
 */
const IDEA = ["Launch your idea", "before your product."];
const WORD_FRAMES = 44;
const MCP_AT = IDEA.length * WORD_FRAMES - 10;
const ShaderReveal: React.FC = () => {
  const { delayRender, continueRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Inter Tight for Shader Text Reveal"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void fontReady().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle, continueRender]);
  if (!ready) return null;
  return (
    <>
      <ShaderTextReveal
        text={IDEA.join("\n")}
        fontFamily={`"${FONT}"`}
        fontWeight={600}
        fontSize={300}
        wordDuration={WORD_FRAMES}
        color={C.ink}
        hue={0.06}
        hueSpread={0.1}
      />
      <Caption text="Available as an MCP server" top={700} delay={MCP_AT} size={68} />
    </>
  );
};

/** The orb swarm holds its opening question, "launch day?", for this long. */
const OPEN_HOLD = 1.4;

const mark = (file: string) => (
  <Img src={staticFile(`logos/${file}.svg`)} style={{ width: "54%", height: "54%", objectFit: "contain" }} />
);

type Shot = {
  id: string;
  frames: number;
  node: React.ReactNode;
  /** A slow push-in across the shot, as a fraction of scale, for shots whose own motion is small. */
  drift?: number;
  /** Arrive on a hard cut instead of the blur dissolve (a match cut, or a shot that opens on its own move). */
  hardIn?: boolean;
  /** Arrive through Dot Bloom: a hard cut hidden under its cream, at DOT_BLOOM_CUT. */
  bloomIn?: boolean;
};

/** Every shot, in order. A retime is a change to one `frames` value. */
export const SHOTS: Shot[] = [
  {
    id: "01-orb-swarm",
    frames: 160 + openHoldFrames(OPEN_HOLD, FPS),
    node: (
      <OrbSwarm
        script="launch day? | what if | your launch video | was already made | like the best ones | ever shipped"
        openHold={OPEN_HOLD}
        background={C.paper}
        ink={C.ink}
        orbColor={C.popcorn}
        fontFamily={FONT}
        mode="light"
        theme={theme}
      />
    ),
  },
  {
    id: "02-announce-title",
    frames: 146,
    hardIn: true,
    node: (
      <AnnounceTitle
        eyebrow="Introducing"
        title="Kuchi"
        tagline="AI for viral launch videos."
        voidColor={C.paper}
        fieldColor={C.paper}
        paperColor={C.paper}
        nightColor={C.paper}
        glowColor={C.paper}
        glowStrength={0}
        titleColor={C.ink}
        taglineColor={C.ink}
        inkColor={C.ink}
        symbolPath=""
        fontFamily={FONT}
      />
    ),
  },
  {
    id: "03-reel-collage",
    frames: 132,
    node: (
      <ReelCollage
        topLine="Real launch videos"
        bottomLine="measured frame by frame"
        swapTop="Every shot."
        swapBottom="Every cut."
        slides={REEL}
        collage={COLLAGE}
        background={C.paper}
        glowColor={C.paper}
        flushColor={C.butter}
        textColor={C.ink}
        fontFamily={FONT}
        mode="light"
        theme={theme}
        speed={0.75}
      />
    ),
  },
  {
    id: "04-spec-sweep",
    frames: 74,
    drift: 0.04,
    node: (
      <SpecSweep
        segments={[
          { text: "Every cut", role: "lead" },
          { role: "icon" },
          { text: "measured", role: "accent" },
          { text: "to", role: "muted" },
          { text: "the frame", role: "accent" },
        ]}
        icon={POPCORN_ICON.path}
        iconBox={POPCORN_ICON.box}
        accentColor={C.popcorn}
        fontFamily={FONT}
        mode="light"
        theme={theme}
      />
    ),
  },
  {
    id: "05-logo-enter",
    frames: 64,
    drift: 0.04,
    node: (
      <>
        <AbsoluteFill style={{ transform: "translateY(-60px)" }}>
          <LogoEnter
            logos={[
              { mark: mark("claude"), bg: C.paper },
              { mark: mark("codex"), bg: C.paper },
              { mark: mark("cursor"), bg: C.paper },
              { mark: mark("gemini"), bg: C.paper },
              { mark: mark("chatgpt"), bg: C.paper },
            ]}
            diameter={200}
            overlap={58}
            ringColor={C.paper}
            orientation="horizontal"
          />
        </AbsoluteFill>
        <Caption text="Works in the agent you already use." top={640} delay={14} />
      </>
    ),
  },
  {
    id: "06-claude-chat",
    frames: 112,
    drift: 0.08,
    node: (
      <Zoom k={1.25}>
        <ClaudeChat greeting="What are we launching?" prompt={PROMPT} modelName="Opus 5.5" modelTier="Max" />
      </Zoom>
    ),
  },
  {
    id: "07-agent-steps",
    frames: 148,
    drift: 0.06,
    node: (
      <Zoom k={2.1}>
      <AgentSteps
        query={PROMPT}
        steps={[
          { running: "Finding templates that fit your product…", done: "Found 3 templates", icon: "globe", hold: 0.6 },
          { running: "Reading the shot breakdown…", done: "Read 14 shots, frame by frame", hold: 0.5 },
          { running: "Planning your remake…", done: "Planned every shot on the template's frames", hold: 0.5 },
          { running: "Pulling Kuchi components…", done: "Pulled 6 components", icon: "globe", hold: 0.4 },
          { running: "Writing the scenes…", done: "Wrote the scenes", hold: 0.35 },
        ]}
        result="Ready to render"
        paperColor={C.paper}
        glowColor={C.paper}
        pillColor={C.paper2}
        inkColor={C.ink}
        stepColor={C.muted}
        accentColor={C.popcorn}
        fontFamily={FONT}
        mode="light"
        theme={theme}
      />
      </Zoom>
    ),
  },
  {
    id: "09-file-dropzone",
    frames: 115,
    drift: 0.04,
    node: (
      <FileDropzone
        theme="light"
        accent={C.popcorn}
        ink={C.ink}
        background={C.paper}
        title="Your launch"
        destination="Launch film"
        scale={1.2}
        hint="PNG, ZIP or DOC, up to 50 MB"
        files={[
          { name: "logo.png", size: 84_000, type: "png" },
          { name: "app-screens.zip", size: 12_400_000, type: "zip" },
          { name: "launch-notes.doc", size: 46_000, type: "doc" },
        ]}
        fontFamily={FONT}
      />
    ),
  },
  {
    id: "10-button-press",
    frames: 126,
    drift: 0.05,
    node: (
      <>
        <Zoom k={2}>
          <ButtonPress label="Render" pending="Rendering…" done="Rendered" mode="light" theme={theme} />
        </Zoom>
        <Sequence from={CLICK_AT + PENDING_FRAMES} layout="none">
          <Confetti
            colors={[C.popcorn, C.butter, C.ink]}
            particleCount={70}
            originX={0.5}
            originY={0.5}
            size={18}
            seed={7}
          />
        </Sequence>
      </>
    ),
  },
  {
    id: "10b-portal-intro",
    frames: PORTAL_HOLD_AT + 14 + DOT_BLOOM_CUT,
    drift: 0.03,
    node: <HeldPortal />,
  },
  {
    id: "11-gather-lockup",
    frames: 124,
    drift: 0.05,
    bloomIn: true,
    node: (
      <HeldGather
        lines={[["Your"], ["launch", "film"], ["is", "ready"]]}
        images={POSTERS}
        logo={POPCORN_LOGO}
        wordmark="kuchi"
        wordmarkColor={C.ink}
        backdrop={C.paper}
        font={FONT}
        mode="light"
        theme={theme}
      />
    ),
  },
  {
    id: "12-status-cycle",
    // Ends on "free for everyone": its chip act is replaced by the shader reveal.
    frames: 24 + 4 * 34 + 6,
    drift: 0.04,
    node: (
      <StatusCycle
        prefix="Kuchi is"
        statuses={["a launch video library", "an MCP server", "a component registry", "free for everyone"]}
        chips={["Kinetic type", "Captions", "UI screens", "Cursors", "Logos"]}
        fieldColor={C.paper}
        pageColor={C.paper}
        pillColor={C.popcorn}
        pillLabelColor={C.paper}
        prefixColor={C.ink}
        chipFills={C.paper2}
        chipTextColor={C.ink}
        chipBorderColor={C.line}
        chipFontSize={118}
        statusHold={34}
        fontFamily={FONT}
      />
    ),
  },
  {
    id: "12b-shader-reveal",
    frames: MCP_AT + 16 + 44,
    drift: 0.03,
    node: <ShaderReveal />,
  },
  {
    id: "13-caret-dolly",
    frames: 115,
    node: (
      <CaretDolly
        prompt="Create me the launch video for my product"
        focus="launch video"
        chipLabel="Kuchi"
        modelLabel="Claude"
        theme="light"
        accent={C.popcorn}
        ink={C.ink}
        background={C.paper}
        fontFamily={FONT}
      />
    ),
  },
  {
    id: "14-brand-wheel",
    frames: 128,
    node: (
      <Zoom k={1.25}>
      <BrandWheel
        lead="launch on"
        items="X, YouTube, LinkedIn, Instagram, TikTok, Product Hunt"
        accent={C.popcorn}
        cursor
        mode="light"
        theme={theme}
        fontFamily={FONT}
      />
      </Zoom>
    ),
  },
  {
    id: "15-end-card",
    frames: 170,
    node: <EndCard />,
  },
];

/** Frames each pair of shots overlap for the blur dissolve. */
const DISSOLVE = 14;
const overlapInto = (i: number) => (i === 0 || SHOTS[i]!.hardIn || SHOTS[i]!.bloomIn ? 0 : DISSOLVE);

export const SHOT_STARTS = SHOTS.reduce<number[]>((acc, s, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1]! + SHOTS[i - 1]!.frames - overlapInto(i));
  return acc;
}, []);
export const DURATION = SHOT_STARTS[SHOTS.length - 1]! + SHOTS[SHOTS.length - 1]!.frames;
export const SHOT_LIST = SHOTS.map((s, i) => ({ id: s.id, from: SHOT_STARTS[i]!, frames: s.frames }));

const SOFT = Easing.bezier(0.33, 0, 0.2, 1);

/**
 * One shot on the timeline: the blur dissolve in and out (white over white, so it
 * reads as one move rather than a cut), and the optional slow push-in.
 */
const ShotFrame: React.FC<{ shot: Shot; dissolveIn: number; dissolveOut: number }> = ({
  shot,
  dissolveIn,
  dissolveOut,
}) => {
  const f = useCurrentFrame();
  const n = shot.frames;
  const inP = dissolveIn ? interpolate(f, [0, dissolveIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SOFT }) : 1;
  const outP = dissolveOut ? interpolate(f, [n - dissolveOut, n], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SOFT }) : 0;
  const push = shot.drift ? interpolate(f, [0, n], [1, 1 + shot.drift], { easing: Easing.inOut(Easing.sin) }) : 1;
  const scale = push * (1 - 0.02 * (1 - inP)) * (1 + 0.02 * outP);
  const blur = 10 * (1 - inP) + 10 * outP;
  return (
    <AbsoluteFill
      style={{
        background: C.paper,
        opacity: inP * (1 - outP * 0.999),
        transform: `scale(${scale})`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      }}
    >
      {shot.node}
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    {SHOTS.map((s, i) => (
      <Sequence key={s.id} name={s.id} from={SHOT_STARTS[i]} durationInFrames={s.frames}>
        <ShotFrame shot={s} dissolveIn={overlapInto(i)} dissolveOut={i < SHOTS.length - 1 ? overlapInto(i + 1) : 0} />
      </Sequence>
    ))}
    {SHOTS.map((s, i) =>
      s.bloomIn ? (
        <Sequence key={`bloom-${s.id}`} name={`dot-bloom > ${s.id}`} from={SHOT_STARTS[i]! - DOT_BLOOM_CUT} durationInFrames={DOT_BLOOM_FRAMES}>
          <DotBloom />
        </Sequence>
      ) : null,
    )}
  </AbsoluteFill>
);
