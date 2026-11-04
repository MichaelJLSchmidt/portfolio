import data from "./geo-data.json";
import { formatInteger } from "@/lib/format";
import { coordinatesLabel, lv95ToWgs84 } from "@/lib/geo";

/**
 * Verified place data: the summits of the three case studies and the About climb. Every
 * altitude carries its source; the values come from swisstopo through `npm run geo`
 * (scripts/geo/build.mjs, configured in scripts/geo/geo.config.json), which writes geo-data.json.
 *
 * - Altitudes are official spot heights from swissNAMES3D (2025), cross-checked against the
 *   swissALTI3D height service (`dem`); the two agree within 2 m everywhere except the Jungfrau
 *   railway's stations inside the mountain (Eismeer, Jungfraujoch), where the DEM reads the rock
 *   above the tunnel.
 * - Unnamed points on a ridge (the upper Mittellegi ridge, the Mönch's southeast ridge) take the
 *   height service's value on the crest.
 * - Where the brief's research values disagreed, swisstopo won; each place keeps its `conflict`:
 *   Eiger 3’967 (not 3’970), Eismeer 3’160 (not 3’118), Mönchsjoch hut 3’656 (not 3’657 or 3’650),
 *   Mönch 4’110 (not 4’107), Rottalsattel 3’877 (not 3’885), Mittellegi hut 3’354 (not 3’355),
 *   Eigergletscher 2’322 (not 2’320), the Bantiger tower's foot 937 (not 933).
 * - Secondary values (not swisstopo) are flagged `secondary`: the tip of the Bantiger tower,
 *   about 1’129 m (German Wikipedia).
 *
 * Drawings are stylised; the numbers are not.
 */
export type Place = {
  label: string;
  /** LV95 easting and northing (m). */
  e?: number;
  n?: number;
  altitudeM: number;
  /** Where the altitude comes from. */
  source: string;
  /** The swissALTI3D height service at the same point (m), the cross-check. */
  dem?: number;
  /** A railway station: the stages above the last one are climbed (the route's blazed dash). */
  station?: true;
  /** The research value and how it was resolved (swisstopo wins). */
  conflict?: string;
  note?: string;
  /** No swisstopo answer: the research value, to verify. */
  unverified?: true;
  /** Not a swisstopo value. */
  secondary?: true;
};

export type PlaceId = keyof typeof data.places;
export const places = data.places as Record<PlaceId, Place>;
export const secondary = data.secondary as Record<keyof typeof data.secondary, Place>;
export const geoSources = data.sources;

/** Each case study's summit, by its card's terrain (the mountain the card's plate was cut around). */
export const summits = {
  /** Seilschaft: the Eiger. */
  eiger: "eiger",
  /** Test Project: the Mönch. */
  moench: "moench",
  /** Gratweg: the Jungfrau. */
  jungfrau: "jungfrau",
} as const satisfies Record<string, PlaceId>;

/** "2’061 M" (mono labels set it upper case). */
export const altitudeLabel = (m: number) => `${formatInteger(m)} m`;

/** The About climb: Ittigen station → Bolligen → Ferenberg → Bantiger, along the hiking trails. */
export const aboutClimb = {
  ...data.aboutClimb,
  stops: data.aboutClimb.via.map((id, i) => ({ id: id as PlaceId, ...places[id as PlaceId], atM: data.aboutClimb.stopsAtM[i] })),
  /** The telecom tower on the summit: its foot from swisstopo, its tip from a secondary source. */
  tower: { foot: places["bantiger-tower"], tip: secondary["bantiger-tower-tip"] },
  points: data.aboutClimb.points as [number, number][],
};

/** A case study's summit (its card's terrain): name, altitude and coordinates, for the set line and the header plate. */
export function summitOf(terrainId: string): { label: string; altitude: string; coordinates: string | null } | null {
  if (!(terrainId in summits)) return null;
  const summit = places[summits[terrainId as keyof typeof summits]];
  const coordinates = summit.e && summit.n ? coordinatesLabel(...lv95ToWgs84(summit.e, summit.n)) : null;
  return { label: summit.label, altitude: altitudeLabel(summit.altitudeM), coordinates };
}
