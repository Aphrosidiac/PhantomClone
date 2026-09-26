// node tools/seo-assets.mjs [base]
// Renders the share images and icons the head points at, from the running dev server (fonts and
// media resolve against it):
//   public/media/<slug>/og.jpg   1200×630 share card per project — its cover capture on its plate
//   public/logo.png              512×512 organisation logo (schema.org)
//   public/apple-touch-icon.png  180×180
//   public/favicon-48.png        48×48 raster fallback for the SVG favicon
// Re-run after adding a project or re-capturing a cover.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { launch } from './browser.mjs';
import { createServer } from 'vite';

const base = process.argv[2] || 'http://localhost:3175';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { PROJECTS } = await vite.ssrLoadModule('/src/data.js');
await vite.close();
const SHOTS = JSON.parse(readFileSync(new URL('../src/shots.json', import.meta.url)));
const MARK = '<svg viewBox="0 0 194 72"><path d="M0 72 16 0h14L14 72Z"/><path d="M24 72 40 0h14L38 72Z"/><path d="M72 0h54v15H88v13h32v14H88v30H72Z"/><path d="M140 0h54v15h-38v13h32v14h-32v30h-16Z"/></svg>';
const dark = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.45; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FONTS = `@font-face{font-family:IS;src:url(/fonts/instrument-sans-var.woff2) format('woff2');font-weight:100 900}
@font-face{font-family:DM;src:url(/fonts/dmmono-400.woff2) format('woff2')}
*{margin:0;box-sizing:border-box}body{width:100vw;height:100vh;overflow:hidden}`;

const b = await launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.route(base + '/__card', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
await page.goto(base + '/__card');

async function render(html, out, clip) {
  await page.setContent(`<!doctype html><style>${FONTS}</style>${html}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  if (out.endsWith('.jpg')) {
    const png = out.replace(/\.jpg$/, '.tmp.png');
    await page.screenshot({ path: png, clip });
    execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-q:v', '3', out]);
    execFileSync('rm', [png]);
  } else await page.screenshot({ path: out, clip, omitBackground: true });
  console.log('✓', out);
}

for (const p of PROJECTS) {
  const cover = SHOTS[p.slug]?.cover;
  if (!cover) { console.log('– no cover for', p.slug); continue; }
  const ink = dark(p.plate) ? '#f3efe4' : '#0b0b0a';
  await render(`
    <div style="width:1200px;height:630px;background:${p.plate};color:${ink};position:relative;font-family:IS">
      <div style="position:absolute;left:64px;top:52px;right:300px">
        <p style="font-size:54px;font-weight:600;letter-spacing:-.02em;line-height:1">${esc(p.title)}</p>
        <p style="font-family:DM;font-size:17px;text-transform:uppercase;margin-top:16px;opacity:.72">${esc(p.type)}</p>
      </div>
      <div style="position:absolute;right:64px;top:58px;width:118px;fill:${ink}">${MARK}</div>
      <div style="position:absolute;left:64px;right:64px;top:196px;height:470px;border-radius:12px 12px 0 0;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.28)">
        <img src="${cover.src}" style="width:100%;display:block">
      </div>
    </div>`, `public/media/${p.slug}/og.jpg`);
}

const icon = (size, pad, radius) => `
  <div style="width:${size}px;height:${size}px;background:#0b0b0a;border-radius:${radius}px;display:grid;place-items:center">
    <div style="width:${size - pad * 2}px;fill:#f3efe4;line-height:0">${MARK}</div>
  </div>`;
await page.setViewportSize({ width: 512, height: 512 });
await render(icon(512, 88, 0), 'public/logo.png', { x: 0, y: 0, width: 512, height: 512 });
await render(icon(180, 30, 0), 'public/apple-touch-icon.png', { x: 0, y: 0, width: 180, height: 180 });
await render(`<img src="/ff-favicon.svg" style="width:48px;height:48px;display:block">`, 'public/favicon-48.png', { x: 0, y: 0, width: 48, height: 48 });
await b.close();
