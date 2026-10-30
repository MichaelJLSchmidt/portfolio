import meta from "@terrain/terrain.json";
import { exampleTerrains } from "@/content/examples/terrains";

/**
 * A card's generated terrain (npm run terrain): artwork SVG, trail and pins, and the field's
 * morph heightmap. Written out rather than inferred from terrain.json, so the type holds when a
 * build has no project cards of its own (a live build without examples has none at all).
 */
export type CardTerrain = {
  kind: "crop" | "seeded";
  svg: string;
  viewBox: number[];
  contourIntervalM: number;
  indexEvery: number;
  /** Crop cards: the crop in LV95 metres. */
  bboxLv95: number[] | null;
  /** Seeded cards: the trail and pins as fractions of the artwork box. */
  trail: number[][] | null;
  pins: { x: number; y: number; elevationM: number }[] | null;
  morph: {
    file: string;
    width: number;
    height: number;
    sha256: string;
    gradientM: Record<string, number>;
    probe: number[][];
    raw: { file: string; bytes: number };
    elevation: { min: number; max: number };
    encoding: { channels: string; offset: number; scale: number };
  };
};

// Flagged examples keep theirs in public/terrain/examples.json, so live bundles carry none of it.
const terrains = { ...(meta.cards as Record<string, unknown>), ...exampleTerrains } as Record<string, CardTerrain>;

export const cardTerrain = (id: string): CardTerrain | undefined => terrains[id];
