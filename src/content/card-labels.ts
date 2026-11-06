import type { SummitCardData, Stat } from "./cards";

/**
 * The cards' and case studies' fixed labels, and the helpers that read one card: kept apart from
 * the cards' data (cards.ts, which re-exports all of this) so a client component that needs only
 * these doesn't bundle every card.
 */
export const cardLabels = {
  openLog: "Open case study",
  /** The card link's accessible name. */
  open: (name: string, type: string, rarity: string) => `Open case study: ${name}, ${type}, rarity ${rarity}`,
  costPrefix: "Summit cost",
  /** The cost pips, read as the project's scope (the pips are drawn, not read). */
  scope: (n: number, of: number) => `Scope ${n} of ${of}`,
  stats: "Card stats",
  stat: { teamLed: "Team led", time: "Time", impact: "Impact" },
  /** Under the impact's after-value: where it started. */
  from: (before: string) => `from ${before}`,
  /** A card whose case study was visited: the stamp, and what screen readers hear. */
  visitedStamp: "Visited",
  visited: "Visited",
  collector: "Collector line",
  rarity: (r: string) => `Rarity ${r}`,
  setSymbol: (set: string) => `Set ${set}`,
  exampleStamp: "Fictional example",
};

export const cardHref = (card: SummitCardData) => card.href ?? `/work/${card.slug}/`;

/** The coordinates line: the place, then the scope. */
export const coordinatesLine = (card: SummitCardData) => [card.coordinates, card.stats.scope].filter(Boolean).join(" · ");

/**
 * The card's stats as rows, at most three: team led, time and impact. The impact shows its
 * after-value; `note` carries "from <before>" (and what the numbers count) under it.
 */
export const cardStats = (card: SummitCardData): (Stat & { note?: string })[] => {
  const { teamLed, time, impact } = card.stats;
  return [
    { label: cardLabels.stat.teamLed, value: teamLed },
    { label: cardLabels.stat.time, value: time },
    { label: cardLabels.stat.impact, value: impact?.after, note: impact && [cardLabels.from(impact.before), impact.note].filter(Boolean).join(" · ") },
  ];
};

/** The cost pips' scale: a card's cost is its scope, 1 to 5. */
export const COST_SCALE = 5;
