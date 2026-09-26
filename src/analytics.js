// Analytics: PostHog (US Cloud, project "ffdev.studio", 629739), with consent.
//
// Consent model — PostHog's documented `cookieless_mode: 'on_reject'` flow
// (posthog.com/tutorials/cookieless-tracking):
//   pending  → PostHog captures nothing and stores nothing; the banner is shown.
//   Accept   → opt_in_capturing(): cookies + localStorage, pageviews, custom events, session
//              replay (every input masked), heatmaps, web vitals, errors.
//   Reject   → opt_out_capturing(): still counted, but cookieless — PostHog hashes the visitor on
//              its servers with a daily salt, nothing is stored in the browser, no replay.
// The choice itself is kept by PostHog in localStorage (`__ph_opt_in_out_<token>`), the one
// strictly necessary item; "Cookie settings" (footer, /cookies) reopens the banner.
//
// Requires, in the PostHog project: "Cookieless server hash mode" on (Settings → Web analytics),
// otherwise rejected visitors' events are dropped. Events go through /ingest on this origin
// (functions/ingest/[[path]].js), so ad blockers that block posthog.com don't drop them.
// posthog-js is ~100 KB gzipped, so it loads as its own chunk after the page has started, never
// in the path of the first paint; calls made before it arrives wait for it.
const TOKEN = import.meta.env.VITE_POSTHOG_KEY || 'phc_t6rrEspDXb4Ubvy8KdsVCV9YwVyPjAo34Yg9xC3WgEdN';
// Only the live site (and local testing) reports; ff-phantom.pages.dev and previews stay silent.
const HOSTS = /^(ffdev\.studio|localhost|127\.0\.0\.1)$/;
export const enabled = HOSTS.test(location.hostname) && import.meta.env.VITE_POSTHOG_DISABLED !== '1';

let ready = null; // Promise<PostHog>
let ph = null; // the instance, once loaded: calls go straight to it, so events keep the page they happened on
export function initAnalytics() {
  if (!enabled || ready) return ready;
  ready = import('posthog-js').then(({ default: posthog }) => {
    posthog.init(TOKEN, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      defaults: '2026-08-30', // history_change pageviews for this History-API router, and the rest of the current defaults
      cookieless_mode: 'on_reject',
      person_profiles: 'identified_only', // nobody is identified: visitors stay anonymous
      capture_pageleave: true,
      // every typed value is masked; elements marked .ph-no-capture (PostHog's default blockClass) are
      // left out of recordings and autocapture entirely — the finished brief's mailto:/wa.me links carry
      // what the visitor wrote, so they are marked
      session_recording: { maskAllInputs: true },
    });
    window.__ph = ph = posthog; // for debugging from the console
    return posthog;
  }).catch((err) => { console.warn('analytics failed to load', err); return null; });
  return ready;
}

// the banner reads this: 'pending' | 'granted' | 'denied' ('n/a' when analytics is off here)
export async function consentStatus() {
  const ph = enabled && (await initAnalytics());
  return ph ? ph.get_explicit_consent_status() : 'n/a';
}
export async function setConsent(granted) {
  const ph = enabled && (await initAnalytics());
  if (!ph) return;
  if (granted) ph.opt_in_capturing(); else ph.opt_out_capturing();
}

// custom events; PostHog itself drops them while the visitor has not chosen yet
export function track(event, props) {
  if (!enabled) return;
  if (ph) { ph.capture(event, props); return; }
  const url = location.href; // before it loads: keep the page the event happened on
  initAnalytics()?.then((p) => p?.capture(event, { $current_url: url, $pathname: new URL(url).pathname, ...props }));
}
