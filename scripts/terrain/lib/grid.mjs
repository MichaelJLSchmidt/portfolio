// Small raster helpers on row-major Float32Array grids.

/** Area-weighted 1D resample of `count` lines of length sn → dn. */
function resampleLines(src, sn, dn, count, stride, step) {
  const out = new Float32Array(dn * count);
  const scale = sn / dn;
  for (let line = 0; line < count; line++) {
    for (let d = 0; d < dn; d++) {
      const a = d * scale;
      const b = a + scale;
      let sum = 0;
      let wsum = 0;
      for (let s = Math.floor(a); s < Math.min(Math.ceil(b), sn); s++) {
        const w = Math.min(b, s + 1) - Math.max(a, s);
        const v = src[line * stride + s * step];
        if (w > 0 && Number.isFinite(v)) {
          sum += v * w;
          wsum += w;
        }
      }
      out[line * dn + d] = wsum > 0 ? sum / wsum : NaN;
    }
  }
  return out;
}

/** Box-filter (area average) resample, good for downsampling DEMs without aliasing. */
export function resampleArea(data, sw, sh, dw, dh) {
  const rows = resampleLines(data, sw, dw, sh, sw, 1); // sh rows of dw
  const cols = resampleLines(rows, sh, dh, dw, 1, dw); // dw columns of dh (column-major)
  const out = new Float32Array(dw * dh);
  for (let x = 0; x < dw; x++) for (let y = 0; y < dh; y++) out[y * dw + x] = cols[x * dh + y];
  return out;
}

/** Bilinear sample at fractional pixel coordinates (pixel centres at integer + 0.5). */
export function sampleBilinear(data, w, h, px, py) {
  const x = Math.min(Math.max(px - 0.5, 0), w - 1);
  const y = Math.min(Math.max(py - 0.5, 0), h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0, fy = y - y0;
  const a = data[y0 * w + x0], b = data[y0 * w + x1], c = data[y1 * w + x0], d = data[y1 * w + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/** Crops a georeferenced grid to an LV95 bbox and resamples it to dw × dh (supersampled). */
export function cropToBbox(grid, bbox, dw, dh, supersample = 3) {
  const [gMinE, , , gMaxN] = grid.bbox;
  const res = grid.resolution;
  const [minE, minN, maxE, maxN] = bbox;
  const sw = dw * supersample, sh = dh * supersample;
  const tmp = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    const n = maxN - ((y + 0.5) / sh) * (maxN - minN);
    for (let x = 0; x < sw; x++) {
      const e = minE + ((x + 0.5) / sw) * (maxE - minE);
      tmp[y * sw + x] = sampleBilinear(grid.data, grid.width, grid.height, (e - gMinE) / res, (gMaxN - n) / res);
    }
  }
  return resampleArea(tmp, sw, sh, dw, dh);
}

export function gaussianBlur(data, w, h, sigma) {
  if (sigma <= 0) return Float32Array.from(data);
  const radius = Math.ceil(sigma * 3);
  const kernel = [];
  let ksum = 0;
  for (let i = -radius; i <= radius; i++) {
    const k = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(k);
    ksum += k;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= ksum;
  const pass = (src, horizontal) => {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let i = -radius; i <= radius; i++) {
          const xx = horizontal ? Math.min(Math.max(x + i, 0), w - 1) : x;
          const yy = horizontal ? y : Math.min(Math.max(y + i, 0), h - 1);
          sum += src[yy * w + xx] * kernel[i + radius];
        }
        out[y * w + x] = sum;
      }
    }
    return out;
  };
  return pass(pass(data, true), false);
}

export function minMax(data) {
  let min = Infinity, max = -Infinity;
  for (const v of data) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}

/** Replaces NaN cells with the mean of their valid neighbours, iterating until filled. */
export function fillGaps(data, w, h) {
  let missing = data.some((v) => !Number.isFinite(v));
  let guard = 0;
  while (missing && guard++ < 64) {
    missing = false;
    const next = Float32Array.from(data);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (Number.isFinite(data[y * w + x])) continue;
        let sum = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const v = data[yy * w + xx];
          if (Number.isFinite(v)) { sum += v; n++; }
        }
        if (n) next[y * w + x] = sum / n;
        else missing = true;
      }
    }
    data.set(next);
  }
  return data;
}

/**
 * Lake mask by flood fill: lakes are flat in a DTM, so every connected cell within
 * `tolerance` metres of the seed's elevation belongs to the lake surface.
 */
export function floodFlat(data, w, h, sx, sy, tolerance = 0.5) {
  const mask = new Uint8Array(w * h);
  const level = data[sy * w + sx];
  const stack = [sy * w + sx];
  let count = 0;
  while (stack.length) {
    const i = stack.pop();
    if (mask[i]) continue;
    if (Math.abs(data[i] - level) > tolerance) continue;
    mask[i] = 1;
    count++;
    const x = i % w, y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  return { mask, level, count };
}

/**
 * Catmull-Rom (bicubic) resample, for upsampling a DEM past its native resolution: the GPU
 * then interpolates a smooth surface linearly between texels, instead of the native grid's
 * facets. Separable, edges clamped.
 */
export function resampleCubic(data, sw, sh, dw, dh) {
  const k = (t) => {
    t = Math.abs(t);
    return t <= 1 ? 1.5 * t ** 3 - 2.5 * t ** 2 + 1 : t < 2 ? -0.5 * t ** 3 + 2.5 * t ** 2 - 4 * t + 2 : 0;
  };
  // One pass resamples `lines` lines of length sn → dn; `at(line, i)` reads the source.
  const pass = (lines, sn, dn, at, write) => {
    for (let line = 0; line < lines; line++) {
      for (let d = 0; d < dn; d++) {
        const x = ((d + 0.5) * sn) / dn - 0.5;
        const x0 = Math.floor(x);
        let sum = 0, wsum = 0;
        for (let i = -1; i <= 2; i++) {
          const w = k(x - (x0 + i));
          sum += w * at(line, Math.min(Math.max(x0 + i, 0), sn - 1));
          wsum += w;
        }
        write(line, d, sum / wsum);
      }
    }
  };
  const rows = new Float32Array(dw * sh);
  pass(sh, sw, dw, (y, x) => data[y * sw + x], (y, x, v) => (rows[y * dw + x] = v));
  const out = new Float32Array(dw * dh);
  pass(dw, sh, dh, (x, y) => rows[y * dw + x], (x, y, v) => (out[y * dw + x] = v));
  return out;
}
