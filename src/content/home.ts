import { ex } from "./example-values";

/**
 * The home page, top to bottom: the name and its tags, a short intro, How I lead, Selected work
 * (the cards, id="work"), Earlier work and Get in touch. Components render only what is here.
 *
 * Invented values are written as ex("…") (src/content/example-values.ts): check:content lists
 * them and a live build stops on them until real ones replace them.
 */
export const home = {
  meta: {
    description:
      "UX Team Lead in Bern: I lead a small UX team that designs public services people understand on the first try. How I lead, selected work and how to reach me.",
  },
  hero: {
    /** One row of tags under the name. */
    tags: ["UX Team Lead", "Senior UX Designer", "Bern, Switzerland"],
  },
  intro: {
    /** At most three lines, visible from the first frame (it may be the LCP element). */
    text: ex(
      "I lead a small UX team at a cantonal IT services provider in Bern. We design public services that people understand on the first try, and my job is to give the team the time, the methods and the backing to do that.",
    ),
    more: "More about me",
  },
  lead: {
    heading: "How I lead",
    evidenceLabel: "Evidence",
    /** Four principles; each title passes the plain-label test, the illustration carries the metaphor. */
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
  work: {
    heading: "Selected work",
    intro: "Three projects I led, from the first problem to measured results.",
    /** The section without a single case study (a live build until the first one is written). */
    empty: "The case studies are being written up. Until then, ask me for a walkthrough.",
    /** Under each card: what it was, what changed, what I did. */
    caption: { problem: "Problem", result: "Result", role: "Role" },
  },
};
