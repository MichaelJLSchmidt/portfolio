// Unit tests for the design tokens: `npm test` (node:test, Node strips the types). The CSS the root
// layout inlines must carry exactly the values of src/styles/tokens.ts, and every token a
// stylesheet reads must exist.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  breakpoint,
  color,
  cubicBezier,
  distance,
  duration,
  easing,
  layer,
  radius,
  scale,
  space,
  stagger,
  stroke,
  titleArrival,
  tokensToCss,
  type,
} from "./tokens.ts";

const kebab = (s: string) => s.replace(/[A-Z]|\d+/g, (m) => `-${m.toLowerCase()}`);

/** `:root{--a:1;--b:2}` → Map { "--a" => "1", "--b" => "2" } (values may contain ";" only inside parentheses). */
function parse(css: string): Map<string, string> {
  const vars = new Map<string, string>();
  for (const block of css.matchAll(/:root\{(.*?)\}(?=:root|$)/g)) {
    let depth = 0;
    let start = 0;
    const body = block[1];
    const decls: string[] = [];
    for (let i = 0; i <= body.length; i++) {
      const ch = body[i];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if ((ch === ";" && depth === 0) || i === body.length) {
        decls.push(body.slice(start, i));
        start = i + 1;
      }
    }
    for (const d of decls.filter(Boolean)) {
      const at = d.indexOf(":");
      vars.set(d.slice(0, at), d.slice(at + 1));
    }
  }
  return vars;
}

const css = parse(tokensToCss());

const stylesheets = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? stylesheets(p) : p.endsWith(".css") ? [p] : [];
  });
const root = new URL("..", import.meta.url).pathname;

describe("tokens → CSS", () => {
  it("colours", () => {
    for (const [k, v] of Object.entries(color)) assert.equal(css.get(`--color-${kebab(k)}`), v, k);
  });

  it("the Calm Survey palette", () => {
    assert.equal(color.ground, "#1B1C18");
    assert.equal(color.groundRaised, "#22231F");
    assert.equal(color.sheet, "#DDE3E3");
    assert.equal(color.text, "#E8EBE4");
    assert.equal(color.text3, "#868980");
    assert.equal(color.glacier, "#C8F5B0");
  });

  it("durations, in ms, within the motion rules", () => {
    for (const [k, v] of Object.entries(duration)) assert.equal(css.get(`--dur-${kebab(k)}`), `${v}ms`, k);
    assert.deepEqual(
      [duration.press, duration.fast, duration.base, duration.enter, duration.morph, duration.title, duration.terrain],
      [120, 200, 320, 480, 680, 900, 1600],
    );
    // UI feedback ≤ 320 ms, entrances ≤ 600 ms, Off's crossfades ≤ 160 ms.
    assert.ok(duration.base <= 320 && duration.enter <= 600 && duration.still <= 160);
  });

  it("easings, as cubic-bezier(), none bouncing", () => {
    for (const k of Object.keys(easing) as (keyof typeof easing)[]) {
      assert.equal(css.get(`--ease-${kebab(k)}`), cubicBezier(k), k);
      const [, y1, , y2] = easing[k];
      assert.ok(y1 >= 0 && y1 <= 1 && y2 >= 0 && y2 <= 1, `${k} overshoots`);
    }
    assert.deepEqual(easing.out, [0.22, 1, 0.36, 1]);
    assert.deepEqual(easing.inOut, [0.65, 0, 0.35, 1]);
  });

  it("type roles", () => {
    for (const [k, t] of Object.entries(type)) {
      assert.equal(css.get(`--type-${k}-size`), t.size, k);
      assert.equal(css.get(`--type-${k}-wght`), String(t.wght), k);
      assert.equal(css.get(`--type-${k}-lh`), String(t.lineHeight), k);
    }
    assert.equal(type.display.size, "clamp(3rem, 1.2rem + 8.5vw, 10.5rem)");
    assert.equal(css.get("--type-display-tracking"), "-0.035em");
    assert.equal(css.get("--title-from-wght"), String(titleArrival.fromWght));
    assert.equal(titleArrival.fromWght, 200);
  });

  it("layout, staggers, distances, scale, radii, strokes, layers", () => {
    assert.equal(css.get("--space-section"), space.section);
    assert.equal(css.get("--stagger-step"), `${stagger.step}ms`);
    assert.ok(stagger.step <= 60 && stagger.max <= 4);
    for (const [k, v] of Object.entries(distance)) assert.equal(css.get(`--dist-${kebab(k)}`), `${v}px`, k);
    assert.ok(distance.rise <= 16 && distance.arrive <= 16);
    assert.equal(css.get("--scale-press"), String(scale.press));
    for (const [k, v] of Object.entries(radius)) assert.equal(css.get(`--radius-${kebab(k)}`), `${v}px`, k);
    for (const [k, v] of Object.entries(stroke)) assert.equal(css.get(`--stroke-${kebab(k)}`), `${v}px`, k);
    for (const [k, v] of Object.entries(layer)) assert.equal(css.get(`--layer-${kebab(k)}`), String(v), k);
  });

  it("the palette-only CSS leaves motion out", () => {
    const base = parse(tokensToCss({ motion: false }));
    assert.equal(base.get("--color-glacier"), color.glacier);
    assert.ok(![...base.keys()].some((k) => /^--(dur|ease|stagger|dist|layer|scale|space|radius|stroke)-/.test(k)));
  });
});

