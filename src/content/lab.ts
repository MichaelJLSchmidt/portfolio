/** Copy for the motion lab (/lab/), a preview-only review page. Components never hardcode copy. */
export const lab = {
  meta: {
    title: "Motion lab",
    description: "Every motion primitive in full, calm and still, side by side.",
  },
  heading: "Motion lab",
  intro:
    "Every motion primitive in the three motion modes, side by side. Each column is the same page loaded in one mode; hover, tab and press inside a column to try it. The OS setting for reduced motion turns every column still.",
  replay: "Replay all",
  modes: {
    full: { name: "Full", note: "Everything. The default." },
    calm: { name: "Calm", note: "Calm map switch: responses and page morphs; no ambient motion, loops or tilt." },
    still: { name: "Still", note: "Reduced motion from the OS: no positional or width animation; colour and opacity within 200 ms." },
  },
  frameTitle: (mode: string) => `Motion primitives in ${mode} mode`,
  specimen: {
    heading: "Primitives",
    mode: "Mode",
    tier: "Device tier",
    haptics: "Haptics",
    on: "on",
    off: "off",
    unsupported: "not supported here",
    replay: "Replay",
    states: { rest: "Rest", on: "Hover / focus", press: "Press", current: "Current" },
    variants: { inline: "Inline", standalone: "Standalone", back: "Back" },
    arrow: "→",
    sections: {
      title: {
        title: "Weight title",
        note: "Arrives from a light weight at a wider cut to its rest (wght 800, wdth 75) in 600 ms; the line keeps its length. Full motion only; calm and still show the rest state.",
        big: "Summit\nCard",
        mid: "Selected work",
      },
      link: {
        title: "Trail link",
        note: "Dotted underline at rest; hover and keyboard focus draw a red line left to right and step the arrow forward. A committed link keeps a blaze for the session.",
        inline: "a phrase in running text",
        inlineBefore: "Read on, ",
        standalone: "More about me",
        display: "Seilschaft",
        eyebrow: "Next project",
        back: "All projects",
      },
      button: {
        title: "Flood button",
        note: "Contour outline at rest; hover and focus flood it with glacier and turn the label ground; focus adds a ring; press fills and insets 1 px with a haptic tick.",
        label: "Copy address",
      },
      reveal: {
        title: "Reveal, contour rule, map sheet",
        note: "Below the fold: blocks rise and fade, rules draw, the sheet unfolds from its fold edge. Once per session; replay clears it.",
        block: "A block rises 8 px and fades in as it scrolls into view.",
        card: "A card-sized block rises 12 px.",
        sheet: "The map sheet unfolds from its top edge, then its content fades in.",
      },
      haptics: {
        title: "Haptics",
        note: "Android browsers only; off in still, off by default in calm.",
      },
    },
    spacer: "Scroll on: the next primitives start below the fold.",
  },
} as const;

/** Copy for the terrain lab (/lab/terrain/), a preview-only review page. */
export const terrainLab = {
  meta: {
    title: "Terrain lab",
    description: "The contour field's route morphs, motion modes and device tiers.",
  },
  heading: "Terrain lab",
  intro:
    "The contour field conducts every route change: the terrain morphs in 700 ms and, in full motion, the destination's lines draw on from the valleys upward. About recentres on Bern, where every Swiss map is measured from. Morph here without navigating, or follow the real routes; the mode and tier switches reload this page.",
  morphs: {
    heading: "Route morphs",
    note: "Each button morphs the field as a route change would.",
    region: "Home · Jungfrau region",
    bern: "About · Bern",
    card: (name: string) => `Card · ${name}`,
  },
  routes: { heading: "Real routes", home: "Home", about: "About" },
  readout: { heading: "State" },
  modes: {
    heading: "Motion mode",
    note: "Reloads this page in one mode. The OS setting for reduced motion still wins.",
    options: { full: "Full", calm: "Calm", still: "Still" },
  },
  tiers: {
    heading: "Device tier",
    note: "Reloads this page in one tier: A desktop (pre-warm), B mobile (0.75 render scale), C posters only.",
    options: { auto: "This device", desktop: "A · desktop", mobile: "B · mobile", low: "C · posters" },
  },
  state: { heading: "Field", field: "Field", tier: "Tier", terrain: "Terrain", interval: "Interval", none: "—", metres: "m" },
};
