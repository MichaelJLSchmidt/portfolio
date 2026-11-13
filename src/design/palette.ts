/*
 * Colour identities. Each has field / mid / glow / accent / ink. Single source
 * for CSS (identityCss(), injected in the root layout) and the background
 * shader. Rules: body text is always `text` on fields; accents only for links,
 * focus rings, metrics and dividers; text on glow surfaces uses the identity's
 * ink, never white.
 */
export type Identity = 'ink' | 'ember' | 'tide' | 'grove' | 'saffron' | 'glacier'

export type Swatch = { field: string; mid: string; glow: string; accent: string; ink: string }

export const text = '#ECEAE4'
export const muted = '#9A9890'

export const palette: Record<Identity, Swatch> = {
  // Home. accent and ink are not given by the spec: a light warm grey for
  // links/focus and the field itself for text on glow.
  ink: { field: '#0E0F11', mid: '#1A1C20', glow: '#2A2D33', accent: '#D6D3CA', ink: '#0E0F11' },
  ember: { field: '#2A0E0C', mid: '#7A1F17', glow: '#E2553D', accent: '#FF8A73', ink: '#140806' },
  tide: { field: '#0A1A2B', mid: '#13406E', glow: '#3D8BDA', accent: '#8CC4FF', ink: '#06101A' },
  grove: { field: '#0C1F17', mid: '#1E5A3E', glow: '#3FAF7A', accent: '#8FE0B5', ink: '#06120C' },
  saffron: { field: '#241A06', mid: '#6B4E0E', glow: '#E8B23A', accent: '#F5CF73', ink: '#171004' },
  // About. The spec gives field, mid, lines and text; glow and ink are derived
  // (glow sits between mid and the contour colour).
  glacier: { field: '#0B1A1C', mid: '#14393B', glow: '#2C6E6C', accent: '#5FB3B0', ink: '#061011' },
}

/** About's text colour on the contour field. */
export const glacierText = '#DCE8E6'

/**
 * About's contour field: the old password page's ground, and the colours its
 * SVGs draw with (public/contour-bg/: lines #8A8C80, lakes #8FC7E8). The WebGL
 * morph draws the same lines and lakes (src/components/background/contours.ts).
 */
export const contour = { ground: '#1B1C18', line: '#8A8C80', lake: '#8FC7E8' } as const

export const identities = Object.keys(palette) as Identity[]

/**
 * The header logo's front card (the F) is one of four gradients, one per card, from the four
 * cards' own colours: the card's glow, its accent, and the accent of the next card round the
 * colour wheel (ember, saffron, grove, tide, ember), so no two look alike. The
 * pre-paint script (src/motion/preferences.ts) picks one per page load, never the one the last
 * load showed; the logo's stops read them as --logo-a / -b / -c (logoGradientCss()) and let the
 * three flow along the card (header.module.css). Without JavaScript: the first.
 */
export const logoGradients = {
  ember: [palette.ember.glow, palette.ember.accent, palette.saffron.accent],
  tide: [palette.tide.glow, palette.tide.accent, palette.ember.accent],
  grove: [palette.grove.glow, palette.grove.accent, palette.tide.accent],
  saffron: [palette.saffron.glow, palette.saffron.accent, palette.grove.accent],
} as const satisfies Partial<Record<Identity, readonly [string, string, string]>>

export type LogoGradient = keyof typeof logoGradients
export const logoGradientNames = Object.keys(logoGradients) as LogoGradient[]

/** :root's logo colours (the first gradient) and one html[data-logo-gradient] scope per gradient. */
export function logoGradientCss(): string {
  const vars = (name: LogoGradient) => logoGradients[name].map((c, i) => `--logo-${'abc'[i]}:${c}`).join(';')
  return (
    `:root{${vars(logoGradientNames[0])}}` +
    logoGradientNames.map((n) => `:root[data-logo-gradient="${n}"]{${vars(n)}}`).join('')
  )
}

/**
 * Text links (globals.css .link): at rest a marker block in a deeper shade of the page's identity
 * behind the text, on hover an underline in the identity's accent at full strength. The shade is
 * the identity's glow mixed toward its field in OKLab by `mix`, tuned per identity so the text
 * (`text`) over it keeps at least 4.5:1 and the block still reads as the colour (contrast values:
 * docs/contracts.md#colour). Ink pages (home, 404) follow the logo: the block and the line are
 * the page load's three logo colours as a gradient along the link, flowing with the logo's front
 * card; the block takes each colour to OKLCH lightness `inkDepth` with its chroma and hue kept (a
 * plain mix toward the ink field turns the light accents grey), or, where relative colours are
 * unsupported, mixes it toward the ink field by `inkMix`.
 */
export const linkMark = {
  mix: { ember: 0.25, tide: 0.28, grove: 0.39, saffron: 0.49, glacier: 0.05 },
  inkDepth: 0.49,
  inkMix: 0.52,
} as const satisfies { mix: Record<Exclude<Identity, 'ink'>, number>; inkDepth: number; inkMix: number }

/**
 * A scope's link colours: the line's three stops (`--link-a/-b/-c`), the block's shade
 * (`--link-rest`; ink: none, the link derives it from its flowing colours) and the flow
 * (`--link-flow`: the animation that carries the logo's colours along the link, ink only).
 */
function linkVars(id: Identity): string {
  if (id === 'ink')
    return '--link-a:var(--logo-a);--link-b:var(--logo-b);--link-c:var(--logo-c);--link-rest:initial;--link-flow:link-flow'
  const pct = Math.round(linkMark.mix[id] * 100)
  const line = `var(--${id}-accent)`
  return `--link-a:${line};--link-b:${line};--link-c:${line};--link-rest:color-mix(in oklab,var(--${id}-glow),var(--${id}-field) ${pct}%);--link-flow:none`
}

/**
 * CSS custom properties for every identity, plus [data-identity] scopes. Each
 * scope also re-declares --accent, so it follows the scope's --id-accent
 * (declared only on :root it would resolve once, to the ink accent).
 *
 * Links outside the page (the header's About, the footer's small print) take the identity of the
 * page shown: the page's own scope, the direct child of <main> (never the hand's cards, which carry
 * identities too), sets :root's link colours through :has(), so they change on every navigation.
 */
export function identityCss(): string {
  const root = [
    `--text:${text}`,
    `--muted:${muted}`,
    `--glacier-text:${glacierText}`,
    `--contour-ground:${contour.ground}`,
    `--link-depth:${linkMark.inkDepth}`,
    `--link-ink-mix:${Math.round(linkMark.inkMix * 100)}%`,
    linkVars('ink'),
  ]
  for (const id of identities) {
    for (const [k, v] of Object.entries(palette[id])) root.push(`--${id}-${k}:${v}`)
  }
  const scopes = identities
    .map(
      (id) =>
        `[data-identity="${id}"]{--id-field:var(--${id}-field);--id-mid:var(--${id}-mid);--id-glow:var(--${id}-glow);--id-accent:var(--${id}-accent);--id-ink:var(--${id}-ink);--accent:var(--id-accent);${linkVars(id)}}`,
    )
    .join('')
  const pages = identities.map((id) => `:root:has(#main>[data-identity="${id}"]){${linkVars(id)}}`).join('')
  return `:root{${root.join(';')}}${scopes}${pages}`
}
