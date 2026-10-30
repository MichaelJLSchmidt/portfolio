/**
 * Ways to get in touch: the single source for the email, LinkedIn and CV links (the HUD, the home
 * page, Basecamp and the under-construction page read them from here). A link without a URL yet
 * is `href: null`: it renders as a visible, inert placeholder, check:content lists it, and a live
 * build stops on it.
 */
export type Action = { label: string; href: string | null; kind: "email" | "linkedin" | "cv" };

export const actions: Action[] = [
  { label: "Email", href: "mailto:michael.jl.schmidt@bluewin.ch", kind: "email" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/michaeljlschmidt/", kind: "linkedin" },
  { label: "CV (PDF, 2 pages)", href: null, kind: "cv" },
];

/** The CV on its own (the HUD's "CV" and the hero's button). */
export const cv = actions.find((a) => a.kind === "cv")!;

/** The "Copy address" button beside Email in the contact band, and the toast it raises. */
export const copyAddress = {
  label: "Copy address",
  done: "COPIED",
  toast: "COPIED — see you at the trailhead.",
  failed: (address: string) => `Couldn’t copy. The address is ${address}.`,
  dismiss: "Dismiss",
};
