import type { SummitCardData } from "@/content/cards";
import terrains from "@terrain/examples.json";
import { card as testProject } from "./test-project/card";

/**
 * Flagged examples: fictional case studies that demonstrate the page format. Each one is marked
 * `example: true` on its card and case study, sits last in the deck, carries a banner, a card
 * stamp and noindex, and exists only where includesExamples() (src/hosting/config.ts) allows:
 * basecamp builds, local previews and `npm run dev`. A live build swaps this module and
 * ./case-studies for none.ts (next.config.ts); scripts/site/build.mjs then removes their files
 * from out/ and fails if anything of theirs is left.
 *
 * This module is small on purpose (the deck imports it); the long-form copy is in ./case-studies.
 */
export const exampleCards: SummitCardData[] = [testProject];

/** The examples' card terrains (public/terrain/examples.json, written by npm run terrain). */
export const exampleTerrains: Record<string, unknown> = terrains.cards;

/** Each example's encoded images under public/, by slug. */
export const exampleMedia: Record<string, string> = { "test-project": "/media/test-project/" };
