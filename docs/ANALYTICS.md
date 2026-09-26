# Analytics, consent and privacy

PostHog (US Cloud) with a cookie banner. Nothing is collected before a visitor chooses; Accept turns
on full analytics and session replay; Reject is still counted, cookieless.

- PostHog: organisation **FF Dev Studio**, project **ffdev.studio** (id 629739), https://us.posthog.com/project/629739
  (rikaidrawings@gmail.com). Not the ASCEND organisation.
- Dashboard: **ffdev.studio** (id 2138244), set as the project's home dashboard.
- Pages: `/privacy` (privacy notice, PDPA 2010) and `/cookies` (every storage item + the choice).

## How it fits together

| Piece | Does |
|---|---|
| `src/analytics.js` | Loads `posthog-js` as its own chunk (~92 KB gz, never in the first paint) and inits it: `api_host: '/ingest'`, `defaults: '2026-08-30'` (history-change pageviews for this router), `cookieless_mode: 'on_reject'`, `person_profiles: 'identified_only'`, `maskAllInputs`. Only on `ffdev.studio` and localhost — ff-phantom.pages.dev and previews stay silent. `track(event, props)` for custom events. |
| `src/consent.js` | The banner (Accept / Reject / Details), shown while `get_explicit_consent_status()` is `pending`, after the loader. Any `[data-cookie-settings]` control reopens it. Stores nothing itself. |
| `src/legal.js` | Privacy notice sections and the storage table. **Every line must stay true of the code and the PostHog settings.** |
| `functions/ingest/[[path]].js` | Reverse proxy, PostHog's Cloudflare recipe as a Pages Function: `/ingest/static/*` → `us-assets.i.posthog.com` (cached: versioned files), `/ingest/array/*` → the same host, never cached here (it is the project's remote config), everything else → `us.i.posthog.com`. `public/_routes.json` includes `/ingest/*`. |
| `vite.config.js` | The same proxy for `npm run dev`. |

Consent flow (PostHog's documented `on_reject` mode):

| State | Storage | Sent |
|---|---|---|
| pending (banner up) | nothing | only the `/flags` + config requests; no events |
| Reject → `opt_out_capturing()` | `__ph_opt_in_out_<token>` (localStorage) only | events with `$cookieless_mode: true`; server-side daily-salted hash; no replay, no GeoIP |
| Accept → `opt_in_capturing()` | 2 cookies, 3 localStorage, 2 sessionStorage (see `/cookies`) | everything, incl. replay |

Verified 2026-09-26 in a real browser (storage read after each state). Re-check `STORAGE` in
`legal.js` after any posthog-js upgrade.

## Events

Autocapture, `$pageview`/`$pageleave`, `$web_vitals`, `$exception`, dead clicks and rage clicks come
from PostHog. Custom events (`track()` in `src/main.js`):

| Event | When | Properties |
|---|---|---|
| `project_viewed` | a project page renders | `slug, title, zone, client, source` (`grid · list · related · link · landing`) |
| `live_site_opened` | "See it live" | `slug, host` |
| `contact_opened` | Let's Talk overlay opens | `trigger` (`header`, link text, or `url`), `page` |
| `brief_started` | the 7-question form opens | — |
| `brief_completed` | the form validates | `kickoff` (1–3), `work` (kinds picked), `has_note`, `has_refs` |
| `brief_sent` | "Send by email / on WhatsApp" | `channel` |
| `contact_link_clicked` | any direct mailto: / wa.me link | `channel, place` |
| `view_changed` | grid ↔ list | `view` |
| `filter_changed` | a filter toggled | `group, value, on, active_filters, results` |
| `grid_dragged` | first drag of the grid per page load | — |

**Never** put the name, email, company, note or links a visitor types into an event. The finished
brief's send links carry that text in their `href`, so their container has `ph-no-capture` (left
out of autocapture and replay). Checked: a test brief's text appears in no event.

Action **Enquiry** = `brief_sent` or `contact_link_clicked` — use it as the conversion goal in Web
analytics. The built-in channel type **AI** covers ChatGPT, Claude, Gemini, Perplexity and Copilot.

## PostHog project settings (set 2026-09-26)

Name `ffdev.studio`, timezone Asia/Kuala_Lumpur, authorised URL `https://ffdev.studio`,
**cookieless server hash mode on** (required — without it rejected visitors' events are dropped),
**discard client IP** on (GeoIP still runs first), session replay on with `maskAllInputs`, console
logs, network timing, web vitals, heatmaps, exception autocapture and dead clicks on, 30-day replay
retention (free plan), test-account filter excludes `$host` localhost / 127.0.0.1 and is on by default.

**Leave "Authorized domains for replay" empty.** With any domain listed, PostHog's static remote
config (`/array/<token>/config.js`) reports `sessionRecording: false` and the SDK never starts a
recording — found and confirmed 2026-09-26. The SDK only runs on ffdev.studio anyway.

## FF's own visits

Open any page once with `?ff_internal=1` on each of your devices and browsers (`?ff_internal=0`
undoes it). It sets `ff_internal` in that browser's localStorage, `before_send` adds
`ff_internal: true` to every event from it, and the project's test-account filter (`ff_internal` is
not set) hides those events from every chart. Works whether you accept or reject cookies.

## Alerts and the weekly email

- **Enquiry alert** — insight "Enquiries (alert)" (hourly `Enquiry` action count), checked hourly;
  emails the PostHog account (rikaidrawings@gmail.com) when it is above 0. Instant email
  destinations are a paid PostHog feature; Discord and Slack destinations are free if ever wanted.
- **Error alert** — insight "Errors (alert)" (hourly `$exception` count), emails when above 5 in an hour.
- **Weekly email** — the ffdev.studio dashboard, every Monday, to hello@ffdev.studio.

## Testing it

- Real browser only: posthog-js drops events from headless browsers (bot user agents), so a
  Playwright run sends nothing — that is not a bug.
- Local: `npm run build && npx wrangler pages dev dist --port 8788` runs the proxy function too.
  Localhost events are real but hidden by the test-account filter.
- Reset the choice: clear site data, or run `__ph.reset(); localStorage.clear()` in the console.
- Config changes in PostHog reach browsers within ~5 minutes (PostHog's CDN caches the config file
  for 300 s; the proxy deliberately does not cache it).

## When something changes

- New tracked interaction → `track()` in `main.js`, a row above, and the event's description in
  PostHog (Data management → Events).
- New storage item, processor, or retention → update `src/legal.js` (and `LEGAL_UPDATED`) in the
  same commit.
- posthog-js upgrade → re-read the stored keys after Accept and Reject and update `STORAGE`.
