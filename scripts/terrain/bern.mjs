// Basecamp terrain: an 8 × 8 km window of swisstopo elevation centred on the zero point of the
// Swiss coordinate system (LV95 E 2'600'000 / N 1'200'000, the old observatory in Bern), the
// Aare through it, and its posters. Configured by scripts/terrain/bern.config.json.
//
//   npm run terrain:bern                 build from the cached download (fetches once if missing)
//   npm run terrain:bern -- --refresh    re-download the elevation window and the river
//   npm run terrain:bern -- --placeholder  skip the network: seeded noise, flagged as a placeholder
//
// Outputs (public/terrain/bern, committed): heightmap-{1536,800}.webp (16-bit heights in R+G,
// lossless) with .bin raw-height fallbacks, contours-{10,20}.svg posters with the river and the
// zero-point pin, bern.json (metadata the field imports: encoding, reference texels, interval
// set, river path in terrain coordinates, the altitude at the zero point and the source), and two
// small extracts: summary.json (the readout) and posters.json (the backdrop's posters). The
// window is only ~6 MB of the swissALTIRegio COG; the river comes from swissTLM3D through
// api3.geo.admin.ch. If that request fails the river is traced along the DEM's valley floor
// (said so in bern.json), and without elevation data there is no river at all.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { color } from "../../src/styles/tokens.ts";
import { readWindow, resolveCogUrl } from "./lib/source.mjs";
import { fillGaps, gaussianBlur, minMax, resampleArea, resampleCubic, sampleBilinear } from "./lib/grid.mjs";
import { isobands, ringsToLines, simplify, toPathData } from "./lib/contours.mjs";
import { seededTerrain } from "./lib/noise.mjs";
import { decodeRawHeights, encodeLosslessWebp, encodeRawHeights, gradientPercentiles, packHeightRgb, probeTexels, rasterHash } from "./lib/heightmap.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cfg = JSON.parse(readFileSync(join(root, "scripts/terrain/bern.config.json"), "utf8"));
const field = JSON.parse(readFileSync(join(root, "src/config/contour-field.json"), "utf8"));
const outDir = join(root, "public/terrain", cfg.id);
const cacheDir = join(root, "scripts/terrain/.cache");
const args = new Set(process.argv.slice(2));
const log = (...m) => console.log(...m);
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
mkdirSync(outDir, { recursive: true });

function write(name, data) {
  writeFileSync(join(outDir, name), data);
  const bytes = Buffer.byteLength(data);
  const gzipBytes = gzipSync(data, { level: 9 }).length;
  log(`  wrote public/terrain/${cfg.id}/${name}  ${(bytes / 1024).toFixed(1)} KB  (${(gzipBytes / 1024).toFixed(1)} KB gz)`);
  return { bytes, gzipBytes };
}

const [minE, minN, maxE, maxN] = cfg.bboxLv95;
const spanE = maxE - minE, spanN = maxN - minN;
/** LV95 → terrain coordinates (0..1, origin top-left, like the heightmap texture). */
const toUv = ([e, n]) => [(e - minE) / spanE, (maxN - n) / spanN];

