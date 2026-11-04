// The contour field's rules (npm test): which terrain a route shows, the contour interval per
// screen, and the motion limits of docs/motion.md: drift ≤ 2 px/s with loops of at least 12 s,
// the breath at ±0.15 of an interval, a pointer bend of at most 6 px (3 in Calm) on a spring that
// never overshoots, nothing in Off; every field heightmap within 150 KB and every poster within 60.
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { describe, it } from "node:test";
import "../../scripts/lib/ts-hooks.mjs";

const { BERN, routeTerrain, setCardTerrains } = await import("../components/terrain/route-terrain.ts");
const { cards, cardHref, cardTerrains } = await import("../content/cards.ts");
const { breathAt, contourInterval, driftAt, springStep } = await import("../field/core.ts");
const { fieldConfig, fieldMotion, fieldOptions, terrainSource } = await import("../field/index.ts");
const field = (await import("../../public/terrain/field/field.json", { with: { type: "json" } })).default;
const examples = (await import("../../public/terrain/field/examples.json", { with: { type: "json" } })).default;
const meta = { terrains: { ...field.terrains, ...examples.terrains }, posters: { ...field.posters, ...examples.posters } };

setCardTerrains(cardTerrains());
const publicFile = (url: string) => new URL(`../../public${url}`, import.meta.url);

describe("routeTerrain", () => {
  it("maps About to Bern, with or without the trailing slash", () => {
    assert.equal(routeTerrain("/about/"), BERN);
    assert.equal(routeTerrain("/about"), BERN);
  });
  it("gives every case study its summit and everything else the region", () => {
    for (const card of cards) assert.equal(routeTerrain(cardHref(card)), card.terrainId);
    for (const path of ["/", "/no-such-page/", "/lab/", null]) assert.equal(routeTerrain(path), null);
  });
  it("has a field heightmap for every terrain a route can show", () => {
    for (const id of [null, BERN, ...cards.map((c) => c.terrainId)]) assert.ok(terrainSource(id), String(id));
  });
});

describe("terrains within budget", () => {
  it("every field heightmap ≤ 150 KB", () => {
    for (const [id, t] of Object.entries(meta.terrains)) assert.ok(statSync(publicFile(t.file)).size <= 150 * 1024, id);
  });
  it("every poster ≤ 60 KB", () => {
    const posters = (meta as { posters?: Record<string, { landscape: string; portrait: string }> }).posters ?? {};
    assert.ok(Object.keys(posters).length >= Object.keys(meta.terrains).length, "a poster per terrain");
    for (const [id, p] of Object.entries(posters)) {
      for (const file of [p.landscape, p.portrait]) assert.ok(statSync(publicFile(file)).size <= 60 * 1024, `${id}: ${file}`);
    }
  });
});

describe("contour intervals", () => {
  it("draws the region at 200 m on laptops and phones, like the gate", () => {
    const region = terrainSource(null)!;
    for (const [w, h, tier] of [[1440, 900, "desktop"], [1280, 800, "desktop"], [390, 844, "mobile"]] as const) {
      const o = fieldOptions(tier);
      assert.equal(contourInterval(region, w, h, o.zoom, o.minSpacingPx), 200, `${w}×${h}`);
    }
  });
  it("draws Bern in lowland steps", () => {
    const bern = terrainSource(BERN)!;
    const o = fieldOptions("desktop");
    assert.ok([10, 20, 50].includes(contourInterval(bern, 1440, 900, o.zoom, o.minSpacingPx)));
  });
});

describe("motion limits", () => {
  const { ambient, bump } = fieldConfig;
  it("drift: at most 2 px/s, loops of 12 s or more, zero at the poster's frame", () => {
    assert.deepEqual(driftAt(0, ambient.driftPx, ambient.driftPeriodsS as [number, number]), [0, 0]);
    let fastest = 0;
    for (let t = 0; t < 600; t += 0.05) {
      const [x0, y0] = driftAt(t, ambient.driftPx, ambient.driftPeriodsS as [number, number]);
      const [x1, y1] = driftAt(t + 0.05, ambient.driftPx, ambient.driftPeriodsS as [number, number]);
      fastest = Math.max(fastest, Math.hypot(x1 - x0, y1 - y0) / 0.05);
    }
    assert.ok(fastest <= 2, `${fastest.toFixed(2)} px/s`);
    assert.ok(Math.min(...ambient.driftPeriodsS) >= 12 && ambient.breathPeriodS >= 12 && ambient.touchBreathPeriodS >= 12);
  });
  it("breath: ±0.15 of an interval on a 24 s sine (32 s on touch)", () => {
    assert.equal(ambient.breath, 0.15);
    assert.equal(ambient.breathPeriodS, 24);
    assert.equal(ambient.touchBreathPeriodS, 32);
    assert.ok(Math.abs(breathAt(6, ambient.breath, 24) - 0.15) < 1e-9);
  });
  it("pointer: at most 6 px (3 in Calm), about 180 px wide, no bump on touch or in Off", () => {
    assert.ok(bump.maxPx <= 6 && bump.calmMaxPx <= 3 && bump.radiusPx === 180);
    assert.equal(fieldMotion("full", false).bump, 0);
    assert.equal(fieldMotion("still", true).bump, 0);
    assert.equal(fieldMotion("calm", true).bump * bump.maxPx, bump.calmMaxPx);
  });
  it("tiers: Calm halves the drift and drops the breath; touch halves the drift and slows the breath; Off stops all", () => {
    assert.deepEqual(fieldMotion("calm", true), { drift: 0.5, breath: 0, breathPeriodS: 24, bump: 0.5 });
    assert.deepEqual(fieldMotion("full", false), { drift: 0.5, breath: 1, breathPeriodS: 32, bump: 0 });
    assert.deepEqual(fieldMotion("still", true), { drift: 0, breath: 0, breathPeriodS: 24, bump: 0 });
  });
  it("the bump's spring never overshoots and rests near 40 % within ~1.2 s", () => {
    let [x, v] = [1, 0];
    let lowest = 1;
    for (let t = 0; t < 1.2; t += 1 / 60) {
      [x, v] = springStep(x, v, bump.rest, 1 / 60, bump.stiffness, bump.damping);
      lowest = Math.min(lowest, x);
    }
    assert.ok(lowest >= bump.rest - 1e-6, "no overshoot below the rest");
    assert.ok(Math.abs(x - bump.rest) < 0.05, `at 1.2 s: ${x.toFixed(3)}`);
  });
  it("a page change: dims to 60 % and crossfades within the terrain token (1.6 s)", () => {
    const o = fieldOptions("desktop");
    assert.equal(o.route.dimTo, 0.6);
    assert.equal(o.route.dimMs + o.route.fadeMs, 1600);
  });
  it("frames: about 30 a second at rest; device pixels capped at 1.5 (desktop) and 1.25 (phones)", () => {
    assert.equal(fieldConfig.idleFps, 30);
    assert.equal(fieldOptions("desktop").dprMax, 1.5);
    assert.equal(fieldOptions("mobile").dprMax, 1.25);
  });
});
