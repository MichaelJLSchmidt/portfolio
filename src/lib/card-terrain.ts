import meta from "@terrain/terrain.json";
import { exampleTerrains } from "@/content/examples";

/** A card's generated terrain: artwork SVG, trail and pins, and the field's morph heightmap. */
export type CardTerrain = (typeof meta.cards)[keyof typeof meta.cards];

// Flagged examples keep theirs in public/terrain/examples.json, so live builds carry none of it.
const terrains = { ...meta.cards, ...exampleTerrains } as Record<string, CardTerrain>;

export const cardTerrain = (id: string): CardTerrain | undefined => terrains[id];
