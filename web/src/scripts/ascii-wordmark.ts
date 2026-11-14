// The giant footer wordmark, drawn as animated ASCII with ordered dithering.
//
// How it works: the word is rasterised very small, one pixel per character cell, so each
// pixel's alpha is how much of that cell the letter covers. Every cell then picks a glyph
// from a density ramp (the same glyphs as the hero background). The pick between two
// neighbouring glyphs is made with a 4x4 Bayer matrix, which is what gives the dither
// texture; a slow wave moves through the densities so the texture drifts.
//
// Scroll: `progress` (0 when the wordmark enters the viewport, 1 at the end of the page)
// sets the font weight, thin to black, and lifts the letters into line one after another.
// Nothing here animates layout: it is one canvas, redrawn about 20 times a second and only
// while it is on screen and the tab is visible. Under reduced motion one still frame is drawn.

const RAMP = ' .:-=+xX#';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const FONT = '"Inter Variable", "Inter", system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const TRACKING = -0.055; // em, as the live-text wordmark it replaces
const WEIGHT_FROM = 180;
const WEIGHT_TO = 900;
const FRAME_MS = 50;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

interface Options {
  text: string;
  ink: string;
  /** Scroll progress, 0 to 1. */
  progress: () => number;
  animate: boolean;
}

export async function mountAsciiWordmark(canvas: HTMLCanvasElement, { text, ink, progress, animate }: Options) {
  const ctx = canvas.getContext('2d');
  const mask = document.createElement('canvas');
  const maskCtx = mask.getContext('2d', { willReadFrequently: true });
  const atlas = document.createElement('canvas');
  const atlasCtx = atlas.getContext('2d');
  if (!ctx || !maskCtx || !atlasCtx) return false;
  // The mask is drawn with the page font; wait for it, or the first frame uses a fallback face.
  await document.fonts.load(`${WEIGHT_TO} 64px ${FONT}`).catch(() => {});

  const letters = [...text];
  let width = 0;
  let height = 0;
  let fontSize = 0;
  let cellW = 0;
  let cellH = 0;
  let ratio = 1;
  let cols = 0;
  let rows = 0;
  let coverage = new Float32Array(0);
  let maskKey = '';

  const letterWidths = (weight: number, size: number) => {
    maskCtx.font = `${weight} ${size}px ${FONT}`;
    return letters.map((letter) => maskCtx.measureText(letter).width);
  };

  function layout() {
    width = canvas.clientWidth;
    if (!width) return;
    // Size the word so that its widest state (black weight) fills the width, less a margin.
    const unit = letterWidths(WEIGHT_TO, 100).reduce((sum, w) => sum + w, 0) / 100 + TRACKING * (letters.length - 1);
    fontSize = Math.min(540, (width * 0.9) / unit);
    height = Math.round(fontSize * 0.76);
    canvas.style.height = `${height}px`;
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    cellW = clamp(width / 190, 5, 8);
    cellH = cellW * 1.6;
    cols = Math.ceil(width / cellW);
    rows = Math.ceil(height / cellH);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    mask.width = cols;
    mask.height = rows;
    coverage = new Float32Array(cols * rows);
    maskKey = '';

    // Glyph atlas: each ramp glyph drawn once, then stamped with drawImage.
    const w = Math.ceil(cellW * ratio);
    const h = Math.ceil(cellH * ratio);
    atlas.width = w * RAMP.length;
    atlas.height = h;
    atlasCtx.fillStyle = ink;
    atlasCtx.font = `600 ${Math.round(h * 0.92)}px ${MONO}`;
    atlasCtx.textAlign = 'center';
    atlasCtx.textBaseline = 'middle';
    [...RAMP].forEach((glyph, i) => atlasCtx.fillText(glyph, i * w + w / 2, h / 2));
  }

  // Rasterise the word at the current weight and lift, one pixel per cell.
  function drawMask(p: number) {
    const weight = Math.round((WEIGHT_FROM + (WEIGHT_TO - WEIGHT_FROM) * p) / 10) * 10;
    const lift = Math.round((1 - p) * 100);
    const key = `${weight}:${lift}`;
    if (key === maskKey) return;
    maskKey = key;
    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, cols, rows);
    maskCtx.setTransform(1 / cellW, 0, 0, 1 / cellH, 0, 0);
    maskCtx.fillStyle = '#000';
    maskCtx.textBaseline = 'alphabetic';
    const widths = letterWidths(weight, fontSize);
    const tracking = TRACKING * fontSize;
    const total = widths.reduce((sum, w) => sum + w, 0) + tracking * (letters.length - 1);
    let x = (width - total) / 2;
    letters.forEach((letter, i) => {
      // Later letters start lower and arrive later; all are in line at p = 1.
      const drop = (1 - p) * (0.18 + i * 0.1) * height;
      maskCtx.fillText(letter, x, height * 0.985 + drop);
      x += widths[i] + tracking;
    });
    const pixels = maskCtx.getImageData(0, 0, cols, rows).data;
    for (let i = 0; i < coverage.length; i++) coverage[i] = pixels[i * 4 + 3] / 255;
  }

  function draw(time: number) {
    if (!width) return;
    const p = clamp(progress(), 0, 1);
    drawMask(p);
    const t = time / 1000;
    const crawl = Math.floor(t / 0.4); // the dither pattern steps sideways now and then
    const w = Math.ceil(cellW * ratio);
    const h = Math.ceil(cellH * ratio);
    const top = RAMP.length - 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      const fall = 1 - smooth(0.6, 1, y / rows) * 0.88; // dissolves into the bottom edge
      const py = Math.round(y * cellH * ratio);
      for (let x = 0; x < cols; x++) {
        const cover = coverage[y * cols + x];
        if (cover < 0.03) continue;
        const wave = 0.5 + 0.5 * Math.sin(x * 0.1 + t * 0.9 + Math.sin(y * 0.22 - t * 0.55) * 1.5);
        // The wave thins the letters less as they get bolder: half at first, a quarter at the end.
        const depth = 0.5 - 0.25 * p;
        const level = cover * fall * (1 - depth + depth * wave) * (0.72 + 0.28 * p) * top;
        const low = Math.floor(level);
        const glyph = low + (level - low > BAYER[(y & 3) * 4 + ((x + crawl) & 3)] ? 1 : 0);
        if (glyph <= 0) continue;
        ctx.drawImage(atlas, Math.min(glyph, top) * w, 0, w, h, Math.round(x * cellW * ratio), py, w, h);
      }
    }
  }

  layout();
  draw(0);

  let visible = false;
  let frame = 0;
  let last = 0;
  const tick = (time: number) => {
    frame = 0;
    if (!visible || document.hidden) return;
    if (time - last >= FRAME_MS) {
      last = time;
      draw(time);
    }
    frame = requestAnimationFrame(tick);
  };
  const run = () => {
    if (animate && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run();
  }, { rootMargin: '120px' }).observe(canvas);
  document.addEventListener('visibilitychange', run);
  new ResizeObserver(() => {
    if (canvas.clientWidth === width) return;
    layout();
    draw(performance.now());
  }).observe(canvas);
  return true;
}
