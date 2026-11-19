// /components behaviour: search and category filter, sidebar navigation, hover/tap preview,
// the site player for each clip (with the install command), and the dialog that shows the
// source (fetched from /r/<name>.json).
import { playVideo } from '../lib/play-video.js';
import { isFavorite, onFavoritesChange } from '../lib/favorites.js';
import { componentPrompt, COMPONENTS_SETUP_PROMPT } from '../lib/component-prompts';

// Page views and clicks, like every other page (privacy rules in analytics.mjs).
void import('./analytics.mjs').catch(() => null);

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(sel)];

const SITE = location.origin;
const cards = $$('.cmp-card');
const search = $<HTMLInputElement>('#cmp-search');
const sidebarSearch = $<HTMLInputElement>('#cmp-sidebar-search');
const count = $('#cmp-count');
const empty = $('#cmp-empty');
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
  const q = (search?.value || sidebarSearch?.value || '').trim().toLowerCase();
  let shown = 0;
  // "Saved" and "Liked" are chips too: they show this visitor's own picks (lib/favorites.js).
  const inCategory = (name: string, cat: string | undefined) =>
    category === 'all' ||
    (category === 'saved' || category === 'liked' ? isFavorite(category, 'component', name) : cat === category);

  for (const card of cards) {
    const cardCat = card.dataset.cat;
    const cardSearch = card.dataset.search ?? '';
    const hit = inCategory(card.dataset.name ?? '', cardCat) && (!q || cardSearch.includes(q));
    card.hidden = !hit;
    if (hit) shown++;
  }

  // Filter sidebar links as well
  for (const link of $$('.cmp-sidebar-link[data-name]')) {
    const linkName = link.dataset.name ?? '';
    const linkCat = link.dataset.cat ?? '';
    // The card, not the link: sidebar links carry the same data-name, come first
    // in the page, and have no data-search (title, description, category).
    const card = $(`.cmp-card[data-name="${CSS.escape(linkName)}"]`);
    const cardSearch = card?.dataset.search ?? linkName;
    const hit = inCategory(linkName, linkCat) && (!q || cardSearch.includes(q));
    (link.parentElement as HTMLElement).hidden = !hit;
  }

  // Hide sidebar headings whose components are all filtered out, then let the dot re-measure.
  for (const heading of $$('[data-sidebar-heading]')) {
    const key = heading.dataset.sidebarHeading ?? '';
    const anyShown = $$(`.cmp-sidebar-link[data-cat="${CSS.escape(key)}"]`).some(
      (link) => !(link.parentElement as HTMLElement).hidden,
    );
    heading.hidden = !anyShown;
  }
  window.dispatchEvent(new Event('kuchi:cmp-relayout'));

  // Hide empty category sections
  for (const section of $$('.cmp-cat-section')) {
    const hasVisibleCards = section.querySelectorAll('.cmp-card:not([hidden])').length > 0;
    section.hidden = !hasVisibleCards;
  }

  if (count) {
    count.textContent = `${shown} component${shown === 1 ? '' : 's'}`;
  }
  if (empty) {
    empty.hidden = shown !== 0;
    const text = empty.querySelector('p');
    if (text) {
      text.textContent =
        category === 'saved' ? 'Nothing saved yet. Press the bookmark on any component to keep it here.'
        : category === 'liked' ? 'No liked components yet. Press the heart on any component.'
        : 'No matching video components found.';
    }
  }
}

// Un-liking or un-saving while that view is open takes the card out of it.
onFavoritesChange(() => {
  if (category === 'saved' || category === 'liked') apply();
});

search?.addEventListener('input', () => {
  if (sidebarSearch) sidebarSearch.value = search.value;
  apply();
});

sidebarSearch?.addEventListener('input', () => {
  if (search) search.value = sidebarSearch.value;
  apply();
});

for (const chip of $$('.cmp-chip')) {
  chip.addEventListener('click', () => {
    category = chip.dataset.cat ?? 'all';
    for (const other of $$('.cmp-chip')) {
      other.setAttribute('aria-pressed', String(other === chip));
    }
    apply();
  });
}

