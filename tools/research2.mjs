import fs from 'node:fs';
import { launch, sleep } from './browser.mjs';
const out = 'docs/reference/2026-09-24/shots/scroll'; fs.mkdirSync(out, { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([]);
const page = await ctx.newPage();
await page.goto('https://www.phantom.land/', { waitUntil: 'domcontentloaded' }); await sleep(7000);
await page.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (b.innerText.trim() === 'Decline') b.click(); }); });
await sleep(800);
await page.evaluate(() => { [...document.querySelectorAll('button')].find(b => b.innerText.trim()==='Filter')?.click(); }); await sleep(1500);
await page.screenshot({ path: `${out}/filter.png` });
fs.writeFileSync(`${out}/filter.txt`, await page.evaluate(() => document.body.innerText));
for (const p of ['about', 'careers', 'projects/casamigos-world-cup-2026', 'projects/free-spirits-center']) {
  await page.goto('https://www.phantom.land/' + p, { waitUntil: 'domcontentloaded' }); await sleep(4000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const n = p.replace(/\//g, '_');
  for (let y = 0; y < H; y += 800) {
    await page.mouse.wheel(0, 800); await sleep(1100);
    await page.screenshot({ path: `${out}/${n}-${String(y).padStart(5, '0')}.png` });
  }
  console.log(p, H, await page.evaluate(() => [window.scrollY, !!window.lenis, getComputedStyle(document.documentElement).scrollBehavior]));
}
await browser.close();
