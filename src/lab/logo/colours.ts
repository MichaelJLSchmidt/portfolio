import { type Identity, palette, text as TEXT } from '../../design/palette'
import type { Paints } from './svg-string'
import type { Container } from './tree'

/*
 * What a mark is shown on and in: the page identity, the ground, the colour
 * mode and the container. The same resolution feeds the inline stage (as CSS
 * custom properties) and the downloads (baked into the file).
 */
export const ACCENT_IDENTITIES = ['ember', 'tide', 'grove', 'saffron', 'glacier'] as const satisfies Identity[]
export type AccentIdentity = (typeof ACCENT_IDENTITIES)[number]
export const ALL_IDENTITIES: Identity[] = ['ink', ...ACCENT_IDENTITIES]

export type Surface = 'field' | 'white' | 'tabbar'
export type ColourMode = 'neutral' | 'mono' | 'dark' | `accent-${AccentIdentity}`

export type Look = { identity: Identity; surface: Surface; colour: ColourMode; container: Container }

export const SURFACE: Record<Exclude<Surface, 'field'>, string> = { white: '#FFFFFF', tabbar: '#DEE1E6' }
export const isLight = (s: Surface) => s !== 'field'

export const COLOUR_LABEL: Record<string, string> = {
  neutral: 'Neutral',
  mono: 'One colour',
  dark: 'Dark on light',
  ...Object.fromEntries(ACCENT_IDENTITIES.map((id) => [`accent-${id}`, `${id[0].toUpperCase()}${id.slice(1)} accent`])),
}
export const COLOUR_MODES: ColourMode[] = [
  'neutral',
  'mono',
  ...ACCENT_IDENTITIES.map((id) => `accent-${id}` as const),
  'dark',
]

export const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export type Resolved = Paints & { ground: string }

/**
 *   neutral   text colour, accent follows the page identity
 *   mono      everything in the text colour
 *   accent-X  text colour, accent fixed to identity X
 *   dark      ink on light grounds; the accent darkens to the identity's mid
 * Container: the identity's mid (glow on ink) behind light marks, paper behind dark ones.
 */
export function resolve(look: Look): Resolved {
  const { identity, surface, colour } = look
  const ground = surface === 'field' ? palette[identity].field : SURFACE[surface]
  const dark = colour === 'dark'
  const neutral = dark ? palette.ink.field : TEXT
  let accent: string
  if (colour === 'mono') accent = neutral
  else if (dark) accent = identity === 'ink' ? neutral : palette[identity].mid
  else if (colour.startsWith('accent-')) accent = palette[colour.slice(7) as AccentIdentity].accent
  else accent = palette[identity].accent
  const container = dark ? TEXT : identity === 'ink' ? palette.ink.glow : palette[identity].mid
  return { ground, neutral, accent, container }
}

/** The stage's CSS: ground, text colour and the two custom properties the mark reads. */
export function stageStyle(look: Look): Record<string, string> {
  const r = resolve(look)
  return { background: r.ground, color: r.neutral, '--accent': r.accent, '--lab-container': r.container }
}

/** The colour mode that suits a ground (light marks on fields, dark on white / tab bar). */
export function colourForSurface(surface: Surface, current: ColourMode): ColourMode {
  if (isLight(surface)) return 'dark'
  return current === 'dark' ? 'neutral' : current
}
