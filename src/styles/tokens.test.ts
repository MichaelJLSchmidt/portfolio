// Unit tests for the design tokens: `npm test` (node:test, Node strips the types). The CSS the root
// layout inlines must carry exactly the values of src/styles/tokens.ts, and every token a
// stylesheet reads must exist.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { spring as springEasing } from "motion";
import { springCss, springsToCss } from "./motion-css.ts";
import {
  breakpoint,
  color,
  cubicBezier,
  distance,
  duration,
  easing,
  glint,
  hexChannels,
  layer,
  scale,
  space,
  spring,
  stagger,
  staggerStep,
  titleAxes,
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

const css = parse(tokensToCss() + springsToCss());

describe("tokens → CSS", () => {
  it("colours", () => {
    for (const [k, v] of Object.entries(color)) assert.equal(css.get(`--color-${kebab(k)}`), v, k);
  });

  it("durations, in ms", () => {
    for (const [k, v] of Object.entries(duration)) assert.equal(css.get(`--dur-${kebab(k)}`), `${v}ms`, k);
    assert.equal(duration.tap, 120);
    assert.equal(duration.settle, 420);
    assert.equal(duration.title, 600);
    assert.equal(duration.trail, 280);
    assert.equal(duration.trailCalm, 120);
    assert.equal(duration.route, 600);
    assert.equal(duration.terrain, 700);
    assert.equal(duration.glint, 900);
    assert.equal(duration.draw, 900);
  });

  it("easings, as cubic-bezier()", () => {
    for (const k of Object.keys(easing) as (keyof typeof easing)[]) assert.equal(css.get(`--ease-${k}`), cubicBezier(k), k);
    assert.deepEqual(easing.settle, [0.16, 1, 0.3, 1]);
    assert.deepEqual(easing.glint, [0.45, 0, 0.55, 1]);
  });

  it("type roles: widths as percentages, weights as numbers", () => {
    assert.equal(css.get("--type-display-wdth"), `${type.display.wdth}%`);
    assert.equal(css.get("--type-display-wght"), String(type.display.wght));
    assert.equal(css.get("--type-body-lh"), String(type.body.lineHeight));
    assert.equal(css.get("--type-body-wght"), String(type.body.wght));
    assert.equal(css.get("--type-button-wdth"), `${type.button.wdth}%`);
    assert.equal(css.get("--type-button-wght"), String(type.button.wght));
    assert.equal(css.get("--type-button-tracking"), `${type.button.tracking}em`);
    assert.equal(css.get("--type-mono-wdth"), `${type.mono.wdth}%`);
    assert.equal(css.get("--type-mono-wght"), String(type.mono.wght));
    assert.equal(css.get("--type-compact-wdth"), `${type.compact.wdth}%`);
    assert.equal(css.get("--type-condensed-wdth"), `${type.condensed.wdth}%`);
    assert.equal(css.get("--space-section-mobile"), space.section.mobile);
    assert.equal(css.get("--space-section-desktop"), space.section.desktop);
    assert.equal(css.get("--space-overshoot"), `${space.overshoot}px`);
  });

  it("titles rest at wdth 75, wght 800 and arrive from wght 200 (WeightTitle)", () => {
    assert.equal(type.display.wdth, 75);
    assert.equal(type.display.wght, 800);
    assert.equal(titleAxes.from.wght, 200);
    assert.equal(css.get("--title-from-wght"), "200");
    assert.equal(css.get("--title-rest-wght"), "800");
    // A unitless number: WeightTitle's knots interpolate it inside font-variation-settings.
    assert.equal(css.get("--title-rest-wdth"), "75");
    // Body text: 17–19 px, 1.55, 60–68 characters.
    assert.deepEqual([type.body.sizeMin, type.body.sizeMax, type.body.lineHeight], [17, 19, 1.55]);
    assert.ok(type.body.measureMin >= 60 && type.body.measureMax <= 68);
  });

  it("staggers, distances, glint, layers", () => {
    for (const [k, s] of Object.entries(stagger)) {
      assert.equal(css.get(`--stagger-${k}`), `${s.step}ms`, k);
      if ("cap" in s) assert.equal(css.get(`--stagger-${k}-cap`), `${s.cap}ms`, k);
      if ("max" in s) assert.equal(css.get(`--stagger-${k}-max`), String(s.max), k);
    }
    for (const [k, v] of Object.entries(distance)) assert.equal(css.get(`--dist-${kebab(k)}`), `${v}${/^tilt/.test(k) ? "deg" : "px"}`, k);
    assert.equal(css.get("--glint-band"), `${glint.band}%`);
    assert.equal(css.get("--glint-angle"), `${glint.angle}deg`);
    assert.equal(css.get("--glint-color"), `rgb(${hexChannels(color.glacier).join(" ")} / ${glint.alpha})`);
    assert.equal(css.get("--scale-press"), String(scale.press));
    assert.equal(css.get("--scale-card-press"), String(scale.cardPress));
    for (const [k, v] of Object.entries(layer)) assert.equal(css.get(`--layer-${kebab(k)}`), String(v), k);
  });

  it("springs, as Motion's own spring sampled into linear()", () => {
    for (const k of Object.keys(spring) as (keyof typeof spring)[]) {
      const value = css.get(`--spring-${k}`) ?? "";
      assert.equal(value, springCss(k), k);
      assert.match(value, /^\d+ms linear\(0, .*1\)$/, k);
    }
    // The press spring settles without overshoot: the curve never passes 1.
    const press = springEasing(spring.press.visualDuration, spring.press.bounce).toString();
    const points = press.slice(press.indexOf("(") + 1, -1).split(",").map(Number);
    assert.ok(points.every((p) => p <= 1.0001), press);
  });

  it("a cascade stays within its cap", () => {
    assert.equal(staggerStep(stagger.card, 1), 0);
    assert.equal(staggerStep(stagger.card, 3), stagger.card.step);
    assert.ok(staggerStep(stagger.card, 20) * 19 <= stagger.card.cap + 1e-9);
  });

  it("the palette-only CSS leaves motion out", () => {
    const base = parse(tokensToCss({ motion: false }));
    assert.equal(base.get("--color-glacier"), color.glacier);
    assert.ok(![...base.keys()].some((k) => /^--(dur|ease|stagger|dist|glint|layer|scale|space|flood)-/.test(k)));
  });
});

// Every motion or type token a stylesheet reads exists in the generated CSS (a renamed or
// removed token fails here, not silently in the browser).
describe("stylesheets read existing tokens", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? files(p) : p.endsWith(".css") ? [p] : [];
    });
  const root = new URL("..", import.meta.url).pathname;
  it("var(--dur|ease|stagger|dist|glint|layer|spring|scale|color|type|title|space-…)", () => {
    const missing: string[] = [];
    // Derived from tokens in the global stylesheet (e.g. --space-section per breakpoint).
    const globals = new Set([...readFileSync(join(root, "app/globals.css"), "utf8").matchAll(/(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    for (const file of files(root)) {
      const text = readFileSync(file, "utf8");
      // A property a stylesheet registers (@property) or sets itself is local state, not a token;
      // so is one read with a fallback (set inline by a component, e.g. a title's fitted size).
      const local = new Set([
        ...[...text.matchAll(/@property\s+(--[a-z0-9-]+)/g)].map((m) => m[1]),
        ...[...text.matchAll(/(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
        ...[...text.matchAll(/var\((--[a-z0-9-]+),/g)].map((m) => m[1]),
      ]);
      for (const m of text.matchAll(/var\((--(?:dur|ease|stagger|dist|glint|layer|spring|color|type|title|space)-[a-z0-9-]+)/g)) {
        if (!css.has(m[1]) && !local.has(m[1]) && !globals.has(m[1])) missing.push(`${file.slice(root.length)}: ${m[1]}`);
      }
    }
    assert.deepEqual(missing, []);
  });
});

// Motion values come from the tokens. A stylesheet that writes its own duration, easing curve or
// font-stretch fails here; the allowance lists what was written before the tokens existed, for the
// phase that owns it to replace (cards and deck: phase 4; terrain: phase 6). Lower it, never raise it.
describe("no hard-coded motion values in stylesheets", () => {
  const allowance: Record<string, number> = {
    // Poster fallback delay and drift loop (phase 6).
    "components/terrain/TerrainBackdrop.module.css": 2,
    // Scroll cue loop (phase 5).
    "app/page.module.css": 1,
    // The return choreography's 100 ms offsets (phase 5).
    "app/globals.css": 4,
  };
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? files(p) : p.endsWith(".css") ? [p] : [];
    });
  const root = new URL("..", import.meta.url).pathname;
  it("durations, cubic-bezier() and font-stretch come from tokens", () => {
    const over: string[] = [];
    for (const file of files(root)) {
      const rel = file.slice(root.length);
      const found = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => {
          const time = /^\s*(transition|animation)[a-z-]*:/.test(line) && /[\s(*+,-](?!0m?s\b)\d*\.?\d+m?s\b/.test(line);
          return time || /cubic-bezier\(/.test(line) || /font-stretch:\s*\d/.test(line.replace("font-stretch: 100%", ""));
        });
      if (found.length > (allowance[rel] ?? 0)) over.push(`${rel}: ${found.map((l) => l.trim()).join(" | ")}`);
    }
    assert.deepEqual(over, []);
  });
});

// At most three named breakpoints, and every width media query in a stylesheet is one of them:
// `(min-width: Npx)` from a breakpoint up, `(width < Npx)` below it.
describe("breakpoints", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? files(p) : p.endsWith(".css") ? [p] : [];
    });
  const root = new URL("..", import.meta.url).pathname;
  it("three at most, ascending", () => {
    const values = Object.values(breakpoint);
    assert.ok(values.length <= 3);
    assert.deepEqual([...values].sort((a, b) => a - b), values);
  });
  it("width queries use a breakpoint", () => {
    const allowed = new Set<number>(Object.values(breakpoint));
    const bad: string[] = [];
    for (const file of files(root)) {
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

// The route's red is for the route alone: the red route and the lines that are routes (an ascent's
// profile, the way a decision took, a drawing's path and blaze, a career's walked line), trail
// links and their blazes. A new use belongs to one of those, or to another colour.
describe("route red", () => {
  const ROUTE_FILES = new Set([
    "components/route/RouteLayer.module.css",
    "components/interaction/TrailLink.module.css",
    "components/interaction/TrailLink.tsx",
    "components/case-study/ElevationProfile.module.css",
    "components/case-study/ForkDiagram.module.css",
    "components/case-study/TrailheadSpread.module.css",
    "components/home/Home.module.css",
    "components/about/CareerProfile.module.css",
  ]);
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? files(p) : /\.(css|tsx?)$/.test(p) && !/\.test\.ts$/.test(p) ? [p] : [];
    });
  const root = new URL("..", import.meta.url).pathname;
  it("only routes, trail links and blazes use it", () => {
    const users = files(root)
      .filter((f) => !f.endsWith("styles/tokens.ts"))
      .filter((f) => /--color-(signal|route-paper)\b|color\.(signal|routePaper)\b/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(root.length));
    assert.deepEqual(
      users.filter((f) => !ROUTE_FILES.has(f)),
      [],
    );
  });
  it("nor the gate and the under-construction page (built from scripts/site/holding.mjs)", () => {
    const holding = readFileSync(new URL("../../scripts/site/holding.mjs", import.meta.url), "utf8");
    assert.doesNotMatch(holding, /--color-(signal|route-paper)\b/);
  });
});
