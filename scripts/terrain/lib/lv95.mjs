// Approximate WGS84 <-> Swiss LV95 (EPSG:2056) conversion, after swisstopo's published
// formulas (accuracy ~1 m), which is plenty for framing and artwork pins.

export function wgs84ToLv95(lon, lat) {
  const phi = (lat * 3600 - 169028.66) / 10000;
  const lambda = (lon * 3600 - 26782.5) / 10000;
  const e =
    2600072.37 + 211455.93 * lambda - 10938.51 * lambda * phi - 0.36 * lambda * phi ** 2 - 44.54 * lambda ** 3;
  const n =
    1200147.07 +
    308807.95 * phi +
    3745.25 * lambda ** 2 +
    76.63 * phi ** 2 -
    194.56 * lambda ** 2 * phi +
    119.79 * phi ** 3;
  return [e, n];
}

export function lv95ToWgs84(e, n) {
  const y = (e - 2600000) / 1000000;
  const x = (n - 1200000) / 1000000;
  const lambda = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x ** 2 - 0.0436 * y ** 3;
  const phi = 16.9023892 + 3.238272 * x - 0.270978 * y ** 2 - 0.002528 * x ** 2 - 0.0447 * y ** 2 * x - 0.014 * x ** 3;
  return [(lambda * 100) / 36, (phi * 100) / 36];
}

/** LV95 envelope of a WGS84 bbox [minLon, minLat, maxLon, maxLat], sampled along the edges. */
export function bboxToLv95([minLon, minLat, maxLon, maxLat]) {
  let minE = Infinity, minN = Infinity, maxE = -Infinity, maxN = -Infinity;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    for (const [lon, lat] of [
      [minLon + (maxLon - minLon) * t, minLat],
      [minLon + (maxLon - minLon) * t, maxLat],
      [minLon, minLat + (maxLat - minLat) * t],
      [maxLon, minLat + (maxLat - minLat) * t],
    ]) {
      const [e, n] = wgs84ToLv95(lon, lat);
      minE = Math.min(minE, e); maxE = Math.max(maxE, e);
      minN = Math.min(minN, n); maxN = Math.max(maxN, n);
    }
  }
  return [minE, minN, maxE, maxN];
}
