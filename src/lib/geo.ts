/** Approximate WGS84 → Swiss LV95 (EPSG:2056), after swisstopo's published formulas (~1 m). */
export function wgs84ToLv95(lon: number, lat: number): [number, number] {
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

/** Projects a WGS84 point into a viewBox that frames an LV95 bbox. */
export function projectToViewBox(
  lon: number,
  lat: number,
  [minE, minN, maxE, maxN]: readonly number[],
  [, , width, height]: readonly number[],
): [number, number] {
  const [e, n] = wgs84ToLv95(lon, lat);
  return [((e - minE) / (maxE - minE)) * width, ((maxN - n) / (maxN - minN)) * height];
}
