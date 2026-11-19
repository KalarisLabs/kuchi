// Hero usage counter: [data-count] numbers glide to the live totals from /stats.json.
//
// One number that counts smoothly (requestAnimationFrame, ease-out), never a digit swap or
// a rolling-digit odometer. Each number's box is sized to its final value before it moves,
// with tabular figures, so nothing around it shifts while it counts. On load it counts up
// to the current total; while the tab is visible it checks again every minute and glides
// on to any higher total. Under reduced motion the final value is set at once.
import { prefersReducedMotion } from './motion';

const format = new Intl.NumberFormat('en-US');
const REFRESH_MS = 60_000;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

type Counter = { el: HTMLElement; value: number; frame: number };

function glide(counter: Counter, to: number, duration: number) {
  cancelAnimationFrame(counter.frame);
  const from = counter.value;
  if (to <= from) return;
  counter.value = to;
  const { el } = counter;
  // Reserve the final width first: the line stays still while the digits change.
  el.textContent = format.format(to);
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  if (prefersReducedMotion() || duration === 0) return;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format.format(Math.round(from + (to - from) * easeOut(t)));
    if (t < 1) counter.frame = requestAnimationFrame(step);
  };
  el.textContent = format.format(from);
  counter.frame = requestAnimationFrame(step);
}

export function startUsageCounter(root: HTMLElement) {
  const counters = new Map<string, Counter>();
  for (const el of root.querySelectorAll<HTMLElement>('[data-count]')) {
    counters.set(el.dataset.count ?? '', { el, value: 0, frame: 0 });
  }
  if (!counters.size) return;
  const baseline = Object.fromEntries([...counters].map(([name, c]) => [name, Number(c.el.dataset.value) || 0]));
  let first = true;

  const apply = (totals: Record<string, unknown>) => {
    for (const [name, counter] of counters) {
      const next = Number(totals[name]);
      if (Number.isFinite(next)) glide(counter, Math.round(next), first ? 1800 : 1200);
    }
    first = false;
  };

  const refresh = () =>
    fetch('/stats.json', { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(apply, () => { if (first) apply(baseline); });

  // Count up from zero on arrival; the built-in baseline covers a slow or failed request.
  void refresh();
  window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, REFRESH_MS);
}
