// Artefact images: renders every case-study artefact (artefacts/<slug>/<id>.html or .svg) in
// Chromium and encodes it for the site.
//
//   npm run images                 every image of every data-driven case study
//   npm run images -- tp-hero …    only these (the other manifest entries stay as they are)
//   npm run images -- --fonts      regenerate the artefact fonts first
//
// 1. Render (Playwright, Chromium): the page from shell.mjs, laid out at half the master size
//    with deviceScaleFactor 2; fonts awaited (document.fonts.ready), animations off, the clock
//    fixed and Math.random seeded, so a run is deterministic. An element screenshot of the
//    artefact root is the lossless PNG master (artefacts/.masters, git-ignored, regenerable).
// 2. Encode (sharp): AVIF (quality 55) and WebP (quality 78) at 640/960/1280/1920/2560 px wide,
//    never upscaled (a master narrower than 2560 also gets its own width), into
//    public/media/<slug>/.
// 3. Manifest (next to the case study's data): intrinsic size, a tiny blurred placeholder, the
//    alt and caption keys, every source with its size, hotspot positions (elements marked
//    data-hotspot="n"), the image's rendered text and the hash of its inputs (check:figures).
//
// Budget: the hero's 1920 px AVIF stays at or under 180 KB.
//
// Playwright is not a dependency (as for npm run test:e2e); Chromium must be installed.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import "../lib/ts-hooks.mjs";
import { ensureFonts } from "./fonts.mjs";
import { buildShell, inputHash, stripLabel } from "./shell.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const WIDTHS = [640, 960, 1280, 1920, 2560];
const AVIF = { quality: 55, effort: 4 };
const WEBP = { quality: 78, effort: 6 };
const HERO_BUDGET = { width: 1920, bytes: 180 * 1024 };
const ORIGIN = "http://artefacts.local";

const { dataSources } = await import("../../src/content/examples/sources.ts");
const { caseStudyLabels: L } = await import("../../src/content/cards.ts");
const { figureNumbers, figureOfImage } = await import("../../src/lib/case-study.ts");

let playwright;
try {
  playwright = createRequire(import.meta.url)("playwright");
} catch {
  console.error("Playwright is not installed (npm i -D playwright && npx playwright install chromium).");
  process.exit(2);
}

await ensureFonts({ force: args.includes("--fonts") });

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/** Encoded widths for a master: the standard steps it covers, plus its own width below 2560. */
const widthsFor = (w) => [...WIDTHS.filter((x) => x <= w), ...(w < 2560 && !WIDTHS.includes(w) ? [w] : [])];

