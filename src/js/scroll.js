// Lenis smooth scroll synced to the GSAP ticker + anchor handling (sprint §3 global rules).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;

export function initScroll(reducedMotion) {
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.1 });
    document.documentElement.classList.add('lenis');
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links scroll via Lenis (offset for the fixed nav); native jump otherwise.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        // force: run even while Lenis is stopped (e.g. the mobile menu just closed)
        lenis.scrollTo(target, { offset: -80, force: true });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
      history.replaceState(null, '', href);
    });
  });
}
