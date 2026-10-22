// WCAG contrast check for the colour pairs the design uses, read from src/styles/tokens.ts,
// plus text inside the field's quiet zones (src/config/contour-field.json).
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

// [foreground, background, minimum] — 4.5 for text, 3 for large text / UI marks.
const required = [
  ["sheet", "ground", 4.5],
  ["sheet", "groundRaised", 4.5],
  ["contour", "ground", 4.5],
  ["glacier", "ground", 4.5],
  ["ice", "ground", 4.5],
  ["alpenglow", "ground", 4.5],
  ["summitGold", "ground", 4.5],
  ["signal", "ground", 3],
  ["ground", "sheet", 4.5],
  ["sheetInk", "sheet", 4.5],
  ["mossInk", "sheet", 4.5],
  ["alpenglowInk", "sheet", 4.5],
  ["ground", "glacier", 4.5],
];
// Documented as not allowed on the sheet colour; listed so the rule stays visible.
const forbidden = [
  ["contour", "sheet"],
  ["glacier", "sheet"],
];

let failed = 0;
for (const [fg, bg, min] of required) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg} (min ${min})`);
}
for (const [fg, bg] of forbidden) console.log(`info  ${ratio(fg, bg).toFixed(2).padStart(5)}:1  ${fg} on ${bg} (never used for text or lines)`);

// Quiet zones: text drawn without a halo over lines faded to `quietStrength`. Worst case is a
// fully lit line (alpha 1 before fading) in any of the field's line colours, plus the glow
// halo the shader adds around lit lines (0.18 at most, faded the same way).
const s = field.quietStrength;
const lineColours = [...new Set([field.lineColor, field.indexColor, field.glowColor, field.pulseColor])];
const zoneBg = (token) => {
  const g = rgb(color.ground), c = rgb(color[token]), glow = rgb(color[field.glowColor]);
  return g.map((v, i) => Math.min(255, v + (c[i] - v) * s + glow[i] * 0.18 * s));
};
const zoneText = [
  ["sheet", 4.5],
  ["glacier", 4.5],
];
console.log(`\nQuiet zones (lines at ${Math.round(s * 100)}%, no halo):`);
for (const [fg, min] of zoneText) {
  for (const line of lineColours) {
    const r = contrast(lum(color[fg]), lumRgb(zoneBg(line)));
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  ${fg} over ${line} lines (min ${min})`);
  }
}
const worst = Math.min(...lineColours.map((line) => contrast(lum(color.contour), lumRgb(zoneBg(line)))));
console.log(`info  ${worst.toFixed(2).padStart(5)}:1  contour over the brightest line: contour labels keep their halo (.keep-halo)`);
process.exit(failed ? 1 : 0);