const browser = await playwright.chromium.launch();
let failed = 0;
try {
  for (const src of dataSources) {
    const study = src.raw.caseStudy;
    const numbers = figureNumbers(study);
    const manifestFile = join(root, src.manifest);
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    const mediaDir = join(root, "public", src.media);
    const mastersDir = join(root, "artefacts/.masters", src.slug);
    mkdirSync(mediaDir, { recursive: true });
    mkdirSync(mastersDir, { recursive: true });
    console.log(`${src.slug}: ${Object.keys(study.images).length} images from ${src.artefacts}/`);

    for (const [id, spec] of Object.entries(study.images)) {
      if (only.length && !only.includes(id)) continue;
      const figId = figureOfImage(study.figures, id);
      const fig = study.figures[figId];
      const part = fig.kind === "compare" ? (fig.before === id ? L.before : L.after) : null;
      const label = stripLabel({ number: numbers.get(figId), part, figure: L.figure, hero: "Hero" });
      const shell = buildShell({ root, dir: src.artefacts, id, data: src.data, width: spec.width, height: spec.height, surface: fig.surface, label, strip: src.strip });

      // 1. Render.
      const context = await browser.newContext({
        viewport: { width: spec.width / 2, height: spec.height / 2 },
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
        locale: "de-CH",
        timezoneId: "Europe/Zurich",
      });
      await context.route(`${ORIGIN}/**`, (route) => {
        const path = decodeURIComponent(new URL(route.request().url()).pathname);
        if (path === "/blank") return route.fulfill({ contentType: "text/html", body: "<!doctype html>" });
        const file = path.startsWith("/terrain/")
          ? join(root, "public", path)
          : path.startsWith("/shared/")
            ? join(root, "artefacts", path)
            : join(root, src.artefacts, path);
        try {
          return route.fulfill({ contentType: types[extname(file)] ?? "application/octet-stream", body: readFileSync(file) });
        } catch {
          return route.fulfill({ status: 404, body: "" });
        }
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("requestfailed", (r) => errors.push(`failed: ${r.url()}`));
      page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()}: ${r.url()}`));
      await page.clock.setFixedTime(new Date("2026-03-14T09:00:00+01:00"));
      await page.goto(`${ORIGIN}/blank`);
      await page.setContent(shell, { waitUntil: "load" });
      const fonts = await page.evaluate(async () => {
        await Promise.all(['16px "Archivo"', '16px "Martian Mono"', '16px "Source Sans 3"'].map((f) => document.fonts.load(f)));
        await document.fonts.ready;
        return [...document.fonts].filter((f) => f.status === "error").map((f) => f.family);
      });
      if (fonts.length) errors.push(`fonts failed: ${fonts.join(", ")}`);
      const root$ = page.locator("#artefact");
      const master = join(mastersDir, `${id}.png`);
      await root$.screenshot({ path: master, animations: "disabled", scale: "device" });
      const info = await page.evaluate(() => {
        const box = document.getElementById("artefact").getBoundingClientRect();
        const hotspots = [...document.querySelectorAll("[data-hotspot]")].map((el) => {
          const r = el.getBoundingClientRect();
          return { n: Number(el.getAttribute("data-hotspot")), x: (r.left + r.width / 2 - box.left) / box.width, y: (r.top + r.height / 2 - box.top) / box.height };
        });
        // Anything past the artefact's edge would be cut off by the screenshot.
        const overflow = [...document.querySelectorAll("#artefact *")].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width && (r.right > box.right + 1 || r.bottom > box.bottom + 1 || r.left < box.left - 1 || r.top < box.top - 1);
        }).length;
        return { text: document.getElementById("artefact").innerText.replace(/\s+/g, " ").trim(), hotspots, overflow };
      });
      await context.close();
      if (info.overflow) errors.push(`${info.overflow} element(s) run past the image edge and would be cut off`);
      if (errors.length) {
        failed++;
        console.error(`  ✗ ${id}: ${[...new Set(errors)].join("; ")}`);
        continue;
      }
      const meta = await sharp(master).metadata();
      if (meta.width !== spec.width || meta.height !== spec.height) {
        failed++;
        console.error(`  ✗ ${id}: master is ${meta.width}×${meta.height}, expected ${spec.width}×${spec.height}`);
        continue;
      }

      // 2. Encode.
      for (const f of readdirSync(mediaDir)) if (f.startsWith(`${id}-`)) rmSync(join(mediaDir, f));
      const sources = [];
      for (const format of ["avif", "webp"]) {
        for (const width of widthsFor(spec.width)) {
          const resized = sharp(master).resize({ width, kernel: "lanczos3" });
          const buffer = await (format === "avif" ? resized.avif(AVIF) : resized.webp(WEBP)).toBuffer();
          const file = `${id}-${width}.${format}`;
          writeFileSync(join(mediaDir, file), buffer);
          sources.push({ format, width, src: `${src.media}${file}`, bytes: buffer.length });
        }
      }
      const tiny = await sharp(master).resize({ width: 24 }).blur(0.6).webp({ quality: 40 }).toBuffer();

      // 3. Manifest entry.
      manifest[id] = {
        width: spec.width,
        height: spec.height,
        placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
        alt: `images.${id}.alt`,
        caption: fig.caption ? `figures.${figId}.caption` : null,
        figure: numbers.get(figId) ?? null,
        sources,
        ...(info.hotspots.length ? { hotspots: info.hotspots.map((h) => ({ n: h.n, x: Math.round(h.x * 1e4) / 1e4, y: Math.round(h.y * 1e4) / 1e4 })) } : {}),
        hash: inputHash(root, shell),
        text: info.text,
      };
      const size = (format, width) => sources.find((s) => s.format === format && s.width === width)?.bytes ?? 0;
      const top = Math.max(...sources.map((s) => s.width));
      console.log(
        `  ✓ ${id.padEnd(22)} ${spec.width}×${spec.height}  AVIF 1280 ${kb(size("avif", 1280)).padStart(9)}  ${top} ${kb(size("avif", top)).padStart(9)}  WebP ${top} ${kb(size("webp", top)).padStart(9)}`,
      );
      if (id === study.hero || figId === study.hero) {
        const hero = size("avif", HERO_BUDGET.width);
        if (hero > HERO_BUDGET.bytes) {
          failed++;
          console.error(`  ✗ ${id}: ${HERO_BUDGET.width} px AVIF is ${kb(hero)}, over the ${kb(HERO_BUDGET.bytes)} budget`);
        }
      }
    }

    // Entries for images that no longer exist go.
    for (const id of Object.keys(manifest)) if (!study.images[id]) delete manifest[id];
    const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
    writeFileSync(manifestFile, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`  wrote ${relative(root, manifestFile)}`);
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
