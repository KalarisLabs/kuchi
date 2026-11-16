// /components behaviour: search and category filter, hover/tap preview, and the
// dialog that shows the install command and source (fetched from /r/<name>.json).
const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(sel)];

const SITE = location.origin;
const cards = $$('.cmp-card');
const search = $<HTMLInputElement>('#cmp-search')!;
const count = $('#cmp-count')!;
const empty = $('#cmp-empty')!;
let category = 'all';

let toastTimer: number | undefined;
function toast(message: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('visible'), 2500);
}

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast('Copy failed. Select the text and copy it manually.');
  }
}

function apply() {
  const q = search.value.trim().toLowerCase();
  let shown = 0;
  for (const card of cards) {
    const hit =
      (category === 'all' || card.dataset.cat === category) && (!q || (card.dataset.search ?? '').includes(q));
    card.hidden = !hit;
    if (hit) shown++;
  }
  count.textContent = `${shown} component${shown === 1 ? '' : 's'}`;
  empty.hidden = shown !== 0;
}

search.addEventListener('input', apply);
for (const chip of $$('.cmp-chip')) {
  chip.addEventListener('click', () => {
    category = chip.dataset.cat ?? 'all';
    for (const other of $$('.cmp-chip')) other.setAttribute('aria-pressed', String(other === chip));
    apply();
  });
}
$('#cmp-reset')?.addEventListener('click', () => {
  search.value = '';
  category = 'all';
  for (const chip of $$('.cmp-chip')) chip.setAttribute('aria-pressed', String(chip.dataset.cat === 'all'));
  apply();
});

// Posters come from the media host; hide the broken-image icon if one is not there yet.
for (const img of $$<HTMLImageElement>('img[data-poster]')) {
  img.addEventListener('error', () => img.classList.add('missing'));
}

// Preview plays on hover (fine pointers) and stays still under reduced motion.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverable = matchMedia('(hover: hover)').matches;
if (hoverable && !reduced) {
  for (const media of $$('.cmp-media')) {
    const video = $<HTMLVideoElement>('video', media)!;
    media.addEventListener('pointerenter', () => {
      media.classList.add('playing');
      video.play().catch(() => media.classList.remove('playing'));
    });
    media.addEventListener('pointerleave', () => {
      media.classList.remove('playing');
      video.pause();
      video.currentTime = 0;
    });
  }
}

// Dialog
const dialog = $<HTMLDialogElement>('#cmp-dialog')!;
const dTitle = $('#cmp-d-title')!;
const dDesc = $('#cmp-d-desc')!;
const dCmd = $('#cmp-d-cmd')!;
const dDeps = $('#cmp-d-deps')!;
const dFile = $('#cmp-d-file')!;
const dSrc = $('#cmp-d-src')!;
let current = '';
let lastTrigger: HTMLElement | null = null;
let sourceText = '';

async function openItem(name: string, trigger: HTMLElement) {
  current = name;
  lastTrigger = trigger;
  const card = trigger.closest<HTMLElement>('.cmp-card');
  dTitle.textContent = card?.querySelector('.cmp-title')?.textContent ?? name;
  dDesc.textContent = '';
  dCmd.textContent = `npx shadcn@latest add ${SITE}/r/${name}.json`;
  dDeps.textContent = '';
  dFile.textContent = '';
  dSrc.textContent = 'Loading…';
  sourceText = '';
  if (!dialog.open) dialog.showModal();
  try {
    const res = await fetch(`/r/${name}.json`);
    if (!res.ok) throw new Error(String(res.status));
    const item = await res.json();
    if (current !== name) return;
    dDesc.textContent = item.description ?? '';
    const deps: string[] = item.dependencies ?? [];
    dDeps.textContent = deps.length ? `Needs Remotion project. Installs: ${deps.join(', ')}.` : '';
    const main = item.files?.[0];
    dFile.textContent = main?.target ?? '';
    sourceText = main?.content ?? '';
    dSrc.textContent = sourceText;
  } catch {
    dSrc.textContent = 'Could not load the source. Check your connection and try again.';
  }
}

for (const button of $$('[data-open]')) {
  button.addEventListener('click', () => openItem(button.dataset.open!, button));
}
$('#cmp-d-close')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => lastTrigger?.focus());
$('#cmp-copy-cmd')!.addEventListener('click', () => copy(dCmd.textContent ?? '', 'Install command copied'));
$('#cmp-copy-src')!.addEventListener('click', () => {
  if (sourceText) copy(sourceText, 'Code copied');
});

// Deep link: /components#text-reveal opens that component.
function fromHash() {
  const name = decodeURIComponent(location.hash.slice(1));
  const button = name ? $<HTMLElement>(`[data-open="${CSS.escape(name)}"]`) : null;
  if (button) openItem(name, button);
}
fromHash();