// ---------------------------------------------------------------------------
// 1. Elevation
// ---------------------------------------------------------------------------
log(`Terrain ${cfg.label}: LV95 ${cfg.bboxLv95.join(", ")}`);
let grid, source;
if (!args.has("--placeholder")) {
  try {
    const cog = await resolveCogUrl(cfg.source);
    log(`  source ${cog.href}`);
    grid = await readWindow({ href: cog.href, bboxLv95: cfg.bboxLv95, cacheDir, refresh: args.has("--refresh"), log });
    source = {
      product: "swissALTIRegio",
      collection: cfg.source.collection,
      stac: `${cfg.source.stacApi}/collections/${cfg.source.collection}/items/${cfg.source.item}`,
      href: cog.href,
      updated: cog.updated,
      resolutionM: grid.resolution,
      placeholder: false,
    };
  } catch (error) {
    log(`  ! elevation download failed (${error.message}); building the PLACEHOLDER terrain instead`);
  }
}
if (!grid) {
  const res = cfg.placeholder.resolutionM;
  const width = Math.round(spanE / res), height = Math.round(spanN / res);
  grid = { data: seededTerrain(width, height, cfg.placeholder.seed, cfg.placeholder.elevationRangeM), width, height, bbox: cfg.bboxLv95, resolution: res };
  source = {
    product: "PLACEHOLDER: seeded noise, not Bern",
    collection: null,
    stac: null,
    href: null,
    updated: null,
    resolutionM: res,
    placeholder: true,
    replaceWith: "npm run terrain:bern -- --refresh",
  };
}
if (grid.width !== Math.round(spanE / grid.resolution) || grid.bbox.some((v, i) => Math.abs(v - cfg.bboxLv95[i]) > grid.resolution)) {
  throw new Error(`elevation window ${grid.bbox.join(", ")} does not match the configured bbox`);
}
fillGaps(grid.data, grid.width, grid.height);
const [minElev, maxElev] = minMax(grid.data);
const at = (e, n) => sampleBilinear(grid.data, grid.width, grid.height, (e - grid.bbox[0]) / grid.resolution, (grid.bbox[3] - n) / grid.resolution);
const zeroAltitude = Math.round(at(cfg.zeroPoint.e, cfg.zeroPoint.n));
log(`  grid ${grid.width}×${grid.height} @ ${grid.resolution} m, elevation ${minElev.toFixed(1)}–${maxElev.toFixed(1)} m`);
log(`  altitude at the zero point (E ${cfg.zeroPoint.e} / N ${cfg.zeroPoint.n}): ${zeroAltitude} m`);

// Sanity checks against the city's published figures (real data only).
const facts = cfg.cityFacts;
const station = Math.round(at(facts.station.e, facts.station.n));
const checks = {
  lowestM: { city: facts.lowestM, dem: round(minElev, 1), label: facts.lowestLabel },
  highestM: { city: facts.highestM, demWindowMax: round(maxElev, 1), label: facts.highestLabel, note: "the window reaches beyond the city (Gurten)" },
  stationM: { city: facts.stationM, dem: station },
};
if (!source.placeholder) {
  const off = [];
  if (Math.abs(minElev - facts.lowestM) > facts.toleranceM) off.push(`lowest point ${minElev.toFixed(1)} m (city: ${facts.lowestM} m)`);
  if (maxElev < facts.highestM) off.push(`highest point ${maxElev.toFixed(1)} m is below the city's ${facts.highestM} m`);
  if (Math.abs(station - facts.stationM) > facts.toleranceM) off.push(`main station ${station} m (city: ${facts.stationM} m)`);
  if (off.length) throw new Error(`the DEM disagrees with the city's figures: ${off.join("; ")}`);
  log(`  checks: lowest ${minElev.toFixed(1)} m (city ${facts.lowestM}), main station ${station} m (city ${facts.stationM}), window max ${maxElev.toFixed(1)} m ≥ ${facts.highestM}`);
}

// ---------------------------------------------------------------------------
// 2. Heightmaps (RG-packed 16-bit, lossless WebP, verified round trip)
// ---------------------------------------------------------------------------
const encoding = { channels: "RG", offset: Math.floor(minElev) - 1, scale: cfg.quantisationM };
async function writeHeightmap(name, data, width, height) {
  const rgb = packHeightRgb(data, width, height, encoding);
  const size = write(`${name}.webp`, await encodeLosslessWebp(rgb, width, height));
  const raw = encodeRawHeights(rgb, width, height);
  if (Buffer.compare(Buffer.from(decodeRawHeights(raw, width, height)), Buffer.from(rgb)) !== 0) {
    throw new Error(`raw height fallback for ${name} does not round-trip`);
  }
  const rawSize = write(`${name}.bin`, raw);
  return {
    file: `/terrain/${cfg.id}/${name}.webp`,
    width,
    height,
    sha256: rasterHash(rgb),
    gradientM: gradientPercentiles(data, width, height),
    probe: probeTexels(rgb, width, height),
    raw: { file: `/terrain/${cfg.id}/${name}.bin`, bytes: rawSize.bytes },
    ...size,
  };
}
const heightmaps = [];
for (const hm of cfg.heightmaps) {
  const w = hm.width;
  const h = Math.round((w * spanN) / spanE);
  // Past the native grid, upsample bicubically so the GPU's linear filter draws smooth lines.
  const resampled = w > grid.width ? resampleCubic(grid.data, grid.width, grid.height, w, h) : resampleArea(grid.data, grid.width, grid.height, w, h);
  const data = gaussianBlur(resampled, w, h, cfg.blurSigmaM / (spanE / w));
  const { file, ...rest } = await writeHeightmap(hm.name, data, w, h);
  heightmaps.push({ file, use: hm.use, metersPerPixel: round(spanE / w, 2), ...rest });
}

