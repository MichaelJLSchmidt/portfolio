// Reports what a visit actually downloads from the static export in ./out:
// initial JS per route (modern browsers; nomodule polyfills excluded), CSS, preloaded
// fonts, lazy chunks and terrain assets. Sizes are gzip -9, like a typical static host.
//   npm run report:size
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const out = "out";
if (!existsSync(out)) {
  console.error("No ./out folder. Run `npm run build` first.");
  process.exit(1);
}

const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const toFile = (url) => join(out, decodeURIComponent(url.slice(base.length).split("?")[0]));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// The under-construction page (SITE_MODE=construction): one HTML file with inline CSS and
// script, three fonts and one of two posters, picked by a media query.
if (!existsSync(join(out, "_next")) && existsSync(join(out, "index.html"))) {
  const html = readFileSync(join(out, "index.html"), "utf8");
  const urls = (re) => [...new Set([...html.matchAll(re)].map((m) => m[1]))];
  const fonts = urls(/url\(([^)]+\.woff2)\)/g);
  const [coarse, fine] = urls(/--poster:url\(([^)]+)\)/g);
  const size = (url) => (url.endsWith(".woff2") ? statSync(toFile(url)).size : gz(toFile(url)));
  const htmlGz = gz(join(out, "index.html"));
  const fontBytes = fonts.reduce((s, u) => s + size(u), 0);
  console.log("Under-construction page (gzip; WOFF2 as is):");
  console.log(`  ${"HTML with inline CSS and script".padEnd(42)}  ${kb(htmlGz)}`);
  for (const u of fonts) console.log(`  ${u.padEnd(42)}  ${kb(size(u))}`);
  for (const u of [coarse, fine]) console.log(`  ${u.padEnd(42)}  ${kb(size(u))}`);
  console.log(`  ${"Phone visit (200 m poster)".padEnd(42)}  ${kb(htmlGz + fontBytes + size(coarse))}`);
  console.log(`  ${"Large-screen visit (100 m poster)".padEnd(42)}  ${kb(htmlGz + fontBytes + size(fine))}`);
  process.exit(0);
}

const files = walk(out);
const pages = files.filter((f) => f.endsWith("index.html") || f === join(out, "404.html"));
const referenced = new Set();

console.log(`Static export: ${files.length} files, ${kb(files.reduce((s, f) => s + statSync(f).size, 0))} on disk\n`);
console.log("Initial route cost (gzip):");
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
    .filter((m) => !/\bnoModule\b|\bnomodule\b/.test(m[0]))
    .map((m) => m[1]);
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const fonts = [...html.matchAll(/<link\b[^>]*rel="preload"[^>]*href="([^"]+\.woff2)"/g)].map((m) => m[1]);
  const sum = (urls) =>
    [...new Set(urls)].reduce((s, u) => {
      const f = toFile(u);
      referenced.add(f);
      return existsSync(f) ? s + gz(f) : s;
    }, 0);
  const fontBytes = [...new Set(fonts)].reduce((s, u) => s + (existsSync(toFile(u)) ? statSync(toFile(u)).size : 0), 0);
  const route = `/${relative(out, page).replace(/\\/g, "/").replace(/index\.html$/, "")}`;
  console.log(
    `  ${route.padEnd(18)} HTML ${kb(gzipSync(html).length).padStart(9)}   JS ${kb(sum(scripts)).padStart(9)}   CSS ${kb(sum(styles)).padStart(8)}   fonts ${kb(fontBytes).padStart(8)}`,
  );
}

const lazy = files
  .filter((f) => f.endsWith(".js") && f.includes(`${join("_next", "static")}`) && !referenced.has(f))
  .map((f) => ({ f, size: gz(f) }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 5);
console.log("\nLargest lazy chunks (loaded on demand):");
for (const { f, size } of lazy) {
  const src = readFileSync(f, "utf8");
  const hint = /WebGLRenderer|ShaderMaterial/.test(src) ? "three / R3F" : /lenis/i.test(src) ? "lenis" : "";
  console.log(`  ${kb(size).padStart(9)}  ${relative(out, f)} ${hint}`);
}

const terrain = files.filter((f) => f.includes(join(out, "terrain")));
console.log("\nTerrain assets:");
for (const f of terrain) {
  console.log(`  ${kb(statSync(f).size).padStart(9)} raw  ${kb(gz(f)).padStart(9)} gz  ${relative(out, f)}`);
}
