# Architecture

A static single-page app. One persistent WebGL canvas sits behind every route; pages are HTML
strings swapped into `<main>` by a small History-API router. No framework, no build-time rendering.

```
index.html ──► src/main.js ──► router ──► src/pages.js   (HTML for the current route)
                    │
                    ├──► src/grid.js  WorkGrid (canvas in #stage, lives for the whole session)
                    ├──► list view / filter panel / contact overlay (DOM in index.html)
                    └──► src/sound.js
             src/data.js ◄── everything above reads content from here
```

---

## 1. The grid engine — `src/grid.js`

### Scene

| Piece | Detail |
|---|---|
| Tiles | One `InstancedMesh` of 121 unit planes (11×11). Slots are filled by a **centre-out square spiral**; slot *i* shows `list[i % list.length]`, so the current filter result repeats outward from the centre. |
| Infinite plane | Every frame each instance is wrapped into the 11-unit window around the camera: `x -= round(x / 11) * 11`. Dragging never reaches an edge. |
| Camera | Perspective, `z = 3.43` at rest, `+0.4` while pressed, `+1` while another page is open. FOV is **computed**, not fixed (see Resolution & sizing). |
| Render path | Scene → multisampled render target (supersampled) → full-screen **lens pass** → screen. |

### Textures (built at runtime)

`buildAtlas()` draws two Canvas2D atlases once fonts and images have loaded:

- **Media atlas** — each project's `tile.jpg`, centre-cropped square, one 683 px cell per project.
  Capped at 4096 px (2048 on phones).
- **Label atlas** — per cell: client wordmark (or the `//FF` mark for studio work) top-left, title in
  mono caps top-right, zone pill (outlined) + two feature pills (filled) bottom-left, year bottom-right.
  Drawn at **2×** the media resolution (cap 8192 / 4096 on phones), because a 17 px caption in a
  683 px cell is only ~8 screen pixels tall and would otherwise be sampled from a blurred mip.

A per-project **hover colour** is the mean of the centre quarter of its image — the reference blurs
the centre of the media at 20× zoom, which comes to the same thing.

Nothing is pre-baked, so adding a project needs no asset pipeline (see CONTENT.md).

### Tile shader

- Media occupies the centre **70 %** of a tile (`MEDIA_ZOOM = 0.7`).
- Media is sampled from the **inner part of its cell** (`mediaGutter = 24 / 683`), so mipmapping never
  bleeds the neighbouring picture in as a bright rim, and the picture edge gets a **1-screen-pixel
  coverage ramp** from `fwidth()` instead of a hard, aliased cut.
- Hover: background = hover colour × 0.7 × intensity; label opacity 0.8 → 1. Intensity is a
  per-instance attribute eased `i += (target − i) · 5·dt`, so a tile you leave fades out.
- `opacity` uniform dims the whole grid (intro, other pages).

### Lens pass

Straight from the reference's numbers:

```glsl
m  = 2·(uv − .5);                       // screen → [-1, 1]
uv' = (0.88 + d · |m|²) · m · .5 + .5;  // d = -0.07 × aspect (0 during the intro, tweened in 1s)
vignette = smoothstep(.8, .6·.799, 1.2 · distance(uv, .5))
```

**Tile borders are drawn here, not in the scene.** For each output pixel the shader recovers the
world position (`(uv' − .5) · visible − offset + .5`) and lights the pixel when a whole-number grid
coordinate falls inside it (`floor(w + ½·dFdx) − floor(w − ½·dFdx)`). Each line is therefore exactly
one device pixel at constant brightness every frame. Two earlier approaches flickered and were
replaced — sub-pixel gaps between tiles, then an anti-aliased 1 px line (which splits across two
pixels at ~60 % whenever it sits between them). See VERIFICATION.md for the measurements.

### Resolution & sizing

- The scene target renders at **1.5×** the drawing buffer (1.15× on phones). The lens magnifies the
  centre by 1/0.88; rendering larger means that pass shrinks instead of enlarging.
- **Pixel budget: ~8.3 M pixels** (one 4K frame) for both the canvas and the scene target. The pixel
  ratio (max 2) and the supersample are both reduced to fit, so a large retina window never asks for
  hundreds of MB of multisampled GPU memory. Typical results: 1440×900 @2× → supersample 1.27;
  1920×1080 @2× → 1.0; 3840×2160 @2× → pixel ratio 1.0.
- FOV is derived from a target tile size: `unitPx = min(0.291·height, width / 2.6)` →
  `fov = 2·atan(height / unitPx / (2·3.43))`. Desktop gets a ~306 px tile at 900 px tall (measured on the
  reference); a portrait phone is limited by width and shows ~2.5 columns.
