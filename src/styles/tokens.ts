/**
 * Design tokens: the single source of truth for colour, type and motion.
 * CSS custom properties are generated from this file (see `tokensToCss`; Motion springs as CSS
 * easings in `src/styles/motion-css.ts`), so components read `var(--…)` in CSS and import these
 * values in TS. docs/motion.md describes the motion tokens, levels and primitives.
 */

export const color = {
  ground: "#1B1C18",
  groundRaised: "#24251F",
  contourDim: "#3A3C34",
  contour: "#8A8C80",
  /** Light text on dark, and the paper of the case-study summary (the only paper surface). */
  paperDusk: "#C9C5B4",
  /** Body text on paper. */
  paperInk: "#24251F",
  /** Mono labels on paper. */
  paperInk2: "#4A4B43",
  /** Light and attention: focus, the flood, tags, the active state. */
  glacier: "#C8F5B0",
  mossInk: "#24552D",
  alpenglow: "#FF8A5C",
  alpenglowInk: "#8A2E12",
  /** The route on dark: path and progress only (the route, trail links, the trail blaze). */
  signal: "#FF4D45",
  /** The route where it crosses paper. */
  routePaper: "#B3261E",
  ice: "#8FC7E8",
  summitGold: "#E8C468",
} as const;

export type ColorToken = keyof typeof color;

/** Colours allowed for text and lines on paper (contrast-safe; the route's own colour is a mark, 3:1). */
export const paperSafeInk = ["paperInk", "paperInk2", "mossInk", "alpenglowInk"] as const satisfies readonly ColorToken[];

/** Rarity is always shape + letter + colour, never colour alone. */
export const rarity = {
  C: { label: "Common", color: "contour", shape: "circle" },
  U: { label: "Uncommon", color: "ice", shape: "diamond" },
  R: { label: "Rare", color: "alpenglow", shape: "triangle" },
  M: { label: "Mythic", color: "summitGold", shape: "star" },
} as const satisfies Record<string, { label: string; color: ColorToken; shape: string }>;

export type Rarity = keyof typeof rarity;

/**
 * Type roles. Archivo (wdth 62–125, wght 100–900) for titles, text and buttons; Martian Mono
 * (wdth 75–112.5) for labels, stats and spot heights.
 */
export const type = {
  /** Display titles: upper case, wdth 75, wght 800 (WeightTitle). */
  display: { wdth: 75, wght: 800, lineHeight: 0.86 },
  /** Body: 17–19 px, line-height 1.55, 60–68 characters a line. */
  body: { sizeMin: 17, sizeMax: 19, lineHeight: 1.55, wdth: 100, wght: 400, measureMin: 60, measureMax: 68 },
  /** Button labels: wider and bolder than the titles, upper case, +0.02 em. */
  button: { wdth: 112, wght: 720, tracking: 0.02 },
  /** Labels, stats and spot heights. */
  mono: { size: 11, tracking: 0.14, wdth: 87.5, wght: 500 },
  /** Display type in small spaces (card names). */
  compact: { wdth: 72, wght: 800 },
  /** Condensed Archivo for type lines and insight text. */
  condensed: { wdth: 88 },
} as const;

/**
 * Display titles (WeightTitle): at rest wght 800 at wdth 75. In full motion a title arrives from
 * wght 200 at a start width solved per title at build time so the line keeps its length
 * (scripts/measure-titles.mjs → src/lib/title-axes.json).
 */
export const titleAxes = {
  from: { wght: 200 },
  rest: { wdth: type.display.wdth, wght: type.display.wght },
} as const;

/** Layout spacing. */
export const space = {
  /** Between a page's sections: roomier on desktop. */
  section: { mobile: "clamp(4rem, 10vh, 6rem)", desktop: "clamp(6rem, 14vh, 11rem)" },
  /** How far construction lines run past what they measure (the footer wordmark), in px. */
  overshoot: 12,
} as const;

