// TiltedGridHero: the hero backdrop. Every launch video's poster sits on a curved wall
// built with plain CSS 3D (preserve-3d, sized with container query units, no 3D library),
// its columns drifting up and down. A few tiles at a time play a short silent clip, and
// the tile under the pointer plays too. Pressing a tile grows it into the theater: the
// video plays large over a blurred glow of itself, with arrows, the keyboard, swipes and
// a filmstrip of the whole wall to move between videos.
//
// The wall is scenery (aria-hidden, not focusable); the same videos are reachable with
// the keyboard through the "Latest launches" cards and /videos. The page passes only each
// tile's id and poster; titles, sources and video files come from /videos.json (which the
// gallery script on this page fetches too), so the hero HTML stays small. The theater is a modal
// <dialog> portalled to <body>, so the hero's mask, parallax and pointer-events: none
// never reach it. Its <video> carries data-reference-id and data-surface="hero", so the
// play and engagement analytics in scripts/gallery.js count it; the wall's silent clips
// are marked data-ambient and are ignored there.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { remakeBrief, videoPath } from '../lib/video-links.js';
import { favButtonsHTML } from '../lib/favorites.js';
import { launchDate, displayDuration } from '../lib/format.js';
import { getLenis } from '../scripts/motion';
import './TiltedGridHero.css';

/** What the page passes for each tile. */
export interface WallTile {
  id: number;
  poster: string;
}

/** One video as the theater shows it, built from /videos.json. */
export interface WallVideo {
  id: number;
  title: string;
  account: string;
  poster: string;
  video: string;
  width: number;
  height: number;
  /** Display duration, e.g. "0:42" or "0:30 excerpt / 1:12 original". */
  duration: string;
  date: string;
  source: string;
  /** The video's own page. */
  href: string;
}

const COLUMNS = 11; // rings -5..5 around the centre; phones show the middle seven
const COPIES = 3; // each column repeats its tiles three times, so the loop never shows a gap
const MAX_AMBIENT = 3; // silent clips playing at once (the hovered tile comes on top)
const AMBIENT_MS = 5600; // how long one silent clip plays before it hands over
const AMBIENT_EVERY_MS = 1700;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const OPEN_MS = 300;
const CLOSE_MS = 260;
const EASE_DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

interface CatalogVideo {
  id: number; title: string; account: string; poster: string; video: string; width: number; height: number;
  clipSeconds: number; originalSeconds: number; excerpt: boolean; date: string; source: string; slug?: string;
}

let catalog: Promise<Map<number, WallVideo>> | null = null;
/** The details of every video, by id (fetched once, shared by the wall and the theater). */
function loadCatalog() {
  catalog ??= fetch('/videos.json')
    .then((response) => (response.ok ? response.json() : []))
    .then((videos: CatalogVideo[]) => new Map(videos.map((v) => [v.id, {
      id: v.id, title: v.title, account: v.account, poster: v.poster, video: v.video, width: v.width, height: v.height,
      duration: displayDuration(v), date: v.date, source: v.source, href: videoPath(v),
    }])))
    .catch(() => { catalog = null; return new Map<number, WallVideo>(); });
  return catalog;
}

/** Splits the tiles round-robin over the columns, so neighbours on the wall differ. */
function columnsOf(items: WallTile[]) {
  const columns: number[][] = Array.from({ length: COLUMNS }, () => []);
  items.forEach((_, index) => columns[index % COLUMNS].push(index));
  return columns;
}

// ---------------------------------------------------------------------------------------
// Silent clips on the wall

function stopClip(tile: HTMLElement) {
  tile.classList.remove('is-live');
  const video = tile.querySelector<HTMLVideoElement>('video[data-ambient]');
  if (!video) return;
  window.setTimeout(() => {
    if (tile.classList.contains('is-live')) return; // started again meanwhile
    video.pause();
    video.removeAttribute('src');
    video.load(); // drops the buffered media
    video.remove();
  }, 320);
}

