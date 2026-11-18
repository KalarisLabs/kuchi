/*! Portions Copyright (c) 2026 Remocn. MIT License. See THIRD_PARTY_LICENSES. */
"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: bricolage } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * gradients.sh "radial-glow" palette: [#f3f1ff, #9db4ff, #5a46cb, #1d1240].
 * On dark it is a disc of light rising behind the object and catching its
 * faces; on paper it tints the stage under the numeral.
 */
const GLOW = ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240"] as const;

export interface VersionHeroProps {
  /** The release number, rendered as the extruded object. */
  version?: string;
  /** Product name in the label under the numeral. */
  name?: string;
  /** Second half of the label. */
  label?: string;
  /** Replaces the label's name: by default the acme logo when `name` is "acme". */
  logo?: React.ReactNode;
  accent?: string;
  /** Text color of the label's name and logo; overrides the theme. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the numeral and label. Load it yourself; Bricolage Grotesque by default. */
  fontFamily?: string;
  /** Extrusion depth of the numeral, as a share of its font size. */
  depth?: number;
  /** Frames between slices as the stack docks. */
  stagger?: number;
  grain?: boolean;
  /** Size of the numeral and label, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Playback multiplier. */
  speed?: number;
  /** Dark = brushed aluminium; light = matte paper stock. */
  theme?: "dark" | "light";
}

const SLICES = 10;
const SUB = 4;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Horizontal streak noise: brushed metal grain. Low x frequency, high y. */
const BRUSHED = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><filter id='b'><feTurbulence type='fractalNoise' baseFrequency='0.003 0.75' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 0.2'/></filter><rect width='600' height='300' filter='url(%23b)'/></svg>")`;
/** Isotropic fibre noise: matte paper tooth. */
const PAPER = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.3  0 0 0 0.22 0'/></filter><rect width='240' height='240' filter='url(%23p)'/></svg>")`;

const MATERIALS = {
  dark: {
    bg: "#050508",
    stageLight: "rgba(255,255,255,0.05)",
    /** Strength of the rising disc, and of its tint on the faces. */
    glow: 1,
    glowTint: 0.32,
    /** How much the inside of the disc fills with violet. */
    disc: 1,
    /** The rim of the disc, inside → out. */
    ring: [GLOW[0], GLOW[1], GLOW[2]],
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.18)",
    faceBase:
      "linear-gradient(180deg, #C4C7CD 0%, #A9ADB4 30%, #8D9199 52%, #9FA3AA 74%, #6E727A 100%)",
    faceTexture: BRUSHED,
    faceTextureSize: "600px 300px",
    plate: "#7D8088",
    side: [
      [0x5c, 0x5e, 0x65],
      [0x26, 0x27, 0x2b],
    ],
    sideFloor: [0x0d, 0x0d, 0x0f],
    spec: 0.9,
    specSide: 0.35,
    bevel: "rgba(255,255,255,0.75)",
    shadow: "rgba(0,0,0,0.85)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    stageLight: "rgba(255,255,255,0.9)",
    glow: 0.8,
    glowTint: 0.16,
    disc: 0,
    ring: [GLOW[1], GLOW[2], GLOW[1]],
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    faceBase: "linear-gradient(180deg, #FFFFFF 0%, #F8F7F3 45%, #EDEBE5 100%)",
    faceTexture: PAPER,
    faceTextureSize: "240px 240px",
    plate: "#E4E1DA",
    side: [
      [0xd6, 0xd2, 0xc8],
      [0xb3, 0xae, 0xa2],
    ],
    sideFloor: [0x8f, 0x8a, 0x7f],
    spec: 0.55,
    specSide: 0.25,
    bevel: "rgba(255,255,255,1)",
    shadow: "rgba(60,52,40,0.32)",
    grain: 0.045,
  },
} as const;

type Material = (typeof MATERIALS)[keyof typeof MATERIALS];

