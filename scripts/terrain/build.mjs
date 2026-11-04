// Terrain pipeline: swisstopo elevation → heightmaps and the card terrains' summit heightmaps.
//
//   npm run terrain              build from the cached download (fetches once if missing)
//   npm run terrain -- --refresh re-download the elevation window
//   npm run terrain -- --placeholder  skip the network and use procedural terrain
//   npm run terrain -- --png     also write PNG copies of every heightmap (not used by the site)
//   npm run terrain -- --only=<id>      rebuild only these seeded card terrains (no download)
//
// Outputs (terrain/, committed; the site never loads them): heightmap-{1024,1536,2048}.webp
// (lossless) with .bin raw-height fallbacks, morph/*.webp (+ .bin) and terrain.json. Cards
// flagged "example" in the config (fictional examples) are listed in examples.json instead.
// The field's maps (public/terrain/field/, ≤ 150 KB each) and the card plates (public/plates/)
// are derived from these at the end (npm run terrain:field, npm run plates); the posters need
// Playwright (npm run posters).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { bboxToLv95, wgs84ToLv95 } from "./lib/lv95.mjs";
import { readWindow, resolveCogUrl } from "./lib/source.mjs";
import { cropToBbox, fillGaps, gaussianBlur, minMax, resampleArea } from "./lib/grid.mjs";
import { seededTerrain } from "./lib/noise.mjs";
import { decodeRawHeights, encodeLosslessWebp, encodeRawHeights, gradientPercentiles, packHeightRgb, probeTexels, rasterHash } from "./lib/heightmap.mjs";
import { encodeRgbPng } from "./lib/png.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cfg = JSON.parse(readFileSync(join(root, "src/content/terrain.config.json"), "utf8"));
const outDir = join(root, "terrain");
const cacheDir = join(root, "scripts/terrain/.cache");
const args = new Set(process.argv.slice(2));
const log = (...m) => console.log(...m);
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

mkdirSync(join(outDir, "morph"), { recursive: true });

function write(rel, data) {
  const file = join(outDir, rel);
  writeFileSync(file, data);
  const bytes = Buffer.byteLength(data);
  const gz = gzipSync(data, { level: 9 }).length;
  log(`  wrote terrain/${rel}  ${(bytes / 1024).toFixed(1)} KB  (${(gz / 1024).toFixed(1)} KB gz)`);
  return { bytes, gzipBytes: gz };
}

/**
 * Writes a heightmap as lossless WebP, its raw-height fallback (.bin) and, with --png, a PNG
 * copy; returns its metadata with reference texels for the runtime decode check.
 */
async function writeHeightmap(name, data, width, height, encoding) {
  const rgb = packHeightRgb(data, width, height, encoding);
  const size = write(`${name}.webp`, await encodeLosslessWebp(rgb, width, height));
  const raw = encodeRawHeights(rgb, width, height);
  if (Buffer.compare(Buffer.from(decodeRawHeights(raw, width, height)), Buffer.from(rgb)) !== 0) {
    throw new Error(`raw height fallback for ${name} does not round-trip`);
  }
  const rawSize = write(`${name}.bin`, raw);
  if (args.has("--png")) write(`${name}.png`, encodeRgbPng(rgb, width, height));
  return {
    file: `/terrain/${name}.webp`,
    width,
    height,
    sha256: rasterHash(rgb),
    gradientM: gradientPercentiles(data, width, height),
    probe: probeTexels(rgb, width, height),
    raw: { file: `/terrain/${name}.bin`, bytes: rawSize.bytes },
    ...size,
  };
}

