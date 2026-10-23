/**
 * Design tokens: the single source of truth for colour, type and motion.
 * CSS custom properties are generated from this file (see `tokensToCss`),
 * so components read `var(--color-…)` in CSS and import these values in TS.
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
} as const;

/** Durations in milliseconds. */
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
} as const;

export type DurationToken = keyof typeof duration;

/** Cubic-bezier control points; usable by Motion (array) and CSS (`cubicBezier`). */
export const easing = {
  trail: [0.22, 1, 0.36, 1],
  summit: [0.65, 0, 0.35, 1],
  drop: [0.32, 0.72, 0, 1],
  scree: [0.7, 0, 0.84, 0],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingToken = keyof typeof easing;

export const spring = {
  card: { stiffness: 260, damping: 24, mass: 0.9 },
  tilt: { stiffness: 150, damping: 18, mass: 0.6 },
  magnet: { stiffness: 320, damping: 28 },
  /** Tilt springs back flat before a card's view transition snapshots it (seconds, no bounce). */
  settle: { visualDuration: 0.12, bounce: 0 },
} as const;

export const cubicBezier = (e: EasingToken) => `cubic-bezier(${easing[e].join(",")})`;

/** Seconds, for Motion transitions. */
export const seconds = (d: DurationToken) => duration[d] / 1000;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** Serialises the tokens into CSS custom properties on :root. */
export function tokensToCss(): string {
  const vars: string[] = [];
  for (const [k, v] of Object.entries(color)) vars.push(`--color-${kebab(k)}:${v}`);
  for (const [k, v] of Object.entries(duration)) vars.push(`--dur-${k}:${v}ms`);
  for (const k of Object.keys(easing) as EasingToken[]) vars.push(`--ease-${k}:${cubicBezier(k)}`);
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
  return `:root{${vars.join(";")}}`;
}
