import { ease as easeTokens } from '@/motion/tokens'

/*
 * Tweened channels for the background field. A track holds a vector value and
 * eases from where it is to a new target, optionally after a delay. Both
 * renderers read the same tracks: the WebGL field samples them every frame,
 * the CSS fallback turns each retarget into a CSS transition.
 */
export type EaseName = keyof typeof easeTokens | 'linear'

/** Cubic bézier timing function (x(t) solved by Newton, bisection fallback). */
function bezier([x1, y1, x2, y2]: readonly number[]) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = (t: number) => ((ax * t + bx) * t + cx) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (p: number) => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let t = p
    for (let i = 0; i < 6; i++) {
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      const next = t - (x(t) - p) / d
      if (next < 0 || next > 1) break
      t = next
    }
    if (Math.abs(x(t) - p) > 1e-4) {
      let lo = 0
      let hi = 1
      t = p
      for (let i = 0; i < 24; i++) {
        if (x(t) < p) lo = t
        else hi = t
        t = (lo + hi) / 2
      }
    }
    return ((ay * t + by) * t + cy) * t
  }
}

const easings = Object.fromEntries(Object.entries(easeTokens).map(([k, v]) => [k, bezier(v)])) as Record<
  keyof typeof easeTokens,
  (p: number) => number
>

export const easeFn = (name: EaseName) => (name === 'linear' ? (p: number) => p : easings[name])
export const easeCss = (name: EaseName) =>
  name === 'linear' ? 'linear' : `cubic-bezier(${easeTokens[name].join(',')})`

export class Track {
  from: number[]
  to: number[]
  value: number[]
  /** ms timestamps (performance.now()). */
  start = 0
  end = 0
  ease: EaseName = 'linear'

  constructor(initial: number[]) {
    this.from = initial.slice()
    this.to = initial.slice()
    this.value = initial.slice()
  }

  /** Updates `value` for time `now`; true while the track is still moving. */
  sample(now: number): boolean {
    // A jump (no duration) is settled at once, even for a frame timestamp from before it was set.
    if (now >= this.end || this.end <= this.start) {
      for (let i = 0; i < this.to.length; i++) this.value[i] = this.to[i]
      return false
    }
    const p = now <= this.start ? 0 : easeFn(this.ease)((now - this.start) / (this.end - this.start))
    for (let i = 0; i < this.to.length; i++) this.value[i] = this.from[i] + (this.to[i] - this.from[i]) * p
    return true
  }

  /** Eases from the current value to `to` over `dur` seconds after `delay` seconds. */
  set(to: number[], dur: number, ease: EaseName, now: number, delay = 0) {
    this.sample(now)
    this.from = this.value.slice()
    this.to = to.slice()
    this.start = now + delay * 1000
    this.end = this.start + dur * 1000
    this.ease = ease
    if (dur <= 0 && delay <= 0) this.value = to.slice()
  }

  jump(to: number[], now: number) {
    this.set(to, 0, 'linear', now)
  }

  /** Seconds left (delay included), 0 when settled. */
  remaining(now: number) {
    return Math.max(0, (this.end - now) / 1000)
  }
}
