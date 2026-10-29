import { ex } from "./example-values";

/**
 * The home page, top to bottom: hero, Summit log, Trail rules, Expeditions (the deck), Field
 * notes, Workshops, Contact. Leadership proof comes before the work: who, at what level, what
 * changed, how I lead, then the expeditions. Components render only what is here.
 *
 * Invented values are written as ex("…") (src/content/example-values.ts): check:content lists
 * them and a live build stops on them until real ones replace them.
 */
export const home = {
  meta: {
    description:
      "UX Team Lead in Bern: I lead UX teams that make public services people can actually finish. Team building, design systems and workshop facilitation.",
  },
  hero: {
    /** The mono line above the name, read as one line with " · " between the parts. */
    eyebrow: ["UX Team Lead", "Bern, Switzerland", ex("8 years in public-sector digital")],
    /** Visible from first paint (it may be the LCP element). */
    statement: "I lead UX teams that make public services people can actually finish.",
    support:
      "Team lead, workshop facilitator and former front-end developer. I build the team, the system and the alignment, then get out of the way.",
    actions: { expeditions: "See the expeditions", basecamp: "Basecamp" },
    scrollCue: "Descend to the expeditions",
  },
  summitLog: {
    eyebrow: "Summit log",
    heading: "What changed",
    entries: [
      { value: ex("2 → 6"), label: "designers in the UX practice I built" },
      { value: ex("9"), label: "products running on the shared design system" },
      { value: ex("38% → 82%"), label: "applications completed on the flagship service" },
      { value: ex("120+"), label: "workshops facilitated, from kick-off to retro" },
    ],
    smallPrint: "Example figures. Real numbers replace them before launch.",
  },
  trailRules: {
    eyebrow: "Trail rules",
    heading: "How I lead",
    evidenceLabel: "Evidence",
    rules: [
      {
        title: "Clear the path, then step aside.",
        text: "I set direction and remove blockers; designers own their decisions.",
        evidence: ex("Most design calls in 2025 were made without me in the room."),
      },
      {
        title: "Rope up early.",
        text: "Legal, developers and operations join at workshop one, not workshop three.",
        evidence: ex("The subsidy service cleared its signature question in month one."),
      },
      {
        title: "Measure the climb.",
        text: "No change without a baseline, no baseline without a method.",
        evidence: ex("Every expedition below starts with a before number."),
      },
      {
        title: "Leave the trail better marked.",
        text: "Systems, docs and career paths should outlast me.",
        evidence: ex("The career ladder I wrote is now used by three departments."),
      },
    ],
  },
  expeditions: {
    eyebrow: "Expeditions",
    heading: ex("Three kinds of leadership"),
    intro: ex("One team, one system, one service. Each card is a different kind of climb."),
    /** The section without a single case study (a live build until the first one is written). */
    emptyHeading: "Expeditions",
    empty: "The expedition logs are being written up. Until then, ask me for a walkthrough.",
    indexLabel: "The expeditions at a glance",
  },
  fieldNotes: {
    eyebrow: "Field notes",
    heading: "From the people on the rope",
    exampleTag: "Example quote",
    notes: [
      {
        quote: ex("He turned UX from a service desk into a partner we plan the roadmap with."),
        source: ex("Head of Product, cantonal IT provider"),
      },
      {
        quote: ex("The first workshop was the first time legal and development agreed on anything before launch."),
        source: ex("Lead Architect"),
      },
      {
        quote: ex("He gave me the room to lead the design system, and the cover when it got political."),
        source: ex("Senior UX Designer, his team"),
      },
    ],
  },
  workshops: {
    eyebrow: "Workshops",
    heading: "Alignment is a design problem",
    lead: "Trained at Hyper Island, I design workshops the way I design products: for the people in the room and the decision they need to leave with.",
    formats: [
      { name: "Kick-off ascent", length: ex("2 days") },
      { name: "Decision summit", length: "half day" },
      { name: "Trail retro", length: ex("90 min") },
      { name: "Crit circle", length: "weekly" },
    ],
    formatsLabel: "Workshop formats",
    proof: { count: ex("120+"), text: "sessions with product owners, legal, developers and citizens." },
  },
  contact: {
    eyebrow: "Next ascent",
    heading: "Planning a climb that needs a lead?",
    line: "I’m open to Design Manager, Head of UX and Head of Design roles in Switzerland or in remote-first teams.",
  },
};
