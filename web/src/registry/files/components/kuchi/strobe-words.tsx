/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Sora";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

// gradients.sh "radial-glow" palette (bg #020204): #f3f1ff, #9db4ff, #5a46cb, #1d1240.
const GLOW = ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240", "#020204"] as const;

// Sora 500 advances (1/1000 em), ASCII 32–126, measured with HarfBuzz.
const SORA_500 = [
  222, 303, 452, 702, 652, 864, 702, 264, 382, 382, 568, 592, 266, 506, 266,
  365, 750, 423, 623, 620, 652, 630, 668, 585, 647, 668, 266, 266, 592, 590,
  592, 556, 1124, 765, 684, 797, 788, 598, 560, 832, 803, 320, 641, 703, 549,
  937, 858, 865, 649, 865, 710, 682, 602, 785, 719, 1052, 705, 654, 652, 382,
  365, 382, 587, 581, 300, 581, 694, 608, 694, 616, 380, 679, 644, 317, 324,
  595, 296, 973, 644, 678, 694, 694, 414, 543, 429, 634, 572, 873, 574, 555,
  493, 382, 375, 382, 511,
];
const TRACK = -0.045;


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

export interface StrobeWordsProps {
  words?: string[];
  rhythm?: number[];
  /** Frames of the first strobe cut when `rhythm` is unset; cuts speed up to half that. */
  beat?: number;
  /** Fewest strobe cuts before the poster when `rhythm` is unset. */
  cuts?: number;
  logo?: React.ReactNode;
  accent?: string;
  /** Typeface for the words. Load it yourself; Sora by default. */
  fontFamily?: string;
  /** Film grain over the scene. */
  grain?: boolean;
  /** Size of the words and logo, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
}

const CAP = 0.73;
const BASE = 0.84;
const INK = "#0A0A0B";
const PAPER = "#F5F4F0";
const PAPER_INK = "#121214";

type Field = "accent" | "ink" | "paper";
const CYCLE: Field[] = ["accent", "ink", "paper"];

function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const adv = code >= 32 && code < 127 ? SORA_500[code - 32] : 600;
    w += adv / 1000 + TRACK;
  }
  return Math.max(w, 0.5);
}

function defaultRhythm(count: number, beat: number, cuts: number) {
  let n = count - 1;
  while (n < cuts) n += count;
  return Array.from({ length: n }, (_, i) =>
    Math.round(beat - ((beat / 2) * i) / Math.max(1, n - 1)),
  );
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={3}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Word({
  text,
  size,
  color,
  stop,
  fill,
  fontFamily,
}: {
  text: string;
  size: number;
  color: string;
  stop: string;
  fill?: string;
  fontFamily: string;
}) {
  const { height: H } = useVideoConfig();
  const baseline = H / 2 + (CAP * size) / 2;
  const tail = text.match(/[.!?]$/) ? text.slice(-1) : "";
  const body = tail ? text.slice(0, -1) : text;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: baseline - BASE * size,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 500,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: `${TRACK}em`,
          paddingLeft: `${-TRACK}em`,
          whiteSpace: "nowrap",
          color,
        }}
      >
        {fill ? (
          <span
            style={{
              color: "transparent",
              backgroundImage: fill,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              paddingRight: "0.08em",
              marginRight: "-0.08em",
            }}
          >
            {body}
          </span>
        ) : (
          body
        )}
        {tail ? <span style={{ color: stop }}>{tail}</span> : null}
      </div>
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

export function StrobeWords({
  words = ["Plan.", "Write.", "Render.", "Ship."],
  rhythm,
  beat = 6,
  cuts = 13,
  logo,
  accent = "#3B5BFD",
  fontFamily = display,
  grain = true,
  scale = 1,
  delay = 0,
  theme = "dark",
  speed = 1,
}: StrobeWordsProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const list = words.length > 0 ? words : ["Ship."];
  const beats =
    rhythm && rhythm.length > 0
      ? rhythm
      : defaultRhythm(list.length, beat, cuts);
  const poster: Field = theme === "light" ? "paper" : "ink";

  const offset = (((CYCLE.indexOf("accent") - (beats.length - 1)) % 3) + 3) % 3;

  let index = beats.length;
  let at = 0;
  for (let i = 0; i < beats.length; i++) {
    if (t < at + beats[i]) {
      index = i;
      break;
    }
    at += beats[i];
  }
  const isPoster = index >= beats.length;
  const field: Field = isPoster ? poster : CYCLE[(index + offset) % 3];
  const text = isPoster
    ? list[list.length - 1]
    : list[
        (((index - beats.length + list.length - 1) % list.length) +
          list.length) %
          list.length
      ];

  // Each strobe beat on the accent field is a radial-glow ground; the disc
  // sits in a slightly different place per beat so the cuts read as light.
  const k = isPoster ? 0 : index;
  const bx = 50 + ((k * 37) % 5) * 5 - 10;
  const glowField = [
    `radial-gradient(52% 64% at ${bx}% 104%, ${GLOW[0]} 0%, color-mix(in oklab, ${GLOW[1]} 85%, transparent) 30%, transparent 72%)`,
    `radial-gradient(90% 90% at ${100 - bx}% 0%, color-mix(in oklab, ${GLOW[3]} 80%, transparent) 0%, transparent 70%)`,
    `linear-gradient(180deg, ${GLOW[3]} 0%, ${GLOW[2]} 62%, #7e6fe0 100%)`,
  ].join(", ");
  const rise = interpolate(t - at, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  // Poster: the glow's ring reads as a horizon arc low in frame, rising a
  // few percent over the hold, under the word rather than around it.
  const posterGlow = [
    `radial-gradient(78% 62% at 50% ${142 - 6 * rise}%, color-mix(in oklab, ${GLOW[3]} 90%, transparent) 60%, color-mix(in oklab, ${GLOW[0]} 80%, transparent) 63%, color-mix(in oklab, ${GLOW[1]} 40%, transparent) 67%, transparent 80%)`,
    `radial-gradient(90% 60% at 50% 120%, color-mix(in oklab, ${GLOW[2]} 45%, transparent) 0%, transparent 70%)`,
    GLOW[4],
  ].join(", ");
  const bg =
    field === "accent"
      ? glowField
      : field === "ink"
        ? isPoster
          ? posterGlow
          : INK
        : PAPER;
  const fg = field === "paper" ? PAPER_INK : "#F7F7F5";
  const stop = field === "accent" ? GLOW[0] : accent;
  const posterFill =
    isPoster && field === "paper"
      ? `linear-gradient(180deg, ${GLOW[2]} 10%, ${GLOW[3]} 92%)`
      : undefined;

  const longest = list.reduce((m, w) => Math.max(m, widthEm(w)), 0.5);
  const strobeSize = Math.min(290 * u, (0.74 * W) / longest);
  const final = list[list.length - 1];
  const posterSize = Math.min(340 * u, (0.8 * W) / widthEm(final));

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <Word
          text={text}
          size={isPoster ? posterSize : strobeSize}
          color={fg}
          stop={stop}
          fill={posterFill}
          fontFamily={fontFamily}
        />
        {isPoster ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0.085 * H,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10 * u,
              color: fg,
            }}
          >
            {logo ?? <KuchiLogo fontSize={28 * u} color={fg} />}
          </div>
        ) : null}
      </ScaleLayer>
      {grain ? <Grain opacity={field === "paper" ? 0.04 : 0.05} /> : null}
    </AbsoluteFill>
  );
}
