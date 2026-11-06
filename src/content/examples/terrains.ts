import terrains from "@terrain/examples.json";

/**
 * The examples' card terrains (public/terrain/examples.json, written by npm run terrain), apart
 * from their cards: the card artwork (a client component) needs only these. A live build swaps
 * this module for none.ts too (next.config.ts).
 */
export const exampleTerrains: Record<string, unknown> = terrains.cards;
