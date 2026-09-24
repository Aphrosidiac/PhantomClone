# Verification

Two kinds of instrument live in `tools/`:

- **Playwright captures** (headless Chromium, SwiftShader GL) — every route and state at 1440×900 and
  390×844, with console errors collected. Good for layout, flows and regressions. **Not** good for
  judging motion: SwiftShader renders slowly and a still image cannot show flicker.
- **In-page GPU probes** — scripts pasted into (or `fetch`ed and `eval`ed by) the running page in a
  real browser. They freeze the render loop, set exact grid offsets, render a frame synchronously with
  `grid.draw()` and read pixels back with `gl.readPixels`. Deterministic, and they measure the exact
  pixels the user sees, frame by frame.

Start the dev server first: `npm run dev` (port 3175).

## Playwright

| Command | Output |
|---|---|
| `node tools/states.mjs [base] [outDir]` | `docs/qa/shots/*.png` — home, hover, drag, list, filter (open/active), filtered grid + list, project (+ full page), about, approach, pricing, contact, form errors, form done, 404, cold `/contact`, and the phone set `m-*.png`. Prints URLs at each step, horizontal overflow at 390 px, and any page errors. |
| `node tools/shot.mjs <url> <out.png> [WxH] [waitMs] [js]` | one screenshot; optional expression evaluated first and printed |
| `node tools/research.mjs`, `node tools/research2.mjs` | the reference captures used for the spec (written to the git-ignored `docs/reference/`) |

## GPU probes (run in a real browser on `/`)

From the browser console, or any automation that can evaluate JS in the page:

```js
eval(await fetch('/tools/flicker-probe.js').then(r => r.text()))
```

| Probe | Measures | Pass |
|---|---|---|
| `tools/flicker-probe.js` | Steps the grid 60× by ~0.5 px, reads one row, tracks each grid line's peak contrast across frames | a grid line's min = max (0 % spread) |
| `tools/fringe-probe.js` | Predicts every picture edge's screen position (world → inverse lens), measures edge brightness minus the picture 5 px inside, per frame | average fringe near 0 (no bright rim) |
| `tools/sharp-probe.js` | Fixed frame; acutance (mean \|Δ luminance\|) and crisp-edge density over the label strips of the centre row | higher is sharper; compare `/?ss=1&ls=1` (old) with `/` |

The line-isolation check used for the border fix is not a file; it is the flicker probe with the tiles
blanked (`grid.material.uniforms.opacity.value = 0`, vignette off, `lineAlpha = 1`), counting the
width and brightness of every lit run on 5 rows and 5 columns.

## Recorded results — Chrome, 1568×782 window, drawing buffer 1920×936

### Tile borders

| Build | Result |
|---|---|
| Sub-pixel gaps between tiles (first build) | visible flicker (reported) |
| Anti-aliased 1 px line in the lens pass | grid-line contrast swung **40 → 77** (≈40 %) across frames |
| **Pixel-snapped line** (current) | centre lines **77 / 77, 0 %**; line-isolated: **2,725 of 2,725** thin crossings exactly 1 px at 77, no partial pixels in 80 frames |

### Picture edges (same session, gutter toggled)

| Build | Edges | Fringe avg | Fringe worst |
|---|---|---|---|
| No gutter (old sampling) | 26 | **18.8** | 48 |
| 24 px gutter + 1 px coverage ramp (current) | 26 | **2.2** | 31 |

Remaining frame-to-frame swing on some edges comes from the probe's "5 px inside" sample landing on
different picture detail (panels, racking bars) as the grid moves — the values are negative (edge
darker than inside), i.e. no rim.

### Label sharpness (same frame)

| Build | Acutance | Crisp edges / 1000 px |
|---|---|---|
| `?ss=1&ls=1` — 1× labels, 1× scene | 2.94 | 13.5 |
| current — 2× labels, 1.5× scene | **3.88** | **23.6** |

### Boot (real Chrome, dev server, unfocused window)

| Build | Atlas build | Grid ready | Loader gone |
|---|---|---|---|
| `?ls=1&ss=1` | 1,261 ms | 3,462 ms | 4,963 ms |
| current (2 runs) | 1,137 / 828 ms | 1,808 / 1,517 ms | 3,310 / 3,019 ms |

`window.__ffTimings` and `grid.timings` expose these numbers on every load.

### Flows (Playwright, `states.mjs`)

Filters → `/?zone=study&feature=webgl`; list → project; contact form validation + completion builds a
correct `mailto:`; Escape restores the previous URL; cold `/contact` renders home underneath; 404;
no horizontal overflow at 390 px; **zero page errors**.

## Known limits of the instruments

- SwiftShader screenshots of the grid are slow and cannot show temporal artefacts — use the GPU probes.
  Since the 2× label atlas, SwiftShader needs ~100 s to build the grid (mipmaps on the CPU) against
  ~1.5 s in real Chrome; `states.mjs` waits generously, and `?ss=1` spares it the supersampled target.
- Headless Chromium does not render `backdrop-filter` reliably: overlays captured there can show the
  page behind them unblurred. Real Chrome blurs it (checked 2026-09-24).
- Leftover headless browsers keep rendering the grid at full CPU and starve the next run —
  `pkill -f chrome-headless-shell` between runs.
- An in-app browser pane that is hidden does not paint; captures from it are blank.
- Full-page screenshots leave `loading="lazy"` images unloaded (blank boxes are an artefact).
