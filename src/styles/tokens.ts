/**
 * Design tokens: the single source of truth for colour, type, layout and motion ("Calm Survey").
 * CSS custom properties are generated from this file (`tokensToCss`, inlined by the root layout),
 * so components read `var(--…)` in CSS and import these values in TS. docs/motion.md describes the
 * motion tokens and the rules they serve.
 */

/**
 * Colour roles. The site is a survey map sheet on a dark desk: ground and its raised surface,
 * the sheet (light bands) with its ink, three steps of text, the UI's hairlines, the contour
 * field's stone grey, and one accent. No red, orange or gold anywhere (npm test scans for it).
 */
export const color = {
  /** The desk: page background. */
  ground: "#1B1C18",
  /** Card bodies, the scrolled header. Never carries text3. */
  groundRaised: "#22231F",
  /** The map sheet: light bands (summary, options, outcome, leadership). */
  sheet: "#DDE3E3",
  /** Text on the sheet. */
  ink: "#1B1C18",
  /** Meta text on the sheet (mono labels, captions). */
  ink2: "#4A4B43",
  /** Text on ground. */
  text: "#E8EBE4",
  /** Secondary text on ground and ground-raised. */
  text2: "#A3A69C",
  /** The smallest allowed meta text, on ground only (4.77:1; 4.45:1 on ground-raised fails). */
  text3: "#868980",
  /** UI hairlines: frames, dividers, separators. */
  line: "#4A4C45",
  /** Index hairlines: the heavier tick, the active divider. */
  lineIndex: "#5E6159",
  /** Hairlines on the sheet. */
  lineOnSheet: "#9FA7A7",
  /** The contour field's stone grey (field, posters and plates only; drawn at low alpha). */
  fieldLine: "#8A8C80",
  /** Glacier mint: focus, the active state and isolines only. Never on the sheet. */
  glacier: "#C8F5B0",
} as const;

export type ColorToken = keyof typeof color;

/** Colours allowed for text on the sheet (contrast-safe, checked by check:contrast). */
export const sheetSafeInk = ["ink", "ink2"] as const satisfies readonly ColorToken[];

/**
 * Type. Archivo (wdth fixed at 100, only wght moves) and Martian Mono. Sizes are fluid clamps;
 * nothing is sized by the length of a name or a title.
 */
export const type = {
  display: { size: "clamp(3rem, 1.2rem + 8.5vw, 10.5rem)", wght: 800, tracking: -0.035, lineHeight: 0.92 },
  h1: { size: "clamp(2.5rem, 1.4rem + 4.6vw, 6rem)", wght: 800, tracking: -0.03, lineHeight: 0.95 },
  h2: { size: "clamp(1.75rem, 1.3rem + 1.8vw, 3rem)", wght: 600, tracking: -0.015, lineHeight: 1.05 },
  h3: { size: "clamp(1.25rem, 1.1rem + 0.6vw, 1.625rem)", wght: 600, tracking: -0.01, lineHeight: 1.15 },
  metric: { size: "clamp(4rem, 2rem + 9vw, 12rem)", wght: 250, tracking: -0.04, lineHeight: 0.9 },
  pull: { size: "clamp(1.75rem, 1.2rem + 2.4vw, 3.5rem)", wght: 350, tracking: -0.02, lineHeight: 1.12 },
  body: { size: "clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)", wght: 400, lineHeight: 1.55, measure: 66 },
  mono: { size: "clamp(0.6875rem, 0.66rem + 0.12vw, 0.8125rem)", wght: 500, tracking: 0.06, lineHeight: 1.4, wdth: 87.5 },
} as const;

/** The title weight arrival: from this weight to the role's own, per word (Title). */
export const titleArrival = { fromWght: 200, maxWords: 4 } as const;

/** Layout: the grid per breakpoint, the page's measure, section spacing and the 4 px scale. */
export const grid = {
  /** < 768 px: four columns; the margin adds the safe-area insets in CSS. */
  sm: { cols: 4, margin: "16px", gutter: 16 },
  /** 768–1279 px. */
  md: { cols: 8, margin: "32px", gutter: 20 },
  /** ≥ 1280 px. */
  lg: { cols: 12, margin: "clamp(32px, 4vw, 64px)", gutter: 24 },
  maxWidth: 1440,
} as const;

