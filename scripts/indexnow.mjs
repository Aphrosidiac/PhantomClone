// node scripts/indexnow.mjs [url ...]
// Tells IndexNow (Bing, Yandex, Seznam, Naver — shared between them) that URLs changed, so they
// recrawl in minutes instead of waiting. Default: every URL in dist/sitemap.xml. The key is public by
// design: public/<key>.txt proves the site owns it. Only meaningful for the live host (SITE_URL).
import { readFileSync } from 'node:fs';

const KEY = 'dedd10c99310517e8ab34f8f3804e8f8';
const SITE = process.env.VITE_SITE_URL || 'https://ffdev.studio';
const urls = process.argv.slice(2).length ? process.argv.slice(2)
  : [...readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const host = new URL(SITE).host;
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.filter((u) => new URL(u).host === host) }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} (${urls.length} URLs)`);
if (res.status >= 400) process.exitCode = 1;