// ---------------------------------------------------------------------------
// 3. The Aare: official river network, else the DEM's valley floor
// ---------------------------------------------------------------------------
async function fetchRiverFeatures() {
  const key = join(cacheDir, `${cfg.id}-river-${cfg.river.layer}.json`);
  if (!args.has("--refresh") && existsSync(key)) {
    log(`  river: cache hit ${key}`);
    return JSON.parse(readFileSync(key, "utf8"));
  }
  const bbox = cfg.bboxLv95.join(",");
  const features = [];
  for (let offset = 0; offset < 5000; offset += 200) {
    const url =
      `${cfg.river.api}?geometryType=esriGeometryEnvelope&geometry=${bbox}&imageDisplay=1000,1000,96&mapExtent=${bbox}` +
      `&tolerance=0&layers=all:${cfg.river.layer}&sr=2056&returnGeometry=true&geometryFormat=geojson&limit=200&offset=${offset}`;
    let page = null;
    for (let attempt = 0; attempt < 3 && !page; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        page = await res.json();
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
    const results = page.results ?? [];
    features.push(...results);
    if (results.length < 200) break;
  }
  writeFileSync(key, JSON.stringify(features));
  return features;
}

/** Joins line parts that share end points into chains, following their digitised direction. */
function stitch(parts) {
  const key = ([e, n]) => `${Math.round(e * 2)},${Math.round(n * 2)}`;
  const byStart = new Map();
  const ends = new Set();
  parts.forEach((p, i) => {
    byStart.set(key(p[0]), i);
    ends.add(key(p[p.length - 1]));
  });
  const used = new Set();
  const chains = [];
  // Chains start where no other part ends (the upstream ends), then any part left over.
  const starts = parts.map((_, i) => i).sort((a, b) => Number(ends.has(key(parts[a][0]))) - Number(ends.has(key(parts[b][0]))));
  for (const s of starts) {
    if (used.has(s)) continue;
    let chain = [...parts[s]];
    used.add(s);
    for (let next = byStart.get(key(chain[chain.length - 1])); next !== undefined && !used.has(next); next = byStart.get(key(chain[chain.length - 1]))) {
      used.add(next);
      chain = chain.concat(parts[next].slice(1));
    }
    chains.push(chain);
  }
  return chains;
}

/** Clips a polyline to the window (Liang–Barsky per segment), splitting it where it leaves. */
function clip(line) {
  const pieces = [];
  let current = [];
  const inside = ([e, n]) => e >= minE && e <= maxE && n >= minN && n <= maxN;
  for (let i = 0; i < line.length - 1; i++) {
    const [x0, y0] = line[i], [x1, y1] = line[i + 1];
    const dx = x1 - x0, dy = y1 - y0;
    let t0 = 0, t1 = 1;
    let visible = true;
    for (const [p, q] of [[-dx, x0 - minE], [dx, maxE - x0], [-dy, y0 - minN], [dy, maxN - y0]]) {
      if (p === 0) {
        if (q < 0) visible = false;
      } else {
        const t = q / p;
        if (p < 0) t0 = Math.max(t0, t);
        else t1 = Math.min(t1, t);
      }
    }
    if (!visible || t0 > t1) {
      if (current.length > 1) pieces.push(current);
      current = [];
      continue;
    }
    const a = [x0 + dx * t0, y0 + dy * t0], b = [x0 + dx * t1, y0 + dy * t1];
    if (!current.length) current.push(a);
    current.push(b);
    if (t1 < 1 || !inside(line[i + 1])) {
      if (current.length > 1) pieces.push(current);
      current = [];
    }
  }
  if (current.length > 1) pieces.push(current);
  return pieces;
}

/**
 * Fallback: the valley floor as a least-cost path over the DEM (cost rises steeply with height
 * above the window's lowest ground) between the two lowest edge cells at least 3 km apart.
 */
function valleyFloor() {
  const n = 200;
  const g = resampleArea(grid.data, grid.width, grid.height, n, n);
  const [lo] = minMax(g);
  const edge = [];
  for (let i = 0; i < n; i++) edge.push([i, 0], [i, n - 1], [0, i], [n - 1, i]);
  edge.sort((a, b) => g[a[1] * n + a[0]] - g[b[1] * n + b[0]]);
  const from = edge[0];
  const to = edge.find(([x, y]) => Math.hypot(x - from[0], y - from[1]) * (spanE / n) > 3000);
  const dist = new Float64Array(n * n).fill(Infinity);
  const prev = new Int32Array(n * n).fill(-1);
  const start = from[1] * n + from[0], goal = to[1] * n + to[0];
  dist[start] = 0;
  const open = new Set([start]);
  while (open.size) {
    let i = -1, best = Infinity;
    for (const j of open) if (dist[j] < best) { best = dist[j]; i = j; }
    open.delete(i);
    if (i === goal) break;
    const x = i % n, y = (i - x) / n;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
      const j = yy * n + xx;
      const d = dist[i] + Math.hypot(dx, dy) * (1 + ((g[j] - lo) / 4) ** 2);
      if (d < dist[j]) {
        dist[j] = d;
        prev[j] = i;
        open.add(j);
      }
    }
  }
  const path = [];
  for (let i = goal; i !== -1; i = prev[i]) {
    const x = i % n, y = (i - x) / n;
    path.unshift([minE + ((x + 0.5) / n) * spanE, maxN - ((y + 0.5) / n) * spanN]);
  }
  return [path];
}

