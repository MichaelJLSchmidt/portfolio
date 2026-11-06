/** View-transition names shared by the deck card and its case-study header. */
export const morphName = (part: "art" | "title", slug: string) => `${part}-${slug}`;

/**
 * About's shared element: the HUD's About link label on every route except /about/, the About H1
 * on /about/. One owner per state, since a duplicate name aborts a View Transition.
 */
export const ABOUT_MORPH = "about-title";
