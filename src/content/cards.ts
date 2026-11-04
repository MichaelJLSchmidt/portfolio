import { exampleCards } from "@/content/examples";
import { cardHref } from "./card-labels";

/**
 * Case-study cards: the single source for every card (the home page's "Case studies", the next
 * case study's mini card). Case-study pages live in case-studies.ts. Components render only what is
 * here. [PLACEHOLDERS] mark facts still to confirm; numbers in the examples are {{tokens}} into
 * their data file (check:figures).
 */
export type CardData = {
  slug: string;
  name: string;
  /** The year the project ended: the card's label row. */
  year: string;
  /** The type line: sector · role · team size. */
  sector: string;
  role: string;
  teamSize: string;
  /** The project's reach, for the case study's summary (Team · Duration · Reach). */
  reach?: string;
  /** The headline number: the case study's metric band shows `after`. */
  impact?: { before: string; after: string };
  /** The summit terrain: the card's plate, the case study's header plate and its field. */
  terrainId: string;
  /** What the plate shows, for the header plate's alternative text. */
  artworkAlt: string;
  /** Where the card leads. Defaults to its case study at /work/<slug>/. */
  href?: string;
  /**
   * A fictional example (src/content/examples): labelled on the card and the page, last on the
   * home page, and never part of a live build. Its values are invented on purpose, so
   * check:content skips it.
   */
  example?: true;
};

// The labels and the per-card helpers live apart from the cards' data, so client components that
// need only them don't bundle every card.
export { cardLabels, cardHref, typeLine } from "./card-labels";
export { caseStudyLabels } from "./case-study-labels";

/** Real project cards. None is written yet: a live build's "Case studies" is empty and says so. */
const projectCards: CardData[] = [];

/** The cards: project cards, then the flagged examples where the build includes them (last). */
export const cards: CardData[] = [...projectCards, ...exampleCards];

export const cardBySlug = (slug: string) => cards.find((c) => c.slug === slug);

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * Every card route with its terrain ("/work/<slug>/" → terrain id): the root layout hands this
 * small map to the field (html[data-card-terrains], read by route-terrain.ts), so the cards' data
 * never ships in the shared client bundle.
 */
export const cardTerrains = (): Record<string, string> => Object.fromEntries(cards.map((c) => [withSlash(cardHref(c)), c.terrainId]));
