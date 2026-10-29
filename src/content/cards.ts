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
  /** The headline outcome; `note` says what the numbers count ("on system"). */
  impact?: { before: string; after: string; note?: string };
};

/** One line for an index of expeditions: "<name> — <kind> · <summary> · <time>". */
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
  costLabel: string;
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

export const cardLabels = {
  openLog: "Open expedition log",
  costPrefix: "Summit cost",
  stats: "Card stats",
  stat: { teamLed: "Team led", time: "Time", impact: "Impact" },
  collector: "Collector line",
  rarity: (r: string) => `Rarity ${r}`,
  setSymbol: (set: string) => `Set ${set}`,
  exampleStamp: "Fictional example",
};

export const caseStudyLabels = {
  summaryHeading: "Summit summary",
  mandate: "Mandate",
  role: "My role",
  teamLed: "Team I led",
  putInPlace: "What I put in place",
  keyDecision: "Key decision",
  outcome: "Outcome",
  didNotDo: "What I did not do",
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

/** The coordinates line: the place, then the scope. */
export const coordinatesLine = (card: SummitCardData) => [card.coordinates, card.stats.scope].filter(Boolean).join(" · ");

/** The card's stats as rows, at most three: team led, time, impact (before → after). */
export const cardStats = (card: SummitCardData): Stat[] => {
  const { teamLed, time, impact } = card.stats;
  return [
    { label: cardLabels.stat.teamLed, value: teamLed },
    { label: cardLabels.stat.time, value: time },
    { label: cardLabels.stat.impact, value: impact && [`${impact.before} → ${impact.after}`, impact.note].filter(Boolean).join(" ") },
  ];
};

/** "Seilschaft — People · Built a UX practice from 2 to 6 · 3 years". */
export const indexLineText = (card: SummitCardData) => `${card.name} — ${[card.indexLine.kind, card.indexLine.summary, card.indexLine.time].join(" · ")}`;

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
