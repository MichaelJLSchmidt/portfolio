// Numbers and figures of the case studies. Fails (exit 1) when:
//
// For case studies whose numbers come from a data file (src/content/examples/sources.ts):
//   - copy, the card or an artefact source spells out a digit instead of a {{token}} into the
//     data file (codes and standards such as WCAG 2.1 are allowed, artefacts can mark other
//     literals as {{"…"}});
//   - a token names a value the data file doesn't have;
//   - the data file contradicts itself (its `consistency` list);
//   - a key figure is missing from the copy, the card or a chart it must appear in, i.e. any of
//     them shows another value than the data file;
//   - a committed image is older than its data or source (the hash of its inputs differs: run
//     npm run images), or an encoded file is missing, or the hero is over budget.
// For every case study:
//   - a figure block names an unknown figure, an image has no alt text, a caption runs past
//     about 30 words, or a page has more than one key insight or pull quote.
//
//   npm run check:figures       (npm run build runs it whenever the build includes examples)
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "./lib/ts-hooks.mjs";
import { buildShell, inputHash, sourceFile, stripLabel } from "./images/shell.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { dataSources } = await import("../src/content/examples/sources.ts");
const { caseStudies } = await import("../src/content/case-studies.ts");
const { caseStudyLabels: L } = await import("../src/content/cards.ts");
const { figureNumbers, figureOfImage } = await import("../src/lib/case-study.ts");
const { TOKEN, fillDeep, lookup } = await import("../src/lib/fill.ts");

const MAX_CAPTION_WORDS = 30;
const HERO_BUDGET = { width: 1920, bytes: 180 * 1024 };
// Digits that are names, not figures: standards, a facilitation format, a typeface, participant
// codes (H1–H6 homeowners, I1–I5 installers, C1–C3 caseworkers).
const ALLOWED = [/WCAG 2\.1/g, /eCH-0059/g, /1-2-4-All/g, /Source Sans 3/g, /\b[HIC][1-9]\b/g];
const LITERAL = /\{\{"[^"]*"\}\}/g;

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const strip = (text) => ALLOWED.reduce((t, re) => t.replace(re, ""), text.replace(LITERAL, "").replace(TOKEN, ""));

/** Every string in a value, with its path. */
function* strings(value, path = []) {
  if (typeof value === "string") yield [path.join("."), value];
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* strings(v, [...path, i]);
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) yield* strings(v, [...path, k]);
}

