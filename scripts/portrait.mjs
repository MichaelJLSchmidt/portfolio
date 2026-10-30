// The About portrait: a cut-out photo (a PNG with transparency around the person) encoded for the
// portrait card, with its alpha kept.
//
//   npm run portrait -- path/to/cutout.png [--duotone=0.2] [--contours]
//
// - Widths 480, 800, 1200 and 1600 px, each as AVIF and WebP with alpha, into
//   public/media/portrait/; the 800 px AVIF is the one About preloads (fetchpriority high) and
//   must stay within 120 KB (the quality steps down until it does).
// - A duotone from ground (#1B1C18) to paper-dusk (#C9C5B4) laid over the photo at --duotone
//   (default 0.2, at most 0.2), so the portrait sits in the site's palette without losing the
//   person's own colours.
// - --contours: faint contour lines (8%) over the background part of the cut-out, faded out over
//   the face (an ellipse around the upper middle, where a head-and-shoulders portrait has it).
// - Writes src/content/portrait.json (sizes and sources). Then, in src/content/about.ts, import it
//   as `portrait.image` and delete `missing` (docs/content.md). Deterministic for the same input.
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import "./lib/ts-hooks.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { color } = await import("../src/styles/tokens.ts");

const args = process.argv.slice(2);
const input = args.find((a) => !a.startsWith("--"));
const flag = (name) => args.find((a) => a.startsWith(`--${name}`));
const outDir = resolve(flag("out")?.split("=")[1] ?? join(root, "public/media/portrait"));
const manifest = resolve(flag("manifest")?.split("=")[1] ?? join(root, "src/content/portrait.json"));
const duotone = Math.min(0.2, Math.max(0, Number(flag("duotone")?.split("=")[1] ?? 0.2)));
const contours = !!flag("contours");
const WIDTHS = [480, 800, 1200, 1600];
const HERO = { width: 800, budget: 120 * 1024 };

if (!input) {
  console.error("Usage: npm run portrait -- path/to/cutout.png [--duotone=0.2] [--contours]");
  process.exit(1);
}
const source = sharp(readFileSync(input));
const meta = await source.metadata();
if (!meta.hasAlpha) {
  console.error(`${input} has no transparency: the portrait card needs a cut-out (a PNG with the background removed).`);
  process.exit(1);
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const [lo, hi] = [hex(color.ground), hex(color.paperDusk)];

/** The photo with the duotone mixed in and, optionally, the contour overlay: raw RGBA at width w. */
async function master(w) {
  const { data, info } = await sharp(readFileSync(input)).resize({ width: w }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const y = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(data[i + c] * (1 - duotone) + (lo[c] + (hi[c] - lo[c]) * y) * duotone);
  }
  if (contours) {
    // Concentric rings around the lower middle (the shoulders), 8% strong, faded out inside an
    // ellipse around the face.
    const { width: W, height: H } = info;
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const i = (py * W + px) * 4;
        if (out[i + 3] === 0) continue;
        const r = Math.hypot((px - W / 2) / W, (py - H) / H);
        const ring = Math.abs(((r * 28) % 1) - 0.5) < 0.04 ? 1 : 0;
        const face = Math.hypot((px - W / 2) / (W * 0.24), (py - H * 0.3) / (H * 0.24));
        const k = 0.08 * ring * Math.min(1, Math.max(0, face - 1) * 2);
        for (let c = 0; c < 3; c++) out[i + c] = Math.round(out[i + c] * (1 - k) + hi[c] * k);
      }
    }
  }
  return { data: out, info };
}

mkdirSync(outDir, { recursive: true });
const sources = [];
let height = 0;
for (const w of WIDTHS.filter((w) => w <= (meta.width ?? 0) || w === WIDTHS[0])) {
  const { data, info } = await master(w);
  if (w === HERO.width || !height) height = Math.round((info.height / info.width) * HERO.width);
  const raw = () => sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  for (const format of ["avif", "webp"]) {
    let quality = format === "avif" ? 62 : 80;
    let file;
    for (;;) {
      file = join(outDir, `portrait-${w}.${format}`);
      await raw()[format]({ quality, effort: format === "avif" ? 6 : 5, alphaQuality: 90 }).toFile(file);
      // The preloaded hero must fit its budget: step the quality down until it does.
      if (!(w === HERO.width && format === "avif") || statSync(file).size <= HERO.budget || quality <= 30) break;
      quality -= 4;
    }
    const bytes = statSync(file).size;
    sources.push({ format, width: w, src: `/media/portrait/portrait-${w}.${format}`, bytes });
    console.log(`  portrait-${w}.${format}  q${quality}  ${(bytes / 1024).toFixed(1)} KB`);
  }
}
const hero = sources.find((s) => s.width === HERO.width && s.format === "avif");
if (hero && hero.bytes > HERO.budget) throw new Error(`portrait-800.avif is ${(hero.bytes / 1024).toFixed(1)} KB, over the 120 KB budget`);
const data = {
  $comment: "Generated by scripts/portrait.mjs; About's portrait card reads it.",
  width: HERO.width,
  height,
  duotone,
  contours,
  sources,
};
mkdirSync(dirname(manifest), { recursive: true });
writeFileSync(manifest, `${JSON.stringify(data, null, 1)}\n`);
console.log(`Portrait: ${sources.length} files, manifest ${manifest}`);
