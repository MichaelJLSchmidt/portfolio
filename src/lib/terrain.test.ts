// `npm test`: the contour field's route → terrain map, its readout and the route conductor's timing
// (src/components/terrain). The modules import "@/…" paths, so the TypeScript hooks come first.
import assert from "node:assert/strict";
import { describe, it } from "node:test";

await import("../../scripts/lib/ts-hooks.mjs");
const { BERN, routeTerrain } = await import("../components/terrain/route-terrain.ts");
const { cards, cardHref, terrainIdForPath } = await import("../content/cards.ts");
const { formatReadout, readoutFor, readoutParts } = await import("../components/terrain/readout.ts");
const { REST, Timeline, morphStep, planRoute, prewarmStep } = await import("../components/terrain/conductor.ts");
const { contourInterval, intervalSet, LOWLAND_INTERVALS, CONTOUR_INTERVALS } = await import("../components/terrain/field-settings.ts");
const bern = (await import("../../public/terrain/bern/summary.json", { with: { type: "json" } })).default;
const bernPosters = (await import("../../public/terrain/bern/posters.json", { with: { type: "json" } })).default;

describe("routeTerrain", () => {
  it("maps Basecamp to Bern, with or without the trailing slash", () => {
    assert.equal(routeTerrain("/about/"), BERN);
    assert.equal(routeTerrain("/about"), BERN);
  });

  it("delegates every other path to the cards module unchanged", () => {
    for (const path of ["/", "/no-such-page/", "/lab/", "/lab/terrain/", null, ...cards.map(cardHref).filter((h) => !h.startsWith("/about"))]) {
      assert.equal(routeTerrain(path), terrainIdForPath(path), String(path));
    }
    assert.equal(routeTerrain("/"), null);
  });

  it("gives every card its own terrain", () => {
    for (const card of cards.filter((c) => !cardHref(c).startsWith("/about"))) assert.equal(routeTerrain(cardHref(card)), card.artwork.terrainId);
  });
});

describe("readout", () => {
  it("reads Bern at the zero point with the DEM's altitude", () => {
    const alt = bern.zeroPoint.altitudeM;
    assert.ok(Number.isInteger(alt) && alt > 500 && alt < 600, `altitude ${alt}`);
    assert.equal(formatReadout(readoutFor(BERN)), `BERN · E 2’600’000 · N 1’200’000 · ALT ${alt} M`);
  });

  it("reads the home region as its summit", () => {
    assert.equal(formatReadout(readoutFor(null)), "JUNGFRAU · ALT 4’158 M");
  });

  it("reads a card as far as its data goes", () => {
    for (const card of cards) {
      const r = readoutFor(card.artwork.terrainId);
      const text = formatReadout(r);
      assert.ok(text.startsWith(card.name.toUpperCase()), text);
      if (r.altitudeM !== null) assert.ok(Number.isInteger(r.altitudeM) && text.endsWith(" M"), text);
    }
  });

  it("leaves out what is unknown (a placeholder terrain has no altitude)", () => {
    const parts = readoutParts({ id: BERN, label: "Bern", e: 2600000, n: 1200000, altitudeM: null });
    assert.deepEqual(
      parts.map((p) => p.key),
      ["label", "e", "n"],
    );
    assert.equal(formatReadout({ id: BERN, label: "Bern", e: 2600000, n: 1200000, altitudeM: null }), "BERN · E 2’600’000 · N 1’200’000");
  });
});

describe("contour intervals per terrain", () => {
  it("picks the set by relief: lowland for Bern, alpine for the region", () => {
    assert.deepEqual(intervalSet(860 - 480), LOWLAND_INTERVALS);
    assert.deepEqual(intervalSet(3700), CONTOUR_INTERVALS);
    assert.deepEqual(bern.intervalsM, [...LOWLAND_INTERVALS]);
  });

  it("keeps the spacing rule: Bern reaches 10 m on a laptop and a phone", () => {
    const desktop = bernPosters.heightmaps.find((h) => h.use === "desktop")!;
    const mobile = bernPosters.heightmaps.find((h) => h.use === "mobile")!;
    assert.equal(contourInterval(desktop, { width: 1440, height: 900 }, 1.06, { minSpacingPx: 3.25, steepPercentile: 95 }, bern.intervalsM), 10);
    assert.equal(contourInterval(mobile, { width: 390, height: 844 }, 1.06, { minSpacingPx: 3, steepPercentile: 95 }, bern.intervalsM), 10);
  });
});

describe("route conductor", () => {
  const ends = (steps: { channel: string; delay: number; duration: number }[], channel: string) =>
    steps.filter((s) => s.channel === channel).map((s) => [s.delay, s.delay + s.duration]);

  it("morphs over the terrain token with the summit easing", () => {
    assert.deepEqual(morphStep(1), { channel: "morph", to: 1, delay: 0, duration: 700, easing: "summit" });
    assert.deepEqual(prewarmStep(0.12, 400), { channel: "morph", to: 0.12, delay: 0, duration: 400, easing: "trail" });
  });

  it("draws on over the draw token in full motion, never in calm", () => {
    const full = planRoute("lab-097", "full", REST, { changes: true, revealFloor: 0.3 });
    assert.deepEqual(ends(full, "reveal"), [[0, 900]]);
    assert.equal(planRoute("lab-097", "calm", REST, { changes: true, revealFloor: 0.3 }).length, 0);
  });

  it("recentres on Bern: the Aare draws over 200–900 ms, the pin pings at 300 ms", () => {
    const full = planRoute(BERN, "full", REST, { changes: true, revealFloor: 0.3 });
    assert.deepEqual(ends(full, "riverDraw"), [[200, 900]]);
    assert.deepEqual(ends(full, "ping").map(([start]) => start), [300]);
    assert.deepEqual(ends(full, "pin").map(([start]) => start), [300]);
    assert.equal(ends(full, "reveal").length, 0, "the river is Bern's draw-on");
  });

  it("calm: the river and the pin appear without drawing or pinging", () => {
    const calm = planRoute(BERN, "calm", REST, { changes: true, revealFloor: 0.3 });
    assert.deepEqual(ends(calm, "riverDraw"), [[0, 0]]);
    assert.equal(ends(calm, "ping").length, 0);
  });

  it("leaving Bern fades the river and the pin out in 240 ms, without a draw-on", () => {
    const leave = planRoute(null, "full", { ...REST, riverOpacity: 1, riverDraw: 1, pin: 1 }, { changes: true, revealFloor: 0.3 });
    assert.deepEqual(ends(leave, "riverOpacity"), [[0, 240]]);
    assert.deepEqual(ends(leave, "pin"), [[0, 240]]);
    assert.equal(ends(leave, "reveal").length, 0);
  });

  it("runs a channel from where it is to its target on time", () => {
    const tl = new Timeline();
    tl.play([morphStep(1)], 1000);
    tl.update(1350);
    assert.ok(tl.values.morph > 0 && tl.values.morph < 1);
    assert.equal(tl.busy("morph"), true);
    tl.update(1700);
    assert.equal(tl.values.morph, 1);
    assert.equal(tl.busy("morph"), false);
    // A delayed step starts from the value at its start.
    tl.play([{ channel: "morph", to: 0, delay: 100, duration: 200, easing: "linear" }], 2000);
    tl.update(2050);
    assert.equal(tl.values.morph, 1);
    tl.update(2200);
    assert.equal(tl.values.morph, 0.5);
  });
});
