/**
 * Which titles carry the contour flood: on hover, keyboard focus or a tap a glacier fill spreads
 * through them from where the pointer came in (src/components/interaction/flood.ts). Switch any of
 * them off here; docs/content.md explains.
 */
export const flood = {
  /** The display name in the home page's hero. */
  heroName: true,
  /** Home section titles. */
  sections: { lead: true, work: true, earlier: true, contact: true },
  /** Each case study's H1. */
  caseStudyTitle: true,
  /** The outline wordmark in the footer. */
  footerWordmark: true,
  /** Every button (FloodButton). */
  buttons: true,
};
