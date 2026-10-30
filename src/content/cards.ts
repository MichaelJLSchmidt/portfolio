import { exampleCards } from "@/content/examples";
import { cardHref } from "./card-labels";
import type { Rarity } from "@/styles/tokens";

/**
 * Summit Cards: the single source for every card. Case-study pages live in case-studies.ts.
 * Components render only what is here. [PLACEHOLDERS] mark facts still to confirm.
 */

export type GeoPoint = { lon: number; lat: number };

export type Waypoint = GeoPoint & {
  /** Visible pin label, e.g. "Interlaken". Omit for an unlabelled pin. */
  label?: string;
  elevation?: string;
};

export type MapLabel = GeoPoint & { text: string; elevation?: string };

export type Artwork =
  | {
      /**
       * A crop of the real swisstopo terrain. Its trail and pins come from the terrain metadata
       * (the verified places it was cut around, npm run terrain), or from geographic points here.
       */
      kind: "crop";
      terrainId: string;
      trail?: GeoPoint[];
      waypoints?: Waypoint[];
      labels?: MapLabel[];
    }
  | {
      /** Seeded terrain; trail and pins come from the generated terrain metadata. */
      kind: "seeded";
      terrainId: string;
    };

export type Keyword = { term: string; reminder: string };
/** Leave `value` out (or the whole stat) until there is a real number: empty stats don't render. */
export type Stat = { label: string; value?: string };

/**
 * The card's stats. Every one is optional (leave it out until there is a real number). The stat
 * row shows at most three, TEAM LED, TIME and IMPACT (before → after), and disappears without
 * any; the scope joins the coordinates line instead.
 */
export type CardStats = {
  /** e.g. "3 + 7" (direct + wider team) or "2 → 6" (grown). */
  teamLed?: string;
  time?: string;
  /** e.g. "9 products": the coordinates line, after the place. */
  scope?: string;
  /** The headline outcome; `note` says what the numbers count ("on system"), under the value. */
  impact?: { before: string; after: string; note?: string };
};

/** One line for an index of projects: "<name> — <kind> · <summary> · <time>". */
export type IndexLine = { kind: string; summary: string; time: string };

export type SetSymbol = "peak" | "grid" | "lab";

export type SummitCardData = {
  slug: string;
  name: string;
  rarity: Rarity;
  /** Why the card has its rarity, read with the rarity mark (e.g. "led the team and the UX strategy"). */
  rarityNote?: string;
  /** Summit cost badge, 1–5. */
  cost: string;
  coordinates: string;
  type: string;
  set: { code: string; name: string; symbol: SetSymbol };
  collector: { number: string; language: string };
  keywords: Keyword[];
  flavor: string;
  stats: CardStats;
  indexLine: IndexLine;
  artwork: Artwork;
  artworkAlt: string;
  /** Two-sentence summary shown under the card in the deck. */
  summary: string;
  /** Where the card leads. Defaults to its case study at /work/<slug>/. */
  href?: string;
  /**
   * A fictional example (src/content/examples): stamped on the card, last in the deck, and
   * never part of a live build. Its values are invented on purpose, so check:content skips it.
   */
  example?: true;
};

// The labels and the per-card helpers live apart from the cards' data, so client components that
// need only them (the case-study bands, the card itself) don't bundle every card.
export { cardLabels, caseStudyLabels, cardHref, coordinatesLine, cardStats, COST_SCALE } from "./card-labels";

/** Real project cards. None is written yet: a live build's deck is empty and says so (Deck). */
const projectCards: SummitCardData[] = [];

/** The deck: project cards, then the flagged examples where the build includes them (last). */
export const cards: SummitCardData[] = [...projectCards, ...exampleCards];

export const cardBySlug = (slug: string) => cards.find((c) => c.slug === slug);

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * The terrain the contour field should morph to on a given route (a card's own terrain). Other
 * routes, Basecamp (/about/) included, return null: the region.
 */
export const terrainIdForPath = (pathname: string | null): string | null => {
  if (!pathname || pathname === "/") return null;
  const path = withSlash(pathname);
  return cards.find((c) => withSlash(cardHref(c)) === path)?.artwork.terrainId ?? null;
};

/**
 * Every card route with its terrain ("/work/<slug>/" → terrain id): the root layout hands this
 * small map to the field (html[data-card-terrains], read by route-terrain.ts), so the cards' data
 * never ships in the shared client bundle.
 */
export const cardTerrains = (): Record<string, string> =>
  Object.fromEntries(cards.flatMap((c) => (c.artwork.terrainId ? [[withSlash(cardHref(c)), c.artwork.terrainId]] : [])));