// ------------------------------------------------------------------ data-driven case studies
for (const src of dataSources) {
  const { data } = src;
  const study = src.raw.caseStudy;
  const manifest = JSON.parse(readFileSync(join(root, src.manifest), "utf8"));

  // Copy and card: no digits of their own, every token known.
  for (const [name, value] of [["case study", study], ["card", src.raw.card]]) {
    for (const [path, text] of strings(value)) {
      // Identifiers, not figures.
      if (/(^|\.)(slug|terrainId|id|collector\.number)$/.test(path) || /^(figures|images)\.[^.]+\.(image|before|after)$/.test(path)) continue;
      for (const m of text.matchAll(TOKEN)) {
        try {
          lookup(data, m[1]);
        } catch (e) {
          fail(`${src.slug} ${name} ${path}`, e.message);
        }
      }
      const rest = strip(text);
      if (/\d/.test(rest)) fail(`${src.slug} ${name} ${path}`, `writes a number itself ("${rest.match(/[^\s]*\d[^\s]*/)[0]}"); use a {{token}} into the data file`);
    }
  }

  // The data file agrees with itself.
  for (const [label, ok] of src.consistency) if (!ok) fail(`${src.slug} data`, `inconsistent: ${label}`);

  // Artefact sources: no digits outside tokens in their text.
  const numbers = figureNumbers(study);
  for (const [id, spec] of Object.entries(study.images)) {
    let file;
    try {
      file = sourceFile(root, src.artefacts, id);
    } catch (e) {
      fail(`${src.slug} ${id}`, e.message);
      continue;
    }
    const text = readFileSync(file, "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(style|script)\b[\s\S]*?<\/\1>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/g, " ");
    for (const m of text.matchAll(TOKEN)) {
      try {
        lookup(data, m[1]);
      } catch (e) {
        fail(`${src.slug} ${id}`, e.message);
      }
    }
    const rest = strip(text);
    if (/\d/.test(rest)) fail(`${src.slug} ${id}`, `artefact text writes a number itself ("${rest.match(/[^\s]*\d[^\s]*/)[0]}"); use a {{token}} or mark a literal {{"…"}}`);

    // The committed image matches its current inputs.
    const entry = manifest[id];
    if (!entry) {
      fail(`${src.slug} ${id}`, "not in the manifest: run npm run images");
      continue;
    }
    const figId = figureOfImage(study.figures, id);
    const fig = study.figures[figId];
    const part = fig.kind === "compare" ? (fig.before === id ? L.before : L.after) : null;
    const label = stripLabel({ number: numbers.get(figId), part, figure: L.figure, hero: "Hero" });
    const shell = buildShell({ root, dir: src.artefacts, id, data, width: spec.width, height: spec.height, surface: fig.surface, label, strip: src.strip });
    if (entry.hash !== inputHash(root, shell)) fail(`${src.slug} ${id}`, `image is older than its data or source: run npm run images -- ${id}`);
    if (entry.width !== spec.width || entry.height !== spec.height) fail(`${src.slug} ${id}`, `manifest size ${entry.width}×${entry.height}, figures.ts says ${spec.width}×${spec.height}`);
    for (const s of entry.sources) {
      const path = join(root, "public", s.src);
      if (!existsSync(path)) fail(`${src.slug} ${id}`, `missing ${s.src}`);
      else if (statSync(path).size !== s.bytes) fail(`${src.slug} ${id}`, `${s.src} differs from the manifest`);
    }
    if (figId === study.hero) {
      const hero = entry.sources.find((s) => s.format === "avif" && s.width === HERO_BUDGET.width);
      if (!hero || hero.bytes > HERO_BUDGET.bytes) fail(`${src.slug} ${id}`, `hero AVIF at ${HERO_BUDGET.width} px is ${hero ? `${(hero.bytes / 1024).toFixed(1)} KB` : "missing"} (budget 180 KB)`);
    }
  }

  // Key figures: the same value in copy, card and charts.
  const filled = fillDeep(study, data);
  const surfaces = { copy: JSON.stringify(filled), card: JSON.stringify(fillDeep(src.raw.card, data)) };
  for (const kf of src.keyFigures) {
    for (const where of kf.in) {
      const haystack = surfaces[where] ?? manifest[where]?.text;
      if (haystack === undefined) fail(`${src.slug} key figure "${kf.label}"`, `unknown surface "${where}"`);
      else if (!haystack.includes(kf.text)) fail(`${src.slug} key figure "${kf.label}"`, `"${kf.text}" not found in ${where}${manifest[where] ? " (re-render it: npm run images)" : ""}`);
    }
  }
  console.log(`Figures: ${src.slug}: ${Object.keys(study.images).length} images, ${src.keyFigures.length} key figures checked against the data file.`);
}

// ------------------------------------------------------------------------- every case study
for (const [slug, study] of Object.entries(caseStudies)) {
  const figures = study.figures ?? {};
  let insights = 0;
  let quotes = 0;
  for (const w of study.waypoints) {
    for (const b of w.blocks) {
      if (b.kind === "insight") insights++;
      if (b.kind === "quote") quotes++;
      if (b.kind === "figure" && !figures[b.id]) fail(`${slug} ${w.id}`, `figure "${b.id}" is not defined`);
    }
  }
  if (insights > 1) fail(slug, `${insights} key insights (at most one per page)`);
  if (quotes > 1) fail(slug, `${quotes} pull quotes (at most one per page)`);
  if (study.hero && !figures[study.hero]) fail(slug, `hero figure "${study.hero}" is not defined`);
  for (const [id, f] of Object.entries(figures)) {
    const words = f.caption?.split(/\s+/).filter(Boolean).length ?? 0;
    if (words > MAX_CAPTION_WORDS) fail(`${slug} ${id}`, `caption has ${words} words (about ${MAX_CAPTION_WORDS} at most)`);
    for (const image of f.kind === "compare" ? [f.before, f.after] : [f.image]) {
      if (!study.images?.[image]?.alt?.trim()) fail(`${slug} ${id}`, `image "${image}" has no alt text`);
    }
  }
}

if (errors.length) {
  console.error(`\nFigures: ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log("Figures: copy, card, charts and images agree with their data.");
