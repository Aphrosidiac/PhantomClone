# SEO

The site is a single-page app, but every route ships as its own static HTML file with its own head and
its own content. So crawlers, link previews and AI assistants all get the real page without running
any JavaScript. The app then boots on top and re-renders the same markup.

## How it fits together

| Piece | Does |
|---|---|
| `src/seo.js` | `seoFor(route)`: title, description, canonical, robots, Open Graph / Twitter card and a schema.org JSON-LD `@graph` for every route. `headTags()` turns it into tags marked `data-seo`; `applySeo()` swaps them on client navigation. |
| `scripts/prerender.mjs` | Runs after `vite build` (it is part of `npm run build`). Loads `pages.js` and `seo.js` through Vite's SSR loader, fills the built shell once per route and writes `sitemap.xml`, `robots.txt` and `llms.txt`. |
| `index.html` | The shell. `<!--seo-->…<!--/seo-->` marks the region the prerender replaces. `<noscript>` hides the loader and un-dims the split-text reveals. |
| `src/main.js` | Calls `applySeo()` on every route change, including opening and closing the contact overlay. |
| `tools/seo-assets.mjs` | Renders each project's 1200×630 share card (`public/media/<slug>/og.jpg`) and `logo.png`, `apple-touch-icon.png`, `favicon-48.png`. Needs the dev server running. |
| `public/_headers` | Long cache for hashed assets and fonts, a week for media, `nosniff` and a referrer policy. |
| `public/site.webmanifest` | Name, colours and icons. |

The site origin comes from `VITE_SITE_URL` (default `https://ff-phantom.pages.dev`). Canonicals,
`og:url`, `og:image`, the sitemap and JSON-LD ids all derive from it. **Set it when the site moves to
its own domain**, then rebuild:

```bash
VITE_SITE_URL=https://example.com npm run build
```

## URLs and status codes

Output uses Cloudflare Pages' pretty URLs. There is no SPA catch-all any more (`public/_redirects`
was removed), so unknown paths return a real 404.

| Request | Served |
|---|---|
| `/`, `/?zone=…&view=list` | `index.html` (200). The filter and list states canonicalise to `/`. |
| `/projects/<slug>` | `projects/<slug>.html` (200) |
| `/about`, `/about/approach`, `/pricing`, `/contact` | `about.html`, `about/approach.html`, `pricing.html`, `contact.html` (200) |
| `/about/`, `/projects/x/`, `/index.html`, `/about.html` | 308 to the canonical URL, without the trailing slash or `.html` |
| anything else, including an unknown project | `404.html` (404, `noindex, follow`) |

`vite dev` and `vite preview` still fall back to the app for every path, so nothing changes locally.
To see production routing, run `npx wrangler pages dev dist --port 8788` after a build.

## Per route

| Route | Title | Schema |
|---|---|---|
| `/` | FF Dev Studio — Custom websites, designed and built in Malaysia | Organization, Person (founder), WebSite, CollectionPage with an ItemList of all 14 projects |
| `/projects/<slug>` | `<Title> — <type> \| FF Dev Studio`, shortened to fit about 65 characters | ItemPage + BreadcrumbList, CreativeWork (the site itself: live URL, client, year, keywords, and `isBasedOn` for recreations) |
| `/about` | About — one studio in Kuala Lumpur | AboutPage + Person |
| `/about/approach` | Approach — nine steps from brief to launch | WebPage + BreadcrumbList |
| `/pricing` | Website pricing in Malaysia, from RM1,000 | Service with an OfferCatalog: the three bands as min/max `PriceSpecification`, the care plans as monthly `UnitPriceSpecification`. Figures are parsed from `PRICING` and are never typed by hand. |
| `/contact` | Start a project — contact FF Dev Studio | ContactPage. The static page carries its own hidden h1, brief and email/WhatsApp links (`contactSeo()` in `pages.js`); the app opens the overlay on top. |

Project descriptions are the project's `statement` plus type and studio, trimmed to 160 characters
by falling back to shorter forms. Every page has exactly one `<h1>`: on the home page it is visually
hidden behind the canvas, next to a hidden list of links to every project, each with its one-line statement. On `/pricing` the "Pricing"
label is now the `<h1>`, styled exactly as before.

## Checklist when content changes

- **New or renamed project:** nothing to do for titles, meta, sitemap or JSON-LD, since all of it
  derives from `src/data.js`. Run `node tools/seo-assets.mjs` with the dev server up to render its
  share card.
- **Price change:** change `PRICING` (from SERVICE_ARCHITECTURE.md) and also update the hand-written
  pricing description in `seoFor('pricing')`.
- **New route:** add it to `match()` in `main.js`, to `seoFor()`, and to `ROUTES` in `prerender.mjs`.
- **After deploying:** submit `https://<site>/sitemap.xml` in Google Search Console and Bing
  Webmaster Tools. Check a project URL with Google's Rich Results Test.