function startClip(tile: HTMLElement, src: string) {
  if (tile.querySelector('video[data-ambient]')) {
    tile.classList.add('is-live');
    tile.querySelector<HTMLVideoElement>('video[data-ambient]')?.play().catch(() => {});
    return;
  }
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'auto';
  video.setAttribute('data-ambient', '');
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;
  video.src = `${src}#t=0.4`;
  video.addEventListener('playing', () => tile.classList.add('is-live'), { once: true });
  tile.append(video);
  video.play().catch(() => stopClip(tile));
}

// ---------------------------------------------------------------------------------------
// The wall

export default function TiltedGridHero({ items }: { items: WallTile[] }) {
  const wall = useRef<HTMLDivElement>(null);
  const details = useRef<Map<number, WallVideo>>(new Map());
  const [opened, setOpened] = useState<{ videos: WallVideo[]; index: number; from: DOMRect | null } | null>(null);
  const openRef = useRef(false);
  openRef.current = opened !== null;
  const columns = columnsOf(items);

  // Silent clips, pausing off screen, and a slight turn of the wall towards the pointer.
  useEffect(() => {
    const root = wall.current;
    if (!root) return;
    const hero = root.closest<HTMLElement>('section') ?? root;
    const tiles = [...root.querySelectorAll<HTMLElement>('.tg-tile')];
    const visible = new Set<HTMLElement>();
    const live = new Map<HTMLElement, number>(); // tile -> stop timer (0 while hovered)
    let onScreen = true;
    let hovered: HTMLElement | null = null;
    let hoverTimer = 0;

    const allowClips = !saveData();
    loadCatalog().then((map) => { details.current = map; });
    const rotate = allowClips && finePointer() && !reducedMotion() && window.innerWidth >= 900;

    const setPaused = (paused: boolean) => root.toggleAttribute('data-paused', paused);
    const stopAll = () => {
      for (const [tile, timer] of live) { window.clearTimeout(timer); stopClip(tile); }
      live.clear();
    };
    const stop = (tile: HTMLElement) => {
      window.clearTimeout(live.get(tile));
      live.delete(tile);
      stopClip(tile);
    };
    const play = (tile: HTMLElement, forMs: number) => {
      const item = details.current.get(items[Number(tile.dataset.index)]?.id);
      if (!item) return; // details not loaded yet
      window.clearTimeout(live.get(tile));
      live.set(tile, forMs ? window.setTimeout(() => stop(tile), forMs) : 0);
      startClip(tile, item.video);
    };

    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const tile = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(tile);
        else { visible.delete(tile); if (live.has(tile) && tile !== hovered) stop(tile); }
      }
    }, { threshold: 0.75 });
    if (rotate) tiles.forEach((tile) => seen.observe(tile));

    // The hero itself: off screen, the wall stops drifting and every clip stops.
    const heroSeen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      setPaused(!onScreen || openRef.current);
      if (!onScreen) stopAll();
    });
    heroSeen.observe(hero);

    // Hand the silent clips round: tiles away from the headline, one video at a time.
    const tick = window.setInterval(() => {
      if (!rotate || !onScreen || openRef.current || document.hidden) return;
      if ([...live.values()].filter(Boolean).length >= MAX_AMBIENT) return;
      const playing = new Set([...live.keys()].map((tile) => tile.dataset.index));
      const width = window.innerWidth;
      const candidates = [...visible].filter((tile) => {
        if (live.has(tile) || playing.has(tile.dataset.index)) return false;
        const box = tile.getBoundingClientRect();
        const x = (box.left + box.width / 2) / width;
        return x < 0.3 || x > 0.7; // keep the middle, behind the headline, still
      });
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      if (pick) play(pick, AMBIENT_MS);
    }, AMBIENT_EVERY_MS);

    // The tile under the pointer plays for as long as the pointer stays.
    const onOver = (event: PointerEvent) => {
      if (!allowClips || event.pointerType !== 'mouse') return;
      const tile = (event.target as Element).closest<HTMLElement>('.tg-tile');
      if (!tile || tile === hovered) return;
      if (hovered) { const left = hovered; hovered = null; if (live.get(left) === 0) stop(left); }
      hovered = tile;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => { if (hovered === tile && !openRef.current) play(tile, 0); }, 120);
    };
    const onOut = (event: PointerEvent) => {
      const tile = (event.target as Element).closest<HTMLElement>('.tg-tile');
      if (!tile || tile.contains(event.relatedTarget as Node)) return;
      if (hovered === tile) hovered = null;
      window.clearTimeout(hoverTimer);
      if (live.get(tile) === 0) stop(tile);
    };
    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerout', onOut);

    // Parallax: the wall turns a few degrees after the pointer, anywhere over the hero.
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const box = hero.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - 0.5;
        const y = (event.clientY - box.top) / box.height - 0.5;
        root.style.setProperty('--tg-yaw', `${(x * -5).toFixed(2)}deg`);
        root.style.setProperty('--tg-pitch', `${(y * 3).toFixed(2)}deg`);
      });
    };
    if (finePointer() && !reducedMotion()) hero.addEventListener('pointermove', onMove);

    const onHidden = () => { if (document.hidden) stopAll(); };
    document.addEventListener('visibilitychange', onHidden);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(hoverTimer);
      cancelAnimationFrame(raf);
      seen.disconnect();
      heroSeen.disconnect();
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerout', onOut);
      hero.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onHidden);
      stopAll();
    };
  }, [items]);

  // While the theater is open the wall holds still (so a tile can be flown back to) and
  // its clips stop.
  useEffect(() => {
    const root = wall.current;
    if (!root) return;
    if (opened) {
      root.setAttribute('data-paused', '');
      root.querySelectorAll<HTMLElement>('.tg-tile.is-live').forEach(stopClip);
    } else {
      root.removeAttribute('data-paused');
    }
  }, [opened]);

  const onClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const tile = (event.target as Element).closest<HTMLElement>('.tg-tile');
    if (!tile || openRef.current) return;
    const from = tile.getBoundingClientRect();
    const pressed = items[Number(tile.dataset.index)]?.id;
    loadCatalog().then((map) => {
      details.current = map;
      // The theater runs through the wall's videos in the wall's order.
      const videos = items.map((t) => map.get(t.id)).filter((v): v is WallVideo => Boolean(v));
      const index = videos.findIndex((v) => v.id === pressed);
      if (index >= 0) setOpened({ videos, index, from });
    });
  };

  /** A tile of this video that is fully on screen, to fly the theater back to. */
  const tileFor = useCallback((id: number) => {
    const index = items.findIndex((t) => t.id === id);
    const tiles = wall.current?.querySelectorAll<HTMLElement>(`.tg-tile[data-index="${index}"]`) ?? [];
    for (const tile of tiles) {
      const box = tile.getBoundingClientRect();
      if (box.top >= 0 && box.left >= 0 && box.bottom <= window.innerHeight && box.right <= window.innerWidth && box.width > 24) return box;
    }
    return null;
  }, [items]);

  return (
    <>
      <div className="tg" ref={wall} aria-hidden="true" onClick={onClick}>
        <div className="tg-camera">
          <div className="tg-world">
            {columns.map((column, c) => {
              const ring = c - (COLUMNS - 1) / 2;
              const style = {
                '--i': ring,
                '--dur': `${52 + ((c * 7) % 5) * 6}s`,
                '--delay': `${-((c * 13) % 9) * 4}s`,
              } as CSSProperties;
              return (
                <div className="tg-col" data-ring={Math.abs(ring)} style={style} key={c}>
                  <div className={`tg-track${c % 2 ? ' tg-track-down' : ''}`}>
                    {Array.from({ length: COPIES }, (_, copy) =>
                      column.map((index) => (
                        <div className="tg-tile" data-index={index} key={`${copy}-${index}`}>
                          <img src={items[index].poster} alt="" width={320} height={200} loading="lazy" decoding="async" draggable={false} />
                        </div>
                      )),
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="tg-scrim" />
      </div>
      {opened ? (
        <Theater
          items={opened.videos}
          start={opened.index}
          from={opened.from}
          tileFor={tileFor}
          onClosed={() => setOpened(null)}
        />
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------------------
// The theater

interface TheaterProps {
  items: WallVideo[];
  start: number;
  from: DOMRect | null;
  tileFor: (id: number) => DOMRect | null;
  onClosed: () => void;
}

/** The largest frame for this video that leaves room for the controls around it. */
function fit(item: WallVideo) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const narrow = vw < 720;
  const maxW = Math.min(1180, vw - (narrow ? 24 : 184));
  const maxH = Math.max(180, vh - (narrow ? 330 : 286));
  const ratio = item.width && item.height ? item.width / item.height : 16 / 9;
  let width = maxW;
  let height = width / ratio;
  if (height > maxH) { height = maxH; width = height * ratio; }
  return { width: Math.round(width), height: Math.round(height) };
}

/** The transform that puts an element with box `to` over the box `from` (uniform scale). */
function flip(from: DOMRect, to: DOMRect) {
  const scale = Math.max(0.05, from.width / to.width);
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
}

function Theater({ items, start, from, tileFor, onClosed }: TheaterProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  const [direction, setDirection] = useState(0);
  const [size, setSize] = useState(() => fit(items[start]));
  const [copied, setCopied] = useState(false);
  const closing = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const item = items[index];
  const count = items.length;

  // `animate` is false for the arrow keys: a switch made from the keyboard cuts straight
  // to the next video (the slide is for pointer and touch).
  const go = useCallback((step: number, animate = true) => {
    setDirection(animate ? step : 0);
    setIndex((value) => (value + step + count) % count);
  }, [count]);

  const select = (next: number) => {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  // Open: modal, page scroll held, then the frame grows out of the pressed tile.
  useLayoutEffect(() => {
    const layer = dialog.current;
    const box = frame.current;
    if (!layer || !box) return;
    layer.showModal();
    // showModal focuses the first button (the close button, ringed); the shell takes focus
    // instead, so the keyboard works at once without a ring on a button nobody aimed at.
    shell.current?.focus({ preventScroll: true });
    document.body.classList.add('modal-open');
    getLenis()?.stop();
    if (from && !reducedMotion()) {
      box.animate(
        [{ transform: flip(from, box.getBoundingClientRect()), borderRadius: '18px' }, { transform: 'none', borderRadius: '14px' }],
        { duration: OPEN_MS, easing: EASE_OUT },
      );
    }
    return () => {
      document.body.classList.remove('modal-open');
      getLenis()?.start();
    };
    // Runs once, when the theater mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close: back into a tile of the video now showing when one is on screen, else a fade.
  const close = useCallback(() => {
    const layer = dialog.current;
    const box = frame.current;
    if (!layer || !box || closing.current) return;
    closing.current = true;
    box.querySelector('video')?.pause();
    layer.classList.add('is-closing');
    const done = () => { layer.close(); onClosed(); };
    if (reducedMotion()) { window.setTimeout(done, 160); return; }
    const target = tileFor(items[index].id);
    const animation = target
      ? box.animate([{ transform: 'none' }, { transform: flip(target, box.getBoundingClientRect()), borderRadius: '18px' }], { duration: CLOSE_MS, easing: EASE_DRAWER, fill: 'forwards' })
      : box.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(0.94)', opacity: 0 }], { duration: 180, easing: EASE_OUT, fill: 'forwards' });
    animation.onfinish = done;
  }, [index, items, onClosed, tileFor]);

  // Size the frame to the video showing, and again when the window changes.
  useEffect(() => {
    setSize(fit(item));
    setCopied(false);
    const onResize = () => setSize(fit(item));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [item]);

  // Keep the current video centred in the filmstrip (scrolling the strip, not the page).
  useEffect(() => {
    const row = strip.current;
    const thumb = row?.children[index] as HTMLElement | undefined;
    if (!row || !thumb) return;
    row.scrollTo({ left: thumb.offsetLeft - row.clientWidth / 2 + thumb.offsetWidth / 2, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [index]);

  const onKeyDown = (event: ReactKeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'VIDEO') return; // the native controls use the arrows to seek
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1, false); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1, false); }
    if (event.key === ' ' && !/BUTTON|A|PRE/.test(target.tagName)) {
      event.preventDefault();
      const video = frame.current?.querySelector('video');
      if (video) video.paused ? video.play().catch(() => {}) : video.pause();
    }
  };

  const onPointerDown = (event: ReactPointerEvent) => {
    swipe.current = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
  };
  const onPointerUp = (event: ReactPointerEvent) => {
    const began = swipe.current;
    swipe.current = null;
    if (!began) return;
    const dx = event.clientX - began.x;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(event.clientY - began.y) * 1.4) go(dx < 0 ? 1 : -1);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(remakeBrief(item));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      import('../scripts/analytics.mjs').then((api) => api.track('reference_prompt_copied', { reference_id: item.id })).catch(() => {});
    } catch {
      setCopied(false);
    }
  };

  const frameStyle = { width: size.width, height: size.height } as CSSProperties;
  const glowStyle = { backgroundImage: `url("${item.poster}")` } as CSSProperties;

  return createPortal(
    <dialog
      ref={dialog}
      className="tgv"
      aria-labelledby="tgv-title"
      data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); close(); }}
      onKeyDown={onKeyDown}
      onClick={(event) => { if ((event.target as HTMLElement).hasAttribute('data-dismiss')) close(); }}
    >
      <div className="tgv-glow" key={`glow-${item.id}`} style={glowStyle} aria-hidden="true" />
      <div className="tgv-shell" ref={shell} tabIndex={-1} data-dismiss>
        <div className="tgv-top" data-dismiss>
          <span className="tgv-count" aria-live="polite">
            <strong>{String(index + 1).padStart(2, '0')}</strong> / {count}
          </span>
          <span className="tgv-keys" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> to browse · <kbd>Esc</kbd> to close</span>
          <button type="button" className="tgv-icon tgv-close" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="tgv-stage" data-dismiss>
          <button type="button" className="tgv-icon tgv-nav tgv-prev" onClick={() => go(-1)} aria-label="Previous video">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="tgv-frame" ref={frame} style={frameStyle} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
            <video
              key={item.id}
              className="tgv-video"
              data-dir={direction > 0 ? 'next' : direction < 0 ? 'prev' : undefined}
              src={item.video}
              poster={item.poster}
              controls
              autoPlay
              playsInline
              preload="auto"
              data-reference-id={item.id}
              data-surface="hero"
            />
          </div>
          <button type="button" className="tgv-icon tgv-nav tgv-next" onClick={() => go(1)} aria-label="Next video">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="tgv-info" style={{ width: Math.max(size.width, 320) }}>
          <div className="tgv-meta" key={`meta-${item.id}`}>
            <h2 id="tgv-title">{item.title}</h2>
            <p>{item.account} · {item.duration} · Launched <time dateTime={item.date}>{launchDate(item.date)}</time></p>
          </div>
          <div className="tgv-actions">
            <span className="tgv-fav" dangerouslySetInnerHTML={{ __html: favButtonsHTML('video', String(item.id), item.title) }} />
            <button type="button" className="tgv-btn tgv-btn-primary" onClick={copyPrompt}>
              {copied ? 'Copied ✓' : 'Copy remake prompt'}
            </button>
            <a className="tgv-btn" href={item.href}>Details</a>
            <a className="tgv-btn tgv-btn-quiet" href={item.source} target="_blank" rel="noopener">Original ↗</a>
          </div>
        </div>

        <div className="tgv-strip" ref={strip} aria-label="All launch videos" onWheel={(event) => {
          const row = strip.current;
          if (row && Math.abs(event.deltaY) > Math.abs(event.deltaX)) row.scrollLeft += event.deltaY;
        }}>
          {items.map((video, i) => (
            <button
              type="button"
              className="tgv-thumb"
              key={video.id}
              aria-label={`Play ${video.title}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => select(i)}
            >
              <img src={video.poster} alt="" width={112} height={70} loading="lazy" decoding="async" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
