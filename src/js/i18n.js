// Dictionary-toggle i18n (sprint §6). TR is the default; HTML ships with TR inline.
import tr from '../i18n/tr.js';
import en from '../i18n/en.js';

const DICTS = { tr, en };
const STORAGE_KEY = 'calio_site_locale';

let current = 'tr';
const willChangeListeners = new Set(); // fire BEFORE text swap (e.g. revert SplitText)
const changeListeners = new Set(); // fire AFTER text swap (e.g. ScrollTrigger.refresh)

export function t(key) {
  const dict = DICTS[current];
  if (key in dict) return dict[key];
  if (key in DICTS.tr) return DICTS.tr[key];
  return key;
}

export function getLocale() {
  return current;
}

export function onLocaleWillChange(cb) {
  willChangeListeners.add(cb);
  return () => willChangeListeners.delete(cb);
}

export function onLocaleChange(cb) {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}

export function setLocale(locale) {
  if (!DICTS[locale]) locale = 'tr';

  willChangeListeners.forEach((cb) => {
    try { cb(locale); } catch (e) { console.error(e); }
  });

  current = locale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* private mode */ }

  document.documentElement.lang = locale;
  document.title = t('meta.title');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t('meta.desc'));

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.getAttribute('data-i18n-attr').split(',').forEach((pair) => {
      const idx = pair.indexOf(':');
      if (idx === -1) return;
      const attr = pair.slice(0, idx).trim();
      const key = pair.slice(idx + 1).trim();
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.locale === locale));
  });

  changeListeners.forEach((cb) => {
    try { cb(locale); } catch (e) { console.error(e); }
  });
}

export function initI18n() {
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }
  // Page default: the generated /en/ page sets window.__CALIO_LOCALE_DEFAULT='en'
  // so it boots in English; an explicit visitor choice still wins.
  const pageDefault = window.__CALIO_LOCALE_DEFAULT === 'en' ? 'en' : 'tr';
  const initial = stored === 'en' || stored === 'tr' ? stored : pageDefault;

  // Every TR|EN pill (nav, mobile menu, footer) drives the same setLocale.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (btn && btn.dataset.locale && btn.dataset.locale !== current) {
      setLocale(btn.dataset.locale);
    }
  });

  if (initial !== current) setLocale(initial);
}
