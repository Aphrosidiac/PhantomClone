// Scroll distance probe: dispatches one wheel event (or a burst) on the canvas and reports how far the
// grid moved on screen once it settles. Page-like scrolling means moved ≈ scrolled.
(async () => {
  if (location.pathname !== '/') return 'not home';
  const g = window.__ff.grid; const c = g.canvas;
  const pxPerUnit = () => c.clientHeight / g.visibleHeight(g.camera.position.z + 0.58);
  const settle = () => new Promise((r) => setTimeout(r, 1500));
  const run = async (events) => {
    g.velocity.set(0, 0); await settle();
    const y0 = g.offset.y;
    for (const d of events) { c.dispatchEvent(new WheelEvent('wheel', { deltaY: d, deltaMode: 0, bubbles: true, cancelable: true, clientX: 700, clientY: 400 })); await new Promise((r) => setTimeout(r, 16)); }
    await settle();
    return Math.round((g.offset.y - y0) * pxPerUnit());
  };
  const mouseNotch = await run([100]);
  const trackpad = await run(Array.from({ length: 30 }, () => 10)); // 300px of trackpad scroll
  return JSON.stringify({ mouseNotch_scrolled: 100, mouseNotch_moved: mouseNotch, trackpad_scrolled: 300, trackpad_moved: trackpad });
})();
