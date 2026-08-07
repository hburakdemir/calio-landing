// Post-build SEO pass:
//  1. dist/en/index.html — English variant of the landing page (lang, meta, locale default)
//  2. hreflang + canonical link tags injected into both variants (+ kvkk canonical)
//  3. absolute og:url / og:image
//  4. dist/sitemap.xml + dist/robots.txt
// Runs automatically via `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const dist = path.join(root, 'dist');

const { SITE_URL } = await import(new URL('../src/config.js', import.meta.url));
const en = (await import(new URL('../src/i18n/en.js', import.meta.url))).default;

if (SITE_URL.includes('example')) {
  console.warn(
    `⚠  SITE_URL is still the placeholder (${SITE_URL}). ` +
    'Set your real domain in src/config.js before deploying — hreflang/canonical/sitemap use it.'
  );
}

const indexPath = path.join(dist, 'index.html');
if (!existsSync(indexPath)) {
  console.error('dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const hreflang = (self) => `
    <link rel="canonical" href="${SITE_URL}${self}" />
    <link rel="alternate" hreflang="tr" href="${SITE_URL}/" />
    <link rel="alternate" hreflang="en" href="${SITE_URL}/en/" />
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`;

let tr = readFileSync(indexPath, 'utf8');

// Absolute OG url/image on both variants.
tr = tr
  .replace(/content="\/og\.jpg"/g, `content="${SITE_URL}/og.jpg"`)
  .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE_URL}/"`);

// English variant BEFORE injecting the TR hreflang block.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
let enHtml = tr
  .replace('<html lang="tr"', '<html lang="en"')
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(en['meta.title'])}</title>`)
  .replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${esc(en['meta.desc'])}$2`
  )
  .replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${esc(en['meta.title'])}$2`
  )
  .replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${esc(en['meta.desc'])}$2`
  )
  .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE_URL}/en/"`)
  .replace('</head>', `${hreflang('/en/')}\n    <script>window.__CALIO_LOCALE_DEFAULT='en';</script>\n  </head>`);

tr = tr.replace('</head>', `${hreflang('/')}\n  </head>`);

writeFileSync(indexPath, tr);
mkdirSync(path.join(dist, 'en'), { recursive: true });
writeFileSync(path.join(dist, 'en', 'index.html'), enHtml);

// kvkk.html — canonical only (bilingual single document).
const kvkkPath = path.join(dist, 'kvkk.html');
if (existsSync(kvkkPath)) {
  const kvkk = readFileSync(kvkkPath, 'utf8').replace(
    '</head>',
    `\n    <link rel="canonical" href="${SITE_URL}/kvkk.html" />\n  </head>`
  );
  writeFileSync(kvkkPath, kvkk);
}

// SEO landing/hub pages — canonical only, no hreflang/EN clone (same
// treatment as kvkk.html, not the same treatment as index.html).
const landingPages = [
  'jira-alternatifi.html',
  'kvkk-uyumlu-proje-yonetimi.html',
  'self-hosted-proje-yonetimi.html',
  'sorular.html',
  'trello-alternatifi.html',
  'azure-devops-alternatifi.html',
  'notion-alternatifi.html',
  'asana-karsilastirma.html',
  'en-iyi-kanban-araclari.html'
];
for (const file of landingPages) {
  const p = path.join(dist, file);
  if (existsSync(p)) {
    const html = readFileSync(p, 'utf8').replace(
      '</head>',
      `\n    <link rel="canonical" href="${SITE_URL}/${file}" />\n  </head>`
    );
    writeFileSync(p, html);
  }
}

const today = new Date().toISOString().slice(0, 10);
const urls = [
  '/',
  '/en/',
  '/kvkk.html',
  '/jira-alternatifi.html',
  '/kvkk-uyumlu-proje-yonetimi.html',
  '/self-hosted-proje-yonetimi.html',
  '/sorular.html',
  '/trello-alternatifi.html',
  '/azure-devops-alternatifi.html',
  '/notion-alternatifi.html',
  '/asana-karsilastirma.html',
  '/en-iyi-kanban-araclari.html'
];
writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n') +
    '\n</urlset>\n'
);
writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

console.log('postbuild-en: dist/en/index.html, hreflang/canonical, sitemap.xml, robots.txt ✓');
