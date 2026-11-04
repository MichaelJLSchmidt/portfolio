// Field heightmaps: one map per page type within the transfer budget (≤ 150 KB, lossless WebP):
// the home region (Interlaken), Bern (About) and each case study's summit. They are derived from
// the full-resolution masters `npm run terrain` and `npm run terrain:bern` write to terrain/ (the
// repository's, not public/: the site never loads them), area-averaged down to the largest width
// under the budget, and described in public/terrain/field/field.json for the site and the gate
// (src/field). The terrain scripts run it at their end; on its own:
//   npm run terrain:field
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gaussianBlur, resampleArea } from "./lib/grid.mjs";
import { decodeRawHeights, encodeLosslessWebp, encodeRawHeights, gradientPercentiles, packHeightRgb, probeTexels, rasterHash } from "./lib/heightmap.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "public/terrain/field");
const BUDGET = 150 * 1024;
mkdirSync(outDir, { recursive: true });

const masters = join(root, "terrain");
const json = (p) => JSON.parse(readFileSync(join(masters, p), "utf8"));
const region = json("terrain.json");
const bern = json("bern/bern.json");
const examples = existsSync(join(masters, "examples.json")) ? json("examples.json") : { cards: {} };

/** The heights of a master (metres, Float32), from its raw file. */
function heights(map, encoding) {
  const file = join(masters, map.raw.file.replace(/^\/terrain\//, ""));
  const rgb = decodeRawHeights(readFileSync(file), map.width, map.height);
  const out = new Float32Array(map.width * map.height);
  for (let i = 0; i < out.length; i++) out[i] = encoding.offset + ((rgb[i * 3] << 8) | rgb[i * 3 + 1]) * encoding.scale;
  return out;
}

const ALPINE = [50, 100, 200, 250, 500];
const LOWLAND = [10, 20, 50];

/**
 * The largest width (in 16 px steps) whose lossless WebP stays within the budget. A light blur
 * (like the gate's poster: σ ≈ 1 texel) and a coarser height step than the masters' (a fraction of
 * the finest contour interval, so no line moves visibly) keep the fine terrain within it.
 */
async function fit(id, data, w, h, encoding, sigma = 0) {
  for (let dw = Math.min(w, 1024); dw >= 256; dw -= 16) {
    const dh = Math.round((dw * h) / w);
    let d = dw === w ? data : resampleArea(data, w, h, dw, dh);
    if (sigma) d = gaussianBlur(d, dw, dh, sigma);
    const rgb = packHeightRgb(d, dw, dh, encoding);
    const webp = await encodeLosslessWebp(rgb, dw, dh);
    if (webp.length > BUDGET) continue;
    const raw = encodeRawHeights(rgb, dw, dh);
    writeFileSync(join(outDir, `${id}.webp`), webp);
    writeFileSync(join(outDir, `${id}.bin`), raw);
    console.log(`  ${id.padEnd(9)} ${dw}×${dh}  WebP ${(webp.length / 1024).toFixed(1)} KB  raw ${(raw.length / 1024).toFixed(1)} KB`);
    return {
      file: `/terrain/field/${id}.webp`,
      raw: `/terrain/field/${id}.bin`,
      width: dw,
      height: dh,
      bytes: webp.length,
      sha256: rasterHash(rgb),
      encoding,
      gradientM: gradientPercentiles(d, dw, dh),
      probe: probeTexels(rgb, dw, dh),
    };
  }
  throw new Error(`${id}: no width fits the ${BUDGET / 1024} KB budget`);
}

const terrains = {};
/** Flagged examples' summits: their own file, which live builds swap for an empty one (next.config.ts). */
const exampleTerrains = {};
console.log("Field heightmaps (≤ 150 KB each):");

// The region: the largest master, framed on Interlaken.
{
  const master = [...region.heightmaps].sort((a, b) => b.width - a.width)[0];
  const data = heights(master, region.encoding);
  // Lines every 200 m on most screens (100 m on the largest): 4 m steps are 2 % of the finest.
  const out = await fit("region", data, master.width, master.height, { offset: region.encoding.offset, scale: 4 }, 1.1);
  terrains.region = { ...out, intervalsM: ALPINE, focus: { u: region.region.focus.u, v: region.region.focus.v }, label: region.region.focus.label };
}

// Bern: framed on the zero point; on portrait screens from the window's west edge.
{
  const master = [...bern.heightmaps].sort((a, b) => b.width - a.width)[0];
  const data = heights(master, bern.encoding);
  // Lines every 10–20 m: 0.5 m steps.
  const out = await fit("bern", data, master.width, master.height, { offset: bern.encoding.offset, scale: 0.5 }, 1);
  terrains.bern = { ...out, intervalsM: LOWLAND, focus: { u: bern.zeroPoint.u, v: bern.zeroPoint.v, uPortrait: 0 }, label: "Bern" };
}

// The summits: each case study's peak, centred.
for (const [id, card] of Object.entries(examples.cards ?? {})) {
  const m = card.morph;
  if (!m) continue;
  const data = heights(m, m.encoding);
  const out = await fit(id, data, m.width, m.height, m.encoding);
  exampleTerrains[id] = { ...out, intervalsM: ALPINE, focus: { u: 0.5, v: 0.5 }, label: id };
}

// Posters (npm run posters) are kept across a re-derivation, per terrain.
const keep = (file) => (existsSync(join(outDir, file)) ? JSON.parse(readFileSync(join(outDir, file), "utf8")).posters ?? {} : {});
const write = (file, t) => {
  const posters = Object.fromEntries(Object.entries(keep(file)).filter(([id]) => id in t));
  writeFileSync(join(outDir, file), `${JSON.stringify({ $comment: "Written by npm run terrain:field (scripts/terrain/field.mjs); posters by npm run posters.", budgetBytes: BUDGET, terrains: t, posters }, null, 2)}\n`);
  console.log(`Wrote public/terrain/field/${file}`);
};
write("field.json", terrains);
write("examples.json", exampleTerrains);
