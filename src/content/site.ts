/**
 * The name source: the only place the display name and the brand are written. Titles, metadata,
 * the manifest, the hero, the HUD, the footer wordmark (generated from `brand` at build time), the
 * under-construction page and the gate read them from here, so a change of name is one edit.
 */
const name = "Michael JL Schmidt";
/** The short brand: the HUD's home link, the footer wordmark, the manifest's short name. */
const brand = "MJLS";

/** Site-wide copy. Components read from here; nothing user-facing is hardcoded in components. */
export const site = {
  name,
  brand,
  title: `${name} — UX Team Lead`,
  /** Every other page's title: "<page> · <name>". */
  titleTemplate: `%s · ${name}`,
  description:
    "UX Team Lead in Bern, Switzerland: I lead a small UX team that designs public services people understand on the first try.",
  lang: "en",
  /** The home page's own copy is in home.ts. */
  hero: { name },
  /** Main navigation, the HUD: brand (home) · Work · About, then the switches. */
  nav: {
    label: "Main",
    /** The brand link's accessible name; it starts with the visible brand (WCAG 2.5.3). */
    home: `${brand}, home`,
    work: "Work",
    about: "About",
  },
  hud: {
    /**
     * The motion switch. Its visible label is always "Calm map" and is also its name (WCAG 2.5.3
     * Label in Name); the switch itself shows on or off. The description adds why it is on and
     * locked when the OS asks for reduced motion.
     */
    calm: {
      label: "Calm map",
      description: "Reduces motion on this site",
      forced: "Your device asks for reduced motion, so the map stays still. Change it in your system settings.",
    },
    /** Shown only where vibration works (Android); the visible label is its name. */
    haptics: "Haptics",
  },
  footer: {
    label: "Site",
    credit: "Terrain data © swisstopo",
    creditHref: "https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices",
    built: "Built by hand with Next.js, WebGL and Motion",
    place: "Bern, 2026",
  },
  skipLink: "Skip to content",
  notFound: {
    title: "Page not found",
    eyebrow: "404",
    heading: "Page not found",
    body: "This page doesn’t exist.",
    back: "Back to the start page",
  },
} as const;
