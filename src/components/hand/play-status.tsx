'use client'

import { useEffect, useState } from 'react'
import { useChrome } from '@/lib/chrome'
import { cardPlay } from '@/motion/tokens'
import { useNotice, usePlayPending } from '@/motion/use-play-pending'

/*
 * The play's plain status line (role="status", announced politely). While a
 * played card rests on the table and its page is slow to arrive
 * (src/motion/use-play-pending.ts), "Loading…" fades in under the card after
 * cardPlay.loading.label, and reads "Still loading…" after .longWait; going
 * offline meanwhile says so. When the card came back because the browser was
 * offline at the impact, the message shows near the hand for
 * .offline.message. No spinner, no progress bar: the field's breath is the
 * only movement (background-field). Styles: src/styles/hand.css.
 */
export function PlayStatus() {
  const { handLabels } = useChrome()
  const pending = usePlayPending()
  const notice = useNotice()
  const [stage, setStage] = useState<'none' | 'loading' | 'still'>('none')
  const at = pending?.at

  useEffect(() => {
    setStage('none')
    if (at === undefined) return
    const L = cardPlay.loading
    const since = performance.now() - at
    const label = window.setTimeout(() => setStage('loading'), Math.max(0, L.label * 1000 - since))
    const still = window.setTimeout(() => setStage('still'), Math.max(0, L.longWait * 1000 - since))
    return () => {
      clearTimeout(label)
      clearTimeout(still)
    }
  }, [at])

  const text =
    notice || pending?.offline
      ? handLabels.offline
      : stage === 'still'
        ? handLabels.stillLoading
        : stage === 'loading'
          ? handLabels.loading
          : ''
  return (
    <p
      className="play-status t-label"
      role="status"
      data-where={notice ? 'hand' : 'table'}
      data-shown={text ? '' : undefined}
    >
      {text}
    </p>
  )
}
