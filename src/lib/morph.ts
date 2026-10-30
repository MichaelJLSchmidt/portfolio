/** View-transition names shared by the deck card and its case-study header. */
export const morphName = (part: "art" | "title", slug: string) => `${part}-${slug}`;

/**
 * Basecamp's shared element: the HUD's Basecamp link label on every route except /about/, the
 * Basecamp H1 on /about/. One owner per state, since a duplicate name aborts a View Transition.
 */
export const BASECAMP_MORPH = "basecamp-title";
