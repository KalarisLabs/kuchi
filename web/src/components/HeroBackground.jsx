// Hero background: GradientASCII, switched with the site theme. On light it is a blue wash
// with darker glyphs (lightMode); on dark the same blues glow over the #121212 page. It
// watches <html data-theme> so the toggle in the header changes it live.
//
// Performance: the WebGL effect costs ~3 s of main-thread time on a throttled phone
// (Lighthouse, Nov 2026), so it only runs on capable screens. Phones, low-power devices,
// Data Saver and reduced motion get a static CSS gradient in the same colours
// (.intro-bg-static in legacy.css), and the WebGL code is never downloaded for them.
import { lazy, Suspense, useEffect, useState } from 'react';

const GradientASCII = lazy(() => import('./GradientASCII.jsx'));

const isDark = () => document.documentElement.dataset.theme === 'dark';

const canAnimate = () => {
  const connection = navigator.connection;
  return (
    window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    (navigator.hardwareConcurrency ?? 8) > 4 &&
    !connection?.saveData &&
    typeof WebGL2RenderingContext !== 'undefined'
  );
};

const LIGHT = { lightMode: true, colors: ['#1e3fd8', '#a5d8ff', '#e8f1ff', '#ffffff'], glyphOpacity: 0.55, gradientOpacity: 0.55, glow: 0 };
const DARK = { lightMode: false, colors: ['#1e3fd8', '#4d7cff', '#a5d8ff', '#e8f1ff'], glyphOpacity: 0.7, gradientOpacity: 0.45, glow: 0.25 };

const Static = () => <div className="intro-bg-static" />;

export default function HeroBackground() {
  const [dark, setDark] = useState(false);
  const [animate, setAnimate] = useState(false); // decided on the client; static until then
  useEffect(() => {
    setDark(isDark());
    setAnimate(canAnimate());
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  if (!animate) return <Static />;
  return (
    <Suspense fallback={<Static />}>
      <GradientASCII
        {...(dark ? DARK : LIGHT)}
        shape="rise"
        characters=" .:-=+xX#"
        cellSize={12}
        density={0.7}
        grain={0}
        flow={0.6}
        speed={0.6}
        clickEffect="none"
      />
    </Suspense>
  );
}
