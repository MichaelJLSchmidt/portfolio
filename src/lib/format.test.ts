// `npm test`: numbers render identically on the server and in the browser.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatInteger } from "./format.ts";

describe("formatInteger", () => {
  it("groups thousands with the Swiss apostrophe", () => {
    assert.equal(formatInteger(4158), "4’158");
    assert.equal(formatInteger(566), "566");
    assert.equal(formatInteger(1000000), "1’000’000");
    assert.equal(formatInteger(-12500), "-12’500");
  });

  it("rounds to whole numbers", () => {
    assert.equal(formatInteger(3999.6), "4’000");
    assert.equal(formatInteger(0.4), "0");
  });
});
