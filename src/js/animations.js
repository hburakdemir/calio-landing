// All GSAP/ScrollTrigger choreography (sprint §3). Everything lives inside
// gsap.matchMedia(): full motion only under (prefers-reduced-motion: no-preference).
// CSS defaults ARE the end states, so the reduced context needs no tweens at all.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { onLocaleWillChange, onLocaleChange } from './i18n.js';

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);

// Pending one-shot SplitText reveals: reverted cleanly if the locale changes
// before they play (the text swap would otherwise orphan the split nodes).
const pendingSplits = new Set();

function registerSplit(entry) {
  pendingSplits.add(entry);
  return entry;
}

function releaseSplit(entry) {
  pendingSplits.delete(entry);
}

/* ---------- generic fade-up entrance (global default) ---------- */
function fadeUp(targets, trigger, vars = {}, stVars = {}) {
  const els = gsap.utils.toArray(targets);
  if (!els.length) return;
  gsap.from(els, {
    y: 24,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.08,
    scrollTrigger: { trigger, start: 'top 75%', once: true, ...stVars },
    ...vars
  });
}

/* ---------- masked line/word reveal for big headings ---------- */
function maskReveal(el, { type = 'lines', stagger = 0.1 } = {}) {
  if (!el) return;
  const split = new SplitText(el, { type, mask: type, linesClass: 'st-line', wordsClass: 'st-word' });
  const units = type === 'lines' ? split.lines : split.words;
  gsap.set(units, { yPercent: 110 });
  const entry = registerSplit({ split, trigger: null });
  entry.trigger = ScrollTrigger.create({
    trigger: el,
    start: 'top 80%',
    once: true,
    onEnter() {
      gsap.to(units, {
        yPercent: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger,
        onComplete() {
          split.revert();
          releaseSplit(entry);
        }
      });
    }
  });
}

/* =================================================================== */

export function initAnimations() {
  const mm = gsap.matchMedia();

  mm.add(
    {
      motionOK: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 768px)',
      mobile: '(max-width: 767px)',
      pointerFine: '(hover: hover) and (pointer: fine)'
    },
    (ctx) => {
      const { motionOK, desktop, pointerFine } = ctx.conditions;
      if (!motionOK) return; // reduced motion: CSS end states, native scroll, nothing else

      // Above-the-fold motion must start with the first paint.
      heroIntro();
      heroShotAndDisperse();
      scrollCue();

      // Everything below the fold is deferred to idle so boot stays one short
      // task (TBT). ctx.add() keeps the late-created tweens/triggers owned by
      // this matchMedia context, so breakpoint flips still clean them up.
      let disposed = false;
      const buildBelowFold = () => {
        if (disposed) return;
        ctx.add(() => {
          proofStrip();
          problemSection();
          if (desktop) tourPinned();
          else tourMobile();
          migrationSection();
          bentoSection(pointerFine);
          securitySection();
          pricingSection();
          founderSection();
          demoSection();
          if (desktop && pointerFine) magneticButtons();
          ScrollTrigger.refresh();
        });
      };
      if ('requestIdleCallback' in window) {
        requestIdleCallback(buildBelowFold, { timeout: 1200 });
      } else {
        setTimeout(buildBelowFold, 120);
      }

      return () => {
        disposed = true;
      };
    }
  );

  /* ---------- locale switching hygiene ---------- */
  onLocaleWillChange(() => {
    // Revert any not-yet-played split reveals so textContent swaps stay clean.
    pendingSplits.forEach(({ split, trigger, tween }) => {
      tween?.kill();
      trigger?.kill();
      try { split.revert(); } catch { /* already reverted */ }
    });
    pendingSplits.clear();
    founderCleanup?.();
  });

  onLocaleChange(() => {
    rebuildFounder?.();
    ScrollTrigger.refresh();
  });
}

/* =================== 3.1 HERO =================== */

