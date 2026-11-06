// The tab icon (src/app/icon.svg) is a static file, so its colours are literals: they must be
// token values (ground, text-2 and the one mint ring), and it carries no text (no name or brand
// whose length it would have to fit).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { color } from "./tokens.ts";

const svg = readFileSync(new URL("../app/icon.svg", import.meta.url), "utf8");

describe("tab icon", () => {
  it("uses token colours only", () => {
    const tokens = new Set(Object.values(color).map((c) => c.toUpperCase()));
    const used = svg.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    assert.ok(used.length > 0);
    for (const c of used) assert.ok(tokens.has(c.toUpperCase()), `${c} is not a colour token`);
  });

  it("has no text", () => {
    assert.doesNotMatch(svg, /<text\b/);
  });
});
