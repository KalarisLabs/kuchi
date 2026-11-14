// A playful pill that pops up at the bottom of the screen when a visitor copies page
// text (Ctrl+C / Cmd+C / context menu). It dodges the cursor a few times (DodgeField),
// then gives in; clicking it or waiting dismisses it. It never blocks anything: the copy
// itself has already happened, and the site's own copy buttons do not trigger it (they
// write to the clipboard directly; their fallback copies from a hidden input, ignored here).
import { useEffect, useRef, useState } from 'react';
import DodgeField from './DodgeField.jsx';
import './CopyDodge.css';

const SHOW_MS = 4500; // idle time before it leaves on its own
const LEAVE_MS = 200; // matches the exit transition in CopyDodge.css
const TAUNTS = ['Copied. Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay'];

export default function CopyDodge() {
  const [open, setOpen] = useState(false); // mounted
  const [shown, setShown] = useState(false); // visible (drives the CSS transition)
  const [round, setRound] = useState(0); // remounts DodgeField so each copy starts fresh
  const timer = useRef(0);

  const hide = () => {
    window.clearTimeout(timer.current);
    setShown(false);
    timer.current = window.setTimeout(() => setOpen(false), LEAVE_MS);
  };
  const keepAlive = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(hide, SHOW_MS);
  };

  useEffect(() => {
    const onCopy = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
      if (!String(window.getSelection() ?? '').trim()) return;
      setRound((n) => n + 1);
      setOpen(true);
      requestAnimationFrame(() => setShown(true));
      keepAlive();
    };
    document.addEventListener('copy', onCopy);
    return () => {
      document.removeEventListener('copy', onCopy);
      window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;
  return (
    <div className="copy-dodge" data-shown={shown ? 'true' : 'false'} role="status" aria-live="polite">
      <DodgeField
        key={round}
        taunts={TAUNTS}
        inkColor="var(--k-ink)"
        contrastColor="var(--k-paper)"
        fieldHeight={150}
        reach={64}
        radius={110}
        patience={4}
        onDodge={keepAlive}
        onCatch={() => window.setTimeout(hide, 600)}
      />
    </div>
  );
}
