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
  sheet: "#DDE3E3",
  glacier: "#C8F5B0",
  sheetInk: "#5A5C52",
  mossInk: "#2F6B3A",
  alpenglow: "#FF8A5C",
  alpenglowInk: "#A33A18",
  signal: "#FF4D45",
  ice: "#8FC7E8",
  summitGold: "#E8C468",
} as const;

export type ColorToken = keyof typeof color;

/** Colours allowed for text and lines on the light sheet colour (contrast-safe). */
export const sheetSafeInk = ["sheetInk", "mossInk", "alpenglowInk", "ground"] as const satisfies readonly ColorToken[];

/** Rarity is always shape + letter + colour, never colour alone. */
export const rarity = {
  C: { label: "Common", color: "contour", shape: "circle" },
  U: { label: "Uncommon", color: "ice", shape: "diamond" },
  R: { label: "Rare", color: "alpenglow", shape: "triangle" },
  M: { label: "Mythic", color: "summitGold", shape: "star" },
} as const satisfies Record<string, { label: string; color: ColorToken; shape: string }>;

export type Rarity = keyof typeof rarity;

export const type = {
  display: { wdthMin: 62, wdthMax: 72, wght: 800, lineHeightMin: 0.82, lineHeightMax: 0.9 },
  body: { size: 17, lineHeight: 28, wdth: 100, wght: 400 },
  hudLabel: { size: 11, tracking: 0.14, wdth: 87.5, wght: 500 },
  statValue: { sizeMin: 20, sizeMax: 22, wght: 700 },
  /** Condensed Archivo for type lines, role lines, insight text and decision titles. */
  condensed: { wdth: 88 },
  /** The finding half of a waypoint heading ("Label — finding"). */
  finding: { wdth: 85 },
} as const;

/**
 * Variable-font axes per text role and state. Display text rests at Archivo's narrowest width,
 * so a settle always comes from wider; press can only change the weight there.
 * Archivo: wdth 62–125; Martian Mono: wdth 75–112.5.
 */
export const axes = {
  display: {
    rest: { wdth: 62, wght: 800 },
    reveal: { wdth: 80, wght: 100 },
    /** Breath on hover or focus: +8 wdth. */
    hover: { wdth: 70, wght: 800 },
    press: { wdth: 62, wght: 700 },
    /** Display type in small spaces (card names, plaque terms). */
    compact: { wdth: type.display.wdthMax, wght: 800 },
  },
  label: {
    rest: { wdth: 100, wght: 600 },
    reveal: { wdth: 110, wght: 600 },
    hover: { wdth: 112, wght: 650 },
    press: { wdth: 96, wght: 600 },
  },
  mono: {
    rest: { wdth: 87.5, wght: 500 },
    reveal: { wdth: 112.5, wght: 500 },
    hover: { wdth: 100, wght: 500 },
    press: { wdth: 80, wght: 500 },
    /** The HUD once the page has scrolled: Martian Mono's narrowest width. */
    condensed: { wdth: 75, wght: 500 },
  },
} as const;

export type AxisRole = keyof typeof axes;

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
  /** One letter breathing wider on hover or focus, or settling back. */
  breath: 160,
  /** A whole breath settling back, right to left. */
  breathOut: 240,
  /** An inline link's contour underline draws. */
  underline: 180,
  /** Still mode: the longest opacity or colour change allowed. */
  still: 200,
  /** One block of a reveal (rise and fade); with the item stagger a group stays within 600 ms. */
  reveal: 350,
  /** Text and UI settling onto its rest state (labels, links, buttons). */
  settle: 420,
  /** A route change's own motion (field and page). */
  route: 600,
  /** Display text settling from its reveal axes. */
  settleDisplay: 640,
  /** The terrain morphing between routes. */
  terrain: 700,
  /** The single mint glint. */
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
  char: { step: 14, cap: 240 },
  word: { step: 40, cap: 320 },
  item: { step: 50, max: 6 },
  card: { step: 70, cap: 420 },
} as const;

/** Distances in px (tilt in degrees). */
export const distance = {
  /** Blocks rise this far as they reveal. */
  rise: 8,
  /** Cards rise this far as they reveal. */
  riseCard: 12,
  /** Arrows and small marks nudge this far on hover or focus. */
  nudge: 4,
  /** Lifted surfaces (negative: up). */
  lift: -6,
  /** Largest card tilt. */
  tiltMax: 5,
  /** The HUD condenses once the page has scrolled this far. */
  hudCondense: 120,
} as const;

/** Scale factors. */
export const scale = {
  /** A pressed button. */
  press: 0.97,
} as const;

/** The single mint pass: one band across the text, on dark surfaces only. */
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
 * The pointer "headlamp" shared by the contour field and the display-type shine: one pointer
 * source (src/lib/headlamp.ts), one radius, one falloff, one timing.
 */
