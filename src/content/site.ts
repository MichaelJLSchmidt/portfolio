/**
 * The name source: the only place the display name and the brand are written. Titles, metadata,
 * the manifest, the hero, the header, the footer wordmark, the
 * under-construction page and the gate read them from here, so a change of name is one edit.
 */
const name = "Michael JL Schmidt";
/** The short brand: the header's home link, the footer wordmark, the manifest's short name. */
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
  /** The header: brand (home) · Case studies · About · Contact. */
  nav: {
    label: "Main",
    /** The brand link's accessible name; it starts with the visible brand (WCAG 2.5.3). */
    home: `${brand}, home`,
    caseStudies: "Case studies",
    about: "About",
    contact: "Contact",
  },
  /** The footer's Motion control: Full · Calm · Off. The OS setting for reduced motion forces Off. */
  motion: {
    label: "Motion",
    options: { full: "Full", calm: "Calm", still: "Off" },
    forced: "Your device asks for reduced motion, so motion stays off. Change it in your system settings.",
  },
  footer: {
    label: "Site",
    clock: "Bern",
    credit: "Terrain data © swisstopo",
    creditHref: "https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices",
    copyright: (year: number) => `© ${year} ${name}`,
    /** The wordmark's survey mark: Interlaken, where the home sheet is centred. */
    coordinates: "46.686 N 7.863 E",
    /** The wordmark link's name: it writes an email. */
    wordmark: (address: string) => `${brand}, write to ${address}`,
  },
  skipLink: "Skip to content",
  notFound: {
    title: "Off the map",
    eyebrow: "404",
    heading: "Off the map",
    back: "Back to case studies",
  },
} as const;
