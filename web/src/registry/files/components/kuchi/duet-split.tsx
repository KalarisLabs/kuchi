/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
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

const { fontFamily: sans } = loadSans("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});


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

export interface DuetRow {
  before: string;
  after: string;
}

export interface DuetSplitProps {
  beforeLabel?: string;
  afterLabel?: string;
  rows?: DuetRow[];
  accent?: string;
  /** Text color of the after side and the mark; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the labels and the after side. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  /** Frames between rows. */
  stagger?: number;
  /** Frames the last row holds before the after side takes over. */
  hold?: number;
  /** Replaces the acme mark. */
  logo?: React.ReactNode;
  /** Size of the split and the mark, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
  speed?: number;
}

const LABEL_AT = 6;
const ROW_AT = 18;
const ROW_GAP = 16;
const TRICKLE = 3;
const GLYPH_LEN = 14;
const PUSH_DELAY = 24;
const PUSH_LEN = 16;

const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    ground: "film-blue" as GshPresetId,
    base: "#03070F",
    slab: "#161618",
    seam: "rgba(255,255,255,0.10)",
    ink: "#F4F5F8",
    muted: "rgba(244,245,248,0.62)",
    grey: "#6B6A70",
    greyLabel: "#7E7D83",
    scrim: "3,7,15",
    scrimA: 0.5,
    shadow: "0 1px 18px rgba(3,7,15,0.45)",
  },
  light: {
    ground: "paper-crease" as GshPresetId,
    base: "#EEECE8",
    slab: "#D9D6CF",
    seam: "rgba(0,0,0,0.10)",
    ink: "#121318",
    muted: "rgba(18,19,24,0.6)",
    grey: "#A29F97",
    greyLabel: "#8D8A82",
    scrim: "238,236,232",
    scrimA: 0.45,
    shadow: "none",
  },
} as const;

function ramp(t: number, from: number, len: number) {
  return interpolate(t, [from, from + len], [0, 1], CLAMP);
}

function kick(d: number) {
  if (d < 0) return 0;
  if (d < 2) return d / 2;
  const k = Math.max(0, 1 - (d - 2) / 8);
  return k * k;
}

function Wobbly({
  text,
  at,
  t,
  fontSize,
  color,
  seed,
}: {
  text: string;
  at: number;
  t: number;
  fontSize: number;
  color: string;
  seed: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: serif,
        fontWeight: 400,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color,
        whiteSpace: "pre",
      }}
    >
      {[...text].map((ch, k) => {
        const p = MOVE(ramp(t, at + k * TRICKLE, GLYPH_LEN));
        const ph = seed * 2.3 + k * 1.1;
        const wy = Math.sin(t * 0.13 + ph) * 0.035 * fontSize;
        const rot = Math.sin(t * 0.09 + ph * 0.7) * 3;
        return (
          <span
            key={k}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 0.35 * fontSize + wy}px) rotate(${rot * (0.4 + 0.6 * p)}deg)`,
              filter:
                p < 0.98 ? `blur(${(1 - p) * 0.05 * fontSize}px)` : undefined,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

function Label({
  text,
  fs,
  color,
  dot,
  fontFamily,
}: {
  text: string;
  fs: number;
  color: string;
  dot: string;
  fontFamily: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: fs * 0.5,
        fontFamily,
        fontWeight: 400,
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: "-0.005em",
        color,
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: fs * 0.36,
          height: fs * 0.36,
          borderRadius: fs,
          background: dot,
        }}
      />
      {text}
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

export function DuetSplit({
  beforeLabel = "Before",
  afterLabel = "With acme",
  rows = [
    { before: "3 weeks", after: "1 day" },
    { before: "an agency", after: "you" },
    { before: "$12K", after: "$0" },
  ],
  accent = "#3B5BFD",
  ink,
  background,
  fontFamily = sans,
  stagger = ROW_GAP,
  hold = PUSH_DELAY,
  logo,
  scale = 1,
  delay = 0,
  theme = "dark",
  ground,
  groundParams,
  speed = 1,
}: DuetSplitProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const fg = ink ?? c.ink;
  const tall = H > W;

  const sp = (at: number, config: object, durationInFrames?: number) =>
    spring({
      frame: t - at,
      fps,
      config,
      ...(durationInFrames ? { durationInFrames } : {}),
    });

  const open = sp(-5, HEAVY);
  const lastRowAt = ROW_AT + (rows.length - 1) * stagger;
  const pushAt = lastRowAt + hold;
  const push = sp(pushAt, MORPH, PUSH_LEN);
  const logoAt = pushAt + PUSH_LEN - 4;
  const pLogo = sp(logoAt, CARD);

  const fs = tall ? 0.135 * W : 0.15 * H;
  const gap = fs * 1.18;
  const labelFs = tall ? 0.024 * H : 0.034 * H;
  const margin = tall ? 0.07 * W : 0.05 * W;

  const half = tall ? H / 2 : W / 2;
  const slabStyle = tall
    ? {
        left: 0,
        top: 0,
        width: W,
        height: H / 2,
        transform: `translateY(${-(1 - open) * half - push * half}px)`,
      }
    : {
        left: 0,
        top: 0,
        width: W / 2,
        height: H,
        transform: `translate(${-push * half}px, ${-(1 - open) * H}px)`,
      };

  const beforeC = tall
    ? { x: W / 2, y: H * 0.27 }
    : { x: W * 0.25, y: H * 0.54 };
  const afterStart = tall
    ? { x: W / 2, y: H * 0.77 }
    : { x: W * 0.75, y: H * 0.54 };
  const afterEnd = tall ? { x: W / 2, y: H * 0.46 } : { x: W / 2, y: H * 0.45 };
  const ac = {
    x: afterStart.x + (afterEnd.x - afterStart.x) * push,
    y: afterStart.y + (afterEnd.y - afterStart.y) * push,
  };
  const grow = 1 + (tall ? 0.16 : 0.2) * push;
  const rowY = (i: number) => (i - (rows.length - 1) / 2) * gap;

  const bump = Math.max(
    ...rows.map((_, i) => 0.6 * kick(t - ROW_AT - i * stagger - 3)),
    kick(t - pushAt - PUSH_LEN + 4),
  );
  const camScale =
    1 + 0.016 * bump + interpolate(t, [0, 160], [0, 0.02], CLAMP);

  const afterOpen = sp(2, HEAVY);
  const labelIn = ENTER(ramp(t, LABEL_AT, 12));
  const labelOut = EXIT(ramp(t, pushAt, 8));

  const crisp = (text: string, at: number) => {
    const p = sp(at, CHIP);
    return (
      <div
        style={{
          fontFamily,
          fontWeight: 300,
          fontSize: fs,
          lineHeight: 1,
          letterSpacing: "-0.045em",
          whiteSpace: "nowrap",
          color: fg,
          textShadow: c.shadow,
          opacity: ENTER(ramp(t, at, 3)),
          transform: `translateY(${(1 - p) * 0.22 * fs}px) scale(${1.1 - 0.1 * p})`,
        }}
      >
        {text}
      </div>
    );
  };

  const place = (x: number, y: number, child: React.ReactNode, key: string) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 0,
        height: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {child}
    </div>
  );

  const afterLabelPos = tall
    ? { left: margin, top: H / 2 + margin }
    : { left: W / 2 + margin, top: margin * 1.2 };
  const scrimAt = tall
    ? `50% ${(ac.y / H) * 100}%`
    : `${(ac.x / W) * 100}% 54%`;

  return (
    <AbsoluteFill
      style={{
        background: background === undefined ? c.base : undefined,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <>
          <GshGround
            preset={groundParams ? undefined : (ground ?? c.ground)}
            params={groundParams}
            timeOffset={theme === "dark" ? 4 : 6}
            timeScale={0.5}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(${tall ? "80% 34%" : "40% 60%"} at ${scrimAt}, rgba(${c.scrim},${c.scrimA}) 0%, rgba(${c.scrim},0) 100%)`,
            }}
          />
        </>
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${camScale})`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              ...afterLabelPos,
              opacity: labelIn * (1 - labelOut),
              transform: `translateY(${(1 - labelIn) * labelFs * 0.6}px)`,
            }}
          >
            <Label
              text={afterLabel}
              fs={labelFs}
              color={fg}
              dot={accent}
              fontFamily={fontFamily}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformOrigin: `${ac.x}px ${ac.y}px`,
              transform: `translateY(${(1 - afterOpen) * 0.08 * H}px) scale(${grow})`,
            }}
          >
            {rows.map((r, i) => {
              const at = ROW_AT + i * stagger;
              return t >= at
                ? place(ac.x, ac.y + rowY(i), crisp(r.after, at), `a-${i}`)
                : null;
            })}
          </div>

          <div
            style={{
              position: "absolute",
              ...slabStyle,
              background: c.slab,
              boxShadow: tall
                ? `inset 0 -1px 0 ${c.seam}`
                : `inset -1px 0 0 ${c.seam}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: margin,
                top: tall ? margin : margin * 1.2,
                opacity: labelIn,
                transform: `translateY(${(1 - labelIn) * labelFs * 0.6}px)`,
              }}
            >
              <Label
                text={beforeLabel}
                fs={labelFs}
                color={c.greyLabel}
                dot={c.grey}
                fontFamily={fontFamily}
              />
            </div>
            {rows.map((r, i) =>
              place(
                tall ? W / 2 : W * 0.25,
                beforeC.y + rowY(i),
                <Wobbly
                  text={r.before}
                  at={ROW_AT + i * stagger}
                  t={t}
                  fontSize={fs * 1.04}
                  color={c.grey}
                  seed={i + 1}
                />,
                `b-${i}`,
              ),
            )}
          </div>
        </AbsoluteFill>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: tall ? 0.08 * H : 0.085 * H,
            display: "flex",
            justifyContent: "center",
            opacity: ENTER(ramp(t, logoAt, 6)),
            transform: `translateY(${(1 - pLogo) * 0.05 * H}px)`,
          }}
        >
          {logo ?? (
            <KuchiLogo fontSize={tall ? 0.04 * H : 0.055 * H} color={fg} />
          )}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