- `?ss=` and `?ls=` URL parameters override the supersample and label scale — used for A/B probes.

### Input

| Input | Behaviour |
|---|---|
| Pointer down | camera to z+0.4 (0.4 s, expo.out) |
| Drag (> 3 px) | pixel delta → world at depth z+0.58; release keeps the last delta as velocity, decaying `lerp(0, 4·dt)` |
| Click (≤ 3 px) | opens the tile under the pointer. Hit-testing **inverts the lens** first, so the tile you see is the tile you get (the reference compares un-lensed coordinates and misses near the edges). |
| Wheel / trackpad | moves the grid exactly the distance scrolled, eased over ~0.1 s; never feeds the drag inertia (trackpads bring their own momentum). Not on the reference; added for trackpads |
| Arrows | pan |
| Tab / Shift-Tab (canvas focused) | walk the spiral one tile at a time (0.3 s, power2.inOut); leaves the canvas at either end |
| Enter | open the focused/hovered tile |
| Pointer position | ambient parallax `−pointer · 0.07`, eased |

### Lifecycle

`load()` → atlases + material → `setProjects(list)` rebuilds the instances for a filter result →
`intro()` (opacity 0→1, camera z 4.63→3.43, lens 0→−0.07) → `setActive(false|true)` when leaving /
returning to the home route (dim to 0.3, pull back, re-centre on return).

`draw()` is separate from `loop()` so probes can freeze the loop (`grid.frozen = true`), set an exact
offset and render a deterministic frame.

---

## 2. Router & pages — `src/main.js`, `src/pages.js`

- `match(path)` → `home | project | about (studio/approach) | pricing | contact | 404`.
- Internal links carry `data-link`; the delegated click handler pushes state and calls `render()`.
- `render()` sets title, `data-route` / `data-theme` on `<body>` (drives header colours and which
  controls show), swaps page HTML with a short leave/enter transition, restarts reveal observers
  **per navigation** (a mount-once observer would leave later pages invisible), and tells the grid
  whether it is active.
- `/contact` is an overlay, not a page: on a cold load the home route renders underneath. Closing it
  returns to the previous URL.
- Home view + filters are mirrored into the query string with `replaceState`, so filtered views are
  shareable and survive reload.

Themes: project pages are **Bone** with Ink type; About is **Graphite**; Pricing, home, list and
404 are black. The header inverts on light pages.

## 3. Overlays

- **List view** (`#listview`): fixed, `opacity` transition 0.3 s, `inert` while hidden. Rows enter with a
  per-row delay (`0.2 s + 0.05 s · i`).
- **Filter** (`#filter`): right-hand blurred panel. Zone is single-select (a second click clears),
  other groups are multi-select. Clicking the blurred area closes it; Escape closes it.
- **Contact** (`#contact`): three cards → form → completion. Validation is inline (`aria-invalid`,
  messages under each field). Completion builds a `mailto:` and a `wa.me` link with the whole brief
  pre-filled. Focus is trapped while open and restored on close.

## 4. Styling — `src/style.css`

Tokens on `:root`: FF palette (`--ink --bone --graphite --lime` …), `--sans` (Instrument Sans),
`--mono` (DM Mono), `--margin: 24px`, `--gap: 12px`, and the reference's measured easings
(`--ease-out .16,1,.3,1`, `--ease-inout .81,-.01,0,1`, `--ease-toggle .93,-.24,.4,1.17`).
Header and page grids are 12 columns (16 at ≥1920 px). Breakpoints: 1024 (phone/tablet layout),
1440, 1920. Every entrance animation animates **towards** a resting state that is already correct
in CSS, so reduced motion or a paused tab never leaves content invisible.

## 5. Boot sequence

1. Render the current route immediately (under the loader).
2. Start the grid (atlases) and wait for fonts.
3. Home waits for the grid (capped at 9 s); inner pages wait only for fonts (capped at 1.2 s).
4. Loader (`src/loader.js`): the FF Dev Studio lockup builds itself (slashes, Fs, divider, DEV STUDIO) while a
   counter chases the real load progress, capped by the build so both land together; then the lockup exits,
   the grid intro starts underneath and the black splits along the slash's angle and parts over it.
   Inner pages run it faster (they only wait for fonts); reduced motion gets a plain fade.

## 6. Sound — `src/sound.js`

Off by default. The first enable creates an `AudioContext` and decodes the eight files. Events:
click (UI), grid (hover, rate-limited to one per 90 ms), swipe (drag start), project (open / submit),
whoosh (overlays), other (close / error), load (loader).
