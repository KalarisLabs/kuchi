/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import { loadFont } from "@remotion/google-fonts/Figtree";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/kuchi/gsh/gradient-engine";
import { GshGround } from "@/lib/kuchi/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/kuchi/gsh/presets";

const figtree = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});
const sans = figtree.fontFamily;


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

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(s: string, size: number, family: string, weight: number) {
  if (!measureCtx && typeof document !== "undefined") {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return s.length * size * 0.52;
  measureCtx.font = `${weight} ${size}px "${family}"`;
  return measureCtx.measureText(s).width;
}

function measure(
  version: number,
  name: string,
  features: string[],
  labelSize: number,
  featSize: number,
  fontFamily: string,
) {
  return {
    version,
    logo:
      textWidth("Acme", labelSize, manrope.fontFamily, 600) -
      labelSize * 0.025 * 4,
    name: textWidth(name, labelSize, fontFamily, 400),
    feats: features.map((f) => textWidth(f, featSize, fontFamily, 400)),
  };
}

function useFontVersion(fontFamily: string) {
  const [handle] = useState(() => delayRender("pill-morph: fonts"));
  const [version, setVersion] = useState(0);
  const released = useRef(false);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    Promise.all([
      figtree.waitUntilDone(),
      manrope.waitUntilDone(),
      document.fonts.load(`400 100px "${fontFamily}"`).catch(() => undefined),
    ]).then(() => {
      bump();
      if (!released.current) {
        released.current = true;
        continueRender(handle);
      }
    });
    if (typeof document === "undefined") return;
    document.fonts.addEventListener("loadingdone", bump);
    return () => document.fonts.removeEventListener("loadingdone", bump);
  }, [handle, fontFamily]);
  return version;
}

