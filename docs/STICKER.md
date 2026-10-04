# Cover sticker

A round holographic vinyl sticker slapped on a project's cover (today: **Hai Awan**). Visitors can peel
it, carry it, throw it, and drop it on the page, where its back — a small pitch with a working
**→ make mine sticky** pill — opens the contact overlay. Plain DOM, CSS and SVG with one lazy-loaded
module; no WebGL, no images, no dependencies.

| | |
|---|---|
| Code | `src/fx/peel.js` (all behaviour), sticker styles in `src/style.css` (search `sticker`), markup in `src/pages.js` (`sticker()`, `STICKER_BACK`) |
| Content | `sticker:` on a project in `src/data.js` — the words round the rim |
| Hook | `wireFx()` in `src/main.js`, after `wireReveals()` on every render |
| Probe | `node tools/sticker-probe.mjs [base]` — 18 checks, see [Verification](#verification) |

## What a visitor gets

| Moment | Behaviour |
|---|---|
| Arrive | It slaps onto the top-right corner of the cover's browser window (a scale-down "slap", tilted −9°), then its lower-right rim curls up. |
| At rest | The curl shows a sliver of the back: the lime pill's **→** peeks out. That's the hook. |
| Hint | Hovering near the curl lifts it further (shows "make mine…"); every 5–8 s it nudges up on its own, as if something under it pushed. Only on screen, not while hovered, never with reduced motion. |
| Light | A fixed light up-left. Scrolling and a hover "press" (the side under the pointer dips up to 8°) move the reflection; the cursor elsewhere does nothing. |
| Peel | Grab the rim (the curl itself included) and drag: it folds back over itself; let go early and it settles back to the curl. |
| Pop | Pull past ~82 % of the diameter and it comes off in your fingers, **back-up** (the pitch readable), lifted with a bigger shadow, trailing behind your hand like a card held by a corner. |
| Throw | Release speed + spin carry it through the air. Over ~1.2 px/ms it turns over once (over ~3.6 px/ms twice), always ending back-up. Off the screen = gone. |
| Drop | It lands, skids a touch and lies on the page, back-up, scrolling with the page. The pill opens `/contact`; anywhere else picks it up again. Up to 6 lie around; the oldest goes. |
| Cover | 1.1 s after a sticker leaves, a fresh one slaps onto the cover. |
| Leave the page | Everything the page spawned is removed (`mountPeel`'s cleanup, called by `wireFx()` on the next render). |

## Content

```js
// src/data.js — on the project entry
sticker: 'Open source · MIT',   // runs round the rim twice, upper-cased: "OPEN SOURCE · MIT ✦ OPEN SOURCE · MIT ✦"
```

Any project with `sticker` gets one on its cover; without it nothing loads (the module is an `import()`
behind `.sticker` existing). The **back** is the same for every sticker: `STICKER_BACK` in `src/pages.js`.

The back copy follows from what the visitor just did — played with a sticker, the kind of thing the
studio builds; "sticky" is the web's word for a site people stay on:

> PSST. / **Sticky, huh?** / we build sites people can't keep their hands off. / **→ make mine sticky**

Its layout is in `%` of the sticker and `calc(var(--S) * k)` type, so it scales with the sticker. The
pill is placed so the **resting curl uncovers its arrow** — if you move the pill, check the curl still
shows a sliver of it (it sits around 10–25 % from the left, 72–86 % down, *as seen from the back*).

## How it works

### Layers

```
.p-cover.p-cover--sticker            container-type: inline-size — the sticker sizes off the cover (cqw)
└─ .sticker  (--S, --tilt: -9deg)    the press target (its square), rotated; slap animation lives here
   └─ .stk-tilt                      the hover press: perspective rotateX/rotateY
      ├─ .stk-front                  white vinyl disc; clip-path = the half still stuck down
      │  └─ .stk-art                 silver base, rim text (SVG textPath), //FF mark, holo layers
      └─ .stk-flapwrap               drop shadow for the lifted flap
         └─ .stk-back                the flap: same box, mirrored by matrix(), clipped to the lifted half
            ├─ .stk-print            the back (pitch + pill), pre-mirrored (scaleX(-1))
            └─ .stk-shade            crease light
body
├─ .stk-free  (position: fixed)      a sticker in your fingers / in the air (front + back faces, shadow)
└─ .stk-loose-back (absolute, page)  a sticker lying back-up, pill live
```

### Peel

With grab point **C** on the rim (in the sticker's own square, size S) pulled by **v**, the paper that
moved is the half on C's side of the fold, which is the perpendicular bisector of C → C+v:

- `n = v/|v|`, `M = C + v/2`, side `f(p) = p·n − M·n`
- front keeps `f ≥ 0` (one Sutherland–Hodgman pass of the square → `clip-path: polygon()` in px)
- the flap is the same box reflected across the fold — `I − 2nnᵀ` plus `2(M·n)n`, i.e.
  `matrix(1−2nx², −2nxny, −2nxny, 1−2ny², 2(M·n)nx, 2(M·n)ny)` with `transform-origin: 0 0` — clipped
  to `f ≤ 0` in its own (pre-transform) coordinates
- the crease light is a `linear-gradient` along −n whose stops are placed at the fold's distance along
  the gradient line (`L = S|sinθ| + S|cosθ|`)

Pointer → sticker square undoes `--tilt` about the centre. Presses are taken on the **root's square**
and filtered to the disc (`r ≤ 0.52 S`): the curl is drawn by a layer that ignores the pointer, and the
curl is the first thing people grab. Grabbing near the current curl keeps it (continues the peel);
elsewhere it starts flat from the nearest rim point.

### Pop: flap → free body without a jump

The free body draws `rotate(θ) · rotateX(flip) · rotate(β)` about its centre, where θ is the angle of the
arm from the grab point to the centre. At the pop the flap shows the art through `rotate(tilt) ∘ R_fold`,
and a reflection is a rotation composed with a flip: `R_fold = rotate(2·atan2(n) + π) ∘ flipY`. With
`flip = π` (`rotateX(π)` projects to `flipY`), matching the two gives

```
β = θ − tilt − 2·atan2(n.y, n.x) − π
```

The back print is pre-mirrored on the flap (`scaleX(-1)`) and turned 180° on the free body's back face
(whose own `rotateX(180°)` already mirrors), which lands it in the same place on both sides of the pop.

### Carry, throw, land

- **Carry**: the grab point is the pointer; drag on the centre gives a torque about it,
  `α = 0.11 · (r × −v_pointer) / |r|²`, damped `0.84`/frame — the body swings to trail the motion. Lift `h → 1`
  (scale +7 %, shadow grows and softens).
- **Release velocity** comes from the last **60 ms** of pointer samples (0 if the pointer stopped > 70 ms
  before release). A longer window averaged the flick with the slow carry before it.
- **Flight**: velocity (+ the spin's own contribution at the centre, capped 95 px/frame), air drag `0.986`,
  spin decay `0.985`, height `h += vz` with `vz −= 0.0042`/frame from `0.012 + 0.00018·speed`. The turn over
  runs for ~92 % of the computed air time, `π → π − 2π·turns` (1 turn above 20 px/frame, 2 above 60),
  so it always comes down back-up.
- **The in-flight layer rides the page.** It is `position: fixed`, so each frame after release it is moved
  by the scroll delta. Without this a wheel/trackpad scroll right after a throw (desktop only — a phone's
  throwing swipe can't scroll) left it hanging on screen and landed it wherever the screen had got to.
- **Landing**: off-screen at touchdown → gone. Otherwise skid (`0.62`/frame) and become a
  `.stk-loose-back` at page coordinates, rotated `ρ = θ − β + π` (what the free body was showing).
- **Pick-up** from the page starts a free body with `β = θ + π − ρ`, so nothing moves under the pointer.

### Light and holo

One fixed light. Its reflection, for a flat sticker and a fixed eye, is a fixed point of the viewport
(`GLINT`: 55 % across, 12 % down); a sticker scrolling past slides under it. Tipping the surface swings it
away from the side pressed down at 2× the tilt (`perDeg: 6` % per degree). `shadeTo()` rotates that into
the art's frame and sets `--mx/--my` (hot spot) and `--la` (bearing). In the hand and in the air the same
light is used; the body's own spin and flip move the reflection.

Holo layers over a **mid-grey** silver (a bright base clips `color-dodge` to white and the colour vanishes):

1. two opposite rainbow wedges (`conic-gradient` from `--la`) — light on a CD
2. fine diffraction ruling, masked to the hot spot
3. two sparse glitter fields drifting against each other (SVG turbulence, thresholded)
4. gloss: a tight specular spot + a soft band (`screen`)

The rim text and //FF mark sit **above** the foil (`z-index: 1`) — dodging near-black still tints it —
and the gloss above them, like a laminate.

## Tuning

| Knob | Where | Now | Effect |
|---|---|---|---|
| `DETACH` | peel.js | 0.82 × S | pull length that pops it into your fingers |
| `RELEASE` | peel.js | 0.55 × S | let go past this and it comes off anyway |
| `MAX_LOOSE` | peel.js | 6 | stickers lying around before the oldest goes |
| `GLINT` | peel.js | x .55, y .12, gain 70, perDeg 6 | where the reflection sits, how far scroll / the press move it |
| rest curl | `rest()` | v = (−.18, −.23) S | how much of the back peeks out at rest |
| hover lift / nudge | `setNear`, `nudge` | 1.6× / 1.75× every 5.2–8.2 s | the hint |
| press | `hover` | ±8° | hover tilt |
| turns | `release` | >20 px/frame: 1, >60: 2 | spin in the air |
| restick | `up` | 1.1 s | fresh sticker on the cover |
| size / spot | style.css `.sticker` | `clamp(92px, 13cqw, 188px)`; phones `clamp(84px, 19cqw, 140px)` | sized off the cover's width, over the window's top-right corner |

## Accessibility, no-JS, search

- The sticker is `aria-hidden` and decorative: the licence and source link are already on the page as text.
  Its pill is `tabindex="-1"` while it is on the sticker; a sticker lying on the page has a real, focusable link.
- Without JS (or before the module loads) the prerendered sticker sits on the cover, flat.
- Reduced motion: no slap, no nudge, no hover press; peels and throws resolve instantly.
- `touch-action: none` only on the sticker, so a finger on it never scrolls the page and the rest scrolls normally.
- No analytics events: adding one would need `src/legal.js` / the privacy notice updated to match.

## Traps (each one was hit)

- **The cursor is not the light.** It first tracked the pointer 1:1 across the whole page — a spotlight glued
  to the mouse, shimmering while people read. A stuck sticker's reflection only changes with *its* angle to
  the eye: scroll, a press, its own spin.
- **Hit-testing the tilting face** flickered: the tilt slid the edge out from under a still pointer → leave →
  untilt → enter… Hover is measured on the root's square, which the press never moves.
- **The curl wasn't grabbable** (its layer ignores the pointer). Presses go to the root's square now.
- **Flick thresholds tuned on paper miss real hands.** 45 px/frame (2.7 px/ms) never triggered from a mouse
  flick; 20 does. Measure release speed before tuning.
- **Fixed layers don't scroll.** The in-flight sticker hung on screen during a desktop scroll — see above.
- **`color-dodge` on a bright base** clips to white (the holo vanished on near-white silver), and **on ink**
  still tints it — mid-grey base, ink above the foil.
- **A quick click froze it over the page.** A frame's timestamp is taken *before* that frame's input is
  handled, so a body made in a pointer handler stepped first with `now` earlier than its own clock: negative
  `dt`, the lift sank below 0, and a release in the next frame took the √ of a negative air time. `NaN`
  landing → every later `transform` was invalid, so the browser kept the last frame: a sticker hanging over
  the page where the pointer was, ungrabbable (`pointer-events: none`). Reported 2026-10-04 as "tear it off,
  quickly tap it, it gets stuck on my cursor". `step()` now skips a frame whose `now ≤ last`; a pick-up dead
  on the centre (arm 0, the torque divides by arm²) is held to a 1 px arm. Probe check 9 recreates both.
- **The pop must not jump**: the free body's transform is derived from the flap's mirror (β above), and the
  back print's mirror differs on the two sides. Change one, re-check frames just before and after the pop.

## Verification

`node tools/sticker-probe.mjs` (dev server on :3175) drives a real mouse in headless Chromium on
`/projects/hai-awan`. Recorded 2026-10-03, all 16 PASS; the tap checks added 2026-10-04 (18 PASS on a clean run):

| Check | Result |
|---|---|
| cursor at three far points leaves `--mx --my --la` unchanged | 10.7 1.4 −128.9 throughout |
| scroll moves the reflection | 15.6 −29.3 −113.4 → 5.9 32.1 −158.0 |
| hover tips it; a still pointer gives a steady tilt; leaving springs back | ok |
| grabbing the curl peels until it pops; back-up in the hand (flip = π) | ok |
| a drop lies on the page and scrolls with it | moved 400.0 px for a 400 px scroll |
| the pill opens `/contact`; Escape returns with the sticker still lying | ok |
| pick-up + flick spins and leaves the screen, nothing left behind | flip 2.04 → −2.43 rad mid-air |
| a 300 px scroll mid-flight lands it where it was thrown | released at page y 632, landed 631 |
| a tap on a lying sticker (picked up in one frame, let go in the next), off-centre and dead centre, lands again | free 0, lying 1 (before the 2026-10-04 fix: free 1 — frozen) |
| page errors | none |

Also checked by hand in real Chrome (1920 × 907): peel, carry, drop, pick-up, wheel scroll with a sticker
lying. **Not** checked on a real phone with a finger — touch is wired (pointer events, `touch-action`,
scroll as the viewing angle) and the layout was checked at 375 px, but feel needs a hand.

Instrument notes: the probe uses plain headless Chromium (the shared `browser.mjs` forces SwiftShader GL,
which runs this page at a few frames a second); headless delivers mouse moves ~33 ms apart, so its
"flicks" are slower than a hand's; the intro loader covers the page for a few seconds and swallows presses
(the probe waits until the sticker is the element under its own centre). The two flick checks are flaky
headless (2026-10-04: 2 of 4 runs the flick was too slow to leave the screen and landed, and the scroll
check then measured that sticker) — a re-run passes; nothing is left frozen when they fail.
