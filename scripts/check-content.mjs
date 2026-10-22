// Lists every content placeholder still in src/content: "[LIKE THIS]" text and links that are
// still null. Each is reported with its file, line and field.
//
//   npm run check:content            list them (exit 0)
//   node scripts/check-content.mjs --build
//                                    run before `npm run build` (prebuild): fails a production
//                                    build while any remain; preview builds
//                                    (NEXT_PUBLIC_PREVIEW=1) only warn, so the placeholders
//                                    stay visible there.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { registerHooks } from "node:module";
import { join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const contentDir = join(root, "src/content");

// Content modules are TypeScript with the app's import style ("@/…", extensionless relative
// paths). Node strips the types; this hook only resolves those two specifier forms.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const withTs = (path) => [path, `${path}.ts`, join(path, "index.ts")].find((p) => existsSync(p) && !p.endsWith("/"));
    if (specifier.startsWith("@/")) {
      const file = withTs(join(root, "src", specifier.slice(2)));
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)) {
      const file = withTs(fileURLToPath(new URL(specifier, context.parentURL)));
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const PLACEHOLDER = /\[[A-Z0-9#][A-Z0-9#\s'’.,&/+-]*\]/g;
const files = readdirSync(contentDir).filter((f) => f.endsWith(".ts"));
const sources = files.map((f) => ({ file: relative(root, join(contentDir, f)).replaceAll("\\", "/"), lines: readFileSync(join(contentDir, f), "utf8").split("\n") }));

// Readable path segments: array items are named by their slug, label, title or term.
const segment = (value, index) => value?.slug ?? value?.label ?? value?.title ?? value?.term ?? value?.id ?? String(index);

const found = [];
const seen = new Set();
function walk(value, path, parent, file) {
  if (typeof value === "string") {
    const tokens = value.match(PLACEHOLDER);
    if (tokens) found.push({ path, value, tokens, file, hints: [path[path.length - 1], parent?.label, parent?.title, parent?.term] });
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
  const mod = await import(pathToFileURL(join(contentDir, f)).href);
  const file = sources.find((s) => s.file.endsWith(`/${f}`)).file;
  for (const [name, value] of Object.entries(mod)) if (typeof value !== "function") walk(value, [name], null, file);
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
const fieldOf = (site) => site.text.match(/(\w+):\s*(?:["'`]|null)/)?.[1] ?? "(value)";
const list = sites
  .map((site) => ({ where: `${site.file}:${site.line}`, value: site.token === "href: null" ? null : site.token, fields: site.fields.length ? site.fields : [fieldOf(site)] }))
  .sort((a, b) => a.where.localeCompare(b.where, "en", { numeric: true }));

const build = process.argv.includes("--build");
const preview = process.env.NEXT_PUBLIC_PREVIEW === "1";
if (!list.length) {
  console.log("Content: no placeholders left.");
  process.exit(0);
}
if (build && preview) {
  console.warn(`Content: ${list.length} placeholder(s) remain (shown in this preview build). npm run check:content lists them.`);
  process.exit(0);
}
console.log(`Content placeholders (${list.length}):`);
const width = Math.max(...list.map((r) => r.where.length));
for (const r of list) {
  console.log(`  ${r.where.padEnd(width)}  ${(r.value ?? "(no URL yet)").padEnd(34)}  ${r.fields.join(", ")}`);
}
if (build) {
  console.error(`\nProduction build stopped: replace the ${list.length} placeholder(s) above, or build a preview with NEXT_PUBLIC_PREVIEW=1.`);
  process.exit(1);
}
