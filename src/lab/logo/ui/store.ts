'use client'

import { useSyncExternalStore } from 'react'

/*
 * Lab state kept in this browser only (localStorage): scores, notes and the
 * lockup wordmark. Nothing is written to the repository. Reads and writes are
 * guarded: with storage blocked the lab still works for the page view.
 */
const PREFIX = 'logo-lab:'
const listeners = new Set<() => void>()
const memory = new Map<string, string>()

function read(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return memory.get(key) ?? null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key)
    else localStorage.setItem(PREFIX + key, value)
  } catch {
    if (value === null) memory.delete(key)
    else memory.set(key, value)
  }
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => e.key?.startsWith(PREFIX) && fn()
  addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    removeEventListener('storage', onStorage)
  }
}

export function useStored(key: string, fallback: string): [string, (v: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key) ?? fallback,
    () => fallback,
  )
  return [value, (v: string) => write(key, v)]
}

/* ---------- Scorecard ---------- */

export const CRITERIA = [
  'Both letters recognisable at 32 px',
  'Survives 16 px (no closed counters, no stroke under 2 px)',
  'Distinct silhouette',
  'Memorable (sketchable from memory)',
  'One idea',
  'Animation economy (at most 3 moving parts in the reveal)',
  'Works in one colour',
  'Takes a page accent',
  'Fits the display type',
  'No unwanted readings',
] as const

/** Criteria whose score below 3 flags a concept (1, 2 and 10, zero-based). */
export const GATES = [0, 1, 9]

export type Score = { ratings: number[]; notes: string }

const emptyScore = (): Score => ({ ratings: CRITERIA.map(() => 0), notes: '' })

export function parseScore(raw: string | null): Score {
  if (!raw) return emptyScore()
  try {
    const s = JSON.parse(raw) as Partial<Score>
    const ratings = CRITERIA.map((_, i) => {
      const r = Number(s.ratings?.[i] ?? 0)
      return r >= 1 && r <= 5 ? Math.round(r) : 0
    })
    return { ratings, notes: typeof s.notes === 'string' ? s.notes : '' }
  } catch {
    return emptyScore()
  }
}

export function useScore(key: string): [Score, (s: Score) => void] {
  const [raw, set] = useStored(key, '')
  return [parseScore(raw || null), (s) => set(JSON.stringify(s))]
}

/** Every concept's score at once (summary table). */
export function useScores(keys: string[]): Score[] {
  const joined = useSyncExternalStore(
    subscribe,
    () => keys.map((k) => read(k) ?? '').join('\u0000'),
    () => keys.map(() => '').join('\u0000'),
  )
  return joined.split('\u0000').map((raw) => parseScore(raw || null))
}

/**
 * Drops stored scores that no concept uses any more: removed concepts and the
 * previous geometry of reworked ones (their scoreKey changed), so they start blank.
 */
export function pruneScores(keep: string[]) {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${PREFIX}score-`) && !keep.includes(k.slice(PREFIX.length))) localStorage.removeItem(k)
    }
  } catch {
    // Storage blocked: nothing stored, nothing to prune.
  }
}

export const total = (s: Score) => s.ratings.reduce((a, b) => a + b, 0)
export const flagged = (s: Score) => GATES.filter((i) => s.ratings[i] > 0 && s.ratings[i] < 3)
