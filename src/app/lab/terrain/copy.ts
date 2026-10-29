/**
 * Copy for the terrain lab (/lab/terrain/), a preview-only review page. It lives here rather than
 * in src/content/lab.ts only while another branch owns src/content; fold it into lab.ts later.
 */
export const terrainLab = {
  meta: {
    title: "Terrain lab",
    description: "The contour field's route morphs, readout, motion modes and device tiers.",
  },
  heading: "Terrain lab",
  intro:
    "The contour field conducts every route change: the terrain morphs in 700 ms and, in full motion, the destination's lines draw on from the valleys upward. Basecamp recentres on Bern, where every Swiss map is measured from. Morph here without navigating, or follow the real routes; the mode and tier switches reload this page.",
  morphs: {
    heading: "Route morphs",
    note: "Each button morphs the field as a route change would, with the readout.",
    region: "Home · Jungfrau region",
    bern: "Basecamp · Bern",
    card: (name: string) => `Card · ${name}`,
  },
  routes: { heading: "Real routes", home: "Home", about: "Basecamp" },
  readout: { heading: "Readout" },
  modes: {
    heading: "Motion mode",
    note: "Reloads this page in one mode. The OS setting for reduced motion still wins.",
    options: { full: "Full", calm: "Calm", still: "Still" },
  },
  tiers: {
    heading: "Device tier",
    note: "Reloads this page in one tier: A desktop (headlamp, parallax, pre-warm), B mobile (0.75 render scale, no idle frames), C posters only.",
    options: { auto: "This device", desktop: "A · desktop", mobile: "B · mobile", low: "C · posters" },
  },
  state: { heading: "Field", field: "Field", tier: "Tier", terrain: "Terrain", interval: "Interval", none: "—", metres: "m" },
};
