// Paste into the page (window.__ff must exist). Steps the grid by sub-pixel amounts, renders each
// step synchronously and reads one GPU row back. For every grid line crossing the row it reports
// the line's peak contrast over the frames: a steady line has min ≈ max; flicker shows as a spread.
(() => {
  const g = window.__ff.grid; g.frozen = true;
  const gl = g.renderer.getContext();
  const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
  const y = Math.round(H * 0.5);
  const buf = new Uint8Array(W * 4);
  const frames = [];
  const base = g.offset.clone();
  for (let k = 0; k < 60; k++) {
    g.ambient.set(0, 0); g.velocity.set(0, 0);
    g.offset.set(base.x + k * 0.0031, base.y + k * 0.0017); // ~0.4-0.9 px per step
    g.layout(); g.draw();
    gl.readPixels(0, y, W, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    const L = new Float32Array(W); for (let x = 0; x < W; x++) L[x] = (buf[x * 4] + buf[x * 4 + 1] + buf[x * 4 + 2]) / 3;
    const peaks = [];
    for (let x = 6; x < W - 6; x++) {
      const bg = Math.max(L[x - 6], L[x + 6]);
      if (L[x] >= L[x - 1] && L[x] > L[x + 1] - 0.01 && bg < 30 && L[x] - bg > 6) peaks.push([x, L[x] - bg]);
    }
    frames.push(peaks);
  }
  g.offset.copy(base); g.frozen = false;
  // track each line through the frames (it moves a little each step)
  const tracks = frames[0].map(([x, c]) => ({ x, c: [c] }));
  for (let k = 1; k < frames.length; k++) for (const t of tracks) {
    const near = frames[k].filter(([x]) => Math.abs(x - t.x) <= 3);
    const hit = near.sort((a, b) => Math.abs(a[0] - t.x) - Math.abs(b[0] - t.x))[0];
    if (hit) { t.x = hit[0]; t.c.push(hit[1]); } else t.c.push(0);
  }
  return { W, H, lines: tracks.map((t) => ({ x: t.x, min: Math.round(Math.min(...t.c)), max: Math.round(Math.max(...t.c)), spreadPct: Math.round((Math.max(...t.c) - Math.min(...t.c)) / Math.max(1, Math.max(...t.c)) * 100) })) };
})();
