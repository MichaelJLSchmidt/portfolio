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

/** A pocket of the card binder: an original card (no game's logo, art or frame), or an empty one. */
export type Pocket =
  | { kind: "deck"; game: string; line: string }
  | { kind: "trainer"; line: string }
  | { kind: "workshop"; line: string }
  | { kind: "empty" };

export const about = {
  meta: {
    title: site.nav.about,
    description:
      "About a UX Team Lead in Bern: who I am, how I work with people, how I start with a new team, the skills beyond design, and the way from front-end developer to team lead.",
  },
  /**
   * The portrait card in the About title: the cut-out portrait on a thin card frame (rarity M,
   * collector number 000); "Show facts" turns it over to the facts. Until the photo is supplied
   * (scripts/portrait.mjs, docs/content.md) a contour silhouette stands in and `missing` is a
   * placeholder, so a live build stops on it.
   */
  portrait: {
    /** After `npm run portrait -- cutout.png`: the import of ./portrait.json (and remove `missing`). */
    image: null as null | { width: number; height: number; sources: { format: string; width: number; src: string }[] },
    missing: "[PORTRAIT PHOTO]",
    alt: `Portrait of ${site.name}`,
    placeholderLabel: "Portrait to come",
    showFacts: "Show facts",
    showPhoto: "Show photo",
    rarity: "M" as Rarity,
    collector: "000",
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
    intro: "From front-end code to leading a team, drawn on a real trail near Bern: from Ittigen up to the Bantiger, the line is the terrain along it, from swisstopo elevation data.",
    /** The camps' list (its accessible name): the roles, each with its height on the trail. */
    caption: "Roles along the way",
    camps,
    /** The summit camp: "UX Team Lead · today". */
    summit: (title: string, year: string) => `${title} · ${year}`,
    /** On the transmitter mast above the summit: the outlook, and a tiny label on the mast. */
    outlook: "947 m. Not the top. There’s still room to grow.",
    mast: "Luft nach oben",
    /** The mast's tip (a secondary source, so "about"). */
    tip: (height: string) => `≈ ${height} m`,
    /** Under the drawing: the trail's places with their heights, its length and the data's source. */
    trail: (places: string, km: string) => `${places} · ${km} km · elevation: swisstopo`,
  },
  craft: {
    heading: "Tools and craft",
    body: "I still prototype in code, keep a Figma-to-Angular token pipeline running, and built this site myself. A lead who can read a pull request gets better estimates.",
  },
  cards: {
    heading: "Away from work: cards",
    body: "I play trading card games: Magic: The Gathering, the One Piece Card Game and Yu-Gi-Oh!. A good card game is a rule system that has to be clear at a glance, which is not far from designing a public service. That’s why the projects on this site are cards.",
    /** The binder page: nine pockets of original cards; a tap turns one over to its line. */
    binder: {
      label: "Card binder",
      /** The pockets' lines, also listed as text under the binder. */
      listLabel: "In the binder",
      deckBox: "Deck box",
      /** A deck box's name: "Deck box · Magic: The Gathering". */
      cardName: (kind: string, game: string) => `${kind} · ${game}`,
      trainer: "Trainer card",
      workshop: "Workshop card",
      empty: "Still collecting",
      pockets: [
        { kind: "deck", game: "Magic: The Gathering", line: ex("Commander, mostly: a hundred cards, one of each.") },
        { kind: "trainer", line: "The person behind the decks, in the same frame as the projects." },
        { kind: "deck", game: "One Piece Card Game", line: ex("Fast games on weeknights.") },
        { kind: "workshop", line: ex("About 40 workshops since 2019: each ends with a decision.") },
        { kind: "empty" },
        { kind: "deck", game: "Yu-Gi-Oh!", line: ex("The game I learned rules lawyering from.") },
        { kind: "empty" },
        { kind: "empty" },
        { kind: "empty" },
      ] as Pocket[],
    },
  },
  /** The under-construction page's inert stand-in for a link without a URL yet. */
  placeholderAction: (label: string) => `[${label.toUpperCase()}]`,
};

/** A binder pocket's card name ("Deck box · Magic: The Gathering"), for its button and the list. */
export function pocketName(p: Pocket): string {
  const b = about.cards.binder;
  if (p.kind === "deck") return b.cardName(b.deckBox, p.game);
  return p.kind === "trainer" ? b.trainer : p.kind === "workshop" ? b.workshop : b.empty;
}

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
