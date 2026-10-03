// Sticker peel — a round holo vinyl sticker you can peel, carry, throw, and leave lying on the page.
// Full write-up: docs/STICKER.md.
//
//   peel   drag the rim: the sticker folds back over itself. The fold is the perpendicular bisector of
//          grab point → pointer; the lifted flap is the same box mirrored across it (one matrix()).
//   pop    pull past most of it and it comes off in your fingers: the flap hands over to a free body that
//          starts exactly where the mirrored flap was (a mirror = a rotation + rotateX(180°)) and stays
//          back-up — the back is printed with a pitch whose lime "→ make mine sticky" pill sits under the
//          resting curl, so its arrow peeks out: the reason to peel.
//   carry  the grab point follows the pointer; the body trails behind the motion like a card dragged by
//          its corner (drag on the centre → torque about the grab point).
//   throw  release velocity + spin carry it through the air (a throw turns over once or twice on the way,
//          still landing back-up); the in-flight layer rides the page scroll, so it lands where it was thrown;
//          flung hard it leaves the screen, dropped gently it lands back-up and lies on the page with the
//          pitch readable and the pill live (it opens the contact overlay). Pick it up to toss it again.
//          A fresh sticker slaps onto the cover meanwhile.
//   hint   the curl lifts further under a hovering pointer, and every few seconds nudges up on its own as
//          if something under it were pushing.
//
// Light: one fixed light up-left of the screen, never the cursor. What moves the reflection is the
// sticker's orientation to your eye — scrolling slides the reflection across it (it is fixed in the
// viewport while the sticker travels), hovering the sticker presses it and tips it a few degrees, and in
// your fingers / in the air its own spin and flip turn it under the light.
//
// Lazy-loaded by main.js only on pages with a .sticker (Hai Awan's cover); the returned cleanup removes
// every sticker this page spawned.

const lerp = (a, b, t) => a + (b - a) * t;
const outCubic = (k) => 1 - (1 - k) ** 3;
const outBack = (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2;
const DETACH = 0.82;   // pull length (× diameter) at which it comes off in your fingers
const RELEASE = 0.55;  // let go past this and it comes off anyway
const MAX_LOOSE = 6;   // stickers lying around the page before the oldest goes

const instances = new Set();
const loose = [];
let uid = 0;

// keep the part of a convex polygon where g(p) >= 0 (one Sutherland–Hodgman pass)
function clipPoly(poly, g) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], gp = g(p), gq = g(q);
    if (gp >= 0) out.push(p);
    if ((gp >= 0) !== (gq >= 0)) { const t = gp / (gp - gq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
  }
  return out;
}
const polygon = (pts) => (pts.length < 3 ? 'polygon(0 0,0 0,0 0)' : `polygon(${pts.map((p) => `${p[0].toFixed(2)}px ${p[1].toFixed(2)}px`).join(',')})`);
// each copy of the sticker needs its own id for the rim text path
const fresh = (html) => { const id = `stk-rim-${++uid}`; return html.replace(/stk-rim[\w-]*/g, id); };
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// release velocity from the last ~60 ms of pointer samples, in px/ms: a longer window averages the flick
// with the slow carry before it and a hard throw lands a few hundred px away
function velocityOf(t, now) {
  if (t.length < 2 || now - t[t.length - 1].t > 70) return { x: 0, y: 0 };
  let i = t.length - 1; while (i > 0 && now - t[i - 1].t < 60) i--;
  const a = t[Math.min(i, t.length - 2)], b = t[t.length - 1], dt = Math.max(8, b.t - a.t);
  return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
}
const sample = (trail, e) => { trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp }); if (trail.length > 12) trail.shift(); };

