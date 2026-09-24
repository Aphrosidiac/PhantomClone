// The work grid: an infinite, draggable plane of project tiles seen through a barrel lens.
// Numbers are the reference's (docs/reference-spec.md §6); the code is ours.
import * as THREE from 'three';
import gsap from 'gsap';
import { label } from './data.js';

const GRID = 11;              // instances per side; the plane wraps every 11 units
const CAM_Z = 3.43;           // resting camera distance
const PRESS_Z = CAM_Z + 0.4;  // pulled back while the pointer is down
const AWAY_Z = CAM_Z + 1;     // pulled back while another page is open
const FOV = 56;               // tuned so ~4.6 tiles span 1440px, as on the reference
const LENS = -0.07;           // distortion factor, multiplied by aspect
const MEDIA_ZOOM = 0.7;       // media occupies the centre 70% of a tile
const CELL = 683;             // atlas cell size in px (the reference's label cell: 4096 / 6)
const LABEL_IDLE = 0.8;       // label opacity when not hovered
const BLUR_OPACITY = 0.7;     // hovered tile background strength


// ---------------------------------------------------------------- atlas (Canvas2D, runtime)
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

async function loadImage(src) {
  const img = new Image(); img.decoding = 'async'; img.src = src;
  await img.decode();
  return img;
}

function drawLabel(ctx, p, x0, y0) {
  const S = CELL;
  ctx.save(); ctx.translate(x0, y0);
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
  // client wordmark, top-left (FF work carries the //FF mark)
  if (p.client === 'FF Dev Studio') {
    ctx.save(); ctx.translate(33, 36); ctx.scale(30 / 72, 30 / 72);
    ctx.fill(new Path2D('M0 72 16 0h14L14 72Z')); ctx.fill(new Path2D('M24 72 40 0h14L38 72Z'));
    ctx.fill(new Path2D('M72 0h54v15H88v13h32v14H88v30H72Z')); ctx.fill(new Path2D('M140 0h54v15h-38v13h32v14h-32v30h-16Z'));
    ctx.restore();
  } else {
    ctx.font = '600 26px "Instrument Sans"'; ctx.letterSpacing = '-0.5px';
    ctx.fillText(p.client, 33, 62);
  }
  // title, top-right, mono caps
  ctx.font = '400 17px "DM Mono"'; ctx.letterSpacing = '0.4px'; ctx.textAlign = 'right';
  ctx.fillText(p.title.toUpperCase(), S - 20, 62);
  // year, bottom-right
  ctx.fillText(String(p.year), S - 20, 648);
  // pills, bottom-left: zone outlined, features filled
  ctx.textAlign = 'left';
  let x = 20; const y = 609, h = 38;
  const pills = [p.zone, ...p.features.slice(0, 2)];
  pills.forEach((t, i) => {
    const txt = label(t).toUpperCase();
    const w = ctx.measureText(txt).width + 26;
    roundRect(ctx, x, y, w, h, h / 2);
    if (i === 0) { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    else { ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.fillText(txt, x + 13, y + 25);
    x += w + 8;
  });
  ctx.restore();
}

// media is drawn square-cropped into its own cell; the shader samples it at MEDIA_ZOOM
function drawMedia(ctx, img, x0, y0) {
  const s = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, x0, y0, CELL, CELL);
}

// the reference blurs the centre of the media at 20x zoom; that is the centre's mean colour
function centreColour(img) {
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const x = c.getContext('2d', { willReadFrequently: true });
  const s = Math.min(img.width, img.height) * 0.25;
  x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 8, 8);
  const d = x.getImageData(0, 0, 8, 8).data; let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return [r / n / 255, g / n / 255, b / n / 255];
}

async function buildAtlas(projects, tileUrl, maxTex) {
  await Promise.all([document.fonts.load('600 26px "Instrument Sans"'), document.fonts.load('400 17px "DM Mono"')]);
  const cols = Math.ceil(Math.sqrt(projects.length));
  let size = cols * CELL; let scale = 1;
  if (size > maxTex) { scale = maxTex / size; size = maxTex; }
  const make = () => { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); x.scale(scale, scale); return [c, x]; };
  const [mc, mx] = make(); const [lc, lx] = make();
  mx.fillStyle = '#000'; mx.fillRect(0, 0, cols * CELL, cols * CELL);
  const imgs = await Promise.all(projects.map((p) => loadImage(tileUrl(p)).catch(() => null)));
  const colours = [];
  projects.forEach((p, i) => {
    const x0 = (i % cols) * CELL, y0 = Math.floor(i / cols) * CELL;
    if (imgs[i]) { drawMedia(mx, imgs[i], x0, y0); colours.push(centreColour(imgs[i])); } else colours.push([0.1, 0.1, 0.1]);
    drawLabel(lx, p, x0, y0);
  });
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  return { media: tex(mc), labels: tex(lc), cols, colours };
}

