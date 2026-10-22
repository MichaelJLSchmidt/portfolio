// Terrain pipeline: swisstopo elevation → heightmaps, contour poster and card terrains.
//
//   npm run terrain              build from the cached download (fetches once if missing)
//   npm run terrain -- --refresh re-download the elevation window
//   npm run terrain -- --placeholder  skip the network and use procedural terrain
//   npm run terrain -- --png     also write PNG copies of every heightmap (not used by the site)
//
// Outputs (public/terrain): heightmap-{1024,1536,2048}.webp (lossless), contours.svg,
// cards/*.svg, morph/*.webp and terrain.json (metadata the site imports).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { color } from "../../src/styles/tokens.ts";
import { cards as cardContent } from "../../src/content/cards.ts";
import { bboxToLv95, wgs84ToLv95 } from "./lib/lv95.mjs";
import { readWindow, resolveCogUrl } from "./lib/source.mjs";
import { cropToBbox, fillGaps, floodFlat, gaussianBlur, minMax, resampleArea, sampleBilinear } from "./lib/grid.mjs";
import { isobands, maskToPathData, ringsToLines, toPathData } from "./lib/contours.mjs";
import { autoTrail, seededTerrain } from "./lib/noise.mjs";
import { encodeLosslessWebp, gradientPercentiles, packHeightRgb, rasterHash } from "./lib/heightmap.mjs";
import { encodeRgbPng } from "./lib/png.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cfg = JSON.parse(readFileSync(join(root, "src/content/terrain.config.json"), "utf8"));
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

function svg({ w, h, regular, index, lakes, lakeOpacity }) {
  const line = (d, width, opacity) =>
    d
      ? `<path d="${d}" fill="none" stroke="${color.contour}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`
      : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">` +
    (lakes ? `<path d="${lakes}" fill="${color.ice}" fill-opacity="${lakeOpacity}"/>` : "") +
    line(regular, 1, 0.55) +
    line(index, 1.5, 0.9) +
    `</svg>\n`
  );
}

function contourSvg(values, w, h, { thresholds, indexOf, lakesMask, tolerance, lakeOpacity }) {
  let regular = "", index = "";
  for (const band of isobands(values, w, h, thresholds)) {
    const d = toPathData(ringsToLines(band, w, h), { tolerance });
    if (indexOf(band.value)) index += d;
    else regular += d;
  }
  const lakes = lakesMask ? maskToPathData(lakesMask, w, h, { tolerance: tolerance * 1.5 }) : "";
  return svg({ w, h, regular, index, lakes, lakeOpacity });
}

/** Writes a heightmap as lossless WebP (plus a PNG copy with --png) and returns its metadata. */
async function writeHeightmap(name, data, width, height, encoding) {
  const rgb = packHeightRgb(data, width, height, encoding);
  const size = write(`${name}.webp`, await encodeLosslessWebp(rgb, width, height));
  if (args.has("--png")) write(`${name}.png`, encodeRgbPng(rgb, width, height));
  return {
    file: `/terrain/${name}.webp`,
    width,
    height,
    sha256: rasterHash(rgb),
    gradientM: gradientPercentiles(data, width, height),
    ...size,
  };
}

const range = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};

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

// ---------------------------------------------------------------------------
// 4. Contour poster (first paint, reduced motion, no-WebGL fallback)
// ---------------------------------------------------------------------------
const { intervalM, indexEvery } = cfg.contours;
let poster;
{
  const w = cfg.poster.gridWidth;
  const h = Math.round(w / aspect);
  const values = gaussianBlur(resampleArea(grid.data, grid.width, grid.height, w, h), w, h, cfg.poster.blurSigma);
  const mask = resampleArea(lakeMask, grid.width, grid.height, w, h);
  const thresholds = range(Math.ceil(minElev / intervalM) * intervalM, maxElev, intervalM);
  const posterSize = write(
    "contours.svg",
    contourSvg(values, w, h, {
      thresholds,
      indexOf: (v) => v % (intervalM * indexEvery) === 0,
      lakesMask: mask,
      tolerance: cfg.poster.simplifyTolerance,
      lakeOpacity: 0.08,
    }),
  );
  poster = { file: "/terrain/contours.svg", width: w, height: h, ...posterSize };
}

// ---------------------------------------------------------------------------
// 5. Card terrains (artwork SVG + morph heightmap for the contour field)
// ---------------------------------------------------------------------------
const ART_W = 360;
const cards = {};
for (const card of cfg.cards) {
  const artH = Math.round(ART_W / card.aspect);
  const morphW = card.morphWidth;
  const morphH = Math.round(morphW / card.aspect);
  let art, artMask = null, morph, bboxLv95 = null, trail = null, interval, index;

  if (card.kind === "crop") {
    const [ce, cn] = wgs84ToLv95(card.center.lon, card.center.lat);
    const wM = card.widthKm * 1000, hM = wM / card.aspect;
    bboxLv95 = [ce - wM / 2, cn - hM / 2, ce + wM / 2, cn + hM / 2].map((v) => Math.round(v));
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

  const pins = trail
    ? [0, 0.4, 0.72, 1].map((t) => {
        const [x, y] = trail[Math.round(t * (trail.length - 1))];
        return { x, y, elevationM: Math.round(sampleBilinear(art, ART_W, artH, x * ART_W, y * artH)) };
      })
    : null;

  cards[card.id] = {
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

// ---------------------------------------------------------------------------
// 6. Ascent profile along the leader card's trail (About page)
// ---------------------------------------------------------------------------
{
  const leader = cardContent.find((c) => c.artwork.kind === "crop");
  if (leader && leader.artwork.kind === "crop") {
    const { trail, waypoints } = leader.artwork;
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
      trail: leader.artwork.terrainId,
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
  lakes,
  cards,
};
writeFileSync(join(outDir, "terrain.json"), `${JSON.stringify(meta, null, 2)}\n`);
log("  wrote public/terrain/terrain.json");
