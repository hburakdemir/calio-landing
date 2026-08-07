// Post-build SEO pass:
//  1. dist/en/index.html — English variant of the landing page (lang, meta, locale default)
//  2. hreflang + canonical link tags injected into both variants (+ kvkk canonical)
//  3. absolute og:url / og:image
//  4. dist/sitemap.xml + dist/robots.txt
// Runs automatically via `npm run build`.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, renameSync, rmdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const dist = path.join(root, 'dist');

// Source pages live under sayfalar/ (repo tidiness) but must be served at
// the flat site root — URLs already indexed/submitted to Google must not
// change. Vite mirrors source path into dist/, so flatten it back here
// before any of the canonical/sitemap logic below runs.
const distSayfalar = path.join(dist, 'sayfalar');
if (existsSync(distSayfalar)) {
  for (const file of readdirSync(distSayfalar)) {
    renameSync(path.join(distSayfalar, file), path.join(dist, file));
  }
  rmdirSync(distSayfalar);
}

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

const enSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://calio.space/#organization',
      name: 'Calio',
      url: 'https://calio.space/',
      logo: { '@type': 'ImageObject', url: 'https://calio.space/og.jpg', width: 1200, height: 630 },
      email: 'burakd279@gmail.com',
      foundingDate: '2026',
      areaServed: { '@type': 'Country', name: 'Turkey' },
      knowsLanguage: ['tr', 'en'],
      description: 'Calio is a self-hosted project management platform where your data stays on your own server.',
      sameAs: ['https://www.linkedin.com/company/caliospace'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: 'burakd279@gmail.com',
        availableLanguage: ['Turkish', 'English']
      }
    },
    {
      '@type': 'WebSite',
      '@id': 'https://calio.space/en/#website',
      url: 'https://calio.space/en/',
      name: 'Calio',
      description: 'Self-hosted project management platform.',
      publisher: { '@id': 'https://calio.space/#organization' },
      inLanguage: 'en'
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://calio.space/en/#software',
      name: 'Calio',
      url: 'https://calio.space/en/',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Project Management Software',
      operatingSystem: 'Windows, Linux, Web',
      softwareVersion: '1.0',
      inLanguage: ['tr', 'en'],
      publisher: { '@id': 'https://calio.space/#organization' },
      screenshot: [
        'https://calio.space/shots/04-board-kanban-dark-1600.webp',
        'https://calio.space/shots/02-dashboard-dark-1600.webp',
        'https://calio.space/shots/08-chat-dark-1600.webp',
        'https://calio.space/shots/05-calendar-dark-1600.webp'
      ],
      description:
        "Self-hosted project management platform combining kanban boards, team chat, voice and video calls, calendar and an immutable audit log in one app. One-click import from Jira, Trello, Azure DevOps and Notion.",
      featureList: [
        'Real-time kanban boards',
        'Channel, group and direct team chat',
        'Voice and video calls',
        'Calendar and automatic reminders',
        'Immutable audit log',
        'Roles and granular permissions (RBAC)',
        'Import from Jira, Trello, Azure DevOps and Notion',
        'Windows and Linux desktop app',
        'Docker and npm installation'
      ],
      installUrl: 'https://calio.space/en/',
      isAccessibleForFree: false
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://calio.space/en/#faq',
      inLanguage: 'en',
      isPartOf: { '@id': 'https://calio.space/en/#website' },
      mainEntity: [
        { '@type': 'Question', name: 'What do I need to install it?', acceptedAnswer: { '@type': 'Answer', text: "An always-on Windows computer or server is enough — no Windows Server edition required. The Calio Server setup wizard installs everything including the database; no Docker or DevOps knowledge needed. How it runs is up to you: install it as a Windows service, start it manually from the app, or have it start on its own when the computer turns on. Your team connects via the Windows/macOS desktop app or the browser — it even runs on localhost; a domain is never required." } },
        { '@type': 'Question', name: 'Is our data really ours?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The app and database run on your own server. Back up any time, export any time — since the data is already yours, "what happens to my data if I quit?" stops being a question.' } },
        { '@type': 'Question', name: 'How long does migrating from Jira/Trello take?', acceptedAnswer: { '@type': 'Answer', text: "Connect with your API key, pick your project; hundreds of cards transfer in minutes. Comments, attachments and assignments don't transfer in this version." } },
        { '@type': 'Question', name: 'Will my team actually adopt it?', acceptedAnswer: { '@type': 'Answer', text: 'Anyone who can use Trello learns Calio in five minutes. The UI is in Turkish and English, and the flow is the familiar kanban layout.' } },
        { '@type': 'Question', name: 'How does support work?', acceptedAnswer: { '@type': 'Answer', text: "Support in Turkish, on Turkey's time zone. Your email lands directly with the developer, not an agent — you get a reply within one business day." } },
        { '@type': 'Question', name: 'Updates and maintenance?', acceptedAnswer: { '@type': 'Answer', text: 'The desktop app updates itself automatically; server updates install in one click. Releases ship regularly.' } },
        { '@type': 'Question', name: 'Can it be purchased with KOSGEB support?', acceptedAnswer: { '@type': 'Answer', text: 'As locally developed software it may qualify under KOSGEB digitalization supports. We clarify the process together during the demo call.' } },
        { '@type': 'Question', name: 'When will pricing be announced?', acceptedAnswer: { '@type': 'Answer', text: 'Very soon, in Turkish lira. Demo requesters will be told the launch price first.' } },
        { '@type': 'Question', name: "If you're a solo developer, what happens if something happens to you?", acceptedAnswer: { '@type': 'Answer', text: "Calio runs on your own server and the database is yours — that means no vendor lock-in risk. Your source code and data depend on your own infrastructure, not on us. As we grow the team, we'll share our continuity plans openly on the demo call." } },
        { '@type': 'Question', name: 'Can my team connect from outside the office?', acceptedAnswer: { '@type': 'Answer', text: "Yes. If you publish your server on an IP on your company network or your own domain, your team connects from home, the field, or on the road over a normal internet connection — a VPN isn't required, though you can layer one on for extra security if you like." } },
        { '@type': 'Question', name: 'Does it work from a phone?', acceptedAnswer: { '@type': 'Answer', text: "Yes, you can log in and view your boards, chat and calendar from a phone or tablet browser. There's no separate mobile app yet; the drag-and-drop board experience is designed to feel best on tablet and desktop." } },
        { '@type': 'Question', name: 'Who is it not right for?', acceptedAnswer: { '@type': 'Answer', text: "If your team is 200+ people, or you don't have anyone to manage a server, Calio may not be the right fit today — we'll talk about that honestly on the demo call." } }
      ]
    }
  ]
};

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
  .replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${esc(en['meta.title'])}$2`
  )
  .replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${esc(en['meta.desc'])}$2`
  )
  .replace('<meta property="og:locale" content="tr_TR" />', '<meta property="og:locale" content="en_US" />')
  .replace('<meta property="og:locale:alternate" content="en_US" />', '<meta property="og:locale:alternate" content="tr_TR" />')
  .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${SITE_URL}/en/"`)
  .replace(
    /<script type="application\/ld\+json" id="calio-schema">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="calio-schema">\n${JSON.stringify(enSchema, null, 2)}\n</script>`
  )
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
// treatment as kvkk.html, not the same treatment as index.html). Source
// files live in sayfalar/ but are flattened to the site root above, so
// URLs stay exactly what's already indexed/submitted to Google.
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
// kvkk.html is intentionally noindex (bilingual legal doc, not a landing
// page) — keeping it out of the sitemap avoids the "Submitted URL marked
// 'noindex'" warning in Search Console.
const urls = [
  '/',
  '/en/',
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
