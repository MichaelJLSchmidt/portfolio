// Seeded fictional terrain for project cards: the collector number is the seed,
// so every card gets a stable, unique little mountain.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGradientNoise(rand) {
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grads = Array.from({ length: 16 }, (_, i) => [Math.cos((i / 16) * Math.PI * 2), Math.sin((i / 16) * Math.PI * 2)]);
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const dot = (hash, x, y) => {
    const g = grads[hash & 15];
    return g[0] * x + g[1] * y;
  };
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    const u = fade(xf), v = fade(yf);
    const x1 = dot(aa, xf, yf) + u * (dot(ba, xf - 1, yf) - dot(aa, xf, yf));
    const x2 = dot(ab, xf, yf - 1) + u * (dot(bb, xf - 1, yf - 1) - dot(ab, xf, yf - 1));
    return x1 + v * (x2 - x1); // roughly -0.7..0.7
  };
}

/** Returns a Float32Array of elevations in metres within [min, max]. */
export function seededTerrain(width, height, seed, [minElev, maxElev]) {
  const rand = mulberry32(seed * 7919 + 17);
  const noise = makeGradientNoise(rand);
  const warp = makeGradientNoise(rand);
  const ox = rand() * 100, oy = rand() * 100;
  // A dominant summit somewhere in the upper-middle of the frame.
  const peakX = 0.45 + rand() * 0.25, peakY = 0.3 + rand() * 0.2;
  const out = new Float32Array(width * height);
  const aspect = width / height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x / width) * aspect, v = y / height;
      const wx = u * 1.6 + 0.6 * warp(u * 1.1 + ox, v * 1.1 + oy);
      const wy = v * 1.6 + 0.6 * warp(u * 1.1 + oy + 31, v * 1.1 + ox + 17);
      // Smooth fBm for the body of the land, a couple of ridged octaves for alpine crests.
      let amp = 1, freq = 1, body = 0, norm = 0;
      for (let o = 0; o < 4; o++) {
        body += noise(wx * freq + ox, wy * freq + oy) * amp;
        norm += amp;
        amp *= 0.42;
        freq *= 2.1;
      }
      body /= norm;
      const r1 = 1 - Math.abs(noise(wx * 1.3 + 11, wy * 1.3 + 7) * 1.5);
      const r2 = 1 - Math.abs(noise(wx * 2.7 + 5, wy * 2.7 + 3) * 1.5);
      const ridges = r1 * r1 * 0.7 + r2 * r2 * 0.3;
      const dx = x / width - peakX, dy = y / height - peakY;
      const massif = Math.exp(-(dx * dx * aspect * aspect + dy * dy) / 0.1);
      out[y * width + x] = body * 0.62 + ridges * (0.25 + massif) * 0.5 + massif * 0.5 - (y / height) * 0.1;
    }
  }
  let lo = Infinity, hi = -Infinity;
  for (const v of out) { if (v < lo) lo = v; if (v > hi) hi = v; }
  for (let i = 0; i < out.length; i++) {
    const t = (out[i] - lo) / (hi - lo);
    out[i] = minElev + Math.pow(t, 1.35) * (maxElev - minElev);
  }
  return out;
}

/** A gentle trail from a low point in the lower part of the frame up to the summit. */
export function autoTrail(data, width, height, samples = 32) {
  let peak = 0;
  for (let i = 1; i < data.length; i++) if (data[i] > data[peak]) peak = i;
  const px = (peak % width) + 0.5, py = Math.floor(peak / width) + 0.5;
  let low = -1;
  for (let y = Math.floor(height * 0.72); y < height - 2; y++)
    for (let x = 2; x < width - 2; x++) {
      const i = y * width + x;
      if (low < 0 || data[i] < data[low]) low = i;
    }
  const sx = (low % width) + 0.5, sy = Math.floor(low / width) + 0.5;
  const mx = (sx + px) / 2, my = (sy + py) / 2;
  const nx = -(py - sy), ny = px - sx;
  const len = Math.hypot(nx, ny) || 1;
  const cx = mx + (nx / len) * width * 0.12, cy = my + (ny / len) * width * 0.12;
  const pts = [];
  for (let k = 0; k <= samples; k++) {
    const t = k / samples;
    const x = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * px;
    const y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * py;
    pts.push([x / width, y / height]);
  }
  return pts;
}
