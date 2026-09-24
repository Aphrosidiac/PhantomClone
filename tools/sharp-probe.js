// Label sharpness. Renders a fixed frame (offset 0, no parallax) and reads the label strips of the
// centre tile row (top: logo + title, bottom: pills + year). Scores acutance = mean |Δluminance|
// between neighbouring pixels, and the share of "crisp" edges (a step of 60+ within one pixel).
(() => {
  if (location.pathname !== '/') return 'not home';
  const g = window.__ff.grid; g.frozen = true;
  const gl = g.renderer.getContext(); const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const base = g.offset.clone(); g.offset.set(0, 0); g.ambient.set(0, 0); g.hovered = -1;
  if (g.hoverAttr) { g.hoverAttr.array.fill(0); g.hoverAttr.needsUpdate = true; }
  g.material.uniforms.opacity.value = 1; g.camera.position.z = 3.43;
  g.layout(); g.draw();
  const tile = H / (g.visibleHeight(3.43) * 0.88);
  const bands = [[H / 2 + tile * 0.47, H / 2 + tile * 0.39], [H / 2 - tile * 0.39, H / 2 - tile * 0.47]]; // GL y is bottom-up
  let sum = 0, n = 0, crisp = 0;
  for (const [top, bottom] of bands) {
    const y0 = Math.round(bottom), h = Math.round(top - bottom), x0 = Math.round(W / 2 - tile * 1.5), w = Math.round(tile * 3);
    const b = new Uint8Array(w * h * 4); gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, b);
    const L = (x, y) => (b[(y * w + x) * 4] + b[(y * w + x) * 4 + 1] + b[(y * w + x) * 4 + 2]) / 3;
    for (let y = 0; y < h; y++) for (let x = 1; x < w; x++) { const d = Math.abs(L(x, y) - L(x - 1, y)); sum += d; n++; if (d >= 60) crisp++; }
  }
  g.offset.copy(base); g.frozen = false;
  return JSON.stringify({ acutance: +(sum / n).toFixed(3), crispEdgesPer1000px: +(crisp / n * 1000).toFixed(2), bufferW: W, targetW: g.target.width });
})();
