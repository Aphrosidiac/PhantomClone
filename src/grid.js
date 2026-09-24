// The work grid: an infinite, draggable plane of project tiles seen through a barrel lens.
// Numbers are the reference's (docs/reference-spec.md §6); the code is ours.
import * as THREE from 'three';
import gsap from 'gsap';
import { label } from './data.js';
import VIDEO from './video-atlas.json';

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
const BLUR_ZOOM = 20;         // hovered background: the media's centre 1/20th, stretched over the tile
const REF_CELL = 340;         // the reference's atlas cell in texels (2040 / 6); its blur is sized in these


// ---------------------------------------------------------------- atlas (Canvas2D, runtime)
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// onload, not img.decode(): Chrome can hold decode() pending indefinitely while the tab is in the
// background, which left a site opened in a background tab with a black grid
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${src}`));
    img.src = src;
  });
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

async function buildAtlas(projects, tileUrl, { mediaMax, labelMax, labelScale }) {
  await Promise.all([document.fonts.load('600 26px "Instrument Sans"'), document.fonts.load('400 17px "DM Mono"')]);
  const cols = Math.ceil(Math.sqrt(projects.length));
  const make = (k, max) => {
    const size = Math.min(max, Math.round(cols * CELL * k)); const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'); x.scale(size / (cols * CELL), size / (cols * CELL)); return [c, x];
  };
  // labels get more pixels than media: a 17px mono caption in a 683px cell is only ~8 screen px
  // tall, so at 1x it is sampled from a blurred mip level and reads as low-res
  const [mc, mx] = make(1, mediaMax); const [lc, lx] = make(labelScale, labelMax);
  mx.fillStyle = '#000'; mx.fillRect(0, 0, cols * CELL, cols * CELL);
  const imgs = await Promise.all(projects.map((p) => loadImage(tileUrl(p)).catch(() => null)));
  projects.forEach((p, i) => {
    const x0 = (i % cols) * CELL, y0 = Math.floor(i / cols) * CELL;
    if (imgs[i]) drawMedia(mx, imgs[i], x0, y0);
    drawLabel(lx, p, x0, y0);
  });
  const tex = (c) => { const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  return { media: tex(mc), labels: tex(lc), cols, mediaSize: mc.width };
}

// ---------------------------------------------------------------- shaders
const tileVert = /* glsl */`
  attribute vec2 cellOrigin;
  attribute float hover;
  attribute vec4 videoRect;
  uniform float cells;
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vHover;
  varying vec4 vVideo;
  void main() {
    vUv = uv;
    vCell = cellOrigin;
    vHover = hover;
    vVideo = videoRect;
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
  uniform float mediaGutter;
  uniform float blurZoom;
  uniform float blurLod;
  uniform float blurTexel;
  uniform sampler2D videoMap;
  uniform float videoOn;       // 0 until the video's first frame, then eases to 1
  uniform float videoAspect;
  uniform vec2 videoSize;      // atlas size in px (manifest scale)
  varying vec2 vUv;
  varying vec2 vCell;
  varying float vHover;
  varying vec4 vVideo;         // this tile's frame in the video atlas: GL uv x, y (bottom), w, h; w = 0 for none
  vec2 atlas(vec2 uv) { return (vCell + vec2(uv.x, 1.0 - uv.y)) / cells; }
  // The hovered background, as the reference does it: the centre 1/20th of the media stretched over
  // the whole tile, 5x5 box-blurred. It keeps the picture's colours where they are (a sky stays at
  // the top, a floor at the bottom), so the tile glows in a gradient of the image rather than one
  // flat mean. Sampled at the mip whose resolution matches the reference's 340px cell, so the
  // gradient is as soft as theirs; the kernel steps one of their texels.
  vec3 blurColour() {
    vec2 b = atlas((vUv - 0.5) / blurZoom + 0.5); b.y = 1.0 - b.y;
    vec3 c = vec3(0.0);
    for (float x = -2.0; x <= 2.0; x++)
      for (float y = -2.0; y <= 2.0; y++)
        c += textureLod(mediaMap, b + vec2(x, y) * blurTexel, blurLod).rgb;
    return c / 25.0;
  }
  // The same background from the moving picture: the frame's centre, a square of 1/20th of its width,
  // stretched over the tile and 5x5 box-blurred — so a video tile's glow shifts as the clip plays.
  vec3 videoBlurColour() {
    float side = vVideo.z * videoSize.x / blurZoom;
    vec2 win = vec2(side) / videoSize;
    vec2 b = vVideo.xy + 0.5 * vVideo.zw + (vUv - 0.5) * win;
    vec3 c = vec3(0.0);
    for (float x = -2.0; x <= 2.0; x++)
      for (float y = -2.0; y <= 2.0; y++)
        c += textureLod(videoMap, b + vec2(x, y) * win / 17.0, 0.0).rgb;
    return c / 25.0;
  }
  void main() {
    float v = vVideo.z > 0.0 ? videoOn : 0.0;
    vec3 bg = vec3(0.0);
    if (vHover > 0.001) {
      bg = blurColour();
      if (v > 0.0) bg = mix(bg, videoBlurColour(), v);
      bg *= blurOpacity * vHover;
    }
    vec3 col = bg;
    vec2 m = (vUv - 0.5) / mediaZoom + 0.5;
    // Sample only the inner part of the atlas cell (a gutter of real image pixels on every side),
    // so mipmaps never pull the neighbouring cell's picture into this edge as a bright fringe.
    vec2 inner = mediaGutter + clamp(m, 0.0, 1.0) * (1.0 - 2.0 * mediaGutter);
    vec2 a = atlas(inner); a.y = 1.0 - a.y;
    // picture edge: a fixed 1-screen-pixel coverage ramp instead of a hard, aliased cut
    vec2 edge = min(m, 1.0 - m) / fwidth(m);
    float cover = clamp(min(edge.x, edge.y) + 0.5, 0.0, 1.0);
    col = mix(col, texture2D(mediaMap, a).rgb, cover);
    if (v > 0.0) {
      // the clip keeps its own aspect: full media width, letterboxed in the tile like the reference's
      // landscape website tiles; outside it the background (black, or the hover glow) shows
      vec2 vm = (vUv - 0.5) / vec2(mediaZoom, mediaZoom / videoAspect) + 0.5;
      vec2 ve = min(vm, 1.0 - vm) / fwidth(vm);
      float vc = clamp(min(ve.x, ve.y) + 0.5, 0.0, 1.0);
      vec2 inset = 3.0 / videoSize; // keep bilinear/mip taps inside this clip's cell
      vec2 t = clamp(vVideo.xy + clamp(vm, 0.0, 1.0) * vVideo.zw, vVideo.xy + inset, vVideo.xy + vVideo.zw - inset);
      col = mix(col, mix(bg, texture2D(videoMap, t).rgb, vc), v);
    }
    vec2 l = atlas(vUv); l.y = 1.0 - l.y;
    vec4 lab = texture2D(labelMap, l);
    col = mix(col, lab.rgb, lab.a * mix(labelIdle, 1.0, vHover));
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
  uniform vec2 gridOffset;   // world offset of the tile plane
  uniform vec2 visible;      // world size of the view at the tile plane
  uniform float lineAlpha;   // follows the grid's opacity
  varying vec2 vUv;
  vec2 lens(vec2 uv) {
    vec2 m = 2.0 * (uv - 0.5);
    return (0.88 + distortion * dot(m, m)) * m * 0.5 + 0.5;
  }
  void main() {
    vec2 d = lens(vUv);
    vec3 c = vec3(0.0);
    if (d.x >= 0.0 && d.x <= 1.0 && d.y >= 0.0 && d.y <= 1.0) {
      c = texture2D(tDiffuse, d).rgb;
      // tile borders, computed per screen pixel after the lens rather than resampled from the
      // scene, so a moving grid never makes a thin line shimmer
      vec2 w = (d - 0.5) * visible - gridOffset + 0.5;
      // Snap each line to exactly one device pixel: a pixel is on the line when a whole-number
      // grid coordinate falls inside it. An anti-aliased 1px line splits across two pixels at
      // ~60% whenever it sits between them, which reads as flicker as the grid drifts.
      float hx = 0.5 * dFdx(w.x), hy = 0.5 * dFdy(w.y);
      float vx = floor(w.x + hx) - floor(w.x - hx);
      float vy = floor(w.y + hy) - floor(w.y - hy);
      float line = clamp(abs(vx) + abs(vy), 0.0, 1.0);
      c = mix(c, vec3(0.3), line * lineAlpha);
    }
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
      uniforms: { tDiffuse: { value: this.target.texture }, distortion: { value: new THREE.Vector2() }, vignetteOffset: { value: 0.6 }, vignetteDarkness: { value: 0.6 }, gridOffset: { value: new THREE.Vector2() }, visible: { value: new THREE.Vector2(1, 1) }, lineAlpha: { value: 0 } },
    }));
    this.lensScene = new THREE.Scene(); this.lensScene.add(this.lens); this.lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.clock = new THREE.Timer();
    this.bind(); this.resize();
  }

  async load() {
    // phones get a smaller atlas: tiles are ~40% the size on screen
    const cap = this.renderer.capabilities.maxTextureSize; const phone = innerWidth < 700;
    const q = new URLSearchParams(location.search); // ?ls= / ?ss= override quality, for A/B probes
    const t0 = performance.now();
    this.atlas = await buildAtlas(this.all, this.tileUrl, {
      mediaMax: Math.min(cap, phone ? 2048 : 4096),
      labelMax: Math.min(cap, phone ? 4096 : 8192),
      labelScale: +(q.get('ls') || 2),
    });
    this.timings = { atlasMs: Math.round(performance.now() - t0) };
    this.material = new THREE.ShaderMaterial({
      vertexShader: tileVert, fragmentShader: tileFrag,
      uniforms: {
        mediaMap: { value: this.atlas.media }, labelMap: { value: this.atlas.labels }, cells: { value: this.atlas.cols },
        opacity: { value: 1 }, mediaZoom: { value: MEDIA_ZOOM }, labelIdle: { value: LABEL_IDLE }, blurOpacity: { value: BLUR_OPACITY }, mediaGutter: { value: 24 / CELL },
        blurZoom: { value: BLUR_ZOOM }, blurTexel: { value: 1 / (REF_CELL * this.atlas.cols) },
        blurLod: { value: Math.max(0, Math.log2(this.atlas.mediaSize / this.atlas.cols / REF_CELL)) },
        videoMap: { value: new THREE.DataTexture(new Uint8Array(4), 1, 1) }, videoOn: { value: 0 },
        videoAspect: { value: VIDEO.aspect }, videoSize: { value: new THREE.Vector2(VIDEO.width, VIDEO.height) },
      },
    });
    this.setProjects(this.all);
    this.setupVideo();
    this.loop();
  }

  setProjects(list) {
    this.list = list.length ? list : this.all.slice(0, 1);
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
    const count = GRID * GRID; const slots = spiral(GRID);
    const geo = new THREE.PlaneGeometry(1, 1);
    const origin = new Float32Array(count * 2), hover = new Float32Array(count), video = new Float32Array(count * 4);
    this.tiles = [];
    for (let i = 0; i < count; i++) {
      const p = this.list[i % this.list.length]; const ai = this.all.indexOf(p);
      origin[i * 2] = ai % this.atlas.cols; origin[i * 2 + 1] = Math.floor(ai / this.atlas.cols);
      const vc = VIDEO.cells[p.slug]; // [x, y, w, h] px, top-left origin → GL uv, bottom-left
      if (vc) video.set([vc[0] / VIDEO.width, 1 - (vc[1] + vc[3]) / VIDEO.height, vc[2] / VIDEO.width, vc[3] / VIDEO.height], i * 4);
      // grid y grows downward in the spiral; flip so it reads top-to-bottom
      this.tiles.push({ project: p, gx: slots[i][0] - (GRID - 1) / 2, gy: -(slots[i][1] - (GRID - 1) / 2), x: 0, y: 0 });
    }
    geo.setAttribute('cellOrigin', new THREE.InstancedBufferAttribute(origin, 2));
    this.hoverAttr = new THREE.InstancedBufferAttribute(hover, 1); this.hoverAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('hover', this.hoverAttr);
    geo.setAttribute('videoRect', new THREE.InstancedBufferAttribute(video, 4));
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
  // ------------------------------------------------ video atlas (docs/reference-spec.md §6a)
  // One detached, muted, inline, looping <video> behind every moving tile. Tiles keep their still
  // image until the first frame is decoded, then ease over. Reduced motion and data-saver keep stills.
  setupVideo() {
    const q = new URLSearchParams(location.search);
    if (this.reduced || navigator.connection?.saveData || q.get('video') === '0' || !Object.keys(VIDEO.cells).length) return;
    const v = document.createElement('video');
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', '');
    v.loop = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    v.src = innerWidth < 700 ? VIDEO.srcPhone : VIDEO.src;
    // loop is set; the reference also rewinds on `ended`, for browsers that drop `loop` on detached video
    v.addEventListener('ended', () => { v.currentTime = 0; if (this.videoWanted) v.play().catch(() => {}); });
    const tex = new THREE.VideoTexture(v);
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
    this.material.uniforms.videoMap.value = tex;
    const shown = () => gsap.to(this.material.uniforms.videoOn, { value: 1, duration: 0.6, ease: 'power1.inOut' });
    if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(shown); else v.addEventListener('playing', shown, { once: true });
    document.addEventListener('visibilitychange', () => this.playVideo(this.videoWanted));
    this.video = v;
    this.playVideo(this.videoWanted);
  }

  // plays while the grid is the page (as the reference: fadeIn plays, fadeOut pauses) and the tab is visible
  playVideo(on) {
    this.videoWanted = on;
    if (!this.video) return;
    if (on && !document.hidden) this.video.play().catch(() => {}); else this.video.pause();
  }

  intro() {
    this.playVideo(true);
    this.material.uniforms.opacity.value = 0;
    this.camera.position.z = CAM_Z + 1.2;
    gsap.to(this.material.uniforms.opacity, { value: 1, duration: this.reduced ? 0 : 1.2, ease: 'power1.inOut' });
    this.zoomTo(CAM_Z, 2.2);
    this.setLens(LENS);
  }

  // leaving the home page: dim to .3 and pull back; returning: centre and restore
  setActive(on) {
    this.active = on;
    this.playVideo(on);
    if (!this.material) return;
    gsap.to(this.material.uniforms.opacity, { value: on ? 1 : 0.3, duration: this.reduced ? 0 : 1, ease: 'power1.inOut' });
    this.zoomTo(on ? CAM_Z : AWAY_Z, 1);
    if (on) this.center(); else { this.hovered = -1; }
  }

  center() { gsap.to(this.offset, { x: 0, y: 0, duration: this.reduced ? 0 : 0.3, ease: 'power2.inOut' }); this.velocity.set(0, 0); }

  resize() {
    const w = this.container.clientWidth || innerWidth, h = this.container.clientHeight || innerHeight;
    // pixel budget ~8.3M (a 4K frame) for both the canvas and the scene target — beyond that a
    // very large retina window would allocate hundreds of MB of multisampled GPU memory
    const BUDGET = 8.3e6;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2, Math.sqrt(BUDGET / (w * h))));
    this.renderer.setSize(w, h, false);
    // one scene unit ≈ .291 of the height on desktop (a ~306px tile at 900px, as measured); portrait screens are
    // limited by width instead so a phone still shows ~2.5 columns
    const unitPx = Math.min(h * 0.291, w / 2.6);
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / unitPx / (2 * CAM_Z)));
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    // the lens pass enlarges the centre by 1/.88; render the scene larger than the screen so that
    // pass shrinks instead of enlarging, which would otherwise soften every label and picture
    const q = new URLSearchParams(location.search);
    const pr = this.renderer.getPixelRatio();
    const budget = Math.sqrt(BUDGET / (w * pr * h * pr));
    const ss = Math.max(1, Math.min(+(q.get('ss') || (w < 700 ? 1.15 : 1.5)), budget));
    const max = this.renderer.capabilities.maxTextureSize;
    this.target.setSize(Math.min(max, Math.round(w * pr * ss)), Math.min(max, Math.round(h * pr * ss)));
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

  draw() {
    const lu = this.lens.material.uniforms; const vh = this.visibleHeight(this.camera.position.z);
    lu.visible.value.set(vh * this.camera.aspect, vh);
    lu.gridOffset.value.set(this.offset.x + this.ambient.x, this.offset.y + this.ambient.y);
    lu.lineAlpha.value = this.material ? this.material.uniforms.opacity.value : 0;
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.lensScene, this.lensCam);
  }

  loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    if (document.hidden || this.frozen) return;
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
    this.draw();
  }
}

export const hasWebGL2 = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
