import type { CssTrack, Ease, Seq } from './model'

/*
 * Track builders shared by the concepts. Every reveal ends on its last
 * keyframe, which is always the part's static state (no transform, full
 * opacity, solid stroke), so cancelling the finished animations leaves the
 * static mark exactly.
 */

/** Draw a stroke along its path (pathLength 1). */
export const draw = (part: string, at: number, dur: number, ease: Ease = 'enter'): CssTrack => ({
  part,
  at,
  dur,
  ease,
  frames: [
    { strokeDasharray: '1 1', strokeDashoffset: 1 },
    { strokeDasharray: '1 1', strokeDashoffset: 0 },
  ],
})

/** Stroke weight from thin to the static width (the site's thin-to-bold titles). */
export const weigh = (
  part: string,
  at: number,
  dur: number,
  from: number,
  to: number,
  ease: Ease = 'move',
): CssTrack => ({
  part,
  at,
  dur,
  ease,
  frames: [{ strokeWidth: `${from}px` }, { strokeWidth: `${to}px` }],
})

/** Calm reveal: weight plus opacity only, one part after another. */
export const calmWeigh = (parts: { part: string; from: number; to: number }[], gap = 120, dur = 500): Seq =>
  parts.flatMap(({ part, from, to }, i) => [
    {
      ...weigh(part, i * gap, dur, from, to),
      frames: [
        { strokeWidth: `${from}px`, opacity: 0 },
        { strokeWidth: `${to}px`, opacity: 1 },
      ],
    },
  ])

/** Exit: every part fades and sinks 3 units (300 ms). Calm: fade only. */
export const exitFull = (parts: string[]): Seq =>
  parts.map((part) => ({
    part,
    at: 0,
    dur: 300,
    ease: 'exit' as const,
    frames: [
      { opacity: 1, transform: 'translate(0px, 0px)' },
      { opacity: 0, transform: 'translate(0px, 3px)' },
    ],
  }))
export const exitCalm = (parts: string[]): Seq =>
  parts.map((part) => ({ part, at: 0, dur: 300, ease: 'exit' as const, frames: [{ opacity: 1 }, { opacity: 0 }] }))

/** Hover: the given parts shift by (dx, dy) units, 220 ms. */
export const shift = (parts: string[], dx: number, dy = 0, dur = 220): Seq =>
  parts.map((part) => ({
    part,
    at: 0,
    dur,
    ease: 'move' as const,
    frames: [{ transform: 'translate(0px, 0px)' }, { transform: `translate(${dx}px, ${dy}px)` }],
  }))

/**
 * Loading, stroked: the line undraws from its start and draws again
 * (dashoffset 0 → −2 on a 1 1 pattern), one linear 1600 ms cycle that starts
 * and ends on the full stroke.
 */
export const chase = (part: string, dur = 1600): CssTrack => ({
  part,
  at: 0,
  dur,
  ease: 'linear',
  frames: [
    { strokeDasharray: '1 1', strokeDashoffset: 0 },
    { strokeDasharray: '1 1', strokeDashoffset: -2 },
  ],
})

/**
 * Loading, filled: a soft dip in opacity travels across the parts. Each part
 * is at full opacity at the start and end of the cycle.
 */
export const wave = (parts: string[], dur = 1600, low = 0.3): Seq =>
  parts.map((part, i) => {
    const span = 0.45
    const start = (i / Math.max(1, parts.length)) * (1 - span)
    return {
      part,
      at: 0,
      dur,
      ease: 'linear' as const,
      frames: [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: start },
        { opacity: low, offset: start + span / 2 },
        { opacity: 1, offset: start + span },
        { opacity: 1, offset: 1 },
      ],
    }
  })
