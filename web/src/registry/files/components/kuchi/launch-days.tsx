/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { Fragment } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/kuchi/gsh/gradient-engine";
import { GshGround } from "@/lib/kuchi/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/kuchi/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

export interface LaunchDay {
  day: string;
  title: string;
  description?: string;
}

export interface LaunchDaysProps {
  week?: string;
  label?: string;
  days?: LaunchDay[];
  active?: number;
  from?: number;
  revealUpcoming?: boolean;
  logo?: React.ReactNode;
  accent?: string;
  background?: string;
  /** Text color; overrides the theme ink. */
  ink?: string;
  /** Typeface for the titles and copy. Load it yourself; Hanken Grotesk by default. */
  fontFamily?: string;
  /** Frames between title words as the active day writes in. */
  stagger?: number;
  /** Corner radius of the day cards, in px at 720p. */
  radius?: number;
  /** Size of the header and strip, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_DAYS: LaunchDay[] = [
  {
    day: "Mon",
    title: "Captions",
    description: "31 transcript-driven caption styles.",
  },
  {
    day: "Tue",
    title: "Transitions",
    description: "Cuts that land on the beat.",
  },
  {
    day: "Wed",
    title: "Templates",
    description:
      "Whole launch films, installed into your project and yours to edit.",
  },
  {
    day: "Thu",
    title: "Agent skill",
    description: "Your agent reads the docs and picks the beat.",
  },
  {
    day: "Fri",
    title: "Studio",
    description: "Preview every scene before it renders.",
  },
];

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    scrim: "rgba(10,10,11,0.84)",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    faint: "#55555C",
    panel: "rgba(255,255,255,0.03)",
    line: "rgba(255,255,255,0.08)",
    litLine: "rgba(255,255,255,0.14)",
    activeFg: "#F7F8FF",
    activeMuted: "rgba(236,240,255,0.74)",
    shade:
      "linear-gradient(180deg, rgba(4,6,20,0) 35%, rgba(4,6,20,0.55) 100%)",
    ground: "film-blue" as GshPresetId,
    groundParams: undefined as Partial<GradientParams> | undefined,
  },
  light: {
    bg: "#F5F4F0",
    scrim: "rgba(245,244,240,0.84)",
    fg: "#111113",
    muted: "#6E6C67",
    faint: "#A9A69E",
    panel: "rgba(255,255,255,0.5)",
    line: "rgba(17,17,19,0.08)",
    litLine: "rgba(17,17,19,0.1)",
    activeFg: "#0B0D1E",
    activeMuted: "rgba(11,13,30,0.68)",
    shade:
      "linear-gradient(180deg, rgba(245,246,252,0) 35%, rgba(245,246,252,0.6) 100%)",
    ground: "glasswork" as GshPresetId,
    groundParams: {
      colors: ["#a9bcff", "#3552ff", "#1a2a9e", "#7f9bff"],
    } as Partial<GradientParams> | undefined,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);
const SPRING_CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const SPRING_MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;


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

function estimateEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.24;
    else if (/[ilIj.,'’!|]/.test(ch)) w += 0.25;
    else if (/[mwMW]/.test(ch)) w += 0.82;
    else if (/[A-Z]/.test(ch)) w += 0.64;
    else if (/[0-9]/.test(ch)) w += 0.55;
    else w += 0.52;
  }
  return w;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

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

export function LaunchDays({
  week = "Launch Week 01",
  label = "New today",
  days = DEFAULT_DAYS,
  active = 2,
  from,
  revealUpcoming = false,
  logo,
  accent = "#3B5BFD",
  background,
  ink,
  fontFamily = hanken.fontFamily,
  stagger = 3,
  radius: corner = 16,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: LaunchDaysProps) {
  const raw = Math.max(0, useCurrentFrame() - delay);
  const frame = raw * speed;
  const { width, height, fps } = useVideoConfig();
  const p = PALETTES[theme];
  const fg = ink ?? p.fg;
  const activeFg = ink ?? p.activeFg;

  const list = days.length >= 2 ? days.slice(0, 7) : DEFAULT_DAYS;
  const n = list.length;
  const act = Math.min(Math.max(0, Math.round(active)), n - 1);
  const swap =
    from !== undefined && Math.round(from) !== act
      ? Math.min(Math.max(0, Math.round(from)), n - 1)
      : null;

  const portrait = height > width * 1.1;
  const u = Math.min(width, height) / 720;
  const margin = 40 * u;
  const marginX = portrait ? width * 0.07 : width * 0.1;
  const headerH = week || logo !== null ? 64 * u : 0;
  const gap = 8 * u;
  const radius = corner * u;

  const stripW = width - marginX * 2;
  const stripH = height - margin - headerH - margin * (headerH ? 0 : 1);
  const main = portrait ? stripH : stripW;
  const cross = portrait ? stripW : stripH;
  const sliver = Math.max(
    44 * u,
    Math.min((portrait ? 92 : 76) * u, main * 0.075),
  );
  const free = main - gap * (n - 1);
  const equal = free / n;
  const wide = free - sliver * (n - 1);

  const rise = (i: number) =>
    swap === null
      ? spring({ frame: frame - i * 2, fps, config: SPRING_CARD })
      : 1;
  const open = spring({
    frame: frame - 14,
    fps,
    config: SPRING_MORPH,
    durationInFrames: 28,
  });
  const sizeOf = (i: number) => {
    if (swap === null) {
      return interpolate(open, [0, 1], [equal, i === act ? wide : sliver]);
    }
    const a = i === swap ? wide : sliver;
    const b = i === act ? wide : sliver;
    return interpolate(open, [0, 1], [a, b]);
  };

  const eyebrowT = interpolate(frame, [26, 42], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const wordT = (i: number) =>
    interpolate(frame, [30 + i * stagger, 48 + i * stagger], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const outT = (i: number) =>
    interpolate(frame, [6 + i * 2, 16 + i * 2], [0, 1], {
      ...CLAMP,
      easing: EASE_IN,
    });

  const panelPad = (portrait ? 44 : 36) * u;
  const avail = (portrait ? cross : wide) - panelPad * 2;
  const base = (portrait ? 150 : 136) * u;
  const numFs = (portrait ? 150 : 112) * u;
  const titleFs = (title: string) => {
    const em = estimateEm(title);
    const one = avail / Math.max(em, 0.5);
    if (one >= base * 0.78) return Math.min(base, one);
    return Math.max(base * 0.5, Math.min(base * 0.86, (avail * 1.9) / em));
  };

  const transparent = background === "transparent";
  const showHeader = headerH > 0;
  const labelFs = 16 * u;
  const preset = ground ?? (groundParams ? undefined : p.ground);
  const litO = (i: number) =>
    i === act
      ? interpolate(frame, [16, 40], [0, 1], { ...CLAMP, easing: EASE_OUT })
      : i === swap
        ? 1 -
          interpolate(frame, [14, 36], [0, 1], { ...CLAMP, easing: EASE_IN })
        : 0;
  const stripX = marginX;
  const stripY = showHeader ? headerH + margin * 0.15 : margin;
  const sizes = list.map((_, i) => sizeOf(i));
  const rectOf = (i: number) => {
    let at = 0;
    for (let k = 0; k < i; k++) at += (sizes[k] as number) + gap;
    const lift = (1 - rise(i)) * 30 * u;
    const sz = sizes[i] as number;
    return portrait
      ? { x: stripX, y: stripY + at + lift, w: stripW, h: sz }
      : { x: stripX + at, y: stripY + lift, w: sz, h: stripH - margin * 0.15 };
  };
  const rr = (x: number, y: number, w: number, h: number, r: number) =>
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  const holes = list
    .map((_, i) => i)
    .filter((i) => litO(i) > 0.001)
    .map((i) => {
      const q = rectOf(i);
      if (scale === 1) return rr(q.x, q.y, q.w, q.h, radius);
      // The cards sit in the ScaleLayer; the scrim doesn't, so map its holes.
      const sx = width / 2 + (q.x - width / 2) * scale;
      const sy = height / 2 + (q.y - height / 2) * scale;
      return rr(sx, sy, q.w * scale, q.h * scale, radius * scale);
    });
  const scrimD = `M0 0H${width}V${height}H0Z${holes.join("")}`;

  const headerT = interpolate(frame, [0, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const renderOpen = (
    d: LaunchDay,
    i: number,
    mode: "in" | "out",
    size: number,
  ) => {
    const fs = titleFs(d.title);
    const words = d.title.split(/\s+/).filter(Boolean);
    const shown = mode === "in";
    const eb = shown ? eyebrowT : 1 - outT(0);
    const numT = shown
      ? interpolate(frame, [24, 44], [0, 1], { ...CLAMP, easing: EASE_OUT })
      : 1 - outT(0);
    const descT = shown
      ? interpolate(
          frame,
          [40 + words.length * 3, 60 + words.length * 3],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        )
      : 1 - outT(1);
    const box = portrait ? cross : wide;
    const contentOpacity = interpolate(
      size,
      [sliver * 1.2, sliver * 2.4],
      [0, 1],
      CLAMP,
    );
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: portrait ? box : wide,
          height: portrait ? wide : cross,
          padding: panelPad,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: contentOpacity,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              marginTop: 6 * u,
              fontFamily: mono.fontFamily,
              fontWeight: 400,
              fontSize: labelFs * 1.1,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: activeFg,
              opacity: eb,
              transform: `translateX(${(1 - eb) * -16 * u}px)`,
            }}
          >
            <span>{d.day}</span>
            {label ? (
              <>
                <span
                  style={{
                    width: 22 * u,
                    height: 1,
                    background: p.activeMuted,
                    opacity: 0.6,
                  }}
                />
                <span style={{ color: p.activeMuted }}>{label}</span>
              </>
            ) : null}
          </div>
          <span
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingRight: "0.04em",
              marginTop: -numFs * 0.12,
              marginRight: -numFs * 0.02,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontFamily,
                fontWeight: 400,
                fontSize: numFs,
                lineHeight: 1,
                letterSpacing: "-0.05em",
                fontVariantNumeric: "tabular-nums",
                color: activeFg,
                transform: `translateY(${(1 - numT) * 100}%)`,
              }}
            >
              {pad2(i + 1)}
            </span>
          </span>
        </div>
        <div>
          <div
            style={{
              fontFamily,
              fontWeight: 400,
              fontSize: fs,
              lineHeight: 0.98,
              letterSpacing: "-0.045em",
              color: activeFg,
              textWrap: "balance",
              marginLeft: -fs * 0.04,
            }}
          >
            {words.map((w, k) => {
              const t = shown ? wordT(k) : 1;
              const o = shown ? 0 : outT(k);
              return (
                <Fragment key={`${w}-${k}`}>
                  {k > 0 ? " " : null}
                  <span
                    style={{
                      display: "inline-block",
                      overflow: "hidden",
                      verticalAlign: "top",
                      paddingBottom: "0.12em",
                      marginBottom: "-0.12em",
                      paddingRight: "0.05em",
                      marginRight: "-0.05em",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transform: `translateY(${(1 - t) * 105 - o * 105}%)`,
                      }}
                    >
                      {w}
                    </span>
                  </span>
                </Fragment>
              );
            })}
          </div>
          {d.description ? (
            <div
              style={{
                marginTop: fs * 0.26,
                maxWidth: Math.min(avail, 620 * u),
                fontFamily,
                fontWeight: 400,
                fontSize: (portrait ? 30 : 24) * u,
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
                color: p.activeMuted,
                textWrap: "balance",
                opacity: descT,
                transform: `translateY(${(1 - descT) * 12 * u}px)`,
                filter: `blur(${(1 - descT) * 5 * u}px)`,
              }}
            >
              {d.description}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {transparent || background ? null : (
        <>
          <GshGround
            preset={preset}
            params={groundParams ?? (ground ? undefined : p.groundParams)}
            timeOffset={theme === "light" ? 4 : 2}
            timeScale={0.5}
          />
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ position: "absolute", inset: 0 }}
            aria-hidden
          >
            <path d={scrimD} fill={p.scrim} fillRule="evenodd" />
          </svg>
        </>
      )}
      <ScaleLayer scale={scale}>
        {showHeader ? (
          <div
            style={{
              position: "absolute",
              left: marginX,
              right: marginX,
              top: 0,
              height: headerH + margin * 0.15,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: headerT,
              transform: `translateY(${(1 - headerT) * -8 * u}px)`,
            }}
          >
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: labelFs * 1.1,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: fg,
              }}
            >
              {week}
            </span>
            {logo === null ? null : (
              <div style={{ display: "flex", alignItems: "center" }}>
                {logo ?? <KuchiLogo fontSize={24 * u} color={fg} />}
              </div>
            )}
          </div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: stripX,
            top: stripY,
            width: stripW,
            height: stripH - margin * 0.15,
            display: "flex",
            flexDirection: portrait ? "column" : "row",
            gap,
          }}
        >
          {list.map((d, i) => {
            const size = sizeOf(i);
            const r = rise(i);
            const isAct = i === act;
            const isFrom = i === swap;
            const groundO = litO(i);
            const past = i < act;
            const upcoming = i > act;
            const sliverTitle = upcoming && !revealUpcoming ? "" : d.title;
            const labelO = interpolate(
              size,
              [equal * 1.05, equal * 1.6],
              [1, 0],
              CLAMP,
            );
            const numColor = isAct ? activeFg : past ? fg : p.muted;
            return (
              <div
                key={`${d.day}-${i}`}
                style={{
                  position: "relative",
                  flex: "none",
                  [portrait ? "height" : "width"]: size,
                  [portrait ? "width" : "height"]: "100%",
                  borderRadius: radius,
                  overflow: "hidden",
                  background: groundO > 0.001 ? undefined : p.panel,
                  boxShadow: `inset 0 0 0 1px ${groundO > 0.5 ? p.litLine : p.line}`,
                  clipPath: `inset(${Math.max(0, 1 - r) * 100}% 0 0 0 round ${radius}px)`,
                  transform: `translateY(${(1 - r) * 30 * u}px)`,
                }}
              >
                {groundO > 0 ? (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: p.scrim,
                        opacity: 1 - groundO,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: p.shade,
                        opacity: groundO,
                      }}
                    />
                  </>
                ) : null}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    padding: `${18 * u}px ${portrait ? 24 * u : 0}px`,
                    display: "flex",
                    flexDirection: portrait ? "row" : "column",
                    alignItems: portrait ? "center" : "center",
                    justifyContent: "space-between",
                    opacity: labelO * interpolate(r, [0.4, 1], [0, 1], CLAMP),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: portrait ? "row" : "column",
                      alignItems: "center",
                      gap: 10 * u,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono.fontFamily,
                        fontWeight: 400,
                        fontSize: labelFs * 1.15,
                        letterSpacing: "0.04em",
                        color: numColor,
                      }}
                    >
                      {pad2(i + 1)}
                    </span>
                    {past ? (
                      <span
                        style={{
                          width: 6 * u,
                          height: 6 * u,
                          borderRadius: 99,
                          background: accent,
                        }}
                      />
                    ) : null}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12 * u,
                      writingMode: portrait ? undefined : "vertical-rl",
                      transform: portrait ? undefined : "rotate(180deg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono.fontFamily,
                        fontWeight: 400,
                        fontSize: labelFs,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: past ? p.muted : p.faint,
                      }}
                    >
                      {d.day}
                    </span>
                    {sliverTitle ? (
                      <span
                        style={{
                          fontFamily,
                          fontWeight: 400,
                          fontSize: labelFs * 1.6,
                          letterSpacing: "-0.02em",
                          color: past ? fg : p.muted,
                        }}
                      >
                        {sliverTitle}
                      </span>
                    ) : null}
                  </div>
                </div>

                {isAct ? renderOpen(d, i, "in", size) : null}
                {isFrom ? renderOpen(d, i, "out", size) : null}
              </div>
            );
          })}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
