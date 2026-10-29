import { exampleCards } from "@/content/examples";
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
      /** A crop of the real swisstopo terrain; trail and pins are geographic. */
      kind: "crop";
      terrainId: string;
      trail: GeoPoint[];
      waypoints: Waypoint[];
      labels: MapLabel[];
    }
  | {
      /** Seeded terrain; trail and pins come from the generated terrain metadata. */
      kind: "seeded";
      terrainId: string;
    };

export type Keyword = { term: string; reminder: string };
/** Leave `value` out (or the whole stat) until there is a real number: empty stats don't render. */
export type Stat = { label: string; value?: string };

export type SetSymbol = "peak" | "grid" | "lab";

export type SummitCardData = {
  slug: string;
  name: string;
  rarity: Rarity;
  /** Why the card has its rarity, read with the rarity mark (e.g. "led the team and the UX strategy"). */
  rarityNote?: string;
  /** Summit cost badge, 1–5. */
  cost: string;
  costLabel: string;
  coordinates: string;
  type: string;
  set: { code: string; name: string; symbol: SetSymbol };
  collector: { number: string; language: string };
  keywords: Keyword[];
  flavor: string;
  /** Up to three; the row adapts to the stats that have a value and disappears without any. */
  stats?: Stat[];
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

export const cardLabels = {
  openLog: "Open expedition log",
  costPrefix: "Summit cost",
  stats: "Card stats",
  collector: "Collector line",
  rarity: (r: string) => `Rarity ${r}`,
  setSymbol: (set: string) => `Set ${set}`,
  exampleStamp: "Fictional example",
};

export const caseStudyLabels = {
  summaryHeading: "Summit summary",
  problem: "Problem",
  role: "My role",
  team: "Team",
  duration: "Duration",
  reach: "Reach",
  keyDecision: "Key decision",
  outcome: "Outcome",
  jumpTo: "Jump to",
  onThisPage: "On this page",
  nextWaypoint: "Next waypoint",
  backToTop: "Back to top",
  readingTime: (minutes: number) => `${minutes} min read`,
  skim: "60-second skim below",
  figure: (n: number) => `Fig. ${n}`,
  describe: "Describe this diagram",
  enlarge: "Enlarge",
  openFullSize: "Open full-size image",
  close: "Close",
  zoomGroup: "Zoom",
  reset: "Reset",
  zoomIn: (level: number) => `Zoom in, currently ${level}%`,
  zoomOut: (level: number) => `Zoom out, currently ${level}%`,
  zoomReset: (level: number) => `Reset zoom, currently ${level}%`,
  zoomStatus: (level: number) => `Zoom ${level}%`,
  zoomHint: "Drag to pan. Pinch, scroll or click to zoom.",
  compare: "Compare before and after",
  compareView: "View",
  before: "Before",
  after: "After",
  sideBySide: "Side by side",
  compareValue: (before: number) => `${before}% before, ${100 - before}% after`,
  noteMarker: (n: number, title: string) => `Note ${n}: ${title}`,
  keyInsight: "Key insight",
  decision: (n: number) => `Decision ${n}`,
  chose: "Chose",
  cost: "Cost",
  mitigation: "Mitigation",
  chosen: "Chosen",
  outcomeColumns: ["Metric", "Before", "After", "Evidence"] as const,
  evidence: {
    measured: { label: "Measured", text: "counted in system logs or a manual file count" },
    estimated: { label: "Estimated", text: "extrapolated from a sample" },
    qualitative: { label: "Qualitative", text: "observed or reported, not counted" },
  },
  evidenceLegend: "Evidence",
  credits: "Credits",
  next: "Next expedition",
  back: "Back to the deck",
  backToAll: "Back to all expeditions",
  example: "Fictional example",
};

/** Real project cards. None is written yet: a live build's deck is empty and says so (Deck). */
const projectCards: SummitCardData[] = [];

/** The deck: project cards, then the flagged examples where the build includes them (last). */
export const cards: SummitCardData[] = [...projectCards, ...exampleCards];

export const cardBySlug = (slug: string) => cards.find((c) => c.slug === slug);

export const cardHref = (card: SummitCardData) => card.href ?? `/work/${card.slug}/`;

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
