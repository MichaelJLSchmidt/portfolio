import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRoute, freeBand, lengthAt, routeKeyframes, stepAt, type RouteStop } from "./route-geometry.ts";

const at = (id: string, x: number, y: number, h = 0, blaze = false): RouteStop => ({ id, enter: { x, y }, leave: { x, y: y + h }, blaze });

test("a gutter route is one straight line, its stops at their heights", () => {
  const r = buildRoute([at("a", 24, 0), at("b", 24, 300), at("c", 24, 1000)]);
  assert.equal(r.d, "M24 0L24 300L24 1000");
  assert.equal(r.length, 1000);
  assert.deepEqual(
    r.stops.map((s) => s.length),
    [0, 300, 1000],
  );
});

test("changing sides: down to the middle of the gap, across, down, with quarter-circle corners", () => {
  // Leaves the first drawing at its foot (y 200), enters the second at its head (y 400).
  const r = buildRoute([at("a", 110, 50, 150), at("b", 900, 400)], { radius: 24 });
  assert.match(r.d, /^M110 50L110 200L110 276A24 24 0 0 0 134 300L876 300A24 24 0 0 1 900 324L900 400$/);
  // Straight through the first drawing (150), then down, across and down.
  const straight = 150 + 76 + (876 - 134) + 76;
  assert.ok(Math.abs(r.length - (straight + Math.PI * 24)) < 1e-9, String(r.length));
  assert.equal(r.stops[1].length, r.length);
  // One subpath: a dash pattern would start again at every M.
  assert.equal(r.d.match(/M/g)?.length, 1);
});

test("the corner radius never exceeds half the gap or half the step across", () => {
  const r = buildRoute([at("a", 100, 0), at("b", 110, 30)], { radius: 24 });
  // dx 10 → r 5; dy 30 → 15: the smaller wins.
  assert.match(r.d, /A5 5 /);
});

test("switchbacks zig-zag just before each stop and stay within their swing", () => {
  const r = buildRoute([at("a", 8, 0), at("b", 8, 200)], { switchback: { height: 30, swing: 4 } });
  assert.equal(r.d, "M8 0L8 170L4 180L12 190L8 200");
  const xs = [...r.d.matchAll(/[ML](\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));
  assert.ok(xs.every((x) => x >= 4 && x <= 12));
  assert.equal(r.stops[1].length, r.length);
});

test("the blaze starts at the first stop marked for it", () => {
  const r = buildRoute([at("a", 24, 0), at("b", 24, 100, 0, true), at("c", 24, 300, 0, true)]);
  assert.equal(r.blazeFrom, 100);
});

test("keyframes: a stop is reached as it crosses the reading line; complete at the bottom", () => {
  const r = buildRoute([at("a", 24, 0), at("b", 24, 1000), at("c", 24, 2000), at("d", 24, 2900)]);
  // The layer starts 100 px down the page; the reading line is 300 px down the screen; 2000 px scroll.
  const frames = routeKeyframes(r, { top: 100, line: 300, range: 2000 });
  // a is above the line at the top; b at (100 + 1000 − 300) / 2000 = 0.4; c at 0.9; d never reaches it.
  assert.deepEqual(frames, [
    { offset: 0, length: 0 },
    { offset: 0.4, length: 1000 },
    { offset: 0.9, length: 2000 },
    { offset: 1, length: 2900 },
  ]);
  assert.ok(Math.abs(lengthAt(frames, 0.2) - 500) < 1e-9);
  assert.ok(Math.abs(lengthAt(frames, 0.95) - 2450) < 1e-9);
  // Calm: whole steps only.
  assert.equal(stepAt(frames, 0.5), 1000);
  assert.equal(stepAt(frames, 0.39), 0);
  for (let i = 1; i < frames.length; i++) assert.ok(frames[i].offset > frames[i - 1].offset && frames[i].length >= frames[i - 1].length);
});

test("keyframes: stops already above the line at the top are drawn from the start", () => {
  const r = buildRoute([at("a", 24, 0), at("b", 24, 100), at("c", 24, 900)]);
  const frames = routeKeyframes(r, { top: 0, line: 400, range: 1000 });
  assert.deepEqual(frames[0], { offset: 0, length: 100 });
  assert.equal(frames[frames.length - 1].length, r.length);
});

test("no scroll range: the route is simply complete", () => {
  const r = buildRoute([at("a", 24, 0), at("b", 24, 100)]);
  assert.deepEqual(routeKeyframes(r, { top: 0, line: 300, range: 0 }), [
    { offset: 0, length: 100 },
    { offset: 1, length: 100 },
  ]);
});

test("a crossing runs where it is told, and never into a corner it cannot turn", () => {
  const r = buildRoute([at("a", 24, 0), { ...at("b", 400, 600), turnY: 520, zig: false }], { radius: 24 });
  assert.match(r.d, /L24 496A24 24 0 0 0 48 520L376 520A24 24 0 0 1 400 544L400 600$/);
  // A turn too close to the target is pulled back so the corner fits.
  const late = buildRoute([at("a", 24, 0), { ...at("b", 400, 600), turnY: 599, zig: false }], { radius: 24 });
  assert.match(late.d, /L376 576A24 24 0 0 1 400 600/);
});

test("freeBand: the middle of the lowest gap between text blocks across the crossing", () => {
  const text = [
    { top: 100, bottom: 200, left: 0, right: 500 },
    { top: 260, bottom: 400, left: 0, right: 500 },
    // Outside the crossing's width: ignored.
    { top: 420, bottom: 600, left: 900, right: 1000 },
  ];
  assert.equal(freeBand(text, { y0: 0, y1: 600, x0: 24, x1: 400 }), 500);
  // Too thin a gap at the bottom: the next one up.
  assert.equal(freeBand([...text, { top: 410, bottom: 590, left: 0, right: 500 }], { y0: 0, y1: 600, x0: 24, x1: 400, min: 16 }), 230);
  assert.equal(freeBand([{ top: 0, bottom: 600, left: 0, right: 500 }], { y0: 0, y1: 600, x0: 24, x1: 400 }), null);
});
