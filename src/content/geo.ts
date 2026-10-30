import data from "./geo-data.json";
import { formatInteger } from "@/lib/format";

/**
 * Verified place data: the stages of the three ascents (case studies) and the About climb. Every
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

/** An ascent: six stages from Interlaken, then the summit (the case study's Results). */
export type Ascent = {
  summit: PlaceId;
  /** The way up, as a mountaineer would name it ("via the Mittellegi ridge"). */
  via: string;
  stages: readonly [PlaceId, PlaceId, PlaceId, PlaceId, PlaceId, PlaceId];
};

export const ascents = {
  /** Seilschaft climbs the Eiger by the Mittellegi ridge. */
  eiger: { summit: "eiger", via: "the Mittellegi ridge", stages: ["interlaken-ost", "grindelwald", "kleine-scheidegg", "eismeer", "mittellegi-hut", "mittellegi-ridge"] },
  /** Test Project climbs the Mönch by its southeast ridge. */
  moench: { summit: "moench", via: "the southeast ridge", stages: ["interlaken-ost", "kleine-scheidegg", "eigergletscher", "jungfraujoch", "moenchsjoch-hut", "moench-se-ridge"] },
  /** Gratweg climbs the Jungfrau by the Rottalsattel. */
  jungfrau: { summit: "jungfrau", via: "the Rottalsattel", stages: ["interlaken-ost", "lauterbrunnen", "kleine-scheidegg", "jungfraujoch", "moenchsjoch-hut", "rottalsattel"] },
} as const satisfies Record<string, Ascent>;

export type AscentId = keyof typeof ascents;

/** The index of an ascent's last railway station: the stages after it are climbed on foot. */
export const lastStation = (a: Ascent): number => a.stages.reduce((last, id, i) => (places[id].station ? i : last), -1);

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
