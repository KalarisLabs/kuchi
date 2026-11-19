import type React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { C } from "./brand";
import { DURATION, FPS, Film, SHOTS } from "./Film";

export const Root: React.FC = () => (
  <>
    <Composition id="KuchiLaunch" component={Film} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
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
