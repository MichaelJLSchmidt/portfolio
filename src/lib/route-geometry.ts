/**
 * The red route's geometry (RouteLayer): a path through a page's waypoints, its exact length at
 * every waypoint, and the keyframes that map the page's scroll onto it. Pure, so it is unit-tested
 * (route-geometry.test.ts); the layer measures the waypoints and draws what this returns.
 *
 * - A waypoint has where the route enters it and where it leaves (the same point for a waypoint
 *   in the gutter; the top and bottom of a drawing the route passes behind). The route runs
 *   straight through such a waypoint and the layer masks it there: one subpath, because a dash
 *   pattern (how the walked line is drawn) starts again at every subpath.
 * - Between waypoints the route runs straight down, or, when it changes sides, down to where it
 *   crosses over (`turnY`: the layer picks the lowest band free of text; halfway by default), across, and
 *   down again, its corners quarter circles.
 * - Switchbacks: a short zig-zag just before each waypoint (the phone's margin trail, and the
 *   gutter on desktop), so a straight gutter line still reads as a path.
 * - Lengths are computed from the segments (lines and quarter circles), so they match the drawn
 *   path's getTotalLength() without measuring it.
 */
export type Point = { x: number; y: number };

export type RouteStop = {
  id: string;
  enter: Point;
  leave: Point;
  /** From this waypoint on the route is climbed on foot: drawn as a white-red-white blaze. */
  blaze?: boolean;
  /** Where the route crosses over on its way here, when it changes sides (default: halfway). */
  turnY?: number;
  /** A switchback just before this waypoint (default true; not into a drawing). */
  zig?: boolean;
};

export type RouteOptions = {
  /** Corner radius where the route changes sides (px). */
  radius?: number;
  /** A zig-zag before each waypoint: its height and its swing either side of the line (px). */
  switchback?: { height: number; swing: number } | null;
};

export type BuiltRoute = {
  d: string;
  length: number;
  /** Each waypoint's length along the route, where the route enters it. */
  stops: { id: string; length: number; y: number }[];
  /** Length where the blaze begins (the first waypoint marked blaze), or null. */
  blazeFrom: number | null;
};

const r1 = (v: number) => Math.round(v * 10) / 10;
const fmt = (p: Point) => `${r1(p.x)} ${r1(p.y)}`;
const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/** The route through `stops`, in order (top to bottom). */
export function buildRoute(stops: readonly RouteStop[], { radius = 24, switchback = null }: RouteOptions = {}): BuiltRoute {
  if (!stops.length) return { d: "", length: 0, stops: [], blazeFrom: null };
  const parts: string[] = [];
  let length = 0;
  let at: Point = stops[0].enter;
  parts.push(`M${fmt(at)}`);
  const out: BuiltRoute["stops"] = [];
  let blazeFrom: number | null = null;

  const lineTo = (p: Point) => {
    if (dist(at, p) < 0.01) return;
    length += dist(at, p);
    parts.push(`L${fmt(p)}`);
    at = p;
  };
  /** A quarter circle from `at` to `p` (|dx| = |dy| = r), turning by `sweep`. */
  const arcTo = (p: Point, r: number, sweep: 0 | 1) => {
    length += (Math.PI / 2) * r;
    parts.push(`A${r1(r)} ${r1(r)} 0 0 ${sweep} ${fmt(p)}`);
    at = p;
  };
  /** Down from `at` to `to`: straight, or across the middle of the gap with rounded corners. */
  const travel = (to: Point, zig: boolean, turnY?: number) => {
    const dx = to.x - at.x;
    const dy = to.y - at.y;
    const zigH = zig && switchback ? Math.min(switchback.height, Math.max(0, dy)) : 0;
    const end: Point = { x: to.x, y: to.y - zigH };
    if (Math.abs(dx) < 0.5 || dy <= 0) {
      lineTo({ x: at.x, y: Math.max(at.y, end.y) });
    } else {
      const r = Math.max(0, Math.min(radius, Math.abs(dx) / 2, (end.y - at.y) / 2));
      const mid = Math.min(Math.max(turnY ?? at.y + (end.y - at.y) / 2, at.y + r), end.y - r);
      const dir = Math.sign(dx);
      lineTo({ x: at.x, y: mid - r });
      // Turning towards +x from going down is counter-clockwise on screen (sweep 0), and back.
      if (r > 0) arcTo({ x: at.x + dir * r, y: mid }, r, dir > 0 ? 0 : 1);
      lineTo({ x: end.x - dir * r, y: mid });
      if (r > 0) arcTo({ x: end.x, y: mid + r }, r, dir > 0 ? 1 : 0);
      lineTo(end);
    }
    if (zigH > 0 && switchback) {
      // Out to one side, across to the other, back onto the line at the waypoint.
      const s = switchback.swing;
      lineTo({ x: to.x - s, y: to.y - zigH * (2 / 3) });
      lineTo({ x: to.x + s, y: to.y - zigH / 3 });
      lineTo(to);
    }
  };

  stops.forEach((stop, i) => {
    if (i > 0) travel(stop.enter, stop.zig !== false, stop.turnY);
    out.push({ id: stop.id, length, y: stop.enter.y });
    if (stop.blaze && blazeFrom === null) blazeFrom = length;
    // Through the waypoint (masked by the layer where it passes behind a drawing).
    lineTo(stop.leave);
  });

  return { d: parts.join(""), length, stops: out, blazeFrom };
}

