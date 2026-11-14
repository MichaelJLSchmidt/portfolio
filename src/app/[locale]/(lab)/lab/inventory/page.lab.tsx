import type { Metadata } from 'next'
import { Filter, SectionSpy } from '@/lab/inventory/client/index-nav'
import { ForcedStates } from '@/lab/inventory/client/forced-states'
import { PlayAll } from '@/lab/inventory/client/motion-demo'
import { backgroundsSection } from '@/lab/inventory/sections/backgrounds'
import { cardsSection } from '@/lab/inventory/sections/cards'
import { coloursSection } from '@/lab/inventory/sections/colours'
import { iconsSection } from '@/lab/inventory/sections/icons'
import { illustrationsSection } from '@/lab/inventory/sections/illustrations'
import { layoutSection } from '@/lab/inventory/sections/layout'
import { linksSection } from '@/lab/inventory/sections/links'
import { logoSection } from '@/lab/inventory/sections/logo'
import { motionSection } from '@/lab/inventory/sections/motion'
import { photosSection } from '@/lab/inventory/sections/photos'
import { typeSection } from '@/lab/inventory/sections/type'
import { Section, countOf } from '@/lab/inventory/ui'
import { CopyIds, TierBadge } from '@/lab/ui/client'
import { LabFrame } from '@/lab/ui/frame'
import { setRequestLocale } from '@/lib/request-locale'
import '@/lab/inventory/inventory.css'

export const metadata: Metadata = { title: 'Design inventory', robots: { index: false, follow: false } }

/*
 * The design inventory: every visual artefact the site uses, rendered from the site's own code,
 * tokens and registries (src/lab/inventory/), each with a reference ID to quote in a request.
 * Built at build time from the source (src/lab/source.ts): new tokens and registry entries show
 * up by themselves. English on both locales.
 */
export default async function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale)
  const sections = [
    coloursSection(),
    typeSection(),
    logoSection(),
    cardsSection(),
    illustrationsSection(),
    photosSection(),
    backgroundsSection(),
    iconsSection(),
    linksSection(),
    motionSection(),
    layoutSection(),
  ]
  const total = sections.reduce((n, s) => n + countOf(s), 0)
  // Reference IDs are quoted in requests: each must name one artefact.
  const ids = sections.flatMap((s) => s.groups.flatMap((g) => g.items.map((i) => i.id)))
  const twice = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (twice.length) throw new Error(`Design inventory: reference IDs used twice: ${[...new Set(twice)].join(', ')}`)
  return (
    <LabFrame
      path="/lab/inventory"
      title="Design inventory"
      className="inv"
      intro={
        <>
          {total} visual artefacts, rendered from the site&rsquo;s own code and tokens. Click an ID to copy it, then
          quote it to ask for a change (&ldquo;make <code>gradient.tide</code>&rsquo;s middle stop warmer&rdquo;).
        </>
      }
    >
      <CopyIds />
      <ForcedStates />
      <SectionSpy />
      <div className="inv-layout">
        <aside className="inv-index" aria-label="Inventory">
          <nav aria-label="Sections">
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    {s.title} <span className="inv-count">{countOf(s)}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <Filter />
          <p className="inv-index-tier">
            <TierBadge />
          </p>
          <PlayAll label="Play every demo" page />
        </aside>
        <div className="inv-main">
          {sections.map((s) => (
            <Section key={s.id} section={s} />
          ))}
        </div>
      </div>
    </LabFrame>
  )
}
