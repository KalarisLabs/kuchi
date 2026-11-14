// The agent tile in the hero headline: cycles through the agents Kuchi connects to,
// one logo at a time, each rising in from below while the last one leaves upward.
//
// All logos are in the markup from the start (the first one is visible without
// JavaScript); the component only moves a data-state between them and LogoCycle.css
// animates the change. The tile is decorative: its parent is aria-hidden.
// It does not cycle under reduced motion, while the tab is hidden, or off-screen.
import { useEffect, useRef, useState } from 'react';
import './LogoCycle.css';

// Files in /logos (staged from ../site/logos). `mono` logos draw in black and are
// inverted on the dark theme. The VS Code and Raft marks are PNGs (VS Code is 115 KB),
// too heavy for the first screen, so they are left to the connect section.
const LOGOS = [
  { name: 'Claude', src: '/logos/claude.svg' },
  { name: 'ChatGPT', src: '/logos/chatgpt.svg', mono: true },
  { name: 'Codex', src: '/logos/codex.svg', mono: true },
  { name: 'Cursor', src: '/logos/cursor.svg', mono: true },
  { name: 'Gemini', src: '/logos/gemini.svg', mono: true },
  { name: 'Grok', src: '/logos/grok.svg', mono: true },
];

const HOLD_MS = 1900; // how long each logo stays
const START_MS = 1800; // wait for the headline entrance before the first swap

export default function LogoCycle() {
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(-1);
  const root = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer = 0;
    let visible = true;
    const step = () => {
      if (!document.hidden && visible) {
        setActive((current) => {
          setLeaving(current);
          return (current + 1) % LOGOS.length;
        });
      }
      timer = window.setTimeout(step, HOLD_MS);
    };
    timer = window.setTimeout(step, START_MS);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (root.current) observer.observe(root.current);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <span className="logo-cycle" ref={root}>
      {LOGOS.map((logo, i) => (
        <span
          key={logo.name}
          className="logo-cycle__item"
          data-state={i === active ? 'active' : i === leaving ? 'leaving' : 'idle'}
        >
          <img src={logo.src} alt="" width="40" height="40" draggable="false" data-mono={logo.mono ? '' : undefined} />
        </span>
      ))}
    </span>
  );
}
