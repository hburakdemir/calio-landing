// Site-wide deploy configuration — the only file to touch before publishing.

// Canonical origin used for hreflang/canonical/sitemap/OG tags at build time.
// TODO: replace with your real domain before the first public deploy.
export const SITE_URL = 'https://calio.example.com';

// Lead-form endpoint. The form POSTs JSON here and shows the "request received"
// panel on success; on failure/timeout it falls back to composing a mailto.
//
// Default: FormSubmit's AJAX relay — it emails the submission straight to
// burakd279@gmail.com with no signup. ONE-TIME SETUP: the very first submission
// triggers an activation email from formsubmit.co to that inbox; click
// "Activate" once and every later submission is delivered directly.
// Replace with your own backend endpoint later (see docs/SPRINT-CALIO-GROWTH.md
// Phase 2); payload: { platform, platformOther, sector, position, name, source,
// locale, website } — `website` is a honeypot, reject when non-empty.
// Set to '' to return to pure mailto mode (no external requests).
export const FORM_ENDPOINT = 'https://formsubmit.co/ajax/burakd279@gmail.com';
