// Card plates (`npm run plates`): the map-sheet card's art and the case study's header plate.
//
// For each card terrain (terrain/terrain.json and terrain/examples.json, written by
// `npm run terrain`), the summit's master heightmap (terrain/morph/<id>.bin) is cropped to 4:3
// around the summit, contoured at the card's interval with d3-contour and simplified, in the
// field's visual language: 1 px lines and 1.5 px index lines every fifth, stone grey
// (fieldLine), with one mint (glacier) index line. Two plates per terrain:
//
//   public/plates/<id>.svg        at rest: index lines on the card's index levels, the mint one
//                                 the highest index level with room around it below the summit
//   public/plates/<id>-level.svg  "one contour level up": the same lines with the index emphasis
//                                 (and the mint line) stepped up by one interval; the card's
//                                 hover crossfades to it, and the case-study header shows it
//
// Strokes keep their width at any size (non-scaling); the plates are transparent, so they sit on
// whatever surface frames them. Each plate must stay within 25 KB, or the script fails.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { color } from "../../src/styles/tokens.ts";
import "../lib/ts-hooks.mjs";
import { isobands, ringsToLines, toPathData } from "../terrain/lib/contours.mjs";
import { gaussianBlur, minMax } from "../terrain/lib/grid.mjs";
import { decodeRawHeights } from "../terrain/lib/heightmap.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "public/plates");
const BUDGET = 25 * 1024;
/** Line opacities (the field's language, a little firmer at card size); lines shorter than minLength grid units (specks) are dropped. */
export const PLATE = { line: 0.34, index: 0.56, mint: 0.95, blur: 0.8, tolerance: 0.35, minLength: 8, aspect: 4 / 3 };

const readJson = (rel) => (existsSync(join(root, rel)) ? JSON.parse(readFileSync(join(root, rel), "utf8")) : {});
const places = readJson("src/content/geo-data.json").places ?? {};

/** The card's heights as metres, from the raw master (terrain/morph/<id>.bin). */
function heights(id, morph) {
  const { width: w, height: h, encoding } = morph;
  const rgb = decodeRawHeights(readFileSync(join(root, "terrain/morph", `${id}.bin`)), w, h);
  const data = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) data[i] = encoding.offset + ((rgb[i * 3] << 8) | rgb[i * 3 + 1]) * encoding.scale;
  return { data, w, h };
}

/** A 4:3 window of the grid, as wide as the height allows, centred on the summit where it can be. */
function crop({ data, w, h }, summitX) {
  const ch = Math.min(h, Math.floor(w / PLATE.aspect));
  const cw = Math.round(ch * PLATE.aspect);
  const x0 = Math.max(0, Math.min(w - cw, Math.round(summitX - cw / 2)));
  const y0 = Math.round((h - ch) / 2);
  const out = new Float64Array(cw * ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) out[y * cw + x] = data[(y + y0) * w + x + x0];
  return { data: out, w: cw, h: ch };
}

/** The summit's column in the grid: its LV95 position when known, else the highest texel. */
function summitColumn(id, card, { data, w }) {
  const place = places[id];
  if (place?.e && card.bboxLv95) {
    const [x0, , x1] = card.bboxLv95;
    return ((place.e - x0) / (x1 - x0)) * w;
  }
  let best = 0;
  for (let i = 1; i < data.length; i++) if (data[i] > data[best]) best = i;
  return best % w;
}

/** One plate's SVG: regular lines, index lines and the one mint line, in that order. */
function plateSvg({ data, w, h }, { interval, indexEvery, step, mintLevel }) {
  const [lo, hi] = minMax(data);
  const levels = [];
  for (let v = Math.ceil(lo / interval) * interval; v <= hi; v += interval) levels.push(v);
  const isIndex = (v) => Math.round((v - step * interval) / interval) % indexEvery === 0;
  let regular = "";
  let index = "";
  let mint = "";
  for (const band of isobands(data, w, h, levels)) {
    const d = toPathData(ringsToLines(band, w, h), { tolerance: PLATE.tolerance, minLength: PLATE.minLength });
    if (band.value === mintLevel) mint += d;
    else if (isIndex(band.value)) index += d;
    else regular += d;
  }
  const path = (d, stroke, width, opacity) =>
    d ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">` +
    path(regular, color.fieldLine, 1, PLATE.line) +
    path(index, color.fieldLine, 1.5, PLATE.index) +
    path(mint, color.glacier, 1.5, PLATE.mint) +
    `</svg>\n`
  );
}

/**
 * The mint line at rest: the highest index level at least two intervals below the top of the
 * window, so it draws a full ring or ridge line rather than a speck at the summit.
 */
export function mintLevelFor(hi, interval, indexEvery) {
  const indexStep = interval * indexEvery;
  return Math.floor((hi - 2 * interval) / indexStep) * indexStep;
}

function write(rel, svg) {
  const bytes = Buffer.byteLength(svg);
  if (bytes > BUDGET) throw new Error(`public/plates/${rel} is ${(bytes / 1024).toFixed(1)} KB, over the ${BUDGET / 1024} KB budget`);
  writeFileSync(join(outDir, rel), svg);
  console.log(`  wrote public/plates/${rel}  ${(bytes / 1024).toFixed(1)} KB  (${(gzipSync(svg).length / 1024).toFixed(1)} KB gz)`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const cards = { ...(readJson("terrain/terrain.json").cards ?? {}), ...(readJson("terrain/examples.json").cards ?? {}) };
  if (!Object.keys(cards).length) throw new Error("No card terrains in terrain/terrain.json or terrain/examples.json (npm run terrain).");
  mkdirSync(outDir, { recursive: true });
  console.log("Plates: 4:3 contour plates of each card terrain");
  for (const [id, card] of Object.entries(cards)) {
    const grid = heights(id, card.morph);
    const window = crop(grid, summitColumn(id, card, grid));
    window.data = gaussianBlur(window.data, window.w, window.h, PLATE.blur);
    const interval = card.contourIntervalM;
    const indexEvery = card.indexEvery;
    const mintLevel = mintLevelFor(minMax(window.data)[1], interval, indexEvery);
    write(`${id}.svg`, plateSvg(window, { interval, indexEvery, step: 0, mintLevel }));
    write(`${id}-level.svg`, plateSvg(window, { interval, indexEvery, step: 1, mintLevel: mintLevel + interval }));
  }
}
