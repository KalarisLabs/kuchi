// Hero headline and tagline, blurred in word by word with BlurText on page load.
// The headline keeps id="main-title" (the hero section is labelled by it). The app
// tiles animate in as words. The tagline starts once the headline is mostly in.
import { useEffect, useState } from 'react';
import BlurText from './BlurText.jsx';
import LogoCycle from './LogoCycle.jsx';

const tile = (variant, child) => (
  <span className={`intro-tile intro-tile-${variant}`} aria-hidden="true">{child}</span>
);

const TITLE = [
  'AI',
  tile('light', <img src="/favicon.svg" alt="" width="40" height="40" draggable="false" />),
  'clonable',
  { break: true },
  'viral',
  tile('dark', (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10.1-6.4a.8.8 0 0 0 0-1.4L9.2 4.9A.8.8 0 0 0 8 5.6Z" />
    </svg>
  )),
  'launch',
  // Cycles through the agents Kuchi connects to (Claude, ChatGPT, Codex, Cursor, Gemini, Grok).
  tile('light', <LogoCycle />),
  'videos',
];

const TAGLINE = 'Launch your idea before your product.';
const TAGLINE_START_MS = 450;

export default function HeroCopy() {
  const [taglineIn, setTaglineIn] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setTaglineIn(true), TAGLINE_START_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <BlurText
        as="h1"
        id="main-title"
        className="intro-title"
        parts={TITLE}
        trigger="load"
        direction="top"
        delay={70}
        stepDuration={0.35}
        blur={10}
        distance={24}
      />
      {taglineIn ? (
        <BlurText
          className="intro-tagline"
          text={TAGLINE}
          trigger="load"
          direction="bottom"
          delay={45}
          stepDuration={0.3}
          blur={8}
          distance={10}
        />
      ) : (
        // Same box before the animation starts, so nothing below it shifts.
        <p className="intro-tagline" style={{ visibility: 'hidden' }}>{TAGLINE}</p>
      )}
    </>
  );
}
