// PostHog reverse proxy: /ingest/* on this origin → PostHog US Cloud. PostHog's Cloudflare Worker
// recipe (posthog.com/docs/advanced/proxy/cloudflare, option 1) as a Pages Function, with the
// /ingest prefix stripped. Same-origin requests aren't dropped by blockers that block posthog.com.
const API_HOST = 'us.i.posthog.com';
const ASSET_HOST = 'us-assets.i.posthog.com';

export async function onRequest({ request, waitUntil }) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/ingest/, '') + url.search;
  // /static/ holds versioned SDK files: safe to keep in Cloudflare's cache. /array/<token>/config.js is
  // the project's remote config (replay on/off, masking…): always fetched, so a settings change in
  // PostHog is live as soon as PostHog's own CDN has it (≤ 5 min) — never held longer here.
  if (url.pathname.startsWith('/ingest/static/')) return retrieveAsset(request, path, waitUntil);
  if (url.pathname.startsWith('/ingest/array/')) return fetch(`https://${ASSET_HOST}${path}`);
  return forwardRequest(request, path);
}

async function retrieveAsset(request, path, waitUntil) {
  let response = await caches.default.match(request);
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${path}`);
    waitUntil(caches.default.put(request, response.clone()));
  }
  return response;
}

async function forwardRequest(request, path) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.delete('authorization');
  headers.set('X-Forwarded-For', ip);
  return fetch(new Request(`https://${API_HOST}${path}`, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : null,
    redirect: request.redirect,
  }));
}
