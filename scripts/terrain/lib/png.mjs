// Packs elevations into the R and G channels of an 8-bit RGB PNG (16 bits, no banding).
// value = round((h - offset) / scale); R = value >> 8, G = value & 255.
// Shader: h = offset + (R * 65280 + G * 255) * scale, with R and G sampled as 0..1.
//
// A tiny encoder with per-row adaptive filtering: smooth terrain compresses several
// times better with Paeth/Sub filters than with the unfiltered rows most JS encoders write.
import { constants, crc32, deflateSync } from "node:zlib";

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export function encodeRgbPng(rgb, width, height) {
  const bpp = 3;
  const stride = width * bpp;
  const out = Buffer.alloc((stride + 1) * height);
  const candidate = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = rgb.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? rgb.subarray((y - 1) * stride, y * stride) : null;
    let bestScore = Infinity;
    for (let f = 0; f <= 4; f++) {
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? row[i - bpp] : 0;
        const b = prev ? prev[i] : 0;
        const c = prev && i >= bpp ? prev[i - bpp] : 0;
        const pred = f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c);
        const v = (row[i] - pred) & 255;
        candidate[i] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        out[y * (stride + 1)] = f;
        candidate.copy(out, y * (stride + 1) + 1);
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(out, { level: 9, memLevel: 9, strategy: constants.Z_FILTERED })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function packHeightPng(data, width, height, { offset, scale }) {
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const v = Math.max(0, Math.min(65535, Math.round((data[i] - offset) / scale)));
    rgb[i * 3] = v >> 8;
    rgb[i * 3 + 1] = v & 255;
  }
  return encodeRgbPng(rgb, width, height);
}
