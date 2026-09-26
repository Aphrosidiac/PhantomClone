// Dev server only: /ingest → PostHog, the same routes functions/ingest/[[path]].js serves in production.
import { defineConfig } from 'vite';

const to = (target) => ({ target, changeOrigin: true, secure: true, rewrite: (p) => p.replace(/^\/ingest/, '') });
export default defineConfig({
  server: {
    proxy: {
      '^/ingest/(static|array)/': to('https://us-assets.i.posthog.com'),
      '/ingest': to('https://us.i.posthog.com'),
    },
  },
});
