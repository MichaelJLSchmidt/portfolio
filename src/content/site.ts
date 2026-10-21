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
    deckHeading: "The Summit Deck",
    deckIntro: "Each project is a card. Flip it for the summary, open it for the full expedition log.",
  },
  hud: {
    mark: "Höhenlinie",
    clockLabel: "Bern",
    coordinates: "N 46°41′ · E 7°52′",
    calmOn: "Calm map: on",
    calmOff: "Calm map: off",
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
} as const;
