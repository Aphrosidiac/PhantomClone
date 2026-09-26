# QA log — FF Grid (2026-09-24)

Instruments: headless Chromium via Playwright (`tools/states.mjs`, `tools/shot.mjs`, SwiftShader GL) at 1440×900 and 390×844; in-app browser for the reference. The in-app pane was hidden during the session, so it painted nothing — every visual judgement below comes from headless captures, not the pane.

| Surface | Checked | How | Result / fix |
|---|---|---|---|
| Home grid | render, lens, hairlines, labels, pills | capture vs reference pane shot | tiles were ~10% large → FOV calibrated to a ~306px tile at 900px |
| Home grid | hover blur + label brighten | mouse move, capture | ok |
| Home grid | drag + inertia + press zoom-out | mouse down/move/up, capture | ok |
| Home grid | keyboard: Tab walks spiral, live region announces, Enter opens, Back returns | `/tmp/pl/kb.mjs` | ok |
| Home grid | phone size | 390×844 | vertical FOV gave 1.4 columns → FOV now limited by width (~2.5 columns) |
| Intro | loader words part, bar, grid fade + lens tween | captures at 5.2s / 11s | bare hairline lattice showed during fade → hairlines now fade with tile opacity |
| Loader | inner pages on cold load | 390 captures at 4s | loader blocked on the grid atlas → inner pages now wait only for fonts; home capped at 9s |
| List view | toggle, grouping, counts, row entrance | click, capture | ok |
| Filter | open/close, zone single-select, multi features, URL sync, count badge, clear | click sequence | `/?zone=study&feature=webgl`, grid and list both filtered |
| Project ×14 | title, meta, cover, statement, about, facts, shots, features, related | click from list, full-page capture | ok (lazy images blank in full-page captures — capture artefact) |
| About | Studio/Approach routes, sticky toggle, hero alignment vs reference | capture pair | hero was offset and margin-collapse let the grid show through → aligned + `flow-root` |
| Pricing | bands, care plans, terms, figures | read against `ffdevstudio/SERVICE_ARCHITECTURE.md` | care plan names were invented at first (Care Plus/Pro) → corrected to Care / Maintain / Evolve |
| Contact | cold `/contact`, overlay over current page, form validation, done state, mailto/WhatsApp bodies, Esc restores URL, focus trap | Playwright | ok; nothing is sent by the site |
| 404 | unknown path | capture | ok |
| Mobile | overflow at 390 | `scrollWidth` | 390, no horizontal scroll |
| Console | all flows | pageerror + console.error collection | none |
| Build | `vite build`, `vite preview`, deep link | capture | ok; 179 kB gz JS (three.js) |
| Grid borders | flicker while moving (reported by Fakhrul) | GPU probes in real Chrome (docs/VERIFICATION.md) | sub-pixel gaps → AA line in lens pass (still 40–77 swing) → pixel-snapped line: 0 % swing, 2,725/2,725 crossings exactly 1 px |
| Picture edges | bright rim flickering (reported) | fringe probe, gutter toggled in one session | 24 px atlas gutter + 1 px coverage ramp: fringe 18.8 → 2.2 |
| Tile labels | low-res text (reported) | sharpness probe, same frame | 2× label atlas + 1.5× scene target: acutance 2.94 → 3.88, crisp edges 13.5 → 23.6 per 1000 px |

Lesson recorded: the first border "fix" was declared done from a still screenshot. A still cannot show flicker; the probes now exist so motion defects are measured, not judged.
| Wheel / trackpad scroll | "scrolls extremely fast" (reported) | tools/wheel-probe.js, live loop in Chrome | wheel fed the inertia: 300 px scrolled moved 1,102 px → now 1:1 (300 → 300, 100 → 100) |

## 2026-09-26 — SEO

- Built with the per-route prerender; served `dist/` through `wrangler pages dev` (Cloudflare's own asset server). Results: 200 for every route, each with its own `<title>`; 308 for trailing slashes and `.html` URLs; 404 for unknown paths and unknown project slugs.
- Real Chrome, production build: the grid renders over the prerendered home; cold `/projects/lewix-ai` and `/contact` load with no console errors. Client navigation swaps title, canonical, og:image and JSON-LD on every route, including opening and closing the contact overlay. The "Let's Talk" path initially missed this, and it is now fixed.
- Two SEO audit passes (technical + schema). Fixed from them: `/contact` prerendered the home body under a contact title (it now has its own hidden h1, brief and links); `Organization.founder` pointed at a Person node missing from 5 page graphs (every graph now carries it); HSTS added. A script checked every page's graph after the rebuild: zero dangling `@id` references.
- Titles ≤ 65 characters and descriptions ≤ 162 on all 20 files.

## 2026-09-26 — Pricing page layout

- Reported broken. Causes: the hero started at the header's edge, so the header blurb sat on the headline. The "Pricing" label was an inline-flex grid item stretched to the hero's height, which centred it mid-screen. Band titles at 4.2rem wrapped in a third of the width, prices were 13px mono, and all three care descriptions ran together as one paragraph under the table. Terms floated with nothing to anchor it.
- Rebuilt on the About page's row system. Each section is a rule, a mono label in columns 1–3 (now the h2s: Bands, Care, Terms) and content in 4–12. Bands are three panels with the price as the second-largest text. Care plans are rows of name, what's included, and monthly/yearly price. Copy is unchanged.
- Header between 1024 and 1439px: the blurb's columns overlapped the sound toggle, so grid auto-placement pushed it to a second row, below the 104px blur band and over the page on every route. Now pinned to row 1 with non-overlapping columns. Measured at 1024/1100/1280/1408/1440/1600: all items end ≤ 96px, no horizontal overlap.
- Checked at 1440, 1100 and 390 (full page) and in real Chrome at 1408. The shared `.btn-pill` rule was dropped in the rewrite and then restored; it is also used by About and 404.

## 2026-09-26 — About page and header blur

- About (Studio and Approach) captured at 1440, 1100 and 390, then scrolled in real Chrome. The layout grid holds at every width. Two defects showed only while scrolling.
- **Header blur never worked, on every route.** `.header` ran its entrance with `animation-fill-mode: both`, which held a `transform` after the animation ended, and that switched off `backdrop-filter` on the `.header-blur` child. Page text therefore scrolled sharp under the logo, blurb and clocks. Toggled live in Chrome: removing the held transform restored the blur. Fixed with `backwards` fill; the computed header transform after load is now `none`, and the text underneath reads blurred.
- About footer was followed by a 180px empty band (the page's own padding on top of the footer's). Removed, as on Pricing. The sticky Studio/Approach toggle's tint went from 25% to 45% black so section labels passing behind it don't show through.
