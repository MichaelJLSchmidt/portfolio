import type { Rarity } from "@/styles/tokens";
import { actions } from "./contact";
import { ex } from "./example-values";
import { site } from "./site";

export type { Action } from "./contact";

/**
 * Basecamp (/about/): where I live and how I lead, for a hiring manager who reads one page. It is
 * reached from the HUD's Basecamp link, whose label morphs into the page's H1. Components render
 * only what is here. Invented values are written as ex("…") (src/content/example-values.ts) and
 * facts still to confirm as [PLACEHOLDERS]: check:content lists both, and a live build stops on
 * them.
 */

/** A camp on the career climb: a role, with its card rarity (C, U, R, M as on the cards). */
export type Camp = {
  year: string;
  title: string;
  rarity: Rarity;
  /** Position along the ascent profile, 0 (Interlaken) to 1 (Jungfrau). */
  at: number;
};

const camps: Camp[] = [
  { year: ex("2018"), title: "Front-end developer", rarity: "C", at: 0.08 },
  { year: ex("2019"), title: "UX designer", rarity: "C", at: 0.3 },
  { year: ex("2020"), title: "Senior UX designer", rarity: "U", at: 0.52 },
  { year: ex("2021"), title: "UX Team Lead", rarity: "R", at: 0.76 },
  { year: "Next", title: "Head of UX / Design Manager", rarity: "M", at: 1 },
];

export const about = {
  meta: {
    title: `Basecamp — ${site.name}, UX Team Lead`,
    description:
      "Basecamp: a UX Team Lead in Bern on how I lead, what working with me is like, my first 90 days in a new team, and the climb from front-end developer to team lead.",
  },
  header: {
    /** The H1: the HUD's Basecamp label, which morphs into it (the same word on both ends). */
    heading: site.nav.basecamp,
    lead: "Every Swiss map is measured from a point in Bern. It’s also where I live, and where every climb gets planned.",
  },
  legend: {
    heading: "Map legend",
    rows: [
      { label: "Role", value: ex("UX Team Lead, cantonal IT services provider") },
      { label: "Team", value: ex("6 in UX, seated in product clusters") },
      { label: "Base", value: ex("Bern · born in Interlaken") },
      { label: "Trained", value: ex("Hyper Island") },
      { label: "Languages", value: ex("German (native) · English (working) · French [LEVEL TO CONFIRM]") },
      { label: "Open to", value: ex("Design Manager · Head of UX · Head of Design") },
    ],
  },
  bio: {
    heading: "Bio",
    paragraphs: [
      ex(
        "I started as a front-end developer, which is why I still think in components, constraints and release trains. Moving into UX made me care about the person on the other side of the form; leading a team made me care about the people on this side.",
      ),
      ex(
        "For eight years I’ve worked on digital services for public administration: childcare subsidies, permits, internal tools nobody wanted to talk about. My team designs, researches and prototypes in code, and we run the workshops that get legal, operations and development to one decision.",
      ),
      ex(
        "I’m looking for my next ascent: a team to grow, a design practice to shape, and leadership peers who see design as part of how the organisation decides, not how it decorates.",
      ),
    ],
  },
  ropeRules: {
    eyebrow: "Rope rules",
    heading: "Working with me",
    rules: [
      { lead: "Weekly 1:1s are yours.", text: "You set the agenda; I bring one question and one piece of feedback." },
      {
        lead: "Decisions sit with the person closest to the problem.",
        text: "I decide when a decision is irreversible, cross-team, or when you ask me to.",
      },
      { lead: "Crit is for the work, never the person.", text: ex("Weekly, 45 minutes, written notes, one owner per follow-up.") },
      {
        lead: "I protect focus.",
        text: "Requests come through one intake, so nobody on the team is ambushed two weeks before a release.",
      },
      { lead: "Growth is written down.", text: "Everyone has a ladder level, a next step and a date we review it." },
      { lead: "I say “I don’t know” out loud.", text: "Then I tell you when I’ll know." },
    ],
  },
  firstDays: {
    eyebrow: "Acclimatise before you climb",
    heading: "My first 90 days",
    steps: [
      {
        days: "Days 1–30",
        title: "Listen",
        text: "1:1s with every designer, PM and engineering lead; sit in on research; read the last six months of decisions.",
      },
      {
        days: "Days 31–60",
        title: "Map",
        text: "One shared picture of the team, the products and the pain; agree on the two problems we fix first.",
      },
      {
        days: "Days 61–90",
        title: "Commit",
        text: "A team charter, an intake process and one visible win the organisation can point to.",
      },
    ],
  },
  ascent: {
    heading: "Career climb",
    intro:
      "From front-end code to leading a practice, drawn on the real climb from Interlaken to the Jungfrau: the line is the terrain along that trail, sampled from swisstopo elevation data.",
    /** The camps' letters, read as on the cards. */
    rarityNote: "Letters as on the cards: C common · U uncommon · R rare · M mythic",
    /** Read before a camp's letter: "Rarity R, rare". */
    rarityLabel: "Rarity",
    readout: { altitude: "Alt", distance: "Km" },
    /** Official heights of the named ends of the trail (the profile's labels). */
    stops: { Interlaken: "566 m", Jungfrau: "4158 m" } as Record<string, string>,
    camps,
  },
  craft: {
    eyebrow: "Craft",
    heading: "Kept sharp",
    body: "I still prototype in code, keep a Figma-to-Angular token pipeline running, and built this site myself. A leader who can read a pull request gets better estimates.",
  },
  offMap: {
    heading: "Off the map",
    body: "Mountains on weekends, trading card games on weeknights (Magic, One Piece, Yu-Gi-Oh), and a seat on our employee representation board, because how a company treats its people is a design problem too.",
  },
  contactLine: "Coffee in Bern or a call anywhere.",
  /** The under-construction page's inert stand-in for a link without a URL yet. */
  placeholderAction: (label: string) => `[${label.toUpperCase()}]`,
};

/**
 * The under-construction page production serves until launch, and the Basecamp password
 * gate, which shares its design. `npm run check:content` in construction mode requires only
 * the facts used here: the name and the email and LinkedIn links.
 */
export const holding = {
  name: site.name,
  role: "UX Team Lead · Senior UX Designer · Bern",
  status: "The route is being marked. If you were given the password, step in.",
  /** Title and meta description, built from the name and role. */
  meta: {
    title: (name: string) => `${name} · UX Team Lead · Senior UX Designer`,
    description: (name: string) =>
      `${name}, UX Team Lead and Senior UX Designer in Bern, Switzerland. The portfolio is being set up; get in touch by email or on LinkedIn.`,
  },
  contact: actions.filter((a) => a.kind === "email" || a.kind === "linkedin"),
  hud: { coordinates: "46.6863° N · 7.8632° E", altitude: "ALT 566 M", clock: "Bern" },
  access: {
    heading: "Trail under construction",
    label: "Password",
    submit: "Enter basecamp →",
    /** The submit button while the password is being checked. */
    pending: "CHECKING…",
    error: "That’s not the password. Check the message you received, or write to me.",
    closed: "Basecamp is closed for now.",
    username: "basecamp",
  },
};
