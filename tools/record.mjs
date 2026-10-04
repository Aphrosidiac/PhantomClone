// Record a site's page, standing still, as source footage for the grid's video atlas (tools/video-atlas.mjs).
// Same page viewport as the Chrome screen recordings the other clips were cut from (1904x944 at 1x), but
// without the browser around it — give the clip `crop: 'page'` in CLIPS. Chrome's screencast delivers a
// frame whenever the page repaints; each frame is held until the next, then resampled to a constant 60 fps.
// The HTTP cache is warmed first so the film shows the site's own entrance, not the network.
//
// usage: node tools/record.mjs <url> <out.mp4> [seconds=16]
// SCROLL=start,px,dur also scrolls it while filming: from `start` s after navigation, wheel down `px` CSS px
// over `dur` s in even steps (wheel, so smooth-scroll libraries and scrubbed timelines run as for a visitor).
// Indahnya's hero loop was filmed this way.
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [url, out, secs = '16'] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node tools/record.mjs <url> <out.mp4> [seconds]'); process.exit(1); }
const REC = +secs;
const VIEW = { width: 1904, height: 944 };
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-record-'));

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
const warm = await ctx.newPage();
await warm.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await warm.waitForTimeout(2000);
if (process.env.SCROLL) { // load what the scroll will reveal, so the film shows the animation, not images arriving
  const [, px] = process.env.SCROLL.split(',').map(Number);
  await warm.mouse.move(VIEW.width / 2, VIEW.height / 2);
  for (let y = 0; y < px + VIEW.height; y += 400) { await warm.mouse.wheel(0, 400); await warm.waitForTimeout(120); }
  await warm.waitForLoadState('networkidle').catch(() => {});
  await warm.waitForTimeout(2000);
}
await warm.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
await warm.close();

const page = await ctx.newPage();
await page.goto('about:blank');
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  frames.push({ data, t: metadata.timestamp });
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: VIEW.width, maxHeight: VIEW.height, everyNthFrame: 1 });
const tNav = Date.now() / 1000;
await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
const scroll = (async () => {
  if (!process.env.SCROLL) return;
  const [start, px, dur] = process.env.SCROLL.split(',').map(Number);
  await page.waitForTimeout(start * 1000);
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2);
  const n = Math.max(1, Math.round(dur / 0.05));
  for (let i = 0; i < n; i++) { await page.mouse.wheel(0, px / n); await page.waitForTimeout(50); }
})();
await page.waitForTimeout(REC * 1000);
await scroll;
await cdp.send('Page.stopScreencast');
await browser.close();

// concat list: each frame held until the next one arrived
const list = [];
frames.forEach((f, i) => {
  const file = path.join(tmp, `f${String(i).padStart(5, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
  const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(f.t + 1 / 60, tNav + REC);
  list.push(`file '${file}'`, `duration ${(next - f.t).toFixed(5)}`);
});
list.push(`file '${path.join(tmp, `f${String(frames.length - 1).padStart(5, '0')}.jpg`)}'`);
fs.writeFileSync(path.join(tmp, 'list.txt'), list.join('\n'));
const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'),
  '-vf', `fps=60,scale=${VIEW.width}:${VIEW.height}:flags=lanczos,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-g', '30', '-movflags', '+faststart', out], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });
const gaps = frames.slice(1).map((f, i) => f.t - frames[i].t);
console.log(`${frames.length} frames over ${(frames.at(-1).t - frames[0].t).toFixed(1)} s, first ${(frames[0].t - tNav).toFixed(2)} s after navigation,`,
  `longest hold ${(Math.max(...gaps) * 1000).toFixed(0)} ms →`, r.status === 0 ? out : 'ffmpeg failed');
