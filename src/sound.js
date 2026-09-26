// UI sounds. Off by default.
// SOUND_AVAILABLE = false disables sound entirely for now: the header toggle is hidden and nothing
// loads or plays. The files in public/sounds/ stay; set it to true to bring the toggle back.
export const SOUND_AVAILABLE = false;
const FILES = ['click', 'grid', 'load', 'other', 'project', 'riser', 'swipe', 'whoosh'];
let ctx = null; const buffers = {}; let lastGrid = 0;

async function ensure() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await Promise.all(FILES.map(async (f) => {
    try { const r = await fetch(`/sounds/${f}.mp3`); buffers[f] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch { /* a missing sound is silence */ }
  }));
}

export const sound = {
  enabled: false,
  async setEnabled(on) {
    if (!SOUND_AVAILABLE) return;
    this.enabled = on;
    try { localStorage.setItem('ff-sound', on ? '1' : '0'); } catch {}
    if (on) { await ensure(); ctx.resume(); }
  },
  play(name, gain = 0.8) {
    if (!this.enabled || !ctx || !buffers[name]) return;
    // one tick per tile change, never a stream of them
    if (name === 'grid') { const now = performance.now(); if (now - lastGrid < 90) return; lastGrid = now; }
    const src = ctx.createBufferSource(); const g = ctx.createGain();
    g.gain.value = gain; src.buffer = buffers[name]; src.connect(g).connect(ctx.destination); src.start();
  },
};
