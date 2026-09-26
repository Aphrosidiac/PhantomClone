import { chromium } from 'playwright';
const S = '/private/tmp/claude-501/-Users-fakhrul-Desktop-dev/1b2cafa7-5690-4033-818b-a15d3ac63224/scratchpad/';
const tag = process.argv[2] || 'ab';
const b = await chromium.launch();
for (const path of ['/about', '/about/approach']) for (const [w, h, t] of [[1440, 900, 'd'], [1100, 800, 't'], [390, 844, 'm']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:3175' + path + '?ss=1', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4500);
  await p.evaluate(async () => { document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')); document.querySelectorAll('img[loading=lazy]').forEach((i) => i.loading = 'eager'); await new Promise((r) => setTimeout(r, 1500)); });
  const name = `${tag}-${path.replace(/\//g, '_')}-${t}.png`;
  await p.screenshot({ path: S + name, fullPage: true });
  console.log(name, await p.evaluate(() => document.documentElement.scrollWidth + 'x' + document.documentElement.scrollHeight));
  await p.close();
}
await b.close();