// Card terrains: the summit heightmap a case study's plates (npm run plates) and field map
// (npm run terrain:field) are derived from. Crop cards cut the real terrain (they need the
// elevation grid); seeded cards are generated from their seed alone.
async function buildCard(card) {
  const morphW = card.morphWidth;
  const morphH = Math.round(morphW / card.aspect);
  let morph, bboxLv95 = null, interval;
  if (card.kind === "crop") {
    const [ce, cn] = card.centerLv95 ?? wgs84ToLv95(card.center.lon, card.center.lat);
    const wM = card.widthKm * 1000, hM = wM / card.aspect;
    bboxLv95 = [ce - wM / 2, cn - hM / 2, ce + wM / 2, cn + hM / 2].map((v) => Math.round(v));
    morph = gaussianBlur(cropToBbox(grid, bboxLv95, morphW, morphH, 3), morphW, morphH, cfg.heightmapBlurSigma ?? 0);
    interval = card.contourIntervalM;
  } else {
    morph = seededTerrain(morphW, morphH, card.seed, card.elevationRangeM);
    const [lo, hi] = card.elevationRangeM;
    interval = Math.max(10, Math.round((hi - lo) / (card.lines + 1) / 10) * 10);
  }
  const [mMin, mMax] = minMax(morph);
  const morphEncoding = { channels: "RG", offset: round(Math.floor(mMin * 4) / 4), scale: cfg.quantisationM };
  const morphMap = await writeHeightmap(`morph/${card.id}`, morph, morphW, morphH, morphEncoding);
  return {
    kind: card.kind,
    contourIntervalM: interval,
    indexEvery: card.indexEvery,
    bboxLv95,
    morph: {
      ...morphMap,
      elevation: { min: round(mMin, 1), max: round(mMax, 1) },
      encoding: morphEncoding,
    },
  };
}

// --only: rebuild some card terrains and update their metadata in place. Seeded cards need no
// download; crop cards are cut once the elevation grid is in (below), and nothing else is written.
const only = [...args].find((a) => a.startsWith("--only="))?.slice(7).split(",").filter(Boolean);
const onlyCards = only?.map((id) => {
  const card = cfg.cards.find((c) => c.id === id);
  if (!card) throw new Error(`--only: "${id}" is not a card in terrain.config.json`);
  return card;
});
async function rebuildOnly(cards) {
  const metaFile = (example) => join(outDir, example ? "examples.json" : "terrain.json");
  for (const card of cards) {
    const file = metaFile(card.example);
    const meta = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { cards: {} };
    meta.cards = { ...meta.cards, [card.id]: await buildCard(card) };
    writeFileSync(file, `${JSON.stringify(meta, null, 2)}\n`);
    log(`  updated terrain/${card.example ? "examples.json" : "terrain.json"} (${card.id})`);
  }
  process.exit(0);
}
if (onlyCards && onlyCards.every((c) => c.kind === "seeded")) await rebuildOnly(onlyCards);

// ---------------------------------------------------------------------------
// 1. Elevation source
// ---------------------------------------------------------------------------
const requested = bboxToLv95(cfg.region.bboxWgs84);
log(`Region ${cfg.region.name}`);
log(`  WGS84 ${cfg.region.bboxWgs84.join(", ")} → LV95 ${requested.map((v) => Math.round(v)).join(", ")}`);

let grid;
let source;
if (!args.has("--placeholder")) {
  try {
    const cog = await resolveCogUrl({ stacApi: cfg.source.stacApi, collection: cfg.source.collection, item: cfg.source.item });
    log(`  source ${cog.href}`);
    grid = await readWindow({ href: cog.href, bboxLv95: requested, cacheDir, refresh: args.has("--refresh"), log });
    source = {
      product: "swissALTIRegio",
      collection: cfg.source.collection,
      href: cog.href,
      updated: cog.updated,
      resolutionM: grid.resolution,
      placeholder: false,
    };
  } catch (error) {
    log(`  ! elevation download failed (${error.message}); falling back to procedural placeholder terrain`);
  }
}
if (!grid) {
  const res = 40;
  const width = Math.round((requested[2] - requested[0]) / res);
  const height = Math.round((requested[3] - requested[1]) / res);
  grid = { data: seededTerrain(width, height, 566, [558, 4158]), width, height, bbox: requested, resolution: res };
  source = { product: "procedural placeholder", collection: null, href: null, updated: null, resolutionM: res, placeholder: true };
}
fillGaps(grid.data, grid.width, grid.height);
const [minElev, maxElev] = minMax(grid.data);
log(`  grid ${grid.width}×${grid.height} @ ${grid.resolution} m, elevation ${minElev.toFixed(1)}–${maxElev.toFixed(1)} m`);

