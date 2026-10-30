// The contour flood's sprites (npm run flood): two strips of twelve frames of a growing blob, as
// alpha-only WebP, written next to the component that masks with them
// (src/components/interaction/). The blob's edge is value noise quantised into seven levels, so
// it reads as a few contour lines stepping outwards rather than a soft gradient.
//
//   radial  frame = twice the element in each direction, the blob centred: the flood grows from
//           where the pointer entered (or a finger tapped) until it covers the element from any
//           entry point;
//   sweep   frame = the element: the flood runs left to right (keyboard focus).
//
// Deterministic (seeded noise), so a re-run is byte-identical. Each file must stay ≤ 15 KB.
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "src/components/interaction");
const FRAMES = 12;
const LEVELS = 6;
const BUDGET = 15 * 1024;

/** Smooth 2D value noise in [0, 1], seeded (a hash per lattice point, smoothstep between). */
function valueNoise(seed) {
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const tx = smooth(x - xi), ty = smooth(y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

/** Two octaves of noise, quantised into LEVELS steps: the edge's contour terraces. */
function terraced(seed, scale) {
  const n1 = valueNoise(seed);
  const n2 = valueNoise(seed + 17);
  return (x, y) => {
    const v = 0.7 * n1(x * scale, y * scale) + 0.3 * n2(x * scale * 2.3, y * scale * 2.3);
    return Math.floor(v * LEVELS) / (LEVELS - 1);
  };
}

/**
 * One strip: `field(u, v)` is how far a pixel is from the flood's origin (0 at the origin) for
 * frame-normalised u, v in [0, 1]; frame i covers everything below its threshold. The edge band
 * steps down in LEVELS alpha levels: a few contour lines.
 */
async function strip(name, { width, height, field, thresholds, band }) {
  const data = Buffer.alloc(width * FRAMES * height * 4);
  for (let f = 0; f < FRAMES; f++) {
    const t = thresholds[f];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const d = field(x / (width - 1), y / (height - 1));
        const raw = Math.min(1, Math.max(0, (t - d) / band));
        const a = Math.round(Math.ceil(raw * (LEVELS - 1)) / (LEVELS - 1) * 255);
        const i = (y * width * FRAMES + f * width + x) * 4;
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = a;
      }
    }
  }
  const file = join(outDir, `flood-${name}.webp`);
  await sharp(data, { raw: { width: width * FRAMES, height, channels: 4 } })
    .webp({ lossless: true, effort: 6 })
    .toFile(file);
  const bytes = statSync(file).size;
  console.log(`  flood-${name}.webp  ${width * FRAMES}×${height}  ${(bytes / 1024).toFixed(1)} KB`);
  if (bytes > BUDGET) throw new Error(`flood-${name}.webp is ${(bytes / 1024).toFixed(1)} KB, over the 15 KB budget`);
}

mkdirSync(outDir, { recursive: true });
const step = (i) => i / (FRAMES - 1);

// Radial: distance from the frame's centre (an ellipse that the element's aspect stretches),
// pushed in and out by the terraced noise. The last frame covers the whole frame.
{
  const noise = terraced(7, 3);
  const amp = 0.16;
  const band = 0.26;
  await strip("radial", {
    width: 96,
    height: 64,
    field: (u, v) => Math.hypot(u * 2 - 1, v * 2 - 1) + amp * (noise(u * 1.5, v) - 0.5) * 2,
    thresholds: Array.from({ length: FRAMES }, (_, i) => 0.1 + step(i) * (Math.SQRT2 + amp + band)),
    band,
  });
}

// Sweep: left to right, the front pushed by the same kind of noise along the height.
{
  const noise = terraced(11, 3);
  const amp = 0.12;
  const band = 0.18;
  await strip("sweep", {
    width: 96,
    height: 32,
    field: (u, v) => u + amp * (noise(u * 2, v * 1.2) - 0.5) * 2,
    thresholds: Array.from({ length: FRAMES }, (_, i) => -amp + 0.06 + step(i) * (1 + 2 * amp + band)),
    band,
  });
}
