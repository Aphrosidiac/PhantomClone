// Measures border-line stability while the grid moves.
// For N frames during a slow drag, scans one screen row and one column; for each grid line crossing
// it records the line's peak brightness. Flicker = that peak varying frame to frame.
import { PNG } from 'pngjs';
import { launch, sleep } from './browser.mjs';
const url = process.argv[2] || 'http://localhost:3175/';
const b = await launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); await sleep(10000);
await p.mouse.move(720, 450); await sleep(1500);
await p.mouse.down();
const peaks = [];
for (let f = 0; f < 24; f++) {
  await p.mouse.move(720 - f * 3.3, 450 - f * 1.7); // slow drag: ~3px per frame, sub-tile
  await sleep(120);
  const png = PNG.sync.read(await p.screenshot({ clip: { x: 300, y: 440, width: 840, height: 1 } }));
  // luminance along the row
  const L = []; for (let x = 0; x < 840; x++) { const i = x * 4; L.push((png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3); }
  // grid lines on the row sit in dark label/gap zones: find local maxima that are narrow (<=4px) and bright vs ±4px
  const found = [];
  for (let x = 5; x < 835; x++) {
    const bg = Math.min(L[x - 5], L[x + 5]);
    if (L[x] >= L[x - 1] && L[x] >= L[x + 1] && L[x] - bg > 8 && bg < 40 && L[x] < 140) found.push([x + 300, Math.round(L[x]), Math.round(L[x] - bg)]);
  }
  peaks.push(found);
}
await p.mouse.up();
for (const [i, f] of peaks.entries()) console.log(String(i).padStart(2), f.map((v) => `x${v[0]}:${v[2]}`).join('  '));
// summary: contrast of the strongest thin peak per frame
const c = peaks.map((f) => f.length ? Math.max(...f.map((v) => v[2])) : 0);
const mean = c.reduce((a, b) => a + b, 0) / c.length;
console.log('peak contrast per frame:', c.join(' '));
console.log('min', Math.min(...c), 'max', Math.max(...c), 'mean', mean.toFixed(1), 'spread', ((Math.max(...c) - Math.min(...c)) / mean * 100).toFixed(0) + '%');
await b.close();