// ---------------------------------------------------------------- shaders
const tileVert = /* glsl */`
  attribute vec2 cellOrigin;
  attribute float hover;
  attribute vec3 blurColour;
  uniform float cells;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vHover;
  varying vec3 vBlur;
  void main() {
    vUv = uv;
    vCell = cellOrigin;
    vHover = hover;
    vBlur = blurColour;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }`;
const tileFrag = /* glsl */`
  uniform sampler2D mediaMap;
  uniform sampler2D labelMap;
  uniform float cells;
  uniform float opacity;
  uniform float mediaZoom;
  uniform float labelIdle;
  uniform float blurOpacity;
  uniform float lineGrey;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vHover;
  varying vec3 vBlur;
  vec2 atlas(vec2 uv) { return (vCell + vec2(uv.x, 1.0 - uv.y)) / cells; }
  void main() {
    vec3 col = vBlur * blurOpacity * vHover;
    vec2 m = (vUv - 0.5) / mediaZoom + 0.5;
    if (m.x > 0.0 && m.x < 1.0 && m.y > 0.0 && m.y < 1.0) {
      vec2 a = atlas(m); a.y = 1.0 - a.y;
      col = texture2D(mediaMap, a).rgb;
    }
    vec2 l = atlas(vUv); l.y = 1.0 - l.y;
    vec4 lab = texture2D(labelMap, l);
    col = mix(col, lab.rgb, lab.a * mix(labelIdle, 1.0, vHover));
    // cell border: half a screen pixel on each tile's edge, so neighbours meet in one steady 1px line
    vec2 e = min(vUv, 1.0 - vUv) / fwidth(vUv);
    float line = 1.0 - smoothstep(0.0, 0.75, min(e.x, e.y));
    col = mix(col, vec3(lineGrey), line);
    gl_FragColor = vec4(col * opacity, 1.0);
  }`;
