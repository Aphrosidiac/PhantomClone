// www.ffdev.studio → ffdev.studio (301, path and query kept). Pages serves both hostnames from this
// project; this keeps one canonical host without a dashboard rule. public/_routes.json limits the
// function to page routes, so images, video and fonts never pass through it.
// Retired project pages answer 410 Gone from here, before the asset layer: Pages kept serving a stale
// copy of one (s-maxage a week) that no zone purge could reach, and 410 also drops them from Google sooner.
import { pagesMiddleware } from './ff-analytics.js';

const GONE = new Set(['/projects/big-brain-furniture', '/projects/big-brain-furniture-alt']);

async function site({ request, next, env }) {
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  if (GONE.has(url.pathname.replace(/\/+$/, ''))) {
    const page = await env.ASSETS.fetch(new URL('/404.html', url));
    return new Response(page.body, { status: 410, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  return next();
}

// FF Analytics (FF Ops) runs first, so it sees every response this function returns (redirects and 410s included):
// it answers /_e, adds the beacon to HTML and forwards page lines after the response. Settings on the Pages project:
// FF_ANALYTICS_URL and FF_ANALYTICS_KEY (secrets). Off when they are missing.
export const onRequest = [pagesMiddleware, site];

