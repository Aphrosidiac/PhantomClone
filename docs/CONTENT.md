# Editing content

All content lives in **`src/data.js`**. The grid, list view, filters, project pages and related-work
links are generated from it — there is nothing else to update.

## Add a project

1. **Images** — create `public/media/<slug>/`:
   - `tile.jpg` — the grid image. Any aspect; it is centre-cropped to a square. ≥ 1200 px on the short side is plenty. Keep the subject away from the outer ~4 % (the edge gutter is not shown).
   - project-page screens are captured, not drawn — see **Project page media** below.
2. **Entry** — append to `PROJECTS`:

```js
{
  slug: 'my-project',                 // URL: /projects/my-project — must match the media folder
  title: 'My Project',
  client: 'Client Name',              // 'FF Dev Studio' shows //FF + the title on the tile (a leading 'FF ' is dropped: //FF Search)
  wordmark: 'Product Name',           // optional — the tile's top-left name instead (an FF product with its own name: Hai Awan)
  zone: 'client',                     // 'client' | 'product' | 'study'  (see ZONES)
  year: 2026,                         // list view groups by year, newest first
  features: ['website', 'motion'],    // first two appear as pills on the tile; first three in the list
  stack: ['next', 'gsap'],            // keys of STACK_LABEL
  url: 'https://example.com/',        // "See it live"
  type: 'Company website',
  role: 'Design / Frontend',
  reference: 'somesite.com',          // optional — only for studies/recreations
  repo: 'https://github.com/…',       // optional — open-source work: adds a "Source code" pill and a Licence fact,
  license: 'MIT', platform: '…',      //   and the page's structured data becomes SoftwareApplication + SoftwareSourceCode
  statement: 'One sentence that says what it is.',
  about: ['Paragraph one.', 'Paragraph two.'],
},
```

**Order matters.** The first project is the grid's centre tile — the first thing a visitor sees — and heads
the list view; the grid then spirals outward in array order. The first entry is the studio's flagship,
**Hai Awan** (`flagship: true`): FF's own open-source product. Its tile is deliberately like every other
tile (the hints are its place and its OPEN SOURCE pill), but anything that shows or promotes a subset of the
work — ads, share images, social posts — starts from it.

