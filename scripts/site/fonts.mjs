// Regenerates the self-hosted fonts of the under-construction page and the Basecamp gate:
// static WOFF2 instances of Archivo and Martian Mono, cut from the variable fonts at the
// token values and subset to Latin. The output is committed (src/hosting/fonts), so builds
// never download anything.
//
//   npm run fonts:subset
//
// Sources: google/fonts at a pinned commit (OFL), cached in scripts/site/.cache.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";
import { type } from "../../src/styles/tokens.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cacheDir = join(root, "scripts/site/.cache");
const outDir = join(root, "src/hosting/fonts");

const COMMIT = "e7db6ca603fd4862010383ff17ffd6cc4ffac1c0";
const raw = (path) => `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl/${path}`;
const sources = {
  archivo: { font: raw("archivo/Archivo%5Bwdth,wght%5D.ttf"), license: raw("archivo/OFL.txt") },
  martian: { font: raw("martianmono/MartianMono%5Bwdth,wght%5D.ttf"), license: raw("martianmono/OFL.txt") },
};

const range = (from, to) => String.fromCodePoint(...Array.from({ length: to - from + 1 }, (_, i) => from + i));
// Basic Latin, Latin-1 and Latin Extended-A (names), plus the typography the copy uses.
const LATIN =
  range(0x20, 0x7e) +
  range(0xa0, 0xff) +
  range(0x100, 0x17f) +
  "‐–—‘’‚“”„•…′″‹›€←↑→↓";

const instances = [
  { file: "archivo-display.woff2", source: "archivo", axes: { wdth: type.display.wdthMin, wght: type.display.wght } },
  { file: "archivo-text.woff2", source: "archivo", axes: { wdth: type.body.wdth, wght: type.body.wght } },
  { file: "martian-mono.woff2", source: "martian", axes: { wdth: type.hudLabel.wdth, wght: type.hudLabel.wght } },
];

async function cached(url) {
  const file = join(cacheDir, createHash("sha256").update(url).digest("hex").slice(0, 16));
  if (existsSync(file)) return readFileSync(file);
  console.log(`  downloading ${decodeURIComponent(url.split("/ofl/")[1])}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(file, bytes);
  return bytes;
}

mkdirSync(outDir, { recursive: true });
for (const [name, src] of Object.entries(sources)) {
  writeFileSync(join(outDir, `OFL-${name === "archivo" ? "Archivo" : "MartianMono"}.txt`), await cached(src.license));
}
for (const inst of instances) {
  const font = await subsetFont(await cached(sources[inst.source].font), LATIN, { targetFormat: "woff2", variationAxes: inst.axes });
  writeFileSync(join(outDir, inst.file), font);
  console.log(`  ${inst.file.padEnd(22)} ${JSON.stringify(inst.axes).padEnd(24)} ${(font.length / 1024).toFixed(1)} KB`);
}
