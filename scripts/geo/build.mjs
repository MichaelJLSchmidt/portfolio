// `npm run geo`: verified place data for the case-study stages and the About climb, written to
// src/content/geo-data.json (committed; src/content/geo.ts reads it).
//
// Sources, all swisstopo (scripts/geo/geo.config.json):
//   - names and positions, and altitudes as official spot heights: swissNAMES3D (the national
//     map's names in 3D: each point's Z is its spot height), the yearly CSV from the STAC API on
//     data.geo.admin.ch, downloaded once into scripts/terrain/.cache/geo/;
//   - a cross-check of every altitude, and the altitude of unnamed points on a ridge (the highest
//     point across the ridge near a given share of the way): the height service on
//     api3.geo.admin.ch (swissALTI3D DEM);
//   - the About climb: the hiking trails of swissTLM3D (identify on the trail layer), routed
//     through the named places, with heights along it from the profile service.
// Where the research values in the config disagree with swisstopo, swisstopo wins and the
// conflict is written next to the value. A place swisstopo cannot answer for keeps its research
// value, flagged "unverified".
//
//   npm run geo                 use the cache where it exists
//   npm run geo -- --refresh    download everything again
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zipEntries } from "../lib/unzip.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cfg = JSON.parse(readFileSync(join(root, "scripts/geo/geo.config.json"), "utf8"));
const cacheDir = join(root, "scripts/terrain/.cache/geo");
const outFile = join(root, "src/content/geo-data.json");
const refresh = process.argv.includes("--refresh");
mkdirSync(cacheDir, { recursive: true });

async function fetchRetry(url, init) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.slice(0, 120)}`);
      return res;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}

/** A JSON response, cached by key. */
async function cachedJson(key, url, init) {
  const file = join(cacheDir, `${key}.json`);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const data = await (await fetchRetry(url, init)).json();
  writeFileSync(file, JSON.stringify(data));
  return data;
}

// ---------------------------------------------------------------- swissNAMES3D
async function swissNames() {
  const { stacApi, collection, item, asset } = cfg.swissnames3d;
  const zip = join(cacheDir, asset);
  if (refresh || !existsSync(zip)) {
    const meta = await (await fetchRetry(`${stacApi}/collections/${collection}/items/${item}`)).json();
    const href = meta.assets[asset]?.href;
    if (!href) throw new Error(`swissNAMES3D: no asset ${asset} in ${item}`);
    console.log(`  swissNAMES3D: downloading ${href}`);
    writeFileSync(zip, Buffer.from(await (await fetchRetry(href)).arrayBuffer()));
  }
  const rows = [];
  for (const entry of zipEntries(readFileSync(zip))) {
    if (!/swissNAMES3D_(PKT|LIN|PLY)\.csv$/.test(entry.name)) continue;
    const lines = entry.read().toString("utf8").replace(/^﻿/, "").split(/\r?\n/);
    const head = lines[0].split(";");
    const col = (name) => head.indexOf(name);
    const [iKind, iName, iE, iN, iZ] = ["OBJEKTART", "NAME", "E", "N", "Z"].map(col);
    for (const line of lines.slice(1)) {
      if (!line) continue;
      const c = line.split(";");
      rows.push({ kind: c[iKind], name: c[iName], e: Number(c[iE]), n: Number(c[iN]), z: Number(c[iZ]), file: entry.name.match(/(PKT|LIN|PLY)/)[1] });
    }
  }
  return { rows, version: item };
}

// ---------------------------------------------------------------- height service (DEM)
async function demHeight(e, n) {
  const url = `${cfg.api.height}?easting=${Math.round(e)}&northing=${Math.round(n)}&sr=2056`;
  const data = await cachedJson(`height_${Math.round(e)}_${Math.round(n)}`, url);
  return Number(data.height);
}

/** The crest near `at` of the way from a to b: the highest DEM point across the line there. */
async function crestPoint(a, b, at) {
  const e = a.e + (b.e - a.e) * at;
  const n = a.n + (b.n - a.n) * at;
  const len = Math.hypot(b.e - a.e, b.n - a.n);
  const [pe, pn] = [-(b.n - a.n) / len, (b.e - a.e) / len];
  let best = null;
  for (let d = -80; d <= 80; d += 10) {
    const p = { e: e + pe * d, n: n + pn * d };
    const z = await demHeight(p.e, p.n);
    if (!best || z > best.z) best = { ...p, z };
  }
  return { e: Math.round(best.e), n: Math.round(best.n), z: best.z };
}

// ---------------------------------------------------------------- places
const researchOf = (p) => (p.research === undefined ? [] : [].concat(p.research));

async function resolvePlaces(names) {
  const places = {};
  for (const p of cfg.places.filter((p) => !p.crest)) {
    const hits = names.rows.filter((r) => r.name === p.name && r.kind === p.kind);
    const research = researchOf(p);
    if (!hits.length) {
      // swisstopo has no answer: keep the research value, flagged.
      places[p.id] = { label: p.label, altitudeM: research[0] ?? null, unverified: true, source: "research value, not found in swissNAMES3D" };
      console.warn(`  ${p.id}: not in swissNAMES3D (${p.name}, ${p.kind}); unverified`);
      continue;
    }
    const zs = [...new Set(hits.map((h) => Math.round(h.z)))].sort((a, b) => a - b);
    // Several points of one name and kind (a station's tracks) a metre or two apart: the
    // research value where it is one of them, else their rounded mean.
    const spread = zs[zs.length - 1] - zs[0];
    const confirmed = research.find((r) => zs.includes(r));
    const altitudeM = zs.length === 1 ? zs[0] : confirmed ?? Math.round(zs.reduce((s, z) => s + z, 0) / zs.length);
    const at = hits.find((h) => Math.round(h.z) === altitudeM) ?? hits[0];
    const dem = await demHeight(at.e, at.n);
    const place = {
      label: p.label,
      e: Math.round(at.e),
      n: Math.round(at.n),
      altitudeM,
      source: `swissNAMES3D ${names.version} (${p.kind} “${p.name}”${zs.length > 1 ? `, ${zs.length} points: ${zs.join(" / ")} m` : ""})`,
      dem: Math.round(dem * 10) / 10,
      ...(p.station ? { station: true } : {}),
    };
    if (spread > 2) place.note = `swissNAMES3D points of this name differ by ${spread} m`;
    // A station inside the mountain (the Jungfrau railway's tunnel): the DEM reads the rock above.
    if (p.underground) place.note = `in the Jungfrau railway's tunnel: the DEM reads the surface ${Math.round(dem - altitudeM)} m above`;
    else if (Math.abs(dem - altitudeM) > 5) throw new Error(`${p.id}: spot height ${altitudeM} m and DEM ${dem} m disagree; check the place`);
    const disagree = research.filter((r) => r !== altitudeM);
    if (disagree.length) place.conflict = `research ${research.join(" / ")} m; swisstopo ${altitudeM} m (wins)`;
    places[p.id] = place;
  }
  for (const p of cfg.places.filter((p) => p.crest)) {
    const a = places[p.crest.from];
    const b = places[p.crest.to];
    const c = await crestPoint(a, b, p.crest.at);
    places[p.id] = {
      label: p.label,
      e: c.e,
      n: c.n,
      altitudeM: Math.round(c.z),
      source: `swisstopo height service (swissALTI3D) on the crest ${Math.round(p.crest.at * 100)}% of the way from ${a.label} to ${b.label}`,
      dem: Math.round(c.z * 10) / 10,
    };
  }
  return places;
}

