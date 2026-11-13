import type { CSSProperties } from 'react'
import { identity as deckIdentity, cardPath } from '@content/deck'
import { fieldInitialCss } from '@/components/background/field-css'
import { type Identity, identities, identityCss, linkMark, logoGradients, palette, text } from '@/design/palette'
import { pathFields } from '@/motion/table-store'
import { isLab, lineIn, sourceFiles, usages } from '../../source'
import { Logo } from '../client/logo-specimen'
import { contrast, kebab, mixOklab, oklch, paletteColours, tokenOf, withLightness } from '../colour'
import { declarations, rootVars } from '../css'
import { type ItemData, type SectionData, Swatch, code, hexValue } from '../ui'

const PALETTE = 'src/design/palette.ts'
const MOD = 'src/design/palette'
const ratio = (a: string, b: string) => `${contrast(a, b).toFixed(2)}:1`

/** The custom properties identityCss() declares on :root (name -> value). */
const rootCss = () => declarations(identityCss())

/** A gradient's three stops as the logo and ink links read them. */
export const gradientVars = (name: keyof typeof logoGradients) =>
  Object.fromEntries(logoGradients[name].map((c, i) => [`--logo-${'abc'[i]}`, c])) as CSSProperties

/** Where an identity is assigned: the deck's cards, the pages the field paints it on, data-identity attributes. */
function identityUse(id: Identity) {
  const cards = Object.entries(deckIdentity)
    .filter(([, v]) => v === id)
    .map(([card]) => `card ${card} (${cardPath(card)})`)
  const pages = Object.entries(pathFields())
    .filter(([path, v]) => v === id && !cards.some((c) => c.includes(`(${path})`)))
    .map(([path]) => `field on ${path}`)
  const attrs = sourceFiles()
    .filter((f) => !isLab(f.path) && f.text.includes(`data-identity="${id}"`))
    .map((f) => `data-identity on ${f.path}`)
  const gradients = Object.entries(logoGradients)
    .filter(([, stops]) => stops.some((c) => Object.values(palette[id]).includes(c)))
    .map(([g]) => `gradient.${g}`)
  return [...cards, ...pages, ...attrs, ...(gradients.length ? [`stops of ${gradients.join(', ')}`] : [])]
}

/** How many files read a shade through the identity scope (--id-glow; the accent also as --accent). */
const scopeReaders = (shade: string) =>
  usages({ cssVars: [`--id-${shade}`, ...(shade === 'accent' ? ['--accent'] : [])], except: [PALETTE] }).length

/** What each shade is checked against (the palette's rules: text on fields, ink on glow, accents on fields). */
function pairFor(id: Identity, shade: string) {
  const s = palette[id]
  switch (shade) {
    case 'field':
      return `text on it ${ratio(text, s.field)}`
    case 'mid':
      return `text on it ${ratio(text, s.mid)}`
    case 'glow':
      return `ink on it ${ratio(s.ink, s.glow)}`
    case 'accent':
      return `on field ${ratio(s.accent, s.field)}`
    case 'ink':
      return `on glow ${ratio(s.ink, s.glow)}`
    default:
      return null
  }
}

