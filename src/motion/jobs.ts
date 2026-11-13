import { breakpoints } from '@/design/layout'
import { type MotionTier, reveal } from './tokens'
import { readTier } from './use-tier'

/*
 * Reveal jobs: one per revealing element. A job waits for its start time (a
 * timer, so the element keeps its CSS start state until then), marks the
 * element [data-revealed], runs its kind and resolves once every animation it
 * started has finished. While it runs, its targets carry will-change; when it
 * ends, the animations are cancelled (their end state is the element's own
 * style), will-change is removed and any undo (a reverted split) runs, so
 * nothing stays animated at rest.
 *
 * Below 1024 px at most `reveal.mobileJobs` jobs run at once; the rest queue
 * in start order. A job's animations count as one (an SVG with thirty strokes
 * repaints one layer).
 */
export type JobContext = {
  tier: MotionTier
  /** Element.animate, tracked: will-change while it runs, cancelled when the job ends. */
  animate: (target: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions, willChange?: string) => Animation
  /** Runs when the job ends (or is completed early), after the animations are cancelled. */
  undo: (fn: () => void) => void
  /**
   * Runs when the job is completed early (a skip or a route change), before its animations jump to
   * their end: a kind that waits for something (the deal's cards entering one by one) stops waiting.
   */
  stop: (fn: () => void) => void
  /** True once the job has been completed early (skip, route change). */
  readonly done: boolean
}

export type JobRun = (ctx: JobContext) => void | Promise<void>

type Job = {
  el: Element
  run: JobRun
  variant: string
  timer: number
  started: boolean
  /** Completed early, or finished: new animations jump to their end. */
  ended: boolean
  /** Cleaned up and resolved. */
  finalized: boolean
  anims: Set<Animation>
  undos: (() => void)[]
  stops: (() => void)[]
  /** will-change per target: the value to restore and how many of its animations are running. */
  wills: Map<HTMLElement | SVGElement, { rest: string; running: number }>
  timers: number[]
  resolve: () => void
  promise: Promise<void>
}

const waiting = new Set<Job>()
const running = new Set<Job>()
const queue: Job[] = []
const ends = new WeakMap<Element, Promise<void>>()
const waiters = new WeakMap<Element, () => void>()

const mobile = () => typeof innerWidth === 'number' && innerWidth < breakpoints.md
const capacity = () => (mobile() ? reveal.mobileJobs : Number.POSITIVE_INFINITY)

/** Resolves when `el`'s reveal has finished (at once if it was never scheduled and is already revealed). */
export function revealed(el: Element): Promise<void> {
  const known = ends.get(el)
  if (known) return known
  if (el.hasAttribute('data-revealed')) return Promise.resolve()
  // Not scheduled yet: resolves when it is and has finished.
  let release!: () => void
  const p = new Promise<void>((r) => (release = r))
  ends.set(el, p)
  waiters.set(el, release)
  return p
}

/** Schedules `run` for `el` in `delayMs`. Returns a promise for its end. */
export function schedule(el: Element, delayMs: number, run: JobRun, variant = ''): Promise<void> {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  const job: Job = {
    el,
    run,
    variant,
    timer: 0,
    started: false,
    ended: false,
    finalized: false,
    anims: new Set(),
    undos: [],
    stops: [],
    wills: new Map(),
    timers: [],
    resolve,
    promise,
  }
  // Anyone already waiting on this element (a note) hears about this job's end.
  const waiter = waiters.get(el)
  if (waiter) {
    waiters.delete(el)
    promise.then(waiter)
  } else ends.set(el, promise)
  // Now: start in this frame (no timer hop). Later: wait, so the CSS start state holds until then.
  if (delayMs <= 0) admit(job)
  else {
    waiting.add(job)
    job.timer = window.setTimeout(() => admit(job), delayMs)
  }
  return promise
}

