// Lists every content placeholder still in src/content: "[LIKE THIS]" text, links that are
// still null, and example values (invented figures, quotes and lines written as ex("…"),
// src/content/example-values.ts). Each is reported with its file, line and field.
//
//   npm run check:content                     list them all (exit 0)
//   npm run check:content -- --mode=construction
//                                             list only those the under-construction page uses
//   node scripts/check-content.mjs --build    run by `npm run build` for its SITE_MODE
//                                             (--mode=… or the SITE_MODE variable):
//     construction  fails while the under-construction page's own facts (name, email,
//                   LinkedIn) are placeholders; nothing else matters there
//     basecamp      warns only: the placeholders stay visible on the gated site
//     live          fails on any placeholder or example value
//                   (construction and live only warn in a local preview, NEXT_PUBLIC_PREVIEW=1)
//
// Flagged examples (`example: true`, src/content/examples) are fictional on purpose: their
// values are never placeholders, so they are skipped and named once. Live builds don't include
// them at all; their numbers are checked by npm run check:figures instead.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import "./lib/ts-hooks.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const contentDir = join(root, "src/content");

const MODES = ["construction", "basecamp", "live"];
const build = process.argv.includes("--build");
const mode = process.argv.find((a) => a.startsWith("--mode="))?.slice(7) ?? (build ? process.env.SITE_MODE || "live" : null);
if (mode !== null && !MODES.includes(mode)) {
  console.error(`Unknown mode "${mode}" (expected ${MODES.join(", ")}).`);
  process.exit(1);
}
// The under-construction page reads only this export of about.ts.
const scope = mode === "construction" ? { file: "about.ts", exports: ["holding"] } : null;

const PLACEHOLDER = /\[[A-Z0-9#][A-Z0-9#\s'’.,&/+-]*\]/g;
const files = readdirSync(contentDir).filter((f) => f.endsWith(".ts"));
const sources = files.map((f) => ({ file: relative(root, join(contentDir, f)).replaceAll("\\", "/"), lines: readFileSync(join(contentDir, f), "utf8").split("\n") }));

// Readable path segments: array items are named by their slug, label, title or term.
const segment = (value, index) => value?.slug ?? value?.label ?? value?.title ?? value?.term ?? value?.id ?? String(index);

const { isExample } = await import(pathToFileURL(join(contentDir, "example-values.ts")).href);

const found = [];
// Example values (ex("…")) by field: invented on purpose, to be replaced before launch.
const exampleFound = [];
const seen = new Set();
// Flagged examples by slug (a card has one; a case study is keyed by it), named by their card.
const examples = new Map();
function walk(value, path, parent, file) {
  if (value && typeof value === "object" && value.example === true) {
    const slug = value.slug ?? path[path.length - 1];
    examples.set(slug, value.name ?? examples.get(slug) ?? slug);
    return;
  }
  if (typeof value === "string") {
    const tokens = value.match(PLACEHOLDER);
    if (tokens) found.push({ path, value, tokens, file, hints: [path[path.length - 1], parent?.label, parent?.title, parent?.term] });
    if (isExample(value)) exampleFound.push({ path, value, file });
  } else if (value === null && path[path.length - 1] === "href") {
    found.push({ path, value: null, tokens: ["href: null"], file, hints: [parent?.label] });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, [...path, segment(v, i)], parent, file));
  } else if (value && typeof value === "object") {
    if (seen.has(value)) return;
    seen.add(value);
    for (const [k, v] of Object.entries(value)) walk(v, [...path, k], value, file);
  }
}

for (const f of files) {
  if (scope && f !== scope.file) continue;
  const mod = await import(pathToFileURL(join(contentDir, f)).href);
  const file = sources.find((s) => s.file.endsWith(`/${f}`)).file;
  for (const [name, value] of Object.entries(mod)) {
    if (typeof value !== "function" && (!scope || scope.exports.includes(name))) walk(value, [name], null, file);
  }
}

// Every placeholder as written in the source: one site per token per line.
const sites = [];
for (const src of sources) {
  src.lines.forEach((text, i) => {
    if (/^\s*(\/\/|\/?\*)/.test(text)) return; // comments describe placeholders, they aren't any
    for (const token of text.match(PLACEHOLDER) ?? []) sites.push({ file: src.file, line: i + 1, token, text, fields: [] });
    if (/\bhref: null\b/.test(text)) sites.push({ file: src.file, line: i + 1, token: "href: null", text, fields: [] });
  });
}

