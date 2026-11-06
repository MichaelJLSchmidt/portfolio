/**
 * The case-study template's fixed labels (headings, captions, the trail and the bands), in their
 * own module so the case-study client components bundle them without the cards' data or the
 * cards' own labels. cards.ts re-exports them.
 */
export const caseStudyLabels = {
  /** The page title's second part: "<name> — Case study". */
  caseStudy: "Case study",
  /** Above the H1 of a flagged example. */
  exampleLine: "Example — fictional case study",
  /** The header plate's meta line: "Case study 01 · <type line>". */
  number: (n: number) => `Case study ${String(n).padStart(2, "0")}`,
  /** The contents trail: the page's parts, in order. */
  contents: {
    summary: "Summary",
    context: "Context",
    findings: "Findings",
    decisions: "Decisions",
    leading: "Leading the team",
    outcome: "Outcome",
    reflection: "Reflection",
  },
  /** The phone's sticky disclosure. */
  contentsToggle: "Contents",
  onThisPage: "On this page",
  /** A chapter's mono line: "01 · Context". */
  chapter: (n: number, name: string) => `${String(n).padStart(2, "0")} · ${name}`,
  summaryHeading: "Summary",
  summary: { problem: "Problem", role: "My role", team: "Team · Duration · Reach", keyDecision: "Key decision", outcome: "Outcome" },
  brief: "The brief",
  teamLed: "Team I led",
  putInPlace: "What I put in place",
  didNotDo: "What I did not do",
  readingTime: (minutes: number) => `${minutes} min read`,
  sideNote: (n: number) => `Side note ${n}`,
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
  /** A decision's options: status in text, never colour alone. */
  options: {
    heading: "The options we weighed",
    columns: { option: "Option", pros: "For", cons: "Against", cost: "Cost" },
    chosen: "Chosen",
    notChosen: "Not chosen",
    reversed: "Reversed",
    turnedBack: (date: string) => `Turned back · ${date}`,
    /** Under a decision step: the way taken. */
    taken: "We chose",
  },
  reversedHeading: "A decision we reversed",
  afterLaunchHeading: "What happened after launch",
  logColumns: ["Date", "What we observed"] as const,
  resultsHeading: "Results",
  /** A metric tile: "from 18 %", "Won at Discovery". */
  from: (before: string) => `from ${before}`,
  wonAt: (stage: string) => `Won at ${stage}`,
  lookingBack: "Looking back",
  team: "Team",
  evidence: {
    measured: { label: "Measured", text: "counted in system logs or a manual file count" },
    estimated: { label: "Estimated", text: "extrapolated from a sample" },
    qualitative: { label: "Qualitative", text: "observed or reported, not counted" },
  },
  evidenceLegend: "Evidence",
  credits: "Credits",
  next: "Next case study",
  backToAll: "Back to case studies",
  example: "Fictional example",
};
