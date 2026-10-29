import bern from "@terrain/bern/summary.json";
import { cards } from "@/content/cards";
import { cardTerrain } from "@/lib/card-terrain";
import { readoutCopy as t } from "@/content/readout";
import { formatInteger } from "@/lib/format";
import { BERN } from "./route-terrain";

/**
 * What the field is showing, as a surveyor's readout: a place, its LV95 coordinates where they
 * are known, and an altitude. Bern reads the zero point and the DEM's altitude there (written
 * by npm run terrain:bern; a placeholder terrain has none), the home region its summit, a card
 * whatever its terrain metadata knows (the centre of a real crop, the top of a seeded massif).
 * A fictional example's terrain shows its name and an altitude, never coordinates.
 */
export type Readout = {
  /** Terrain id (null: the home region). */
  id: string | null;
  label: string;
  /** LV95 east and north (metres), or null. */
  e: number | null;
  n: number | null;
  altitudeM: number | null;
};

export type ReadoutPart =
  | { key: "label"; text: string }
  | { key: "e" | "n" | "alt"; prefix: string; value: number; suffix: string };

export const READOUT_SEPARATOR = t.separator;

export function readoutFor(id: string | null): Readout {
  if (id === BERN) {
    const z = bern.zeroPoint;
    return { id, label: bern.label, e: z.e, n: z.n, altitudeM: z.altitudeM };
  }
  if (id) {
    const terrain = cardTerrain(id);
    const card = cards.find((c) => c.artwork.terrainId === id);
    const bbox = card?.example ? null : terrain?.bboxLv95;
    return {
      id,
      label: card?.name ?? id,
      e: bbox ? Math.round((bbox[0] + bbox[2]) / 2) : null,
      n: bbox ? Math.round((bbox[1] + bbox[3]) / 2) : null,
      altitudeM: terrain ? Math.round(terrain.morph.elevation.max) : null,
    };
  }
  return { id: null, label: t.home.label, e: null, n: null, altitudeM: t.home.altitudeM };
}

/** The readout's parts in reading order; numbers stay numbers so they can roll. */
export function readoutParts(r: Readout): ReadoutPart[] {
  const parts: ReadoutPart[] = [{ key: "label", text: r.label.toUpperCase() }];
  if (r.e !== null) parts.push({ key: "e", prefix: `${t.east} `, value: r.e, suffix: "" });
  if (r.n !== null) parts.push({ key: "n", prefix: `${t.north} `, value: r.n, suffix: "" });
  if (r.altitudeM !== null) parts.push({ key: "alt", prefix: `${t.altitude} `, value: r.altitudeM, suffix: ` ${t.unit}` });
  return parts;
}

/** "BERN · E 2’600’000 · N 1’200’000 · ALT 554 M": the same on the server and in every browser. */
export function formatReadout(r: Readout): string {
  return readoutParts(r)
    .map((p) => (p.key === "label" ? p.text : `${p.prefix}${formatInteger(p.value)}${p.suffix}`))
    .join(READOUT_SEPARATOR);
}
