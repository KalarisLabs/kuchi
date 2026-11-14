// Smooth scrolling (Lenis) and the GSAP bridge.
//
// Lenis runs on every page unless the visitor asked for reduced motion. Touch devices
// keep native scrolling (the Lenis default). Scrollable overlays such as the reference
// dialog opt out with the `data-lenis-prevent` attribute.
//
// GSAP is not loaded until something calls loadGsap(), so pages with no GSAP
// animation pay nothing for it. Motion rules: docs/FRONTEND_PLAN.md, section 6.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenis: Lenis | null = null;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Touch screens scroll natively anyway, and Lenis's per-frame loop cost ~2.6 s of main
// thread in Lighthouse's mobile run, so it is not started there (getLenis() returns null,
// as it does for reduced motion).
const touchOnly = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export function initSmoothScroll(): Lenis | null {
  if (lenis || typeof window === 'undefined' || prefersReducedMotion() || touchOnly()) return lenis;
  lenis = new Lenis({ autoRaf: true, anchors: true });
  return lenis;
}

export const getLenis = () => lenis;

let gsapReady: Promise<{
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
}> | null = null;

/** Loads GSAP + ScrollTrigger once and puts Lenis on GSAP's clock (the integration from the Lenis README). */
export function loadGsap() {
  gsapReady ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      // Swap the self-driven instance for one driven by GSAP's ticker.
      lenis.destroy();
      lenis = new Lenis({ anchors: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis?.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    return { gsap, ScrollTrigger };
  });
  return gsapReady;
}