export function coloursSection(): SectionData {
  const css = rootCss()
  const all = paletteColours()

  const base: ItemData[] = all
    .filter((t) => t.name !== 'palette')
    .map((t) => {
      const cssVar = `--${kebab(t.path).replace(/\./g, '-')}`
      const has = css.get(cssVar)?.toUpperCase() === t.hex.toUpperCase()
      const [name, ...member] = t.path.split('.')
      return {
        id: t.id,
        render: <Swatch colour={has ? `var(${cssVar})` : t.hex} />,
        values: [
          ...hexValue(t.hex, oklch(t.hex)),
          ['css', has ? code(cssVar) : 'no custom property'],
          ['on ink field', ratio(t.hex, palette.ink.field)],
        ],
        source: { file: PALETTE, line: lineIn(PALETTE, `export const ${name}`), name: t.path },
        usage: usages({ exports: [{ module: MOD, name, member }], cssVars: has ? [cssVar] : [], except: [PALETTE] }),
      }
    })

  const cssColour = /color-mix|#[0-9a-f]{3,8}\b|rgb|var\(--(?:[\w-]+-)?(?:field|mid|glow|accent|ink|text|muted)\)/i
  const cssTokens: ItemData[] = rootVars('src/styles/tokens.css')
    .filter((v) => cssColour.test(v.value))
    .map((v) => ({
      id: `css.${v.name.slice(2)}`,
      render: <Swatch colour={`var(${v.name})`} />,
      values: [['value', code(v.value)]],
      note: v.comment || undefined,
      source: { file: v.file, line: v.line, name: v.name },
      usage: usages({ cssVars: [v.name], except: [v.file] }),
    }))

  const identityGroups = identities.map((id) => ({
    title: `Identity ${id}`,
    intro: (
      <>
        Used for: {identityUse(id).join(' · ') || 'nothing assigns it'}. Scope:{' '}
        <code>[data-identity=&quot;{id}&quot;]</code> maps these to <code>--id-*</code> and <code>--accent</code>.
      </>
    ),
    items: Object.entries(palette[id]).map(([shade, hex]): ItemData => {
      const cssVar = `--${id}-${shade}`
      return {
        id: `identity.${id}.${shade}`,
        render: <Swatch colour={`var(${cssVar})`} />,
        values: [...hexValue(hex, oklch(hex)), ['css', code(cssVar)], ['contrast', pairFor(id, shade)]],
        source: {
          file: PALETTE,
          line: lineIn(PALETTE, new RegExp(`^\\s+${id}: \\{`, 'm')),
          name: `palette.${id}.${shade}`,
        },
        usedFor: (
          <>
            {identityUse(id).join(' · ') || 'nothing assigns it'}; read there as <code>--id-{shade}</code>
            {shade === 'accent' ? (
              <>
                {' '}
                and <code>--accent</code>
              </>
            ) : null}{' '}
            ({scopeReaders(shade)} files)
          </>
        ),
        usage: usages({
          exports: [{ module: MOD, name: 'palette', member: [id, shade] }],
          cssVars: [cssVar],
          except: [PALETTE],
        }),
      }
    }),
  }))

  const gradientLine = lineIn(PALETTE, 'export const logoGradients')
  const gradients: ItemData[] = (Object.keys(logoGradients) as (keyof typeof logoGradients)[]).map((name) => {
    const stops = logoGradients[name]
    return {
      id: `gradient.${name}`,
      render: (
        <span className="inv-gradient" style={gradientVars(name)} data-identity="ink">
          <Swatch colour="linear-gradient(to right, var(--logo-a), var(--logo-b), var(--logo-c))" wide />
          <Logo size={40} />
          <a className="link link-standalone" href="#colours" tabIndex={-1}>
            Text link
          </a>
        </span>
      ),
      values: stops.map((hex, i) => [
        `stop ${i} --logo-${'abc'[i]}`,
        <>
          <Swatch colour={hex} style={{ width: '1em', height: '1em' }} /> <code>{hex}</code> <code>{oklch(hex)}</code>{' '}
          from <code>{tokenOf(hex)?.id ?? '?'}</code>
        </>,
      ]),
      source: { file: PALETTE, line: gradientLine, name: `logoGradients.${name}` },
      usedFor: (
        <>
          the header logo&rsquo;s front card and the text links on ink pages, one gradient per page load (
          <code>html[data-logo-gradient=&quot;{name}&quot;]</code>)
        </>
      ),
      usage: usages({
        exports: [
          { module: MOD, name: 'logoGradients' },
          { module: MOD, name: 'logoGradientNames' },
        ],
        cssVars: ['--logo-a', '--logo-b', '--logo-c'],
        except: [PALETTE],
      }),
    }
  })

  const markLine = lineIn(PALETTE, 'export const linkMark')
  const markUsage = usages({
    exports: [{ module: MOD, name: 'linkMark' }],
    cssVars: ['--link-rest', '--link-depth', '--link-ink-mix'],
    except: [PALETTE],
  })
  const markers: ItemData[] = [
    ...(Object.entries(linkMark.mix) as [Exclude<Identity, 'ink'>, number][]).map(([id, mix]): ItemData => {
      const shade = mixOklab(palette[id].glow, palette[id].field, mix * 100)
      return {
        id: `link-marker.${id}`,
        render: (
          <span className="inv-marker" data-identity={id}>
            <Swatch colour="var(--link-rest)" />
            <a className="link" href="#colours" tabIndex={-1}>
              Link
            </a>
          </span>
        ),
        values: [
          ['mix', <code key="m">color-mix(in oklab, glow, field {Math.round(mix * 100)}%)</code>],
          ...hexValue(shade, oklch(shade)),
          ['text on it', ratio(text, shade)],
          ['line', <code key="l">identity.{id}.accent</code>],
        ],
        source: { file: PALETTE, line: markLine, name: `linkMark.mix.${id}` },
        usage: markUsage,
      }
    }),
    ...(Object.keys(logoGradients) as (keyof typeof logoGradients)[]).map((name): ItemData => {
      const shades = logoGradients[name].map((c) => withLightness(c, linkMark.inkDepth))
      return {
        id: `link-marker.ink.${name}`,
        render: (
          <span className="inv-marker" data-identity="ink" style={gradientVars(name)}>
            <Swatch colour={`linear-gradient(to right, ${shades.join(', ')})`} />
            <a className="link" href="#colours" tabIndex={-1}>
              Link
            </a>
          </span>
        ),
        values: [
          ['rule', <code key="r">oklch(from stop {linkMark.inkDepth} c h)</code>],
          ...shades.map((s, i): readonly [string, React.ReactNode] => [
            `stop ${i}`,
            <>
              <code>{s}</code> <code>{oklch(s)}</code> text {ratio(text, s)}
            </>,
          ]),
          ['fallback', <code key="f">color-mix(in oklab, stop, ink field {Math.round(linkMark.inkMix * 100)}%)</code>],
        ],
        source: { file: PALETTE, line: markLine, name: 'linkMark.inkDepth' },
        usedFor: `links on ink pages (home, 404) while gradient.${name} is the page load's`,
        usage: markUsage,
      }
    }),
  ]

  const initial = fieldInitialCss()
  const fieldLine = lineIn('src/components/background/field-css.ts', 'export function fieldInitialCss')
  const fields: ItemData[] = identities.map((id) => {
    const vars = declarations(initial, id === 'ink' ? ':root' : `:root[data-field="${id}"]`)
    const s = palette[id]
    return {
      id: `field.${id}`,
      render: (
        <span className="inv-pools">
          {(['field', 'mid', 'glow'] as const).map((k) => (
            <Swatch key={k} colour={`var(--${id}-${k})`} />
          ))}
        </span>
      ),
      values: [
        [
          'pools',
          <>
            field {code(s.field)} · mid {code(s.mid)} · glow {code(s.glow)}
          </>,
        ],
        ['strength', code(vars.get('--fi-i') ?? '?')],
        ['css', code(`--fi-field / --fi-mid / --fi-glow / --fi-i`)],
      ],
      source: [
        { file: 'src/components/background/field-css.ts', line: fieldLine, name: 'fieldInitialCss()' },
        { file: PALETTE, name: `palette.${id}.field / mid / glow` },
      ],
      usedFor: `the background field's three colour pools (WebGL shader and its CSS twin) on ${
        identityUse(id)
          .filter((u) => !u.startsWith('stops'))
          .join(', ') || 'no page'
      }`,
      usage: usages({
        cssVars: ['--fi-field', '--fi-i'],
        exports: [{ module: 'src/components/background/field-css', name: 'fieldInitialCss' }],
      }),
    }
  })

  // Colours written as literals in the site's stylesheets (outside the tokens).
  const literal = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g
  const seen = new Map<string, { file: string; line: number; value: string; count: number }>()
  for (const f of sourceFiles().filter((f) => !isLab(f.path) && f.path.endsWith('.css'))) {
    for (const m of f.text.matchAll(literal)) {
      const value = m[0].replace(/\s+/g, ' ')
      const key = `${f.path}|${value.toLowerCase()}`
      const known = seen.get(key)
      if (known) known.count++
      else seen.set(key, { file: f.path, line: f.text.slice(0, m.index).split('\n').length, value, count: 1 })
    }
  }
  const literals: ItemData[] = [...seen.values()].map((l) => {
    const stem = l.file
      .split('/')
      .pop()!
      .replace(/\.(module\.)?css$/, '')
    const slug = l.value
      .toLowerCase()
      .replace(/[^0-9a-z.]+/g, '-')
      .replace(/^-|-$/g, '')
    return {
      id: `css-literal.${stem}.${slug}`,
      render: <Swatch colour={l.value} />,
      values: [['value', code(l.value)], ...(l.count > 1 ? [['times', String(l.count)] as const] : [])],
      source: { file: l.file, line: l.line, name: 'literal' },
    }
  })

  return {
    id: 'colours',
    title: 'Colours',
    intro: (
      <>
        Everything in <code>src/design/palette.ts</code> (walked, so a new token appears here), the colour tokens of{' '}
        <code>src/styles/tokens.css</code>, and the colours stylesheets still write as literals. Contrast ratios are
        WCAG 2, computed with the field&rsquo;s OKLab code.
      </>
    ),
    groups: [
      { title: 'Base colours (palette.ts)', items: base },
      { title: 'Colour tokens (tokens.css)', items: cssTokens },
      ...identityGroups,
      {
        title: 'Logo gradients',
        intro: 'Each: the three stops and the tokens they come from, the logo and a text link with it.',
        items: gradients,
        layout: 'wide',
      },
      {
        title: 'Link marker shades',
        intro: 'The block behind a text link at rest, per identity; ink pages use the logo gradient.',
        items: markers,
      },
      { title: 'Background field colours', items: fields },
      {
        title: 'Literal colours in stylesheets',
        intro:
          'Colours written in CSS rather than read from a token (shadows, the vignette, the field’s @property defaults).',
        items: literals,
      },
    ],
  }
}