// The light's reflection, as an offset from the sticker's centre in % of its size, in screen axes. For a
// flat sticker under a fixed light and a fixed eye the reflection is a fixed point of the viewport (up and
// a little left of centre), so a sticker scrolling past slides under it. Tipping the surface swings the
// reflection away from the side pressed down, at 2× the tilt (6% per degree here).
const GLINT = { x: 0.55, y: 0.12, gain: 70, perDeg: 6 };
function glint(cx, cy, rx = 0, ry = 0) {
  return {
    x: (innerWidth * GLINT.x - cx) / (innerWidth / 2) * GLINT.gain - ry * GLINT.perDeg,
    y: (innerHeight * GLINT.y - cy) / (innerHeight / 2) * GLINT.gain + rx * GLINT.perDeg,
  };
}
// --mx/--my: where the hot spot sits on the art; --la: the light's bearing, which turns the rainbow wedges.
// g is in screen axes; the art is drawn rotated by `turn`, so it is rotated back into the art's frame.
function shadeTo(el, g, turn) {
  const c = Math.cos(-turn), s = Math.sin(-turn);
  const lx = Math.max(-110, Math.min(110, g.x * c - g.y * s)), ly = Math.max(-110, Math.min(110, g.x * s + g.y * c));
  el.style.setProperty('--mx', (50 + lx).toFixed(1));
  el.style.setProperty('--my', (50 + ly).toFixed(1));
  el.style.setProperty('--la', (Math.atan2(ly, lx) * 180 / Math.PI).toFixed(1));
}

export function mountPeel(root) {
  attach(root, { intro: true, template: root.innerHTML });
  return () => { for (const kill of [...instances]) kill(); loose.length = 0; };
}

