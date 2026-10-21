/** Site-wide copy. Components read from here; nothing user-facing is hardcoded in components. */
export const site = {
  title: "[FULL NAME] — UX Team Lead",
  description:
    "Portfolio of a UX Team Lead and Senior UX Designer from Interlaken in the Swiss Alps: design systems, facilitation and front-end craft.",
  lang: "en",
  hero: {
    eyebrow: "UX Team Lead · Senior UX Designer",
    name: "[FULL NAME]",
    origin: "Interlaken · 566 m · Swiss Alps",
    lede: "I lead a UX team that designs public-sector platforms, runs the workshops that shape them, and ships the design system they are built with.",
    scrollCue: "Descend to the deck",
    deckHeading: "The Summit Deck",
    deckIntro: "Each project is a card. Open one for the full expedition log.",
  },
  hud: {
    mark: "Höhenlinie",
    clockLabel: "Bern",
    coordinates: "N 46°41′ · E 7°52′",
    calm: "Calm map",
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
  },
  skipLink: "Skip to content",
  notFound: {
    eyebrow: "404 · Off the map",
    heading: "No trail here",
    body: "This page isn't on the map. The deck is a safer route.",
    back: "Back to the deck",
  },
} as const;
