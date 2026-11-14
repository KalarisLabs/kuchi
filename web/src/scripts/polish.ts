// Motion for swaps the ported scripts make (gallery.js, connect.js). Those scripts stay
// verbatim copies of the reference site, so nothing here changes what they do: this file
// only watches the elements they rewrite and animates the new content in.
// The CSS half is src/styles/polish.css.
//
// A swap animates only when a pointer click caused it. Keyboard activation (arrow keys in
// the dialog, Enter on a button), typing in search, filters and the first page load change
// the content at once, as do all swaps under reduced motion.
import { prefersReducedMotion } from './motion';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

// The last pointer click, recorded in the capture phase so it is known before the ported
// scripts handle the same click. `detail` is 0 when a click comes from the keyboard.
let clickTarget: Element | null = null;
let clickAt = -Infinity;
document.addEventListener('click', (event) => {
  clickTarget = event.detail > 0 && event.target instanceof Element ? event.target : null;
  clickAt = performance.now();
}, true);
// Any key press after that click means the next change is the keyboard's, not the click's.
document.addEventListener('keydown', () => { clickTarget = null; }, true);
const clicked =(selector: string) =>
  performance.now() - clickAt < 250 && clickTarget?.closest(selector) != null;

const watch = (target: Element | null, options: MutationObserverInit, onChange: () => void) => {
  if (target) new MutationObserver(onChange).observe(target, options);
};

// Featured picker: a highlight that slides to the pressed pick. It is one paper-coloured
// layer clipped to the pressed button (clip-path, so nothing is laid out again).
for (const selector of document.querySelectorAll<HTMLElement>('.desk-selector')) {
  const thumb = document.createElement('span');
  thumb.className = 'desk-selector-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  selector.prepend(thumb);
  const place = () => {
    const pressed = selector.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!pressed) return;
    const left = pressed.offsetLeft - thumb.offsetLeft;
    const right = thumb.offsetWidth - left - pressed.offsetWidth;
    thumb.style.clipPath = `inset(0 ${right}px 0 ${left}px round 5px)`;
  };
  place();
  selector.dataset.thumb = 'placed';
  requestAnimationFrame(() => requestAnimationFrame(() => { selector.dataset.thumb = 'ready'; }));
  watch(selector, { attributes: true, attributeFilter: ['aria-pressed'], subtree: true }, place);
  new ResizeObserver(place).observe(selector);
}

if (!prefersReducedMotion()) {
  const enter = (element: Element | null, from: Keyframe, duration: number, delay = 0) =>
    element?.animate([from, { opacity: 1, transform: 'none', filter: 'none' }], { duration, delay, easing: EASE_OUT, fill: 'backwards' });

  // Featured video: the player and its details arrive together with a short blur.
  const featuredInfo = document.getElementById('featured-info');
  watch(featuredInfo, { childList: true }, () => {
    if (!clicked('[data-feature]')) return;
    enter(featuredInfo, { opacity: 0, transform: 'translateY(6px)', filter: 'blur(3px)' }, 280);
    enter(document.getElementById('featured-video'), { opacity: 0, transform: 'scale(0.985)', filter: 'blur(4px)' }, 280);
  });

  // Reference dialog: Prev and Next slide the new reference in from the side it came from.
  const dialogContent = document.getElementById('dialog-content');
  watch(dialogContent, { childList: true }, () => {
    const direction = clicked('#next-video') ? 1 : clicked('#prev-video') ? -1 : 0;
    if (direction) enter(dialogContent, { opacity: 0, transform: `translateX(${direction * 14}px)` }, 220);
  });

  // Collection: the first cards rise in once, 40 ms apart; the grid/table toggle crossfades.
  const collection = document.getElementById('collection');
  let cardsShown = false;
  watch(collection, { childList: true }, () => {
    if (!collection) return;
    if (!cardsShown && collection.querySelector('.video-card')) {
      cardsShown = true;
      [...collection.querySelectorAll('.video-card')].slice(0, 9).forEach((card, i) =>
        enter(card, { opacity: 0, transform: 'translateY(10px)' }, 380, i * 40));
      return;
    }
    if (clicked('#view-toggle')) {
      enter(collection, { opacity: 0 }, 160);
      enter(document.querySelector('#view-toggle svg'), { opacity: 0, transform: 'scale(0.7)', filter: 'blur(2px)' }, 180);
    }
  });

  // "More agents": the list settles in below its button.
  const moreAgents = document.getElementById('client-setup');
  watch(moreAgents, { attributes: true, attributeFilter: ['hidden'] }, () => {
    if (moreAgents && !moreAgents.hidden && clicked('button[data-client="more"]')) {
      enter(moreAgents, { opacity: 0, transform: 'translateY(-6px)' }, 220);
    }
  });
}
