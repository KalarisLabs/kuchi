import type React from "react";
import { useMemo } from "react";
import { Internals, useCurrentFrame } from "remotion";
import { useRealVideoConfig } from "../remotion-shim";
import { RemapContext } from "./remap-context";

/**
 * Plays children authored at (output fps / factor) on an output timeline at full fps:
 * output frame n shows authored frame n / factor. Every interpolate and spring gets a real
 * in-between value, so the 60 fps master is true 60 fps, not doubled frames.
 * Overrides both timeline clocks so Sequence activity and useCurrentFrame agree.
 */
export const TimeRemap: React.FC<{ factor: number; children: React.ReactNode }> = ({ factor, children }) => {
  const outer = useCurrentFrame();
  const { id } = useRealVideoConfig();
  const timeline = Internals.TimelineContext as React.Context<any>;
  const absolute = Internals.AbsoluteTimeContext as React.Context<any>;
  const ctx = (Internals as any).useTimelineContext?.() ?? null;

  const value = useMemo(
    () => (ctx ? { ...ctx, frame: { ...ctx.frame, [id]: outer / factor } } : null),
    [ctx, id, outer, factor],
  );
  if (!value) return <>{children}</>;
  return (
    <RemapContext.Provider value={factor}>
      <absolute.Provider value={value}>
        <timeline.Provider value={value}>{children}</timeline.Provider>
      </absolute.Provider>
    </RemapContext.Provider>
  );
};