$('#cmp-reset')?.addEventListener('click', () => {
  if (search) search.value = '';
  if (sidebarSearch) sidebarSearch.value = '';
  category = 'all';
  for (const chip of $$('.cmp-chip')) {
    chip.setAttribute('aria-pressed', String(chip.dataset.cat === 'all'));
  }
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
    const video = $<HTMLVideoElement>('video', media);
    if (!video) continue;
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

// Quick copy command buttons directly on cards
for (const btn of $$('[data-copy-cmd]')) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const cmd = btn.getAttribute('data-copy-cmd') || '';
    if (cmd) {
      copy(cmd, btn.getAttribute('data-copy-label') || 'Install command copied');
    }
  });
}

// Dialog
const dialog = $<HTMLDialogElement>('#cmp-dialog')!;
const dTitle = $('#cmp-d-title')!;
const dDesc = $('#cmp-d-desc')!;
const dCmd = $('#cmp-d-cmd')!;
const dDeps = $('#cmp-d-deps')!;
// While loading (or on error) the source area shows a line of text. React owns the mounted
// code block, so the status swaps in a fresh container instead of writing into React's node.
let dSrc = $('#cmp-d-src')!;
function showStatus(text: string) {
  const fresh = document.createElement('div');
  fresh.id = 'cmp-d-src';
  fresh.className = dSrc.className;
  const p = document.createElement('p');
  p.className = 'cmp-d-src-status';
  p.textContent = text;
  fresh.append(p);
  dSrc.replaceWith(fresh);
  dSrc = fresh;
}
let current = '';
let lastTrigger: HTMLElement | null = null;

async function openItem(name: string, trigger?: HTMLElement) {
  current = name;
  if (trigger) lastTrigger = trigger;
  const card = trigger ? trigger.closest<HTMLElement>('.cmp-card') : $(`#cmp-${CSS.escape(name)}`);
  dTitle.textContent = card?.querySelector('.cmp-title')?.textContent ?? name;
  dDesc.textContent = '';
  dCmd.textContent = `npx shadcn@latest add ${SITE}/r/${name}.json`;
  dDeps.textContent = '';
  showStatus('Loading…');
  if (!dialog.open) dialog.showModal();
  try {
    const res = await fetch(`/r/${name}.json`);
    if (!res.ok) throw new Error(String(res.status));
    const item = await res.json();
    if (current !== name) return;
    dDesc.textContent = item.description ?? '';
    const deps: string[] = item.dependencies ?? [];
    dDeps.textContent = deps.length ? `Installs dependencies: ${deps.join(', ')}.` : '';
    const main = item.files?.[0];
    const { mountSourceCode } = await import('../components/SourceCode');
    if (current !== name) return;
    // Same as /components/<name>: the licence notice travels with the installed copy, not the view.
    const code = String(main?.content ?? '').replace(/^\/\*! Portions Copyright[^\n]*\*\/\n/, '');
    mountSourceCode(dSrc, { code, filename: main?.target ?? `${name}.tsx`, maxHeight: 520 });
  } catch {
    showStatus('Could not load the source. Check your connection and try again.');
  }
}

for (const button of $$('[data-open]')) {
  button.addEventListener('click', () => openItem(button.dataset.open!, button));
}

// Pressing a card plays its clip full size, with the install command underneath.
function playItem(name: string) {
  const card = $(`#cmp-${CSS.escape(name)}`);
  const title = card?.querySelector('.cmp-title')?.textContent ?? name;
  const src = card?.querySelector<HTMLElement>('[data-play]')?.dataset.src;
  if (!src) return;
  playVideo({
    src,
    title,
    subtitle: card?.querySelector('.cmp-desc-snippet')?.textContent?.trim() ?? '',
    // The install prompt works in any agent; the command is there for people who run it themselves.
    prompt: { label: 'Install prompt', hint: 'Paste into any agent', text: componentPrompt(name, title) },
    command: `npx shadcn@latest add ${SITE}/r/${name}.json`,
    onCopy: (ok, what) => toast(ok ? (what === 'prompt' ? 'Prompt copied. Paste it into your agent.' : 'Install command copied') : 'Copy failed. Select the text and copy it manually.'),
    action: { label: 'View component', hint: 'Preview, props, source and install', href: `/components/${name}` },
    favorite: { kind: 'component', id: name },
  });
}

