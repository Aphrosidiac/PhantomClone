// node tools/shot.mjs <url> <out.png> [WxH] [waitMs] [script]
import { launch, sleep } from './browser.mjs';
const [,, url, out, size = '1440x900', wait = '6000', script] = process.argv;
const [w, h] = size.split('x').map(Number);
const b = await launch();
const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 600, hasTouch: w < 600 });
const p = await ctx.newPage();
const logs = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); }); p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await p.goto(url, { waitUntil: 'load' });
await sleep(+wait);
if (script) { const r = await p.evaluate(script); if (r !== undefined) console.log(JSON.stringify(r)); await sleep(1500); }
await p.screenshot({ path: out });
if (logs.length) console.log(logs.join('\n'));
await b.close();
