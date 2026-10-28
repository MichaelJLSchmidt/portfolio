// The page an artefact is rendered in: the site's token CSS, the shared artefact stylesheet,
// the case study's data (window.DATA) and the artefact source with its {{tokens}} resolved, plus
// the footer strip every image carries. npm run images renders it; npm run check:figures builds
// the same page without a browser and compares its hash with the one stored in the manifest,
// so committed images can never fall behind their data or sources.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fill } from "../../src/lib/fill.ts";
import { tokensToCss } from "../../src/styles/tokens.ts";

/** {{"3.01"}}: literal text that is not a figure (a field code, a version), exempt from the digit check. */
export const LITERAL = /\{\{"([^"]*)"\}\}/g;

export function sourceFile(root, dir, id) {
  for (const ext of ["html", "svg"]) {
    const file = join(root, dir, `${id}.${ext}`);
    if (existsSync(file)) return file;
  }
  throw new Error(`No artefact source for "${id}" in ${dir} (${id}.html or ${id}.svg).`);
}

export const resolveSource = (text, data) => fill(text.replace(LITERAL, (_, s) => s), data);

/** A seeded Math.random (mulberry32), so any layout that uses randomness renders the same way. */
const seeded = (seed) =>
  `(function(){var s=${seed};Math.random=function(){s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();`;

/**
 * @param {{ root: string, dir: string, id: string, data: object, width: number, height: number,
 *   surface: string, label: string, strip: { name: string, note: string } }} o
 *   width/height: the master size in pixels; the page is laid out at half that (rendered at 2x).
 */
export function buildShell(o) {
  const source = readFileSync(sourceFile(o.root, o.dir, o.id), "utf8");
  const body = resolveSource(source, o.data);
  const seed = parseInt(createHash("sha256").update(o.id).digest("hex").slice(0, 8), 16);
  const w = o.width / 2;
  const h = o.height / 2;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${o.id}</title>
<style>${tokensToCss({ motion: false })}</style>
<link rel="stylesheet" href="/shared/artefact.css">
<style>html,body{margin:0;background:transparent}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}</style>
<script>${seeded(seed)}window.DATA=${JSON.stringify(o.data)};</script>
</head>
<body>
<div id="artefact" class="artefact" data-surface="${o.surface}" style="--w:${w}px;--h:${h}px;width:${w}px;height:${h}px">
<div class="artefact-body">
${body}
</div>
<footer class="strip"><span>${o.strip.name}</span><span class="strip-dot">·</span><span class="strip-note">${o.strip.note}</span><span class="strip-dot">·</span><span>${o.label}</span></footer>
</div>
</body>
</html>
`;
}

/** What an image depends on: its page, the shared stylesheet and scripts, and the fonts. */
export function inputHash(root, shell) {
  const hash = createHash("sha256").update(shell);
  const shared = join(root, "artefacts/shared");
  for (const f of readdirSync(shared).filter((f) => /\.(css|js)$/.test(f)).sort()) hash.update(readFileSync(join(shared, f)));
  const fonts = join(root, "artefacts/shared/fonts");
  for (const f of readdirSync(fonts).filter((f) => f.endsWith(".woff2")).sort()) hash.update(readFileSync(join(fonts, f)));
  return hash.digest("hex").slice(0, 16);
}

/** The strip's last part: "Fig. 3", "Fig. 9 · Before", or the hero's name. */
export function stripLabel({ number, part, figure, hero }) {
  if (!number) return hero;
  return part ? `${figure(number)} · ${part}` : figure(number);
}
