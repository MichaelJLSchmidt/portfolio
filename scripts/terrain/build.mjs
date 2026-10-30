// Terrain pipeline: swisstopo elevation → heightmaps, contour poster and card terrains.
//
//   npm run terrain              build from the cached download (fetches once if missing)
//   npm run terrain -- --refresh re-download the elevation window
//   npm run terrain -- --placeholder  skip the network and use procedural terrain
//   npm run terrain -- --png     also write PNG copies of every heightmap (not used by the site)
//   npm run terrain -- --only=<id>      rebuild only these seeded card terrains (no download)
//
// Outputs (public/terrain): heightmap-{1024,1536,2048}.webp (lossless) with .bin raw-height
// fallbacks, contours*.svg, cards/*.svg, morph/*.webp (+ .bin) and terrain.json (metadata the
// site imports, including reference texels for the runtime decode check). Cards flagged
// "example" in the config (fictional examples, never in a live build) are listed in
// examples.json instead, so live bundles carry nothing of theirs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { color } from "../../src/styles/tokens.ts";
import "../lib/ts-hooks.mjs";
import { bboxToLv95, wgs84ToLv95 } from "./lib/lv95.mjs";
import { readWindow, resolveCogUrl } from "./lib/source.mjs";
import { cropToBbox, fillGaps, floodFlat, gaussianBlur, minMax, resampleArea, sampleBilinear } from "./lib/grid.mjs";
import { isobands, maskToPathData, ringsToLines, toPathData } from "./lib/contours.mjs";
import { autoTrail, seededTerrain } from "./lib/noise.mjs";
import { decodeRawHeights, encodeLosslessWebp, encodeRawHeights, gradientPercentiles, packHeightRgb, probeTexels, rasterHash } from "./lib/heightmap.mjs";
import { encodeRgbPng } from "./lib/png.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cfg = JSON.parse(readFileSync(join(root, "src/content/terrain.config.json"), "utf8"));
const field = JSON.parse(readFileSync(join(root, "src/config/contour-field.json"), "utf8"));
const outDir = join(root, "public/terrain");
const cacheDir = join(root, "scripts/terrain/.cache");
const args = new Set(process.argv.slice(2));
const log = (...m) => console.log(...m);
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

mkdirSync(join(outDir, "cards"), { recursive: true });
mkdirSync(join(outDir, "morph"), { recursive: true });

function write(rel, data) {
  const file = join(outDir, rel);
  writeFileSync(file, data);
  const bytes = Buffer.byteLength(data);
  const gz = gzipSync(data, { level: 9 }).length;
  log(`  wrote public/terrain/${rel}  ${(bytes / 1024).toFixed(1)} KB  (${(gz / 1024).toFixed(1)} KB gz)`);
  return { bytes, gzipBytes: gz };
}

function svg({ w, h, regular, index, lakes, lakeOpacity, lineOpacity = 0.55, indexOpacity = 0.9 }) {
  const line = (d, width, opacity) =>
    d
      ? `<path d="${d}" fill="none" stroke="${color.contour}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
      : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">` +
    (lakes ? `<path d="${lakes}" fill="${color.ice}" fill-opacity="${lakeOpacity}"/>` : "") +
    line(regular, 1, lineOpacity) +
    line(index, 1.5, indexOpacity) +
    `</svg>\n`
  );
}

