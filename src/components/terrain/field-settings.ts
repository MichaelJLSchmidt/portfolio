import config from "@/config/contour-field.json";
import { color, duration, type ColorToken, type DurationToken } from "@/styles/tokens";

/**
 * Contour field tuning. Committed values live in src/config/contour-field.json
 * (written by the dev-only tuning panel); colours and durations are token names.
 */
export type FieldConfig = typeof config;

export type DeviceProfile = {
  /** "desktop": a fine pointer and a long edge of at least 900 px; "mobile": anything else. */
  kind: "desktop" | "mobile";
  dprMax: number;
  heightmap: "desktop" | "mobile";
  /** Below this many device pixels on the long edge, the 1024 heightmap is enough. */
  heightmapMinDevicePx?: number;
  /** Preview builds and dev only: a heightmap picked by width with ?hm=1024|1536|2048, for comparisons. */
  heightmapWidth?: number;
  /** Strength of regular and index lines (0..1). The field reads them live from the config. */
  lineOpacity: number;
  indexOpacity: number;
  /** Frame rate for the ambient animation (the slow drift) while the visitor is around. */
  ambientFps: number;
  /** Frame rate once nobody has touched the page for `dormantAfterMs`. */
  idleFps: number;
};

export const fieldConfig: FieldConfig = config;

/** The field is a monochrome map: its lines take neutral colours only. */
export const LINE_COLORS = ["contour", "contourDim", "sheet"] as const satisfies readonly ColorToken[];

/** Contour intervals the field may use (metres). The index line is every `indexEvery`-th. */
export const CONTOUR_INTERVALS = [50, 100, 200, 250, 500] as const;

/**
 * Contour interval for a heightmap as it is drawn on screen. On-screen scale is texels per
 * CSS pixel (cover-fitted, zoomed); steepness is the map's gradient at the configured
 * percentile (metres per texel). The interval is the smallest clean value that keeps lines
 * on that slope at least `minSpacingPx` apart.
 */
export function contourInterval(
  map: { width: number; height: number; gradientM: Record<string, number> },
  view: { width: number; height: number },
  zoom: number,
  cfg: Pick<FieldConfig, "minSpacingPx" | "steepPercentile">,
): number {
  const va = view.width / view.height;
  const ta = map.width / map.height;
  const visibleTexels = map.width * (va > ta ? 1 : va / ta);
  const texelsPerPx = visibleTexels / (zoom * Math.max(view.width, 1));
  const slope = map.gradientM[`p${cfg.steepPercentile}`] ?? map.gradientM.p95;
  const needed = cfg.minSpacingPx * slope * texelsPerPx;
  return CONTOUR_INTERVALS.find((i) => i >= needed) ?? CONTOUR_INTERVALS[CONTOUR_INTERVALS.length - 1];
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
 * full height (phone map). Pure arithmetic, so it renders the same on the server.
 */
export function posterMedia(
  maps: { width: number; height: number; gradientM: Record<string, number>; use: string }[],
  intervalM: number,
  cfg: Pick<FieldConfig, "minSpacingPx" | "steepPercentile" | "zoomBase">,
): string {
  const slope = (m: (typeof maps)[number]) => m.gradientM[`p${cfg.steepPercentile}`] ?? m.gradientM.p95;
  const desktop = maps.find((m) => m.use === "desktop") ?? maps[0];
  const mobile = maps.find((m) => m.use === "mobile") ?? maps[0];
  const k = cfg.minSpacingPx / (cfg.zoomBase * intervalM);
  const minWidth = Math.ceil(k * slope(desktop) * desktop.width);
  const minHeight = Math.ceil(k * slope(mobile) * mobile.height);
  const ratio = `${desktop.width}/${desktop.height}`;
  return `(min-aspect-ratio: ${ratio}) and (min-width: ${minWidth}px), (max-aspect-ratio: ${ratio}) and (min-height: ${minHeight}px)`;
}

export function isMobileProfile(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches || Math.max(window.innerWidth, window.innerHeight) < 900
  );
}

export function deviceProfile(cfg: FieldConfig = fieldConfig): DeviceProfile {
  const kind = isMobileProfile() ? "mobile" : "desktop";
  const profile: DeviceProfile = { kind, ...(cfg[kind] as Omit<DeviceProfile, "kind">) };
  // The 1536 heightmap is ~1.9× the bytes of the 1024 one: only fetch it when the screen can show it.
  const devicePx = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, profile.dprMax);
  if (profile.heightmap === "desktop" && devicePx < (profile.heightmapMinDevicePx ?? 0)) profile.heightmap = "mobile";
  if (process.env.NEXT_PUBLIC_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    const hm = Number(new URLSearchParams(window.location.search).get("hm"));
    if (hm > 0) profile.heightmapWidth = hm;
  }
  return profile;
}
