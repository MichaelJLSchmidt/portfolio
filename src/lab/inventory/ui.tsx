import type { CSSProperties, ReactNode } from 'react'
import type { Usage } from '../source'
import { PlayAll } from './client/motion-demo'

/*
 * The inventory's building blocks (server components). Every artefact is an Item: its live
 * rendering, its reference ID (a button that copies it: CopyIds), its values, the file and export
 * it comes from, and where the code uses it.
 */

export type Value = readonly [label: string, value: ReactNode]
export type SourceRef = { file: string; line?: number; name: string }

export type ItemData = {
  id: string
  title?: ReactNode
  render: ReactNode
  values?: Value[]
  source: SourceRef | SourceRef[]
  /** Files that use it (null: the code cannot say). */
  usage?: Usage[] | null
  /** What it is used for, in words the code gives (cards, pages). */
  usedFor?: ReactNode
  note?: ReactNode
}

/** An item; `layout` row (a small rendering beside the facts), tile (above them) or wide (a full row). */
export function Item({ item, layout = 'row' }: { item: ItemData; layout?: 'row' | 'tile' | 'wide' }) {
  const sources = Array.isArray(item.source) ? item.source : [item.source]
  return (
    <article className="inv-item" data-layout={layout} id={`item-${item.id}`}>
      <div className="inv-render">{item.render}</div>
      <div className="inv-body">
        <p className="inv-head">
          <button type="button" className="inv-id" data-copy={item.id} title="Copy the reference ID">
            {item.id}
          </button>
          {item.title ? <span className="inv-title">{item.title}</span> : null}
        </p>
        {item.values?.length ? (
          <dl className="inv-values">
            {item.values.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {item.note ? <p className="inv-note">{item.note}</p> : null}
        <p className="inv-src">
          <span className="inv-k">Source</span>
          {sources.map((s, i) => (
            <span key={i} className="inv-src-one">
              <code>
                {s.file}
                {s.line ? `:${s.line}` : ''}
              </code>{' '}
              <code className="inv-export">{s.name}</code>
            </span>
          ))}
        </p>
        {item.usedFor ? (
          <p className="inv-for">
            <span className="inv-k">Used for</span> {item.usedFor}
          </p>
        ) : null}
        <UsageList usage={item.usage} />
      </div>
    </article>
  )
}

export function UsageList({ usage }: { usage?: Usage[] | null }) {
  if (usage === undefined) return null
  if (!usage?.length)
    return (
      <p className="inv-use">
        <span className="inv-k">Used in</span>{' '}
        <span className="inv-none">{usage === null ? 'not traceable in the code' : 'no file outside its source'}</span>
      </p>
    )
  const line = (u: Usage) => (
    <li key={u.file}>
      <code>
        {u.file}:{u.line}
      </code>
    </li>
  )
  return (
    <div className="inv-use">
      <span className="inv-k">Used in {usage.length}</span>
      <ul>{usage.slice(0, 3).map(line)}</ul>
      {usage.length > 3 ? (
        <details>
          <summary>{usage.length - 3} more</summary>
          <ul>{usage.slice(3).map(line)}</ul>
        </details>
      ) : null}
    </div>
  )
}

/** A group of items under an h3. */
export function Group({
  title,
  intro,
  items,
  layout = 'row',
  id,
  play,
}: {
  title: string
  intro?: ReactNode
  items: ItemData[]
  layout?: 'row' | 'tile' | 'wide'
  id?: string
  /** A Play all button for the group's demos. */
  play?: boolean
}) {
  return (
    <div className="inv-group" id={id}>
      <div className="inv-group-head">
        <h3 className="inv-group-title t-label">
          {title} <span className="inv-count">{items.length}</span>
        </h3>
        {play ? <PlayAll /> : null}
      </div>
      {intro ? <p className="inv-group-intro">{intro}</p> : null}
      <div className="inv-items" data-layout={layout}>
        {items.map((item) => (
          <Item key={item.id} item={item} layout={layout} />
        ))}
      </div>
    </div>
  )
}

export type SectionData = {
  id: string
  title: string
  intro?: ReactNode
  groups: { title: string; intro?: ReactNode; items: ItemData[]; layout?: 'row' | 'tile' | 'wide'; play?: boolean }[]
  /** More, after the groups. */
  extra?: ReactNode
  /** Artefacts the page lists but cannot render, with the reason. */
  unrendered?: { what: ReactNode; why: ReactNode; source?: SourceRef }[]
}

const groupId = (section: string, title: string) =>
  `${section}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

export const countOf = (s: SectionData) => s.groups.reduce((n, g) => n + g.items.length, 0)

export function Section({ section }: { section: SectionData }) {
  return (
    <section className="inv-section" id={section.id} aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`} className="t-h3 inv-section-title">
        {section.title} <span className="inv-count">{countOf(section)}</span>
      </h2>
      {section.intro ? <p className="tool-line">{section.intro}</p> : null}
      {section.groups.length > 1 ? (
        <ul className="inv-groups" aria-label={`${section.title}: groups`}>
          {section.groups.map((g) => (
            <li key={g.title}>
              <a href={`#${groupId(section.id, g.title)}`}>
                {g.title} <span className="inv-count">{g.items.length}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {section.groups.map((g) => (
        <Group key={g.title} {...g} id={groupId(section.id, g.title)} />
      ))}
      {section.extra}
      {section.unrendered?.length ? (
        <div className="inv-group">
          <h3 className="inv-group-title t-label">
            Listed, not rendered here <span className="inv-count">{section.unrendered.length}</span>
          </h3>
          <ul className="inv-unrendered">
            {section.unrendered.map((u, i) => (
              <li key={i}>
                <strong>{u.what}</strong> {u.why}
                {u.source ? (
                  <>
                    {' '}
                    <code className="inv-muted">
                      {u.source.file}
                      {u.source.line ? `:${u.source.line}` : ''} {u.source.name}
                    </code>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

/** A colour swatch: a CSS colour (a custom property or a value), with a hairline edge. */
export function Swatch({ colour, style, wide }: { colour: string; style?: CSSProperties; wide?: boolean }) {
  return <span className="inv-swatch" data-wide={wide || undefined} style={{ background: colour, ...style }} />
}

export const hexValue = (hex: string, oklch: string): Value[] => [
  ['hex', <code key="h">{hex.toUpperCase()}</code>],
  ['oklch', <code key="o">{oklch}</code>],
]

export const ms = (s: number) => `${Math.round(s * 1000)} ms`
export const code = (v: ReactNode) => <code>{v}</code>
