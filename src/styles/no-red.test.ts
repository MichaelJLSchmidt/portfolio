// No red anywhere: no red, orange-red or rust in tokens, stylesheets, components, the gate's
// generator, the case-study artefacts' sources or any SVG under public/ (shaders live in TS
// strings, so they are covered too). A colour counts as red when its hue is within 20° of red and
// it is clearly saturated. `npm test`; the rendered images are checked by the QA scan (Phase 8).
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const repo = new URL("../..", import.meta.url).pathname;

const walk = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name.startsWith(".")) return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p, ext) : ext.test(p) ? [p] : [];
  });

function hsl(r: number, g: number, b: number): [number, number, number] {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return [h, s, l];
}

export const isRed = (r: number, g: number, b: number) => {
  const [h, s, l] = hsl(r, g, b);
  return (h <= 20 || h >= 340) && s >= 0.35 && l >= 0.15 && l <= 0.9;
};

/** Every colour literal in a text: #rgb, #rrggbb(aa), rgb()/rgba() with numbers, hsl()/hsla(). */
export function colours(text: string): { literal: string; rgb: [number, number, number] }[] {
  const out: { literal: string; rgb: [number, number, number] }[] = [];
  for (const m of text.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g)) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1].slice(0, 6);
    out.push({ literal: m[0], rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number] });
  }
  for (const m of text.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) out.push({ literal: m[0], rgb: [+m[1], +m[2], +m[3]] });
  for (const m of text.matchAll(/hsla?\(\s*(\d+(?:\.\d+)?)(?:deg)?[\s,]+(\d+(?:\.\d+)?)%[\s,]+(\d+(?:\.\d+)?)%/g)) {
    const [h, s, l] = [+m[1], +m[2] / 100, +m[3] / 100];
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
    out.push({ literal: m[0], rgb: [f(0), f(8), f(4)] });
  }
  return out;
}

describe("no red", () => {
  const sources = [
    ...walk(join(repo, "src"), /\.(css|tsx?|json|mjs)$/).filter((f) => !f.endsWith("no-red.test.ts")),
    ...walk(join(repo, "scripts/site"), /\.mjs$/),
    ...walk(join(repo, "artefacts"), /\.(css|html|svg|js|mjs)$/),
    ...walk(join(repo, "public"), /\.svg$/),
  ];

  it("the scan recognises red, orange and rust, and lets the palette through", () => {
    for (const red of ["#FF4D45", "#FF8A5C", "#A33A18", "#B3261E", "rgb(220 40 30)", "hsl(5 80% 50%)"]) {
      assert.ok(colours(red).some((c) => isRed(...c.rgb)), red);
    }
    for (const ok of ["#1B1C18", "#C8F5B0", "#DDE3E3", "#8A8C80", "#E8EBE4", "#4A4C45"]) {
      assert.ok(!colours(ok).some((c) => isRed(...c.rgb)), ok);
    }
  });

  it("no red colour literal in sources, artefacts or public SVGs", () => {
    const found = sources.flatMap((file) =>
      colours(readFileSync(file, "utf8"))
        .filter((c) => isRed(...c.rgb))
        .map((c) => `${file.slice(repo.length)}: ${c.literal}`),
    );
    assert.deepEqual(found, []);
  });
});
