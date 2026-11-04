import { site } from "./site";

/** Copy for the motion lab (/lab/), a preview-only review page. Components never hardcode copy. */
export const lab = {
  meta: {
    title: "Motion lab",
    description: "Every Calm Survey primitive in Full, Calm and Off, side by side.",
  },
  heading: "Motion lab",
  intro:
    "Every primitive in the three motion tiers, side by side. Each column is the same page loaded in one tier; hover, tab and press inside a column to try it. The OS setting for reduced motion turns every column Off.",
  replay: "Replay all",
  modes: {
    full: { name: "Full", note: "Everything, at its own pace. The default." },
    calm: { name: "Calm", note: "Durations ×0.7, no stagger, no pointer effects but links; half the field's drift, no breath." },
    still: { name: "Off", note: "Nothing moves: opacity crossfades of 160 ms at most; the static poster. Forced by the OS setting." },
  },
  frameTitle: (mode: string) => `Primitives in the ${mode} tier`,
  specimen: {
    heading: "Primitives",
    mode: "Tier",
    tier: "Device tier",
    replay: "Replay",
    sections: {
      title: {
        title: "Title",
        note: "Each word arrives from wght 200 to its role's weight over 900 ms, 60 ms apart (four steps at most); a hidden copy at the final weight holds the width. Calm: 600 ms together. Off: the final weight.",
        /** The display name, from the name source. */
        big: site.name,
        mid: "Seilschaft",
      },
      link: {
        title: "Links: contour tightening",
        note: "A 1 px underline at 55 % at rest; hover and focus take it to full colour and draw a second line 3 px below, left to right in 320 ms. Press nudges it closer. Touch: full colour at rest.",
        inlineBefore: "Running text with ",
        inline: "a link that wraps across a line break to show both lines following it",
        inlineAfter: ", then more text.",
        standalone: "Next case study",
        back: "Back to case studies",
        sheet: "A link on the sheet",
      },
      button: {
        title: "Survey button",
        note: "1 px frame at rest; hover takes the frame to the text colour and steps the arrow 3 px up and right in 200 ms; focus adds the 2 px mint ring; press scales to 0.985 for 120 ms.",
        label: "Look around",
      },
      control: {
        title: "Motion control",
        note: "One control, persisted; the OS setting for reduced motion forces Off.",
      },
      reveal: {
        title: "Reveal",
        note: "Below the fold: a block rises 12 px and fades in over 480 ms, once. Never on sheet bands.",
        block: "A block rises 12 px and fades in as 15 % of it comes into view.",
      },
    },
    spacer: "Scroll on: the next primitive starts below the fold.",
  },
} as const;

/** Copy for the terrain lab (/lab/terrain/), a preview-only review page. */
export const terrainLab = {
  meta: {
    title: "Terrain lab",
    description: "The contour field's terrains, motion tiers and device tiers.",
  },
  heading: "Terrain lab",
  intro:
    "The contour field drifts, breathes and bends a little under a fine pointer; a page change dims it to 60 % and crossfades it to the next terrain in 1.6 s. Crossfade here without navigating, or follow the real routes; the tier links reload this page.",
  morphs: {
    heading: "Terrains",
    note: "Each button crossfades the field as a page change would.",
    region: "Home · Interlaken",
    bern: "About · Bern",
    card: (name: string) => `Case study · ${name}`,
  },
  routes: { heading: "Real routes", home: "Home", about: "About" },
  modes: {
    heading: "Tiers",
    note: "Reloads this page in one motion tier or device tier. The OS setting for reduced motion still wins.",
    options: { full: "Full", calm: "Calm", still: "Off" },
  },
  tiers: {
    options: { desktop: "Desktop", mobile: "Mobile", low: "Posters only" },
  },
  state: { mode: "Tier", terrain: "Terrain", frames: "Frames drawn" },
};