for (const button of $$('[data-play]')) {
  button.addEventListener('click', () => playItem(button.dataset.play!));
}
$('#cmp-d-play')?.addEventListener('click', () => {
  const name = current;
  dialog.close();
  if (name) playItem(name);
});
$('#cmp-d-close')?.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => lastTrigger?.focus());
$('#cmp-copy-cmd')?.addEventListener('click', () => copy(dCmd.textContent ?? '', 'Install command copied'));

// Sidebar: one delegated click handler (the list is a React island, so its nodes may be
// replaced when it hydrates). The dot moves on its own; this scrolls to the card.
let spyPausedUntil = 0;
$('#cmp-sidebar')?.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.cmp-sidebar-link');
  const targetId = link?.getAttribute('href')?.replace('#', '');
  const targetEl = targetId ? document.getElementById(targetId) : null;
  if (!targetEl) return;
  e.preventDefault();
  // Hold the scroll spy while the page glides there, so the dot doesn't hop card by card.
  spyPausedUntil = performance.now() + 1000;
  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  targetEl.classList.add('cmp-target-highlight');
  setTimeout(() => targetEl.classList.remove('cmp-target-highlight'), 1800);
  history.replaceState(null, '', `#${targetId}`);
});

// Scroll spy: the card crossing a band a third of the way down the viewport is the one
// the sidebar dot points at.
const announce = (name: string) =>
  window.dispatchEvent(new CustomEvent('kuchi:cmp-active', { detail: { name } }));
let lastActive = '';
const spy = new IntersectionObserver(
  (entries) => {
    if (performance.now() < spyPausedUntil) return;
    const hit = entries.find((entry) => entry.isIntersecting && !(entry.target as HTMLElement).hidden);
    const name = (hit?.target as HTMLElement | undefined)?.dataset.name;
    if (name && name !== lastActive) {
      lastActive = name;
      announce(name);
    }
  },
  { rootMargin: '-33% 0px -62% 0px' },
);
for (const card of cards) spy.observe(card);

// Deep link from hash e.g. /components#cmp-text-reveal or /components#text-reveal
function fromHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (!hash) return;
  const name = hash.startsWith('cmp-') ? hash.slice(4) : hash;
  const targetCard = document.getElementById(`cmp-${name}`) || document.getElementById(hash);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetCard.classList.add('cmp-target-highlight');
    setTimeout(() => targetCard.classList.remove('cmp-target-highlight'), 2000);
  }
  const button = $(`[data-open="${CSS.escape(name)}"]`);
  if (button) openItem(name, button);
}
fromHash();
window.addEventListener('hashchange', fromHash);

// Hero agent setup tabs (roving tabindex, arrow keys move between tabs).
for (const root of $$('[data-agent-tabs]')) {
  const tabs = $$<HTMLButtonElement>('[role="tab"]', root);
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const other of tabs) {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(other.getAttribute('aria-controls') ?? '');
      if (panel) panel.hidden = !on;
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (step) {
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], true);
      }
    });
  });
}

// The "Any agent" setup prompt in the hero.
$('[data-copy-setup-prompt]')?.addEventListener('click', () =>
  copy(COMPONENTS_SETUP_PROMPT, 'Setup prompt copied. Paste it into your agent.'),
);

// "Saved" in the sidebar box: pick the Saved chip and bring the browser into view.
$('[data-sidebar-saved]')?.addEventListener('click', () => {
  const chip = $<HTMLElement>('.cmp-chip[data-cat="saved"]');
  chip?.click();
  (chip?.closest('section') ?? chip)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
