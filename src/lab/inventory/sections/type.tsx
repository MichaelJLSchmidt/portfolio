import type { CSSProperties } from 'react'
import { WeightText } from '@/components/weight-text'
import { fluid, fluidRange, type as typeScale, typeClasses } from '@/design/type'
import { angle, dur, opsz, stagger, weight } from '@/motion/tokens'
import { absolute, lineIn, nodeRequire, readSource, usages } from '../../source'
import { RevealDemo } from '../client/reveal-demo'
import { rootVars } from '../css'
import { type ItemData, type SectionData, code, ms } from '../ui'

type Axis = { name: string; min: number; default: number; max: number }
type FontFile = { familyName: string; numGlyphs: number; variationAxes: Record<string, Axis> }

const FONTS = 'src/app/fonts.ts'
const TYPE = 'src/design/type.ts'
const sample: Record<string, string> = {
  label: 'Case study 02',
  body: 'A calm field breathes behind everything.',
  lead: 'Playing a card lifts it onto the table.',
  h3: 'What changed',
  h2: 'Shared foundations',
  display: 'Table',
  numeral: '07',
}

/** The fonts as src/app/fonts.ts loads them (next/font/local), with the axes their files declare. */
function fonts(): ItemData[] {
  const text = readSource(FONTS)
  const fontkit = nodeRequire('fontkit') as { openSync(path: string): FontFile }
  const tokens = rootVars('src/styles/tokens.css')
  return [...text.matchAll(/export const (\w+) = localFont\(\{([\s\S]*?)\n\}\)/g)].map((m) => {
    const [, name, body] = m
    const get = (k: string) => new RegExp(`${k}:\\s*'([^']+)'`).exec(body)?.[1]
    const file = `src/${get('src')!.replace(/^\.\.\//, '')}`
    const variable = get('variable')!
    const font = fontkit.openSync(absolute(file))
    const token = tokens.find((t) => t.value.startsWith(`var(${variable})`))
    const family = `var(${token?.name ?? variable})`
    const axes = Object.entries(font.variationAxes)
    const preload = /preload:\s*false/.test(body) ? 'no (fetched on first use)' : 'yes'
    return {
      id: `font.${name}`,
      title: font.familyName,
      render: (
        <span className="inv-font" style={{ fontFamily: family }}>
          <span className="inv-font-big">Aa Gg 0123 Ää</span>
          {axes.map(([tag, a]) => (
            <span key={tag} className="inv-axis">
              <span className="inv-k">{tag}</span>
              {[a.min, a.default, a.max]
                .filter((v, i, all) => all.indexOf(v) === i)
                .map((v) => (
                  <span
                    key={v}
                    style={{ fontVariationSettings: `'${tag}' ${v}` } as CSSProperties}
                    title={`${tag} ${v}`}
                  >
                    Ag<sub>{v}</sub>
                  </span>
                ))}
            </span>
          ))}
        </span>
      ),
      values: [
        ['file', code(file)],
        ['axes', axes.map(([tag, a]) => `${tag} ${a.min}–${a.max} (default ${a.default})`).join(' · ') || 'none'],
        ['glyphs', String(font.numGlyphs)],
        ['css', code(token ? `${token.name} → ${variable}` : variable)],
        ['preload', preload],
      ],
      source: [
        { file: FONTS, line: lineIn(FONTS, `export const ${name} =`), name },
        ...(token ? [{ file: token.file, line: token.line, name: token.name }] : []),
      ],
      usage: usages({
        cssVars: token ? [token.name, variable] : [variable],
        exports: [{ module: 'src/app/fonts', name }],
        except: [FONTS],
      }),
    }
  })
}

function scale(): ItemData[] {
  return (Object.keys(typeScale) as (keyof typeof typeScale)[]).map((name) => {
    const t = typeScale[name]
    const cls = typeClasses[name]
    const outline = name === 'numeral' ? typeClasses.numeralOutline : null
    const leading = typeof t.leading === 'number' ? `${t.leading}` : `${t.leading.px} px`
    return {
      id: `type.${name}`,
      render: (
        <span className="inv-type-sample">
          <span className={cls}>{sample[name] ?? name}</span>
          {outline ? <span className={`${cls} ${outline}`}>{sample[name]}</span> : null}
        </span>
      ),
      values: [
        ['family', `${t.family}`],
        ['weight', String(t.weight)],
        ...('opsz' in t ? [['opsz', String(t.opsz)] as const] : []),
        ['size', `${t.size.min} → ${t.size.max} px (${fluidRange.from} → ${fluidRange.to} px viewport)`],
        ['clamp', code(fluid(t.size.min, t.size.max))],
        ['leading', leading],
        ...('tracking' in t ? [['tracking', `${t.tracking} em`] as const] : []),
        ...('uppercase' in t ? [['case', 'uppercase'] as const] : []),
        ...('measure' in t ? [['measure', `${t.measure} ch`] as const] : []),
        ['class', code(`.${cls}${outline ? `, .${outline}` : ''}`)],
        ['css', code(`--type-${name}-size / -leading / -weight`)],
      ],
      source: [
        { file: TYPE, line: lineIn(TYPE, new RegExp(`^  ${name}: `, 'm')), name: `type.${name}` },
        { file: 'src/styles/type.css', line: lineIn('src/styles/type.css', `--type-${name}-size`), name: `.${cls}` },
      ],
      usage: usages({
        classes: [cls, ...(outline ? [outline] : [])],
        cssVars: [`--type-${name}-size`],
        except: ['src/styles/type.css'],
      }),
    }
  })
}

