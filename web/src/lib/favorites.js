// Likes (heart) and saves (bookmark) for launch videos and components, kept in this
// browser's localStorage, so they are still there when the visitor comes back. Nothing
// leaves the device. Plain JavaScript so the gallery script tests can load it.
//
// Any element can be a toggle: <button data-fav="liked|saved" data-fav-kind="video|component"
// data-fav-id="…">. initFavorites() (run once per page from SiteHeader) handles their
// clicks, keeps aria-pressed in sync everywhere, including buttons added later (the
// gallery grid, the site player), and follows changes made in other tabs.

const KEY = 'kuchi-favorites';
const LISTS = ['liked', 'saved'];
const listeners = new Set();
let state = null;

function empty() {
  return { liked: { video: [], component: [] }, saved: { video: [], component: [] } };
}

function read() {
  const next = empty();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    for (const list of LISTS) {
      for (const kind of ['video', 'component']) {
        const ids = raw?.[list]?.[kind];
        if (Array.isArray(ids)) next[list][kind] = [...new Set(ids.map(String))];
      }
    }
  } catch {}
  return next;
}

function current() {
  if (!state) state = read();
  return state;
}

function write() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function emit() {
  for (const listener of listeners) {
    try { listener(); } catch {}
  }
}

/** @returns {string[]} ids in the order they were added, newest last */
export function favoriteIds(list, kind) {
  return [...(current()[list]?.[kind] ?? [])];
}

export function isFavorite(list, kind, id) {
  return current()[list]?.[kind]?.includes(String(id)) ?? false;
}

/** Flips one like or save and returns whether it is now on. */
export function toggleFavorite(list, kind, id) {
  const ids = current()[list]?.[kind];
  if (!ids) return false;
  const key = String(id);
  const at = ids.indexOf(key);
  if (at === -1) ids.push(key);
  else ids.splice(at, 1);
  write();
  syncFavButtons();
  emit();
  return at === -1;
}

/** Runs `listener` after any like or save changes, in this tab or another. */
export function onFavoritesChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const HEART = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z"/></svg>';
const BOOKMARK = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6.5 4.5h11v15.5L12 16.2 6.5 20Z"/></svg>';

const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The heart and bookmark buttons for one item, as HTML. Astro pages render it with
 * set:html and the gallery script inlines it, so every surface gets the same markup.
 * Rendered unpressed; initFavorites() presses the ones this visitor has chosen.
 */
export function favButtonsHTML(kind, id, title, extraClass = '') {
  const name = escapeAttr(title);
  const attrs = `data-fav-kind="${kind}" data-fav-id="${escapeAttr(id)}"`;
  return `<span class="fav-actions${extraClass ? ` ${extraClass}` : ''}">`
    + `<button type="button" class="fav-btn fav-like" data-fav="liked" ${attrs} aria-pressed="false" aria-label="Like ${name}" title="Like">${HEART}<span class="fav-text">Like</span></button>`
    + `<button type="button" class="fav-btn fav-save" data-fav="saved" ${attrs} aria-pressed="false" aria-label="Save ${name}" title="Save for later">${BOOKMARK}<span class="fav-text">Save</span></button>`
    + '</span>';
}

/** Presses the toggles that match this visitor's likes and saves. */
export function syncFavButtons(root = document) {
  for (const button of root.querySelectorAll('[data-fav]')) {
    const on = isFavorite(button.dataset.fav, button.dataset.favKind, button.dataset.favId);
    if (button.getAttribute('aria-pressed') !== String(on)) button.setAttribute('aria-pressed', String(on));
    button.title = button.dataset.fav === 'liked' ? (on ? 'Liked' : 'Like') : (on ? 'Saved' : 'Save for later');
    const text = button.querySelector('.fav-text');
    if (text) text.textContent = button.dataset.fav === 'liked' ? (on ? 'Liked' : 'Like') : (on ? 'Saved' : 'Save');
  }
  // <span data-fav-count="saved:video"> shows how many there are.
  for (const badge of root.querySelectorAll('[data-fav-count]')) {
    const [list, kind] = badge.dataset.favCount.split(':');
    const count = favoriteIds(list, kind).length;
    badge.textContent = count ? String(count) : '';
  }
}

function announce(list, on) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = list === 'liked'
    ? (on ? 'Liked. Your likes stay in this browser.' : 'Removed from your likes')
    : (on ? 'Saved. Find it under Saved, in this browser.' : 'Removed from saved');
  toast.classList.add('visible');
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

export function initFavorites() {
  if (typeof window === 'undefined' || window.__kuchiFavorites) return;
  window.__kuchiFavorites = true;

  // Capture phase, so a toggle inside a card, a dialog or the player never also opens,
  // plays or closes whatever it sits in.
  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-fav]') : null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const on = toggleFavorite(button.dataset.fav, button.dataset.favKind, button.dataset.favId);
    announce(button.dataset.fav, on);
  }, true);

  // Another tab changed them.
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return;
    state = read();
    syncFavButtons();
    emit();
  });

  // Toggles rendered later (gallery grid, site player, dialogs).
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element && (node.matches('[data-fav]') || node.querySelector('[data-fav]'))) {
          syncFavButtons();
          return;
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  syncFavButtons();
}
