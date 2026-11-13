'use client'

import { useCallback, useEffect, useRef } from 'react'
import {
  type ColourSnapshot,
  type LabTier,
  type Run,
  exitAndReturn,
  glint as glintRun,
  recolour as recolourRun,
  run,
  seqFor,
  snapshotColours,
} from '../engine'
import type { Concept, Moment } from '../model'

/*
 * One stage's player: the runs on one inline mark. Only one main run at a
 * time (a new one cancels the old, which snaps the mark to its static state
 * first); hover and loading run beside it. Everything that is not allowed in
 * the current tier is a no-op that reports why.
 */
export type PlayerOptions = { tier: LabTier; speed: number }
export type Outcome = { ran: boolean; note?: string }

const skipped = (tier: LabTier, what: string): Outcome => ({
  ran: false,
  note: tier === 'reduced' ? `Reduced motion: ${what} shows the static mark.` : `Calm: no ${what}.`,
})

export function usePlayer(concept: Concept, opts: PlayerOptions) {
  const ref = useRef<SVGSVGElement>(null)
  const main = useRef<Run | null>(null)
  const hover = useRef<Run | null>(null)
  const loading = useRef<{ on: boolean; run: Run | null } | null>(null)
  const looping = useRef(false)
  const o = useRef(opts)
  o.current = opts

  const stopMain = () => {
    main.current?.cancel()
    main.current = null
  }
  const stopAll = useCallback(() => {
    looping.current = false
    stopMain()
    hover.current?.cancel()
    hover.current = null
    if (loading.current) {
      loading.current.on = false
      loading.current.run?.cancel()
      loading.current = null
    }
  }, [])

  // Speed follows the setting, also for runs in flight.
  useEffect(() => {
    main.current?.setSpeed(opts.speed)
    hover.current?.setSpeed(opts.speed)
    loading.current?.run?.setSpeed(opts.speed)
  }, [opts.speed])
  // A tier change starts from the static mark.
  useEffect(() => stopAll, [opts.tier, stopAll])

  const play = useCallback((moment: Moment | undefined, what: string, paused = false): Outcome & { run?: Run } => {
    const svg = ref.current
    const seq = seqFor(moment, o.current.tier)
    stopMain()
    if (!svg || !seq) return skipped(o.current.tier, what)
    const r = run(svg, seq, { speed: o.current.speed, paused })
    main.current = r
    r.finished.then(() => {
      if (main.current === r) main.current = null
    })
    return { ran: true, run: r }
  }, [])

  const reveal = useCallback(
    (alt = false, paused = false) => {
      const m = alt && concept.motion.alt ? concept.motion.alt : concept.motion.reveal
      return play(m, 'the reveal', paused)
    },
    [concept, play],
  )

  const extra = useCallback(() => play(concept.motion.extra, concept.motion.extra.label.toLowerCase()), [concept, play])

  /** Replay the reveal until stopped, with a beat on the static mark in between. */
  const loop = useCallback(
    async (on: boolean, alt = false) => {
      looping.current = on
      if (!on) return
      while (looping.current) {
        const out = reveal(alt)
        if (!out.ran || !out.run) {
          looping.current = false
          return
        }
        const completed = await out.run.finished
        if (!completed || !looping.current) return
        await new Promise((r) => setTimeout(r, 900 / o.current.speed))
      }
    },
    [reveal],
  )

  const glint = useCallback((): Outcome => {
    const svg = ref.current
    if (!svg || o.current.tier !== 'full') return skipped(o.current.tier, 'foil glint')
    stopMain()
    main.current = glintRun(svg, o.current.speed)
    return { ran: true }
  }, [])

  const hoverIn = useCallback(() => {
    const svg = ref.current
    const seq = seqFor(concept.motion.hover, o.current.tier)
    if (!svg || !seq || hover.current) return
    hover.current = run(svg, seq, { speed: o.current.speed, hold: true })
  }, [concept])
  const hoverOut = useCallback(() => {
    const h = hover.current
    if (!h) return
    hover.current = null
    h.reverse()
  }, [])

  /** Loading loop: whole 1600 ms cycles; stopping lets the current cycle end on the static mark. */
  const setLoading = useCallback(
    async (on: boolean): Promise<Outcome> => {
      const svg = ref.current
      if (!on) {
        if (loading.current) loading.current.on = false
        return { ran: true }
      }
      const seq = seqFor(concept.motion.loading, o.current.tier)
      if (!svg || !seq) return skipped(o.current.tier, 'loading loop')
      if (loading.current) return { ran: true }
      stopMain()
      const state = { on: true, run: null as Run | null }
      loading.current = state
      ;(async () => {
        while (state.on) {
          state.run = run(svg, seq, { speed: o.current.speed })
          const completed = await state.run.finished
          if (!completed) break
        }
        if (loading.current === state) loading.current = null
      })()
      return { ran: true }
    },
    [concept],
  )

  const exit = useCallback(async (): Promise<Outcome> => {
    const svg = ref.current
    const seq = seqFor(concept.motion.exit, o.current.tier)
    if (!svg || !seq) return skipped(o.current.tier, 'exit')
    stopAll()
    await exitAndReturn(svg, seq, o.current.speed)
    return { ran: true }
  }, [concept, stopAll])

  const snapshot = useCallback((): ColourSnapshot | null => (ref.current ? snapshotColours(ref.current) : null), [])
  const recolour = useCallback((before: ColourSnapshot | null) => {
    if (ref.current && before) recolourRun(ref.current, before, o.current.tier, o.current.speed)
  }, [])

  useEffect(() => stopAll, [stopAll])

  return { ref, reveal, extra, loop, glint, hoverIn, hoverOut, setLoading, exit, snapshot, recolour, stopAll }
}

export type Player = ReturnType<typeof usePlayer>
