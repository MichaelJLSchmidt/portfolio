// Self-hosted fonts for the artefact sources (artefacts/shared/fonts): the variable fonts subset
// to Latin, axes kept. Archivo and Martian Mono are the portfolio's own labels and diagrams;
// Source Sans 3 is the fictional product's UI, so product and portfolio chrome look different.
// The output is committed, so rendering never downloads anything.
//
//   npm run images -- --fonts      (regenerates them before rendering)
//
// Sources: google/fonts at the same pinned commit as scripts/site/fonts.mjs (OFL), cached in
// scripts/site/.cache.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cacheDir = join(root, "scripts/site/.cache");
export const fontsDir = join(root, "artefacts/shared/fonts");

const COMMIT = "e7db6ca603fd4862010383ff17ffd6cc4ffac1c0";
const raw = (path) => `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl/${path}`;
const fonts = [
  { file: "archivo.woff2", font: raw("archivo/Archivo%5Bwdth,wght%5D.ttf"), license: raw("archivo/OFL.txt"), licenseFile: "OFL-Archivo.txt" },
  {
    file: "martian-mono.woff2",
    font: raw("martianmono/MartianMono%5Bwdth,wght%5D.ttf"),
    license: raw("martianmono/OFL.txt"),
    licenseFile: "OFL-MartianMono.txt",
  },
  {
    file: "source-sans-3.woff2",
    font: raw("sourcesans3/SourceSans3%5Bwght%5D.ttf"),
    license: raw("sourcesans3/OFL.txt"),
    licenseFile: "OFL-SourceSans3.txt",
  },
];

const range = (from, to) => String.fromCodePoint(...Array.from({ length: to - from + 1 }, (_, i) => from + i));
// Basic Latin, Latin-1 and Latin Extended-A (German and French), plus the typography in use.
const LATIN = range(0x20, 0x7e) + range(0xa0, 0xff) + range(0x100, 0x17f) + "‐–—‘’‚“”„•…′″‹›€←↑→↓−×≈≤≥✓";

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

/** Writes the fonts if they are missing (or always, with `force`). */
export async function ensureFonts({ force = false } = {}) {
  if (!force && fonts.every((f) => existsSync(join(fontsDir, f.file)))) return;
  mkdirSync(fontsDir, { recursive: true });
  for (const f of fonts) {
    writeFileSync(join(fontsDir, f.licenseFile), await cached(f.license));
    const woff2 = await subsetFont(await cached(f.font), LATIN, { targetFormat: "woff2" });
    writeFileSync(join(fontsDir, f.file), woff2);
    console.log(`  artefacts/shared/fonts/${f.file.padEnd(20)} ${(woff2.length / 1024).toFixed(1)} KB`);
  }
}
