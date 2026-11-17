// Hero background: GradientASCII, switched with the site theme. On light it is a blue wash
// with darker glyphs (lightMode); on dark the vibrant blues glow over the #121212 page. It
// watches <html data-theme> so the toggle in the header changes it live.
//
// Active across all devices: desktop, tablet, touchscreens, and mobile.
// Graceful fallback to static CSS gradient (.intro-bg-static) when WebGL2 is unavailable,
// data saver is enabled, or reduced motion is preferred.
import { lazy, Suspense, useEffect, useState } from 'react';

const GradientASCII = lazy(() => import('./GradientASCII.jsx'));

const isDark = () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';

const hasWebGL2 = () => {
  if (typeof window === 'undefined' || typeof WebGL2RenderingContext === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
};

const canAnimate = () => {
  if (typeof window === 'undefined') return false;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  return !prefersReduced && !saveData && hasWebGL2();
};

const LIGHT = {
  lightMode: true,
  colors: ['#1e3fd8', '#a5d8ff', '#e8f1ff', '#38bdf8'],
  glyphOpacity: 0.65,
  gradientOpacity: 0.6,
  glow: 0,
};

const DARK = {
  lightMode: false,
  colors: ['#1e3fd8', '#f6f8ff', '#a5d8ff', '#38bdf8'],
  glyphOpacity: 0.8,
  gradientOpacity: 0.7,
  glow: 0.25,
};

const Static = () => <div className="intro-bg-static" />;

export default function HeroBackground() {
  const [dark, setDark] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setDark(isDark());
    setAnimate(canAnimate());
    setIsMobile(window.innerWidth < 768);

    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', onResize, { passive: true });

    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  if (!animate) return <Static />;

  return (
    <Suspense fallback={<Static />}>
      <GradientASCII
        {...(dark ? DARK : LIGHT)}
        shape="horizon"
        characters=" =+xX0S8#@"
        cellSize={isMobile ? 14 : 18}
        density={0.8}
        dpr={isMobile ? 1.5 : 2}
        grain={0.06}
        flow={0.5}
        speed={0.8}
        mouseInteraction={true}
        clickEffect="wave"
      />
    </Suspense>
  );
}
