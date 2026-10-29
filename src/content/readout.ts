/**
 * The terrain readout's copy (TerrainReadout, in the HUD): what each part is called, and the home
 * region's summit, which the readout shows on the home page. Kept small on purpose: the readout
 * is client code.
 */
export const readoutCopy = {
  /** The home region reads its summit. */
  home: { label: "Jungfrau", altitudeM: 4158 },
  east: "E",
  north: "N",
  altitude: "ALT",
  unit: "M",
  separator: " · ",
};