export const space = {
  /** Between a page's sections. */
  section: "clamp(96px, 10vw, 192px)",
  /** The spacing scale's unit (multiples of 4 px). */
  unit: 4,
} as const;

/** Radii in px: figures and map frames are square; cards have a small radius. No pills. */
export const radius = { none: 0, card: 6 } as const;

/** Stroke widths in px. */
export const stroke = { hairline: 1, index: 1.5, focus: 2 } as const;

/** Durations in milliseconds. */
export const duration = {
  /** A press. */
  press: 120,
  /** Small UI feedback (a button's border, a header's background). */
  fast: 200,
  /** UI feedback ceiling: hover, focus, a link's second line, a decision figure's swap. */
  base: 320,
  /** Entrances: reveals, a card's rise. */
  enter: 480,
  /** A card's art stepping up one contour level (the second plate crossfading in). */
  level: 600,
  /** The shared art window morphing between card and header plate. */
  morph: 680,
  /** The title's weight arrival (the one exception above 600 ms besides the terrain). */
  title: 900,
  /** The contour field's terrain crossfade between pages. */
  terrain: 1600,
  /** Non-shared content leaving as a route starts. */
  leave: 160,
  /** Back/forward and unpaired returns: a plain crossfade. */
  crossfade: 240,
  /** The Off tier's ceiling: opacity crossfades only. */
  still: 160,
  /** A line drawing once (the career profile). */
  draw: 1200,
  /** How long a toast stays (a reading time, not motion). */
  toast: 4000,
} as const;

export type DurationToken = keyof typeof duration;

/**
 * A page change's timeline, in ms from the commit (docs/motion.md): the card → case study arrival
 * and the plain page change. Durations not listed here are the duration tokens above.
 */
export const route = {
  /** A plain page change: the old page fades out over this. */
  pageOut: 180,
  /** A plain page change: the new page starts to arrive (fade and 12 px rise over --dur-base). */
  pageInAt: 120,
  /** The case study's H1 fades in from here, over titleFade, then runs its weight arrival. */
  titleAt: 360,
  titleFade: 280,
  /** The header's meta lines and the summary rise in from here, 60 ms apart. */
  partsAt: 560,
  /** Phones: the art morph and the old page's fade. */
  morphPhone: 560,
  leavePhone: 120,
  /** Calm: the art morph. */
  morphCalm: 480,
} as const;

/**
 * Cubic-bezier control points (Motion arrays; CSS via `cubicBezier`). Ease-out to appear, ease-in
 * to leave, ease-in-out for travel. No bounce anywhere.
 */
