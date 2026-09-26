// www.ffdev.studio → ffdev.studio (301, path and query kept). Pages serves both hostnames from this
// project; this keeps one canonical host without a dashboard rule. public/_routes.json limits the
// function to page routes, so images, video and fonts never pass through it.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
