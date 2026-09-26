# FF Grid

The FF Dev Studio portfolio as an infinite, draggable WebGL work grid seen through a barrel lens —
FF Dev Studio's own work, words and identity.

- **Stack:** Vite (static SPA) · three.js · GSAP · vanilla JS/CSS — no framework
- **Routes:** `/` work grid (+ list view, filters) · `/projects/:slug` ×14 · `/about` · `/about/approach` · `/pricing` · `/contact` (overlay) · 404
- **Brand:** `//FF` mark, Instrument Sans, Ink / Bone / Graphite with Signal Lime as a sparse accent — from the FF brand kit

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3175
npm run build      # → dist/: vite build + per-route prerender, sitemap, robots, llms.txt
npm run preview    # serve dist/ on :3176
```

Requires Node 20+. WebGL2 is required for the grid; browsers without it are sent straight to the list view.

## What's on the site

| Surface | What it does |
|---|---|
| **Work grid** (`/`) | 11×11 wrapping plane of project tiles; drag with inertia, press to zoom out, hover to light a tile, click to open. Arrow keys pan, **Tab** walks tiles centre-out, **Enter** opens. Trackpad / wheel pans. Pointer parallax. Barrel lens + vignette. |
| **List view** | Toggle bottom-left. Every project grouped by year with zone / feature pills and client. |
| **Filter** | Bottom-right. Zone (single), Feature, Stack, Client (multi, AND across groups). Drives grid and list together; state lives in the URL, e.g. `/?zone=study&feature=webgl&view=list`. |
| **Project pages** | Giant title, zone/year, live link, cover, statement, about, facts (client / type / role / reference), screens, features + stack, three related projects. |
| **About** | Studio tab (hero, zones, clients strip with each brand's own logo, the studio, the team) and Approach tab (nine-step process, what every build includes). |
| **Pricing** | The three estimating bands as panels, managed-care plans as rows and terms, laid out on About's row system. Transcribed from FF's `SERVICE_ARCHITECTURE.md`, never invented. |
| **Contact** | Overlay from "Let's Talk" or `/contact`. A 7-question brief form; on completion the visitor sends it themselves by **email or WhatsApp** (pre-filled). The site has no backend and sends nothing on its own. |
| **Header** | Mark, sound toggle (off by default), studio line, Kuala Lumpur clock + the visitor's own time, Let's Talk. |

## Project layout

```
index.html            shell: header, bottom nav, list view, filter panel, contact + loader containers
src/
  main.js             router (History API), list view, filter + URL sync, contact overlay/form, clocks, boot
  grid.js             WorkGrid — the WebGL engine (atlases, shaders, input, lens pass)
  pages.js            HTML templates: project, about, pricing, 404, home SEO block
  seo.js              per-route title, meta, canonical, share cards, JSON-LD (prerender + router)
  data.js             the content model: projects, zones, filters, pricing, contact
  sound.js            Web Audio UI sounds (lazy-loaded on first enable)
  style.css           tokens + every component, desktop and phone
public/
  media/<slug>/       tile.jpg (grid) + s-*.webp (project page, from tools/shots.mjs) per project
  fonts/              Instrument Sans (variable, subset) + DM Mono — both SIL OFL
  sounds/             UI sounds
  ff-*.svg, og.jpg    brand marks, favicon, social image; logo.png + touch icons + site.webmanifest
  brand/              client logos for the About strip (kit files + rendered lockups)
  _headers            Cloudflare Pages cache + security headers
tools/                verification instruments (Playwright captures + in-page GPU probes); seo-assets.mjs
                      (share cards, icons) and client-logos.mjs (About strip lockups)
scripts/prerender.mjs static HTML per route + sitemap.xml, robots.txt, llms.txt (runs in npm run build)
scripts/deploy.sh     Cloudflare Pages direct upload
docs/                 architecture, content guide, SEO, verification, QA log
```

## Documentation

| Doc | For |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the grid engine, router, overlays and styling fit together; every tuned constant and why |
| [docs/CONTENT.md](docs/CONTENT.md) | Adding or editing a project, pricing, copy, filters, sounds |
| [docs/SEO.md](docs/SEO.md) | Prerendered routes, meta and JSON-LD per route, URLs and status codes, sitemap, what to redo when content changes |
| [docs/VERIFICATION.md](docs/VERIFICATION.md) | The instruments in `tools/`, how to run them, and the recorded results |
| [docs/qa-log.md](docs/qa-log.md) | What was checked, how, and what it caught |

## Deploy

Static output, one HTML file per route (`about.html` is served at `/about`, and so on); unknown paths get `404.html` with a 404 status. Cloudflare Pages does this natively; on another host, map clean URLs to `.html` files. Set `VITE_SITE_URL` if the site moves off ff-phantom.pages.dev — see [docs/SEO.md](docs/SEO.md).

```bash
npm run deploy                      # Cloudflare Pages project "ff-phantom", production
FF_BRANCH=preview npm run deploy    # preview alias, production untouched
```

`scripts/deploy.sh` reads `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from `~/Desktop/dev/ffdevstudio/.env`
(override with `FF_ENV=/path/.env`). Pushing to GitHub deploys nothing — push and deploy are separate acts.

## Accessibility & motion

- Every project is also a real link: a screen-reader list sits behind the canvas, and the list view is a full alternative.
- The grid is focusable (`role="application"`); Tab moves tile to tile with a live-region announcement.
- `prefers-reduced-motion` removes tweens, inertia animation and entrance animations; content never depends on an animation to become visible.
- Focus is visible everywhere (Signal Lime ring); the contact overlay traps focus and Escape closes it.

## Credits

- **Fonts:** [Instrument Sans](https://github.com/Instrument/instrument-sans) (SIL OFL 1.1, licence in `public/fonts/`), [DM Mono](https://fonts.google.com/specimen/DM+Mono) (SIL OFL 1.1).
- **Work, copy, imagery, brand:** FF Dev Studio — [ffdev.studio](https://ffdev.studio) · hello@ffdev.studio
