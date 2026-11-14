import type { ComponentType } from 'react'
import {
  Illustration,
  ProjectTypeGlyph,
  WorkshopGlyph,
  illustrations,
  projectTypes,
  workshopMethods,
} from '@/components/illustrations'
import * as thesisDrawings from '@/components/illustrations/thesis'
import type { ContentIllustration } from '@/components/illustrations'
import { identity as deckIdentity } from '@content/deck'
import { contentFor } from '@/lib/content'
import { pathFields } from '@/motion/table-store'
import { importMap, lineIn, readSource, usages } from '../../source'
import { contentRefs } from '../content-refs'
import { type ItemData, type SectionData, code } from '../ui'

const DIR = 'src/components/illustrations'
const REGISTRY = `${DIR}/illustration.tsx`

/** A component's file, from the module that imports it ("AdoptionBars" -> ".../adoption-bars.tsx"). */
const fileOf = (registry: string, name: string) => {
  const m = importMap(registry).get(name)
  return m ? `${m.module}.tsx` : registry
}
/** A drawing has a vertical layout when its file hands one to <Drawing v={...}>. */
const hasVertical = (file: string) => /\bv=\{/.test(readSource(file))

/**
 * The identity a drawing is shown in: its first case study's (content places it), else that of the
 * page that renders it directly (Management's card, About's and the thesis's glacier), else ink.
 */
function identityOf(refs: { identity: string | null }[], name: string): string {
  const placed = refs.find((r) => r.identity)?.identity
  if (placed) return placed
  const fields = pathFields()
  for (const u of usages({ jsx: [name] })) {
    const page = /^src\/app\/\[locale\]\/(.+)\/page\.tsx$/.exec(u.file)?.[1]
    if (!page) continue
    const id = page === 'management' ? deckIdentity.management : fields[`/${page}`]
    if (id) return id
  }
  return 'ink'
}

function Variants({
  vertical,
  render,
}: {
  vertical: boolean
  render: (v: 'horizontal' | 'vertical') => React.ReactNode
}) {
  return (
    <span className="inv-variants">
      <span className="inv-variant">
        {render('horizontal')}
        {vertical ? <span className="inv-k">horizontal (from 640 px)</span> : null}
      </span>
      {vertical ? (
        <span className="inv-variant" data-narrow="">
          {render('vertical')}
          <span className="inv-k">vertical (below 640 px)</span>
        </span>
      ) : null}
    </span>
  )
}

export function illustrationsSection(): SectionData {
  const en = contentFor('en')
  const copy = en.illustrations
  const registry: ItemData[] = (Object.keys(illustrations) as ContentIllustration[]).map((name) => {
    const file = fileOf(REGISTRY, name)
    const refs = contentRefs(name)
    const vertical = hasVertical(file)
    return {
      id: `illustration.${name}`,
      render: (
        <span className="inv-drawing" data-identity={identityOf(refs, name)}>
          <Variants
            vertical={vertical}
            render={(variant) => (
              <Illustration name={name} copy={copy} variant={variant} titleId={`inv-${name}-${variant}`} />
            )}
          />
        </span>
      ),
      values: [
        ['layouts', vertical ? 'horizontal and vertical' : 'one'],
        ['colour', code('currentColor = the page’s --accent')],
        ['shown in', code(`identity.${identityOf(refs, name)}`)],
        ['words', code(`content/en/illustrations.ts ${name}`)],
      ],
      source: [
        { file, line: lineIn(file, `export function ${name}`), name },
        { file: REGISTRY, line: lineIn(REGISTRY, 'export const illustrations'), name: `illustrations.${name}` },
      ],
      usedFor: refs.length ? refs.map((r) => r.path).join(' · ') : undefined,
      usage: usages({ jsx: [name], strings: [name], except: [file, REGISTRY, `${DIR}/types.ts`, `${DIR}/index.ts`] }),
    }
  })

  const glyphFile = fileOf(`${DIR}/index.ts`, 'ProjectTypeGlyph')
  const glyphs: ItemData[] = projectTypes.map((type) => ({
    id: `illustration.project-type.${type}`,
    render: (
      <span className="inv-glyph">
        <ProjectTypeGlyph type={type} titleId={`inv-glyph-${type}`} />
      </span>
    ),
    values: [['type', code(type)]],
    source: {
      file: glyphFile,
      line: lineIn(glyphFile, 'export function ProjectTypeGlyph'),
      name: `ProjectTypeGlyph type="${type}"`,
    },
    usage: usages({ jsx: ['ProjectTypeGlyph'], except: [glyphFile, `${DIR}/index.ts`] }),
  }))

  const workshopFile = fileOf(`${DIR}/index.ts`, 'WorkshopGlyph')
  const workshop: ItemData[] = workshopMethods.map((method) => ({
    id: `illustration.workshop.${method}`,
    render: (
      <span className="inv-glyph" data-identity="saffron">
        <WorkshopGlyph method={method} titleId={`inv-workshop-${method}`} {...copy.WorkshopGlyph[method]} />
      </span>
    ),
    values: [['method', code(method)]],
    source: {
      file: workshopFile,
      line: lineIn(workshopFile, 'export function WorkshopGlyph('),
      name: `WorkshopGlyph method="${method}"`,
    },
    usage: usages({ jsx: ['WorkshopGlyph'], strings: [method], except: [workshopFile, `${DIR}/types.ts`] }),
  }))

  // The thesis drawings: the registry module's exports, each with the words the thesis page gives it.
  const THESIS = 'src/app/[locale]/about/thesis/page.tsx'
  const keyOf = new Map(
    [...readSource(THESIS).matchAll(/<(\w+) copy=\{t\.drawings\.(\w+)\}/g)].map((m) => [m[1], m[2]] as const),
  )
  const drawings = en.thesis.drawings as Record<string, unknown>
  const thesis: ItemData[] = Object.entries(thesisDrawings).map(([name, Component]) => {
    const file = fileOf(`${DIR}/thesis/index.ts`, name)
    const key = keyOf.get(name)
    const C = Component as ComponentType<{ copy: unknown; titleId?: string; variant?: 'horizontal' | 'vertical' }>
    const vertical = hasVertical(file)
    return {
      id: `illustration.thesis.${name}`,
      render: key ? (
        <span className="inv-drawing" data-identity="glacier">
          <Variants
            vertical={vertical}
            render={(variant) => <C copy={drawings[key]} variant={variant} titleId={`inv-${name}-${variant}`} />}
          />
        </span>
      ) : (
        <span className="inv-none">No words for it on the thesis page.</span>
      ),
      values: [
        ['layouts', vertical ? 'horizontal and vertical' : 'one'],
        ['words', code(`content/en/thesis.ts drawings.${key ?? '?'}`)],
      ],
      source: { file, line: lineIn(file, `export function ${name}`), name },
      usage: usages({ jsx: [name], except: [file] }),
    }
  })

  return {
    id: 'illustrations',
    title: 'Illustrations',
    intro: (
      <>
        Every drawing in the registry (<code>illustrations</code>), the per-type and per-method glyphs and the
        thesis&rsquo;s drawings, with the English words, in the colour of the page they appear on, in each layout they
        have. Static: on the site the <code>draw</code> reveal draws them on (see Motion, Reveal kinds).
      </>
    ),
    groups: [
      { title: 'Registry drawings', items: registry, layout: 'wide' },
      { title: 'Thesis drawings', items: thesis, layout: 'wide' },
      { title: 'Workshop glyphs', items: workshop, layout: 'tile' },
      { title: 'Project type glyphs', items: glyphs, layout: 'tile' },
    ],
  }
}
