// Runs after `vite build`: writes one static HTML file per route, each with its own title, meta,
// canonical, share card and JSON-LD (src/seo.js) and the page's own markup already inside <main>
// (src/pages.js) — so crawlers and link previews get the real page without running the app. The
// app then boots on top and re-renders the same markup.
//
// Output uses Cloudflare Pages' pretty URLs: about.html is served at /about, projects/x.html at
// /projects/x. Unknown paths get 404.html with a real 404 status (no SPA catch-all).
// Also writes sitemap.xml, robots.txt and llms.txt.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';

const DIST = new URL('../dist/', import.meta.url).pathname;
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const pages = await vite.ssrLoadModule('/src/pages.js');
const { seoFor, headTags, SITE_URL } = await vite.ssrLoadModule('/src/seo.js');
const { PROJECTS, ZONES, PRICING, CONTACT, FAQ } = await vite.ssrLoadModule('/src/data.js');
await vite.close();

const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// sitemap lastmod: the date the files behind a route last changed (uncommitted edits count as today),
// not the build date — engines learn to ignore a lastmod that moves on every deploy
const today = new Date().toISOString().slice(0, 10);
const changed = (paths) => {
  try {
    const q = paths.map((x) => `'${x}'`).join(' ');
    if (execSync(`git status --porcelain -- ${q}`, { encoding: 'utf8' }).trim()) return today;
    return execSync(`git log -1 --format=%cs -- ${q}`, { encoding: 'utf8' }).trim() || today;
  } catch { return today; }
};

const ROUTES = [
  { file: 'index.html', route: { name: 'home' }, page: pages.homeSeo() },
  ...PROJECTS.map((p) => ({ file: `projects/${p.slug}.html`, route: { name: 'project', slug: p.slug }, page: pages.project(p.slug) })),
  { file: 'about.html', route: { name: 'about', tab: 'studio' }, page: pages.about('studio') },
  { file: 'about/approach.html', route: { name: 'about', tab: 'approach' }, page: pages.about('approach') },
  { file: 'pricing.html', route: { name: 'pricing' }, page: pages.pricing() },
  { file: 'faq.html', route: { name: 'faq' }, page: pages.faq() },
  { file: 'privacy.html', route: { name: 'privacy' }, page: pages.privacy() },
  { file: 'cookies.html', route: { name: 'cookies' }, page: pages.cookies() },
  { file: 'contact.html', route: { name: 'contact' }, page: pages.contactSeo() },
  { file: '404.html', route: { name: '404' }, page: pages.notFound() },
];

function fill(html, { route, page }) {
  const s = seoFor(route);
  const name = route.name === 'contact' ? 'home' : route.name;
  const theme = page.theme === 'light' ? '#f3efe4' : name === 'about' ? '#242421' : '#000000';
  const swap = (h, a, b) => { if (!h.includes(a)) throw new Error(`prerender: shell is missing ${a.slice(0, 40)}`); return h.replace(a, b); };
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(s.title)}</title>`);
  html = html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, headTags(s));
  html = html.replace(/<meta name="theme-color" content="[^"]*"/, `<meta name="theme-color" content="${theme}"`);
  html = swap(html, '<body data-route="home">', `<body data-route="${name}" data-theme="${page.theme}">`);
  html = swap(html, '<main id="page" class="page" tabindex="-1"></main>', `<main id="page" class="page" tabindex="-1">${page.html}</main>`);
  if (page.client && page.client !== 'FF Dev Studio') html = html.replace('<span class="logo-client mono" aria-hidden="true"></span>', `<span class="logo-client mono" aria-hidden="true">${esc(page.client)}</span>`);
  return html;
}

for (const r of ROUTES) {
  const out = join(DIST, r.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, fill(shell, r));
}

// sitemap: every indexable route; images are the pages' own captures
const indexable = ROUTES.filter((r) => r.route.name !== '404');
const urlFor = (r) => SITE_URL + seoFor(r.route).path;
const SOURCES = { home: ['src/data.js'], project: ['src/data.js', 'src/shots.json'], about: ['src/pages.js'], pricing: ['src/pages.js', 'src/data.js'], faq: ['src/data.js'], privacy: ['src/legal.js'], cookies: ['src/legal.js'], contact: ['src/pages.js'] };
const lastmodFor = (r) => changed([...SOURCES[r.route.name], ...(r.route.name === 'project' ? [`public/media/${r.route.slug}`] : [])]);
const imagesFor = (r) => {
  if (r.route.name !== 'project') return [];
  return [...r.page.html.matchAll(/<img src="([^"]+)"[^>]*alt="([^"]*)"/g)].map(([, src]) => src.replace(/-sm\.webp$/, '.webp')).filter((src) => src.startsWith(`/media/${r.route.slug}/`));
};
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${indexable.map((r) => `  <url>
    <loc>${urlFor(r)}</loc>
    <lastmod>${lastmodFor(r)}</lastmod>${imagesFor(r).map((src) => `
    <image:image><image:loc>${SITE_URL}${src}</image:loc></image:image>`).join('')}
  </url>`).join('\n')}
</urlset>
`);

