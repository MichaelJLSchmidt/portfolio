// Width compensation for WeightTitle: every display title animates from wght 200 at a start width
// W0 to its rest cut, wght 800 at wdth 75, and W0 is chosen so the line keeps its length. This
// script shapes each title (src/lib/display-titles.ts) with HarfBuzz in Archivo's variable font
// and solves the width that keeps the line's length at the start weight and at three weights in
// between (knots at a quarter, half and three quarters of the way); WeightTitle runs one eased
// progress value and follows those knots piecewise. It measures how far the line drifts at every
// step (also for a straight line from W0, for comparison) and writes src/lib/title-axes.json. A
// title whose drift stays within 2% (a title on several lines: its widest line, which sets its
// measure; the shorter, ragged lines move nothing) animates both axes; anything else (or a title not measured
// yet) keeps a box reserved at its final width and animates the weight alone.
//
//   npm run titles             (npm run build and npm run dev run it first)
//   npm run titles -- --report also print how much the weight axis alone changes each title
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import fontverter from "fontverter";
import * as hb from "harfbuzzjs";
import "./lib/ts-hooks.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { displayTitles, titleKey } = await import("../src/lib/display-titles.ts");
const { titleAxes } = await import("../src/styles/tokens.ts");

const FONT = join(root, "artefacts/shared/fonts/archivo.woff2");
const OUT = join(root, "src/lib/title-axes.json");
const START_WGHT = titleAxes.from.wght;
const REST = titleAxes.rest;
const LIMIT = 0.02;
const STEPS = 40;

const fontData = readFileSync(FONT);
const face = new hb.Face(new hb.Blob(await fontverter.convert(fontData, "truetype")));
const range = face.getAxisInfos().wdth;
const font = new hb.Font(face);

/** The advance of a title, in em, at the given axes: its widest line, which sets its measure. */
function advance(title, wght, wdth) {
  return Math.max(...title.split("\n").map((line) => lineAdvance(line, wght, wdth)));
}

/** The largest drift of any line of a title from its own rest length, at progress t. */
function lineDrift(title, knots, t) {
  return Math.max(...title.split("\n").map((line) => Math.abs(lineAdvance(line, wghtAt(t), wdthAt(knots, t)) / lineAdvance(line, REST.wght, REST.wdth) - 1)));
}

/** The advance of one line, in em, at the given axes. */
function lineAdvance(text, wght, wdth) {
  font.setVariations([new hb.Variation("wght", wght), new hb.Variation("wdth", wdth)]);
  const buffer = new hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hb.shape(font, buffer);
  const em = buffer.getGlyphPositions().reduce((sum, p) => sum + p.xAdvance, 0) / face.upem;
  buffer.destroy?.();
  return em;
}

const KNOTS = [0, 0.25, 0.5, 0.75];
const wghtAt = (t) => START_WGHT + (REST.wght - START_WGHT) * t;

/** The width at weight `wght` that gives the line its rest length (bisection). */
function solve(text, wght, target) {
  let lo = range.min;
  let hi = range.max;
  if (advance(text, wght, hi) < target) return { wdth: hi, clamped: true };
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (advance(text, wght, mid) < target) lo = mid;
    else hi = mid;
  }
  return { wdth: (lo + hi) / 2, clamped: false };
}

/** The width at progress t along the knots (the last segment ends at the rest width). */
function wdthAt(knots, t) {
  const points = [...knots, REST.wdth];
  const i = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
  const local = t * (points.length - 1) - i;
  return points[i] + (points[i + 1] - points[i]) * local;
}

const report = process.argv.includes("--report");
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const titles = {};
for (const title of displayTitles()) {
  const target = advance(title, REST.wght, REST.wdth);
  const solved = KNOTS.map((t) => solve(title, wghtAt(t), target));
  const knots = solved.map((k) => round(k.wdth, 2));
  const clamped = solved.some((k) => k.clamped);
  // The largest drift from the rest length along the way: on the knots, and on a straight line
  // from W0 (what a single pair of keyframes would do), for the record.
  let drift = 0;
  let lines = 0;
  let straight = 0;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    drift = Math.max(drift, Math.abs(advance(title, wghtAt(t), wdthAt(knots, t)) / target - 1));
    lines = Math.max(lines, lineDrift(title, knots, t));
    straight = Math.max(straight, Math.abs(advance(title, wghtAt(t), knots[0] + (REST.wdth - knots[0]) * t) / target - 1));
  }
  // How much the weight axis alone changes the line (start weight at the rest width).
  const weightEffect = advance(title, START_WGHT, REST.wdth) / target - 1;
  // The rest cut's measure, for sizing: the widest line and the widest word, in em (the display
  // letter-spacing, -0.01 em a letter, included).
  const tracked = (text) => advance(text, REST.wght, REST.wdth) - 0.01 * Math.max(...text.split("\n").map((l) => l.length));
  const words = title.split(/[\s\n]+/).filter(Boolean);
  titles[titleKey(title)] = {
    em: round(tracked(title), 4),
    wordEm: round(Math.max(...words.map(tracked)), 4),
    knots,
    drift: round(drift, 4),
    ...(title.includes("\n") ? { shorterLinesDrift: round(lines, 4) } : {}),
    straightDrift: round(straight, 4),
    weightEffect: round(weightEffect, 4),
    ...(clamped ? { clamped: true } : {}),
    compensated: !clamped && drift <= LIMIT,
  };
  if (report) {
    console.log(
      `${title.replace("\n", " / ").padEnd(28)} weight alone ${(weightEffect * 100).toFixed(1).padStart(6)}%   W0 ${knots[0].toFixed(1).padStart(6)}   straight ${(straight * 100).toFixed(2)}%   knots ${(drift * 100).toFixed(2)}%${title.includes("\n") ? ` (shorter line ${(lines * 100).toFixed(2)}%, ragged, moves nothing)` : ""}${clamped ? "  (clamped)" : ""}${titles[titleKey(title)].compensated ? "" : "  → fallback"}`,
    );
  }
}

const data = {
  $comment: "Generated by scripts/measure-titles.mjs from Archivo's variable font; WeightTitle reads it.",
  font: createHash("sha256").update(fontData).digest("hex").slice(0, 16),
  from: { wght: START_WGHT },
  rest: REST,
  knotsAt: KNOTS,
  limit: LIMIT,
  titles,
};
const json = `${JSON.stringify(data, null, 1)}\n`;
let previous = "";
try {
  previous = readFileSync(OUT, "utf8");
} catch {
  // First run.
}
if (json !== previous) writeFileSync(OUT, json);
const n = Object.keys(titles).length;
const fallback = Object.entries(titles).filter(([, v]) => !v.compensated);
console.log(`Titles: ${n} measured, ${n - fallback.length} width-compensated, ${fallback.length} weight-only${json === previous ? " (unchanged)" : " → src/lib/title-axes.json"}`);