Search and AI answers are told the same thing in words, so an answer that wants one example of the work
(Google's AI Overviews picked Big Brain before this) names a flagship. All of it derives from `FLAGSHIPS` and
`FLAGSHIP_LINE` in `src/data.js`, so flagging a project moves every signal:

- the FAQ question "What has FF Dev Studio built?" (visible, and in the FAQPage JSON-LD and llms.txt)
- a `## Flagship` section in llms.txt, ahead of the full work list
- the Organization `description` in every page's JSON-LD
- a line in the home page's crawler text and in About's Product zone
- the first Related work cards on every other project page (an internal link from each)

**Adding another flagship:** set `flagship: true`, move the entry up to sit right after the existing
flagships (the first one stays the grid's centre tile), and give it `flagshipAs` (what it is, read after its
name and address) and `flagshipWhy` (why it is the example to give). The build stops with an error if either
is missing. Nothing else in this repo needs touching; outside it, add it to FFAds' `REC` list and the
flagship memory note. With two or more, the wording switches to plural on its own (tested with a temporary
second flagship).

Filters pick up new features, stack items and clients automatically. Its title, meta, sitemap entry
and JSON-LD come from this entry too; render its share card with `node tools/seo-assets.mjs` (dev
server running) — see `docs/SEO.md`.

 Labels are title-cased unless
listed in `FEATURE_LABEL` / `STACK_LABEL` (e.g. `'3d': '3D'`, `next: 'Next.js'`).

The grid atlas is laid out as a square of `ceil(√n)` cells; up to 16 projects fit the current atlas
caps at full resolution, beyond that cells are scaled down automatically.

## Project page media

Each project page is a cover plus rows, laid out as case studies: full-width
16:9 frames, 2-up frames side by side and 3-up phone screens, each framed on the project's `plate`
colour (in `src/data.js`) — desktop shots in a browser window showing the page's address. Every image is a screenshot of the live
site, captured and encoded by `tools/shots.mjs` from the recipe in `tools/shots.recipes.mjs`:

- a recipe names the site, a viewport (`wide` 1600×900, `mid` 1440×810, `narrow` 1280×720 — pick
  the one that makes the site's own container fill the frame — or `phone` 414×670) and, per shot, how
  to get the page into that state: scroll to a heading, wheel into a pinned section, click a toggle,
  hover a row. Frames are 3200×1800 (phone 1242×2010).
- `cover` and `rows` choose from the shots.
- `alt` is the image's description on the page — write what the frame shows.

```
node tools/shots.mjs ff-frames                       # capture into .shots-raw/ (gitignored)
SHOT='^pricing' node tools/shots.mjs ff-frames       # re-shoot matching ids only
FFMPEG=path/to/ffmpeg node tools/shots.mjs --encode ff-frames   # -> public/media/<slug>/s-*.webp + src/shots.json
```

An ffmpeg without libwebp (Homebrew's) is fine: the encode then writes a PNG and hands it to `cwebp` with
the same settings (`CWEBP=path/to/cwebp` if it is not on PATH).

The encode writes two widths of each (2880/1440 full, 1600/800 pair, 1242/621 phone) and the page
serves them with `srcset`. Wait for what the frame is for: counters that roll, lazy images (the
recipe's `init: EAGER` loads them up front), a 3D stage that fills over a second or two.

## Video tiles

Moving tiles come from one video atlas:
every clip is a 5 s loop at 20 fps, packed 3 across into `public/media/video/atlas.mp4` (1920×1440,
16:9 cells of 640×360) plus a half-size `atlas-phone.mp4`. `src/video-atlas.json` maps each project
slug to its cell; a project without a cell keeps its still `tile.jpg`.

To add or re-cut a clip:

1. Record the site. Either screen-record it in Chrome at 1920×1080 (the crop assumes Chrome's tab strip
   and address bar above the page and a scrollbar on the right — re-measure `CROP` if the window differs),
   or let `node tools/record.mjs <url> <out.mp4> [seconds]` film the page standing still in headless Chrome
   at the same 1904×944 page viewport, with no browser around it (give that clip `crop: 'page'`). Hai Awan's
   loop was made this way. Source footage is archived with Git LFS in the FFAds repo,
   `recordings/desktop/` — put new recordings there too.
2. Add `{ slug, file, at }` to `CLIPS` in `tools/video-atlas.mjs`; `at` is the loop's first frame.
   The loop plays 7.5 s of source at 1.5× (`speed: 1` for an intro that should keep its own pace).
   The wrap dissolves in from the 0.75 s of source just BEFORE `at` (0.5 s at `speed: 1`), so keep a
   page reload or cut out of that lead-in. Pick for tile size (~200 px wide): startup sequences,
   big type, colour and large motion read; scrolling past small text does not.
3. `node tools/video-atlas.mjs` (reads `../FFAds/recordings/desktop` by default; pass another folder as the
   argument, and `FFMPEG=path/to/ffmpeg` if it is not on PATH). The ten older clips rebuild from those archived
   recordings unchanged (PSNR 37–44 dB against the previous atlas, i.e. encoder noise only).
   The manifest's atlas URLs carry a content hash (`atlas.mp4?v=…`): `/media` is cached for a week, at
   Cloudflare's edge too, so a rebuilt atlas at an unchanged URL keeps serving the old cells.

The still `tile.jpg` still matters: it shows until the video's first frame, and for visitors with
reduced motion or data-saver on (`?video=0` forces it, for testing).

## Zones

`ZONES` defines the three zones: display name, the one-line "Our focus on –" blurb and the longer line
shown on the About page. Adding a zone means adding an entry here and choosing an image for it in
`ABOUT_ZONES` in `src/pages.js`.

## Pricing

`PRICING` is transcribed from `ffdevstudio/SERVICE_ARCHITECTURE.md`, the source of truth for FF's
prices. Change that document first, then copy the figures here — do not invent tiers, rename plans or
round numbers. The pricing page's meta description in `src/seo.js` quotes the bands — update it too. Bands render as the three panels on `/pricing`, and each `care` plan renders as one row (name, `line`, monthly and yearly price), so keep each plan's `line` to one sentence.

## Contact details

`CONTACT` holds email, WhatsApp (display + `wa.me` link), city and the time zone used for the header
clock. The contact form's kick-off options and work types are `KICKOFF` and `WORK` in `src/main.js`.

## Page copy

- Page titles, meta descriptions, structured data: `src/seo.js`
- Header line, loader lockup and corner labels: `index.html` (the lockup paths are verbatim brand SVG)
- About (Studio + Approach), Pricing, 404, footer, home screen-reader copy: `src/pages.js`
  (`STEPS` and `INCLUDED` mirror the process and inclusions in SERVICE_ARCHITECTURE.md)
- Contact overlay copy: `src/main.js` (`contactHome`, `contactForm`, `contactDone`)

## Sounds

Sound is disabled for now (`SOUND_AVAILABLE = false` in `src/sound.js` hides the toggle). The files stay.
Replace any file in `public/sounds/` keeping the name (`click grid load other project riser swipe
whoosh`). Short, quiet files work best — the grid tick fires on every tile change.

## Brand assets

`public/ff-*.svg` are copied verbatim from `ffdevstudio/brand-system/assets/svg/`. The `//FF` mark
in the header, tiles and footer is the same path data inline. Do not redraw it.

## About: clients strip

`CLIENTS` in `src/pages.js` lists the four brands and their logos in `public/brand/`, all white-on-dark
for the Graphite ground:

| Brand | File | Source |
|---|---|---|
| SmoothSail | `smoothsail-lockup-on-dark.png` | rendered by `tools/client-logos.mjs` from `SmoothSail/brand/lockup.svg` (Hanken Grotesk 600) |
| Indahnya | `indahnya-lockup-on-dark.png` | rendered by `tools/client-logos.mjs` from Indahnya's `app/ui/components/Logo.vue` (Inter 600) |
| Ascend MY | `ascend-my-primary-on-dark.svg` | `AscPeps/brand/production/Ascend-MY-Brand-Kit/03_LOGOS_FOR_DARK_BACKGROUNDS/Ascend-MY-Primary-On-Dark.svg`, verbatim (kit v1.1) |
| LEWIX | `lewix-wordmark-on-dark.svg` | `LewixWeb4/public/brand/lewix-wordmark.svg` (the vector of `LEWIX/LOGO`'s primary logo), with its letters set to white |

- **Use kit files where one exists.** Never redraw a brand's mark. When a kit is versioned (Ascend),
  copy from its current production folder.
- **SmoothSail and Indahnya** ship no dark-background file, since each repo draws its logo as a mark
  plus live text. `node tools/client-logos.mjs` redraws them from the repo's own mark and font, with
  only the dark ink switched to white. Re-run it if either logo changes.
- **Sizing:** a mark-plus-name lockup gets `kind: 'lockup'` (the third item in its `CLIENTS` entry),
  which renders it taller so its name matches the wordmark-only logos.
- **The line above the strip** ("Research catalogues, store builders, wedding platforms and AI products — each one designed and built here.")
  describes these four. Rewrite it if the list changes.

## Share images and icons

`node tools/seo-assets.mjs` (dev server running) renders each project's share card
`public/media/<slug>/og.jpg` from its cover, plus `logo.png`, `apple-touch-icon.png` and
`favicon-48.png`. Re-run it after adding a project, renaming one or re-capturing a cover. It re-renders every card, and a few come out byte-different
from render noise alone: commit only the cards that should have changed.
