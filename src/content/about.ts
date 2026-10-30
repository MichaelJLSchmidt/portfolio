import type { Rarity } from "@/styles/tokens";
import { actions } from "./contact";
import { ex } from "./example-values";
import { site } from "./site";

export type { Action } from "./contact";

/**
 * About (/about/): who I am and how I work, for a hiring manager who reads one page. It is reached
 * from the HUD's About link, whose label morphs into the page's H1. Components render only what
 * is here. Invented values are written as ex("…") (src/content/example-values.ts) and facts still
 * to confirm as [PLACEHOLDERS]: check:content lists both, and a live build stops on them.
 */

/** A camp on the career profile: a role, with its card rarity (C, U, R, M as on the cards). */
export type Camp = {
  year: string;
  title: string;
  rarity: Rarity;
  /** Position along the profile, 0 (start) to 1 (summit). */
  at: number;
};

const camps: Camp[] = [
  { year: ex("2018"), title: "Front-end developer", rarity: "C", at: 0.1 },
  { year: ex("2019"), title: "UX designer", rarity: "C", at: 0.38 },
  { year: ex("2020"), title: "Senior UX designer", rarity: "U", at: 0.66 },
  { year: "today", title: "UX Team Lead", rarity: "R", at: 1 },
];

export const about = {
  meta: {
    title: site.nav.about,
    description:
      "About a UX Team Lead in Bern: who I am, how I work with people, how I start with a new team, the skills beyond design, and the way from front-end developer to team lead.",
  },
  header: {
    /** The H1: the HUD's About label, which morphs into it (the same word on both ends). */
    heading: site.nav.about,
    lead: ex("UX Team Lead in Bern. I build teams that design public services people understand on the first try."),
  },
  who: {
    heading: "Who I am",
    facts: {
      label: "Facts",
      rows: [
        { label: "Role", value: ex("UX Team Lead, cantonal IT services provider") },
        { label: "Team", value: ex("6 in UX, seated in product clusters") },
        { label: "Based", value: ex("Bern") },
        { label: "Born", value: ex("Interlaken") },
        { label: "Trained", value: ex("Hyper Island") },
        { label: "Languages", value: ex("German (native) · English (working) · French [LEVEL TO CONFIRM]") },
      ],
    },
    paragraphs: [
      ex(
        "I started as a front-end developer, which is why I still think in components, constraints and release trains. Moving into UX made me care about the person on the other side of the form; leading a team made me care about the people on this side.",
      ),
      ex(
        "For eight years I’ve worked on digital services for public administration: childcare subsidies, permits, internal tools nobody wanted to talk about. My team designs, researches and prototypes in code, and we run the workshops that get legal, operations and development to one decision.",
      ),
    ],
  },
  workingRules: {
    heading: "How I work with people",
    rules: [
      { lead: "Weekly 1:1s are yours.", text: "You set the agenda; I bring one question and one piece of feedback." },
      {
        lead: "Decisions sit with the person closest to the problem.",
        text: "I decide when a decision is irreversible, cross-team, or when you ask me to.",
      },
      { lead: "Critique is for the work, never the person.", text: ex("Weekly, 45 minutes, written notes, one owner per follow-up.") },
      {
        lead: "I protect focus.",
        text: "Requests come through one intake, so nobody on the team is surprised by a request two weeks before a release.",
      },
      { lead: "Growth is written down.", text: "Everyone has a level, a next step and a date we review it." },
      { lead: "I say “I don’t know” out loud.", text: "Then I tell you when I’ll know." },
    ],
  },
  start: {
    heading: "How I start with a new team",
    steps: [
      {
        title: "Listen",
        text: "1:1s with every designer, product owner and engineering lead; sit in on research; read the last six months of decisions.",
      },
      {
        title: "Map",
        text: "One shared picture of the team, the products and the pain; agree on the two problems we fix first.",
      },
      {
        title: "Commit",
        text: "A team charter, an intake process and one visible win the organisation can point to.",
      },
    ],
  },
  skills: {
    heading: "Skills beyond design",
    proofLabel: "Proof",
    items: [
      {
        name: "Workshop facilitation",
        text: "Workshops that end with decisions, not sticky notes.",
        proof: ex("About 40 since 2019"),
        icon: "workshop",
      },
      {
        name: "Coaching designers",
        text: "1:1s and critique that build judgement, not dependence.",
        proof: ex("Two designers grown into senior roles"),
        icon: "coaching",
      },
      {
        name: "Aligning stakeholders",
        text: "In public administration a yes needs many signatures; I map them early.",
        proof: ex("One decision log per project, signed off by legal"),
        icon: "stakeholders",
      },
      {
        name: "Writing plainly",
        text: "Interfaces, decisions and documentation in words people understand.",
        proof: ex("Content guidelines used by four product teams"),
        icon: "writing",
      },
      {
        name: "Bridging design and code",
        text: "Years as a front-end developer mean I know what a design costs to build.",
        proof: ex("Five years of front-end development before UX"),
        icon: "code",
      },
      {
        name: "Moderating conflict",
        text: "I make disagreements explicit and time-boxed.",
        proof: ex("Decision workshops with legal, IT and operations"),
        icon: "conflict",
      },
    ],
  },
  career: {
    heading: "Career so far",
    intro: "From front-end code to leading a team, drawn on a real trail: the line is the terrain along it, from swisstopo elevation data.",
    /** The camps' letters, read as on the cards. */
    rarityNote: "Letters as on the cards: C common · U uncommon · R rare · M mythic",
    /** Read before a camp's letter: "Rarity R, rare". */
    rarityLabel: "Rarity",
    readout: { altitude: "Alt", distance: "Km" },
    /** Official heights of the named ends of the trail (the profile's labels). */
    stops: { Interlaken: "566 m", Jungfrau: "4158 m" } as Record<string, string>,
    camps,
    outlook: "947 m. Not the top. There’s still room to grow.",
  },
  craft: {
    heading: "Tools and craft",
    body: "I still prototype in code, keep a Figma-to-Angular token pipeline running, and built this site myself. A lead who can read a pull request gets better estimates.",
  },
  cards: {
    heading: "Away from work: cards",
    body: "I play trading card games: Magic: The Gathering, the One Piece Card Game and Yu-Gi-Oh!. A good card game is a rule system that has to be clear at a glance, which is not far from designing a public service. That’s why the projects on this site are cards.",
  },
  /** The under-construction page's inert stand-in for a link without a URL yet. */
  placeholderAction: (label: string) => `[${label.toUpperCase()}]`,
};

/**
 * The under-construction page production serves until launch, and the password gate, which
 * shares its design. `npm run check:content` in construction mode requires only the facts used
 * here: the name and the email and LinkedIn links.
 */
export const holding = {
  name: site.name,
  brand: site.brand,
  role: "UX Team Lead · Senior UX Designer · Bern",
  status: "This site is being built. If you have the password, you can look around.",
  /** Title and meta description, built from the name and role. */
  meta: {
    title: (name: string) => `${name} · UX Team Lead · Senior UX Designer`,
    description: (name: string) =>
      `${name}, UX Team Lead and Senior UX Designer in Bern, Switzerland. The site is being built; get in touch by email or on LinkedIn.`,
  },
  contact: actions,
  access: {
    heading: "Under construction",
    label: "Password",
    submit: "Look around →",
    /** The submit button while the password is being checked. */
    pending: "Checking…",
    error: "That’s not the password. Check the message you received, or write to me.",
    closed: "The preview is closed for now.",
    username: "preview",
  },
};
