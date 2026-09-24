// Capture reference states of phantom.land (headless, swiftshader GL).
import fs from 'node:fs';
import { launch, sleep } from './browser.mjs';
const out = process.argv[2] || 'docs/reference/2026-09-24/shots';
fs.mkdirSync(out, { recursive: true });
const browser = await launch();
async function ctxFor(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, userAgent: w < 600 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined, isMobile: w < 600, hasTouch: w < 600 });
  return ctx;
}
async function decline(page) { try { await page.getByRole('button', { name: 'Decline' }).first().click({ timeout: 4000 }); } catch {} }
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await ctxFor(w, h); const page = await ctx.newPage();
  await page.goto('https://www.phantom.land/', { waitUntil: 'domcontentloaded' });
  for (const t of [300, 900, 1600, 2500, 4000]) { await sleep(t === 300 ? 300 : t - [300, 900, 1600, 2500, 4000][[300, 900, 1600, 2500, 4000].indexOf(t) - 1]); await page.screenshot({ path: `${out}/intro-${t}-${w}.png` }); }
  await decline(page); await sleep(5000);
  await page.screenshot({ path: `${out}/home-${w}.png` });
  if (w > 600) {
    await page.mouse.move(w / 2, h / 2); await sleep(1200); await page.screenshot({ path: `${out}/home-hover-${w}.png` });
    await page.mouse.down(); await page.mouse.move(w / 2 - 200, h / 2 - 100, { steps: 10 }); await sleep(400); await page.screenshot({ path: `${out}/home-drag-${w}.png` }); await page.mouse.up(); await sleep(1500);
  }
  // list view
  const btns = await page.$$('[class*=Toggle] button');
  if (btns[1]) { await btns[1].click(); await sleep(2000); await page.screenshot({ path: `${out}/list-${w}.png` }); await btns[0].click(); await sleep(1500); }
  // filter
  try { await page.getByRole('button', { name: 'Filter' }).click({ timeout: 3000 }); await sleep(1500); await page.screenshot({ path: `${out}/filter-${w}.png` }); fs.writeFileSync(`${out}/filter-${w}.html`, await page.content()); await page.keyboard.press('Escape'); await page.getByRole('button', { name: /Close|Filter/ }).first().click({ timeout: 2000 }).catch(() => {}); await sleep(1000); } catch (e) { console.log('filter', e.message); }
  for (const p of ['about', 'careers', 'projects/casamigos-world-cup-2026', 'contact']) {
    await page.goto('https://www.phantom.land/' + p, { waitUntil: 'domcontentloaded' }); await decline(page); await sleep(4000);
    const name = p.replace(/\//g, '_');
    await page.screenshot({ path: `${out}/${name}-${w}.png` });
    await page.screenshot({ path: `${out}/${name}-full-${w}.png`, fullPage: true }).catch(() => {});
    fs.writeFileSync(`${out}/${name}-${w}.html`, await page.content());
    console.log(p, w, await page.evaluate(() => [document.title, document.documentElement.scrollHeight]));
  }
  await ctx.close();
}
await browser.close();
