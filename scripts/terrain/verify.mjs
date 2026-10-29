// Verifies that every committed heightmap decodes to exactly the heights the pipeline wrote.
//
//   npm run verify:terrain              decode each WebP with libwebp (sharp) and compare
//   npm run verify:terrain -- --browser also decode it in Chromium the way the site does
//
// Covers the region, the card terrains and the Basecamp terrain (public/terrain/bern/bern.json).
//
// The reference is the SHA-256 of the packed RGB raster, recorded in terrain.json when the
// file was encoded (scripts/terrain/lib/heightmap.mjs). PNG copies written with --png are
// compared too. The browser check uses Playwright if it can be resolved (`npm i -D
// playwright`, or NODE_PATH pointing at a global install): createImageBitmap with no
// colour-space conversion, no premultiplied alpha and no flip, uploaded to a WebGL2 texture
// and read back, which is the path ContourField takes.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { decodeRawHeights, decodeRgb, rasterHash } from "./lib/heightmap.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const publicDir = join(root, "public");
const meta = JSON.parse(readFileSync(join(publicDir, "terrain/terrain.json"), "utf8"));
// Flagged examples keep their card terrains in examples.json.
const examples = JSON.parse(readFileSync(join(publicDir, "terrain/examples.json"), "utf8"));
// The Basecamp terrain (npm run terrain:bern) keeps its own manifest.
const bernFile = join(publicDir, "terrain/bern/bern.json");
const bern = existsSync(bernFile) ? JSON.parse(readFileSync(bernFile, "utf8")) : { heightmaps: [] };
const maps = [...meta.heightmaps, ...[...Object.values(meta.cards), ...Object.values(examples.cards)].map((c) => c.morph), ...bern.heightmaps];
let failed = 0;
const fail = (msg) => {
  failed++;
  console.error(`  ✗ ${msg}`);
};

console.log("Heightmaps (libwebp decode):");
for (const map of maps) {
  const file = join(publicDir, map.file);
  const { rgb, width, height } = await decodeRgb(readFileSync(file));
  if (width !== map.width || height !== map.height) fail(`${map.file}: ${width}×${height}, expected ${map.width}×${map.height}`);
  else if (rasterHash(rgb) !== map.sha256) fail(`${map.file}: decoded raster does not match the recorded SHA-256`);
  else if (rgb.some((v, i) => i % 3 === 2 && v !== 0)) fail(`${map.file}: blue channel is not empty`);
  else console.log(`  ✓ ${map.file}  ${width}×${height}`);
  if (map.raw) {
    const raw = decodeRawHeights(readFileSync(join(publicDir, map.raw.file)), map.width, map.height);
    if (rasterHash(raw) !== map.sha256) fail(`${map.raw.file}: raw fallback does not match the WebP's heights`);
    else console.log(`  ✓ ${map.raw.file}  raw fallback matches`);
  }
  const png = file.replace(/\.webp$/, ".png");
  if (existsSync(png)) {
    const copy = await decodeRgb(readFileSync(png));
    if (rasterHash(copy.rgb) !== map.sha256) fail(`${map.file}: PNG copy differs from the WebP`);
    else console.log(`  ✓ ${map.file.replace(/\.webp$/, ".png")} matches`);
  }
}

if (process.argv.includes("--browser")) {
  let playwright;
  try {
    playwright = createRequire(import.meta.url)("playwright");
  } catch {
    console.error("\nBrowser check skipped: Playwright is not installed (npm i -D playwright, then npx playwright install chromium).");
    process.exit(failed ? 1 : 2);
  }
  console.log("\nHeightmaps (Chromium: createImageBitmap → WebGL2 texture → readPixels):");
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  for (const map of maps) {
    const base64 = readFileSync(join(publicDir, map.file)).toString("base64");
    const result = await page.evaluate(async ({ base64, width, height }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/webp" }), {
        imageOrientation: "from-image",
        premultiplyAlpha: "none",
        colorSpaceConversion: "none",
      });
      const gl = new OffscreenCanvas(1, 1).getContext("webgl2");
      if (!gl) return { error: "no WebGL2" };
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const rgba = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      // Row 0 of the read-back is the texture's first row, i.e. the image's top row (no flip).
      const rgb = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) {
        rgb[i * 3] = rgba[i * 4];
        rgb[i * 3 + 1] = rgba[i * 4 + 1];
        rgb[i * 3 + 2] = rgba[i * 4 + 2];
      }
      // about:blank has no crypto.subtle: hand the raster back as base64 and hash it in Node.
      let binary = "";
      for (let i = 0; i < rgb.length; i += 0x8000) binary += String.fromCharCode(...rgb.subarray(i, i + 0x8000));
      return { rgb: btoa(binary), w: bitmap.width, h: bitmap.height };
    }, { base64, width: map.width, height: map.height });
    if (result.error) fail(`${map.file}: ${result.error}`);
    else if (result.w !== map.width || result.h !== map.height) fail(`${map.file}: browser decoded ${result.w}×${result.h}`);
    else if (rasterHash(Buffer.from(result.rgb, "base64")) !== map.sha256) fail(`${map.file}: browser-decoded texture does not match the source raster`);
    else console.log(`  ✓ ${map.file}`);
  }
  await browser.close();
}

if (failed) {
  console.error(`\n${failed} heightmap check(s) failed.`);
  process.exit(1);
}
console.log("\nAll heightmaps decode to the exact source heights.");
