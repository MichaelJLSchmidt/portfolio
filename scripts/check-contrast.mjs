// WCAG contrast check for the colour pairs the design uses, read from src/styles/tokens.ts, plus
// text over the contour field (src/config/contour-field.json). The rules:
//   text over the field             at least 7:1 (in a quiet zone, on the HUD backdrop, knocked out)
//   text on paper or raised ground  at least 4.5:1
//   meaningful non-text marks       at least 3:1 (the route, focus rings, outlines, rarity shapes)
// Rendered pages are measured by npm run check:legibility.
//   npm run check:contrast
import { readFileSync } from "node:fs";
import { color } from "../src/styles/tokens.ts";

const field = JSON.parse(readFileSync(new URL("../src/config/contour-field.json", import.meta.url), "utf8"));
const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lumRgb = (c) => {
  const [r, g, b] = c.map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const lum = (hex) => lumRgb(rgb(hex));
const contrast = (la, lb) => (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
const ratio = (a, b) => contrast(lum(color[a]), lum(color[b]));

let failed = 0;
const report = (r, min, what) => {
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  ${what} (min ${min})`);
};

// [foreground, background, minimum].
console.log("Opaque surfaces:");
const required = [
  // Text on the ground and on raised panels (cards, legend sheets, the HUD).
  ["paperDusk", "ground", 7],
  ["paperDusk", "groundRaised", 4.5],
  ["glacier", "ground", 7],
  ["glacier", "groundRaised", 4.5],
  ["contour", "ground", 4.5],
  ["contour", "groundRaised", 4.5],
  ["ice", "ground", 4.5],
  ["alpenglow", "ground", 4.5],
  ["summitGold", "ground", 4.5],
  // The flood: ground on glacier.
  ["ground", "glacier", 4.5],
  // The case-study summary, the only paper surface.
  ["paperInk", "paperDusk", 4.5],
  ["paperInk2", "paperDusk", 4.5],
  ["mossInk", "paperDusk", 4.5],
  ["alpenglowInk", "paperDusk", 4.5],
  ["ground", "paperDusk", 4.5],
  // Marks: the route, outlines, rarity shapes on the raised ground.
  ["signal", "ground", 3],
  ["signal", "groundRaised", 3],
  ["routePaper", "paperDusk", 3],
  ["contour", "ground", 3],
  ["alpenglow", "groundRaised", 3],
  ["ice", "groundRaised", 3],
];
for (const [fg, bg, min] of required) report(ratio(fg, bg), min, `${fg} on ${bg}`);

// Never used for text on paper; listed so the rule stays visible.
for (const [fg, bg] of [
  ["contour", "paperDusk"],
  ["glacier", "paperDusk"],
  ["signal", "paperDusk"],
]) {
  console.log(`info  ${ratio(fg, bg).toFixed(2).padStart(5)}:1  ${fg} on paperDusk (never used on paper)`);
}

// Quiet zones: text drawn without a halo over lines faded to `quietStrength`. Worst case is a
// fully opaque line in any of the field's line colours; the HUD's backdrop is ground at 92% over a
// fully lit line.
const lineColours = [...new Set([field.lineColor, field.indexColor])];
const fadedOver = (line, strength) => {
  const g = rgb(color.ground), c = rgb(color[line]);
  return g.map((v, i) => v + (c[i] - v) * strength);
};
const hudBg = (line) => fadedOver(line, 0.08);
console.log(`\nText over the field (quiet zones: lines at ${Math.round(field.quietStrength * 100)}%; minimum 7:1):`);
for (const fg of ["paperDusk", "glacier"]) {
  for (const line of lineColours) {
    report(contrast(lum(color[fg]), lumRgb(fadedOver(line, field.quietStrength))), 7, `${fg} over ${line} lines, quiet zone`);
    report(contrast(lum(color[fg]), lumRgb(hudBg(line))), 7, `${fg} over ${line} lines, HUD backdrop`);
  }
}
for (const fg of ["contour", "ice", "alpenglow", "signal"]) {
  const r = Math.min(...lineColours.map((line) => contrast(lum(color[fg]), lumRgb(fadedOver(line, field.quietStrength)))));
  console.log(`info  ${r.toFixed(2).padStart(5)}:1  ${fg} in a quiet zone: below 7:1, so never text over the field`);
}
// The route is a mark: 3:1 over a quiet zone.
for (const line of lineColours) report(contrast(lum(color.signal), lumRgb(fadedOver(line, field.quietStrength))), 3, `signal (the route) over ${line} lines, quiet zone`);

// Body text (.body-copy): lines knocked out to bodyQuietStrength; on a legend panel (raised ground
// at 88%) on top of that.
console.log(`\nBody text (lines at ${Math.round(field.bodyQuietStrength * 100)}%; minimum 7:1):`);
const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
for (const line of lineColours) {
  const bg = fadedOver(line, field.bodyQuietStrength);
  report(contrast(lum(color.paperDusk), lumRgb(bg)), 7, `paperDusk over ${line} lines, knockout`);
  report(contrast(lum(color.paperDusk), lumRgb(mixRgb(bg, rgb(color.groundRaised), 0.88))), 7, `paperDusk over ${line} lines, legend panel`);
}
process.exit(failed ? 1 : 0);