function contourSvg(values, w, h, { thresholds, indexOf, lakesMask, tolerance, lakeOpacity, lineOpacity, indexOpacity }) {
  let regular = "", index = "";
  for (const band of isobands(values, w, h, thresholds)) {
    const d = toPathData(ringsToLines(band, w, h), { tolerance });
    if (indexOf(band.value)) index += d;
    else regular += d;
  }
  const lakes = lakesMask ? maskToPathData(lakesMask, w, h, { tolerance: tolerance * 1.5 }) : "";
  return svg({ w, h, regular, index, lakes, lakeOpacity, lineOpacity, indexOpacity });
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

// Card terrains (artwork SVG + morph heightmap for the contour field). Crop cards cut the real
// terrain (they need the elevation grid); seeded cards are generated from their seed alone. A
// crop card with `trailPlaces` draws its trail through those verified places (src/content/
// geo-data.json, npm run geo) and pins each one at its spot height; the last is the summit.
const ART_W = 360;
const geoPlaces = () => JSON.parse(readFileSync(join(root, "src/content/geo-data.json"), "utf8")).places;
async function buildCard(card) {
  const artH = Math.round(ART_W / card.aspect);
  const morphW = card.morphWidth;
  const morphH = Math.round(morphW / card.aspect);
  let art, artMask = null, morph, bboxLv95 = null, trail = null, interval, index;

  let placePins = null;
  if (card.kind === "crop") {
    const [ce, cn] = card.centerLv95 ?? wgs84ToLv95(card.center.lon, card.center.lat);
    const wM = card.widthKm * 1000, hM = wM / card.aspect;
    bboxLv95 = [ce - wM / 2, cn - hM / 2, ce + wM / 2, cn + hM / 2].map((v) => Math.round(v));
    if (card.trailPlaces) {
      const [x0, y0, x1, y1] = bboxLv95;
      const all = geoPlaces();
      const at = card.trailPlaces.map((id) => {
        const p = all[id];
        if (!p?.e) throw new Error(`${card.id}: place "${id}" has no position in geo-data.json (npm run geo)`);
        const clamp = (v) => Math.min(0.98, Math.max(0.02, v));
        return { x: round(clamp((p.e - x0) / (x1 - x0)), 4), y: round(clamp((y1 - p.n) / (y1 - y0)), 4), elevationM: p.altitudeM };
      });
      trail = at.map((p) => [p.x, p.y]);
      placePins = at;
    }
    art = gaussianBlur(cropToBbox(grid, bboxLv95, ART_W, artH), ART_W, artH, 0.7);
    artMask = cropToBbox({ ...grid, data: lakeMask }, bboxLv95, ART_W, artH, 2);
    morph = gaussianBlur(cropToBbox(grid, bboxLv95, morphW, morphH, 3), morphW, morphH, cfg.heightmapBlurSigma ?? 0);
    interval = card.contourIntervalM;
    index = card.indexEvery;
  } else {
    morph = seededTerrain(morphW, morphH, card.seed, card.elevationRangeM);
    art = gaussianBlur(resampleArea(morph, morphW, morphH, ART_W, artH), ART_W, artH, 1.0);
    const [lo, hi] = card.elevationRangeM;
    interval = Math.max(10, Math.round((hi - lo) / (card.lines + 1) / 10) * 10);
    index = card.indexEvery;
    trail = autoTrail(art, ART_W, artH).map(([x, y]) => [round(x, 4), round(y, 4)]);
  }

  const [aMin, aMax] = minMax(art);
  const thresholds = range(Math.ceil(aMin / interval) * interval, aMax, interval);
  const svgFile = `cards/${card.id}.svg`;
  const svgSize = write(
    svgFile,
    contourSvg(art, ART_W, artH, {
      thresholds,
      indexOf: (v) => Math.round(v / interval) % index === 0,
      lakesMask: artMask,
      tolerance: 0.3,
      lakeOpacity: 0.16,
    }),
  );

  const [mMin, mMax] = minMax(morph);
  const morphEncoding = { channels: "RG", offset: round(Math.floor(mMin * 4) / 4), scale: cfg.quantisationM };
  const morphMap = await writeHeightmap(`morph/${card.id}`, morph, morphW, morphH, morphEncoding);

  const pins = placePins
    ? placePins
    : trail
    ? [0, 0.4, 0.72, 1].map((t) => {
        const [x, y] = trail[Math.round(t * (trail.length - 1))];
        return { x, y, elevationM: Math.round(sampleBilinear(art, ART_W, artH, x * ART_W, y * artH)) };
      })
    : null;

  return {
    kind: card.kind,
    svg: `/terrain/${svgFile}`,
    viewBox: [0, 0, ART_W, artH],
    contourIntervalM: interval,
    indexEvery: index,
    bboxLv95,
    trail,
    pins,
    svgBytes: svgSize,
    morph: {
      ...morphMap,
      elevation: { min: round(mMin, 1), max: round(mMax, 1) },
      encoding: morphEncoding,
    },
  };
}

const range = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};

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
    log(`  updated public/terrain/${card.example ? "examples.json" : "terrain.json"} (${card.id})`);
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

// ---------------------------------------------------------------------------
// 3. Lakes (flat regions in the DTM)
// ---------------------------------------------------------------------------
const lakeMask = new Float32Array(grid.width * grid.height);
const lakes = [];
for (const lake of cfg.lakes) {
  const [px, py] = toGridPx(lake.lon, lake.lat).map(Math.floor);
  if (px < 0 || py < 0 || px >= grid.width || py >= grid.height) continue;
  const { mask, level, count } = floodFlat(grid.data, grid.width, grid.height, px, py, 0.6);
  const areaKm2 = (count * grid.resolution ** 2) / 1e6;
  if (areaKm2 < 1) {
    log(`  ! ${lake.name}: seed is not on a flat surface (${areaKm2.toFixed(2)} km²), skipped`);
    continue;
  }
  for (let i = 0; i < mask.length; i++) if (mask[i]) lakeMask[i] = 1;
  lakes.push({ name: lake.name, levelM: round(level, 1), areaKm2: round(areaKm2, 1) });
  log(`  lake ${lake.name}: level ${level.toFixed(1)} m, ${areaKm2.toFixed(1)} km² in frame`);
}

if (onlyCards) await rebuildOnly(onlyCards);

