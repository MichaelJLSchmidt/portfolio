'use client'

import { type ReactNode, useRef } from 'react'
import { schedule } from '@/motion/jobs'
import { type Kind, runKind, title } from '@/motion/kinds'

/*
 * A reveal kind (src/motion/kinds.ts), replayed on its own sample: Play schedules the site's job
 * (src/motion/jobs.ts) for the sample with the kind's own code, in the current tier, exactly as a
 * page reveal runs it. "title" is the home title's weight animation (kinds.ts title()).
 */
export function RevealDemo({ kind, children }: { kind: Kind | 'title'; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const play = () => {
    const el = box.current?.firstElementChild as HTMLElement | null
    if (!el) return
    for (const a of el.getAnimations({ subtree: true })) a.cancel()
    void schedule(el, 0, (ctx) => (kind === 'title' ? title(ctx, el) : runKind(kind, ctx, el)), 'lab')
  }
  return (
    <span className="inv-reveal">
      <div ref={box} className="inv-reveal-sample">
        {children}
      </div>
      <button type="button" className="tool-button inv-play" onClick={play} data-demo-play="">
        Play
      </button>
    </span>
  )
}
