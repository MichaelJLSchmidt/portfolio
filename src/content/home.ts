import { ex } from "./example-values";

/**
 * The home page, top to bottom: the role line, the name, one intro sentence, Case studies (the
 * cards, id="case-studies") and Earlier projects; Get in touch is the footer's. Components render
 * only what is here.
 *
 * Invented values are written as ex("…") (src/content/example-values.ts): check:content lists
 * them and a live build stops on them until real ones replace them.
 */
export const home = {
  meta: {
    description:
      "UX Team Lead in Bern: I lead a small UX team that designs public services people understand on the first try. Case studies, earlier projects and how to reach me.",
  },
  hero: {
    /** The mono role line above the name. */
    role: ["UX Team Lead", "Senior UX Designer", "Bern, Switzerland"],
  },
  intro: {
    /** Under the name, eight columns wide; visible from the first frame (it may be the LCP element). */
    text: ex(
      "I lead a small UX team at a cantonal IT services provider in Bern. We design public services that people understand on the first try, and my job is to give the team the time, the methods and the backing to do that.",
    ),
    more: "More about me",
  },
  work: {
    heading: "Case studies",
    /** The section without a single case study (a live build until the first one is written). */
    empty: "The case studies are being written up. Until then, ask me for a walkthrough.",
  },
  earlier: {
    heading: "Earlier projects",
    caption: "Earlier projects, newest first",
    /** Newest first, at most ten; a row links only once it has an `href`. Invented until the real list replaces it. */
    entries: [
      { year: ex("2024"), type: ex("Form patterns for a design system"), sector: ex("Cantonal administration"), role: ex("UX lead") },
      { year: ex("2023"), type: ex("Online permit application"), sector: ex("Municipal services"), role: ex("Lead UX designer") },
      { year: ex("2022"), type: ex("Intranet structure and search"), sector: ex("Public health"), role: ex("UX designer") },
      { year: ex("2021"), type: ex("Accessibility review of e-services"), sector: ex("Education"), role: ex("Reviewer") },
      { year: ex("2019"), type: ex("Front-end rebuild of a booking site"), sector: ex("Tourism"), role: ex("Front-end developer") },
      { year: ex("2018"), type: ex("Workshop series on service design"), sector: ex("Internal IT"), role: ex("Facilitator") },
    ] as { year: string; type: string; sector: string; role: string; href?: string }[],
  },
};