/**
 * The route's keyframes over the page's scroll (0 at the top, 1 at the bottom): a waypoint is
 * reached when it crosses the reading line (`line` px down the screen). Before the first scroll
 * the route is drawn as far as the reading line already reaches; at the bottom of the page it is
 * complete, also when its last waypoints never reach the line. Offsets rise strictly.
 *
 * `top` is the route's offset from the top of the document (px); `range` the scrollable height.
 */
export function routeKeyframes(route: BuiltRoute, { top, line, range }: { top: number; line: number; range: number }): { offset: number; length: number }[] {
  if (!route.stops.length || range <= 0) return [{ offset: 0, length: route.length }, { offset: 1, length: route.length }];
  const reachedAt = (y: number) => (top + y - line) / range;
  const frames: { offset: number; length: number }[] = [];
  // At the top: every waypoint above the reading line is passed.
  let start = 0;
  for (const s of route.stops) if (reachedAt(s.y) <= 0) start = s.length;
  frames.push({ offset: 0, length: start });
  for (const s of route.stops) {
    const o = reachedAt(s.y);
    if (o <= 0 || o >= 1) continue;
    const prev = frames[frames.length - 1];
    if (o - prev.offset < 1e-4 || s.length <= prev.length) continue;
    frames.push({ offset: o, length: s.length });
  }
  const last = frames[frames.length - 1];
  if (last.offset < 1) frames.push({ offset: 1, length: route.length });
  else last.length = route.length;
  return frames;
}

/** The length along the route at scroll progress `p`, between the keyframes (the fallback's). */
export function lengthAt(frames: readonly { offset: number; length: number }[], p: number): number {
  if (!frames.length) return 0;
  if (p <= frames[0].offset) return frames[0].length;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (p <= b.offset) return a.length + ((p - a.offset) / Math.max(b.offset - a.offset, 1e-6)) * (b.length - a.length);
  }
  return frames[frames.length - 1].length;
}

/** The last waypoint reached at scroll progress `p` (calm advances the route a waypoint at a time). */
export function stepAt(frames: readonly { offset: number; length: number }[], p: number): number {
  let length = frames[0]?.length ?? 0;
  for (const f of frames) if (f.offset <= p + 1e-6) length = f.length;
  return length;
}

/**
 * Where a crossing from y0 down to y1 can run: the middle of the lowest band between them, at least
 * `min` px tall, that no obstacle (a text block, measured by the layer) covers across the
 * crossing's width. The lowest, so the route keeps to its own side (the gutter, a drawing's column)
 * as long as it can and only crosses just before its waypoint. Null when no band is free; the
 * route then crosses halfway.
 */
export function freeBand(
  obstacles: readonly { top: number; bottom: number; left: number; right: number }[],
  { y0, y1, x0, x1, min = 16 }: { y0: number; y1: number; x0: number; x1: number; min?: number },
): number | null {
  const [lo, hi] = [Math.min(x0, x1), Math.max(x0, x1)];
  const covered = obstacles
    .filter((o) => o.right > lo && o.left < hi && o.bottom > y0 && o.top < y1)
    .map((o) => [Math.max(o.top, y0), Math.min(o.bottom, y1)] as const)
    .sort((a, b) => a[0] - b[0]);
  let band: [number, number] | null = null;
  let cursor = y0;
  for (const [top, bottom] of [...covered, [y1, y1] as const]) {
    if (top - cursor >= min) band = [cursor, top];
    cursor = Math.max(cursor, bottom);
  }
  return band ? (band[0] + band[1]) / 2 : null;
}