// ---------------------------------------------------------------------------
// 4. Contour posters (first paint, reduced motion, no-WebGL fallback), one per interval
//    the field uses at page scale: 100 m for the largest screens, 200 m for phones, laptops
//    and desktops up to ~1920 px.
// ---------------------------------------------------------------------------
const { intervalM, indexEvery } = cfg.contours;
const posters = [];
{
  const w = cfg.poster.gridWidth;
  const h = Math.round(w / aspect);
  const values = gaussianBlur(resampleArea(grid.data, grid.width, grid.height, w, h), w, h, cfg.poster.blurSigma);
  for (const interval of cfg.poster.intervalsM) {
    const thresholds = range(Math.ceil(minElev / interval) * interval, maxElev, interval);
    const file = interval === intervalM ? "contours.svg" : `contours-${interval}.svg`;
    const size = write(
      file,
      contourSvg(values, w, h, {
        thresholds,
        indexOf: (v) => v % (interval * indexEvery) === 0,
        tolerance: cfg.poster.simplifyTolerance,
        // The field's monochrome map: neutral lines only (no lakes), at its desktop strengths.
        lineOpacity: field.desktop.lineOpacity,
        indexOpacity: field.desktop.indexOpacity,
      }),
    );
    posters.push({ file: `/terrain/${file}`, intervalM: interval, width: w, height: h, ...size });
  }
}
const poster = posters.find((p) => p.intervalM === intervalM) ?? posters[0];

// ---------------------------------------------------------------------------
// 5. Card terrains (artwork SVG + morph heightmap for the contour field)
// ---------------------------------------------------------------------------
const cards = {};
for (const card of cfg.cards) cards[card.id] = await buildCard(card);

// ---------------------------------------------------------------------------
// 6. Ascent profile along the Interlaken → Jungfrau trail (Basecamp's career climb)
// ---------------------------------------------------------------------------
{
  if (cfg.profile) {
    const { trail, waypoints } = cfg.profile;
    const pts = trail.map((p) => wgs84ToLv95(p.lon, p.lat));
    const STEP = 25; // metres between DEM samples
    const raw = [];
    const vertexKm = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const [e0, n0] = pts[i - 1];
      const [e1, n1] = pts[i];
      const len = Math.hypot(e1 - e0, n1 - n0);
      const steps = Math.max(1, Math.round(len / STEP));
      for (let k = i === 1 ? 0 : 1; k <= steps; k++) {
        const t = k / steps;
        const e = e0 + (e1 - e0) * t, n = n0 + (n1 - n0) * t;
        raw.push([(total + len * t) / 1000, sampleBilinear(grid.data, grid.width, grid.height, (e - gMinE) / grid.resolution, (gMaxN - n) / grid.resolution)]);
      }
      total += len;
      vertexKm.push(total / 1000);
    }
    // Light smoothing (±75 m), then ~240 evenly spaced points.
    const smooth = raw.map((p, i) => {
      const win = raw.slice(Math.max(0, i - 3), i + 4);
      return [p[0], win.reduce((s, q) => s + q[1], 0) / win.length];
    });
    const OUT = 240;
    const points = Array.from({ length: OUT }, (_, i) => {
      const p = smooth[Math.round((i / (OUT - 1)) * (smooth.length - 1))];
      return [round(p[0], 2), Math.round(p[1])];
    });
    const elevations = points.map((p) => p[1]);
    const stops = waypoints.map((w) => {
      const [we, wn] = wgs84ToLv95(w.lon, w.lat);
      let best = 0;
      pts.forEach(([e, n], i) => {
        if (Math.hypot(e - we, n - wn) < Math.hypot(pts[best][0] - we, pts[best][1] - wn)) best = i;
      });
      const km = vertexKm[best];
      const nearest = points.reduce((a, b) => (Math.abs(b[0] - km) < Math.abs(a[0] - km) ? b : a));
      return { km: round(km, 2), elevationM: nearest[1], label: w.label ?? null };
    });
    const profile = {
      attribution: "Terrain data © swisstopo",
      trail: cfg.profile.id,
      lengthKm: round(total / 1000, 2),
      elevation: { min: Math.min(...elevations), max: Math.max(...elevations) },
      points,
      stops,
    };
    write("profile.json", `${JSON.stringify(profile)}\n`);
    log(`  ascent profile: ${profile.lengthKm} km, ${profile.elevation.min}–${profile.elevation.max} m`);
  }
}

// ---------------------------------------------------------------------------
// 7. Metadata
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
  poster,
  posters,
  lakes,
  cards: Object.fromEntries(Object.entries(cards).filter(([id]) => !exampleIds.has(id))),
};
writeFileSync(join(outDir, "terrain.json"), `${JSON.stringify(meta, null, 2)}\n`);
log("  wrote public/terrain/terrain.json");
const examples = { cards: Object.fromEntries(Object.entries(cards).filter(([id]) => exampleIds.has(id))) };
writeFileSync(join(outDir, "examples.json"), `${JSON.stringify(examples, null, 2)}\n`);
log("  wrote public/terrain/examples.json");
