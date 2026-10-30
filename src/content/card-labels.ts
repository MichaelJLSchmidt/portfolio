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

export const caseStudyLabels = {
  /** The page title's second part: "<name> — Case study · <name source>". */
  caseStudy: "Case study",
  /** Above the H1 of a flagged example. */
  exampleLine: "Example — fictional case study",
  problem: "The problem",
  result: "The result",
  /** Under the result's climb line: "+3’400 m from Interlaken Ost". */
  gain: (from: string) => `from ${from}`,
  facts: { role: "Role", team: "Team", time: "Time" },
  summaryHeading: "Summary",
  /** The summary's margin: "Sheet 2/3" (this case study among the three). */
  sheet: (n: number, of: number) => `Sheet ${n}/${of}`,
  scale: "1 : 25 000",
  brief: "The brief",
  outcome: "Outcome",
  role: "My role",
  teamLed: "Team I led",
  putInPlace: "What I put in place",
  keyDecision: "Key decision",
  didNotDo: "What I did not do",
  jumpTo: "On this page",
  onThisPage: "On this page",
  /** A stage's mono line: "Stage 3 · Kleine Scheidegg · 2’061 m". */
  stage: (n: number) => `Stage ${n}`,
  stageLine: (n: number, place: string, altitude: string) => `Stage ${n} · ${place} · ${altitude}`,
  /** The phone's reading bar: "Stage 2 of 6 · Grindelwald". */
  stageOf: (n: number, of: number, place: string) => `Stage ${n} of ${of} · ${place}`,
  sideNote: (n: number) => `Side note ${n}`,
  nextWaypoint: "Next stage",
  backToTop: "Back to top",
  readingTime: (minutes: number) => `${minutes} min read`,
  skim: "60-second summary below",
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
  /** The fork diagram's words: status in text, never colour alone. */
  fork: {
    options: "Options",
    chosen: "Chosen",
    notChosen: "Not chosen",
    reversed: "Reversed",
    pros: "For",
    cons: "Against",
    cost: "Cost",
    turnedBack: (date: string) => `Turned back · ${date}`,
  },
  reversedHeading: "A decision we reversed",
  afterLaunchHeading: "What happened after launch",
  logColumns: ["Date", "What we observed"] as const,
  resultsHeading: "Results",
  resultColumns: { metric: "Metric", before: "Before", after: "After", wonAt: "Won at" },
  lookingBack: "Looking back",
  team: "Team",
  evidence: {
    measured: { label: "Measured", text: "counted in system logs or a manual file count" },
    estimated: { label: "Estimated", text: "extrapolated from a sample" },
    qualitative: { label: "Qualitative", text: "observed or reported, not counted" },
  },
  evidenceLegend: "Evidence",
  credits: "Credits",
  next: "Next project",
  previous: "Previous project",
  youAreHere: "You are here",
  /** The ridge of the three projects in the Next project band. */
  ridge: "The three projects",
  back: "All projects",
  backToAll: "All projects",
  example: "Fictional example",
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