let river = null;
if (!source.placeholder) {
  let lines = null, riverSource;
  try {
    const features = await fetchRiverFeatures();
    const parts = features
      .filter((f) => String(f.properties?.name ?? "").includes(cfg.river.nameIncludes))
      .flatMap((f) => (f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates]))
      .map((line) => line.map(([e, n]) => [e, n]));
    if (!parts.length) throw new Error(`no "${cfg.river.nameIncludes}" in ${cfg.river.layer}`);
    lines = stitch(parts).flatMap(clip);
    riverSource = {
      kind: "official",
      dataset: "swissTLM3D Gewässernetz (swisstopo)",
      layer: cfg.river.layer,
      api: cfg.river.api,
      features: features.filter((f) => String(f.properties?.name ?? "").includes(cfg.river.nameIncludes)).length,
    };
  } catch (error) {
    log(`  ! river request failed (${error.message}); tracing the DEM's valley floor instead`);
    lines = valleyFloor();
    riverSource = { kind: "derived", dataset: "valley floor of the DEM (least-cost path), not the mapped river", layer: null, api: null };
  }
  // Longest pieces first; drop slivers along the window edge.
  const len = (l) => l.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - l[i][0], p[1] - l[i][1]), 0);
  const pieces = lines.map((l) => simplify(l, cfg.river.simplifyM)).filter((l) => len(l) > 200);
  const lengthM = pieces.reduce((s, l) => s + len(l), 0);
  river = {
    name: cfg.river.name,
    source: riverSource,
    lengthM: Math.round(lengthM),
    // Terrain coordinates, in flow direction (the order it draws in).
    pieces: pieces.map((l) => l.map((p) => toUv(p).map((v) => round(v, 4)))),
  };
  log(`  river ${cfg.river.name} (${riverSource.kind}): ${pieces.length} pieces, ${(lengthM / 1000).toFixed(1)} km, ${pieces.reduce((s, l) => s + l.length, 0)} points`);
} else {
  log("  river: none (placeholder terrain)");
}

