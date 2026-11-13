'use client'

import { useSyncExternalStore } from 'react'
import type { MotionTier } from './tokens'

function watch(attribute: string, onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [attribute] })
  return () => observer.disconnect()
}
const subscribe = (onChange: () => void) => watch('data-motion', onChange)

export function readTier(): MotionTier {
  return document.documentElement.dataset.motion === 'reduced' ? 'reduced' : 'full'
}

/** Current motion tier. Use it in effects and animation props, never to change markup. */
export function useMotionTier(): MotionTier {
  return useSyncExternalStore(subscribe, readTier, () => 'full')
}

/** Calls `fn` whenever the tier changes (outside React). */
export function onTierChange(fn: (tier: MotionTier) => void) {
  return subscribe(() => fn(readTier()))
}
