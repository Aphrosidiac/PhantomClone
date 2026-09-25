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