function attach(root, { intro, template }) {
  const reduced = reducedMotion();
  const front = root.querySelector('.stk-front');
  const back = root.querySelector('.stk-back');
  const tiltEl = root.querySelector('.stk-tilt');
  const shadeEl = root.querySelector('.stk-shade');
  const tilt = (parseFloat(getComputedStyle(root).getPropertyValue('--tilt')) || 0) * Math.PI / 180;
  let S = front.offsetWidth;
  let C = [0, 0], v = { x: 0, y: 0 }, drag = null, anim = 0, gone = false, timer = 0, shadeRaf = 0;
  const press = { rx: 0, ry: 0, tx: 0, ty: 0, raf: 0 };

  const box = () => [[0, 0], [S, 0], [S, S], [0, S]];
  // at rest the lower-right rim is lifted a little, so it reads as something you can peel
  const rest = () => ({ c: [S * (0.5 + Math.SQRT1_2 / 2), S * (0.5 + Math.SQRT1_2 / 2)], v: { x: -S * 0.18, y: -S * 0.23 } });

  function fold() {
    const len = Math.hypot(v.x, v.y);
    const n = { x: v.x / len, y: v.y / len };
    const M = { x: C[0] + v.x / 2, y: C[1] + v.y / 2 };
    return { len, n, M, md: M.x * n.x + M.y * n.y };
  }
  function render() {
    if (Math.hypot(v.x, v.y) < 0.5) { front.style.clipPath = ''; back.style.display = 'none'; return; }
    const { n, M, md } = fold();
    const side = (p) => p[0] * n.x + p[1] * n.y - md;
    front.style.clipPath = polygon(clipPoly(box(), side));
    back.style.display = 'block';
    back.style.clipPath = polygon(clipPoly(box(), (p) => -side(p)));
    const a = 1 - 2 * n.x * n.x, b = -2 * n.x * n.y, d = 1 - 2 * n.y * n.y;
    back.style.transform = `matrix(${a},${b},${b},${d},${2 * md * n.x},${2 * md * n.y})`;
    // the adhesive side: a bright crease at the fold, falling off toward the lifted edge
    const th = Math.atan2(-n.x, n.y);
    const L = Math.abs(S * Math.sin(th)) + Math.abs(S * Math.cos(th));
    const f = (M.x - S / 2) * -n.x + (M.y - S / 2) * -n.y + L / 2;
    shadeEl.style.backgroundImage = `linear-gradient(${th}rad, rgba(0,0,0,.16) ${f - 1}px, rgba(255,255,255,.95) ${f + 3}px, rgba(255,255,255,.35) ${f + S * 0.1}px, rgba(0,0,0,0) ${f + S * 0.32}px, rgba(0,0,0,.08) ${f + S * 1.2}px)`;
  }
  function tween(to, ms, ease, done) {
    cancelAnimationFrame(anim);
    if (reduced) ms = 1;
    const from = { ...v }, t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = ease(k);
      v = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) };
      render();
      if (k < 1) anim = requestAnimationFrame(tick); else done?.();
    };
    anim = requestAnimationFrame(tick);
  }
  const settle = () => { const r = rest(); tween({ x: 0, y: 0 }, 220, outCubic, () => { C = r.c; tween(r.v, 420, outBack); }); };
  // the hint: lift the resting curl by f (1 = rest), only while it sits at its resting corner
  const atRest = () => !drag && !gone && Math.hypot(C[0] - rest().c[0], C[1] - rest().c[1]) < 1;
  function curlTo(f, ms = 280, ease = outCubic, done) {
    if (!atRest()) return;
    const r = rest(); tween({ x: r.v.x * f, y: r.v.y * f }, ms, ease, done);
  }
  let nearCurl = false, inView = true;
  const io = new IntersectionObserver(([en]) => { inView = en.isIntersecting; });
  io.observe(root);
  let nudgeT = 0;
  function nudge() {
    nudgeT = setTimeout(nudge, 5200 + Math.random() * 3000);
    if (reduced || !inView || nearCurl || !atRest() || document.hidden) return;
    curlTo(1.75, 340, outCubic, () => curlTo(1, 620, outBack));
  }

  // pointer → the sticker's own square (it is drawn rotated by --tilt about its centre)
  const centre = () => { const r = front.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  function local(x, y) {
    const o = centre(), dx = x - o.x, dy = y - o.y, c = Math.cos(-tilt), s = Math.sin(-tilt);
    return { x: S / 2 + dx * c - dy * s, y: S / 2 + dx * s + dy * c };
  }
  function toScreen(p, o) {
    const dx = p[0] - S / 2, dy = p[1] - S / 2, c = Math.cos(tilt), s = Math.sin(tilt);
    return { x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c };
  }

  // presses land on the root's square (the curl is drawn by a layer that ignores the pointer, and it is
  // the first thing people grab), so anything inside the disc counts
  function down(e) {
    if (gone || e.button > 0) return;
    const q = local(e.clientX, e.clientY);
    if (Math.hypot(q.x - S / 2, q.y - S / 2) > S * 0.52) return;
    e.preventDefault();
    cancelAnimationFrame(anim); clearTimeout(timer);
    pressTo(0, 0, true); nearCurl = false;
    const p = local(e.clientX, e.clientY);
    // grab the rim nearest the finger
    const dx = p.x - S / 2, dy = p.y - S / 2, l = Math.hypot(dx, dy) || 1;
    const nc = [S / 2 + dx / l * S / 2, S / 2 + dy / l * S / 2];
    if (Math.hypot(nc[0] - C[0], nc[1] - C[1]) > S * 0.12) { C = nc; v = { x: 0, y: 0 }; }
    drag = { p0: p, v0: { ...v }, trail: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }], free: null };
    try { root.setPointerCapture(e.pointerId); } catch {}
    root.classList.add('is-held');
    render();
  }
  function move(e) {
    if (!drag) return;
    sample(drag.trail, e);
    if (drag.free) { drag.free.hold(e.clientX, e.clientY); return; }
    const p = local(e.clientX, e.clientY);
    v = { x: drag.v0.x + p.x - drag.p0.x, y: drag.v0.y + p.y - drag.p0.y };
    render();
    if (Math.hypot(v.x, v.y) > S * DETACH) detach(e.clientX, e.clientY);
  }
  function up(e) {
    if (!drag) return;
    root.classList.remove('is-held');
    if (!drag.free && Math.hypot(v.x, v.y) < S * RELEASE) { drag = null; settle(); return; }
    if (!drag.free) detach(e.clientX, e.clientY);
    drag.free.release(velocityOf(drag.trail, e.timeStamp));
    drag = null;
    timer = setTimeout(restick, reduced ? 300 : 1100);
  }

  // hand the flap over to a free body: the mirrored flap is rotate(tilt + 2·fold angle) ∘ flipY, and the
  // free body draws rotate(θ) ∘ rotateX(π) ∘ rotate(β) — so β = θ − tilt − 2·atan2(n) − π lines them up
  function detach(px, py) {
    const { n, md } = fold();
    const c = [S / 2, S / 2], k = c[0] * n.x + c[1] * n.y - md;
    const cS = toScreen([c[0] - 2 * k * n.x, c[1] - 2 * k * n.y], centre());
    const theta = Math.atan2(cS.y - py, cS.x - px);
    const beta = theta - tilt - 2 * Math.atan2(n.y, n.x) - Math.PI;
    gone = true;
    front.style.clipPath = polygon([]); back.style.display = 'none';
    drag.free = freeBody({ S, template, x: px, y: py, theta, arm: Math.hypot(cS.x - px, cS.y - py), beta });
  }

  function restick() {
    const r = rest(); C = r.c; v = { x: 0, y: 0 }; render(); gone = false;
    root.classList.remove('is-slap'); void root.offsetWidth; root.classList.add('is-slap');
    timer = setTimeout(() => tween(r.v, 420, outBack), reduced ? 0 : 520);
  }

  // light: scroll moves the sticker under the fixed reflection; the hover press tips it
  function shade() {
    const o = centre();
    shadeTo(root, glint(o.x, o.y, press.rx, press.ry), tilt);
  }
  const onScroll = () => { if (!shadeRaf) shadeRaf = requestAnimationFrame(() => { shadeRaf = 0; shade(); }); };
  // hovering presses the sticker under the pointer: that side dips up to 8°, springs back on leave
  function pressTo(tx, ty, snap) {
    press.tx = tx; press.ty = ty;
    if (snap) { press.rx = tx; press.ry = ty; cancelAnimationFrame(press.raf); pressStep(); return; }
    if (!press.raf) press.raf = requestAnimationFrame(pressStep);
  }
  function pressStep() {
    press.raf = 0;
    press.rx += (press.tx - press.rx) * 0.16; press.ry += (press.ty - press.ry) * 0.16;
    const still = Math.abs(press.tx - press.rx) < 0.02 && Math.abs(press.ty - press.ry) < 0.02;
    if (still) { press.rx = press.tx; press.ry = press.ty; }
    tiltEl.style.transform = press.rx || press.ry ? `perspective(${S * 5}px) rotateX(${press.rx.toFixed(3)}deg) rotateY(${press.ry.toFixed(3)}deg)` : '';
    shade();
    if (!still) press.raf = requestAnimationFrame(pressStep);
  }
  // measured on the root's square, which the press never moves: hit-testing the tipping face itself would
  // let the tilt slide the edge out from under a still pointer, untilt, slide back — a flicker loop
  const hover = (e) => {
    if (e.pointerType !== 'mouse' || drag || gone || reduced) return;
    const p = local(e.clientX, e.clientY), dx = p.x / S - 0.5, dy = p.y / S - 0.5;
    if (Math.hypot(dx, dy) > 0.5) { pressTo(0, 0); setNear(false); return; }
    pressTo(-dy * 16, dx * 16);
    const rc = rest().c;
    setNear(Math.hypot(p.x - rc[0], p.y - rc[1]) < S * 0.34);
  };
  function setNear(n) { if (n === nearCurl) return; nearCurl = n; curlTo(n ? 1.6 : 1, n ? 260 : 420, n ? outCubic : outBack); }
  const unhover = () => { if (!drag) { pressTo(0, 0); setNear(false); } };
  const onMove = (e) => { if (drag) move(e); else hover(e); };
  const onResize = () => { S = front.offsetWidth; if (!drag && !gone) { const r = rest(); C = r.c; v = { ...r.v }; render(); } shade(); };

  root.addEventListener('pointerdown', down);
  root.addEventListener('pointerup', up);
  root.addEventListener('pointercancel', up);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', unhover);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);

  { const r = rest(); C = r.c; v = { x: 0, y: 0 }; render(); }
  if (intro) {
    // first visit: it slaps onto the cover once the page has faded in, then the rim curls up
    root.classList.add('is-waiting');
    timer = setTimeout(() => {
      root.classList.remove('is-waiting'); root.classList.add('is-slap');
      timer = setTimeout(() => tween(rest().v, 420, outBack), reduced ? 0 : 520);
    }, reduced ? 0 : 450);
  } else {
    timer = setTimeout(() => tween(rest().v, 380, outBack), reduced ? 0 : 260);
  }
  shade();
  nudgeT = setTimeout(nudge, intro ? 4200 : 3000);

  function kill() {
    cancelAnimationFrame(anim); cancelAnimationFrame(shadeRaf); cancelAnimationFrame(press.raf); clearTimeout(timer); clearTimeout(nudgeT);
    io.disconnect();
    root.removeEventListener('pointerdown', down);
    root.removeEventListener('pointerup', up);
    root.removeEventListener('pointercancel', up);
    root.removeEventListener('pointermove', onMove);
    root.removeEventListener('pointerleave', unhover);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    instances.delete(kill);
  }
  instances.add(kill);
  return kill;
}

