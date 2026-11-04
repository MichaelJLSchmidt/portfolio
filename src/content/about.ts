import { actions } from "./contact";
import { ex } from "./example-values";
import { site } from "./site";

export type { Action } from "./contact";

/**
 * About (/about/): who I am and how I work, for a hiring manager who reads one page. Components
 * render only what is here. Invented values are written as ex("…") (src/content/example-values.ts) and facts still
 * to confirm as [PLACEHOLDERS]: check:content lists both, and a live build stops on them.
 */

/** A camp on the career profile: a role, where it stands on the Ittigen → Bantiger trail. */
export type Camp = {
  year: string;
  title: string;
  /** Position along the trail, 0 (Ittigen) to 1 (the Bantiger). */
  at: number;
};

const camps: Camp[] = [
  { year: ex("2018"), title: "Front-end developer", at: 0 },
  { year: ex("2019"), title: "UX designer", at: 0.36 },
  { year: ex("2020"), title: "Senior UX designer", at: 0.7 },
  { year: "today", title: "UX Team Lead", at: 1 },
];

export const about = {
  meta: {
    title: site.nav.about,
    description:
      "About a UX Team Lead in Bern: who I am, how I work with people, how I start with a new team, the skills beyond design, and the way from front-end developer to team lead.",
  },
  /**
   * The portrait slot beside the intro. Until the photo is supplied (scripts/portrait.mjs,
   * docs/content.md) a contour silhouette stands in and `missing` is a placeholder, so a live
   * build stops on it.
   */
  portrait: {
    /** After `npm run portrait -- cutout.png`: the import of ./portrait.json (and remove `missing`). */
    image: null as null | { width: number; height: number; sources: { format: string; width: number; src: string }[] },
    missing: "[PORTRAIT PHOTO]",
    alt: `Portrait of ${site.name}`,
    placeholderLabel: "Portrait to come",
  },
  header: {
    /** The H1: the header's About label, the same word. */
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
  /** How I lead: four principles with their evidence (the leadership band, on the sheet). */
  lead: {
    heading: "How I lead",
    evidenceLabel: "Evidence:",
    /** Four principles; each title passes the plain-label test. */
    principles: [
      {
        title: "Clear the path, then step aside",
        text: "I set direction and remove blockers; designers own their decisions.",
        evidence: ex("Removed two approval steps so designers could test every week."),
      },
      {
        title: "Bring people in early",
        text: "Legal, developers and operations join at workshop one, not workshop three.",
        evidence: ex("Developers join from the first workshop, not at the handover."),
      },
      {
        title: "Measure before we change",
        text: "No change without a baseline, no baseline without a method.",
        evidence: ex("Every project starts with a baseline task-success test."),
      },
      {
        title: "Leave the system better",
        text: "Patterns, docs and career paths should outlast any one project.",
        evidence: ex("Each project adds a pattern to our design system."),
      },
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
      },
      {
        name: "Coaching designers",
        text: "1:1s and critique that build judgement, not dependence.",
        proof: ex("Two designers grown into senior roles"),
      },
      {
        name: "Aligning stakeholders",
        text: "In public administration a yes needs many signatures; I map them early.",
        proof: ex("One decision log per project, signed off by legal"),
      },
      {
        name: "Writing plainly",
        text: "Interfaces, decisions and documentation in words people understand.",
        proof: ex("Content guidelines used by four product teams"),
      },
      {
        name: "Bridging design and code",
        text: "Years as a front-end developer mean I know what a design costs to build.",
        proof: ex("Five years of front-end development before UX"),
      },
      {
        name: "Moderating conflict",
        text: "I make disagreements explicit and time-boxed.",
        proof: ex("Decision workshops with legal, IT and operations"),
      },
    ],
  },
  career: {
    heading: "Career so far",
    intro: "From front-end code to leading a team, drawn on a real trail near Bern: from Ittigen up to the Bantiger, the line is the terrain along it.",
    /** The camps' list (its accessible name): the roles, each with its height on the trail. */
    caption: "Roles along the way",
    camps,
    /** The summit camp: "UX Team Lead · today". */
    summit: (title: string, year: string) => `${title} · ${year}`,
    /** Under the drawing: the trail's places, its length and the data's source. */
    trail: (places: string, km: string) => `${places} · ${km} km · terrain: swisstopo`,
  },
  craft: {
    heading: "Tools and craft",
    body: "I still prototype in code, keep a Figma-to-Angular token pipeline running, and built this site myself. A lead who can read a pull request gets better estimates.",
  },
  cards: {
    heading: "Away from work: cards",
    body: "I play trading card games: Magic: The Gathering, the One Piece Card Game and Yu-Gi-Oh!. A good card game is a rule system that has to be clear at a glance, which is not far from designing a public service. That’s why the projects on this site are cards.",
    /** What is in the binder, as a list. */
    listLabel: "In the binder",
    items: [
      { name: "Magic: The Gathering", line: ex("Commander, mostly: a hundred cards, one of each.") },
      { name: "One Piece Card Game", line: ex("Fast games on weeknights.") },
      { name: "Yu-Gi-Oh!", line: ex("The game I learned rules lawyering from.") },
    ],
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
