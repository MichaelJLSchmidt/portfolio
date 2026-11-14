import type { ReactNode } from 'react'
import { duration, ease, stagger } from '@/motion/tokens'
import { isLab, lineIn, sourceFiles, usages } from '../../source'
import { HeaderClone } from '../client/header-clone'
import { type ItemData, type SectionData, code, ms } from '../ui'

const LINK = 'src/styles/link.css'
type State = 'rest' | 'hover' | 'focus' | 'current'

/** One specimen per state: `make(state)` renders it with data-force (ForcedStates) or aria-current. */
function States({ states, make }: { states: State[]; make: (s: State) => ReactNode }) {
  return (
    <span className="inv-states">
      {states.map((s) => (
        <span key={s} className="inv-state">
          <span className="inv-state-box">{make(s)}</span>
          <span className="inv-k">{s}</span>
        </span>
      ))}
    </span>
  )
}

const force = (s: State) =>
  s === 'hover' || s === 'focus' ? { 'data-force': s } : s === 'current' ? { 'aria-current': 'page' as const } : {}

/** Every selector with :hover or :focus-visible in the site's stylesheets: file, line, selector. */
function stateRules() {
  const out: { file: string; line: number; selector: string }[] = []
  for (const f of sourceFiles().filter((f) => !isLab(f.path) && f.path.endsWith('.css'))) {
    const re = /(^|\})\s*([^{}@/]*(?::hover|:focus-visible)[^{}]*)\{/g
    for (const m of f.text.matchAll(re)) {
      const at = m.index + m[0].indexOf(m[2])
      out.push({
        file: f.path,
        line: f.text.slice(0, at).split('\n').length,
        selector: m[2].replace(/\s+/g, ' ').trim(),
      })
    }
  }
  return out
}