const [gMinE, , gMaxE, gMaxN] = grid.bbox;
const toGridPx = (lon, lat) => {
  const [e, n] = wgs84ToLv95(lon, lat);
  return [(e - gMinE) / grid.resolution, (gMaxN - n) / grid.resolution];
};
const aspect = grid.width / grid.height;

// ---------------------------------------------------------------------------
// 2. Heightmaps (RG-packed 16-bit, lossless WebP)
// ---------------------------------------------------------------------------
const encoding = { channels: "RG", offset: round(Math.floor(minElev * 4) / 4), scale: cfg.quantisationM };
const heightmaps = [];
for (const hm of cfg.heightmaps) {
  const w = hm.width;
  const h = Math.round(w / aspect);
  // A light blur removes sub-pixel micro-relief: smoother lines and a much smaller file.
  const data = gaussianBlur(resampleArea(grid.data, grid.width, grid.height, w, h), w, h, cfg.heightmapBlurSigma ?? 0);
  const { file, ...rest } = await writeHeightmap(hm.name, data, w, h, encoding);
  heightmaps.push({ file, use: hm.use, metersPerPixel: round((gMaxE - gMinE) / w, 1), ...rest });
}

if (onlyCards) await rebuildOnly(onlyCards);

const { intervalM, indexEvery } = cfg.contours;

// ---------------------------------------------------------------------------
// 3. Card terrains (the summit heightmaps)
// ---------------------------------------------------------------------------
const cards = {};
for (const card of cfg.cards) cards[card.id] = await buildCard(card);

// ---------------------------------------------------------------------------
// 4. Metadata
// ---------------------------------------------------------------------------
const [fx, fy] = toGridPx(cfg.region.focus.lon, cfg.region.focus.lat);
const exampleIds = new Set(cfg.cards.filter((c) => c.example).map((c) => c.id));
const meta = {
  attribution: "Terrain data © swisstopo",
  generatedAt: new Date().toISOString().slice(0, 10),
  source,
  region: {
    name: cfg.region.name,
    bboxWgs84: cfg.region.bboxWgs84,
    bboxLv95: grid.bbox,
    crs: "EPSG:2056",
    focus: { ...cfg.region.focus, u: round(fx / grid.width, 4), v: round(fy / grid.height, 4) },
  },
  elevation: { min: round(minElev, 1), max: round(maxElev, 1) },
  encoding: { ...encoding, formula: "h = offset + (R * 65280 + G * 255) * scale  (R, G sampled as 0..1)" },
  heightmaps,
  contours: { intervalM, indexEvery },
  cards: Object.fromEntries(Object.entries(cards).filter(([id]) => !exampleIds.has(id))),
};
writeFileSync(join(outDir, "terrain.json"), `${JSON.stringify(meta, null, 2)}\n`);
log("  wrote terrain/terrain.json");
const examples = { cards: Object.fromEntries(Object.entries(cards).filter(([id]) => exampleIds.has(id))) };
writeFileSync(join(outDir, "examples.json"), `${JSON.stringify(examples, null, 2)}\n`);
log("  wrote terrain/examples.json");

// The field's maps and the card plates follow from the masters (posters: npm run posters, which
// needs Playwright).
spawnSync(process.execPath, [join(root, "scripts/terrain/field.mjs")], { stdio: "inherit" });
spawnSync(process.execPath, [join(root, "scripts/plates/build.mjs")], { stdio: "inherit" });
