// Isolines via d3-contour, converted to compact, simplified SVG path data.
import { contours } from "d3-contour";

/** d3 grid space: the centre of value i + j*w sits at (i + 0.5, j + 0.5). */
export function isobands(values, w, h, thresholds) {
  return contours().size([w, h]).smooth(true).thresholds(thresholds)(values);
}

function perpendicularDistance(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

/** Ramer–Douglas–Peucker, iterative. */
export function simplify(points, tolerance) {
  if (points.length < 3 || tolerance <= 0) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpendicularDistance(points[i], points[s], points[e]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tolerance && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Turns band polygons into stroke-only isolines: segments that run along the grid edge
 * (where d3 closes polygons) are dropped, so lines never trace the frame.
 */
export function ringsToLines(multiPolygon, w, h) {
  const eps = 1e-6;
  const side = ([x, y]) =>
    (x <= 0.5 + eps ? 1 : 0) | (x >= w - 0.5 - eps ? 2 : 0) | (y <= 0.5 + eps ? 4 : 0) | (y >= h - 0.5 - eps ? 8 : 0);
  const lines = [];
  for (const polygon of multiPolygon.coordinates) {
    for (const ring of polygon) {
      const borderSeg = (a, b) => (side(a) & side(b)) !== 0;
      let hasBorder = false;
      for (let i = 0; i < ring.length - 1; i++) if (borderSeg(ring[i], ring[i + 1])) { hasBorder = true; break; }
      if (!hasBorder) {
        lines.push({ points: ring.slice(0, -1), closed: true });
        continue;
      }
      // Rotate so we start right after a border segment, then collect runs of interior segments.
      const n = ring.length - 1;
      let start = 0;
      for (let i = 0; i < n; i++) if (borderSeg(ring[i], ring[(i + 1) % n])) { start = (i + 1) % n; break; }
      let current = [ring[start]];
      for (let k = 0; k < n; k++) {
        const a = ring[(start + k) % n];
        const b = ring[(start + k + 1) % n];
        if (borderSeg(a, b)) {
          if (current.length > 1) lines.push({ points: current, closed: false });
          current = [b];
        } else {
          current.push(b);
        }
      }
      if (current.length > 1) lines.push({ points: current, closed: false });
    }
  }
  return lines;
}

const fmt = (tenths) => {
  const s = (tenths / 10).toString();
  return s.replace(/^(-?)0\./, "$1.");
};

/** Compact path data: absolute moveto, then relative lineto in tenths of a unit. */
export function toPathData(lines, { tolerance = 0.4, scale = 1, minLength = 2 } = {}) {
  let d = "";
  for (const line of lines) {
    const pts = simplify(line.points, tolerance);
    if (pts.length < 2) continue;
    let length = 0;
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (length * scale < minLength) continue;
    const r = pts.map(([x, y]) => [Math.round(x * scale * 10), Math.round(y * scale * 10)]);
    d += `M${fmt(r[0][0])} ${fmt(r[0][1])}l`;
    let prevNum = null;
    for (let i = 1; i < r.length; i++) {
      for (const v of [r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]]) {
        const s = fmt(v);
        d += prevNum === null || s.startsWith("-") ? s : ` ${s}`;
        prevNum = s;
      }
    }
    if (line.closed) d += "z";
  }
  return d;
}

/** Filled shapes (lakes) from a 0..1 mask. */
export function maskToPathData(mask, w, h, { tolerance = 0.5, scale = 1 } = {}) {
  const [band] = isobands(mask, w, h, [0.5]);
  let d = "";
  for (const polygon of band.coordinates) {
    for (const ring of polygon) {
      const pts = simplify(ring, tolerance);
      if (pts.length < 4) continue;
      const r = pts.map(([x, y]) => [Math.round(x * scale * 10), Math.round(y * scale * 10)]);
      d += `M${fmt(r[0][0])} ${fmt(r[0][1])}l`;
      for (let i = 1; i < r.length; i++) {
        const dx = fmt(r[i][0] - r[i - 1][0]);
        const dy = fmt(r[i][1] - r[i - 1][1]);
        d += (i === 1 || dx.startsWith("-") ? dx : ` ${dx}`) + (dy.startsWith("-") ? dy : ` ${dy}`);
      }
      d += "z";
    }
  }
  return d;
}