/** Durations in milliseconds: the scale, then semantic durations. */
export const duration = {
  instant: 80,
  micro: 140,
  /** Calm map / reduced motion: the incoming page fades in (no view transition). */
  calm: 150,
  short: 220,
  medium: 360,
  long: 560,
  scenic: 900,
  cinematic: 1400,
  /** Press response. */
  tap: 120,
  /** A tilted card springs or tweens back flat as the pointer leaves. */
  breathOut: 240,
  /** Still mode: the longest opacity or colour change allowed. */
  still: 200,
  /** One block of a reveal (rise and fade); with the item stagger a group stays within 600 ms. */
  reveal: 350,
  /** A UI part arriving or changing state (a figure's scan line, a caption). */
  settle: 420,
  /** A route change's own motion (field and page). */
  route: 600,
  /** A display title's arrival: wght 200 → 800 at a fixed line length (WeightTitle). */
  title: 600,
  /** The home intro's arrival: wght 300 → 400 with a 6 px settle. */
  intro: 400,
  /** A trail link's red line draws left to right (TrailLink); calm: `trailCalm`. */
  trail: 280,
  trailCalm: 120,
  /** The contour flood spreading over its twelve frames (Flood), and its slow three-frame tail. */
  flood: 360,
  floodTail: 900,
  /** Calm: the flood cross-fades instead. */
  floodCalm: 160,
  /** A touch flood recedes this long after the tap. */
  floodTouch: 600,
  /** The portrait card turning over (full); calm cross-fades over `flipCalm`. */
  flip: 400,
  flipCalm: 150,
  /** The case-study summary unfolding, its text present throughout. */
  legendUnfold: 340,
  /** The terrain morphing between routes. */
  terrain: 700,
  /** The foil sweep across a Mythic card's name. */
  glint: 900,
  /** A line or neatline drawing on. */
  draw: 900,
  /** A small mark tracing itself: the logo's rings after a route change, a card's rarity shape. */
  trace: 400,
  /** Content that is not shared leaves the screen as a route starts. */
  leave: 160,
  /** Back and forward: the pages cross-fade (shared elements still morph). */
  crossfade: 180,
  /** A bottom sheet opening (the altimeter's jump list). */
  sheet: 300,
  /** A small sheet unfolding: the fiction banner, a hotspot's note. */
  unfold: 240,
  /** A route's arrival: everything on the new page has landed (see `arrival`). */
  arrival: 740,
  /** A card's artwork contours shift by one interval on hover. */
  shift: 600,
  /** Hovering a link to another terrain leans the field towards it (and back on leave). */
  prewarm: 400,
  /** How long a toast stays before it leaves (not motion: a reading time). */
  toast: 4000,
} as const;

export type DurationToken = keyof typeof duration;

/**
 * Cubic-bezier control points; usable by Motion (array) and CSS (`cubicBezier`). Never ease in on
 * UI: scree is for content leaving the screen only.
 */
