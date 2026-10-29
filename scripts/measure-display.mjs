// Measures Archivo's advance widths at the display rest axes (wdth 62, wght 800, upper case, the
// .display letter-spacing), one glyph per box exactly as SettleText sets them, and writes
// src/lib/display-widths.json. Re-run after changing the display axes or the font:
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

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜÉÈÀÇ0123456789 '’-–—.,:;!?&/()+%";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const widths = await page.evaluate((chars) => {
  const box = document.createElement("div");
  box.className = "display";
  box.style.cssText = "position:absolute;left:0;top:0;font-size:1000px;white-space:pre";
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
}, CHARS);
await browser.close();
writeFileSync(join(root, "src/lib/display-widths.json"), `${JSON.stringify({ axes: { wdth: 62, wght: 800 }, em: widths }, null, 1)}\n`);
console.log(`src/lib/display-widths.json: ${Object.keys(widths).length} glyphs`);
