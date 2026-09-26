# Build brief — FF Grid (phantom.land recreation)

## Identity
- **Product name:** FF Grid — ffdev.studio portfolio demo, package `ff-phantom`
- **Owner / brand:** FF Dev Studio (`//FF` mark from `ffdevstudio/brand-system`, Instrument Sans, Ink/Bone/Signal Lime)
- **Whose site is the reference?** third party — Phantom Studios (phantom.land)
- **Brand assets supplied?** yes — FF kit on disk, used verbatim
- **Voice:** FF — terse, first person plural-free, "you talk to the person who builds it"

## Reference
- **URL:** https://www.phantom.land (snapshot 2026-09-24, desktop 1440×900 + 390×844)
- **What we want:** the experience — infinite WebGL work grid with lens distortion, list view, filter panel, pill nav, header, loader, project pages, about, careers-style page, contact overlay, sound
- **Access:** public surface only (no login exists)
- **Assets pulled to:** `docs/reference/2026-09-24/` (html, js, css, workgrid atlases, blueprint.json, shots) — **local only, git-ignored**: it is Phantom's code and imagery and is not published with this repo. UI sounds pulled to `public/sounds/` (these ship).

## Fakhrul's instruction (2026-09-24)
"can download any assets. but make the content change to fit FF dev studio and branding for ff dev studio too"
→ **Content is FF's**: the 14 real FF projects (media from ff-portfolio `public/static/media`), FF copy, FF pricing, FF contact.
→ Phantom's UI sounds are reused (download permitted); Phantom's project imagery, logos, mascot and copy are **not** shipped.

## Mode
SITE.

## Scope line
- In: home grid (drag/inertia/keyboard/hover/click, lens + vignette, press zoom), intro loader, grid↔list toggle, list view grouped by year, filter panel (zone / feature / stack / client) wired to both views, header (mark, sound, description, KL + visitor clocks, Let's Talk), bottom pill nav, project pages ×14 with related work, About (Studio / Approach), Pricing (replaces Careers — FF does not hire; the page shape fits bands + care plans), contact overlay with a real brief form that hands off to email/WhatsApp, 404, sound toggle.
- **Not building:** CMS (Prismic) — content is a JS module; server form submission (no backend — form composes an email/WhatsApp message); cookie banner/analytics (we set no cookies); video atlases (FF media is stills); Phantom's particle "dude" mascot (replaced by the //FF mark); Auckland/London studios.
- Parity target: experience parity on the listed surfaces.

## Technical
- Stack: Vite static SPA, three.js (instanced grid + EffectComposer-equivalent lens pass), GSAP. History-API router so the canvas survives route changes, like the reference.
- Hosting: CF Pages direct upload `ff-phantom` on the personal account — **only on Fakhrul's word**.
- Dev: `npm run dev` → :3175

## Safety
- Deploy needs explicit approval; push to GitHub first.
- Form never sends anything itself; it opens the visitor's mail app / WhatsApp.

## Later additions (Fakhrul, 2026-09-26)
- **SEO:** every route is prerendered with its own meta, share card and JSON-LD; sitemap, robots and
  llms.txt; real 404s. See `docs/SEO.md`.
- **Content:** Lewix.ai is written LEWIX AI throughout. FF's own tiles read `//FF <name>`.
- **About:** the clients strip is SmoothSail, Indahnya, Ascend MY and LEWIX, each with its own logo.
  Kit files are used where they exist; see `docs/CONTENT.md`.
- **Pricing:** rebuilt on About's row system. The header stays on one row at 1024–1439 px, and its
  blur works on every page.
- Still deploy only on Fakhrul's word.
