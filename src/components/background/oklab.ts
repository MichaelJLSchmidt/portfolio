/*
 * OKLab helpers for the background field: colours are interpolated in OKLab
 * on the CPU (smooth, no muddy midpoints) and handed to the shader as sRGB.
 */
export type Lab = [number, number, number]

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export function hexToLab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16)
  const r = toLinear(((n >> 16) & 255) / 255)
  const g = toLinear(((n >> 8) & 255) / 255)
  const b = toLinear((n & 255) / 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab to gamma-encoded sRGB in 0..1 (clamped). */
export function labToRgb<T extends number[] | Float32Array>(
  [L, a, b]: Lab | number[],
  out: T = [0, 0, 0] as T,
  offset = 0,
): T {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  out[offset] = clamp01(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))
  out[offset + 1] = clamp01(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))
  out[offset + 2] = clamp01(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s))
  return out
}

/** CSS oklab() string. Non-legacy syntax, so CSS transitions also interpolate in OKLab. */
export const labCss = ([L, a, b]: Lab | number[]) => `oklab(${L.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)})`