function mix(a: readonly number[], b: readonly number[], t: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** A soft diagonal band of light at horizontal position `x` (0..1). */
function specBand(x: number, strength: number) {
  const c = x * 100;
  const a = `rgba(255,255,255,${strength})`;
  const h = `rgba(255,255,255,${strength * 0.28})`;
  return `linear-gradient(104deg, transparent ${c - 22}%, ${h} ${c - 9}%, ${a} ${c}%, ${h} ${c + 5}%, transparent ${c + 14}%)`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/** Placeholder wordmark, 100 units per em, baseline at y = 0. Pass your own logo. */
/** Ink box of the outlined logo, in its own units; the R is `rW` wide. */
const LOGO = { x: 0, y: -76, w: 250, h: 77.5, rW: 0 } as const;

/** The whole logo in one fill (a colour or a `url(#gradient)`). */
function LogoPaths({ fill }: { fill: string }) {
  return (
    <text x={0} y={0} fill={fill} fontFamily="Manrope, Inter, sans-serif" fontWeight={600} fontSize={100} letterSpacing={-2.5}>
      Acme
    </text>
  );
}

/** The logo at a font size, sitting on the label's baseline. */
function Logo({ size, color }: { size: number; color: string }) {
  const k = size / 100;
  return (
    <svg
      width={LOGO.w * k}
      height={LOGO.h * k}
      viewBox={`${LOGO.x} ${LOGO.y} ${LOGO.w} ${LOGO.h}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <LogoPaths fill={color} />
    </svg>
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

export function VersionHero({
  version = "2.0",
  name = "acme",
  label = "Now available",
  logo,
  accent = "#3B5BFD",
  ink,
  background: backdrop,
  fontFamily = bricolage,
  depth: extrude = 0.2,
  stagger = 2.2,
  grain = true,
  scale = 1,
  delay = 0,
  speed = 1,
  theme = "dark",
}: VersionHeroProps) {
  const t = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const m: Material = MATERIALS[theme];
  const fg = ink ?? m.fg;
  const stage = backdrop === "transparent" ? "transparent" : (backdrop ?? m.bg);

  const chars = Array.from(version).length;
  const fontSize = Math.min(height * 0.7, (width * 0.6) / (chars * 0.5));
  const depth = fontSize * extrude;
  const dz = depth / (SLICES * SUB);
  const spreadMax = fontSize * 0.42;
  const boxW = width;
  const boxH = fontSize * 1.2;
  const cy = height * 0.43;

  // camera: a slow eased orbit plus a gentle dolly-in
  const orbit = interpolate(t, [0, 150], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rotY = -24 + orbit * 16;
  const rotX = 10 - orbit * 4;
  const dolly = interpolate(t, [0, 70], [-220 * u, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // specular sweep across the faces once the stack has docked
  const sweep = interpolate(t, [44, 92], [-0.3, 1.35], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const restSheen = interpolate(t, [44, 92], [0, 1], CLAMP);
  // the disc of light rises behind the object as it docks
  const glowP = interpolate(t, [20, 96], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const glowY = 136 - 16 * glowP;

  const sliceP = (k: number) =>
    interpolate(t, [4 + k * stagger, 4 + k * stagger + 34], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const textStyle: React.CSSProperties = {
    position: "absolute",
    left: -boxW / 2,
    top: -boxH / 2,
    width: boxW,
    height: boxH,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily,
    fontWeight: 500,
    fontSize,
    lineHeight: 1,
    letterSpacing: "-0.05em",
    whiteSpace: "nowrap",
    color: "transparent",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    backfaceVisibility: "visible",
  };

  const layers: React.ReactNode[] = [];
  for (let k = SLICES - 1; k >= 0; k--) {
    const p = sliceP(k);
    const zSlice = -k * SUB * dz - k * spreadMax * (1 - p);
    const appear = interpolate(t, [-6 + k * 1.6, 8 + k * 1.6], [0, 1], CLAMP);
    const blur = ((k * spreadMax * (1 - p)) / (spreadMax * SLICES)) * 7 * u;
    const subs: React.ReactNode[] = [];
    for (let s = SUB - 1; s >= 0; s--) {
      const j = k * SUB + s;
      const isFace = j === 0;
      const depthT = j / (SLICES * SUB - 1);
      const top = mix(m.side[0], m.sideFloor, depthT * 0.55);
      const bottom = mix(m.side[1], m.sideFloor, depthT * 0.8);
      const sideSpec = specBand(sweep - depthT * 0.05, m.specSide);
      let background: string;
      if (isFace) {
        background = [
          specBand(sweep, m.spec),
          `linear-gradient(104deg, transparent 0%, rgba(255,255,255,${0.12 * restSheen}) 40%, transparent 75%)`,
          // the disc rising behind bounces up into the lower half of the face
          `linear-gradient(180deg, transparent 38%, color-mix(in oklab, ${GLOW[1]} ${Math.round(m.glowTint * 100 * glowP)}%, transparent) 78%, color-mix(in oklab, ${GLOW[2]} ${Math.round(m.glowTint * 100 * glowP)}%, transparent) 100%)`,
          m.faceTexture,
          m.faceBase,
        ].join(", ");
      } else if (s === 0) {
        // the leading face of each slice reads as a plate while spread out
        const plate = 1 - p;
        background = `linear-gradient(180deg, ${m.plate}${Math.round(
          plate * 255,
        )
          .toString(16)
          .padStart(2, "0")}, ${m.plate}${Math.round(plate * 200)
          .toString(16)
          .padStart(
            2,
            "0",
          )}), ${sideSpec}, linear-gradient(180deg, ${top}, ${bottom})`;
      } else {
        background = `${sideSpec}, linear-gradient(180deg, ${top}, ${bottom})`;
      }
      if (isFace) {
        // chamfer: a hairline of light just behind the face, nudged up-left
        subs.push(
          <div
            key="bevel"
            style={{
              ...textStyle,
              color: m.bevel,
              transform: `translate3d(${-0.8 * u}px, ${-1 * u}px, ${-dz * 0.5}px)`,
            }}
          >
            {version}
          </div>,
        );
      }
      subs.push(
        <div
          key={j}
          style={{
            ...textStyle,
            transform: `translateZ(${-s * dz}px)`,
            backgroundImage: background,
            backgroundSize: isFace
              ? `100% 100%, 100% 100%, 100% 100%, ${m.faceTextureSize}, 100% 100%`
              : undefined,
          }}
        >
          {version}
        </div>,
      );
    }
    layers.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformStyle: blur > 0.15 ? undefined : "preserve-3d",
          transform: `translateZ(${zSlice}px)`,
          opacity: appear,
          filter: blur > 0.15 ? `blur(${blur}px)` : undefined,
        }}
      >
        {subs}
      </div>,
    );
  }

  // label under the object
  const labelP = (d: number) =>
    interpolate(t, [62 + d, 86 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const labelTop = cy + fontSize * 0.4 + 44 * u;

  const shadowO = interpolate(t, [10, 60], [0.35, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {/* overhead key light on the stage */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at 50% 30%, ${m.stageLight}, transparent 72%)`,
        }}
      />
      {/* radial-glow: a disc of light rising behind the numeral */}
      <AbsoluteFill
        style={{
          opacity: m.glow * glowP,
          background: [
            `radial-gradient(82% 100% at 50% ${glowY}%, transparent 53%, color-mix(in oklab, ${m.ring[0]} 85%, transparent) 56.5%, color-mix(in oklab, ${m.ring[1]} 50%, transparent) 60%, color-mix(in oklab, ${m.ring[2]} 22%, transparent) 66%, transparent 78%)`,
            `radial-gradient(82% 100% at 50% ${glowY}%, color-mix(in oklab, ${GLOW[2]} ${Math.round(70 * m.disc)}%, transparent) 0%, color-mix(in oklab, ${GLOW[3]} ${Math.round(60 * m.disc)}%, transparent) 40%, transparent 56%)`,
          ].join(", "),
        }}
      />
      <ScaleLayer scale={scale}>
        {/* contact shadow */}
        <div
          style={{
            position: "absolute",
            left: width / 2 - fontSize * 0.95,
            top: cy + fontSize * 0.3,
            width: fontSize * 1.9,
            height: fontSize * 0.16,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${m.shadow}, transparent)`,
            filter: `blur(${14 * u}px)`,
            opacity: shadowO,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            perspective: 2000 * u,
            perspectiveOrigin: `50% ${(cy / height) * 100}%`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: width / 2,
              top: cy,
              width: 0,
              height: 0,
              transformStyle: "preserve-3d",
              transform: `translateZ(${dolly}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            }}
          >
            {layers}
          </div>
        </div>

        {/* label */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: labelTop,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16 * u,
            fontFamily,
            fontSize: 22 * u,
            lineHeight: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9 * u,
              opacity: labelP(0),
              transform: `translateY(${(1 - labelP(0)) * 14 * u}px)`,
            }}
          >
            {logo ??
              (name.trim().toLowerCase() === "acme" ? (
                <Logo size={30 * u} color={fg} />
              ) : (
                <span
                  style={{
                    color: fg,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    fontSize: 26 * u,
                  }}
                >
                  {name}
                </span>
              ))}
          </div>
          <div
            style={{
              width: Math.max(1, u),
              height: 22 * u,
              background: accent,
              transform: `scaleY(${labelP(3)})`,
            }}
          />
          <span
            style={{
              color: m.muted,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              opacity: labelP(6),
              transform: `translateY(${(1 - labelP(6)) * 14 * u}px)`,
            }}
          >
            {label}
          </span>
        </div>
      </ScaleLayer>

      {grain ? <Grain opacity={m.grain} /> : null}
    </AbsoluteFill>
  );
}
