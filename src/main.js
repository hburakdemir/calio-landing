// Entry: fonts, styles, i18n, scroll, nav, form, animations, lazy Three.js.
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';

import { initI18n } from './js/i18n.js';
import { initTheme } from './js/theme.js';
import { initScroll } from './js/scroll.js';
import { initNav } from './js/nav.js';
import { initAnimations, initFaq } from './js/animations.js';
import { initForm } from './js/form.js';
import { initLightbox } from './js/lightbox.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) document.documentElement.classList.add('no-motion');

function boot() {
  initI18n();
  initTheme();
  initScroll(reducedMotion);
  initNav(reducedMotion);
  initFaq(reducedMotion);
  initForm();
  initLightbox();
  initAnimations(); // hero H1 reveal starts here, immediately (≈ DOMContentLoaded)
  scheduleThree();
}

/* Lazy Three.js gate (sprint §4): only after window load + idle, only with
   WebGL, motion allowed and a not-low-end device. Otherwise the CSS poster stays. */
function scheduleThree() {
  if (reducedMotion) return;
  const lowEnd =
    (navigator.hardwareConcurrency || 8) < 4 && (navigator.deviceMemory ?? 8) < 4;
  if (lowEnd) return;

  let gl = null;
  try {
    const probe = document.createElement('canvas');
    gl = probe.getContext('webgl2') || probe.getContext('webgl');
  } catch {
    gl = null;
  }
  if (!gl) return;

  const start = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 1500 });
    } else {
      setTimeout(load, 300);
    }
  };
  const load = () => {
    import('./js/three-hero.js')
      .then((m) => m.initThreeHero())
      .catch(() => { /* poster fallback stays — hero must survive without the canvas */ });
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
