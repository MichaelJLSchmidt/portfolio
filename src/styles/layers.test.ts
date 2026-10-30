import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/**
 * Cascade layers (globals.css): every stylesheet starts with the same order statement, and every
 * rule sits in a layer, so the order stylesheets load in never decides which style wins. Only
 * @property and @font-face stay at the top level (they take part in no cascade between layers).
 */
const ORDER = "@layer reset, tokens, base, layout, components, utilities;";
const root = join(import.meta.dirname, "../..");

function sheets(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? sheets(p) : p.endsWith(".css") ? [p] : [];
  });
}

/** Top-level statements of a stylesheet, comments removed. */
function statements(css: string): string[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      out.push(src.slice(start, i + 1).trim());
      start = i + 1;
    } else if (c === ";" && depth === 0) {
      out.push(src.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  return out.filter(Boolean);
}

for (const file of sheets(join(root, "src"))) {
  const name = relative(root, file);
  test(`${name}: layered`, () => {
    const css = readFileSync(file, "utf8");
    assert.ok(css.startsWith(ORDER), `${name} must start with "${ORDER}"`);
    const loose = statements(css).filter((s) => !/^@layer\b/.test(s) && !/^@(property|font-face)\b/.test(s));
    assert.deepEqual(loose.map((s) => s.slice(0, 60)), [], `${name} has rules outside a layer`);
  });
}
