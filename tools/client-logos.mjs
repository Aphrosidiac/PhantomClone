// node tools/client-logos.mjs
// Renders the About clients strip's SmoothSail and Indahnya lockups to transparent PNGs for a dark
// ground. Neither product ships a lockup file for dark backgrounds: each repo draws its logo as a
// mark plus live text. So this uses each repo's own mark (SmoothSail/brand/lockup.svg,
// Indahnya/app/ui/components/Logo.vue) and wordmark type (Hanken Grotesk 600 / Inter 600), and
// swaps only the dark ink colour for white. LEWIX and Ascend MY are kit files, copied verbatim.
import { chromium } from 'playwright';

const S = 4; // render scale → crisp at the strip's ~28px height on 2× screens
const out = (f) => new URL(`../public/brand/${f}`, import.meta.url).pathname;
const LOGOS = {
  'smoothsail-lockup-on-dark.png': `
    <svg viewBox="0 0 168 32" width="${168 * S}" height="${32 * S}">
      <path d="M15 8.2 L15 22.5 H5.6 C8.8 17.2 11.8 12.3 15 8.2 Z" fill="#4FB6A9"/>
      <path d="M17.6 2.6 L17.6 22.5 H28.4 C25.6 14 22.3 7.4 17.6 2.6 Z" fill="#0F8B7E"/>
      <path d="M2 26.6 q3.5 -3 7 0 t7 0 t7 0 t7 0" fill="none" stroke="#0F8B7E" stroke-width="2.1" stroke-linecap="round"/>
      <text x="40" y="22" font-family="'Hanken Grotesk'" font-size="21" font-weight="600" letter-spacing="-0.42"><tspan fill="#FFFFFF">Smooth</tspan><tspan fill="#0F8B7E">Sail</tspan></text>
    </svg>`,
  'indahnya-lockup-on-dark.png': `
    <span style="display:inline-flex;align-items:center;gap:${10 * S}px">
      <svg viewBox="0 0 32 32" width="${30 * S}" height="${30 * S}"><rect width="32" height="32" rx="9" fill="#7dd56f"/><g fill="#1a1a1a"><circle cx="16" cy="9.5" r="4.2"/><circle cx="16" cy="22.5" r="4.2"/><circle cx="9.5" cy="16" r="4.2"/><circle cx="22.5" cy="16" r="4.2"/></g><circle cx="16" cy="16" r="2.6" fill="#7dd56f"/></svg>
      <span style="font-family:Inter;font-weight:600;font-size:${17 * S}px;letter-spacing:-.02em;color:#fff;line-height:1">Indahnya</span>
    </span>`,
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 400 } });
for (const [file, html] of Object.entries(LOGOS)) {
  await p.setContent(`<!doctype html><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600&family=Inter:wght@600&display=block">
    <style>body{margin:0;background:transparent}#l{display:inline-block;padding:2px;line-height:0}</style><div id="l">${html}</div>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.locator('#l').screenshot({ path: out(file), omitBackground: true });
  console.log('✓', file);
}
await b.close();