export const easing = {
  out: [0.22, 1, 0.36, 1],
  in: [0.3, 0, 0.8, 0.15],
  inOut: [0.65, 0, 0.35, 1],
  standard: [0.2, 0, 0, 1],
  decelerate: [0.05, 0.7, 0.1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingToken = keyof typeof easing;

/** Springs: pointer-driven values only, never bouncing (the field's pointer bump). */
export const spring = {
  bump: { stiffness: 60, damping: 18, mass: 1 },
} as const;

/** Staggers: at most 60 ms and four items. */
export const stagger = { step: 60, max: 4 } as const;

/** Distances in px. */
export const distance = {
  /** Scroll reveals and card entrances rise this far. */
  rise: 12,
  /** A case study's meta and summary rise this far as the page arrives. */
  arrive: 16,
  /** A card lifts this far on hover (negative: up). */
  lift: -6,
  /** A standalone link's or a button's arrow steps this far up and right. */
  arrowStep: 3,
  /** The header takes its background after this much scroll. */
  headerSolid: 80,
} as const;

/** Scale factors. */
export const scale = {
  /** A pressed button or card. */
  press: 0.985,
} as const;

/** Vibration (navigator.vibrate, Android): 8 ms on primary presses, never in Off. No sound anywhere. */
export const haptics = {
  patterns: { press: 8 },
  minGapMs: 80,
} as const;

export type HapticEvent = keyof typeof haptics.patterns;

/**
 * Layout breakpoints (CSS px, min-width): 768 (eight columns) and 1280 (twelve). Media queries
 * can't read custom properties, so stylesheets write them literally, `(min-width: 768px)` or
 * `(width < 768px)`; npm test checks every width query uses one of these.
 */
export const breakpoint = {
  md: 768,
  lg: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoint;

/**
 * Device profile (not a layout breakpoint): a fine pointer and a long edge of at least
 * `desktopMinEdgePx` is the desktop tier (html[data-tier]).
 */
export const device = {
  desktopMinEdgePx: 900,
} as const;

/** Stacking layers of the page (local stacking inside a component stays local). */
export const layer = {
  backdrop: 0,
  page: 1,
  header: 30,
  overlay: 40,
  skipLink: 100,
} as const;

export const cubicBezier = (e: EasingToken) => `cubic-bezier(${easing[e].join(",")})`;

/** Seconds, for Motion transitions. */
export const seconds = (d: DurationToken) => duration[d] / 1000;

const kebab = (s: string) => s.replace(/[A-Z]|\d+/g, (m) => `-${m.toLowerCase()}`);

/**
 * Serialises the tokens into CSS custom properties on :root. `motion: false` keeps only the
 * palette and type, for pages that need nothing else (the artefact images), so tuning layout or
 * motion never changes them.
 */
export function tokensToCss({ motion = true }: { motion?: boolean } = {}): string {
  const vars: string[] = [];
  for (const [k, v] of Object.entries(color)) vars.push(`--color-${kebab(k)}:${v}`);
  for (const [k, t] of Object.entries(type)) {
    vars.push(`--type-${k}-size:${t.size}`, `--type-${k}-wght:${t.wght}`, `--type-${k}-lh:${t.lineHeight}`);
    if ("tracking" in t) vars.push(`--type-${k}-tracking:${t.tracking}em`);
  }
  vars.push(`--type-body-measure:${type.body.measure}ch`, `--type-mono-wdth:${type.mono.wdth}%`, `--title-from-wght:${titleArrival.fromWght}`);
  if (!motion) return `:root{${vars.join(";")}}`;
  for (const [k, v] of Object.entries(duration)) vars.push(`--dur-${kebab(k)}:${v}ms`);
  for (const [k, v] of Object.entries(route)) vars.push(`--route-${kebab(k)}:${v}ms`);
  for (const k of Object.keys(easing) as EasingToken[]) vars.push(`--ease-${kebab(k)}:${cubicBezier(k)}`);
  vars.push(`--stagger-step:${stagger.step}ms`, `--stagger-max:${stagger.max}`);
  for (const [k, v] of Object.entries(distance)) vars.push(`--dist-${kebab(k)}:${v}px`);
  vars.push(`--scale-press:${scale.press}`);
  vars.push(`--space-section:${space.section}`, `--space-unit:${space.unit}px`, `--page-max:${grid.maxWidth}px`);
  for (const [k, v] of Object.entries(radius)) vars.push(`--radius-${kebab(k)}:${v}px`);
  for (const [k, v] of Object.entries(stroke)) vars.push(`--stroke-${kebab(k)}:${v}px`);
  for (const [k, v] of Object.entries(layer)) vars.push(`--layer-${kebab(k)}:${v}`);
  return `:root{${vars.join(";")}}`;
}

/** The grid's custom properties per breakpoint (globals.css reads --grid-cols/-margin/-gutter). */
export function gridToCss(): string {
  const g = (s: { cols: number; margin: string; gutter: number }) => `--grid-cols:${s.cols};--grid-margin:${s.margin};--grid-gutter:${s.gutter}px`;
  return (
    `:root{${g(grid.sm)}}` +
    `@media (min-width: ${breakpoint.md}px){:root{${g(grid.md)}}}` +
    `@media (min-width: ${breakpoint.lg}px){:root{${g(grid.lg)}}}`
  );
}

/** "#C8F5B0" → [200, 245, 176]. */
export function hexChannels(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