// ---------------------------------------------------------------------------
// 4. Posters (still mode, tier C): contours, the river in ice, the zero-point pin in glacier
// ---------------------------------------------------------------------------
const range = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(round(v, 3));
  return out;
};
const posters = [];
{
  const p = cfg.poster;
  const w = p.gridWidth, h = Math.round((w * spanN) / spanE);
  const values = gaussianBlur(resampleArea(grid.data, grid.width, grid.height, w, h), w, h, p.blurSigmaM / (spanE / w));
  const riverPath = river
    ? river.pieces
        .map((l) => {
          const pts = l.map(([u, v]) => [round(u * w, 1), round(v * h, 1)]);
          return `M${pts[0].join(" ")}L${pts.slice(1).map((q) => q.join(" ")).join(" ")}`;
        })
        .join("")
    : "";
  // The pin: a small crosshair with a gap at the centre, ~1.6% of the frame.
  const [px, py] = toUv([cfg.zeroPoint.e, cfg.zeroPoint.n]).map((v, i) => v * (i ? h : w));
  const r = w * 0.016, gap = r * 0.35;
  const pin = `M${round(px - r, 1)} ${round(py, 1)}H${round(px - gap, 1)}M${round(px + gap, 1)} ${round(py, 1)}H${round(px + r, 1)}M${round(px, 1)} ${round(py - r, 1)}V${round(py - gap, 1)}M${round(px, 1)} ${round(py + gap, 1)}V${round(py + r, 1)}`;
  const stroke = (d, c, width, opacity) =>
    d ? `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : "";
  for (const interval of p.intervalsM) {
    let regular = "", index = "";
    for (const band of isobands(values, w, h, range(Math.ceil(minElev / interval) * interval, maxElev, interval))) {
      const d = toPathData(ringsToLines(band, w, h), { tolerance: p.simplifyTolerance });
      if (Math.round(band.value / interval) % cfg.indexEvery === 0) index += d;
      else regular += d;
    }
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">` +
      stroke(regular, color.contour, 1, field.desktop.lineOpacity) +
      stroke(index, color.contour, 1.5, field.desktop.indexOpacity) +
      stroke(riverPath, color.ice, 1.5, 0.9) +
      stroke(pin, color.glacier, 1.25, 0.9) +
      `</svg>\n`;
    const file = `contours-${interval}.svg`;
    posters.push({ file: `/terrain/${cfg.id}/${file}`, intervalM: interval, width: w, height: h, ...write(file, svg) });
  }
}

// ---------------------------------------------------------------------------
// 5. Metadata
// ---------------------------------------------------------------------------
const [zu, zv] = toUv([cfg.zeroPoint.e, cfg.zeroPoint.n]);
const meta = {
  id: cfg.id,
  label: cfg.label,
  attribution: "Terrain data © swisstopo",
  placeholder: source.placeholder,
  generatedAt: new Date().toISOString().slice(0, 10),
  source,
  bboxLv95: cfg.bboxLv95,
  crs: "EPSG:2056",
  zeroPoint: {
    ...cfg.zeroPoint,
    u: round(zu, 4),
    v: round(zv, 4),
    // Never a placeholder value: without real elevation there is no altitude to show.
    altitudeM: source.placeholder ? null : zeroAltitude,
  },
  elevation: { min: round(minElev, 1), max: round(maxElev, 1) },
  encoding: { ...encoding, formula: "h = offset + (R * 65280 + G * 255) * scale  (R, G sampled as 0..1)" },
  intervalsM: cfg.intervalsM,
  indexEvery: cfg.indexEvery,
  heightmaps,
  posters,
  river,
  checks: source.placeholder ? null : checks,
};
writeFileSync(join(outDir, `${cfg.id}.json`), `${JSON.stringify(meta, null, 2)}\n`);
// Small extracts of the manifest, whose river and reference texels only the lazily loaded field
// reads: what the readout needs (summary.json), and what the backdrop needs on every page for
// its posters (posters.json: files, and the gradients their media queries are computed from).
const summary = {
  id: meta.id,
  label: meta.label,
  placeholder: meta.placeholder,
  zeroPoint: { e: meta.zeroPoint.e, n: meta.zeroPoint.n, altitudeM: meta.zeroPoint.altitudeM },
  intervalsM: meta.intervalsM,
};
writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
const backdrop = {
  focus: { u: meta.zeroPoint.u, v: meta.zeroPoint.v },
  heightmaps: heightmaps.map(({ use, width, height, gradientM }) => ({ use, width, height, gradientM })),
  posters: posters.map(({ file, intervalM, width, height }) => ({ file, intervalM, width, height })),
};
writeFileSync(join(outDir, "posters.json"), `${JSON.stringify(backdrop, null, 2)}\n`);
log(`  wrote public/terrain/${cfg.id}/${cfg.id}.json${source.placeholder ? "  (PLACEHOLDER terrain: replace with npm run terrain:bern -- --refresh)" : ""}`);
