// Picture-edge probe. For every tile crossing the scan rows, predicts where its picture's left and
// right edges land on screen (world → scene uv → inverse lens → pixel), then measures, per frame,
// how much brighter the edge pixels are than the picture 4px inside. A fringe is a positive value;
// flicker is that value changing frame to frame as the grid moves by sub-pixel steps.
(() => {
  if (location.pathname !== '/') return 'not home';
  const g = window.__ff.grid; g.frozen = true;
  const gl = g.renderer.getContext(); const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const lu = g.lens.material.uniforms; const dist = lu.distortion.value; const base = g.offset.clone();
  const toScreen = (sx, sy) => { // scene uv (-.5..5) → screen uv (-.5..5), inverting the lens
    let ux = sx, uy = sy;
    for (let i = 0; i < 30; i++) { const mx = 2 * ux, my = 2 * uy, r2 = mx * mx + my * my; ux = sx / (0.88 + dist.x * r2); uy = sy / (0.88 + dist.y * r2); }
    return [(ux + 0.5) * W, (uy + 0.5) * H];
  };
  const buf = new Uint8Array(W * 4); const tracks = {};
  for (let k = 0; k < 60; k++) {
    g.ambient.set(0, 0); g.offset.set(base.x + k * 0.00271, base.y);
    g.layout(); g.draw(); lu.lineAlpha.value = 0;
    g.renderer.setRenderTarget(null); g.renderer.render(g.lensScene, g.lensCam);
    const vh = g.visibleHeight(g.camera.position.z), vw = vh * g.camera.aspect;
    g.tiles.forEach((t, i) => {
      if (Math.abs(t.y) > 1.2) return; // centre three tile rows
      for (const side of [-1, 1]) {
        const [px, py] = toScreen((t.x + side * 0.35) / vw, t.y / vh);
        const x = Math.round(px), y = Math.round(py);
        if (x < 8 || x > W - 8 || y < 0 || y >= H) continue;
        gl.readPixels(0, y, W, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        const L = (xx) => (buf[xx * 4] + buf[xx * 4 + 1] + buf[xx * 4 + 2]) / 3;
        let edge = 0; for (let d = -2; d <= 2; d++) edge = Math.max(edge, L(x + d));
        const inside = L(x - side * 5);
        (tracks[`${i}${side}`] ??= []).push(edge - inside);
      }
    });
  }
  g.offset.copy(base); g.frozen = false;
  const T = Object.values(tracks).filter((a) => a.length > 40);
  const fringe = T.map((a) => Math.max(...a));
  const swing = T.map((a) => Math.max(...a) - Math.min(...a));
  const avg = (a) => +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1);
  return JSON.stringify({ edges: T.length, fringeAvg: avg(fringe), fringeWorst: Math.round(Math.max(...fringe)), swingAvg: avg(swing), swingWorst: Math.round(Math.max(...swing)) });
})();
