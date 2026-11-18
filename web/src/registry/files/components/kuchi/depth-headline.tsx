/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const sans = manrope.fontFamily;

export interface DepthHeadlineProps {
  /** Huge headline set behind the subject. One short word reads best. */
  title?: string;
  /** Transparent-PNG cutout that rises in front of the headline. */
  src?: string;
  /** Small line at the foot of the frame, after the logo. Pass "" to hide. */
  caption?: string;
  /** Show the acme logo at the foot of the frame. */
  showLogo?: boolean;
  /** Replaces the acme mark at the foot of the frame. */
  logo?: React.ReactNode;
  accent?: string;
  /** Text color of the headline and logo; overrides the theme. */
  ink?: string;
  background?: string;
  /** Typeface for the headline. Load it yourself; Fraunces by default. */
  fontFamily?: string;
  fontWeight?: number;
  /** Frames the subject takes to rise in front of the headline. */
  riseFrames?: number;
  /** Size of the headline and subject, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F5F4F0",
    muted: "#8A8984",
    shadow: "rgba(0,0,0,0.55)",
  },
  light: {
    bg: "#F5F4F0",
    fg: "#0A0A0B",
    muted: "#6E6C67",
    shadow: "rgba(40,32,20,0.22)",
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Fraunces 400 advance per character at display tracking, in em. */
const ADVANCE = 0.48;

/** gradients.sh "mesh": lilac, periwinkle and deep blue blobs on ink. */
const MESH = {
  bg: "#0a0d24",
  colors: ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"],
} as const;

/**
 * The mesh palette as a flat poster orb: deep blue at the crown, lilac light
 * pooling at the base, two blobs drifting a few percent. Lit from below so it
 * reads as colour, not as a shaded ball.
 */
function meshFill(t: number, accent: string) {
  const [c0, c1, , c3] = MESH.colors;
  const c2 = accent;
  const d = Math.sin(t * Math.PI) * 5;
  return [
    `radial-gradient(70% 55% at ${38 + d}% 100%, ${c0} 0%, color-mix(in oklab, ${c0} 0%, transparent) 70%)`,
    `radial-gradient(60% 70% at ${82 - d}% ${62 - d * 0.5}%, color-mix(in oklab, ${c1} 85%, transparent) 0%, transparent 70%)`,
    `radial-gradient(90% 70% at ${30 + d * 0.6}% 0%, color-mix(in oklab, ${c3} 70%, transparent) 0%, transparent 72%)`,
    `linear-gradient(180deg, ${c2} 0%, ${c1} 64%, ${c0} 100%)`,
  ].join(", ");
}


/** Full logo as on acme.dev: R mark (0.76em tall, baseline-aligned) + "Acme" in Manrope 600, tracking-tight. */
function KuchiLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <span>Acme</span>
    </div>
  );
}

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function DepthHeadline({
  title = "Studio",
  src,
  caption = "Studio",
  showLogo = true,
  logo,
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = display,
  fontWeight = 400,
  riseFrames = 44,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: DepthHeadlineProps) {
  const frame = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.fg;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);

  const size = Math.min(
    H * 0.56,
    (W * 0.9) / Math.max(1, title.length * ADVANCE),
  );

  // Far plane: the headline tracks open and drifts a short distance.
  const open = interpolate(frame, [0, 54], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const tracking = -0.07 + open * 0.035;
  const headX = (1 - open) * W * 0.045;
  const headY = (1 - open) * H * 0.035;

  // Near plane: the subject rises from below and covers much more ground.
  const rise = interpolate(frame, [4, 4 + riseFrames], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const subjectY = (1 - rise) * H * 0.78;

  // A slow push after the rise: near plane grows more than far plane.
  const push = interpolate(frame, [30, 96], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const headScale = 1 + push * 0.014;
  const subjectScale = 1 + push * 0.04;

  const captionIn = interpolate(frame, [46, 62], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const disc = H * 0.48;
  const headTop = H * 0.42;
  // Disc top lands in the lower x-height so the word stays legible.
  const discTop = headTop + size * 0.15;

  return (
    <AbsoluteFill style={{ backgroundColor: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: headTop,
            textAlign: "center",
            fontFamily,
            fontWeight,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: `${tracking}em`,
            color: fg,
            whiteSpace: "nowrap",
            transform: `translate(${headX}px, calc(-50% + ${headY}px)) scale(${headScale})`,
            transformOrigin: "50% 60%",
          }}
        >
          {title}
        </div>

        {src ? (
          <Img
            src={src}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 0,
              height: H * 0.84,
              objectFit: "contain",
              transform: `translate(-50%, ${subjectY}px) scale(${subjectScale})`,
              transformOrigin: "50% 100%",
              filter: `drop-shadow(0 ${H * 0.03}px ${H * 0.05}px ${c.shadow})`,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              left: (W - disc) / 2,
              top: discTop,
              width: disc,
              height: disc,
              borderRadius: "50%",
              background: meshFill(frame / 120, accent),
              transform: `translateY(${subjectY}px) scale(${subjectScale})`,
              transformOrigin: "50% 40%",
            }}
          />
        )}

        {showLogo || caption ? (
          <div
            style={{
              position: "absolute",
              left: H * 0.08,
              bottom: H * 0.07,
              display: "flex",
              alignItems: "baseline",
              gap: H * 0.018,
              opacity: captionIn,
              transform: `translateY(${(1 - captionIn) * H * 0.01}px)`,
            }}
          >
            {showLogo
              ? (logo ?? <KuchiLogo fontSize={H * 0.032} color={fg} />)
              : null}
            {showLogo && caption ? (
              <div
                style={{
                  width: 1,
                  height: H * 0.024,
                  alignSelf: "center",
                  backgroundColor: c.muted,
                  opacity: 0.6,
                }}
              />
            ) : null}
            {caption ? (
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: H * 0.028,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                  color: c.muted,
                }}
              >
                {caption}
              </div>
            ) : null}
          </div>
        ) : null}
      </ScaleLayer>
    </AbsoluteFill>
  );
}
