import type { CSSProperties } from 'react'
import { ChapterNumeral } from '@/components/layout/chapter-numeral'
import { numerals } from '@/content/generated/numerals'
import { isLab, lineIn, sourceFiles, usages } from '../../source'
import { HeaderClone } from '../client/header-clone'
import { RevealDemo } from '../client/reveal-demo'
import { type ItemData, type SectionData, code } from '../ui'

/** Icons drawn in CSS: every data: SVG a stylesheet uses (as a mask or a background). */
function cssIcons(): ItemData[] {
  const out: ItemData[] = []
  for (const f of sourceFiles().filter((f) => !isLab(f.path) && f.path.endsWith('.css'))) {
    for (const m of f.text.matchAll(/(--[\w-]+)?:?\s*(url\("data:image\/svg\+xml[^"]+"\))/g)) {
      const name = m[1] ?? 'url'
      const url = m[2]
      const line = f.text.slice(0, m.index).split('\n').length
      const stem = f.path
        .split('/')
        .pop()!
        .replace(/\.css$/, '')
      out.push({
        id: `icon.${stem}.${name.replace(/^--/, '')}`,
        render: (
          <span
            className="inv-mask-icon"
            style={
              {
                WebkitMask: `${url} center / contain no-repeat`,
                mask: `${url} center / contain no-repeat`,
              } as CSSProperties
            }
          />
        ),
        values: [
          ['drawn as', 'a mask in currentColor'],
          ['svg', code(decodeURIComponent(url.slice(5, -2)).replace(/^data:image\/svg\+xml,/, ''))],
        ],
        source: { file: f.path, line, name },
        usage: usages({ cssVars: name.startsWith('--') ? [name] : [], except: [f.path] }),
      })
    }
  }
  return out
}

export function iconsSection(): SectionData {
  const NUMERAL = 'src/components/layout/chapter-numeral.tsx'
  const digits = Object.keys(numerals.digits).join('')
  const items: ItemData[] = [
    {
      id: 'icon.back-arrow',
      title: 'Back’s arrow',
      render: <HeaderClone part="slot" target="slot" back />,
      values: [['drawing', '20 × 12, a 1.5 px stroke, round caps: a head and a shaft that draws in']],
      source: {
        file: 'src/components/header.tsx',
        line: lineIn('src/components/header.tsx', 'viewBox="0 0 20 12"'),
        name: 'Header (inline SVG)',
      },
      usage: null,
    },
    ...cssIcons(),
    {
      id: 'icon.chapter-numerals',
      title: 'Chapter numerals (outlines)',
      render: (
        <RevealDemo kind="draw">
          <span className="inv-numerals">
            <ChapterNumeral value={digits} />
          </span>
        </RevealDemo>
      ),
      values: [
        ['digits', code(digits)],
        ['from', 'Bricolage Grotesque at the numeral’s weight and optical size (scripts/build-numerals.mjs)'],
        ['stroke', '1 CSS px, currentColor (the accent at 60%)'],
      ],
      source: [
        { file: NUMERAL, line: lineIn(NUMERAL, 'export function ChapterNumeral'), name: 'ChapterNumeral' },
        { file: 'src/content/generated/numerals.ts', name: 'numerals' },
      ],
      usage: usages({ jsx: ['ChapterNumeral', 'NumeralBreaker'], except: [NUMERAL] }),
    },
  ]
  return {
    id: 'icons',
    title: 'Icons',
    intro:
      'The few drawn marks outside the logo and the illustrations: inline SVGs, the CSS-drawn ones and the numerals. The site has no icon set.',
    groups: [{ title: 'Marks', items, layout: 'tile' }],
    unrendered: [
      {
        what: 'The idle hint’s handwritten note and arrow',
        why: 'are drawn by the egg itself after 10 s idle on home (or 1 s with ?idle): see the Lab overview.',
        source: { file: 'src/eggs/idle-hint.tsx', name: 'IdleHint' },
      },
      {
        what: 'Management’s hiring connectors',
        why: 'are two hairlines laid out by that page’s grid, nothing to show on their own.',
        source: {
          file: 'src/app/[locale]/management/page.tsx',
          line: lineIn('src/app/[locale]/management/page.tsx', 'hiring-connector-x'),
          name: '.hiring-connector-x/-y',
        },
      },
    ],
  }
}
