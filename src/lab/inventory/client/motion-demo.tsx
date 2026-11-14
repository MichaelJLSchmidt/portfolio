'use client'

import { useRef } from 'react'
import { reducedCrossfade } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'

/*
 * Replay demos for motion tokens: a dot that travels its track on a curve (a bézier, or a spring
 * as the CSS linear() curve springCss() makes of it), a bar that fills over a duration, a row of
 * dots that a stagger sets apart. Play runs it once (Web Animations, nothing at rest). Reduced
 * motion: the site's reduced tier, one 160 ms crossfade and no travel.
 */
type Demo =
  | { kind: 'curve'; easing: string; seconds: number; points: [number, number][] }
  | { kind: 'duration'; seconds: number }
  | { kind: 'stagger'; seconds: number; each: number; easing: string }

export function MotionDemo(props: Demo) {
  const track = useRef<HTMLSpanElement>(null)
  const play = () => {
    const el = track.current
    if (!el) return
    const parts = [...el.querySelectorAll<HTMLElement>('[data-part]')]
    for (const p of parts) for (const a of p.getAnimations()) a.cancel()
    if (readTier() === 'reduced') {
      for (const p of parts) p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedCrossfade * 1000 })
      return
    }
    if (props.kind === 'curve') {
      const dot = parts[0]
      const travel = el.clientWidth - dot.offsetWidth
      dot.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${travel}px)` }], {
        duration: props.seconds * 1000,
        easing: props.easing,
        fill: 'backwards',
      })
    } else if (props.kind === 'duration') {
      parts[0].animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
        duration: props.seconds * 1000,
        easing: 'linear',
      })
    } else {
      parts.forEach((p, i) =>
        p.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: props.each * 1000, delay: i * props.seconds * 1000, easing: props.easing, fill: 'backwards' },
        ),
      )
    }
  }
  return (
    <span className="inv-demo" data-kind={props.kind}>
      {props.kind === 'curve' ? <Plot points={props.points} /> : null}
      <span ref={track} className="inv-track">
        {props.kind === 'curve' ? <span className="inv-dot" data-part="" /> : null}
        {props.kind === 'duration' ? <span className="inv-bar" data-part="" /> : null}
        {props.kind === 'stagger'
          ? Array.from({ length: 5 }, (_, i) => <span key={i} className="inv-dot" data-part="" />)
          : null}
      </span>
      <button type="button" className="tool-button inv-play" onClick={play} data-demo-play="">
        Play
      </button>
    </span>
  )
}

/** The curve: progress (up) over time (right), on a 0..1 square. */
function Plot({ points }: { points: [number, number][] }) {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 40).toFixed(2)} ${(40 - y * 40).toFixed(2)}`).join('')
  return (
    <svg className="inv-plot" viewBox="-2 -2 44 44" aria-hidden="true">
      <path d="M0 40H40M0 40V0" className="inv-plot-axis" />
      <path d={d} className="inv-plot-curve" />
    </svg>
  )
}

/** Plays every demo in the closest group or section, or on the whole page (`page`). */
export function PlayAll({ label = 'Play all', page = false }: { label?: string; page?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <button
      ref={ref}
      type="button"
      className="tool-button"
      onClick={() => {
        const scope = page ? document : ref.current?.closest('.inv-group, .inv-section')
        for (const b of scope?.querySelectorAll<HTMLButtonElement>('[data-demo-play]') ?? []) b.click()
      }}
    >
      {label}
    </button>
  )
}
