// `npm test`: the measured display widths (display-width.ts) and the titles sized from them.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

await import("../../scripts/lib/ts-hooks.mjs");
const { glyphEm, textEm, widestEm } = await import("./display-width.ts");
const { cards } = await import("../content/cards.ts");
const { site } = await import("../content/site.ts");
const { about } = await import("../content/about.ts");
const { nameLines } = await import("./name-lines.ts");

describe("display widths", () => {
  it("sum the glyphs of a word, upper-cased", () => {
    assert.equal(textEm("Ab"), Math.round(((glyphEm("A") ?? 0) + (glyphEm("B") ?? 0)) * 1000) / 1000);
    assert.equal(glyphEm("a"), glyphEm("A"));
    assert.equal(textEm("ꙮ"), null);
  });

  it("measure the widest word, or the widest line", () => {
    assert.equal(widestEm("I MM"), textEm("MM"));
    assert.equal(widestEm("A B\nCD", { lines: true }), Math.max(textEm("A B") ?? 0, textEm("CD") ?? 0));
  });

  it("cover every letter of the current display titles (so their boxes are fixed)", () => {
    const titles = [site.hero.name, about.header.heading, ...cards.map((c) => c.name)];
    for (const t of titles) assert.notEqual(textEm(t.replace(/\s+/g, "")), null, t);
    for (const line of nameLines(site.hero.name)) assert.ok(textEm(line), line);
  });
});