export interface PillMorphProps {
  features?: [string, string, string];
  logo?: React.ReactNode;
  name?: string;
  src?: string;
  children?: React.ReactNode;
  accent?: string;
  /** Caption over the preview in the built-in editor mock. */
  caption?: string;
  /** Corner radius of the open card, in px at 720p. */
  radius?: number;
  /** Text color of the name and features; overrides the theme ink. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Size of the pill and card, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    base: "#04050A",
    scrim: "4,5,10",
    surface: "#17181C",
    fg: "#F3F2EF",
    muted: "rgba(243,242,239,0.55)",
    block: "rgba(255,255,255,0.06)",
    blockHi: "rgba(255,255,255,0.11)",
    hair: "rgba(255,255,255,0.08)",
    imgLine: "rgba(255,255,255,0.1)",
    ring: "rgba(255,255,255,0.1)",
    rim: "rgba(255,255,255,0.16)",
    shadow: "rgba(0,0,0,0.6)",
  },
  light: {
    base: "#EEF0F6",
    scrim: "244,244,247",
    surface: "#FFFFFF",
    fg: "#121214",
    muted: "rgba(18,18,20,0.55)",
    block: "rgba(18,18,20,0.05)",
    blockHi: "rgba(18,18,20,0.09)",
    hair: "rgba(18,18,20,0.08)",
    imgLine: "rgba(0,0,0,0.1)",
    ring: "rgba(18,18,20,0.09)",
    rim: "rgba(255,255,255,1)",
    shadow: "rgba(40,44,70,0.22)",
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const FEATURE_ICONS = [
  "M2.5 5.5h7v7h-7zM6.5 5.5V3.5h7v7h-4",
  "M2 3.5h12v9H2zM4.5 8h4.5M11 8h.5M4.5 10.5h7",
  "M2 3.5h12v9H2zM2 10.5c3.5-3.5 7-3.5 12-1.5M10.5 6.5h.01",
];

const SCENES = [
  { name: "Intro", len: "0:02" },
  { name: "Product", len: "0:03" },
  { name: "Captions", len: "0:02" },
  { name: "Pricing", len: "0:02" },
  { name: "Changelog", len: "0:02" },
  { name: "Outro", len: "0:01" },
];

const CLIPS = [
  [0, 0.17, 0],
  [0.18, 0.5, 1],
  [0.51, 0.74, 0],
  [0.75, 1, 0],
] as const;

function Editor({
  w,
  h,
  u,
  p,
  accent,
  t,
  caption,
  fontFamily,
}: {
  w: number;
  h: number;
  u: number;
  p: Palette;
  accent: string;
  t: number;
  caption: string;
  fontFamily: string;
}) {
  const side = w * 0.27;
  const fs = 16 * u;
  const row = (i: number) =>
    interpolate(t, [34 + i * 3, 50 + i * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const play = interpolate(t, [40, 110], [0.24, 0.47], CLAMP);
  const secs = play * 12;
  const tc = `0:${String(Math.floor(secs)).padStart(2, "0")}.${String(Math.floor((secs % 1) * 30)).padStart(2, "0")}`;
  const right = side + 16 * u;
  const rw = w - right;
  const prevH = h * 0.62;
  const barY = prevH + 12 * u;
  const trackY = barY + 34 * u;
  const trackH = h - trackY;
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily }}>
      {SCENES.map((sc, i) => (
        <div
          key={sc.name}
          style={{
            position: "absolute",
            left: 0,
            top: i * 42 * u,
            width: side - 12 * u,
            height: 34 * u,
            borderRadius: 8 * u,
            background: i === 1 ? p.block : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 9 * u,
            padding: `0 ${10 * u}px`,
            boxSizing: "border-box",
            fontSize: fs,
            color: i === 1 ? p.fg : p.muted,
            opacity: row(i),
            transform: `translateX(${(1 - row(i)) * -10 * u}px)`,
          }}
        >
          <div
            style={{
              width: 7 * u,
              height: 7 * u,
              borderRadius: "50%",
              background: i === 1 ? accent : p.blockHi,
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1 }}>{sc.name}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>
            {sc.len}
          </span>
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: side,
          top: 0,
          bottom: 0,
          width: 1,
          background: p.hair,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: right,
          top: 0,
          width: rw,
          height: prevH,
          borderRadius: 10 * u,
          overflow: "hidden",
          opacity: row(1),
          transform: `translateY(${(1 - row(1)) * 12 * u}px)`,
        }}
      >
        <Img
          src={"https://kuchi-media.kalarislabs.com/components/art/art-08.svg"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${1.04 + play * 0.1})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10 * u,
            boxShadow: `inset 0 0 0 1px ${p.imgLine}`,
            background:
              "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.42) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16 * u,
            bottom: 14 * u,
            fontSize: 22 * u,
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            opacity: row(3),
          }}
        >
          {caption}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: right,
          top: barY,
          width: rw,
          height: 24 * u,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontSize: fs,
          color: p.muted,
          fontVariantNumeric: "tabular-nums",
          opacity: row(2),
        }}
      >
        <svg
          width={14 * u}
          height={14 * u}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4.5 3.2v9.6l8-4.8z"
            stroke={p.fg}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ color: p.fg }}>{tc}</span>
        <span>/ 0:12.00</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: right,
          top: trackY,
          width: rw,
          height: trackH,
          opacity: row(3),
          transform: `translateY(${(1 - row(3)) * 10 * u}px)`,
        }}
      >
        {CLIPS.map(([a, b, on]) => (
          <div
            key={a}
            style={{
              position: "absolute",
              left: `${a * 100}%`,
              width: `calc(${(b - a) * 100}% - ${3 * u}px)`,
              top: 0,
              height: trackH * 0.52,
              borderRadius: 6 * u,
              background: on ? accent : p.blockHi,
              boxShadow: on
                ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                : `inset 0 0 0 1px ${p.hair}`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: "30%",
            width: "36%",
            bottom: 0,
            height: trackH * 0.3,
            borderRadius: 5 * u,
            background: p.block,
            boxShadow: `inset 0 0 0 1px ${p.hair}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `${play * 100}%`,
            top: -6 * u,
            bottom: -2 * u,
            width: 1.5 * u,
            background: p.fg,
            borderRadius: u,
          }}
        />
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

interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  r: [number, number, number, number];
}

export function PillMorph({
  name = "",
  features = ["Transitions", "Captions", "Backgrounds"],
  logo,
  src,
  children,
  accent = "#3B5BFD",
  caption = "Launch day, in one take",
  radius = 28,
  ink,
  background,
  fontFamily = sans,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
  ground,
  groundParams,
}: PillMorphProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { fps, width, height } = useVideoConfig();
  const tall = height > width;
  const u = tall ? width / 760 : Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const fg = ink ?? p.fg;
  const dark = theme === "dark";
  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "velvet-hour" : "glasswork");
  const gid = `goo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const fontVersion = useFontVersion(fontFamily);
  const cx = width / 2;
  const cy = height / 2;

  const sp = (
    start: number,
    config: { mass?: number; damping?: number; stiffness?: number },
  ) =>
    spring({
      frame: t - start,
      fps,
      config,
    });
  const fade = (a: number, b: number) =>
    interpolate(t, [a, b], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const labelSize = 23 * u;
  const featSize = (tall ? 26 : 23) * u;
  const markSize = 24 * u;
  const pad = 20 * u;
  const widths = useMemo(
    () => measure(fontVersion, name, features, labelSize, featSize, fontFamily),
    [fontVersion, name, features, labelSize, featSize, fontFamily],
  );
  const labelW = logo ? markSize + 9 * u + widths.name : widths.logo;
  const w0 = labelW + pad * 2;
  const h0 = 52 * u;
  const cw = tall ? width * 0.86 : Math.min(width * 0.6, 760 * u);
  const ch = tall ? cw * 0.86 : Math.min(height * 0.64, 450 * u);
  const cr = radius * u;
  const barH = 66 * u;
  const pws = widths.feats.map((fw) => Math.max(170 * u, fw + 92 * u));
  const total = pws[0] + pws[1] + pws[2];
  const gap = (tall ? 18 : 30) * u;
  const tile = (tall ? 220 : 164) * u;
  const tileR = (tall ? 58 : 44) * u;
  const tileCy = cy - 22 * u;

  const appear = sp(-4, CARD);
  const wP = sp(18, MORPH);
  const hP = sp(24, MORPH);
  const collapse = sp(102, MORPH);
  const split = sp(116, CARD);
  const merge = sp(168, MORPH);
  const settle = sp(182, CHIP);

  let w = lerp(w0, cw, wP);
  let h = lerp(h0, ch, hP);
  w = lerp(w, total, collapse);
  h = lerp(h, barH, collapse);
  const rCard = Math.min(h / 2, lerp(h0 / 2, cr, hP));
  const r = Math.min(h / 2, lerp(rCard, h / 2, collapse));
  const lift = (1 - appear) * 14 * u;
  const scale0 = 0.94 + 0.06 * appear;

  const shapes: Shape[] = [];
  if (t < 116) {
    shapes.push({
      x: cx - (w * scale0) / 2,
      y: cy - (h * scale0) / 2 + lift,
      w: w * scale0,
      h: h * scale0,
      r: [r, r, r, r],
    });
  } else {
    const spread = Math.max(0, split) * (1 - merge);
    const g = gap * spread;
    const k = w / total;
    let left = cx - (w + g * 2) / 2;
    pws.forEach((pw0, i) => {
      const pw = pw0 * k;
      const ph = h;
      const inner = r * Math.min(1, Math.max(0, split));
      const segCx = left + pw / 2;
      left += pw + g;
      const mx = lerp(segCx, cx, merge);
      const mw =
        lerp(pw, tile, merge) * (1 + 0.06 * Math.max(0, settle - merge));
      const mh = lerp(ph, tile, merge);
      const mr = lerp(r, tileR, merge);
      const rr: [number, number, number, number] =
        i === 0
          ? [r, inner, inner, r]
          : i === 2
            ? [inner, r, r, inner]
            : [inner, inner, inner, inner];
      const rm = rr.map((v) => lerp(v, mr, merge)) as Shape["r"];
      shapes.push({
        x: mx - mw / 2,
        y: lerp(cy, tileCy, merge) - mh / 2,
        w: mw,
        h: mh,
        r: rm,
      });
    });
  }

  const labelOut = 1 - fade(103, 112);
  const content = fade(34, 52) * (1 - fade(96, 106));
  const featIn = (i: number) =>
    fade(122 + i * 3, 136 + i * 3) * (1 - fade(164 + i * 2, 172 + i * 2));
  const tileFill = fade(176, 194);
  const markIn = fade(186, 202);
  const nameIn = fade(196, 216);

  const s0 = shapes[0];
  const labelX = t < 116 ? s0.x + pad * scale0 : 0;
  const labelY =
    t < 116 ? s0.y + Math.min(s0.h / 2, 30 * u) - (labelSize * scale0) / 2 : 0;

  const drift = interpolate(t, [0, 240], [1, 1.035]);
  const tileGlow = fade(178, 200);
  const blur = 12 * u;

  return (
    <AbsoluteFill
      style={{
        background:
          background === undefined
            ? p.base
            : background === "transparent"
              ? undefined
              : background,
        overflow: "hidden",
      }}
    >
      {background === undefined ? (
        <>
          <GshGround
            preset={resolvedGround}
            params={groundParams}
            timeOffset={dark ? 4 : 5}
            timeScale={0.45}
          />
          <AbsoluteFill
            style={{
              background: `radial-gradient(60% 60% at 50% 48%, rgba(${p.scrim},${dark ? 0.5 : 0.36}) 0%, rgba(${p.scrim},${dark ? 0.18 : 0.1}) 100%)`,
            }}
          />
        </>
      ) : null}
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter
            id={gid}
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={blur}
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12"
              result="goo"
            />
            <feMorphology
              in="goo"
              operator="erode"
              radius={Math.max(1, u)}
              result="inner"
            />
            <feComposite in="goo" in2="inner" operator="out" result="ring" />
            <feFlood floodColor={p.ring} result="ringColor" />
            <feComposite
              in="ringColor"
              in2="ring"
              operator="in"
              result="hair"
            />
            <feOffset in="goo" dy={1.5 * u} result="low" />
            <feComposite in="goo" in2="low" operator="out" result="top" />
            <feFlood floodColor={p.rim} result="rimColor" />
            <feComposite in="rimColor" in2="top" operator="in" result="rim" />
            <feMerge>
              <feMergeNode in="goo" />
              <feMergeNode in="hair" />
              <feMergeNode in="rim" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <ScaleLayer scale={scale}>
        <AbsoluteFill
          style={{
            transform: `scale(${drift})`,
            opacity: interpolate(appear, [0, 0.4], [0, 1], CLAMP),
          }}
        >
          <AbsoluteFill
            style={{
              filter: `drop-shadow(0 ${16 * u}px ${28 * u}px ${p.shadow})`,
            }}
          >
            <AbsoluteFill style={{ filter: `url(#${gid})` }}>
              {shapes.map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: s.x,
                    top: s.y,
                    width: s.w,
                    height: s.h,
                    borderRadius: `${s.r[0]}px ${s.r[1]}px ${s.r[2]}px ${s.r[3]}px`,
                    background: p.surface,
                  }}
                />
              ))}
            </AbsoluteFill>
          </AbsoluteFill>

          {t < 116 ? (
            <div
              style={{
                position: "absolute",
                left: labelX,
                top: labelY,
                display: "flex",
                alignItems: "center",
                gap: 9 * u * scale0,
                opacity: labelOut * fade(-2, 9),
                transform: `scale(${scale0})`,
                transformOrigin: "0 0",
              }}
            >
              {logo ? (
                <>
                  {logo}
                  <span
                    style={{
                      fontFamily,
                      fontWeight: 400,
                      fontSize: labelSize,
                      letterSpacing: "-0.02em",
                      color: fg,
                      lineHeight: `${markSize}px`,
                    }}
                  >
                    {name}
                  </span>
                </>
              ) : (
                <div
                  style={{
                    height: labelSize,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <KuchiLogo fontSize={labelSize} color={fg} />
                </div>
              )}
            </div>
          ) : null}

          {t < 116 && content > 0 ? (
            <div
              style={{
                position: "absolute",
                left: s0.x + 22 * u,
                top: s0.y + 64 * u,
                width: cw - 44 * u,
                height: ch - 86 * u,
                opacity: content,
                overflow: "hidden",
                borderRadius: 12 * u,
                clipPath: `inset(0 0 ${Math.max(0, ch - 86 * u - (s0.h - 86 * u))}px 0)`,
              }}
            >
              {children ??
                (src ? (
                  <Img
                    src={src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Editor
                    w={cw - 44 * u}
                    h={ch - 86 * u}
                    u={u}
                    p={p}
                    accent={accent}
                    t={t}
                    caption={caption}
                    fontFamily={fontFamily}
                  />
                ))}
            </div>
          ) : null}

          {t >= 116
            ? shapes.map((s, i) => {
                const k = featIn(i);
                if (k <= 0) return null;
                return (
                  <div
                    key={features[i]}
                    style={{
                      position: "absolute",
                      left: s.x,
                      top: s.y,
                      width: s.w,
                      height: s.h,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10 * u,
                      fontFamily,
                      fontWeight: 400,
                      fontSize: featSize,
                      letterSpacing: "-0.01em",
                      color: fg,
                      whiteSpace: "nowrap",
                      opacity: k,
                      transform: `translateY(${(1 - k) * 6 * u}px)`,
                    }}
                  >
                    <svg
                      width={featSize * 0.95}
                      height={featSize * 0.95}
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d={FEATURE_ICONS[i % FEATURE_ICONS.length]}
                        stroke={p.muted}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {features[i]}
                  </div>
                );
              })
            : null}

          {tileFill > 0 && t >= 116 ? (
            <div
              style={{
                position: "absolute",
                left: shapes[1].x,
                top: shapes[1].y,
                width: shapes[1].w,
                height: shapes[1].h,
                borderRadius: `${shapes[1].r[0]}px`,
                background: `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 48%, rgba(0,0,0,0.14) 100%), ${accent}`,
                opacity: tileFill,
                boxShadow: `inset 0 ${1.5 * u}px 0 rgba(255,255,255,0.3), 0 ${18 * u}px ${48 * u}px -${10 * u}px ${accent}${Math.round(
                  tileGlow * 140,
                )
                  .toString(16)
                  .padStart(2, "0")}`,
              }}
            />
          ) : null}

          {markIn > 0 ? (
            <div
              style={{
                position: "absolute",
                left: cx - tile / 2,
                top: tileCy - tile / 2,
                width: tile,
                height: tile,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: markIn,
                transform: `translateY(${(1 - markIn) * 6 * u}px) scale(${0.92 + 0.08 * markIn})`,
              }}
            >
              {logo ?? (
                <svg
                  viewBox="0 0 124.06 134.26"
                  height={tile * 0.46}
                  width={(tile * 0.46 * 124.06) / 134.26}
                  style={{ marginLeft: tile * 0.03 }}
                  aria-hidden
                >
                  <circle cx="62.03" cy="67.13" r="56" fill="#FFFFFF" />
                </svg>
              )}
            </div>
          ) : null}
          {nameIn > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: tileCy + tile / 2 + 30 * u,
                display: "flex",
                justifyContent: "center",
                opacity: nameIn,
                transform: `translateY(${(1 - nameIn) * 10 * u}px)`,
              }}
            >
              {logo ? (
                <span
                  style={{
                    fontFamily,
                    fontWeight: 400,
                    fontSize: 28 * u,
                    letterSpacing: "-0.02em",
                    color: fg,
                  }}
                >
                  {name}
                </span>
              ) : (
                <KuchiLogo fontSize={34 * u} color={fg} />
              )}
            </div>
          ) : null}
        </AbsoluteFill>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