function heroIntro() {
  const lines = document.querySelectorAll('.hero-h1-line');
  if (!lines.length) return;

  const split = new SplitText(lines, { type: 'words', mask: 'words', wordsClass: 'st-word' });
  const entry = registerSplit({ split });

  const tl = gsap.timeline({
    onComplete() {
      split.revert();
      releaseSplit(entry);
    }
  });
  entry.tween = tl;

  tl.from(split.words, { yPercent: 110, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, 0)
    .from('.hero-badge', { opacity: 0, y: 10, duration: 0.5, ease: 'power2.out' }, 0.2)
    .from('.hero-sub', { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' }, 0.35)
    .from('.hero-ctas', { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' }, 0.45);
}

function heroShotAndDisperse() {
  const shot = document.getElementById('hero-shot');
  if (!shot) return;

  // Initial Linear-style tilt; fades in on load.
  gsap.set(shot, { transformPerspective: 1200, rotationX: 28, scale: 0.94, opacity: 0.001 });
  gsap.to(shot, { opacity: 1, duration: 0.9, delay: 0.4, ease: 'power2.out' });

  // Tilt-to-flat scrub; the same trigger drives the Three.js disperse.
  gsap.to(shot, {
    rotationX: 0,
    scale: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=60%',
      scrub: true,
      onUpdate(self) {
        document.dispatchEvent(new CustomEvent('calio:heroprogress', { detail: self.progress }));
      }
    }
  });
}

function scrollCue() {
  gsap.to('.scroll-cue', { y: 8, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/* =================== 3.2 PROOF STRIP =================== */

function proofStrip() {
  const strip = document.querySelector('.proof-strip');
  if (!strip) return;

  fadeUp('.proof-item', strip);

  // Specular highlight: a 1px gradient line travels the top border once.
  const spec = document.createElement('div');
  spec.className = 'proof-specular';
  spec.setAttribute('aria-hidden', 'true');
  strip.appendChild(spec);

  ScrollTrigger.create({
    trigger: strip,
    start: 'top 80%',
    once: true,
    onEnter() {
      gsap.to(spec, { x: () => strip.offsetWidth + 520, duration: 1.8, ease: 'power1.inOut' });

      // Count-up on the first integer found in each figure (locale-safe:
      // it re-reads and replaces the current text every tick).
      document.querySelectorAll('.proof-big').forEach((el) => {
        const m = el.textContent.match(/\d+/);
        if (!m) return;
        const target = parseInt(m[0], 10);
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.2,
          ease: 'power1.out',
          snap: { v: 1 },
          onUpdate() {
            el.textContent = el.textContent.replace(/\d+/, String(Math.round(state.v)));
          }
        });
      });
    }
  });
}

/* =================== 3.3 PROBLEM =================== */

function problemSection() {
  const section = document.getElementById('problem');
  if (!section) return;

  maskReveal(section.querySelector('.problem-h2'), { type: 'lines' });
  fadeUp(section.querySelector('.eyebrow'), section);
  fadeUp('.problem-card', '.problem-cards', { stagger: 0.12 });

  gsap.fromTo(
    '.problem-closer',
    { opacity: 0.25 },
    {
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.problem-closer', start: 'top 85%', end: 'top 50%', scrub: true }
    }
  );
}

/* =================== 3.4 PRODUCT TOUR =================== */

function tourPinned() {
  const wrap = document.getElementById('tour-wrap');
  if (!wrap) return;
  wrap.classList.add('is-pinned');

  const steps = gsap.utils.toArray('.tour-step');
  const imgs = gsap.utils.toArray('.tour-img');
  const dots = gsap.utils.toArray('.rail-dot');
  let cur = 0;

  const setStep = (idx) => {
    if (idx === cur) return;
    gsap.to(imgs[cur], { opacity: 0, scale: 0.98, duration: 0.35, ease: 'power2.out', overwrite: true });
    gsap.fromTo(
      imgs[idx],
      { opacity: 0, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out', overwrite: true }
    );
    imgs.forEach((im, i) => im.classList.toggle('is-active', i === idx));
    steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('is-active', i <= idx));
    cur = idx;
  };

  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 96px',
    end: '+=300%',
    pin: true,
    scrub: 0.5,
    onUpdate(self) {
      setStep(Math.min(3, Math.floor(self.progress * 4)));
    }
  });

  // Floating detail cards: parallax at different scrub speeds over the pin.
  gsap.fromTo('.float-card-1', { y: -10 }, {
    y: 10, ease: 'none',
    scrollTrigger: { trigger: wrap, start: 'top 96px', end: '+=300%', scrub: 1.2 }
  });
  gsap.fromTo('.float-card-2', { y: 12 }, {
    y: -12, ease: 'none',
    scrollTrigger: { trigger: wrap, start: 'top 96px', end: '+=300%', scrub: 0.6 }
  });

  fadeUp('#tour .section-head > *', '#tour');
}

function tourMobile() {
  // Stacked fallback: standard entrances only (frames shown via CSS).
  fadeUp('#tour .section-head > *', '#tour');
  gsap.utils.toArray('.tour-step').forEach((step) => {
    fadeUp(step.children, step);
  });
}

/* =================== 3.5 MIGRATION =================== */

function migrationSection() {
  const section = document.getElementById('migration');
  if (!section) return;

  fadeUp('#migration .section-head > *', section);

  // Platform chips pop in.
  gsap.from('.platform-chip', {
    scale: 0.9,
    opacity: 0,
    duration: 0.5,
    ease: 'back.out(1.6)',
    stagger: 0.08,
    scrollTrigger: { trigger: '.migration-flow', start: 'top 80%', once: true }
  });

  // Connector path draws itself, then teal dots travel it in a loop.
  const path = section.querySelector('.flow-path');
  const flowDots = gsap.utils.toArray('.flow-dot');
  const dotTweens = [];
  if (path) {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: '.migration-flow', start: 'top 80%', once: true }
    });

    flowDots.forEach((dot, i) => {
      dotTweens.push(
        gsap.to(dot, {
          motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
          duration: 3.2,
          repeat: -1,
          ease: 'none',
          delay: i * 0.8,
          paused: true
        })
      );
    });

    // Loop runs only while the flow is on screen.
    ScrollTrigger.create({
      trigger: '.migration-flow',
      start: 'top 95%',
      end: 'bottom top',
      onToggle(self) {
        dotTweens.forEach((tw) => (self.isActive ? tw.play() : tw.pause()));
      }
    });
  }

  gsap.from('.flow-target', {
    scale: 0.85,
    opacity: 0,
    duration: 0.6,
    ease: 'back.out(1.6)',
    delay: 0.4,
    scrollTrigger: { trigger: '.migration-flow', start: 'top 80%', once: true }
  });

  // Checklist: items fade up while their check marks draw in one by one.
  const checkPaths = gsap.utils.toArray('.migration-checklist .check-icon path');
  checkPaths.forEach((p) => {
    const l = p.getTotalLength();
    gsap.set(p, { strokeDasharray: l, strokeDashoffset: l });
  });
  ScrollTrigger.create({
    trigger: '.migration-checklist',
    start: 'top 75%',
    once: true,
    onEnter() {
      gsap.to(checkPaths, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out', stagger: 0.1 });
      gsap.from('.migration-checklist .check-item', {
        y: 14,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.1
      });
    }
  });
  fadeUp('.migration-checklist h3', '.migration-checklist');

  // Honest note arrives last — intentionally calm.
  gsap.from('.honest-note', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    delay: 0.5,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.migration-cols', start: 'top 75%', once: true }
  });

  fadeUp('.migration-cta-row', '.migration-cta-row', {}, { start: 'top 90%' });
}

