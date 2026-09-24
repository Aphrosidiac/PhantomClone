# Reference spec — phantom.land (snapshot 2026-09-24)

Markers: `[measured]` extracted from the page/bundle · `[observed]` seen, not measured · `[inferred]` reasoned.
Sources on disk (local only, git-ignored — the reference's own files are not published): `docs/reference/2026-09-24/{html,js,css,assets/workgrid,blueprint.json,shots}`.

## 1. Snapshot
Next.js App Router + Prismic, React-Three-Fiber canvas persistent across routes `[measured]` (chunk names, `prismic.io` preconnects). Captured at 1440×900 and 390×844, headless Chromium (SwiftShader) and the in-app browser. Cookie banner declined.

## 2. Sitemap `[measured]`
`/` work grid · `/?view=list` (list is a state, not a route `[observed]`) · `/projects/:uid` ×92 · `/about` (Agency / Approach toggle) · `/careers` · `/contact` (overlay over the current page) · `/privacy-policy`, `/modern-slavery-statement`, `/ai-policy` (footer only) · 404.

## 3. Page anatomy
- **Home** — fullscreen WebGL grid, fixed header, bottom pill nav, grid/list toggle (bottom-left), Filter (bottom-right) `[measured]`.
- **List view** — fixed black overlay (`opacity .3s`), header row "All projects" / "N projects" (56/52px, second at 40% white), groups by launch year desc, rows: title 18/700 · first two description paragraphs (sr-only) · zone pill + ≤3 feature pills · client right; row border-top neutral-800 / border-bottom white 20%; hover bg neutral-900; rows enter `opacity 0→1, y 20→0, .5s, delay .2+.05·i` `[measured]`.
- **Filter panel** — right column over a blurred grid: "FILTER BY ZONE" mono label, zones as 50.4px/700/-1.26px buttons (inactive 40% white), then FEATURE / REGION / PARTNER mono lists (10.88px, line 12px). Button becomes white "Close". Filters AND across groups; empty result → a single fallback tile `[measured]`.
- **Project** — cream page, client logo × FF mark top-left, giant centred uppercase title (`LargeTitle`: clamp(3rem,12vw,15.6rem), 800, -.0425em, lh .9), rule, meta row (REGION & ZONE pills · SEE IT LIVE ↗), hero, big statement, ABOUT body, FEATURES pills, Related work ×3, "See all work" `[observed]`.
- **About** — dark grey page, sticky Agency/Approach toggle top-left; rows separated by hairlines: mono section label left, large statement text (letter-split reveal) right; Zones ×3 (title / two lines / "View our X work" / image); video band; Partners logo wall 5-col; Our Studios; Team `[observed]`.
- **Careers** — black; big statement (≈36px/700) indented to the right; "View open roles"; three "Phantoms are — Respected/Trusted/Unrivalled" columns; Open roles list (category · role); Wildcard; footer with addresses `[observed]`.
- **Contact** — full overlay, close ✕ top-right, "LET'S TALK" label, "Welcome! It's great to meet you.", three cards (Collaboration → 7-step form, Hiring, Anything else with EMAIL/WHATSAPP chips) `[observed]`.

## 4. Components `[measured]`
- **Header** height 104, padding-top 24, fixed, pointer-events none except controls, gradient-blur backdrop (`blur 26px`, mask `#000 → 60% at 75% → transparent`). Enter: `bottom:-4rem→` 1s `cubic-bezier(.16,1,.3,1)`.
- Logo 44×80 at x=38,y=24. Sound: 8×3 dot matrix + `SOUND [OFF]` at x≈501. Description 220px at x=732 (col 7/12). Clocks at x=963 (dot) / 1078: primary white, secondary 30% white. Let's Talk: white pill, radius 48, padding 16/23, 17.92px/500, hover bg white 53%.
- **Pill nav (Toggle)**: blur(10px), bg black 25%, radius 40, height 50, padding 5; highlight white pill, `translate .7s cubic-bezier(.93,-.24,.4,1.17)`; items 14px/500; active text black, colour transition .3s delayed .35s.
- **Grid/List toggle**: same Toggle, 2 icon options, bottom 2rem left 15px.
- **Filter button**: bottom 2rem right 34px, bg white 53%, blur 10, padding 16/21; open → bg white "Close".
- Mono detail: `.68rem` (10.88px), weight 400, lh 1.1, uppercase.
- Pill (tile/list tag): h 28, radius 14, padding 0 16, bg white 5%.

## 5. Tokens `[measured]`
Colours: #000 primary, #fff secondary, #222 about ground, neutral-800/900 rules and hovers, white 40% / 53% / 30% alphas. Radii 14 / 40 / 48. Breakpoints 599 / 1024 / 1440 / 1920. Grid margin 24px; 12 columns at 1440, 16 at 1920. Easings: `.81,-.01,0,1` (8×), `.16,1,.3,1` (4×), `.93,-.24,.4,1.17` (toggle), `1,.01,.22,1`.
Type: Helvetica Now (self-hosted) 500/700/800; ballinger-mono (Typekit, domain-locked).

## 6. Motion — the grid `[measured from page chunk]`
- Tiles: InstancedMesh of `PlaneGeometry(.998,.998)` on an **11×11** grid filled by a centre-out spiral, content repeating `i % tiles.length`; each instance wraps by `round((pos - 5.5 + offset)/11)·11` → infinite plane. Background plane #888 behind shows through the .002 gaps as hairlines.
- Textures: per atlas a colour map, an alpha map and a label map, 6×6 cells. Media sampled at `MEDIA_ZOOM .7` (media sits in the centre 70%); label covers the full cell (logo TL, title TR mono caps, zone pill outlined + feature pills filled BL, year BR).
- Hover: nearest tile centre to pointer (projected). Active tile background = 5×5 box blur of its media at `BLUR_ZOOM 20` × `.7` × intensity; label alpha .8 → 1. Intensity eases `i += (target-i)·5dt`, four-slot history so exits fade out.
- Camera: perspective, z **3.43**; on press z → 3.83 over .4s; release → 3.43. Pointer ambient parallax `(pointerUv-.5)·.07`.
- Drag: 3px threshold; drag delta mapped px → world at depth z+.58; release keeps velocity, decays `lerp(0, 4dt)`. Keys: arrows move 4px steps, Tab steps focus along the spiral (`moveTo` .3s power2.inOut), Enter opens.
- Lens pass: `uv' = (.88 + d·r²)·uv`, `d = -.07·aspect` (0 during intro, tween 1s power2.out); vignette `smoothstep(.8, .6·.799, (.6+.6)·dist)`. Low graphics tier skips the composer.
- Leaving home: grid opacity → .3 and camera z +1 over 1s; return: centre + fade in.
- Route transition: pixelate morph between frames (`pixelSize`, `easeInCubic`) `[measured]`.
- Loader: two words "PHANTOM STUDIOS®" / "TECHNOLOGY CREATIVE" spread apart while a progress bar scales, 1.5s delay then the grid intro `[observed]`.

### 6a. Video tiles `[measured 2026-09-24: bundle, blueprint.json, ffprobe]`
- **Blueprint.** `workgridAssets/production/blueprint.json` = `{atlases[3], cells[85]}`. Atlas 0/1 are `image` (jpg), atlas 2 is `video` (mp4). Each cell: id, title, `mediaType`, source `mediaUrl`, client logo, zone, features, `atlas {index, cellX, cellY}`. 36 video cells fill atlas 2; 5 more video projects overflow into image atlas 1 as a still frame.
- **One video, 36 clips.** `media-rgb-atlas-2.mp4`: 2040×2040 (6×6 cells of 340), H.264 High L5.0, yuv420p, **20 fps, 100 frames = 5.0 s**, one keyframe, B-frames, no audio, ~5.2 Mb/s, 3.2 MB, `moov` at the END (not faststart, so nothing plays until the whole file is in). Every cell loops the same 5 s in lockstep; source clips are cut down to 5 s (some are three quick scenes, some one slow move).
- **Alpha is static.** `media-alpha-atlas-2.jpg` is one mask per cell (rectangles, rounded phone screens, a cut-out heart). The video carries no alpha; the moving picture must stay inside its fixed mask.
- **Playback (`class L`).** Detached `<video>` (never in the DOM): `crossOrigin=anonymous, muted, playsInline, webkit-playsinline, preload=auto, loop`, created paused. `THREE.VideoTexture`, `generateMipmaps=false`, Linear min/mag. An `ended` listener also rewinds and replays (belt-and-braces over `loop`). `onReady`/`canplaythrough` is wired but nothing waits on it: video tiles are black until the file arrives.
- **When it plays.** Grid `fadeIn()` → `assets.play()`; `fadeOut()` (leaving home) → `pause()`. Paused during the intro while the grid is not rendering (`!isWorkGridRender && state === INTRO`).
- **Shader.** Same path as image atlases: `colorMap2` is the video texture, sampled by `vMediaUv` and by the ×20 hover blur, so a video tile's hover glow shifts colour as the clip plays.

## 7. Content model `[measured]`
Project: uid, title, launch_date, zone (experience/product/communication), features[], service (region), clients[] (name + logo), about[] rich text, work_grid media. Filters come from the same fields.

## 8. Responsive `[observed]`
<1024: header shows logo + Let's Talk only; mono typography on toggles; grid/list toggle vertical at left middle; Filter moves top-centre. Grid uses a mobile content order.

## 9. SEO
Per-route `<title>` "Phantom Studios | X"; long SEO paragraph hidden in the home `<main>` `[measured]`.

## 10. Performance
Grid = 3 atlases (2×2040² jpg + 1 mp4 video atlas) + 3 label PNGs 4096² ≈ 4.4 MB `[measured]`.

## 11. Accessibility — where we diverge (deliberately)
- The reference grid is canvas-only; ours mirrors every tile as a focusable link list for screen readers.
- `prefers-reduced-motion`: no inertia/lens tween, instant route changes.
- No cookie banner (we set none).

## 12. Provenance
Taken: behaviour and numbers from their bundle (re-written in our own code), UI sounds (`public/sounds/*.mp3`, from phantom.land/assets/sounds — permitted by Fakhrul).
Replaced: wordmark/mascot → `//FF`; Helvetica Now → Instrument Sans (FF brand); ballinger-mono → DM Mono (OFL); every project, image and sentence → FF's own.
