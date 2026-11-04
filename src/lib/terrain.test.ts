// `npm test`: the contour field's route → terrain map and the route conductor's timing
// (src/components/terrain). The modules import "@/…" paths, so the TypeScript hooks come first.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

await import("../../scripts/lib/ts-hooks.mjs");
const { BERN, routeTerrain, setCardTerrains } = await import("../components/terrain/route-terrain.ts");
const { cards, cardHref, cardTerrains } = await import("../content/cards.ts");
// What the root layout writes on <html data-card-terrains>.
setCardTerrains(cardTerrains());
const { contourInterval, intervalSet, LOWLAND_INTERVALS, CONTOUR_INTERVALS } = await import("../components/terrain/field-settings.ts");
const bern = (await import("../../public/terrain/bern/summary.json", { with: { type: "json" } })).default;
const bernPosters = (await import("../../public/terrain/bern/posters.json", { with: { type: "json" } })).default;

describe("routeTerrain", () => {
  it("maps About to Bern, with or without the trailing slash", () => {
    assert.equal(routeTerrain("/about/"), BERN);
    assert.equal(routeTerrain("/about"), BERN);
  });


  it("gives every card its own terrain", () => {
    for (const card of cards.filter((c) => !cardHref(c).startsWith("/about"))) assert.equal(routeTerrain(cardHref(card)), card.terrainId);
  });
});

describe("contour intervals per terrain", () => {
  it("picks the set by relief: lowland for Bern, alpine for the region", () => {
    assert.deepEqual(intervalSet(860 - 480), LOWLAND_INTERVALS);
    assert.deepEqual(intervalSet(3700), CONTOUR_INTERVALS);
    assert.deepEqual(bern.intervalsM, [...LOWLAND_INTERVALS]);
  });

  it("keeps the spacing rule: Bern's 12 km window draws 20 m on a laptop and a phone", () => {
    const desktop = bernPosters.heightmaps.find((h) => h.use === "desktop")!;
    const mobile = bernPosters.heightmaps.find((h) => h.use === "mobile")!;
    assert.equal(contourInterval(desktop, { width: 1440, height: 900 }, 1.06, { minSpacingPx: 3.25, steepPercentile: 95 }, bern.intervalsM), 20);
    assert.equal(contourInterval(mobile, { width: 390, height: 844 }, 1.06, { minSpacingPx: 3, steepPercentile: 95 }, bern.intervalsM), 20);
  });
});

