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

/** LV95 → WGS84 (swisstopo's approximate formulas, about 1 m). Returns [lon, lat] in degrees. */
export function lv95ToWgs84(e: number, n: number): [number, number] {
  const y = (e - 2_600_000) / 1_000_000;
  const x = (n - 1_200_000) / 1_000_000;
  const lon = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y * y * y;
  const lat = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.014 * x * x * x;
  return [(lon * 100) / 36, (lat * 100) / 36];
}

/** "46.578 N 8.005 E": a survey mark's coordinates, three decimals. */
export const coordinatesLabel = (lon: number, lat: number) => `${lat.toFixed(3)} N ${lon.toFixed(3)} E`;
