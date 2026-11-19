import type React from "react";
import { AbsoluteFill, Audio, Composition, staticFile } from "remotion";
import { TimeRemap } from "./lib/time-remap";
import { C } from "./brand";
import { DURATION, FPS, Film, SHOTS } from "./Film";

/** Output frames per authored frame in the master: 30 fps authored -> 60 fps out. */
const MASTER_FACTOR = 2;

/** The master: the film on a 60 fps timeline (true in-betweens, see TimeRemap) with the music. */
const Master: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <TimeRemap factor={MASTER_FACTOR}>
      <Film />
    </TimeRemap>
    <Audio src={staticFile("music/launch-in-motion.mp3")} />
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <>
    <Composition id="KuchiLaunch" component={Film} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    {/* Render with --scale=2 for 3840x2160 (npm run render:4k). */}
    <Composition id="KuchiLaunch4K60" component={Master} durationInFrames={DURATION * MASTER_FACTOR} fps={FPS * MASTER_FACTOR} width={1920} height={1080} />
    {/* One composition per shot, run long, for checking where each one settles. */}
    {SHOTS.map((s) => (
      <Composition
        key={s.id}
        id={`shot-${s.id}`}
        component={() => <AbsoluteFill style={{ background: C.paper }}>{s.node}</AbsoluteFill>}
        durationInFrames={300}
        fps={FPS}
        width={1920}
        height={1080}
      />
    ))}
  </>
);