// Match fields to sites. A site scores for holding the exact literal, for the field's own
// module, and for the field name or a sibling label on the line (or, for objects written over
// several lines, nearby). Best matches are taken first; a field whose sites are all taken is a
// derived copy (e.g. the About header reusing the leader card's name) and joins its best site.
const has = (text, hint) => text.includes(`${hint}:`) || text.includes(JSON.stringify(hint));
const nearby = (site, hint) => {
  const lines = sources.find((s) => s.file === site.file).lines;
  return lines.slice(Math.max(0, site.line - 6), site.line + 5).some((t) => has(t, hint));
};
const pairs = [];
for (const item of found) {
  const hints = item.hints.filter(Boolean);
  for (const site of sites) {
    if (!item.tokens.includes(site.token)) continue;
    let score = 0;
    if (item.value !== null && site.text.includes(JSON.stringify(item.value))) score += 4;
    if (site.file === item.file) score += 3;
    for (const h of hints) score += has(site.text, h) ? 2 : nearby(site, h) ? 1 : 0;
    pairs.push({ item, site, score });
  }
}
pairs.sort((a, b) => b.score - a.score);
const placed = new Map();
for (const { item, site } of pairs) {
  const key = `${item.path.join(" › ")}|${site.token}`;
  if (placed.has(key) || site.fields.length) continue;
  placed.set(key, site);
  site.fields.push(item.path.join(" › "));
}
for (const { item, site } of pairs) {
  const key = `${item.path.join(" › ")}|${site.token}`;
  if (placed.has(key)) continue;
  placed.set(key, site);
  site.fields.push(item.path.join(" › "));
}
// Example values as written: every ex("…") literal, at the line its string starts on. A field
// joins the site with its exact text, in its own module if the text is written twice.
const unquote = (q, body) => (q === "`" ? body : JSON.parse(`"${body.replace(/\\'/g, "'").replace(/"/g, '\\"').replace(/\\\\"/g, '\\"')}"`));
const exampleSites = [];
for (const src of sources) {
  const text = src.lines.join("\n");
  for (const m of text.matchAll(/\bex\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1\s*,?\s*\)/g)) {
    const at = m.index + m[0].indexOf(m[1]);
    const line = text.slice(0, at).split("\n").length;
    let value;
    try {
      value = unquote(m[1], m[2]);
    } catch {
      value = m[2];
    }
    exampleSites.push({ file: src.file, line, value, fields: [] });
  }
}
for (const item of exampleFound) {
  const candidates = exampleSites.filter((s) => s.value === item.value);
  // The same text written twice: each field takes the next site in its module that has none yet.
  const site = candidates.find((s) => s.file === item.file && !s.fields.length) ?? candidates.find((s) => s.file === item.file) ?? candidates[0];
  if (site) site.fields.push(item.path.join(" › "));
}
const exampleList = exampleSites
  .filter((site) => site.fields.length)
  .map((site) => ({ where: `${site.file}:${site.line}`, value: site.value, fields: site.fields }))
  .sort((a, b) => a.where.localeCompare(b.where, "en", { numeric: true }));

const fieldOf = (site) => site.text.match(/(\w+):\s*(?:["'`]|null)/)?.[1] ?? "(value)";
const list = sites
  // In a scoped check only the sites behind the scoped fields count.
  .filter((site) => !scope || site.fields.length)
  .map((site) => ({ where: `${site.file}:${site.line}`, value: site.token === "href: null" ? null : site.token, fields: site.fields.length ? site.fields : [fieldOf(site)] }))
  .sort((a, b) => a.where.localeCompare(b.where, "en", { numeric: true }));

const preview = process.env.NEXT_PUBLIC_PREVIEW === "1";
const what = scope ? "the under-construction page" : "the site";
if (examples.size && !scope) {
  const where = mode === "live" ? "not part of live builds" : "never part of a live build";
  console.log(`Content: skipped ${[...examples.values()].join(", ")} (fictional example, ${where}).`);
}
const total = list.length + exampleList.length;
if (!total) {
  console.log(`Content: no placeholders or example values left${scope ? ` on ${what}` : ""}.`);
  process.exit(0);
}
const counts = [list.length && `${list.length} placeholder(s)`, exampleList.length && `${exampleList.length} example value(s)`].filter(Boolean).join(" and ");
if (build && (mode === "basecamp" || preview)) {
  console.warn(`Content: ${counts} remain (shown in this ${mode === "basecamp" ? "gated preview" : "preview"} build). npm run check:content lists them.`);
  process.exit(0);
}
const short = (v, n = 34) => (v.length > n ? `${v.slice(0, n - 1)}…` : v);
const width = Math.max(...[...list, ...exampleList].map((r) => r.where.length));
if (list.length) {
  console.log(`Content placeholders${scope ? ` on ${what}` : ""} (${list.length}):`);
  for (const r of list) {
    console.log(`  ${r.where.padEnd(width)}  ${(r.value ?? "(no URL yet)").padEnd(34)}  ${r.fields.join(", ")}`);
  }
}
if (exampleList.length) {
  console.log(`${list.length ? "\n" : ""}Example values${scope ? ` on ${what}` : ""} (${exampleList.length}), invented to show the storytelling; replace each with a real one:`);
  for (const r of exampleList) {
    console.log(`  ${r.where.padEnd(width)}  ${short(r.value).padEnd(34)}  ${r.fields.join(", ")}`);
  }
}
if (build) {
  console.error(`\n${mode[0].toUpperCase()}${mode.slice(1)} build stopped: replace the ${counts} above, or build a preview with NEXT_PUBLIC_PREVIEW=1.`);
  process.exit(1);
}
