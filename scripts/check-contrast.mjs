// WCAG contrast check for the colour pairs the design uses, read from src/styles/tokens.ts.
//   npm run check:contrast
import { color } from "../src/styles/tokens.ts";

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(color[a]), lum(color[b])].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

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
process.exit(failed ? 1 : 0);
