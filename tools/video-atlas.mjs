// Build the grid's video atlas from screen recordings of the work, the way the reference does it:
// every clip cut to the same 5 s loop at 20 fps and packed into ONE video, so the browser decodes a
// single stream however many tiles move. Differences from the reference, on purpose:
//   - 16:9 cells instead of square ones: the clips are websites, and a letterboxed square wastes 44%
//     of the pixels (the shader places the frame in the tile at its own aspect, docs/reference-spec §6a)
//   - each loop blends its tail into its head, so there is no visible jump when it wraps
//   - moov at the front (+faststart), so playback can start before the whole file has arrived
//
// usage: node tools/video-atlas.mjs [recordings dir]      (FFMPEG=path/to/ffmpeg if not on PATH)
// writes public/media/video/atlas.mp4, atlas-phone.mp4 and src/video-atlas.json
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || path.join(process.env.USERPROFILE || process.env.HOME, 'Videos');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

// Recordings: Chrome at 1920x1080, page viewport 1904x944 at y=87 (tab strip + address bar above,
// scrollbar right of x=1904) — measured on all ten files. `at` is the source second of the loop's first
// frame; `speed` (default SPEED) how fast the source plays. Each pick came from a 2 fps pass over the
// whole recording and a 6-8 fps pass over the candidates, choosing the most eye-catching stretch at
// tile size (~200 px wide): startup sequences, big type, colour, large motion — not small-text scrolls.
const CROP = { w: 1904, h: 944, x: 0, y: 87 };
const CLIPS = [
  // //FF loader mark → hero reveal → mint blob swirl → BUILT PROPERLY → stats
  { slug: 'ff-search', file: '2026-09-24 17-16-53.mp4', at: 2.4 },
  // collage → sneaker zooms into the lens → teal, orange, cyan, blue circles → collage
  { slug: 'ff-shoots', file: '2026-09-24 17-18-29.mp4', at: 15.3 },
  // the intro, at its own pace: tiles sharpen, line up, collapse, one grows into the hero (starts
  // after the page reload at ~1.8 s, so the lead-in is all loader and the wrap dissolves cleanly)
  { slug: 'ff-stanzza', file: '2026-09-24 17-19-40.mp4', at: 2.35, speed: 1 },
  // Weddings hero (kite + invitation, blue sky) → photos fly in → ceremony
  { slug: 'ff-frames', file: '2026-09-24 17-20-47.mp4', at: 7.75 },
  // "Six stages" rack builds piece by piece → orange/blue warehouse photos
  { slug: 'sunlight-supplies', file: '2026-09-24 17-21-54.mp4', at: 9.9 },
  // loader: Lewix mark fills (lead-in is the empty grey loader) → black panel expands → particles form the mountain → LEWIX → fly-over
  { slug: 'lewix-ai', file: '2026-09-24 17-23-22.mp4', at: 4.5 },
  // "Thirty days" illustration → icon band → page flips to Malay hero → shop mock
  { slug: 'smoothsail', file: '2026-09-24 17-24-00.mp4', at: 11.6 },
  // blue gradient card → Software & AI planet → store builder photos → dark code panel
  { slug: 'lewix-my', file: '2026-09-24 17-25-03.mp4', at: 14.3 },
  // card strip swinging → giant F SEARCH opening → strip → giant SUN LIGHT opening
  { slug: 'meridian', file: '2026-09-24 17-25-54.mp4', at: 7.0 },
  // full-bleed hero → categories → Old Wood, New Life → objects → Storage That Earns Its Wall
  { slug: 'big-brain-furniture-alt', file: '2026-09-24 17-26-44.mp4', at: 2.7 },
];

const LOOP = 5;       // seconds, as the reference
const FPS = 20;       // as the reference
const SPEED = 1.5;    // recordings are browsed at reading pace; 1.5x reads as motion in a 5 s loop
const FADE = 0.5;     // tail-into-head crossfade
const CELL = { w: 640, h: 360 };
const COLS = 3;
const ROWS = Math.ceil(CLIPS.length / COLS);

const run = (args, opts = {}) => {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', ...args], { stdio: ['ignore', opts.capture ? 'pipe' : 'inherit', 'inherit'], maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${r.status ?? r.error?.message})`);
  return r.stdout;
};

const tmp = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'ff-vatlas-'));
const cropW = Math.round((CROP.h * 16) / 9 / 2) * 2; // 16:9 out of the viewport, centred
const cropX = CROP.x + Math.round((CROP.w - cropW) / 2);

// recordings are BT.709; say so explicitly, or browsers guess the matrix and colours shift
const BT709 = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];

