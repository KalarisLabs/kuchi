import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "./brand";

/** A hand-set line with a quiet rise (under Logo Enter, and the MCP line). */
export const Caption: React.FC<{ text: string; top: number; delay?: number; color?: string; size?: number }> = ({
  text,
  top,
  delay = 0,
  color = C.ink,
  size = 54,
}) => {
  const f = useCurrentFrame() - delay;
  const p = interpolate(f, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        textAlign: "center",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "-0.03em",
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        filter: `blur(${(1 - p) * 4}px)`,
      }}
    >
      {text}
    </div>
  );
};
