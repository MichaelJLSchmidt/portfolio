'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react'
import { useMotionTier } from '@/motion/use-tier'
import { conceptById, concepts } from '../concepts'
import type { LabTier } from '../engine'
import { Detail } from './detail'
import { Overview } from './overview'
import { Segmented } from './controls'
import { pruneScores } from './store'
import { DEEP_LINK_ATTR } from '../deep-link'

/*
 * The lab's client root. The route is the query string (?c=3 opens concept
 * 3's detail view), read from location so the page stays a static export;
 * moving between views pushes history entries, so Back works.
 */
const ROUTE_EVENT = 'logo-lab:route'

function readRoute(): string | null {
  return conceptById((new URLSearchParams(location.search).get('c') ?? '').toLowerCase())?.id ?? null
}
function subscribeRoute(fn: () => void) {
  addEventListener('popstate', fn)
  addEventListener(ROUTE_EVENT, fn)
  return () => {
    removeEventListener('popstate', fn)
    removeEventListener(ROUTE_EVENT, fn)
  }
}

export function go(id: string | null) {
  const url = new URL(location.href)
  if (id === null) url.searchParams.delete('c')
  else url.searchParams.set('c', id)
  history.pushState(history.state, '', url)
  dispatchEvent(new Event(ROUTE_EVENT))
  scrollTo({ top: 0 })
}

export const hrefFor = (id: string | null) => (id === null ? '?' : `?c=${id}`)

type Settings = { tier: LabTier; speed: number; siteTier: LabTier }
const LabSettings = createContext<Settings>({ tier: 'full', speed: 1, siteTier: 'full' })
export const useLabSettings = () => useContext(LabSettings)

export const SPEEDS = [1, 0.5, 0.25] as const

export function LogoLab() {
  const route = useSyncExternalStore(subscribeRoute, readRoute, () => null)
  const siteTier = useMotionTier()
  const [override, setOverride] = useState<LabTier | null>(null)
  const [speed, setSpeed] = useState<number>(1)
  const tier = override ?? siteTier
  const concept = conceptById(route)

  // The document title names the open concept.
  useEffect(() => {
    if (!concept) return
    const base = document.title
    document.title = `${concept.label} ${concept.name} · ${base}`
    return () => {
      document.title = base
    }
  }, [concept])

  useEffect(() => pruneScores(concepts.map((c) => c.scoreKey)), [])

  // A deep link (?c=…) hides the server-rendered overview from first paint
  // (DEEP_LINK_SCRIPT); release it once the view matches the address.
  useLayoutEffect(() => {
    if (route === readRoute()) document.documentElement.removeAttribute(DEEP_LINK_ATTR)
  }, [route])

  const onTier = useCallback((v: string) => setOverride(v === siteTier ? null : (v as LabTier)), [siteTier])

  return (
    <LabSettings.Provider value={{ tier, speed, siteTier }}>
      <div className="lab-bar" role="group" aria-label="Playback">
        <Segmented
          label="Motion tier"
          value={tier}
          options={(['full', 'calm', 'reduced'] as const).map((t) => ({
            value: t,
            label: t === siteTier ? `${t[0].toUpperCase()}${t.slice(1)} (site)` : `${t[0].toUpperCase()}${t.slice(1)}`,
          }))}
          onChange={onTier}
        />
        <Segmented
          label="Speed"
          value={String(speed)}
          options={SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))}
          onChange={(v) => setSpeed(Number(v))}
        />
      </div>
      {concept ? <Detail key={concept.id} concept={concept} /> : <Overview concepts={concepts} />}
    </LabSettings.Provider>
  )
}
