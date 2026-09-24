# Editing content

All content lives in **`src/data.js`**. The grid, list view, filters, project pages and related-work
links are generated from it — there is nothing else to update.

## Add a project

1. **Images** — create `public/media/<slug>/`:
   - `tile.jpg` — the grid image. Any aspect; it is centre-cropped to a square. ≥ 1200 px on the short side is plenty. Keep the subject away from the outer ~4 % (the edge gutter is not shown).
   - `w-0.jpg … w-N.jpg` — project screens, 16:9, ~1600×900. `w-0` is the cover; the rest are the gallery.
2. **Entry** — append to `PROJECTS`:

```js
{
  slug: 'my-project',                 // URL: /projects/my-project — must match the media folder
  title: 'My Project',
  client: 'Client Name',              // 'FF Dev Studio' shows the //FF mark on the tile instead of a name
  zone: 'client',                     // 'client' | 'product' | 'study'  (see ZONES)
  year: 2026,                         // list view groups by year, newest first
  features: ['website', 'motion'],    // first two appear as pills on the tile; first three in the list
  stack: ['next', 'gsap'],            // keys of STACK_LABEL
  url: 'https://example.com/',        // "See it live"
  type: 'Company website',
  role: 'Design / Frontend',
  reference: 'somesite.com',          // optional — only for studies/recreations
  statement: 'One sentence that says what it is.',
  about: ['Paragraph one.', 'Paragraph two.'],
  shots: 6,                           // how many w-N.jpg files exist
},
```

Filters pick up new features, stack items and clients automatically. Labels are title-cased unless
listed in `FEATURE_LABEL` / `STACK_LABEL` (e.g. `'3d': '3D'`, `next: 'Next.js'`).

The grid atlas is laid out as a square of `ceil(√n)` cells; up to 16 projects fit the current atlas
caps at full resolution, beyond that cells are scaled down automatically.

## Zones

`ZONES` defines the three zones: display name, the one-line "Our focus on –" blurb and the longer line
shown on the About page. Adding a zone means adding an entry here and choosing an image for it in
`ABOUT_ZONES` in `src/pages.js`.

## Pricing

`PRICING` is transcribed from `ffdevstudio/SERVICE_ARCHITECTURE.md`, the source of truth for FF's
prices. Change that document first, then copy the figures here — do not invent tiers, rename plans or
round numbers. Bands render as the three columns on `/pricing`; `care` renders as the plan list.

## Contact details

`CONTACT` holds email, WhatsApp (display + `wa.me` link), city and the time zone used for the header
clock. The contact form's kick-off options and work types are `KICKOFF` and `WORK` in `src/main.js`.

## Page copy

- Header line, loader words, meta tags: `index.html`
- About (Studio + Approach), Pricing, 404, footer, home screen-reader copy: `src/pages.js`
  (`STEPS` and `INCLUDED` mirror the process and inclusions in SERVICE_ARCHITECTURE.md)
- Contact overlay copy: `src/main.js` (`contactHome`, `contactForm`, `contactDone`)

## Sounds

Replace any file in `public/sounds/` keeping the name (`click grid load other project riser swipe
whoosh`). Short, quiet files work best — the grid tick fires on every tile change.

## Brand assets

`public/ff-*.svg` are copied verbatim from `ffdevstudio/brand-system/assets/svg/`. The `//FF` mark
in the header, tiles and footer is the same path data inline. Do not redraw it.
