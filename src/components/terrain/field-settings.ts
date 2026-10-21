import config from "@/config/contour-field.json";
import { color, duration, type ColorToken, type DurationToken } from "@/styles/tokens";

/**
 * Contour field tuning. Committed values live in src/config/contour-field.json
 * (written by the dev-only tuning panel); colours and durations are token names.
 */
export type FieldConfig = typeof config;

export type DeviceProfile = {
  dprMax: number;
  heightmap: "desktop" | "mobile";
  glow: boolean;
  idleFps: number;
};

export const fieldConfig: FieldConfig = config;

export const colorOf = (token: string): string => color[token as ColorToken] ?? token;
export const msOf = (token: string): number => duration[token as DurationToken] ?? Number(token);

/** sRGB hex → [r, g, b] in 0..1, passed to the shader without colour management. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function isMobileProfile(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(pointer: coarse)").matches || Math.max(window.innerWidth, window.innerHeight) < 900
  );
}

export function deviceProfile(cfg: FieldConfig = fieldConfig): DeviceProfile {
  return (isMobileProfile() ? cfg.mobile : cfg.desktop) as DeviceProfile;
}
