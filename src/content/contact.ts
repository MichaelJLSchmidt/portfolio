/**
 * Ways to get in touch: the single source for the email and LinkedIn links (the home page, About,
 * the footer and the under-construction page read them from here). A link without a URL yet is
 * `href: null`: it renders as a visible, inert placeholder, check:content lists it, and a live
 * build stops on it.
 */
export type Action = { label: string; href: string | null; kind: "email" | "linkedin" };

export const actions: Action[] = [
  { label: "Email me", href: "mailto:michael.jl.schmidt@bluewin.ch", kind: "email" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/michaeljlschmidt/", kind: "linkedin" },
];

/** The address on its own (the footer repeats it), from the email link. */
export const emailAddress = (() => {
  const href = actions.find((a) => a.kind === "email")?.href;
  return href?.startsWith("mailto:") ? href.slice("mailto:".length) : null;
})();

/** "Get in touch" on home and About, and the footer. */
export const contact = {
  heading: "Get in touch",
  line: "Want to talk about a project, a workshop format, or UX in public administration? Write to me. I read every message.",
};

/** The "Copy address" button beside Email, and the toast it raises. */
export const copyAddress = {
  label: "Copy address",
  done: "Copied",
  toast: "Email address copied.",
  failed: (address: string) => `Couldn’t copy. The address is ${address}.`,
  dismiss: "Dismiss",
};