// 1. each clip: crop, cut, speed up, 20 fps, then close the loop. Decode N + F frames starting F frames
// BEFORE `at` (N = 100 output frames, F = 10 fade frames), so output frame k is source frame k + F and
// frame 0 is exactly `at`. Over the last F frames the output blends toward the lead-in frame
// k - (N - F) with weight (k - (N - F) + 1) / F: the last frame is the one just before `at`, and the
// wrap is one ordinary step.
// (ffmpeg's xfade stops at 90% on the last frame, which left a visible ghost on fast scrolls.)
const N = LOOP * FPS, F = Math.round(FADE * FPS), FRAME = CELL.w * CELL.h * 3;
CLIPS.forEach((c, i) => {
  const src = path.join(SRC, c.file);
  if (!fs.existsSync(src)) throw new Error(`missing recording: ${src}`);
  const speed = c.speed ?? SPEED; const lead = (F / FPS) * speed;
  if (c.at < lead) throw new Error(`${c.slug}: at must be >= ${lead}s (the loop's lead-in comes from before it)`);
  const raw = run(['-ss', String(c.at - lead), '-t', String(((N + F + 2) / FPS) * speed), '-i', src, '-vf',
    `crop=${cropW}:${CROP.h}:${cropX}:${CROP.y},setpts=(PTS-STARTPTS)/${speed},fps=${FPS},scale=${CELL.w}:${CELL.h}:flags=lanczos`,
    '-frames:v', String(N + F), '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { capture: true });
  if (raw.length < (N + F) * FRAME) throw new Error(`${c.slug}: recording too short after ${c.at}s`);
  const frame = (j) => raw.subarray(j * FRAME, (j + 1) * FRAME);
  const out = Buffer.alloc(N * FRAME);
  for (let k = 0; k < N; k++) {
    const body = frame(k + F); const dst = out.subarray(k * FRAME, (k + 1) * FRAME);
    if (k < N - F) { body.copy(dst); continue; }
    const head = frame(k - (N - F)); const w = (k - (N - F) + 1) / F;
    for (let p = 0; p < FRAME; p++) dst[p] = Math.round(body[p] * (1 - w) + head[p] * w);
  }
  const rawFile = path.join(tmp, `${i}.rgb`); fs.writeFileSync(rawFile, out);
  run(['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${CELL.w}x${CELL.h}`, '-r', String(FPS), '-i', rawFile,
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', ...BT709, '-an', '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', path.join(tmp, `${i}.mp4`)]);
  fs.rmSync(rawFile);
  console.log('clip', c.slug);
});

// 2. pack into one grid and encode both sizes
const inputs = CLIPS.flatMap((_, i) => ['-i', path.join(tmp, `${i}.mp4`)]);
const layout = CLIPS.map((_, i) => `${(i % COLS) * CELL.w}_${Math.floor(i / COLS) * CELL.h}`).join('|');
const W = COLS * CELL.w, H = ROWS * CELL.h;
const stack = `${CLIPS.map((_, i) => `[${i}:v]`).join('')}xstack=inputs=${CLIPS.length}:layout=${layout}:fill=black,pad=${W}:${H}:0:0:black,setsar=1`;
const out = 'public/media/video'; fs.mkdirSync(out, { recursive: true });
const enc = (scale, crf, file) => run([...inputs, '-filter_complex', `${stack}${scale ? `,scale=${scale}:flags=lanczos` : ''}[v]`, '-map', '[v]',
  '-frames:v', String(LOOP * FPS), '-r', String(FPS), '-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-crf', String(crf), '-preset', 'slow', '-g', String(LOOP * FPS), ...BT709, '-movflags', '+faststart', path.join(out, file)]);
enc(null, 24, 'atlas.mp4');
enc(`${W / 2}:${H / 2}`, 24, 'atlas-phone.mp4');

// 3. manifest: each project's rectangle in the atlas, in pixels (top-left origin)
const cells = Object.fromEntries(CLIPS.map((c, i) => [c.slug, [(i % COLS) * CELL.w, Math.floor(i / COLS) * CELL.h, CELL.w, CELL.h]]));
fs.writeFileSync('src/video-atlas.json', JSON.stringify({ src: '/media/video/atlas.mp4', srcPhone: '/media/video/atlas-phone.mp4', width: W, height: H, aspect: CELL.w / CELL.h, cells }, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
for (const f of ['atlas.mp4', 'atlas-phone.mp4']) console.log(f, (fs.statSync(path.join(out, f)).size / 1e6).toFixed(2), 'MB');
