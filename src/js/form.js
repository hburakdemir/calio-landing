// Demo form: validation, mailto composition, clipboard fallback (sprint §5).
// When FORM_ENDPOINT is configured (src/config.js) the form POSTs there first
// and only falls back to mailto if the request fails.
import { t, getLocale, onLocaleChange } from './i18n.js';
import { FORM_ENDPOINT } from '../config.js';

const MAIL_TO = 'burakd279@gmail.com';

// Last successfully submitted answers, stored locale-independent so the
// fallback panel can be re-rendered when the language toggles.
let lastData = null;

function showError(control, errEl, key) {
  errEl.dataset.errKey = key;
  errEl.textContent = t(key);
  errEl.hidden = false;
  if (control) control.setAttribute('aria-invalid', 'true');
}

function clearError(control, errEl) {
  delete errEl.dataset.errKey;
  errEl.textContent = '';
  errEl.hidden = true;
  if (control) control.removeAttribute('aria-invalid');
}

function platformLabel(value) {
  return value === '__other' ? t('form.platform.other') : value;
}

function composeMail(data) {
  const nl = '\r\n';
  const subject = t('form.mail.subject').replace('{name}', data.name);
  const platformStr =
    platformLabel(data.platformValue) + (data.platformOther ? ' — ' + data.platformOther : '');
  const body = [
    t('form.mail.greeting'),
    '',
    t('form.mail.intro'),
    '',
    `${t('form.mail.platform')}: ${platformStr}`,
    `${t('form.mail.sector')}: ${t(data.sectorKey)}`,
    `${t('form.mail.position')}: ${data.position || '-'}`,
    `${t('form.mail.name')}: ${data.name}`,
    `${t('form.mail.source')}: ${t(data.sourceKey)}`,
    '',
    t('form.mail.footer')
  ].join(nl);
  const mailto = `mailto:${MAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailto };
}

function renderFallback(panel, preview) {
  if (!lastData) return;
  const { subject, body } = composeMail(lastData);
  preview.value = `To: ${MAIL_TO}\nSubject: ${subject}\n\n${body.replace(/\r\n/g, '\n')}`;
  panel.hidden = false;
}

export function initForm() {
  const form = document.getElementById('demo-form');
  if (!form) return;

  const card = document.getElementById('form-card');
  const panel = document.getElementById('mail-fallback');
  const preview = document.getElementById('mail-preview');
  const copyBtn = document.getElementById('copy-mail');
  const otherInput = document.getElementById('platformOther');
  const sector = document.getElementById('sector');
  const nameInput = document.getElementById('name');
  const position = document.getElementById('position');
  const source = document.getElementById('source');
  const errPlatform = document.getElementById('err-platform');
  const errPlatformOther = document.getElementById('err-platformOther');
  const errSector = document.getElementById('err-sector');
  const errName = document.getElementById('err-name');
  const errSource = document.getElementById('err-source');

  const radios = Array.from(form.querySelectorAll('input[name="platform"]'));

  // "Diğer / Other" reveals its required text input.
  radios.forEach((r) => {
    r.addEventListener('change', () => {
      const isOther = form.platform.value === '__other';
      otherInput.hidden = !isOther;
      if (isOther) otherInput.focus();
      else clearError(otherInput, errPlatformOther);
      radios.forEach((x) => x.removeAttribute('aria-invalid'));
      clearError(null, errPlatform);
    });
  });

  // Clear inline errors as the user fixes fields.
  otherInput.addEventListener('input', () => clearError(otherInput, errPlatformOther));
  sector.addEventListener('change', () => clearError(sector, errSector));
  nameInput.addEventListener('input', () => clearError(nameInput, errName));
  source.addEventListener('change', () => clearError(source, errSource));

  const sentPanel = document.getElementById('mail-sent');

  // POST to the configured endpoint; resolves true only on a confirmed success.
  // The underscore fields are FormSubmit extras (subject line, table layout,
  // honeypot, no-captcha); a custom backend simply ignores them.
  async function postToEndpoint(data) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const { subject } = composeMail(data);
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          platform: platformLabel(data.platformValue),
          platformOther: data.platformOther,
          sector: t(data.sectorKey),
          position: data.position,
          name: data.name,
          source: t(data.sourceKey),
          locale: getLocale(),
          website: form.website ? form.website.value : '', // honeypot
          _subject: subject,
          _template: 'table',
          _captcha: 'false',
          _honey: form.website ? form.website.value : ''
        })
      });
      if (!res.ok) return false;
      // FormSubmit answers { success: "true"|"false" }; other backends may not.
      const body = await res.json().catch(() => null);
      if (body && 'success' in body) return String(body.success) === 'true';
      return true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let firstInvalid = null;
    const invalid = (control) => {
      if (!firstInvalid) firstInvalid = control;
    };

    // 1) platform (radio group, required)
    const platformValue = form.platform.value;
    if (!platformValue) {
      radios.forEach((r) => r.setAttribute('aria-invalid', 'true'));
      showError(null, errPlatform, 'form.err.required');
      invalid(radios[0]);
    } else {
      clearError(null, errPlatform);
    }

    // 1b) platformOther required when "Diğer" is selected
    let otherVal = '';
    if (platformValue === '__other') {
      otherVal = otherInput.value.trim();
      if (!otherVal) {
        showError(otherInput, errPlatformOther, 'form.err.platformOther');
        invalid(otherInput);
      } else {
        clearError(otherInput, errPlatformOther);
      }
    }

    // 2) sector (required)
    if (!sector.value) {
      showError(sector, errSector, 'form.err.required');
      invalid(sector);
    } else {
      clearError(sector, errSector);
    }

    // 4) name (required, min 3 chars)
    const nameVal = nameInput.value.trim();
    if (!nameVal) {
      showError(nameInput, errName, 'form.err.required');
      invalid(nameInput);
    } else if (nameVal.length < 3) {
      showError(nameInput, errName, 'form.err.name');
      invalid(nameInput);
    } else {
      clearError(nameInput, errName);
    }

    // 5) source (required)
    if (!source.value) {
      showError(source, errSource, 'form.err.required');
      invalid(source);
    } else {
      clearError(source, errSource);
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    lastData = {
      platformValue,
      platformOther: otherVal,
      sectorKey: 'form.sector.o' + sector.value.slice(1),
      position: position.value.trim(),
      name: nameVal,
      sourceKey: 'form.source.o' + source.value.slice(1)
    };

    // Brief teal "sent" pulse on the card border.
    if (card) {
      card.classList.remove('is-sent');
      void card.offsetWidth; // restart the CSS animation
      card.classList.add('is-sent');
    }

    // Server mode: POST first; only fall back to mailto when it fails.
    if (FORM_ENDPOINT) {
      const ok = await postToEndpoint(lastData);
      if (ok) {
        if (sentPanel) sentPanel.hidden = false;
        panel.hidden = true;
        return;
      }
    }

    // Mailto mode: reveal the copy fallback, then hand off to the mail client.
    if (sentPanel) sentPanel.hidden = true;
    renderFallback(panel, preview);

    const { mailto } = composeMail(lastData);
    window.location.href = mailto;
  });

  // Copy button: Clipboard API with execCommand fallback.
  let copyTimer = null;
  copyBtn.addEventListener('click', async () => {
    const text = preview.value;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        preview.removeAttribute('readonly');
        preview.select();
        preview.setSelectionRange(0, text.length);
        ok = document.execCommand('copy');
        preview.setAttribute('readonly', '');
        window.getSelection()?.removeAllRanges();
      } catch {
        ok = false;
      }
    }
    if (ok) {
      copyBtn.textContent = t('form.fallback.copied');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyBtn.textContent = t('form.fallback.copy');
      }, 2000);
    }
  });

  // Locale switch: refresh visible errors + re-render the open fallback panel.
  onLocaleChange(() => {
    [errPlatform, errPlatformOther, errSector, errName, errSource].forEach((errEl) => {
      if (errEl.dataset.errKey && !errEl.hidden) errEl.textContent = t(errEl.dataset.errKey);
    });
    if (!panel.hidden) renderFallback(panel, preview);
  });
}
