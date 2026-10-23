// Packs elevations into the R and G channels of an 8-bit RGB raster (16 bits, no banding).
// value = round((h - offset) / scale); R = value >> 8, G = value & 255, B = 0.
// Shader: h = offset + (R * 65280 + G * 255) * scale, with R and G sampled as 0..1.
//
// The raster ships as lossless WebP (~40% smaller than the filtered PNG). Every encode is
// decoded again and compared byte for byte, so a lossy or colour-managed encode fails the
// build instead of shipping wrong heights. The SHA-256 of the raster goes into terrain.json
// for `npm run verify:terrain`.
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import sharp from "sharp";

export function packHeightRgb(data, width, height, { offset, scale }) {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const v = Math.max(0, Math.min(65535, Math.round((data[i] - offset) / scale)));
    rgb[i * 3] = v >> 8;
    rgb[i * 3 + 1] = v & 255;
  }
  return rgb;
}

export const rasterHash = (rgb) => createHash("sha256").update(rgb).digest("hex");

/** Decodes any image sharp reads into raw 8-bit RGB, without colour management. */
export async function decodeRgb(buffer) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { rgb: new Uint8Array(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
}

export async function encodeLosslessWebp(rgb, width, height) {
  const webp = await sharp(Buffer.from(rgb.buffer, rgb.byteOffset, rgb.length), { raw: { width, height, channels: 3 } })
    .webp({ lossless: true, effort: 6, exact: true })
    .toBuffer();
  const back = await decodeRgb(webp);
  if (back.width !== width || back.height !== height || Buffer.compare(Buffer.from(back.rgb), Buffer.from(rgb)) !== 0) {
    throw new Error(`lossless WebP round trip changed the ${width}×${height} heightmap`);
  }
  return webp;
}

/** Gradient magnitude percentiles in metres per texel: how steep the terrain looks on this raster. */
export function gradientPercentiles(data, width, height, ps = [50, 90, 95, 99]) {
  const g = new Float32Array((width - 2) * (height - 2));
  let k = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      g[k++] = Math.hypot((data[i + 1] - data[i - 1]) / 2, (data[i + width] - data[i - width]) / 2);
    }
  }
  g.sort();
  return Object.fromEntries(ps.map((p) => [`p${p}`, Math.round(g[Math.min(g.length - 1, Math.floor((p / 100) * g.length))] * 100) / 100]));
}

/**
 * Reference texels for the runtime decode check: a 4×4 grid of [x, y, R, G] read from the
 * packed raster. The site renders these texels from the uploaded texture once per session and
 * compares them, so a browser that colour-manages the image is caught.
 */
export function probeTexels(rgb, width, height, grid = 4) {
  const probe = [];
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      const x = Math.min(width - 1, Math.floor(((i + 0.5) / grid) * width));
      const y = Math.min(height - 1, Math.floor(((j + 0.5) / grid) * height));
      const k = (y * width + x) * 3;
      probe.push([x, y, rgb[k], rgb[k + 1]]);
    }
  }
  return probe;
}

// Raw heights: the session fallback when a browser alters the decoded image. Plain uint16 data
// cannot be colour-managed. Each value is predicted from its left, upper and upper-left
// neighbours (a + b - c), the residual is zigzag-coded, high bytes come before low bytes,
// and the whole is gzipped here (hosts don't reliably compress binary files). That is ~10%
// smaller than the lossless WebP; the browser decodes it with DecompressionStream.
const heightOf = (rgb, i) => (rgb[i * 3] << 8) | rgb[i * 3 + 1];

export function encodeRawHeights(rgb, width, height) {
  const n = width * height;
  const out = new Uint8Array(n * 2);
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i++) {
      const a = x > 0 ? heightOf(rgb, i - 1) : y > 0 ? heightOf(rgb, i - width) : 0;
      const b = y > 0 ? heightOf(rgb, i - width) : a;
      const c = x > 0 && y > 0 ? heightOf(rgb, i - width - 1) : b;
      const d = ((heightOf(rgb, i) - (a + b - c)) << 16) >> 16;
      const z = ((d << 1) ^ (d >> 31)) & 0xffff;
      out[i] = z >> 8;
      out[n + i] = z & 255;
    }
  }
  return gzipSync(out, { level: 9 });
}

/** Inverse of encodeRawHeights, as the site does it; returns the packed RGB raster. */
export function decodeRawHeights(gz, width, height) {
  const planes = gunzipSync(gz);
  const n = width * height;
  const v = new Uint16Array(n);
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i++) {
      const a = x > 0 ? v[i - 1] : y > 0 ? v[i - width] : 0;
      const b = y > 0 ? v[i - width] : a;
      const c = x > 0 && y > 0 ? v[i - width - 1] : b;
      const z = (planes[i] << 8) | planes[n + i];
      v[i] = (a + b - c + ((z >>> 1) ^ -(z & 1))) & 0xffff;
    }
  }
  const rgb = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = v[i] >> 8;
    rgb[i * 3 + 1] = v[i] & 255;
  }
  return rgb;
}