export const headlamp = {
  radiusPx: 120,
  /** Large type is lit at least this many em around the pointer, so a lamp covers a few letters. */
  radiusEm: 1.2,
  /** Gaussian falloff exp(-k·d²) for a distance d in radii, cut off at d = 1. */
  falloff: 3,
  rise: "micro",
  fadeMs: 600,
  /** Type is lit at most half way towards glacier (colour only). */
  shineMax: 0.5,
} as const satisfies { rise: DurationToken } & Record<string, unknown>;

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

/** `(min-width: 960px)` for matchMedia. */
export const mediaUp = (b: Breakpoint) => `(min-width: ${breakpoint[b]}px)`;

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

/**
 * Values that phase 4 (cards and deck) replaces with the tokens above: the current card tilt,
 * kept as it is until then so this phase changes nothing visible on the cards.
 */
export const legacy = {
  tilt: { spring: { stiffness: 150, damping: 18, mass: 0.6 }, maxDeg: 14 },
} as const;

export const cubicBezier = (e: EasingToken) => `cubic-bezier(${easing[e].join(",")})`;

/** Seconds, for Motion transitions. */
export const seconds = (d: DurationToken) => duration[d] / 1000;

/** A cascade's per-item delay, so `count` items stay within `cap` ms (never more than `step`). */
export const staggerStep = (s: { step: number; cap: number }, count: number) =>
  count > 1 ? Math.min(s.step, s.cap / (count - 1)) : 0;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Serialises the tokens into CSS custom properties on :root. `motion: false` leaves out the
 * motion tokens (durations, easings, axes, staggers, distances, glint, headlamp, layers), for
 * pages that only need the palette and type (the artefact images, the under-construction page),
 * so tuning motion never changes them.
 */
export function tokensToCss({ motion = true }: { motion?: boolean } = {}): string {
  const vars: string[] = [];
  for (const [k, v] of Object.entries(color)) vars.push(`--color-${kebab(k)}:${v}`);
  if (motion) for (const [k, v] of Object.entries(duration)) vars.push(`--dur-${kebab(k)}:${v}ms`);
  if (motion) for (const k of Object.keys(easing) as EasingToken[]) vars.push(`--ease-${k}:${cubicBezier(k)}`);
  vars.push(
    `--type-display-wdth:${type.display.wdthMin}`,
    `--type-display-wght:${type.display.wght}`,
    `--type-display-lh:${type.display.lineHeightMin}`,
    `--type-body-size:${type.body.size / 16}rem`,
    `--type-body-lh:${type.body.lineHeight / type.body.size}`,
    `--type-hud-size:${type.hudLabel.size / 16}rem`,
    `--type-hud-tracking:${type.hudLabel.tracking}em`,
    `--type-hud-wdth:${type.hudLabel.wdth}`,
    `--type-stat-wght:${type.statValue.wght}`,
  );
  if (!motion) return `:root{${vars.join(";")}}`;
  vars.push(`--type-condensed-wdth:${type.condensed.wdth}%`, `--type-finding-wdth:${type.finding.wdth}%`);
  // Axes: font-stretch as a percentage, weight as a number (--axis-display-rest-wdth: 62%).
  for (const [role, states] of Object.entries(axes)) {
    for (const [state, v] of Object.entries(states)) {
      vars.push(`--axis-${role}-${state}-wdth:${v.wdth}%`, `--axis-${role}-${state}-wght:${v.wght}`);
    }
  }
  for (const [k, s] of Object.entries(stagger)) {
    vars.push(`--stagger-${k}:${s.step}ms`);
    if ("cap" in s) vars.push(`--stagger-${k}-cap:${s.cap}ms`);
    if ("max" in s) vars.push(`--stagger-${k}-max:${s.max}`);
  }
  for (const [k, v] of Object.entries(distance)) vars.push(`--dist-${kebab(k)}:${v}${k === "tiltMax" ? "deg" : "px"}`);
  vars.push(
    `--glint-band:${glint.band}%`,
    `--glint-angle:${glint.angle}deg`,
    `--glint-color:rgb(${hexChannels(glint.color).join(" ")} / ${glint.alpha})`,
    `--headlamp-radius:${headlamp.radiusPx}px`,
    `--headlamp-fade:${headlamp.fadeMs}ms`,
    `--headlamp-shine:${headlamp.shineMax * 100}%`,
    `--scale-press:${scale.press}`,
  );
  for (const [k, v] of Object.entries(layer)) vars.push(`--layer-${kebab(k)}:${v}`);
  return `:root{${vars.join(";")}}`;
}

/** "#C8F5B0" → [200, 245, 176]. */
export function hexChannels(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
