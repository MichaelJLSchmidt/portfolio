// Posters: the field's first frame for every terrain, as AVIF (≤ 60 KB), shown from the first
// paint until the WebGL field takes over on the identical frame (and instead of it in Off, on
// tier C and without WebGL2). Renders src/field/core.ts itself in Chromium (SwiftShader) at t = 0:
// no drift, no breath, no pointer. Landscape 1600 × 1000 and portrait 900 × 1600. Writes
// public/terrain/field/posters/ and the `posters` entries of public/terrain/field/{field,examples}.json.
//   npm run posters      (after npm run terrain:field; Playwright from NODE_PATH)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ts from "typescript";
import "../lib/ts-hooks.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const metaFiles = ["field.json", "examples.json"].map((f) => join(root, "public/terrain/field", f));
const outDir = join(root, "public/terrain/field/posters");
mkdirSync(outDir, { recursive: true });
const BUDGET = 60 * 1024;
const SIZES = { landscape: [1600, 1000], portrait: [900, 1600] };
const ORIGIN = "http://posters.local";

const { fieldOptions } = await import("../../src/field/index.ts");
const core = ts.transpileModule(readFileSync(join(root, "src/field/core.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;

let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (NODE_PATH, or npm i -D playwright).");
  process.exit(2);
}

const page = (opts, src, w, h) => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}canvas{position:fixed;inset:0;width:${w}px;height:${h}px}</style>
<canvas></canvas><script type="module">
import { createField } from "/core.js";
const field = createField(document.querySelector("canvas"), ${JSON.stringify(opts)});
field.setMotion({ drift: 0, breath: 0, breathPeriodS: 24, bump: 0 });
field.setPaused(true);
await field.show(${JSON.stringify(src)});
field.frameAt(0);
window.__done = true;
</script>`;

const types = { ".js": "text/javascript", ".webp": "image/webp", ".bin": "application/octet-stream" };
const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const metaFile of metaFiles) {
  const meta = JSON.parse(readFileSync(metaFile, "utf8"));
  const posters = {};
  for (const [id, t] of Object.entries(meta.terrains)) {
    const src = {
      image: t.file,
      raw: t.raw,
      width: t.width,
      height: t.height,
      offset: t.encoding.offset,
      scale: t.encoding.scale,
      probe: t.probe,
      steepM: t.gradientM.p95,
      intervals: t.intervalsM,
      focus: t.focus,
    };
    const entry = {};
    for (const [orientation, [w, h]] of Object.entries(SIZES)) {
      const opts = { ...fieldOptions(orientation === "portrait" ? "mobile" : "desktop"), dprMax: 1 };
      const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await context.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/") return route.fulfill({ contentType: "text/html", body: page(opts, src, w, h) });
        if (path === "/core.js") return route.fulfill({ contentType: "text/javascript", body: core });
        return route.fulfill({ contentType: types[extname(path)] ?? "application/octet-stream", body: readFileSync(join(root, "public", path)) });
      });
      const tab = await context.newPage();
      await tab.goto(`${ORIGIN}/`);
      await tab.waitForFunction(() => window.__done === true, null, { timeout: 30000 });
      const png = await tab.locator("canvas").screenshot({ type: "png" });
      await context.close();
      let avif;
      for (let q = 60; q >= 20; q -= 5) {
        avif = await sharp(png).avif({ quality: q, effort: 6, chromaSubsampling: "4:2:0" }).toBuffer();
        if (avif.length <= BUDGET) break;
      }
      if (avif.length > BUDGET) throw new Error(`${id} ${orientation}: ${(avif.length / 1024).toFixed(1)} KB over the budget`);
      const name = `${id}-${orientation === "portrait" ? "p" : "l"}.avif`;
      writeFileSync(join(outDir, name), avif);
      entry[orientation] = `/terrain/field/posters/${name}`;
      entry[orientation === "portrait" ? "sizePortrait" : "size"] = [w, h];
      console.log(`  ${id.padEnd(9)} ${orientation.padEnd(9)} ${w}×${h}  ${(avif.length / 1024).toFixed(1)} KB`);
    }
    posters[id] = { ...entry, focus: t.focus };
  }
  meta.posters = posters;
  writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`Wrote the posters to ${metaFile.slice(root.length + 1)}`);
  }
} finally {
  await browser.close();
}
