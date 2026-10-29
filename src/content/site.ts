/**
 * The display name: the one place it is written. Titles, the hero, the under-construction page and
 * the gate read it from here.
 */
const name = "Michael JL Schmidt";

/** Site-wide copy. Components read from here; nothing user-facing is hardcoded in components. */
export const site = {
  name,
  title: `${name} — UX Team Lead`,
  description:
    "Portfolio of a UX Team Lead in Bern, Switzerland: UX teams, design systems and workshops for public services people can finish.",
  lang: "en",
  /** The home page's own copy is in home.ts. */
  hero: { name },
  /** Main navigation (the HUD; on phones the footer holds all but Basecamp). */
  nav: {
    label: "Main",
    footerLabel: "Site",
    expeditions: "Expeditions",
    basecamp: "Basecamp",
    contact: "Contact",
    cv: "CV",
  },
  hud: {
    mark: "Höhenlinie",
    markHome: "Höhenlinie, home",
    clockLabel: "Bern",
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
    skipIntro: "Skip",
  },
  footer: {
    credit: "Terrain data © swisstopo",
    creditHref: "https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices",
    built: "Built by hand with Next.js, WebGL and Motion",
    place: "Bern, 2026",
  },
  skipLink: "Skip to content",
  notFound: {
    eyebrow: "404",
    heading: "Off the map",
    body: "This trail isn’t on any map I’ve drawn.",
    back: "Back to the trailhead",
  },
} as const;