/* =================== 3.6 BENTO FEATURES =================== */

function bentoSection(pointerFine) {
  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  fadeUp('#features .section-head > *', '#features');
  fadeUp('.bento-cell', grid);
  fadeUp('.also-strip', '.also-strip', {}, { start: 'top 92%' });

  // Cursor spotlight: one mousemove listener sets CSS vars per card.
  if (pointerFine) {
    grid.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.spot-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  }

  // Anchor screenshot pans slowly with scroll.
  const anchorImg = document.querySelector('.bento-media-anchor img');
  if (anchorImg) {
    gsap.fromTo(
      anchorImg,
      { scale: 1.08, yPercent: -2 },
      {
        yPercent: 2,
        scale: 1.08,
        ease: 'none',
        scrollTrigger: { trigger: '.bento-anchor', start: 'top 90%', end: 'bottom 10%', scrub: true }
      }
    );
  }

  // Role chips light up sequentially on a 4s loop, paused off-screen.
  const chips = gsap.utils.toArray('.role-chip');
  if (chips.length) {
    const loop = gsap.timeline({ repeat: -1, paused: true });
    chips.forEach((chip, i) => {
      loop.call(
        () => {
          chips.forEach((c) => c.classList.remove('is-lit'));
          chip.classList.add('is-lit');
        },
        null,
        i
      );
    });
    loop.to({}, { duration: chips.length }); // pad to 4s total
    ScrollTrigger.create({
      trigger: '.roles-picto',
      start: 'top 95%',
      end: 'bottom top',
      onToggle(self) {
        if (self.isActive) loop.play();
        else loop.pause();
      }
    });
  }
}

/* =================== 3.7 TRUST / KVKK =================== */

function securitySection() {
  const section = document.getElementById('security');
  if (!section) return;

  maskReveal(section.querySelector('.h2'), { type: 'lines' });
  fadeUp(section.querySelectorAll('.security-head .eyebrow, .security-head .section-sub'), section);

  // Shield pulse behind the heading.
  ScrollTrigger.create({
    trigger: '.security-head',
    start: 'top 75%',
    once: true,
    onEnter() {
      gsap.fromTo(
        '.shield-pulse',
        { scale: 0.8, opacity: 0.4 },
        { scale: 1.15, opacity: 0, duration: 1.2, ease: 'power2.out' }
      );
    }
  });

  // Step cards slide in from the left; numbers flip in.
  gsap.from('.step-card', {
    x: -40,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.15,
    scrollTrigger: { trigger: '.steps-row', start: 'top 75%', once: true }
  });
  gsap.from('.step-num', {
    rotationX: 90,
    opacity: 0,
    transformOrigin: '50% 100%',
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.15,
    delay: 0.2,
    scrollTrigger: { trigger: '.steps-row', start: 'top 75%', once: true }
  });

  fadeUp('.spec-card', '.security-cols');
  fadeUp('.security-shot', '.security-cols', {}, { start: 'top 70%' });
  fadeUp('.kvkk-note', '.kvkk-note', {}, { start: 'top 88%' });
}

