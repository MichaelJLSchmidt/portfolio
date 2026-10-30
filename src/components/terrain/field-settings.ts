import config from "@/config/contour-field.json";
import { color, device, duration, type ColorToken, type DurationToken } from "@/styles/tokens";

/**
 * Contour field tuning. Committed values live in src/config/contour-field.json
 * (written by the dev-only tuning panel); colours and durations are token names.
 */
export type FieldConfig = typeof config;

/**
 * The field's device tier, named like html[data-tier] (phase 1, motion-mode.ts):
 * - "desktop" (tier A): a fine pointer and a long edge of at least 900 px. DPR up to 2 (1.5 drew
 *   visibly softer lines on 2× screens), pre-warm on hover and focus.
 * - "mobile" (tier B): touch, or a long edge under 900 px. DPR 1 at a 0.75 render scale; frames
 *   only during transitions and (throttled) scrolling.
 * - "low" (tier C): no WebGL2, Save-Data, little memory or few cores, or a context lost twice this
 *   session (and still mode, whatever the device): posters only.
 */
export type FieldTier = "desktop" | "mobile" | "low";

export type DeviceProfile = {
  /** "desktop": a fine pointer and a long edge of at least 900 px; "mobile": anything else. */
  kind: "desktop" | "mobile";
  /** The tier the profile belongs to (tier C never runs the field, so never "low"). */
  tier: Exclude<FieldTier, "low">;
  dprMax: number;
  /** Drawing-buffer scale on top of the DPR (tier B draws at 0.75 and lets CSS scale it up). */
  renderScale: number;
  heightmap: "desktop" | "mobile";
  /** Below this many device pixels on the long edge, the 1024 heightmap is enough. */
  heightmapMinDevicePx?: number;
  /** Preview builds and dev only: a heightmap picked by width with ?hm=1024|1536|2048, for comparisons. */
  heightmapWidth?: number;
  /** Lines on steep terrain stay at least this many CSS px apart (see contourInterval). */
  minSpacingPx: number;
  /** Strength of regular and index lines (0..1). The field reads them live from the config. */
  lineOpacity: number;
  indexOpacity: number;
};

export const fieldConfig: FieldConfig = config;

/** The field is a monochrome map: its lines take neutral colours only. */
export const LINE_COLORS = ["contour", "contourDim", "paperDusk"] as const satisfies readonly ColorToken[];

/** Contour intervals the field may use on alpine terrain (metres). The index line is every `indexEvery`-th. */
export const CONTOUR_INTERVALS = [50, 100, 200, 250, 500] as const;

/** Lowland terrain (Bern): the same rule, finer steps. */
export const LOWLAND_INTERVALS = [10, 20, 50] as const;

/** Each terrain's interval set follows its relief: under 1000 m of relief is lowland. */
export const intervalSet = (relief: number): readonly number[] => (relief < 1000 ? LOWLAND_INTERVALS : CONTOUR_INTERVALS);

/**
 * Contour interval for a heightmap as it is drawn on screen. On-screen scale is texels per
 * CSS pixel (cover-fitted, zoomed); steepness is the map's gradient at the configured
 * percentile (metres per texel). The interval is the smallest value of the terrain's set
 * (`intervalSet`: alpine 50–500 m, lowland 10–50 m) that keeps lines on that slope at least
 * `minSpacingPx` apart (set per device profile).
 */
export function contourInterval(
  map: { width: number; height: number; gradientM: Record<string, number> },
  view: { width: number; height: number },
  zoom: number,
  cfg: { minSpacingPx: number; steepPercentile: number },
  intervals: readonly number[] = CONTOUR_INTERVALS,
): number {
  const va = view.width / view.height;
  const ta = map.width / map.height;
  const visibleTexels = map.width * (va > ta ? 1 : va / ta);
  const texelsPerPx = visibleTexels / (zoom * Math.max(view.width, 1));
  const slope = map.gradientM[`p${cfg.steepPercentile}`] ?? map.gradientM.p95;
  const needed = cfg.minSpacingPx * slope * texelsPerPx;
  return intervals.find((i) => i >= needed) ?? intervals[intervals.length - 1];
}

export const colorOf = (token: string): string => color[token as ColorToken] ?? token;
export const msOf = (token: string): number => duration[token as DurationToken] ?? Number(token);

/** sRGB hex → [r, g, b] in 0..1, passed to the shader without colour management. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Media query for the poster drawn at `intervalM`: true where `contourInterval` would pick
 * that interval (or finer) for the region map, so first paint and the fallback match the
 * field. Landscape screens see the full map width (desktop map), portrait screens its
 * full height (phone map). Each device profile has its own minimum spacing; the query
 * tells them apart by pointer (fine: desktop, coarse: mobile), since the size half of the
 * split (a long edge under 900 px is mobile) is implied by the 100 m poster's thresholds.
 * Pure arithmetic, so it renders the same on the server.
 */
export function posterMedia(
  maps: readonly { width: number; height: number; gradientM: { p95: number }; use: string }[],
  intervalM: number,
  cfg: Pick<FieldConfig, "desktop" | "mobile" | "steepPercentile" | "zoomBase">,
): string {
  const slope = (m: (typeof maps)[number]) => (m.gradientM as Record<string, number>)[`p${cfg.steepPercentile}`] ?? m.gradientM.p95;
  const desktop = maps.find((m) => m.use === "desktop") ?? maps[0];
  const mobile = maps.find((m) => m.use === "mobile") ?? maps[0];
  const ratio = `${desktop.width}/${desktop.height}`;
  const queries = (minSpacingPx: number, pointer: "fine" | "coarse") => {
    const k = minSpacingPx / (cfg.zoomBase * intervalM);
    const minWidth = Math.ceil(k * slope(desktop) * desktop.width);
    const minHeight = Math.ceil(k * slope(mobile) * mobile.height);
    return `(min-aspect-ratio: ${ratio}) and (min-width: ${minWidth}px) and (pointer: ${pointer}), (max-aspect-ratio: ${ratio}) and (min-height: ${minHeight}px) and (pointer: ${pointer})`;
  };
  return `${queries(cfg.desktop.minSpacingPx, "fine")}, ${queries(cfg.mobile.minSpacingPx, "coarse")}`;
}

export function isMobileProfile(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches || Math.max(window.innerWidth, window.innerHeight) < device.desktopMinEdgePx
  );
}

/** The device profile for a tier that runs the field (field-boot.ts resolves the tier). */
export function deviceProfile(tier: Exclude<FieldTier, "low">, cfg: FieldConfig = fieldConfig): DeviceProfile {
  const kind = tier;
  const profile: DeviceProfile = { kind, tier, ...(cfg[kind] as Omit<DeviceProfile, "kind" | "tier">) };
  // The 1536 heightmap is ~1.9× the bytes of the 1024 one: only fetch it when the screen can show it.
  const devicePx = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, profile.dprMax);
  if (profile.heightmap === "desktop" && devicePx < (profile.heightmapMinDevicePx ?? 0)) profile.heightmap = "mobile";
  if (process.env.NEXT_PUBLIC_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    const params = new URLSearchParams(window.location.search);
    const hm = Number(params.get("hm"));
    if (hm > 0) profile.heightmapWidth = hm;
    // ?dpr=2: compare the line quality at another DPR cap (tier A's 1.5 against 2).
    const dpr = Number(params.get("dpr"));
    if (dpr > 0) profile.dprMax = dpr;
  }
  return profile;
}
