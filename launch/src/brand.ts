import { loadFont } from "@remotion/google-fonts/InterTight";
import type { KuchiTheme } from "@/lib/kuchi-ui";

// One face for the whole film.
const INTER_TIGHT = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
export const FONT = INTER_TIGHT.fontFamily;
/** Resolves once every Inter Tight face is in the document (canvas text needs it before it rasterizes). */
export const fontReady = INTER_TIGHT.waitUntilDone;

export const C = {
  paper: "#FFFFFF",
  paper2: "#FAFAF9",
  ink: "#171717",
  muted: "#737373",
  line: "rgba(23,23,23,0.08)",
  popcorn: "#ED4035",
  butter: "#FFF3D2",
} as const;

export const theme: Partial<KuchiTheme> = {
  background: C.paper,
  foreground: C.ink,
  card: C.paper,
  cardForeground: C.ink,
  primary: C.popcorn,
  primaryForeground: C.paper,
  secondary: C.paper2,
  secondaryForeground: C.ink,
  muted: C.paper2,
  mutedForeground: C.muted,
  accent: C.popcorn,
  accentForeground: C.paper,
  border: C.line,
  input: C.line,
  ring: C.popcorn,
  fontFamily: FONT,
};

// --- The popcorn mark, from web/public/favicon.svg (a 64 box) ---------------

const PUFF = "M12 32C3 25 8 13 17 15 16 4 30 2 34 12 41 2 54 9 50 19 61 19 63 31 53 35Z";
const BUCKET = "M9 31L55 31L49 59L15 59Z";
const STRIPES = "M20 31L28 31L29 59L22 59Z M36 31L44 31L42 59L35 59Z";

/** Scale every x,y pair of an absolute M/C/L path. */
const fit = (d: string, s: number, dx: number, dy: number) => {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => {
    const v = Number(n);
    const out = i % 2 === 0 ? v * s + dx : v * s + dy;
    i++;
    return String(Math.round(out * 100) / 100);
  });
};

// Content spans x 3..63, y 2..59. Centre it in a 0 0 100 100 box.
const S = 1.6;
const box = (d: string) => fit(d, S, 50 - 33 * S, 50 - 30.5 * S);

/** One-colour silhouette for 0 0 100 100 slots (Announce Title). */
export const POPCORN_SILHOUETTE = `${box(PUFF)} ${box(BUCKET)}`;

/** Same silhouette in its own tight box, for Spec Sweep's icon slot. */
export const POPCORN_ICON = {
  path: `${fit(PUFF, 1, -3, -2)} ${fit(BUCKET, 1, -3, -2)}`,
  box: [60, 57] as [number, number],
};

/** Gather Lockup's logo: puff, and a bucket with its two stripes cut out. */
export const POPCORN_LOGO = {
  width: 60,
  height: 57,
  shapes: [fit(PUFF, 1, -3, -2), `${fit(BUCKET, 1, -3, -2)} ${fit(STRIPES, 1, -3, -2)}`],
};

const ART = "https://kuchi-media.kalarislabs.com/components/art";
export const art = (n: number) => `${ART}/art-${String(n).padStart(2, "0")}.svg`;