writeFileSync(join(DIST, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);

// llms.txt (llmstxt.org): a plain summary for AI assistants and answer engines
writeFileSync(join(DIST, 'llms.txt'), `# FF Dev Studio

> FF Dev Studio (registered as ${CONTACT.legalName}, ${CONTACT.regNo}) designs and builds custom websites for founders and small companies across Malaysia. A studio in Kuala Lumpur where the person who scopes your site is the person who builds it. Projects start from RM1,000.

This site is an index of FF Dev Studio's work, shown as a draggable WebGL grid.

## Pages

- [Work](${SITE_URL}/): every project, as a grid or a list, filterable by zone, feature, stack and client
- [About — Studio](${SITE_URL}/about): who the studio is, its three zones of work and its clients
- [About — Approach](${SITE_URL}/about/approach): the nine-step process and what every build includes
- [Pricing](${SITE_URL}/pricing): estimating bands and care plans
- [Questions](${SITE_URL}/faq): cost, timing, what is included, ownership, languages, hosting and what happens after launch
- [Privacy](${SITE_URL}/privacy): what the site collects and your rights under Malaysia's PDPA 2010
- [Cookies](${SITE_URL}/cookies): browser storage, analytics only with consent
- [Contact](${SITE_URL}/contact): a seven-question brief, sent by email or WhatsApp

## Work

${PROJECTS.map((p) => `- [${p.title}](${SITE_URL}/projects/${p.slug}): ${p.type} (${ZONES[p.zone].name}, ${p.year}). ${p.statement}${p.client !== 'FF Dev Studio' ? ` Client: ${p.client}.` : ''} Live: ${p.url}`).join('\n')}

## Pricing

${PRICING.bands.map((b) => `- ${b.name}: ${b.range}, ${b.days}. ${b.line}`).join('\n')}
${PRICING.care.map((c) => `- ${c.name} care plan: ${c.price} (${c.year}). ${c.line}`).join('\n')}
- Terms: ${PRICING.terms}

## Questions

${FAQ.map((f) => `### ${f.q}\n\n${[...f.a, ...(f.list ? f.list.map((x) => `- ${x}`) : []), ...(f.after ? [f.after] : [])].join('\n')}`).join('\n\n')}

## Contact

- Email: ${CONTACT.email}
- WhatsApp: ${CONTACT.whatsapp} (${CONTACT.wa})
- Location: Kuala Lumpur, Malaysia
- Registered business: ${CONTACT.legalName} (SSM ${CONTACT.regNo})
`);

// _redirects: the previous ffdev.studio served each project at /<slug>; send those to /projects/<slug>
writeFileSync(join(DIST, '_redirects'), PROJECTS.map((p) => `/${p.slug} /projects/${p.slug} 301`).join('\n') + '\n');

console.log(`prerender: ${ROUTES.length} routes, sitemap (${indexable.length} URLs), robots.txt, llms.txt → dist/`);
