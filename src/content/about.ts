import { cardBySlug, type Stat } from "./cards";

/**
 * About page ("Basecamp"): who leads the rope team, what they carry and how they climb.
 * Components render only what is here. [PLACEHOLDERS] mark facts still to confirm;
 * actions without a real URL yet render as visible, inert placeholders.
 */

export type Action = { label: string; href: string | null; kind: "email" | "linkedin" | "cv" };

export type Milestone = {
  year: string;
  title: string;
  org: string;
  note: string;
  /** Position along the ascent profile, 0 (Interlaken) to 1 (Jungfrau). */
  at: number;
};

const leader = cardBySlug("profile")!;

const actions: Action[] = [
  { label: "Email", href: "mailto:michael.jl.schmidt@bluewin.ch", kind: "email" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/michaeljlschmidt/", kind: "linkedin" },
  { label: "Download CV (PDF)", href: null, kind: "cv" },
];

const milestones: Milestone[] = [
  { year: "[YEAR]", title: "[EDUCATION]", org: "[SCHOOL]", note: "[ONE LINE ABOUT WHAT STARTED IT]", at: 0.06 },
  { year: "[YEAR]", title: "[FIRST ROLE]", org: "[COMPANY]", note: "[ONE LINE OF IMPACT]", at: 0.3 },
  {
    year: "[YEAR]",
    title: "Hyper Island training",
    org: "Hyper Island",
    note: "Facilitation becomes a method, not a talent. [DETAIL]",
    at: 0.48,
  },
  { year: "[YEAR]", title: "UX Designer", org: "DV Bern AG", note: "Public-sector platforms. [DETAIL]", at: 0.64 },
  {
    year: "[YEAR]",
    title: "UX Team Lead",
    org: "DV Bern AG",
    note: "Leads a team of four and drives the central Angular Material design system.",
    at: 0.84,
  },
  { year: "Now", title: "Still climbing", org: "", note: "[WHAT'S NEXT]", at: 1 },
];

export const about = {
  /** The card that opens this page; its artwork and name morph into the header. */
  cardSlug: leader.slug,
  meta: {
    title: "Basecamp — Michael JL Schmidt, UX Team Lead",
    description:
      "About a UX Team Lead from Interlaken: facilitation, design systems and front-end craft, told as an ascent from 566 m to the Jungfrau.",
  },
  header: {
    eyebrow: "Basecamp · About",
    name: leader.name,
    role: "UX Team Lead · Senior UX Designer",
    place: "Interlaken · 566 m · Swiss Alps",
    statement:
      "[POSITIONING STATEMENT] I lead a team of four designers at DV Bern AG and design public-sector platforms people actually finish using.",
  },
  actions,
  placeholderAction: (label: string) => `[${label.toUpperCase()}]`,
  summary: {
    heading: "Summit summary",
    rows: [
      { label: "Current role", value: "UX Team Lead · DV Bern AG", wide: true },
      { label: "Team", value: "4 FTE", stat: true },
      { label: "At DV Bern", value: "8+ yrs", stat: true },
      { label: "Workshops led", value: "[#]", stat: true },
      { label: "Strengths", value: "Facilitation · Design Systems · Front-end", wide: true },
      { label: "Domains", value: "Public-sector platforms · [DOMAINS]", wide: true },
      { label: "Tools", value: "Figma · Angular Material · [TOOLS]" },
      { label: "Languages", value: "[LANGUAGES]" },
      { label: "Based in", value: "Interlaken · [AVAILABILITY]" },
    ],
  },
  ascent: {
    heading: "The ascent",
    intro:
      "A career as the real climb from Interlaken to the Jungfrau: the line below is the terrain along that trail, sampled from swisstopo elevation data.",
    readout: { altitude: "Alt", distance: "Km" },
    milestones,
  },
  principles: {
    heading: "Rope team",
    intro: "How I lead: a few trail markers the team can follow without me.",
    // `metric` is optional: add one per principle once there is a real number.
    items: [
      {
        title: "Facilitate, don't dictate",
        body: "Decisions get better when the people who carry them make them together. [EXAMPLE]",
        metric: "[#] workshops",
      },
      {
        title: "Systems over screens",
        body: "One shared Angular Material system instead of a hundred one-off screens. [EXAMPLE]",
      },
      {
        title: "Design in the medium",
        body: "Figma for thinking, code for deciding: prototypes that ship. [EXAMPLE]",
      },
    ],
  },
  craft: {
    heading: "Craft",
    intro: "The three keywords on the leader card, with the evidence behind them.",
    // Same wording as the leader card, so the card and this page never drift apart.
    // Stats are optional: add them per keyword once there are real numbers (1–3 each).
    items: leader.keywords.map((k, i) => ({
      ...k,
      evidence: ["[WORKSHOP FORMATS AND OUTCOMES]", "[DESIGN SYSTEM SCOPE AND ADOPTION]", "[SHIPPED COMPONENTS, STORYBOOK]"][i],
      stats: ([[{ label: "Workshops", value: "[#]" }], [], []] as Stat[][])[i],
    })),
  },
  offTrail: {
    heading: "Off the trail",
    body: "[PERSONAL NOTE] Interlaken sits between two lakes and below three famous peaks. Weekends usually start uphill.",
    flavor: leader.flavor,
  },
  contact: {
    heading: "Plan a route together",
    body: "Hiring for a UX lead, a design-system owner or a workshop facilitator? Let's talk.",
  },
};

/**
 * The under-construction page production serves until launch, and the Basecamp password
 * gate, which shares its design. `npm run check:content` in construction mode requires only
 * the facts used here: the name and the email and LinkedIn links.
 */
export const holding = {
  name: leader.name,
  role: "UX Team Lead · Senior UX Designer · Bern",
  status: "Basecamp is being set up. The expedition starts soon.",
  /** Title and meta description, built from the name and role. */
  meta: {
    title: (name: string) => `${name} · UX Team Lead · Senior UX Designer`,
    description: (name: string) =>
      `${name}, UX Team Lead and Senior UX Designer in Bern, Switzerland. The portfolio is being set up; get in touch by email or on LinkedIn.`,
  },
  contact: actions.filter((a) => a.kind === "email" || a.kind === "linkedin"),
  hud: { coordinates: "46.6863° N · 7.8632° E", altitude: "ALT 566 M", clock: "Bern" },
  access: {
    heading: "Basecamp access",
    label: "Password",
    submit: "Enter basecamp →",
    error: "Wrong password. Try again.",
    closed: "Basecamp is closed for now.",
    username: "basecamp",
  },
};