export function linksSection(): SectionData {
  const linkTiming: ItemData['values'] = [
    ['in', `${ms(duration.linkIn)} (triangle ${ms(duration.linkMarkIn)})`],
    ['out', `${ms(duration.linkOut)} (triangle ${ms(duration.linkMarkOut)})`],
    ['curve', code(`ease.link cubic-bezier(${ease.link.join(', ')})`)],
    ['reduced', 'instant; the gradient holds still'],
  ]
  const linkUse = (cls: string) => usages({ classes: [cls], except: [LINK] })
  const text: ItemData[] = [
    {
      id: 'link.inline',
      title: 'Text link in running text',
      render: (
        <States
          states={['rest', 'hover', 'focus']}
          make={(s) => (
            <span className="t-body">
              Read the{' '}
              <a className="link" href="#links" {...force(s)} tabIndex={-1}>
                case study
              </a>{' '}
              first.
            </span>
          )}
        />
      ),
      values: [
        ['rest', 'a marker block in the identity’s deeper shade behind the lower part, shifted right'],
        ['hover, focus', 'the block slides into an underline in the accent'],
        ...(linkTiming ?? []),
      ],
      source: { file: LINK, line: lineIn(LINK, '.link {'), name: '.link' },
      usage: linkUse('link'),
    },
    {
      id: 'link.standalone',
      title: 'Standalone link (nothing after it)',
      render: (
        <States
          states={['rest', 'hover', 'focus', 'current']}
          make={(s) => (
            <a className="link link-standalone" href="#links" {...force(s)} tabIndex={-1}>
              All projects
            </a>
          )}
        />
      ),
      values: [
        ['hover, focus', 'the underline and a small triangle after the text'],
        ['current', 'aria-current="page": the line, still; no block, triangle or hover'],
      ],
      source: { file: LINK, line: lineIn(LINK, '.link-standalone {'), name: '.link-standalone' },
      usage: linkUse('link-standalone'),
    },
    {
      id: 'link.vertical',
      title: 'Vertical link (About’s terrain credit)',
      render: (
        <States
          states={['rest', 'hover', 'focus']}
          make={(s) => (
            <span className="inv-vertical t-label">
              <a className="link link-vertical" href="#links" {...force(s)} tabIndex={-1}>
                Terrain data © swisstopo
              </a>
            </span>
          )}
        />
      ),
      values: [['axes', 'the same marker along writing-mode: vertical-rl']],
      source: { file: LINK, line: lineIn(LINK, '.link-vertical {'), name: '.link-vertical' },
      usage: linkUse('link-vertical'),
    },
    {
      id: 'button.pill',
      title: 'Button',
      render: (
        <States
          states={['rest', 'hover', 'focus']}
          make={(s) => (
            <button type="button" className="button" {...force(s)} tabIndex={-1}>
              Draw a method
            </button>
          )}
        />
      ),
      values: [['shape', '44 px pill, accent hairline at 55%, full accent on hover']],
      source: { file: 'src/app/globals.css', line: lineIn('src/app/globals.css', '.button {'), name: '.button' },
      usage: usages({ classes: ['button'], except: ['src/app/globals.css'] }),
    },
    {
      id: 'link.skip',
      title: 'Skip link',
      render: (
        <States
          states={['rest', 'focus']}
          make={(s) => (
            <a
              className="skip-link"
              href="#links"
              {...force(s)}
              tabIndex={-1}
              style={{ position: 'relative', inset: 'auto' }}
            >
              Skip to content
            </a>
          )}
        />
      ),
      values: [['rest', 'clipped away; shown on keyboard focus']],
      note: 'Placed in the flow here; on the site it is fixed at the top left.',
      source: { file: 'src/app/globals.css', line: lineIn('src/app/globals.css', '.skip-link,'), name: '.skip-link' },
      usage: usages({ classes: ['skip-link'], except: ['src/app/globals.css'] }),
    },
  ]
  const HEADER = 'src/components/header.module.css'
  const clone = (part: 'tray' | 'slot', target: 'about' | 'lab' | 'locale' | 'slot', states: State[], back = false) => (
    <States
      states={states}
      make={(s) => <HeaderClone part={part} target={target} force={s === 'rest' ? undefined : s} back={back} />}
    />
  )
  const header: ItemData[] = [
    {
      id: 'header.about',
      title: 'Header: About (in the tray)',
      render: clone('tray', 'about', ['rest', 'hover', 'focus', 'current']),
      values: [['style', 'a standalone text link in the tray capsule, in the page’s identity']],
      source: [
        {
          file: 'src/components/header.tsx',
          line: lineIn('src/components/header.tsx', 'className={styles.about}'),
          name: 'Header',
        },
        { file: HEADER, line: lineIn(HEADER, '.about {'), name: '.about' },
      ],
      usage: null,
    },
    {
      id: 'header.lab',
      title: 'Header: Lab (temporary, gated builds only)',
      render: clone('tray', 'lab', ['rest', 'hover', 'focus', 'current']),
      values: [['style', 'About’s link, in a dashed capsule (internal tool)']],
      source: {
        file: 'src/lab/header-link.tsx',
        line: lineIn('src/lab/header-link.tsx', 'export const LabLink'),
        name: 'LabLink',
      },
      usage: null,
    },
    {
      id: 'header.locale',
      title: 'Header: language switcher',
      render: clone('tray', 'locale', ['rest', 'hover', 'focus']),
      values: [['style', 'the active language on a face-up chip; the other muted, a hairline chip on hover and focus']],
      source: { file: HEADER, line: lineIn(HEADER, '.locale {'), name: '.language, .chip, .locale' },
      usage: null,
    },
    {
      id: 'header.back',
      title: 'Header: Back (detail pages)',
      render: clone('slot', 'slot', ['rest', 'hover', 'focus'], true),
      values: [
        ['hover, focus', 'the arrow pulls back, the letters roll, a chip draws in'],
        ['timing', `${ms(duration.backPull)}, letters ${ms(stagger.letters)} apart, chip ${ms(duration.chip)}`],
      ],
      source: { file: HEADER, line: lineIn(HEADER, '.back {'), name: '.slot[data-slot-mode="back"]' },
      usage: null,
    },
  ]
  const rules = stateRules()
  return {
    id: 'links',
    title: 'Links and buttons',
    intro: (
      <>
        At rest, on hover and on focus side by side. Hover and focus are the site&rsquo;s own rules, applied without a
        pointer: the page copies every <code>:hover</code> and <code>:focus-visible</code> rule it has loaded onto{' '}
        <code>[data-force]</code> (nothing restated by hand). Each specimen is also a real element: hover it. The
        header&rsquo;s items are clones of the live header above.
      </>
    ),
    groups: [
      { title: 'Text links and buttons', items: text, layout: 'wide' },
      { title: 'Header', items: header, layout: 'wide' },
    ],
    extra: (
      <div className="inv-group">
        <h3 className="inv-group-title t-label">
          Every hover and focus rule <span className="inv-count">{rules.length}</span>
        </h3>
        <p className="inv-group-intro">
          All selectors with <code>:hover</code> or <code>:focus-visible</code> in the site&rsquo;s stylesheets, the
          ones not shown above included (the hand&rsquo;s cards, the rail, the next-project card, About&rsquo;s
          timeline).
        </p>
        <ul className="inv-rules">
          {rules.map((r, i) => (
            <li key={i}>
              <code className="inv-muted">
                {r.file}:{r.line}
              </code>{' '}
              <code>{r.selector}</code>
            </li>
          ))}
        </ul>
      </div>
    ),
  }
}
