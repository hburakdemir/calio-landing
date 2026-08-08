// Shared entry for the SEO landing/comparison pages (jira-alternatifi,
// trello-alternatifi, kvkk-uyumlu-proje-yonetimi, sorular, etc.)
// Same base as kvkk.js (tokens + base + components + legal document
// layout) plus landing.css for header CTAs, comparison tables,
// callouts, the Q&A hub and the related-pages block.
//
// These pages share the homepage's nav/footer chrome (sprint: "make the
// landing pages feel like part of the product site, not a bare document"),
// so they boot the same theme + smooth-scroll + nav behavior as main.js —
// minus i18n (these pages are TR-only, no lang pill), the demo form and
// the Three.js hero (neither exists on these pages).
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/legal.css';
import './styles/landing.css';

import { initTheme } from './js/theme.js';
import { initScroll } from './js/scroll.js';
import { initNav } from './js/nav.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion) document.documentElement.classList.add('no-motion');

function boot() {
  initTheme();
  initScroll(reducedMotion);
  initNav(reducedMotion);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