// ---------------------------------------------------------------- the sticker in your fingers / in the air
function freeBody({ S, template, x, y, theta, arm, beta }) {
  const reduced = reducedMotion();
  const layer = document.createElement('div');
  layer.className = 'stk-free';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--S', `${S}px`);
  const doc = new DOMParser().parseFromString(fresh(template), 'text/html');
  const art = doc.querySelector('.stk-art'), print = doc.querySelector('.stk-print');
  layer.innerHTML = '<div class="stk-free-shadow"></div><div class="stk-free-body"><div class="stk-face stk-face--front"></div><div class="stk-face stk-face--back"></div></div>';
  layer.querySelector('.stk-face--front').append(art);
  layer.querySelector('.stk-face--back').append(print);
  document.body.append(layer);
  const body = layer.querySelector('.stk-free-body'), shadow = layer.querySelector('.stk-free-shadow');

  const P = { x, y }, prev = { x, y }, vs = { x: 0, y: 0 };
  let th = theta, w = 0, h = 0, flip = Math.PI, phase = 'held', raf = 0, last = performance.now();
  // back-up (π) while held and when it lands; a throw adds whole turns in the air (1 above 20 px/frame, 2 above 60)
  const turn = { from: Math.PI, to: Math.PI, t0: 0, ms: 1 };
  let c = { x: x + Math.cos(th) * arm, y: y + Math.sin(th) * arm }, vel = { x: 0, y: 0 }, vz = 0, bump = 0;
  // the layer is fixed to the screen, so once it leaves the hand it is carried along with the page: a
  // wheel or trackpad scroll mid-flight (desktop; a phone's throwing swipe can't also scroll) would
  // otherwise leave it hanging on screen and land it wherever the screen had got to
  const scrolled = { x: scrollX, y: scrollY };

  function draw() {
    const s = 1 + 0.07 * h + bump;
    body.style.transform = `translate(${(c.x - S / 2).toFixed(2)}px,${(c.y - S / 2).toFixed(2)}px) rotate(${th}rad) perspective(${S * 6}px) rotateX(${flip}rad) rotate(${beta}rad) scale(${s.toFixed(4)})`;
    const off = 2 + h * S * 0.16;
    shadow.style.transform = `translate(${(c.x - S / 2 + off * 0.35).toFixed(2)}px,${(c.y - S / 2 + off).toFixed(2)}px) scale(${(1 + 0.04 * h).toFixed(3)}, ${(Math.max(0.15, Math.abs(Math.cos(flip))) * (1 + 0.04 * h)).toFixed(3)})`;
    shadow.style.filter = `blur(${(2 + h * S * 0.09).toFixed(1)}px)`;
    shadow.style.opacity = (0.34 - 0.14 * h).toFixed(3);
    // same fixed light: the reflection moves because the body moves, spins and flips under it.
    // Mid-flip the face is tipped about the grab→centre axis, which swings the reflection across it.
    const g = glint(c.x, c.y);
    const swing = Math.sin(flip) * 120;
    shadeTo(body, { x: g.x - Math.sin(th) * swing, y: g.y + Math.cos(th) * swing }, th + beta);
  }

  function step(now) {
    const dt = Math.min(3, (now - last) / 16.667); last = now;
    // a hard throw turns over once about the grab→centre axis, easing flat (back-up) before it lands
    const k = Math.min(1, (now - turn.t0) / turn.ms);
    flip = lerp(turn.from, turn.to, k * (2 - k));
    if (phase === 'held') {
      vs.x = lerp(vs.x, (P.x - prev.x) / dt, 0.45); vs.y = lerp(vs.y, (P.y - prev.y) / dt, 0.45);
      prev.x = P.x; prev.y = P.y;
      // drag on the centre: torque about the grab point turns the body to trail the motion
      const r = { x: Math.cos(th) * arm, y: Math.sin(th) * arm };
      const tq = (r.x * -vs.y - r.y * -vs.x) / (arm * arm);
      w = (w + tq * 0.11 * dt) * Math.pow(0.84, dt);
      th += w * dt;
      h = lerp(h, 1, 1 - Math.pow(0.8, dt));
      c = { x: P.x + Math.cos(th) * arm, y: P.y + Math.sin(th) * arm };
    }
    if (phase !== 'held') { c.x -= scrollX - scrolled.x; c.y -= scrollY - scrolled.y; }
    scrolled.x = scrollX; scrolled.y = scrollY;
    if (phase === 'air') {
      c.x += vel.x * dt; c.y += vel.y * dt;
      vel.x *= Math.pow(0.986, dt); vel.y *= Math.pow(0.986, dt);
      th += w * dt; w *= Math.pow(0.985, dt);
      vz -= 0.0042 * dt; h += vz * dt;
      const m = S;
      if (c.x < -m || c.y < -m || c.x > innerWidth + m || c.y > innerHeight + m) { kill(); return; }
      if (h <= 0) {
        // comes down past the edge of the screen: it fell off the page, nothing to stick
        if (c.x < 0 || c.y < 0 || c.x > innerWidth || c.y > innerHeight) { kill(); return; }
        h = 0; phase = 'skid'; bump = 0.045;
      }
    } else if (phase === 'skid') {
      // lands, slides a touch on the glue, stops
      c.x += vel.x * dt; c.y += vel.y * dt;
      vel.x *= Math.pow(0.62, dt); vel.y *= Math.pow(0.62, dt);
      th += w * dt; w *= Math.pow(0.6, dt);
      bump *= Math.pow(0.7, dt);
      if (Math.hypot(vel.x, vel.y) < 0.15 && k >= 1) { land(); return; }
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function land() {
    // lies back-up on the page where it came down: the print as drawn now is rotate(θ − β + π), unmirrored
    const rho = th - beta + Math.PI;
    const el = document.createElement('div');
    el.className = 'stk-loose-back is-land';
    el.style.cssText = `--S:${S}px;--rho:${(rho * 180 / Math.PI).toFixed(2)}deg;left:${(c.x + scrollX - S / 2).toFixed(1)}px;top:${(c.y + scrollY - S / 2).toFixed(1)}px`;
    const p = new DOMParser().parseFromString(fresh(template), 'text/html').querySelector('.stk-print');
    p.querySelector('.stk-cta')?.removeAttribute('tabindex');
    el.append(p);
    document.body.append(el);
    loose.push(attachBack(el, { S, template, rho }));
    if (loose.length > MAX_LOOSE) loose.shift()();
    kill();
  }

  function kill() { cancelAnimationFrame(raf); layer.remove(); instances.delete(kill); }
  instances.add(kill);
  draw();
  raf = requestAnimationFrame(step);

  return {
    hold(nx, ny) { P.x = nx; P.y = ny; },
    release(vms) {
      // px/ms → px/frame, plus the spin's own contribution at the centre
      const r = { x: Math.cos(th) * arm, y: Math.sin(th) * arm };
      let vx = vms.x * 16.667 - w * r.y, vy = vms.y * 16.667 + w * r.x;
      const sp = Math.hypot(vx, vy), cap = 95;
      if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
      vel = { x: vx, y: vy };
      w += Math.max(-0.12, Math.min(0.12, (r.x * vy - r.y * vx) / (arm * arm) * 0.25));
      vz = 0.012 + Math.min(sp, cap) * 0.00018;
      // time in the air (h = h + vz·t − 0.0021·t², in frames) sets how long the turn over takes
      const tAir = (vz + Math.sqrt(vz * vz + 4 * 0.0021 * h)) / (2 * 0.0021) * 16.667;
      Object.assign(turn, { from: flip, to: flip - 2 * Math.PI * (sp > 60 ? 2 : sp > 20 ? 1 : 0), t0: performance.now(), ms: reduced ? 1 : Math.max(240, tAir * 0.92) });
      phase = reduced ? 'skid' : 'air';
      if (reduced) { h = 0; vel = { x: 0, y: 0 }; }
    },
  };
}

// ---------------------------------------------------------------- a sticker lying back-up on the page
// grab it anywhere but the pill and it lifts back into your fingers as a free body, the same way up
function attachBack(el, { S, template, rho }) {
  let held = null;
  function down(e) {
    if (e.button > 0 || e.target.closest('a')) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const theta = Math.atan2(cy - e.clientY, cx - e.clientX), arm = Math.hypot(cx - e.clientX, cy - e.clientY);
    try { el.setPointerCapture(e.pointerId); } catch {}
    el.style.visibility = 'hidden';
    // θ − β + π = ρ keeps the print exactly where it lies
    held = { trail: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }], free: freeBody({ S, template, x: e.clientX, y: e.clientY, theta, arm, beta: theta + Math.PI - rho }) };
  }
  function move(e) { if (!held) return; sample(held.trail, e); held.free.hold(e.clientX, e.clientY); }
  function up(e) { if (!held) return; held.free.release(velocityOf(held.trail, e.timeStamp)); held = null; kill(); }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  function kill() { el.remove(); instances.delete(kill); }
  instances.add(kill);
  return kill;
}