/** The older type tokens in tokens.css (sizes, leading, tracking, families). */
function tokenSizes(): ItemData[] {
  return rootVars('src/styles/tokens.css')
    .filter((v) => /^--(text|leading|tracking|font)-/.test(v.name))
    .map((v) => {
      const kind = v.name.split('-')[2]
      const style: CSSProperties =
        kind === 'text'
          ? { fontSize: `var(${v.name})` }
          : kind === 'leading'
            ? { lineHeight: `var(${v.name})` }
            : kind === 'tracking'
              ? { letterSpacing: `var(${v.name})` }
              : { fontFamily: `var(${v.name})` }
      return {
        id: `css.${v.name.slice(2)}`,
        render: (
          <span className="inv-type-token" style={style}>
            {kind === 'leading' ? 'Two lines of text\nset at this leading' : 'Table'}
          </span>
        ),
        values: [['value', code(v.value)]],
        note: v.comment || undefined,
        source: { file: v.file, line: v.line, name: v.name },
        usage: usages({ cssVars: [v.name], except: [v.file] }),
      }
    })
}

function weightAnimation(): ItemData[] {
  const KINDS = 'src/motion/kinds.ts'
  const h2Unused =
    usages({
      exports: [{ module: 'src/motion/tokens', name: 'weight', member: ['h2Start'] }],
      cssVars: ['--wght-h2-start'],
    }).length === 0
  return [
    {
      id: 'type.title-weight',
      title: 'The home title settling',
      render: (
        <RevealDemo kind="title">
          <p className="t-display inv-title-sample">
            <WeightText text="Table talk" final="h1" />
          </p>
        </RevealDemo>
      ),
      values: [
        ['wght', `${weight.h1Start} → ${weight.h1}`],
        ['opsz', `${opsz.start} → ${opsz.end}`],
        ['turn', `rotateX ${angle.word}° → 0, rise from ${'110%'}, ${ms(dur.l)} outExpo`],
        ['settle', `${ms(dur.xl)} outQuint`],
        ['between words', ms(stagger.words)],
        ['reduced', `one ${ms(dur.xs)} crossfade`],
      ],
      note: h2Unused
        ? `weight.h2Start (${weight.h2Start}) and --wght-h2-start are declared, but nothing reads them: only the home title animates its weight.`
        : undefined,
      source: [
        { file: KINDS, line: lineIn(KINDS, 'export async function title'), name: 'title()' },
        {
          file: 'src/motion/tokens.ts',
          line: lineIn('src/motion/tokens.ts', 'export const weight'),
          name: 'weight.h1Start, opsz.start',
        },
        { file: 'src/components/weight-text.tsx', name: 'WeightText' },
      ],
      usage: usages({
        exports: [
          { module: 'src/motion/kinds', name: 'title' },
          { module: 'src/components/weight-text', name: 'WeightText' },
        ],
      }),
    },
  ]
}

export function typeSection(): SectionData {
  return {
    id: 'type',
    title: 'Typography',
    intro: (
      <>
        The fonts as <code>src/app/fonts.ts</code> loads them (axes read from the font files), the type scale walked
        from <code>src/design/type.ts</code> and rendered with its classes, the older size tokens of tokens.css, and the
        title&rsquo;s weight animation, replayed with the reveal&rsquo;s own code.
      </>
    ),
    groups: [
      { title: 'Fonts', items: fonts(), layout: 'wide' },
      { title: 'Type scale', items: scale(), layout: 'wide' },
      { title: 'Title weight animation', items: weightAnimation(), layout: 'wide' },
      { title: 'Type tokens (tokens.css)', items: tokenSizes() },
    ],
  }
}
