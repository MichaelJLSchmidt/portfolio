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
    "Portfolio of a UX Team Lead and Senior UX Designer from Interlaken in the Swiss Alps: design systems, facilitation and front-end craft.",
  lang: "en",
  hero: {
    eyebrow: "UX Team Lead · Senior UX Designer",
    name,
    origin: "Interlaken · 566 m · Swiss Alps",
    lede: "I lead a UX team that designs public-sector platforms, runs the workshops that shape them, and ships the design system they are built with.",
    scrollCue: "Descend to the deck",
    deckHeading: "The Summit Deck",
    deckIntro: "Each project is a card. Open one for the full expedition log.",
    /** The deck without a single case study (a live build until the first one is written). */
    deckEmpty: "The expedition logs are being written up. Until then, ask me for a walkthrough.",
  },
  hud: {
    mark: "Höhenlinie",
    markHome: "Höhenlinie, back to the deck",
    about: "Basecamp",
    clockLabel: "Bern",
    coordinates: "N 46°41′ · E 7°52′",
    /** The motion switch: its visible state ("Calm map" on, "Clear night" off) and its name. */
    calm: {
      on: "Calm map",
      off: "Clear night",
      name: "Reduce motion on this site",
      forced: "Your device asks for reduced motion, so the map stays still. Change it in your system settings.",
    },
    /** Shown only where vibration works (Android); the visible label is its name. */
    haptics: "Haptics",
    tiltEnable: "Enable tilt",
    tiltResume: "Resume tilt",
    tiltOn: "Tilt: on",
    skipIntro: "Skip",
    credit: "Terrain data © swisstopo",
  },
  footer: {
    credit: "Terrain data © swisstopo",
    creditHref: "https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices",
    note: "Contours drawn from swissALTIRegio. Built as a static site.",
    about: "About · Basecamp",
  },
  skipLink: "Skip to content",
  notFound: {
    eyebrow: "404 · Off the map",
    heading: "No trail here",
    body: "This page isn't on the map. The deck is a safer route.",
    back: "Back to the deck",
  },
} as const;
