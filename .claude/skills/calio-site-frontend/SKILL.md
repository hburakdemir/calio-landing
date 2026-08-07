---
name: calio-site-frontend
description: This skill should be used when the user asks to "add a page", "add a landing page", "edit the homepage", "add a JSON-LD block", "update the sitemap", or otherwise touches this repo (calio.space marketing site) directly. Quick-reference for the no-templating static-HTML architecture, the Vite build/postbuild pipeline, and the page-creation checklist.
version: 1.0.0
---

Use this as a fast lookup before editing anything in this repo. It is the static marketing site for **calio.space** — a separate project from the Calio product itself (that's the `kanban` repo). Deployed by building locally and copying `dist/` to `oracle-server:/home/ubuntu/calio-site/dist/` (nginx serves it directly); there is **no CI/CD auto-deploy** on push, and the server has no git checkout — it's a plain file drop.

## No templating — this is the #1 thing to internalize

There is **no React/Vue/Astro, no partials, no `<template>` includes, no component system**. Every page (`index.html`, `kvkk.html`, `jira-alternatifi.html`, etc.) is a complete, independent, hand-written HTML document. Shared look comes only from importing the same CSS files — header/footer markup is **copy-pasted** across pages, not componentized. If you're looking for "where's the shared header component," there isn't one.

## Adding a new page — full checklist (miss any step and it silently doesn't ship)

1. Create `<page-name>.html` at repo root (flat, no subdirectory — matches `kvkk.html`/`jira-alternatifi.html` precedent).
2. **`vite.config.js`** → add the page to `build.rollupOptions.input`. Vite will not build a page into `dist/` if it's missing here, even though the source `.html` file exists and `npm run dev` may still serve it locally — this is the most common way a new page silently fails to ship.
3. Give the page a JS entry (`<script type="module" src="/src/....js">`):
   - **Content/landing pages** (comparison pages, Q&A, anything like the 4 SEO pages) → reuse `src/landing.js`, which imports `tokens.css` + `base.css` + `components.css` + `legal.css` + `landing.css`.
   - **Legal/document pages** → follow `src/kvkk.js`'s pattern instead.
   - **The actual homepage** → `src/main.js` (nav scroll/theme/lang-toggle/three-hero — don't reuse this for a content page, it's homepage-specific).
4. Copy the inline theme-flash-prevention `<script>` from `index.html`'s `<head>` (near the top) into the new page's `<head>` verbatim — skip it and the page flashes the wrong theme on load, since `tokens.css`'s dark/light split relies on `data-theme` being set before first paint.
5. **`scripts/postbuild-en.mjs`** — this script is **hand-coded per page name**, there is no generic "for every other page" loop:
   - Add a canonical-tag injection block for the new page, following the existing `kvkk.html` pattern in the script.
   - Append the new page's path to the `urls` array that generates `dist/sitemap.xml`.
   - Do **not** give a new content page an `/en/` clone unless explicitly asked — only `index.html` gets full EN translation (and that EN-generation logic is itself index.html-specific regex, not reusable as-is).
6. Add cross-links by hand: `index.html`'s nav (`<header class="nav" id="site-nav">`) and footer (`<footer class="footer">`) need explicit new `<a>` entries — nothing auto-links. Keep new nav entries **outside** `.nav-links` if they point to a different page/URL rather than an in-page `#anchor` — `src/js/nav.js`'s active-link highlighter does `querySelector(link.getAttribute('href'))` on every `.nav-links a`, which errors on a real cross-page URL.
7. New pages should also cross-link to each other (internal link equity), not just back to `/`.
8. Mark large content pages `linguist-documentation` in `.gitattributes` so GitHub's language bar reflects the JS/CSS build, not prose volume — follow the existing entries there as the pattern.

## CSS — plain vanilla, no framework

No Tailwind, no PostCSS, no CSS-in-JS. Layered plain CSS imported as ES modules from each page's JS entry:
- `src/styles/tokens.css` — CSS custom properties (`--bg-0`, `--teal-400`, `--cta`, `--text-1/2/3`, `--space-*`, `--fs-*`, `--radius-*`, `--container: 1200px`), plus the `:root[data-theme="light"]` override block.
- `src/styles/base.css`, `components.css` (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-lg`) — reuse these classes, don't invent new button styles.
- `src/styles/sections.css` — homepage section layout.
- `src/styles/legal.css` — `kvkk.html`'s `.legal-page`/`.legal-doc` layout.
- `src/styles/landing.css` — shared by the 4 SEO content pages (comparison tables, callouts, Q&A spacing, related-pages grid).

## JSON-LD conventions

- Homepage carries `Organization` + `WebSite` + `SoftwareApplication` under a shared `@graph`, with stable `@id`s like `https://calio.space/#organization` — new pages' schema should reference these same `@id`s rather than redeclaring the org.
- Content pages get `BreadcrumbList` (Ana Sayfa → this page).
- `/sorular` (Q&A hub) gets `FAQPage`.
- **Never** add `Product` or `Review` schema to a page that discusses competitor products (e.g. `jira-alternatifi.html`) — explicit policy from the growth research, legal/policy risk.

## i18n

`src/i18n/tr.js` / `en.js` are flat dictionaries consumed via `data-i18n="key"` attributes and `src/js/i18n.js` — but this mechanism is **only wired up on `index.html`**. The 4 SEO content pages are hand-written Turkish-only static prose, not i18n-driven; don't try to route their copy through the dictionary.

## GEO / AI-citability rules (apply to any new Q&A or FAQ content)

From the growth research (`docs/growth/05-icerik-geo-sosyal-medya.md` §B.1) — these measurably affect whether LLMs cite a passage:
1. Question as the literal `<h2>`, not a paraphrase; give it a unique `id` so it's individually linkable (`/sorular#self-hosted-nedir`).
2. Answer starts immediately in the first sentence, no throat-clearing.
3. Keep the citable answer to 40–60 words.
4. Repeat the subject noun; never lead with a pronoun (the chunk may be quoted alone, out of context).
5. Concrete numbers/dates ("5 iş günü", "1 Haziran 2024") get cited more than vague claims.
6. No links inside the answer paragraph itself — if a link is warranted, put it on its own line below the `<p>`.
7. Don't open the answer with the brand name — neutral answer first, product mention separately.

## Content/keyword research lives in `docs/growth/`

`00-YOL-HARITASI.md` is the prioritized synthesis of 5 independent research reports (keywords, technical SEO audit, competitor positioning, zero-budget distribution, content/GEO/social). Read it first before writing new copy — it also documents what was **deliberately decided against** (e.g. don't target "açık kaynak", don't build `/asana-alternatifi`, don't widen the "Türkiye'de ilk/tek" claim) so you don't reintroduce a rejected idea.

## Deploying a change

```bash
npm run build                                    # writes dist/, runs postbuild-en.mjs
tar czf - -C dist . | ssh oracle-server \
  "rm -rf /home/ubuntu/calio-site/dist && mkdir -p /home/ubuntu/calio-site/dist && tar xzf - -C /home/ubuntu/calio-site/dist"
```
No rsync on Windows Git Bash — tar-over-ssh is the working substitute. Nginx on oracle-server serves that directory directly; no reload needed for content-only changes.