export const easing = {
  trail: [0.22, 1, 0.36, 1],
  summit: [0.65, 0, 0.35, 1],
  drop: [0.32, 0.72, 0, 1],
  scree: [0.7, 0, 0.84, 0],
  /** Settle: arrives fast, condenses slowly (text, links, reveals). */
  settle: [0.16, 1, 0.3, 1],
  /** The glint's even pass. */
  glint: [0.45, 0, 0.55, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingToken = keyof typeof easing;

/** Motion springs. visualDuration in seconds; also exposed to CSS as linear() easings (motion-css.ts). */
export const spring = {
  /** Buttons and pressed controls. */
  press: { visualDuration: 0.16, bounce: 0 },
  /** Cards (lift, deal, the layout-morph fallback). */
  card: { visualDuration: 0.35, bounce: 0.15 },
  /** Shared elements between routes. */
  share: { visualDuration: 0.42, bounce: 0.1 },
  /** Switch thumbs. */
  thumb: { visualDuration: 0.2, bounce: 0.2 },
  tilt: { stiffness: 220, damping: 26, mass: 0.6 },
  /** Tilt springs back flat before a card's view transition snapshots it (seconds, no bounce). */
  settle: { visualDuration: 0.12, bounce: 0 },
} as const;

export type SpringToken = keyof typeof spring;

/** Staggers in ms; `cap` bounds the whole cascade, `max` the number of items that stagger. */
export const stagger = {
  item: { step: 50, max: 6 },
  card: { step: 70, cap: 420 },
} as const;

/**
 * A route's arrival (a link navigation in full and calm; RouteArrival), in ms after the route
 * commits, the moment the field's conductor starts: the old page's own content leaves over
 * `duration.leave`, the shared artwork and title travel on `spring.share`, then the new page's
 * parts follow, all landed by `duration.arrival`. Text never waits: it is readable throughout.
 */
export const arrival = {
  /** A case study's type and meta lines settle. */
  lines: 260,
  /** A case study's summary sheet unfolds (to the arrival's end). */
  summary: 380,
  /** About: the lead and the facts arrive, the H1 having landed. */
  landed: 420,
} as const;

/** Distances in px (tilt in degrees). */
export const distance = {
  /** Blocks rise this far as they reveal. */
  rise: 8,
  /** Cards rise this far as they reveal. */
  riseCard: 12,
  /** Arrows and small marks nudge this far on hover or focus. */
  nudge: 4,
  /** A trail link's arrow steps forward this far, in two steps. */
  trailStep: 3,
  /** The home intro settles this far as its weight eases in. */
  introSettle: 6,
  /** Lifted surfaces (negative: up). */
  lift: -6,
  /** Largest card tilt. */
  tiltMax: 5,
  /** Largest tilt of a mini card (the trailhead band). */
  tiltMini: 3,
  /** The card's tilt perspective. */
  perspective: 900,
  /** The HUD condenses once the page has scrolled this far. */
  hudCondense: 120,
} as const;

/** Scale factors. */
export const scale = {
  /** A pressed button. */
  press: 0.97,
  /** A pressed card (touch, and as it opens). */
  cardPress: 0.98,
} as const;

/**
 * The contour flood (flood.ts): a sprite of twelve frames spreads the glacier fill from where the
 * pointer entered (left to right for the keyboard); a fringe one frame ahead shows at 25%, and the
 * last three frames slow into a tail (--dur-flood-tail) while the pointer rests.
 */
export const flood = { frames: 12, tailFrames: 3, fringe: 0.25 } as const;

/** The single mint pass: one band across a card's name as its foil sweeps (Mythic cards). */
export const glint = {
  /** Band width as a share of the text's width (%). */
  band: 18,
  angle: 100,
  color: color.glacier,
  alpha: 0.55,
  duration: "glint",
  easing: "glint",
} as const satisfies { duration: DurationToken; easing: EasingToken } & Record<string, unknown>;

/**
 * Motion levels and their budgets: every effect belongs to one level, and later phases keep
 * within its budget (docs/motion.md).
 */
export const levels = {
  ambient: { channels: 1, modes: ["full"], devices: ["desktop"] },
  /** Reveals snap to their end state while the page scrolls faster than snapPxPerMs. */
  reveal: { maxGroups: 2, maxMs: 600, oncePerSession: true, snapPxPerMs: 2.5 },
  response: { maxMs: 300, interruptible: true },
  transition: { concurrent: 1, readableMs: 300 },
  signature: { perViewport: 1, oncePerSession: true },
} as const;

/**
 * Vibration patterns in ms (navigator.vibrate, supporting Android browsers only), for direct user
 * actions, at most one pulse per `minGapMs`. Off in still, off by default in calm. No sound anywhere.
 */
export const haptics = {
  patterns: {
    press: 6,
    open: 8,
    commit: 10,
    success: [8, 60, 8],
    error: [12, 40, 12],
    detent: 4,
  },
  minGapMs: 80,
} as const;

export type HapticEvent = keyof typeof haptics.patterns;

/**
 * Layout breakpoints (CSS px, min-width): at most three. Media queries can't read custom
 * properties, so stylesheets write them literally, `(min-width: 960px)` or `(width < 960px)`;
 * npm test checks that every width query in a stylesheet uses one of these.
 */
export const breakpoint = {
  /** Past phones: the HUD shows the readout and the haptics switch; two-up grids. */
  sm: 640,
  /** The HUD's whole navigation; two-column hero, case-study and Basecamp headers; four-up grids. */
  md: 1024,
  /** The HUD's Bern time and the readout's coordinates; the trail beside a case study's waypoints. */
  lg: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoint;

/**
 * Device profile (not a layout breakpoint): a fine pointer and a long edge of at least
 * `desktopMinEdgePx` is the desktop tier (html[data-tier], the field's tier A).
 */
export const device = {
  desktopMinEdgePx: 900,
} as const;

/** Stacking layers of the page (local stacking inside a component stays local). */
export const layer = {
  backdrop: 0,
  page: 1,
  hud: 30,
  overlay: 40,
  skipLink: 100,
} as const;

export const cubicBezier = (e: EasingToken) => `cubic-bezier(${easing[e].join(",")})`;

/** Seconds, for Motion transitions. */
export const seconds = (d: DurationToken) => duration[d] / 1000;

/** A cascade's per-item delay, so `count` items stay within `cap` ms (never more than `step`). */
export const staggerStep = (s: { step: number; cap: number }, count: number) =>
  count > 1 ? Math.min(s.step, s.cap / (count - 1)) : 0;

const kebab = (s: string) => s.replace(/[A-Z]|\d+/g, (m) => `-${m.toLowerCase()}`);

/**
 * Serialises the tokens into CSS custom properties on :root. `motion: false` keeps only the
 * palette and type, leaving out the layout and motion tokens (spacing, durations, easings,
 * staggers, distances, glint, layers), for pages that need nothing else (the artefact images), so
 * tuning spacing or motion never changes them.
 */
export function tokensToCss({ motion = true }: { motion?: boolean } = {}): string {
  const vars: string[] = [];
  for (const [k, v] of Object.entries(color)) vars.push(`--color-${kebab(k)}:${v}`);
  if (motion) for (const [k, v] of Object.entries(duration)) vars.push(`--dur-${kebab(k)}:${v}ms`);
  if (motion) for (const k of Object.keys(easing) as EasingToken[]) vars.push(`--ease-${k}:${cubicBezier(k)}`);
  if (motion) {
    // The flood's frames: all but the tail in --dur-flood, the tail over --dur-flood-tail.
    const last = flood.frames - 1;
    const head = (last - flood.tailFrames) / last;
    const at = duration.flood / (duration.flood + duration.floodTail);
    vars.push(`--flood-last:${last}`, `--flood-fringe:${flood.fringe}`, `--ease-flood:linear(0, ${+head.toFixed(4)} ${+(at * 100).toFixed(2)}%, 1)`);
  }
  // Type roles: font-stretch as a percentage, weight as a number.
  const rem = (px: number) => `${px / 16}rem`;
  vars.push(
    `--type-display-wdth:${type.display.wdth}%`,
    `--type-display-wght:${type.display.wght}`,
    `--type-display-lh:${type.display.lineHeight}`,
    `--type-body-size:clamp(${rem(type.body.sizeMin)}, ${rem(type.body.sizeMin - 1)} + 0.3vw, ${rem(type.body.sizeMax)})`,
    `--type-body-lh:${type.body.lineHeight}`,
    `--type-body-wght:${type.body.wght}`,
    `--type-body-measure:${type.body.measureMax}ch`,
    `--type-button-wdth:${type.button.wdth}%`,
    `--type-button-wght:${type.button.wght}`,
    `--type-button-tracking:${type.button.tracking}em`,
    `--type-mono-size:${rem(type.mono.size)}`,
    `--type-mono-tracking:${type.mono.tracking}em`,
    `--type-mono-wdth:${type.mono.wdth}%`,
    `--type-mono-wght:${type.mono.wght}`,
    `--type-compact-wdth:${type.compact.wdth}%`,
    `--type-compact-wght:${type.compact.wght}`,
    `--type-condensed-wdth:${type.condensed.wdth}%`,
    `--title-from-wght:${titleAxes.from.wght}`,
    `--title-rest-wght:${titleAxes.rest.wght}`,
    `--title-rest-wdth:${titleAxes.rest.wdth}`,
  );
  if (!motion) return `:root{${vars.join(";")}}`;
  vars.push(`--space-section-mobile:${space.section.mobile}`, `--space-section-desktop:${space.section.desktop}`, `--space-overshoot:${space.overshoot}px`);
  for (const [k, s] of Object.entries(stagger)) {
    vars.push(`--stagger-${k}:${s.step}ms`);
    if ("cap" in s) vars.push(`--stagger-${k}-cap:${s.cap}ms`);
    if ("max" in s) vars.push(`--stagger-${k}-max:${s.max}`);
  }
  for (const [k, v] of Object.entries(distance)) vars.push(`--dist-${kebab(k)}:${v}${/^tilt/.test(k) ? "deg" : "px"}`);
  vars.push(
    `--glint-band:${glint.band}%`,
    `--glint-angle:${glint.angle}deg`,
    `--glint-color:rgb(${hexChannels(glint.color).join(" ")} / ${glint.alpha})`,
    `--scale-press:${scale.press}`,
    `--scale-card-press:${scale.cardPress}`,
  );
  for (const [k, v] of Object.entries(layer)) vars.push(`--layer-${kebab(k)}:${v}`);
  return `:root{${vars.join(";")}}`;
}

/** "#C8F5B0" → [200, 245, 176]. */
export function hexChannels(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
