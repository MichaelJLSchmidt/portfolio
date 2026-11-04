// WCAG contrast check for the colour pairs the design uses, read from src/styles/tokens.ts, plus
// text over the contour field (src/config/contour-field.json). The rules (WCAG 2.2 AA):
//   text on ground, raised ground or the sheet       at least 4.5:1
//   focus rings and meaningful marks                  at least 3:1
//   text over the field: `text` over the strongest line anywhere; `text2` only inside a quiet zone
//   (or over the poster's ground plate); `text3` never over the field (the footer is opaque).
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

console.log("Opaque surfaces:");
const required = [
  ["text", "ground", 4.5],
  ["text2", "ground", 4.5],
  ["text3", "ground", 4.5],
  ["text", "groundRaised", 4.5],
  ["text2", "groundRaised", 4.5],
  ["ink", "sheet", 4.5],
  ["ink2", "sheet", 4.5],
  // Focus rings: mint on dark, ink on the sheet.
  ["glacier", "ground", 3],
  ["glacier", "groundRaised", 3],
  ["ink", "sheet", 3],
  // The survey button's 1 px frame and the card's hover frame identify a control.
  ["text3", "ground", 3],
];
for (const [fg, bg, min] of required) report(ratio(fg, bg), min, `${fg} on ${bg}`);
for (const [fg, bg, why] of [
  ["text3", "groundRaised", "text3 never sits on the raised ground"],
  ["glacier", "sheet", "mint never sits on the sheet"],
]) {
  console.log(`info  ${ratio(fg, bg).toFixed(2).padStart(5)}:1  ${fg} on ${bg} (${why})`);
}

// Over the field: the strongest line is an index line at its full strength; a quiet zone fades it.
const lineHex = color[field.indexColor] ?? color.fieldLine;
const strongest = Math.max(field.desktop.indexOpacity, field.mobile.indexOpacity);
const fadedOver = (strength) => {
  const g = rgb(color.ground);
  const c = rgb(lineHex);
  return g.map((v, i) => v + (c[i] - v) * strength);
};
console.log(`\nText over the field (index lines at ${Math.round(strongest * 100)}%, quiet zones keep ${Math.round(field.quietStrength * 100)}% of them):`);
report(contrast(lum(color.text), lumRgb(fadedOver(strongest))), 4.5, "text over the strongest line");
report(contrast(lum(color.text2), lumRgb(fadedOver(strongest * field.quietStrength))), 4.5, "text2 over a line in a quiet zone");
report(contrast(lum(color.glacier), lumRgb(fadedOver(strongest))), 3, "glacier (focus) over the strongest line");
console.log(`info  ${contrast(lum(color.text2), lumRgb(fadedOver(strongest))).toFixed(2).padStart(5)}:1  text2 over the strongest line outside a quiet zone (so text2 sits in one)`);
console.log(`info  ${contrast(lum(color.text3), lumRgb(fadedOver(strongest * field.quietStrength))).toFixed(2).padStart(5)}:1  text3 in a quiet zone (so text3 never sits over the field)`);
process.exit(failed ? 1 : 0);