// Every token a stylesheet reads exists in the generated CSS (a renamed or removed token fails
// here, not silently in the browser).
describe("stylesheets read existing tokens", () => {
  it("var(--color|dur|ease|stagger|dist|layer|scale|type|title|space|radius|stroke-…)", () => {
    const missing: string[] = [];
    const globals = new Set([...readFileSync(join(root, "app/globals.css"), "utf8").matchAll(/(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    for (const file of stylesheets(root)) {
      const text = readFileSync(file, "utf8");
      const local = new Set([
        ...[...text.matchAll(/@property\s+(--[a-z0-9-]+)/g)].map((m) => m[1]),
        ...[...text.matchAll(/(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
        ...[...text.matchAll(/var\((--[a-z0-9-]+),/g)].map((m) => m[1]),
      ]);
      for (const m of text.matchAll(/var\((--(?:dur|ease|stagger|dist|layer|scale|color|type|title|space|radius|stroke)-[a-z0-9-]+)/g)) {
        if (!css.has(m[1]) && !local.has(m[1]) && !globals.has(m[1])) missing.push(`${file.slice(root.length)}: ${m[1]}`);
      }
    }
    assert.deepEqual(missing, []);
  });
});

// Motion values come from the tokens: a stylesheet that writes its own duration, easing curve or
// font-stretch fails here.
describe("no hard-coded motion values in stylesheets", () => {
  it("durations, cubic-bezier() and font-stretch come from tokens", () => {
    const over: string[] = [];
    for (const file of stylesheets(root)) {
      const rel = file.slice(root.length);
      const found = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => {
          const time = /^\s*(transition|animation)[a-z-]*:/.test(line) && /[\s(*+,-](?!0m?s\b)\d*\.?\d+m?s\b/.test(line);
          return time || /cubic-bezier\(/.test(line) || /font-stretch:\s*\d/.test(line.replace("font-stretch: 100%", ""));
        });
      if (found.length) over.push(`${rel}: ${found.map((l) => l.trim()).join(" | ")}`);
    }
    assert.deepEqual(over, []);
  });
});

// The two breakpoints, and every width media query in a stylesheet is one of them:
// `(min-width: Npx)` from a breakpoint up, `(width < Npx)` below it.
describe("breakpoints", () => {
  it("768 and 1280", () => {
    assert.deepEqual(Object.values(breakpoint), [768, 1280]);
  });
  it("width queries use a breakpoint", () => {
    const allowed = new Set<number>(Object.values(breakpoint));
    const bad: string[] = [];
    for (const file of stylesheets(root)) {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (!/@media/.test(line)) continue;
        if (/max-width/.test(line)) bad.push(`${file.slice(root.length)}: ${line.trim()} (write "width < N" instead)`);
        for (const m of line.matchAll(/(?:min-width:\s*|width\s*[<>]=?\s*)(\d+(?:\.\d+)?)px/g)) {
          if (!allowed.has(Number(m[1]))) bad.push(`${file.slice(root.length)}: ${line.trim()}`);
        }
      }
    }
    assert.deepEqual(bad, []);
  });
});