const lensVert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const lensFrag = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 distortion;
  uniform float vignetteOffset;
  uniform float vignetteDarkness;
  varying vec2 vUv;
  vec2 lens(vec2 uv) {
    vec2 m = 2.0 * (uv - 0.5);
    return (0.88 + distortion * dot(m, m)) * m * 0.5 + 0.5;
  }
  void main() {
    vec2 d = lens(vUv);
    vec3 c = vec3(0.0);
    if (d.x >= 0.0 && d.x <= 1.0 && d.y >= 0.0 && d.y <= 1.0) c = texture2D(tDiffuse, d).rgb;
    float dist = distance(vUv, vec2(0.5));
    c *= smoothstep(0.8, vignetteOffset * 0.799, (vignetteDarkness + vignetteOffset) * dist);
    gl_FragColor = vec4(c, 1.0);
  }`;

// centre-out square spiral, as the reference lays its 121 slots
function spiral(n) {
  const out = []; let x = Math.floor(n / 2), y = Math.floor(n / 2);
  out.push([x, y]);
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]]; let d = 0, run = 1;
  while (out.length < n * n) {
    for (let k = 0; k < 2; k++) {
      for (let s = 0; s < run && out.length < n * n; s++) { x += dirs[d][0]; y += dirs[d][1]; out.push([x, y]); }
      d = (d + 1) % 4;
    }
    run++;
  }
  return out;
}

// ---------------------------------------------------------------- the grid
export class WorkGrid {
  constructor(container, { projects, tileUrl, onOpen, onHover, reduced }) {
    this.container = container; this.all = projects; this.tileUrl = tileUrl;
    this.onOpen = onOpen; this.onHover = onHover; this.reduced = reduced;
    this.offset = new THREE.Vector2(); this.velocity = new THREE.Vector2(); this.dragStep = new THREE.Vector2();
    this.pointer = new THREE.Vector2(0, 0); this.ambient = new THREE.Vector2();
    this.hovered = -1; this.active = true; this.pressed = false; this.dragging = false;
    this.focusIndex = 0; this.lensFactor = 0;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 1);
    // colours pass through as sRGB bytes end to end, like the reference's `linear` canvas
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.canvas = this.renderer.domElement; this.canvas.className = 'grid-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Work grid. Tab moves between projects, arrow keys pan, Enter opens.');
    container.appendChild(this.canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 100); this.camera.position.z = CAM_Z + 1.2;
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    bg.position.z = -0.01; this.bgMat = bg.material; this.scene.add(bg);
    this.target = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
    this.lens = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: lensVert, fragmentShader: lensFrag, depthTest: false,
      uniforms: { tDiffuse: { value: this.target.texture }, distortion: { value: new THREE.Vector2() }, vignetteOffset: { value: 0.6 }, vignetteDarkness: { value: 0.6 } },
    }));
    this.lensScene = new THREE.Scene(); this.lensScene.add(this.lens); this.lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.clock = new THREE.Timer();
    this.bind(); this.resize();
  }

  async load() {
    // phones get a smaller atlas: tiles are ~40% the size on screen
    const max = Math.min(this.renderer.capabilities.maxTextureSize, innerWidth < 700 ? 2048 : 4096);
    this.atlas = await buildAtlas(this.all, this.tileUrl, max);
    this.material = new THREE.ShaderMaterial({
      vertexShader: tileVert, fragmentShader: tileFrag,
      uniforms: {
        mediaMap: { value: this.atlas.media }, labelMap: { value: this.atlas.labels }, cells: { value: this.atlas.cols },
        opacity: { value: 1 }, mediaZoom: { value: MEDIA_ZOOM }, labelIdle: { value: LABEL_IDLE }, blurOpacity: { value: BLUR_OPACITY }, lineGrey: { value: 0.3 },
      },
    });
    this.setProjects(this.all);
    this.loop();
  }

  setProjects(list) {
    this.list = list.length ? list : this.all.slice(0, 1);
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
    const count = GRID * GRID; const slots = spiral(GRID);
    const geo = new THREE.PlaneGeometry(1, 1);
    const origin = new Float32Array(count * 2), hover = new Float32Array(count), blur = new Float32Array(count * 3);
    this.tiles = [];
    for (let i = 0; i < count; i++) {
      const p = this.list[i % this.list.length]; const ai = this.all.indexOf(p);
      origin[i * 2] = ai % this.atlas.cols; origin[i * 2 + 1] = Math.floor(ai / this.atlas.cols);
      blur.set(this.atlas.colours[ai], i * 3);
      // grid y grows downward in the spiral; flip so it reads top-to-bottom
      this.tiles.push({ project: p, gx: slots[i][0] - (GRID - 1) / 2, gy: -(slots[i][1] - (GRID - 1) / 2), x: 0, y: 0 });
    }
    geo.setAttribute('cellOrigin', new THREE.InstancedBufferAttribute(origin, 2));
    this.hoverAttr = new THREE.InstancedBufferAttribute(hover, 1); this.hoverAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('hover', this.hoverAttr);
    geo.setAttribute('blurColour', new THREE.InstancedBufferAttribute(blur, 3));
    this.mesh = new THREE.InstancedMesh(geo, this.material, count); this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    this.hovered = -1; this.focusIndex = 0;
    this.layout();
  }

  // ------------------------------------------------ input
  bind() {
    const c = this.canvas;
    this.onDown = (e) => {
      if (e.button !== 0 || !this.active) return;
      c.setPointerCapture(e.pointerId);
      this.pressed = true; this.dragging = false; this.pressAt = [e.clientX, e.clientY]; this.last = [e.clientX, e.clientY];
      this.keyboard = false; this.setPointer(e);
      this.zoomTo(PRESS_Z, 0.4); c.style.cursor = 'grabbing';
    };
    this.onMove = (e) => {
      this.keyboard = false; this.setPointer(e);
      if (!this.pressed) return;
      if (!this.dragging && Math.hypot(e.clientX - this.pressAt[0], e.clientY - this.pressAt[1]) > 3) { this.dragging = true; this.emit('dragstart'); }
      if (this.dragging) {
        const w = this.pxToWorld(e.clientX - this.last[0], e.clientY - this.last[1]);
        this.dragStep.add(w); this.velocity.copy(w);
      }
      this.last = [e.clientX, e.clientY];
    };
    this.onUp = (e) => {
      if (!this.pressed) return;
      this.pressed = false; c.style.cursor = '';
      if (this.dragging) this.zoomTo(CAM_Z, 0.4);
      else { this.zoomTo(CAM_Z, 0.4); this.setPointer(e); this.pick(); this.open(); }
      this.dragging = false;
    };
    this.onLeave = () => { if (!this.pressed) { this.pointerIn = false; } };
    this.onWheel = (e) => {
      if (!this.active) return;
      e.preventDefault();
      const k = e.deltaMode === 1 ? 16 : 1;
      this.velocity.add(this.pxToWorld(-e.deltaX * k * 0.35, -e.deltaY * k * 0.35));
    };
    this.onKey = (e) => {
      if (!this.active || e.target.closest('input,textarea,select,[contenteditable]') || document.body.classList.contains('overlay-open')) return;
      const step = 4; let d = null;
      if (e.key === 'ArrowLeft') d = [step, 0]; if (e.key === 'ArrowRight') d = [-step, 0];
      if (e.key === 'ArrowUp') d = [0, step]; if (e.key === 'ArrowDown') d = [0, -step];
      if (d) { e.preventDefault(); this.keyboard = true; this.velocity.add(this.pxToWorld(d[0] * 6, d[1] * 6)); }
      if (document.activeElement !== this.canvas) return;
      if (e.key === 'Tab') {
        const n = this.list.length; const next = this.focusIndex + (e.shiftKey ? -1 : 1);
        if (!this.kbFocused) { e.preventDefault(); this.kbFocused = true; this.keyboard = true; this.focusStep(0); return; }
        if (next < 0 || next >= n) { this.kbFocused = false; return; } // let focus leave the grid
        e.preventDefault(); this.keyboard = true; this.focusStep(e.shiftKey ? -1 : 1);
      }
      if (e.key === 'Enter' && this.hovered >= 0) { e.preventDefault(); this.open(); }
    };
    this.onResize = () => this.resize();
    c.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onLeave);
    c.addEventListener('blur', () => { this.kbFocused = false; });
    c.addEventListener('pointerenter', () => { this.pointerIn = true; });
    c.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('resize', this.onResize);
  }

  emit(type) { this.container.dispatchEvent(new CustomEvent('grid:' + type)); }

  setPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.set((e.clientX - r.left) / r.width - 0.5, -((e.clientY - r.top) / r.height - 0.5));
    this.pointerIn = true;
  }

  visibleHeight(depth) { return 2 * depth * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)); }

  pxToWorld(dx, dy) {
    const h = this.visibleHeight(this.camera.position.z + 0.58);
    const k = h / this.canvas.clientHeight;
    return new THREE.Vector2(dx * k, -dy * k);
  }

  // screen uv (-.5..5) → scene uv through the lens (the pass samples the scene at lens(uv))
  unlens(u) {
    const m = new THREE.Vector2(u.x * 2, u.y * 2);
    const d = this.lensUniform();
    const r2 = m.dot(m);
    return new THREE.Vector2((0.88 + d.x * r2) * m.x * 0.5, (0.88 + d.y * r2) * m.y * 0.5);
  }

  lensUniform() { return this.lens.material.uniforms.distortion.value; }

  pick() {
    if (!this.tiles || !this.pointerIn) { this.hovered = -1; return; }
    const s = this.unlens(this.pointer);
    const z = this.camera.position.z; const h = this.visibleHeight(z); const w = h * this.camera.aspect;
    const wx = s.x * w + this.camera.position.x, wy = s.y * h + this.camera.position.y;
    let best = -1, bd = Infinity;
    this.tiles.forEach((t, i) => {
      const dx = Math.abs(t.x - wx), dy = Math.abs(t.y - wy);
      if (dx <= 0.5 && dy <= 0.5 && dx + dy < bd) { bd = dx + dy; best = i; }
    });
    if (best !== this.hovered) { this.hovered = best; this.onHover?.(best >= 0 ? this.tiles[best].project : null); }
  }

  open() {
    const t = this.tiles?.[this.hovered];
    if (t && this.active) this.onOpen?.(t.project);
  }

  // Tab / shift-Tab walks the spiral, as the reference does
  focusStep(dir) {
    this.focusIndex = Math.max(0, this.focusIndex + dir);
    const t = this.tiles[this.focusIndex % this.tiles.length];
    const target = { x: -t.gx, y: -t.gy };
    gsap.to(this.offset, { ...target, duration: this.reduced ? 0 : 0.3, ease: 'power2.inOut' });
    this.velocity.set(0, 0);
    this.hovered = this.focusIndex % this.tiles.length;
    this.onHover?.(t.project);
    return t.project;
  }

  zoomTo(z, d) {
    this.zoomTween?.kill();
    this.zoomTween = gsap.to(this.camera.position, { z, duration: this.reduced ? 0 : d, ease: 'expo.out' });
  }

  setLens(f, instant) {
    this.lensTween?.kill();
    if (instant || this.reduced) { this.lensFactor = f; this.updateLens(); return; }
    this.lensTween = gsap.to(this, { lensFactor: f, duration: 1, ease: 'power2.out', onUpdate: () => this.updateLens() });
  }

  updateLens() {
    const a = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.lensUniform().set(this.lensFactor * a, this.lensFactor * a);
  }

  // ------------------------------------------------ lifecycle
  intro() {
    this.material.uniforms.opacity.value = 0;
    this.camera.position.z = CAM_Z + 1.2;
    gsap.to(this.material.uniforms.opacity, { value: 1, duration: this.reduced ? 0 : 1.2, ease: 'power1.inOut' });
    this.zoomTo(CAM_Z, 2.2);
    this.setLens(LENS);
  }

  // leaving the home page: dim to .3 and pull back; returning: centre and restore
  setActive(on) {
    this.active = on;
    if (!this.material) return;
    gsap.to(this.material.uniforms.opacity, { value: on ? 1 : 0.3, duration: this.reduced ? 0 : 1, ease: 'power1.inOut' });
    this.zoomTo(on ? CAM_Z : AWAY_Z, 1);
    if (on) this.center(); else { this.hovered = -1; }
  }

  center() { gsap.to(this.offset, { x: 0, y: 0, duration: this.reduced ? 0 : 0.3, ease: 'power2.inOut' }); this.velocity.set(0, 0); }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    // one scene unit ≈ .291 of the height on desktop (a ~306px tile at 900px, as measured); portrait screens are
    // limited by width instead so a phone still shows ~2.5 columns
    const unitPx = Math.min(h * 0.291, w / 2.6);
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / unitPx / (2 * CAM_Z)));
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    this.target.setSize(Math.round(w * pr), Math.round(h * pr));
    this.updateLens();
  }

  layout() {
    if (!this.mesh) return;
    const m = new THREE.Matrix4(); const half = GRID / 2;
    const ox = this.offset.x + this.ambient.x, oy = this.offset.y + this.ambient.y;
    this.tiles.forEach((t, i) => {
      // wrap each tile into the 11-unit window around the camera
      let x = t.gx + ox, y = t.gy + oy;
      x -= Math.round(x / GRID) * GRID; y -= Math.round(y / GRID) * GRID;
      if (x < -half) x += GRID; if (y < -half) y += GRID;
      t.x = x; t.y = y;
      m.makeTranslation(x, y, 0); this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    if (document.hidden) return;
    this.clock.update(); const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.dragging) this.offset.add(this.dragStep);
    else if (this.active) this.offset.add(this.velocity);
    this.dragStep.set(0, 0);
    this.velocity.lerp(new THREE.Vector2(), Math.min(1, 4 * dt));
    // ambient parallax toward the pointer
    const amb = this.active && this.pointerIn && !this.reduced ? this.pointer.clone().multiplyScalar(-0.07) : new THREE.Vector2();
    this.ambient.lerp(amb, Math.min(1, 3 * dt));
    this.layout();
    if (this.active && !this.dragging && !this.keyboard) this.pick();
    if (this.hoverAttr) {
      const a = this.hoverAttr.array; const k = Math.min(1, 5 * dt);
      for (let i = 0; i < a.length; i++) a[i] += ((i === this.hovered && this.active ? 1 : 0) - a[i]) * k;
      this.hoverAttr.needsUpdate = true;
    }
    this.canvas.style.cursor = this.pressed && this.dragging ? 'grabbing' : this.hovered >= 0 && this.active ? 'pointer' : '';
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.lensScene, this.lensCam);
  }
}

export const hasWebGL2 = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
