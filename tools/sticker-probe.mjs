// node tools/sticker-probe.mjs [base]   — the cover sticker (src/fx/peel.js), end to end, on Hai Awan's page
//
// Drives a real mouse in headless Chromium and checks each behaviour in docs/STICKER.md: the light ignores
// the cursor, scroll and the hover press move it, the curl itself can be grabbed, it pops back-up, a drop
// lies on the page (scrolls with it), the pill opens contact, a pick-up + flick spins and leaves the screen,
// and a scroll mid-flight lands it where it was thrown. Prints PASS/FAIL per check; exits 1 on any FAIL.
//
// Headless delivers mouse moves ~33 ms apart, so "flicks" here are slower than a hand's — the spin check
// uses 70 px steps to clear the one-turn threshold. Motion *feel* still needs a real hand.
import { chromium } from 'playwright';
import { sleep } from './browser.mjs';

const base = process.argv[2] || 'http://localhost:3175';
// plain headless Chromium, not browser.mjs's forced SwiftShader GL: that runs this page at a few frames a
// second, so springs never settle inside the waits and flicks measure slower than they were made
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on('pageerror', (e) => errors.push(e.message));
let failed = 0;
const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`); };

await p.goto(`${base}/projects/hai-awan`, { waitUntil: 'networkidle' });
await p.evaluate(() => { document.querySelector('.consent')?.remove(); window.scrollTo(0, 200); });
// the loader covers the page for a few seconds on a cold load and swallows presses
await p.waitForFunction(() => { const f = document.querySelector('.p-cover .stk-front'); if (!f) return false; const r = f.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.sticker'); }, null, { timeout: 20000 });
await sleep(1500);

const cover = () => p.evaluate(() => { const f = document.querySelector('.p-cover .stk-front'); const r = f.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, R: f.offsetWidth / 2 }; });
const light = () => p.evaluate(() => { const s = document.querySelector('.p-cover .sticker'); return ['--mx', '--my', '--la'].map((k) => s.style.getPropertyValue(k)).join(' '); });
const tilt = () => p.evaluate(() => document.querySelector('.p-cover .stk-tilt').style.transform || 'none');
const state = () => p.evaluate(() => ({ free: document.querySelectorAll('.stk-free').length, lying: [...document.querySelectorAll('.stk-loose-back')].map((el) => { const r = el.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, top: parseFloat(el.style.top), R: el.offsetWidth / 2 }; }) }));
// poll until a reading stops changing (springs settle at the page's own frame rate)
async function settled(read, ms = 4000) { let prev = await read(); for (let t = 0; t < ms; t += 120) { await sleep(120); const v = await read(); if (v === prev) return v; prev = v; } return prev; }
const flipNow = () => p.evaluate(() => { const b = document.querySelector('.stk-free-body'); const m = b?.style.transform.match(/rotateX\(([-\d.]+)rad\)/); return m ? +m[1] : null; });

// 1. the light is not the cursor
await p.mouse.move(200, 700); await sleep(300);
const l0 = await light();
const moved = [];
for (const [x, y] of [[60, 80], [720, 450], [1380, 860]]) { await p.mouse.move(x, y, { steps: 4 }); await sleep(200); moved.push(await light()); }
check('cursor elsewhere leaves the reflection alone', moved.every((v) => v === l0), l0);

// 2. scroll is the viewing angle
await p.evaluate(() => window.scrollTo(0, 0)); await sleep(250);
const s0 = await light();
await p.evaluate(() => window.scrollTo(0, 400)); await sleep(250);
const s1 = await light();
check('scrolling moves the reflection', s0 !== s1, `${s0} → ${s1}`);
await p.evaluate(() => window.scrollTo(0, 200)); await sleep(300);

// 3. hovering presses it (stable under a still pointer), leaving springs back
let g = await cover();
await p.mouse.move(g.cx + g.R * 0.3, g.cy - g.R * 0.3, { steps: 5 });
const t1 = await settled(tilt);
const still = []; for (let i = 0; i < 6; i++) { await sleep(50); still.push(await tilt()); }
check('hover tips it', t1 !== 'none', t1);
check('still pointer, steady tilt (no flicker loop)', still.every((t) => t === still[0]));
await p.mouse.move(200, 700, { steps: 4 });
check('leaving springs it back', (await settled(tilt)) === 'none');

// 4. the curl itself is grabbable, and it pops back-up
g = await cover();
let x = g.cx + g.R * 0.62, y = g.cy + g.R * 0.62;
await p.mouse.move(x, y); await p.mouse.down();
let popped = false;
for (let i = 0; i < 40 && !popped; i++) { x -= 7; y -= 7; await p.mouse.move(x, y); await sleep(16); popped = (await state()).free > 0; }
check('grabbing the curl peels it until it pops', popped);
check('it stays back-up in the hand', Math.abs((await flipNow()) - Math.PI) < 0.01);

// 5. a drop lies back-up on the page, and scrolls with the page
for (let i = 0; i < 12; i++) { x -= 14; y += 8; await p.mouse.move(x, y); await sleep(16); }
await sleep(300); await p.mouse.up(); await sleep(1600);
let st = await state();
check('a drop lies on the page', st.lying.length === 1 && st.free === 0);
const before = st.lying[0].cy;
await p.evaluate(() => window.scrollBy(0, 400)); await sleep(300);
st = await state();
check('it scrolls with the page', Math.abs(before - st.lying[0].cy - 400) < 2, `moved ${(before - st.lying[0].cy).toFixed(1)} px for 400`);
await p.evaluate(() => window.scrollBy(0, -400)); await sleep(300);

// 6. the pill opens the contact overlay; Escape returns with the sticker still there
const cta = await p.evaluate(() => { const a = document.querySelector('.stk-loose-back .stk-cta').getBoundingClientRect(); return [a.left + a.width / 2, a.top + a.height / 2]; });
await p.mouse.click(cta[0], cta[1]); await sleep(700);
check('the pill opens contact', await p.evaluate(() => !document.querySelector('#contact').hidden && location.pathname === '/contact'));
await p.keyboard.press('Escape'); await sleep(700);
check('Escape returns, sticker still lying', await p.evaluate(() => location.pathname === '/projects/hai-awan' && !!document.querySelector('.stk-loose-back')));

// 7. pick it up, flick it: it spins a whole turn and leaves the screen
st = await state();
x = st.lying[0].cx; y = st.lying[0].cy - st.lying[0].R * 0.75;
await p.mouse.move(x, y); await p.mouse.down(); await sleep(120);
check('a lying sticker can be picked up', (await state()).free === 1);
for (let i = 0; i < 6; i++) { x -= 8; await p.mouse.move(x, y); await sleep(16); }
for (let i = 0; i < 5; i++) { x -= 70; y += 12; await p.mouse.move(x, y); await sleep(16); }
await p.mouse.up();
const flips = []; for (let i = 0; i < 6; i++) { await sleep(40); const f = await flipNow(); if (f === null) break; flips.push(f); }
await sleep(1500);
st = await state();
check('a flick spins it', flips.some((f) => Math.abs(f - Math.PI) > 0.3), flips.map((f) => f.toFixed(2)).join(' '));
check('a flick off the screen leaves nothing behind', st.free === 0 && st.lying.length === 0);

// 8. a scroll mid-flight: it still lands where it was thrown (the in-flight layer rides the page)
await sleep(1500); // the cover gets a fresh sticker
g = await cover();
x = g.cx + g.R * 0.62; y = g.cy + g.R * 0.62;
await p.mouse.move(x, y); await p.mouse.down();
for (let i = 0; i < 40 && (await state()).free === 0; i++) { x -= 7; y -= 7; await p.mouse.move(x, y); await sleep(16); }
for (let i = 0; i < 12; i++) { x -= 14; y += 8; await p.mouse.move(x, y); await sleep(16); }
await sleep(300);
const atRelease = await p.evaluate(() => { const r = document.querySelector('.stk-free-body').getBoundingClientRect(); return r.top + r.height / 2 + scrollY; });
await p.mouse.up(); await sleep(60);
await p.evaluate(() => window.scrollBy(0, 300)); await sleep(1600);
const landed = await p.evaluate(() => { const el = document.querySelector('.stk-loose-back'); const r = el.getBoundingClientRect(); return r.top + r.height / 2 + scrollY; });
check('a scroll mid-flight lands it where it was thrown', Math.abs(landed - atRelease) < 40, `released at page y ${atRelease.toFixed(0)}, landed ${landed.toFixed(0)}`);

check('no page errors', errors.length === 0, errors.join(' | '));
await b.close();
process.exit(failed ? 1 : 0);