/** Marks `el` revealed at once, without animation (play / switch titles, the eager hero image). */
export function revealNow(el: Element, variant = 'instant') {
  el.setAttribute('data-revealed', variant)
  const waiter = waiters.get(el)
  if (waiter) {
    waiters.delete(el)
    waiter()
  }
  if (!ends.has(el)) ends.set(el, Promise.resolve())
}

function admit(job: Job) {
  waiting.delete(job)
  if (job.ended) return
  if (running.size >= capacity()) queue.push(job)
  else start(job)
}

function start(job: Job) {
  job.started = true
  running.add(job)
  job.el.setAttribute('data-revealed', job.variant)
  const ctx: JobContext = {
    tier: readTier(),
    animate: (target, keyframes, options, willChange) => {
      const a = target.animate(keyframes, options)
      job.anims.add(a)
      // Completed early: jump the new animation to its end too.
      if (job.ended) a.finish()
      else if (willChange && (target instanceof HTMLElement || target instanceof SVGElement)) {
        // will-change only while this animation runs: from the end of its delay to its finish.
        const on = () => {
          if (job.finalized) return
          const w = job.wills.get(target) ?? { rest: target.style.willChange, running: 0 }
          w.running++
          job.wills.set(target, w)
          target.style.willChange = willChange
          a.finished
            .catch(() => {})
            .then(() => {
              if (--w.running === 0) target.style.willChange = w.rest
            })
        }
        const delay = Number(options.delay) || 0
        if (delay > 0) job.timers.push(window.setTimeout(on, delay))
        else on()
      }
      return a
    },
    undo: (fn) => {
      if (job.ended) fn()
      else job.undos.push(fn)
    },
    stop: (fn) => {
      if (job.ended) fn()
      else job.stops.push(fn)
    },
    get done() {
      return job.ended
    },
  }
  let result: void | Promise<void>
  try {
    result = job.run(ctx)
  } catch (e) {
    end(job)
    throw e
  }
  Promise.resolve(result)
    .then(() => Promise.allSettled([...job.anims].map((a) => a.finished)))
    // Animations started after the first await (e.g. a split after fonts.ready) are tracked too.
    .then(() => Promise.allSettled([...job.anims].map((a) => a.finished)))
    .finally(() => end(job))
}

function end(job: Job) {
  if (job.finalized) return
  job.finalized = true
  const wasRunning = running.delete(job)
  job.ended = true
  for (const t of job.timers.splice(0)) clearTimeout(t)
  for (const a of job.anims) a.cancel()
  job.anims.clear()
  for (const [el, w] of job.wills) el.style.willChange = w.rest
  job.wills.clear()
  for (const fn of job.undos.splice(0)) fn()
  job.resolve()
  if (wasRunning) {
    const next = queue.shift()
    if (next) start(next)
  }
}

/**
 * Completes every scheduled, queued and running job at once: waiting jobs
 * start now and jump to their end, running animations finish. Used when the
 * visitor skips the intro and when a route is left.
 */
export function completeAll() {
  const jobs = [...waiting, ...queue, ...running]
  waiting.clear()
  queue.length = 0
  for (const job of jobs) {
    clearTimeout(job.timer)
    if (!job.started) {
      job.ended = true
      job.started = true
      running.add(job)
      job.el.setAttribute('data-revealed', job.variant || 'instant')
      try {
        job.run({
          tier: readTier(),
          animate: (target, keyframes, options) => {
            const a = target.animate(keyframes, options)
            a.finish()
            job.anims.add(a)
            return a
          },
          undo: (fn) => job.undos.push(fn),
          stop: (fn) => fn(),
          done: true,
        })
      } catch {
        // A kind that cannot run instantly still ends below.
      }
      // Async kinds (a split waiting for fonts) bail out on ctx.done; end now.
      end(job)
      continue
    }
    job.ended = true
    for (const fn of job.stops.splice(0)) fn()
    for (const a of job.anims) a.finish()
  }
}
