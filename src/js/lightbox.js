// Click-to-zoom lightbox for product screenshots (browser-frame + bento cards).
import { lenis } from './scroll.js';
import { t, onLocaleChange } from './i18n.js';

function largestFromSrcset(img) {
  const srcset = img.getAttribute('srcset');
  if (!srcset) return img.currentSrc || img.src;
  const candidates = srcset.split(',').map((entry) => {
    const [url, width] = entry.trim().split(/\s+/);
    return { url, width: parseInt(width, 10) || 0 };
  });
  candidates.sort((a, b) => b.width - a.width);
  return candidates[0]?.url || img.src;
}

export function initLightbox() {
  const targets = Array.from(document.querySelectorAll('.browser-frame img, .bento-media img'));
  if (!targets.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.hidden = true;
  overlay.innerHTML = `
    <button type="button" class="lightbox-close">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <img class="lightbox-img" alt="" />
  `;
  document.body.appendChild(overlay);
  const overlayImg = overlay.querySelector('.lightbox-img');
  const closeBtn = overlay.querySelector('.lightbox-close');

  const refreshLabels = () => {
    closeBtn.setAttribute('aria-label', t('lightbox.close'));
    targets.forEach((img) => img.setAttribute('aria-label', t('lightbox.zoom')));
  };
  refreshLabels();
  onLocaleChange(refreshLabels);

  let lastFocused = null;

  function open(img) {
    lastFocused = document.activeElement;
    overlayImg.src = largestFromSrcset(img);
    overlayImg.alt = img.alt || '';
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    lenis?.stop();
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    lenis?.start();
    document.removeEventListener('keydown', onKeydown);
    setTimeout(() => {
      overlay.hidden = true;
      overlayImg.src = '';
    }, 200);
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  targets.forEach((img) => {
    img.classList.add('is-zoomable');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  closeBtn.addEventListener('click', close);
}
