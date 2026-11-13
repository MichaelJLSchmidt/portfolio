import type { CSSProperties, ReactNode } from 'react'
import * as layout from '@/design/layout'
import { motionCss } from '@/motion/tokens'
import { lineIn, usages } from '../../source'
import { type CssVar, declarations, rootVars } from '../css'
import { type ItemData, type SectionData, code } from '../ui'

const LAYOUT = 'src/design/layout.ts'

/** A rendering for a CSS token by what it is: a radius, a layer, a shadow, a length. */
function cssRender(v: { name: string; value: string }): ReactNode {
  const name = v.name
  if (/radius/.test(name)) return <span className="inv-radius" style={{ borderRadius: `var(${name})` }} />
  if (/^--z-/.test(name)) return <span className="inv-layer">{v.value}</span>
  if (/shadow/.test(name)) return <span className="inv-shadow" style={{ boxShadow: `var(${name})` }} />
  if (/ratio/.test(name)) return <span className="inv-ratio" style={{ aspectRatio: `var(${name})` }} />
  if (/^-?[\d.]+$/.test(v.value)) return <span className="inv-layer">{v.value}</span>
  return <span className="inv-length" style={{ '--len': `var(${name})` } as CSSProperties} />
}

const cssItem = (v: CssVar): ItemData => ({
  id: `css.${v.name.slice(2)}`,
  render: cssRender(v),
  values: [['value', code(v.value)]],
  note: v.comment || undefined,
  source: { file: v.file, line: v.line, name: v.name },
  usage: usages({ cssVars: [v.name], except: [v.file] }),
})

/** design/layout.ts walked: every value, with a length bar for pixel values. */
function layoutTokens(): ItemData[] {
  const items: ItemData[] = []
  const walk = (v: unknown, path: string[]) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k, w] of Object.entries(v)) walk(w, [...path, k])
      return
    }
    const [name, ...member] = path
    const px = typeof v === 'number' && !/columns|index|content/.test(path.join('.')) ? v : null
    items.push({
      id: `layout.${path.join('.')}`,
      render: px !== null ? <span className="inv-length" style={{ '--len': `${px}px` } as CSSProperties} /> : null,
      values: [['value', code(typeof v === 'string' ? v : JSON.stringify(v))]],
      source: { file: LAYOUT, line: lineIn(LAYOUT, `export const ${name}`), name: path.join('.') },
      usage: usages({ exports: [{ module: 'src/design/layout', name, member }], except: [LAYOUT] }),
    })
  }
  for (const [name, value] of Object.entries(layout)) if (typeof value !== 'function') walk(value, [name])
  return items
}

export function layoutSection(): SectionData {
  const shown = /^--(text|leading|tracking|font)-|color-mix|^--(bg|line|accent|id-)/
  const base = rootVars('src/styles/tokens.css').filter((v) => !shown.test(v.name) && !shown.test(v.value))
  const grid = rootVars('src/styles/layout.css')
  const shadows = [...declarations(motionCss())]
    .filter(([name]) => /shadow-(lifted|contact|settled)$/.test(name))
    .map(([name, value]): ItemData => ({
      id: `css.${name.slice(2)}`,
      render: <span className="inv-shadow" style={{ boxShadow: `var(${name})` }} />,
      values: [['value', code(value)]],
      source: {
        file: 'src/motion/tokens.ts',
        line: lineIn('src/motion/tokens.ts', 'shadow: {'),
        name: `cardPlay.play.shadow (${name})`,
      },
      usage: usages({ cssVars: [name] }),
    }))
  return {
    id: 'layout',
    title: 'Space, layout and depth',
    intro: (
      <>
        Not in the brief&rsquo;s groups but visual all the same: the space scale, radii, layers and card geometry of{' '}
        <code>tokens.css</code>, the Spread grid of <code>layout.css</code> and its typed mirror{' '}
        <code>src/design/layout.ts</code> (walked), and the played card&rsquo;s shadows.
      </>
    ),
    groups: [
      { title: 'Base tokens (tokens.css)', items: base.map(cssItem) },
      { title: 'Grid and rhythm (layout.css)', items: grid.map(cssItem) },
      { title: 'Shadows', items: shadows, layout: 'tile' },
      { title: 'Layout tokens (layout.ts)', items: layoutTokens() },
    ],
  }
}
