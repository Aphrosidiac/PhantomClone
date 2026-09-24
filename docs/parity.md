# Parity ledger

**30/39 complete** — 23 done, 4 partial, 5 omitted, 7 improved

## about

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| about | Studio tab: hero, strip, statements, zones, band, clients, studio, team | done | headless capture docs/qa/shots/about-full.png checked by eye against the reference capture |  |
| about-approach | Approach tab (process + included) | done | headless capture docs/qa/shots/approach-full.png checked by eye against the reference capture |  |
| about-logos | Partner logo wall | partial | client names typeset; no client logo files on disk | client names typeset; no client logo files on disk |
| about-video | Autoplay video band | partial | image band; FF has no studio reel | image band; FF has no studio reel |

## contact

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| contact | Overlay with three cards; cold /contact | done | contact.png, contact-cold.png |  |
| contact-form | 7-step brief form, validation, completion | done | form-errors.png, form-done.png |  |
| contact-send | Form submission | improved | no backend: completion hands a pre-filled email / WhatsApp message to the visitor | no backend: completion hands a pre-filled email / WhatsApp message to the visitor |
| contact-upload | File attachments | omitted | no storage; replaced by a references field | no storage; replaced by a references field |

## global

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 404 | 404 page | done | headless capture docs/qa/shots/404.png checked by eye against the reference capture |  |
| cookies | Cookie banner + analytics | omitted | site sets no cookies | site sets no cookies |
| header | Mark, sound, blurb, two clocks, Let's Talk, gradient blur | done | headless capture docs/qa/shots/home.png checked by eye against the reference capture |  |
| legal | Privacy / modern slavery / AI policy pages | omitted | not applicable to FF demo; privacy line in contact overlay | not applicable to FF demo; privacy line in contact overlay |
| mobile | Phone layout: header, vertical view toggle, nav, filter, pages | done | m-*.png; no overflow at 390 |  |
| nav | Pill nav with sliding highlight, toggle easing .93,-.24,.4,1.17 | done | headless capture docs/qa/shots/captures across routes checked by eye against the reference capture |  |
| reduced-motion | prefers-reduced-motion | done | code: no tweens/inertia animation, reveals resting-visible |  |
| seo | Per-route titles, meta description, OG | partial | SPA: titles per route client-side; no per-route prerender | SPA: titles per route client-side; no per-route prerender |
| sound | Sound toggle, UI sounds on click/hover/drag/open | done | code; files from reference; audio not measured headless |  |

## home

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| a11y-grid | Screen-reader list of every project behind the canvas | improved | reference canvas has none | reference canvas has none |
| filter | Filter panel: zone / feature / stack / client, AND across groups | done | filter-active.png; URL /?zone=study&feature=webgl |  |
| filter-url | Filters and view persist in the URL | improved | reference keeps them in state only | reference keeps them in state only |
| grid-borders | Tile borders that stay steady while the grid moves | improved | flicker-probe in Chrome: 0% swing; 2725/2725 crossings exactly 1px | reference draws them as sub-pixel gaps; ours are pixel-snapped in the lens pass |
| grid-drag | Drag with 3px threshold, inertia decay 4·dt, press zoom-out z+.4 | done | headless capture docs/qa/shots/home-drag.png checked by eye against the reference capture |  |
| grid-edges | Picture edges without a bleeding rim | improved | fringe-probe: 18.8 -> 2.2 with gutter toggled in one session | atlas gutter + 1px coverage ramp |
| grid-hit | Hit test through the lens | improved | reference compares NDC to half-scale uv; ours inverts the lens | reference compares NDC to half-scale uv; ours inverts the lens |
| grid-hover | Hover blur background + label .8→1, eased 5·dt | done | headless capture docs/qa/shots/home-hover.png checked by eye against the reference capture |  |
| grid-keys | Arrows pan, Tab walks spiral, Enter opens | done | kb.mjs: Tab announced, Enter → /projects/ff-stanzza |  |
| grid-label-res | Sharp tile labels | done | sharp-probe: acutance 2.94 -> 3.88, crisp edges 13.5 -> 23.6 per 1000px | 2x label atlas, 1.5x scene target |
| grid-labels | Per-tile label: client mark, title, zone+feature pills, year | done | runtime Canvas2D atlas; capture |  |
| grid-lens | Barrel lens (.88 + d·r², d=-.07·aspect) + vignette | done | shader constants from bundle; capture |  |
| grid-parallax | Ambient pointer parallax .07 | done | code; observed in captures |  |
| grid-render | Instanced 11×11 wrapping grid, tiles repeat centre-out | done | capture docs/qa/shots/home.png |  |
| grid-video | Video atlas for moving tiles | omitted | FF media is stills | FF media is stills |
| grid-wheel | Trackpad/wheel pans the grid | improved | not on reference; added for trackpads | not on reference; added for trackpads |
| intro | Loader words part, progress bar, grid fades in with lens tween | done | headless capture docs/qa/shots/intro.jpg frames checked by eye against the reference capture |  |
| intro-mascot | Particle mascot intro | omitted | Phantom's mascot; //FF mark used instead | Phantom's mascot; //FF mark used instead |
| list | List view grouped by year, counts, pills, client, row entrance | done | headless capture docs/qa/shots/list.png checked by eye against the reference capture |  |

## pricing

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| pricing | Careers page shape carrying FF bands, care plans and terms | done | pricing-full.png; figures from SERVICE_ARCHITECTURE.md |  |

## project

| ID | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| project | Project page ×14: title, meta, live link, cover, statement, about, facts, shots, features, related | done | project-full.png, 14 routes |  |
| project-pixelate | Pixelate morph route transition | partial | fade/lift transition instead of WebGL pixel morph | fade/lift transition instead of WebGL pixel morph |