/* =================== 3.8 PRICING =================== */

function pricingSection() {
  const card = document.getElementById('pricing-card');
  if (!card) return;

  fadeUp('#pricing .section-head > *', '#pricing');

  ScrollTrigger.create({
    trigger: card,
    start: 'top 80%',
    once: true,
    onEnter() {
      const tl = gsap.timeline();
      tl.from(card, {
        y: 40,
        rotationX: 8,
        transformPerspective: 800,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      }).fromTo(
        '.price-badge',
        { scale: 1 },
        { scale: 1.15, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut' },
        '-=0.2'
      );
    }
  });

  fadeUp('.pricing-cta-row', '.pricing-cta-row', {}, { start: 'top 92%' });
}

/* =================== 3.9 FOUNDER =================== */

let founderCleanup = null;
let rebuildFounder = null;

function founderSection() {
  const quote = document.querySelector('.founder-quote');
  if (!quote) return;

  const build = () => {
    // aria: 'none' — SplitText's default aria-label is prohibited on <blockquote>;
    // the words stay in DOM order so screen readers read the quote naturally.
    const split = new SplitText(quote, { type: 'words', wordsClass: 'st-word', aria: 'none' });
    const tween = gsap.fromTo(
      split.words,
      { opacity: 0.4 },
      {
        opacity: 1,
        stagger: 0.04,
        ease: 'none',
        scrollTrigger: { trigger: quote, start: 'top 78%', end: 'top 38%', scrub: true }
      }
    );
    founderCleanup = () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      try { split.revert(); } catch { /* noop */ }
      founderCleanup = null;
    };
  };

  build();
  rebuildFounder = build;

  fadeUp('.founder-avatar, .founder-name', '#founder');
}

/* =================== 3.11 DEMO =================== */

function demoSection() {
  fadeUp('.demo-left > *', '#demo');

  gsap.from('#form-card', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#demo', start: 'top 70%', once: true },
    onComplete() {
      gsap.fromTo(
        '#form-card',
        { boxShadow: '0 0 0 rgba(20,184,166,0)' },
        { boxShadow: '0 0 60px rgba(20,184,166,0.15)', duration: 1, ease: 'power2.out' }
      );
    }
  });

  gsap.from('.reassure-item', {
    x: -16,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.12,
    scrollTrigger: { trigger: '.reassure-list', start: 'top 80%', once: true }
  });
}

/* =================== FAQ accordion (works with and without motion) =================== */

export function initFaq(reducedMotion) {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-q button');
    const region = item.querySelector('.faq-a');
    if (!btn || !region) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      item.classList.toggle('is-open', !isOpen);

      if (isOpen) {
        if (reducedMotion) {
          region.hidden = true;
        } else {
          gsap.to(region, {
            height: 0,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.inOut',
            onComplete() {
              region.hidden = true;
              gsap.set(region, { clearProps: 'height,opacity' });
            }
          });
        }
      } else {
        region.hidden = false;
        if (!reducedMotion) {
          gsap.fromTo(
            region,
            { height: 0, opacity: 0 },
            {
              height: 'auto',
              opacity: 1,
              duration: 0.35,
              ease: 'power2.inOut',
              onComplete() {
                gsap.set(region, { clearProps: 'height,opacity' });
              }
            }
          );
        }
      }
    });
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fadeUp('.faq-item', '.faq-list');
  }
}

/* =================== Magnetic buttons (desktop, fine pointer) =================== */

function magneticButtons() {
  const magnets = gsap.utils.toArray('.btn-magnetic').map((btn) => ({
    btn,
    xTo: gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power3' }),
    yTo: gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power3' }),
    active: false
  }));
  if (!magnets.length) return;

  window.addEventListener(
    'mousemove',
    (e) => {
      magnets.forEach((s) => {
        const r = s.btn.getBoundingClientRect();
        const withinX = e.clientX > r.left - 60 && e.clientX < r.right + 60;
        const withinY = e.clientY > r.top - 60 && e.clientY < r.bottom + 60;
        if (withinX && withinY) {
          s.active = true;
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          s.xTo(gsap.utils.clamp(-6, 6, dx * 0.08));
          s.yTo(gsap.utils.clamp(-6, 6, dy * 0.08));
        } else if (s.active) {
          s.active = false;
          gsap.to(s.btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true });
        }
      });
    },
    { passive: true }
  );
}
