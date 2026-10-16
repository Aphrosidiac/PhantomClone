// www.ffdev.studio → ffdev.studio (301, path and query kept). Pages serves both hostnames from this
// project; this keeps one canonical host without a dashboard rule. public/_routes.json limits the
// function to page routes, so images, video and fonts never pass through it.
// Retired project pages answer 410 Gone from here, before the asset layer: Pages kept serving a stale
// copy of one (s-maxage a week) that no zone purge could reach, and 410 also drops them from Google sooner.
const GONE = new Set(['/projects/big-brain-furniture', '/projects/big-brain-furniture-alt']);

export async function onRequest({ request, next, env }) {
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