// ---------------------------------------------------------------- the About climb
async function trailFeatures(bbox) {
  const [x0, y0, x1, y1] = bbox;
  const features = new Map();
  // 1 km tiles keep each answer well under the service's limit.
  for (let x = x0; x < x1; x += 1000) {
    for (let y = y0; y < y1; y += 1000) {
      const box = [x, y, Math.min(x + 1000, x1), Math.min(y + 1000, y1)].join(",");
      const url =
        `${cfg.api.identify}?geometryType=esriGeometryEnvelope&geometry=${box}&imageDisplay=1000,1000,96&mapExtent=${box}` +
        `&tolerance=0&layers=all:${cfg.api.trails}&sr=2056&returnGeometry=true&geometryFormat=geojson&limit=200`;
      const page = await cachedJson(`trails_${box.replaceAll(",", "_")}`, url);
      for (const f of page.results ?? []) features.set(f.featureId ?? f.id, f);
    }
  }
  return [...features.values()];
}

/** Shortest way along the trail network through the given points (Dijkstra between each pair). */
function route(features, stops) {
  const key = ([e, n]) => `${Math.round(e * 2)},${Math.round(n * 2)}`;
  const nodes = new Map();
  const node = (p) => {
    const k = key(p);
    if (!nodes.has(k)) nodes.set(k, { p, edges: [] });
    return k;
  };
  for (const f of features) {
    const lines = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = node(line[i]);
        const b = node(line[i + 1]);
        const d = Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]);
        nodes.get(a).edges.push([b, d]);
        nodes.get(b).edges.push([a, d]);
      }
    }
  }
  const nearest = (s) => {
    let best = null;
    for (const [k, v] of nodes) {
      const d = Math.hypot(v.p[0] - s.e, v.p[1] - s.n);
      if (!best || d < best.d) best = { k, d };
    }
    return best;
  };
  const path = [];
  const snaps = stops.map(nearest);
  for (let i = 0; i < snaps.length - 1; i++) {
    const from = snaps[i].k;
    const to = snaps[i + 1].k;
    const dist = new Map([[from, 0]]);
    const prev = new Map();
    const open = new Set([from]);
    while (open.size) {
      let u = null;
      for (const k of open) if (u === null || dist.get(k) < dist.get(u)) u = k;
      open.delete(u);
      if (u === to) break;
      for (const [v, w] of nodes.get(u).edges) {
        const alt = dist.get(u) + w;
        if (alt < (dist.get(v) ?? Infinity)) {
          dist.set(v, alt);
          prev.set(v, u);
          open.add(v);
        }
      }
    }
    if (!dist.has(to)) throw new Error(`No trail connects ${stops[i].label} and ${stops[i + 1].label}`);
    const leg = [];
    for (let k = to; k !== undefined; k = prev.get(k)) leg.unshift(nodes.get(k).p);
    path.push(...(i ? leg.slice(1) : leg));
  }
  return { path, snaps: snaps.map((s) => Math.round(s.d)) };
}

