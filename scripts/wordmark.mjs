// The footer wordmark: the brand (src/content/site.ts) set in Archivo at the title's rest cut
// (wght 800, wdth 75), turned into outlines with HarfBuzz, with its construction drawn in: the
// baseline, x-height and cap-height (the component overshoots them 12 px either side), a tick at
// every advance boundary and a crosshair at the centroid of every counter. M, J, L and S have no
// closed counter, so the open counters count too: each region of a letter's box that the ink
// leaves white and that is at least a twentieth of the box, found on a raster of the outline.
// Writes src/components/footer/wordmark.json, which SiteFooter's Wordmark renders inline.
//
//   npm run wordmark          (npm run build and npm run dev run it first)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fontverter from "fontverter";
import * as hb from "harfbuzzjs";
import sharp from "sharp";
import "./lib/ts-hooks.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { site } = await import("../src/content/site.ts");
const { titleAxes } = await import("../src/styles/tokens.ts");

const FONT = join(root, "artefacts/shared/fonts/archivo.woff2");
const OUT = join(root, "src/components/footer/wordmark.json");
const RASTER = 160; // px per em for the counter search
const MIN_COUNTER = 1 / 20;

const face = new hb.Face(new hb.Blob(await fontverter.convert(readFileSync(FONT), "truetype")));
const font = new hb.Font(face);
font.setVariations([new hb.Variation("wght", titleAxes.rest.wght), new hb.Variation("wdth", titleAxes.rest.wdth)]);
const upem = face.upem;
const em = (v) => Math.round((v / upem) * 10000) / 10000;

// Vertical metrics from the letters themselves: the top of H and x (flat tops, no overshoot).
const top = (ch) => font.glyphExtents(font.glyph(ch.codePointAt(0))).yBearing;
const capHeight = top("H");
const xHeight = top("x");

const text = site.brand.toUpperCase();
const buffer = new hb.Buffer();
buffer.addText(text);
buffer.guessSegmentProperties();
hb.shape(font, buffer);
const glyphs = buffer.getGlyphInfosAndPositions();
buffer.destroy?.();

/** A glyph's path in font units, y flipped (SVG: y down from the cap height), moved right by x. */
function placed(glyph, x) {
  return font
    .glyphToJson(glyph)
    .map(({ type, values }) => {
      const pts = [];
      for (let i = 0; i < values.length; i += 2) pts.push(`${Math.round(values[i] + x)} ${Math.round(capHeight - values[i + 1])}`);
      return `${type}${pts.join(" ")}`;
    })
    .join("");
}

/** The counters of one glyph: centroids of the white regions inside its ink box (font units, SVG y). */
async function counters(glyph, x) {
  const ext = font.glyphExtents(glyph);
  if (!ext || ext.width <= 0) return [];
  const w = Math.max(8, Math.round((ext.width / upem) * RASTER));
  const h = Math.max(8, Math.round((-ext.height / upem) * RASTER));
  const sx = w / ext.width;
  const sy = h / -ext.height;
  const path = font
    .glyphToJson(glyph)
    .map(({ type, values }) => {
      const pts = [];
      for (let i = 0; i < values.length; i += 2) pts.push(`${((values[i] - ext.xBearing) * sx).toFixed(2)} ${((ext.yBearing - values[i + 1]) * sy).toFixed(2)}`);
      return `${type}${pts.join(" ")}`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  const { data } = await sharp(Buffer.from(svg)).greyscale().raw().toBuffer({ resolveWithObject: true });
  const white = (i) => data[i] > 128;
  const seen = new Uint8Array(w * h);
  const found = [];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !white(start)) continue;
    // Flood fill one white region.
    let n = 0, cx = 0, cy = 0;
    const stack = [start];
    const region = [];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop();
      const px = i % w, py = (i / w) | 0;
      region.push(i);
      n++;
      cx += px;
      cy += py;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const qx = px + dx, qy = py + dy;
        if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
        const j = qy * w + qx;
        if (!seen[j] && white(j)) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (n / (w * h) < MIN_COUNTER) continue;
    // A curved counter's centroid can fall on the ink (the S): take the region's nearest point.
    let [mx, my] = [cx / n, cy / n];
    if (!region.includes(Math.round(my) * w + Math.round(mx))) {
      const near = region.reduce((best, i) => {
        const d = (i % w - mx) ** 2 + (((i / w) | 0) - my) ** 2;
        return d < best.d ? { d, i } : best;
      }, { d: Infinity, i: region[0] });
      [mx, my] = [near.i % w, (near.i / w) | 0];
    }
    found.push({
      x: Math.round(x + ext.xBearing + (mx + 0.5) / sx),
      y: Math.round(capHeight - ext.yBearing + (my + 0.5) / sy),
    });
  }
  return found;
}

let pen = 0;
const paths = [];
const advances = [0];
const marks = [];
for (const g of glyphs) {
  const x = pen + (g.xOffset ?? 0);
  paths.push(placed(g.codepoint, x));
  marks.push(...(await counters(g.codepoint, x)));
  pen += g.xAdvance;
  advances.push(pen);
}

const data = {
  $comment: "Generated by scripts/wordmark.mjs from the brand in src/content/site.ts; SiteFooter's Wordmark renders it.",
  // The brand itself stays in site.ts (the name source); this file holds only its outlines.
  letters: glyphs.length,
  axes: titleAxes.rest,
  // Font units; y runs down from the cap height (0) to the baseline (capHeight).
  width: pen,
  height: capHeight,
  baseline: capHeight,
  xHeight: capHeight - xHeight,
  capHeight: 0,
  ratio: em(pen) / em(capHeight),
  path: paths.join(""),
  advances,
  counters: marks,
};
mkdirSync(dirname(OUT), { recursive: true });
const json = `${JSON.stringify(data, null, 1)}\n`;
let previous = "";
try {
  previous = readFileSync(OUT, "utf8");
} catch {}
if (json !== previous) writeFileSync(OUT, json);
console.log(`Wordmark: ${text}, ${glyphs.length} letters, ${marks.length} counters${json === previous ? " (unchanged)" : ""}`);
