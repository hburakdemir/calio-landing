// Light/dark theme toggle. Dark is the default look; a stored choice wins.
// Swaps product screenshots between their -dark- and -light- shot variants.
import { t, onLocaleChange } from './i18n.js';

const STORAGE_KEY = 'calio_site_theme';

export function initTheme() {
  const toggles = Array.from(document.querySelectorAll('.theme-toggle'));
  const shots = Array.from(document.querySelectorAll('img[src*="-dark-"]')).map((img) => ({
    img,
    darkSrc: img.getAttribute('src'),
    darkSrcset: img.getAttribute('srcset')
  }));

  const applyShots = (theme) => {
    shots.forEach(({ img, darkSrc, darkSrcset }) => {
      if (theme === 'light') {
        img.setAttribute('src', darkSrc.replace('-dark-', '-light-'));
        if (darkSrcset) img.setAttribute('srcset', darkSrcset.replace(/-dark-/g, '-light-'));
      } else {
        img.setAttribute('src', darkSrc);
        if (darkSrcset) img.setAttribute('srcset', darkSrcset);
      }
    });
  };

  const updateToggleLabels = (theme) => {
    const key = theme === 'light' ? 'nav.themeToDark' : 'nav.themeToLight';
    toggles.forEach((btn) => {
      btn.setAttribute('data-i18n-attr', `aria-label:${key}`);
      btn.setAttribute('aria-label', t(key));
      btn.setAttribute('aria-pressed', String(theme === 'light'));
    });
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    applyShots(theme);
    updateToggleLabels(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private mode */ }
    document.dispatchEvent(new CustomEvent('calio:themechange', { detail: theme }));
  };

  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
  setTheme(stored === 'light' ? 'light' : 'dark');

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      setTheme(isLight ? 'dark' : 'light');
    });
  });

  onLocaleChange(() => {
    updateToggleLabels(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  });
}
