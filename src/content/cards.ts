import type { Rarity } from "@/styles/tokens";

/**
 * Summit Cards: the single source for every card and its case study.
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
export type Stat = { label: string; value: string };

export type SetSymbol = "peak" | "grid";

export type CaseStudy = {
  lede: string;
  summary: {
    problem: string;
    role: string;
    team: string;
    duration: string;
    reach: string;
    keyDecision: string;
    outcome: string;
  };
  sections: { id: string; title: string; body: string }[];
};

export type SummitCardData = {
  slug: string;
  name: string;
  rarity: Rarity;
  /** Summit cost badge, 1–5 for projects; the leader card shows its birth altitude. */
  cost: string;
  costLabel: string;
  coordinates: string;
  type: string;
  set: { code: string; name: string; symbol: SetSymbol };
  collector: { number: string; language: string };
  keywords: Keyword[];
  flavor: string;
  stats: [Stat, Stat, Stat];
  artwork: Artwork;
  artworkAlt: string;
  back: { summary: string; linkLabel: string };
  caseStudy: CaseStudy;
};

export const cardLabels = {
  flipToBack: (name: string) => `Flip card: ${name}`,
  announceBack: (name: string) => `${name}: showing the back of the card`,
  announceFront: (name: string) => `${name}: showing the front of the card`,
  openLog: "Open expedition log",
  costPrefix: "Summit cost",
  stats: "Card stats",
  collector: "Collector line",
  rarity: (r: string) => `Rarity ${r}`,
  setSymbol: (set: string) => `Set ${set}`,
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
  next: "Next expedition",
  back: "Back to the deck",
};

export const cards: SummitCardData[] = [
  {
    slug: "profile",
    name: "[FULL NAME]",
    rarity: "M",
    cost: "566",
    costLabel: "Birth altitude 566 m",
    coordinates: "N 46°41′ · E 7°52′ · Interlaken",
    type: "Leader — UX Team Lead · DV Bern AG",
    set: { code: "IKN", name: "Interlaken", symbol: "peak" },
    collector: { number: "000", language: "EN" },
    keywords: [
      { term: "Facilitation", reminder: "Hyper Island-trained workshop lead" },
      { term: "Design Systems", reminder: "driving a central Angular Material system" },
      { term: "Front-end", reminder: "designs in Figma, ships in code" },
    ],
    flavor: "Born at 566 m. Still climbing.",
    stats: [
      { label: "Team", value: "4 FTE" },
      { label: "At DV Bern", value: "8+ yrs" },
      { label: "Workshops led", value: "[#]" },
    ],
    artwork: {
      kind: "crop",
      terrainId: "ikn-000",
      trail: [
        { lon: 7.8632, lat: 46.6863 },
        { lon: 7.8689, lat: 46.6658 },
        { lon: 7.902, lat: 46.6316 },
        { lon: 7.9089, lat: 46.5935 },
        { lon: 7.9216, lat: 46.605 },
        { lon: 7.9614, lat: 46.5853 },
        { lon: 7.974, lat: 46.5743 },
        { lon: 7.985, lat: 46.5475 },
        { lon: 7.9625, lat: 46.5372 },
      ],
      waypoints: [
        { lon: 7.8632, lat: 46.6863, label: "Interlaken", elevation: "566 m" },
        { lon: 7.9089, lat: 46.5935 },
        { lon: 7.9614, lat: 46.5853 },
        { lon: 7.9625, lat: 46.5372, label: "Jungfrau", elevation: "4158 m" },
      ],
      labels: [
        { lon: 7.76, lat: 46.697, text: "Thunersee", elevation: "558" },
        { lon: 7.94, lat: 46.708, text: "Brienzersee", elevation: "564" },
      ],
    },
    artworkAlt:
      "Contour map from Interlaken between Lake Thun and Lake Brienz up to the Jungfrau, with a dotted trail and four waypoints.",
    back: {
      summary:
        "UX Team Lead at DV Bern AG for more than eight years. Runs the workshops, drives the central Angular Material design system and designs straight into code. [SUMMARY]",
      linkLabel: "Open expedition log",
    },
    caseStudy: {
      lede: "[LEDE] How a team of four designers works across public-sector platforms at DV Bern AG.",
      summary: {
        problem: "[PROBLEM]",
        role: "UX Team Lead — [ROLE DETAILS]",
        team: "4 FTE",
        duration: "8+ yrs",
        reach: "[REACH]",
        keyDecision: "[KEY DECISION]",
        outcome: "[OUTCOME]",
      },
      sections: [
        { id: "team", title: "The team", body: "[TEAM STORY]" },
        { id: "design-system", title: "Design system", body: "[DESIGN SYSTEM STORY]" },
        { id: "workshops", title: "Workshops", body: "[WORKSHOP STORY]" },
      ],
    },
  },
  {
    slug: "kibon",
    name: "kiBon 2.0",
    rarity: "U",
    cost: "[#]",
    costLabel: "Summit cost [#] of 5",
    coordinates: "N 46°57′ · E 7°27′ · Bern · [YEARS]",
    type: "Platform — Public sector · Kanton Bern",
    set: { code: "DVB", name: "DV Bern", symbol: "grid" },
    collector: { number: "001", language: "EN" },
    keywords: [
      { term: "UX Design", reminder: "the UX designer behind kiBon" },
      { term: "User Story Mapping", reminder: "anchor method for planning 2.0" },
      { term: "Facilitation", reminder: "neutral moderator of the client validation workshop" },
    ],
    flavor: "Childcare subsidies in one platform, for parents, providers and the administration.",
    stats: [
      { label: "Team", value: "[#]" },
      { label: "Months", value: "[#]" },
      { label: "Reach", value: "[#]" },
    ],
    artwork: { kind: "seeded", terrainId: "dvb-001" },
    artworkAlt: "Contour map of a fictional massif generated for this project, with a dotted trail to the summit.",
    back: {
      summary:
        "kiBon brings childcare subsidies for the Canton of Bern into one platform for parents, providers and the administration. Version 2.0 was planned with User Story Mapping. [SUMMARY]",
      linkLabel: "Open expedition log",
    },
    caseStudy: {
      lede: "[LEDE] Planning and designing the second generation of the Canton of Bern's childcare-subsidy platform.",
      summary: {
        problem: "[PROBLEM]",
        role: "UX designer and workshop moderator — [ROLE DETAILS]",
        team: "[#]",
        duration: "[#] months",
        reach: "[#]",
        keyDecision: "[KEY DECISION]",
        outcome: "[OUTCOME]",
      },
      sections: [
        { id: "context", title: "Context", body: "[CONTEXT]" },
        { id: "story-mapping", title: "User Story Mapping", body: "[STORY MAPPING]" },
        { id: "validation", title: "Validation workshop", body: "[VALIDATION WORKSHOP]" },
        { id: "outcome", title: "Outcome", body: "[OUTCOME DETAILS]" },
      ],
    },
  },
];

export const cardBySlug = (slug: string) => cards.find((c) => c.slug === slug);

export const terrainIdForPath = (pathname: string | null): string | null => {
  const match = pathname?.match(/\/work\/([^/]+)\/?$/);
  return match ? (cardBySlug(match[1])?.artwork.terrainId ?? null) : null;
};
