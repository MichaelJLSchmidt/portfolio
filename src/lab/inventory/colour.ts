import { hexToLab, labToRgb } from '@/components/background/oklab'
import * as P from '@/design/palette'

/*
 * Colour values for the inventory, computed with the site's own OKLab code (the background
 * field's src/components/background/oklab.ts): OKLCH from a hex, the hex of an OKLab mix (what
 * color-mix(in oklab, ...) gives) and of an OKLCH lightness change (oklch(from c L c h)), and
 * WCAG contrast. Server only.
 */

const hex2 = (n: number) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()

export const rgbHex = (rgb: number[]) => `#${hex2(rgb[0])}${hex2(rgb[1])}${hex2(rgb[2])}`

/** "oklch(63.8% 0.155 31.4)". */
export function oklch(hex: string): string {
  const [L, a, b] = hexToLab(hex)
  const C = Math.hypot(a, b)
  const h = C < 0.0005 ? 0 : (Math.atan2(b, a) * 180) / Math.PI
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${((h + 360) % 360).toFixed(1)})`
}

/** color-mix(in oklab, a, b `pctB`%) as a hex. */
export function mixOklab(a: string, b: string, pctB: number): string {
  const A = hexToLab(a)
  const B = hexToLab(b)
  const t = pctB / 100
  return rgbHex(labToRgb(A.map((v, i) => v * (1 - t) + B[i] * t)))
}

/** oklch(from c L c h): the colour at OKLCH lightness `L` (0..1), chroma and hue kept. */
export function withLightness(hex: string, L: number): string {
  const [l, a, b] = hexToLab(hex)
  void l
  return rgbHex(labToRgb([L, a, b]))
}

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

/** WCAG 2 contrast ratio. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)
export const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

export type ColourToken = {
  /** Reference ID: "identity.ember.glow", "colour.text", "colour.contour.lake". */
  id: string
  /** The export and key path in src/design/palette.ts: "palette.ember.glow". */
  path: string
  /** The export it belongs to. */
  name: string
  hex: string
}

/**
 * Every colour value src/design/palette.ts exports, by walking the module (its exports in name
 * order, each object's keys in source order): hex strings (text, muted, ...), objects of hexes
 * (contour), the identities (palette). A new export of either shape appears here by itself.
 * Gradients (logoGradients) refer to these and are listed on their own.
 */
export function paletteColours(): ColourToken[] {
  const out: ColourToken[] = []
  for (const [name, value] of Object.entries(P)) {
    if (name === 'logoGradients') continue
    if (isHex(value)) out.push({ id: `colour.${kebab(name)}`, path: name, name, hex: value })
    else if (name === 'palette')
      for (const [id, shades] of Object.entries(value as Record<string, Record<string, string>>))
        for (const [shade, hex] of Object.entries(shades))
          out.push({ id: `identity.${id}.${shade}`, path: `palette.${id}.${shade}`, name, hex })
    else if (value && typeof value === 'object' && Object.values(value).every(isHex))
      for (const [k, hex] of Object.entries(value as Record<string, string>))
        out.push({ id: `colour.${kebab(name)}.${kebab(k)}`, path: `${name}.${k}`, name, hex })
  }
  return out
}

/** The token a hex comes from ("identity.ember.glow"): the first with that value. */
export function tokenOf(hex: string): ColourToken | null {
  return paletteColours().find((t) => t.hex.toUpperCase() === hex.toUpperCase()) ?? null
}
