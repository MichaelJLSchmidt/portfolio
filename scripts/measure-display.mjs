// Measures Archivo's advance widths, one glyph per box exactly as SettleText sets them, for the
// cuts whose letter boxes are fixed (SettleText `widths`), and writes them next to
// src/lib/display-width.ts:
//   - display-widths.json: the display rest axes (wdth 62, wght 800, upper case, the .display
//     letter-spacing);
//   - condensed-widths.json: the condensed cut at wght 600 (the case-study type line), mixed case,
//     with the word space.
// Re-run after changing those axes or the font:
//
//   npm run dev   (another terminal)
//   node scripts/measure-display.mjs [http://localhost:3000]
//
// Playwright as for npm run test:e2e.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://localhost:3000";
const require = createRequire(join(root, "package.json"));
const { chromium } = require("playwright");

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜÉÈÀÇ0123456789 '’-–—.,:;!?&/()+%";
const MIXED = `${UPPER}abcdefghijklmnopqrstuvwxyzäöüéèàç·`;
const cuts = [
  { file: "display-widths.json", axes: { wdth: 62, wght: 800 }, chars: UPPER, css: "", className: "display" },
  { file: "condensed-widths.json", axes: { wdth: 88, wght: 600 }, chars: MIXED, css: "font-family:var(--font-text);font-stretch:var(--type-condensed-wdth);font-weight:600", className: "" },
];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
for (const cut of cuts) {
  const widths = await page.evaluate(({ chars, css, className }) => {
    const box = document.createElement("div");
    box.className = className;
    box.style.cssText = `position:absolute;left:0;top:0;font-size:1000px;white-space:pre;${css}`;
    document.body.appendChild(box);
    const out = {};
    for (const ch of chars) {
      const s = document.createElement("span");
      s.style.display = "inline-block";
      s.textContent = ch;
      box.replaceChildren(s);
      out[ch] = Math.round(s.getBoundingClientRect().width) / 1000;
    }
    box.remove();
    return out;
  }, cut);
  writeFileSync(join(root, "src/lib", cut.file), `${JSON.stringify({ axes: cut.axes, em: widths }, null, 1)}\n`);
  console.log(`src/lib/${cut.file}: ${Object.keys(widths).length} glyphs`);
}
await browser.close();
