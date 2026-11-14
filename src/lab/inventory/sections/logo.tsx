import { logoGradients } from '@/design/palette'
import { withBase } from '@/lib/site'
import { logo as L, ease } from '@/motion/tokens'
import { lineIn, listFiles, usages } from '../../source'
import { Logo, type LogoState } from '../client/logo-specimen'
import { type ItemData, type SectionData, code, ms } from '../ui'
import { gradientVars } from './colours'

const LOGO = 'src/components/logo.tsx'
const TOKENS = 'src/motion/tokens.ts'
const gradients = Object.keys(logoGradients) as (keyof typeof logoGradients)[]

/** Sizes from the favicon's to large; the header's is the CSS height of .logo (30 px). */
const sizes = [16, 24, 30, 48, 64, 96, 160]

const states: { state: LogoState; title: string; values: ItemData['values']; token: string }[] = [
  {
    state: 'rest',
    title: 'At rest',
    token: 'logo.flow',
    values: [['gradient flow', `one loop every ${L.flow.dur} s, linear (reduced: still)`]],
  },
  {
    state: 'hover',
    title: 'Hover and focus: the fan',
    token: 'logo.hover',
    values: [
      ['turn', `±${L.hover.deg}°`],
      ['part', `${L.hover.spread} units`],
      ['lift', `back ${L.hover.lift.back}, front ${L.hover.lift.front} units`],
      ['timing', `${ms(L.hover.dur)} ease.move, front card ${ms(L.hover.front)} later`],
      ['curve', code(`cubic-bezier(${ease.move.join(', ')})`)],
    ],
  },
  {
    state: 'turn',
    title: 'The letters egg: the turn',
    token: 'logo.turn',
    values: [
      ['turn', `${ms(L.turn.dur)} (ease.exit, then ease.enter), front card ${ms(L.turn.front)} later`],
      ['hold', `${L.turn.hold} s, then back`],
      ['trigger', `a click on home, a ${L.longPress} s long press by touch`],
    ],
  },
  {
    state: 'exit',
    title: 'To Back and back: exit, then deal',
    token: 'logo.exit',
    values: [
      ['exit', `${ms(L.exit.dur)}, close ${L.exit.close}, sink ${L.exit.sink} units, fade`],
      ['deal', `${ms(L.deal.dur)} each (ease.enter), front ${ms(L.deal.returnFront)} later`],
    ],
  },
]

export function logoSection(): SectionData {
  const logoUse = usages({ jsx: ['Logo'], exports: [{ module: 'src/components/logo', name: 'Logo' }] })
  const stateItems: ItemData[] = gradients.flatMap((g) =>
    states.map((s): ItemData => ({
      id: `logo.${s.state}.${g}`,
      title: s.title,
      render: <Logo size={72} state={s.state} style={gradientVars(g)} />,
      values: [['gradient', code(`gradient.${g}`)], ...(s.values ?? [])],
      source: [
        { file: LOGO, line: lineIn(LOGO, 'export function Logo'), name: 'Logo' },
        { file: TOKENS, line: lineIn(TOKENS, 'export const logo'), name: s.token },
      ],
      usage: logoUse,
    })),
  )
  const sizeItems: ItemData[] = gradients.map((g) => ({
    id: `logo.sizes.${g}`,
    render: (
      <span className="inv-sizes" style={gradientVars(g)}>
        {sizes.map((px) => (
          <span key={px} className="inv-size">
            <Logo size={px} />
            <span className="inv-k">{px}</span>
          </span>
        ))}
      </span>
    ),
    values: [
      ['heights', `${sizes.join(', ')} px (the header: 30 px, header.module.css .logo)`],
      ['viewBox', code('5 8.5 38 31')],
    ],
    source: { file: LOGO, line: lineIn(LOGO, 'viewBox='), name: 'Logo' },
    usage: logoUse,
  }))
  const icons = listFiles('src/app').filter((f) => /\/(icon|apple-icon)\.\w+$/.test(f))
  const iconItems: ItemData[] = icons.map((file) => {
    const name = file.split('/').pop()!
    const px = name.startsWith('apple') ? [60, 120, 180] : [16, 32, 48, 96]
    return {
      id: `logo.${name.replace(/\.\w+$/, '')}`,
      title: name.startsWith('apple') ? 'Apple touch icon' : 'Favicon (tab icon)',
      render: (
        <span className="inv-sizes">
          {px.map((s) => (
            <span key={s} className="inv-size">
              {/* eslint-disable-next-line @next/next/no-img-element -- the file itself, at its sizes */}
              <img src={withBase(`/${name}`)} width={s} height={s} alt="" />
              <span className="inv-k">{s}</span>
            </span>
          ))}
        </span>
      ),
      values: [
        ['file', code(file)],
        ['note', 'the logo’s two cards without letters, fixed colours (no gradient)'],
      ],
      source: { file, name: 'Next.js metadata file' },
      usage: null,
    }
  })
  return {
    id: 'logo',
    title: 'Logo',
    intro: (
      <>
        The site&rsquo;s <code>Logo</code> component with the header&rsquo;s styles, in every gradient: at rest, the
        hover fan (opened through its real hover handler), the letters egg and the exit and deal (Play runs them with
        the component&rsquo;s own code), and from favicon size to large. Reduced motion: the component keeps the cards
        still.
      </>
    ),
    groups: [
      { title: 'States, per gradient', items: stateItems, layout: 'tile' },
      { title: 'Sizes, per gradient', items: sizeItems, layout: 'wide' },
      { title: 'Icon files', items: iconItems, layout: 'wide' },
    ],
  }
}
