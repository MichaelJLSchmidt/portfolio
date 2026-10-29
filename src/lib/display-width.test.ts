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

  it("measure the condensed cut in mixed case, word space included", () => {
    assert.notEqual(glyphEm("a", "condensed"), glyphEm("A", "condensed"));
    assert.ok((glyphEm(" ", "condensed") ?? 0) > 0);
  });

  it("cover every character of the case-study type lines (their boxes are fixed too)", async () => {
    const { caseStudies } = await import("../content/case-studies.ts");
    const lines = [...cards.map((c) => c.type), ...Object.values(caseStudies).map((s) => s.typeLine ?? "")];
    // Numbers come from {{tokens}}: the digits are in the table.
    for (const l of lines) assert.notEqual(textEm(l.replace(/\{\{[^}]*\}\}/g, "0").replace(/\s+/g, ""), "condensed"), null, l);
  });

  it("cover every letter of the current display titles (so their boxes are fixed)", () => {
    const titles = [site.hero.name, about.header.heading, ...cards.map((c) => c.name)];
    for (const t of titles) assert.notEqual(textEm(t.replace(/\s+/g, "")), null, t);
    for (const line of nameLines(site.hero.name)) assert.ok(textEm(line), line);
  });
});
