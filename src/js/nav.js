// Sticky glass nav, mobile menu, active-link highlight (sprint §3.0).
import gsap from 'gsap';
import { t } from './i18n.js';
import { lenis } from './scroll.js';

export function initNav(reducedMotion) {
  const nav = document.getElementById('site-nav');
  const burger = nav.querySelector('.nav-burger');
  const menu = document.getElementById('mobile-menu');

  // Glass background after 40px of scroll.
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu open/close.
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('data-i18n-attr', open ? 'aria-label:nav.menuClose' : 'aria-label:nav.menuOpen');
    burger.setAttribute('aria-label', t(open ? 'nav.menuClose' : 'nav.menuOpen'));
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) lenis?.stop();
    else lenis?.start();
    if (open && !reducedMotion) {
      gsap.from(menu.querySelectorAll('.mobile-menu-links a, .mobile-menu .lang-pill'), {
        y: 16,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'all'
      });
    }
  };

  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  // Capture phase: close the menu (and restart Lenis) BEFORE the anchor
  // scroll handler runs, otherwise the smooth scroll is issued while stopped.
  menu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setMenu(false), true);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      burger.focus();
    }
  });

  // Active-section highlight on nav links. Live-rect check instead of fixed
  // ScrollTrigger positions so pinned-section spacers can never skew it.
  const links = Array.from(nav.querySelectorAll('.nav-links a'));
  const pairs = links
    .map((link) => [link, document.querySelector(link.getAttribute('href'))])
    .filter(([, section]) => section);
  let rafPending = false;
  const updateActive = () => {
    rafPending = false;
    const line = window.innerHeight * 0.45;
    let best = null;
    pairs.forEach(([link, section]) => {
      const r = section.getBoundingClientRect();
      if (r.top <= line && r.bottom >= line) best = link;
    });
    links.forEach((l) => l.classList.toggle('is-active', l === best));
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateActive);
      }
    },
    { passive: true }
  );
  updateActive();

  // Nav fades down on load.
  if (!reducedMotion) {
    gsap.from(nav, { y: -16, opacity: 0, duration: 0.5, delay: 0.1, ease: 'power2.out', clearProps: 'all' });
  }
}