async function aboutClimb(places) {
  const c = cfg.aboutClimb;
  const stops = c.via.map((id) => places[id]);
  const features = await trailFeatures(c.bboxLv95);
  const { path, snaps } = route(features, stops);
  // Simplify to at most ~400 vertices for the profile request.
  const step = Math.max(1, Math.ceil(path.length / 400));
  const line = path.filter((_, i) => i % step === 0 || i === path.length - 1).map(([e, n]) => [Math.round(e), Math.round(n)]);
  const body = new URLSearchParams({ geom: JSON.stringify({ type: "LineString", coordinates: line }), sr: "2056" });
  const profile = await cachedJson(`profile_${c.id}_${line.length}`, cfg.api.profile, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const raw = profile.map((p) => ({ d: p.dist, z: p.alts.COMB ?? p.alts.DTM2 ?? p.alts.DTM25, e: p.easting, n: p.northing }));
  // Each stop's distance along the route: the profile point nearest to it.
  const at = stops.map((s) => {
    let best = raw[0];
    for (const p of raw) if (Math.hypot(p.e - s.e, p.n - s.n) < Math.hypot(best.e - s.e, best.n - s.n)) best = p;
    return Math.round(best.d);
  });
  // Resampled to evenly spaced points along the way (linear between the service's points).
  const total = raw[raw.length - 1].d;
  const points = [];
  for (let i = 0, j = 0; i < c.profilePoints; i++) {
    const d = (total * i) / (c.profilePoints - 1);
    while (j < raw.length - 2 && raw[j + 1].d < d) j++;
    const a = raw[j];
    const b = raw[j + 1];
    const t = b.d > a.d ? Math.min(1, Math.max(0, (d - a.d) / (b.d - a.d))) : 0;
    points.push([Math.round(d), Math.round((a.z + (b.z - a.z) * t) * 10) / 10]);
  }
  return {
    id: c.id,
    via: c.via,
    lengthM: points[points.length - 1][0],
    stopsAtM: at,
    snapM: snaps,
    source: `swissTLM3D hiking trails (${cfg.api.trails}, ${features.length} segments in the box), routed through ${stops.map((s) => s.label).join(" → ")}; heights from the swisstopo profile service (COMB: swissALTI3D, else DHM25) at ${raw.length} points, resampled to ${c.profilePoints}`,
    /** [distance m, altitude m], evenly spaced */
    points,
  };
}

// ---------------------------------------------------------------- write
const names = await swissNames();
const places = await resolvePlaces(names);
const climb = await aboutClimb(places);
const data = {
  $comment: "Generated by scripts/geo/build.mjs (npm run geo) from swisstopo data; edit scripts/geo/geo.config.json and re-run.",
  sources: {
    names: `swissNAMES3D (${names.version}), data.geo.admin.ch, © swisstopo`,
    dem: "swisstopo height and profile services (api3.geo.admin.ch, swissALTI3D), © swisstopo",
    trails: "swissTLM3D hiking trails (ch.swisstopo.swisstlm3d-wanderwege), © swisstopo",
  },
  places,
  secondary: Object.fromEntries(cfg.secondary.map((s) => [s.id, { label: s.label, altitudeM: s.altitudeM, source: s.source, secondary: true }])),
  aboutClimb: climb,
};
writeFileSync(outFile, `${JSON.stringify(data, null, 2)}\n`);
for (const [id, p] of Object.entries(places)) {
  console.log(`  ${id.padEnd(18)} ${String(p.altitudeM).padStart(5)} m  DEM ${String(p.dem ?? "–").padStart(7)}${p.conflict ? `  CONFLICT ${p.conflict}` : ""}${p.unverified ? "  UNVERIFIED" : ""}`);
}
console.log(`  About climb: ${(climb.lengthM / 1000).toFixed(2)} km, ${climb.points.length} points, stops at ${climb.stopsAtM.join(", ")} m (snapped ${climb.snapM.join(", ")} m from the trail)`);
console.log(`Wrote ${outFile.slice(root.length + 1)}`);
