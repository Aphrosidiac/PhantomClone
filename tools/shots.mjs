// Capture the project-page screenshots from the live sites as case-study rows: full-width 16:9
// frames, 2-up frames side by side and 3-up phone screens (414x670, a 0.62 portrait), all at 2x+ so a full-width row is sharp on a retina screen.
//
// usage: node tools/shots.mjs [slug ...]            capture raw frames into $SHOTS_RAW (default .shots-raw/)
//        node tools/shots.mjs --encode [slug ...]   encode them into public/media/<slug>/ + src/shots.json
// Recipes (what to shoot, where, and how to get the page into that state) live in tools/shots.recipes.mjs.
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { RECIPES } from './shots.recipes.mjs';

const RAW = process.env.SHOTS_RAW || '.shots-raw';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const args = process.argv.slice(2);
const encode = args.includes('--encode');
const only = args.filter((a) => !a.startsWith('--'));
const slugs = only.length ? only : Object.keys(RECIPES);

// viewports: width x height in CSS px, device scale -> the raw frame size
export const DEVICES = {
  wide: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 },          // 3200x1800
  mid: { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 20 / 9 },      // 3200x1800
  narrow: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2.5 },      // 3200x1800
  phone: {
    viewport: { width: 414, height: 670 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,             // 1242x2010
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const scrollY = (p) => p.evaluate(() => Math.round(window.scrollY || document.scrollingElement.scrollTop));

// wheel toward a target so smooth-scroll libraries (Lenis etc.) and scroll-triggered reveals run as for a visitor
async function wheelTo(p, target, vp) {
  await p.mouse.move(vp.width / 2, vp.height / 2);
  for (let k = 0; k < 200; k++) {
    const d = (await target()) ?? 0;
    if (Math.abs(d) < 3) break;
    await p.mouse.wheel(0, Math.max(-400, Math.min(400, d)));
    await sleep(160);
    if (k > 3 && Math.abs(((await target()) ?? 0) - d) < 1) { // wheel ignored (native touch scroll, or end of page)
      await p.evaluate((dy) => window.scrollBy(0, dy), d);
      await sleep(160);
      if (Math.abs(((await target()) ?? 0) - d) < 1) break;
    }
  }
}

const locate = (p, sel) => (sel.startsWith('text=') ? p.getByText(sel.slice(5), { exact: false }).first() : p.locator(sel).first());

async function step(p, s, vp) {
  const [op, a, b] = s;
  if (op === 'wait') return sleep(a);
  if (op === 'y') return wheelTo(p, async () => a - (await scrollY(p)), vp);
  if (op === 'to') { // bring element top to fraction b (default .15) of the viewport
    const el = locate(p, a);
    await el.waitFor({ state: 'attached', timeout: 15000 });
    return wheelTo(p, async () => { const r = await el.boundingBox(); return r ? r.y - vp.height * (b ?? 0.15) : 0; }, vp);
  }
  if (op === 'wheel') { await p.mouse.move(vp.width / 2, vp.height / 2); for (let i = 0; i < (b ?? 1); i++) { await p.mouse.wheel(0, a); await sleep(120); } return; }
  if (op === 'click') return locate(p, a).click({ timeout: 15000, force: true });
  if (op === 'hover') return locate(p, a).hover({ timeout: 15000, force: true });
  if (op === 'tap') return p.mouse.click(a * vp.width, b * vp.height);
  if (op === 'mouse') return p.mouse.move(a * vp.width, b * vp.height, { steps: 12 });
  if (op === 'drag') { const [x0, y0, x1, y1] = a; await p.mouse.move(x0 * vp.width, y0 * vp.height); await p.mouse.down(); await p.mouse.move(x1 * vp.width, y1 * vp.height, { steps: 30 }); return p.mouse.up(); }
  if (op === 'key') return p.keyboard.press(a);
  if (op === 'eval') return p.evaluate(a);
  if (op === 'goto') return p.goto(a, { waitUntil: 'load', timeout: 60000 });
  throw new Error(`unknown step ${op}`);
}

async function capture(slug) {
  const r = RECIPES[slug];
  const out = path.join(RAW, slug); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
  const ctxs = {};
  let page = null, pageKey = '';
  for (const shot of r.shots) {
    if (process.env.SHOT && !new RegExp(process.env.SHOT).test(shot.id)) continue; // debugging a single shot
    const dev = shot.device || r.device || 'mid';
    const url = shot.url ? new URL(shot.url, r.base).href : r.base; // base may carry a path
    const key = `${dev} ${url}`;
    if (!ctxs[dev]) ctxs[dev] = await browser.newContext({ ...DEVICES[dev], reducedMotion: 'no-preference' });
    if (shot.fresh || key !== pageKey) {
      if (page) await page.close();
      page = await ctxs[dev].newPage(); pageKey = key;
      await page.goto(url, { waitUntil: 'load', timeout: 90000 }).catch((e) => console.warn(slug, shot.id, 'goto', e.message));
      await sleep(shot.boot ?? r.boot ?? 4000);
      for (const s of r.init || []) await step(page, s, DEVICES[dev].viewport).catch((e) => console.warn(slug, 'init', s[0], e.message));
      await sleep(r.afterInit ?? 0);
    }
    const vp = DEVICES[dev].viewport;
    for (const s of shot.steps || []) await step(page, s, vp).catch((e) => console.warn(slug, shot.id, s[0], e.message));
    await sleep(shot.settle ?? r.settle ?? 1800);
    await page.mouse.move(vp.width - 2, vp.height - 2).catch(() => {}); // park the cursor off any hover target...
    if (shot.cursor) await page.mouse.move(shot.cursor[0] * vp.width, shot.cursor[1] * vp.height); // ...unless the hover is the point
    if (shot.cursor) await sleep(900);
    const file = path.join(out, `${shot.id}.jpg`); // max-quality JPEG: a PNG at 3200px is 3x the disk for no visible gain after the webp encode
    await page.screenshot({ path: file, type: 'jpeg', quality: 97, ...(shot.clip ? { clip: { x: shot.clip[0], y: shot.clip[1], width: shot.clip[2], height: shot.clip[3] } } : {}) });
    console.log(slug, shot.id, dev, `y=${await scrollY(page)}`);
  }
  await browser.close();
}

// ---- encode: raw frame -> webp at two widths, and the manifest the project page reads
const ASPECT = { full: [16, 9], pair: [16, 9], trio: [414, 670] }; // pairs are two whole frames: a crop cut text mid-word
const WIDTHS = { full: [2880, 1440], pair: [1600, 800], trio: [1242, 621] }; // 2880 covers a 1440 CSS px row at 2x
const ffmpeg = (a) => { const x = spawnSync(FFMPEG, ['-v', 'error', '-y', ...a], { stdio: 'inherit' }); if (x.status !== 0) throw new Error('ffmpeg failed'); };
const probe = (f) => { const r = spawnSync(FFMPEG.replace(/ffmpeg(.exe)?$/i, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f], { encoding: 'utf8' }); const [w, h] = r.stdout.trim().split(',').map(Number); return { w, h }; };

function encodeSlug(slug) {
  const r = RECIPES[slug];
  const dir = path.join('public/media', slug); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^(w-\d+\.jpg|s-.*\.webp)$/.test(f)) fs.rmSync(path.join(dir, f));
  const byId = Object.fromEntries(r.shots.map((s) => [s.id, s]));
  const item = (id, kind) => {
    const s = byId[id]; if (!s) throw new Error(`${slug}: no shot ${id}`);
    const src = path.join(RAW, slug, `${id}.jpg`); const { w, h } = probe(src);
    const [aw, ah] = ASPECT[kind];
    // crop to the row's aspect: s.focus = [fx, fy] centre of the crop as a fraction of the frame
    const [fx, fy] = s.focus || [0.5, 0.5];
    let cw = w, ch = Math.round((w * ah) / aw); if (ch > h) { ch = h; cw = Math.round((h * aw) / ah); }
    const cx = Math.round(Math.min(w - cw, Math.max(0, fx * w - cw / 2))), cy = Math.round(Math.min(h - ch, Math.max(0, fy * h - ch / 2)));
    const [big, small] = WIDTHS[kind].map((x) => Math.min(x, cw));
    const name = `s-${id}`;
    for (const [width, suffix] of [[big, ''], [small, '-sm']]) {
      ffmpeg(['-i', src, '-vf', `crop=${cw}:${ch}:${cx}:${cy},scale=${width}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', String(s.quality ?? 80), '-compression_level', '6', '-preset', s.preset || 'picture', path.join(dir, `${name}${suffix}.webp`)]);
    }
    const u = new URL(s.url || '', r.base); // the address shown in the browser-window frame
    return { src: `/media/${slug}/${name}.webp`, sm: `/media/${slug}/${name}-sm.webp`, w: big, h: Math.round((big * ch) / cw), smw: small, alt: s.alt, page: (u.host + u.pathname).replace(/\/$/, '') };
  };
  const cover = item(r.cover, 'full');
  const rows = r.rows.map(([kind, ...ids]) => ({ kind, items: ids.map((id) => item(id, kind)) }));
  const kb = fs.readdirSync(dir).filter((f) => f.startsWith('s-')).reduce((a, f) => a + fs.statSync(path.join(dir, f)).size, 0) / 1024;
  console.log(slug, 'encoded', rows.reduce((a, x) => a + x.items.length, 1), 'shots', Math.round(kb), 'KB');
  return { cover, rows };
}

if (encode) {
  const file = 'src/shots.json';
  const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  for (const s of slugs) all[s] = encodeSlug(s);
  fs.writeFileSync(file, JSON.stringify(all, null, 1) + '\n');
} else {
  for (const s of slugs) await capture(s);
}
