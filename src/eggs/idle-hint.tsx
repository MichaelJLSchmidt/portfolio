'use client'

import { useEffect, useRef, useState } from 'react'
import { ease, idle, reducedCrossfade } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import { eggOn } from './registry'

/** sessionStorage: set once the note has appeared (at most once per session). */
const SHOWN_KEY = 'table-idle-hint'
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

/*
 * The idle hint (egg, home only). After idle.after seconds on home without a
 * click, tap or key press (pointer movement and scrolling don't count), a
 * handwritten note appears beside the hand: the text writes itself word by
 * word, each word revealed left to right, then a curly arrow draws toward the
 * cards. The next click, tap or key press fades it out. Once per session.
 * Decorative: aria-hidden. Reduced: a 160 ms fade.
 * Only where it fits: once the handwriting has loaded (and on every resize
 * while it shows), the note's top must sit at least idle.clearance (24 px)
 * below the last "What I bring" item; on short phones it does not, and the
 * note is skipped (or leaves). Mounted by the home page, so it never shows
 * anywhere else. The handwriting font (Caveat) is fetched only when the note
 * renders.
 */
export function IdleHint({ note }: { note: string }) {
  const [state, setState] = useState<'waiting' | 'shown' | 'gone'>('waiting')
  const ref = useRef<HTMLDivElement>(null)

  // Wait for idle.after (10 s) without input (every click, tap or key press starts the wait again).
  useEffect(() => {
    if (state !== 'waiting' || !eggOn('idleHint')) return
    try {
      if (sessionStorage.getItem(SHOWN_KEY)) return setState('gone')
    } catch {
      // Storage blocked: the note may show once per page view.
    }
    // ?idle in the address shortens the wait to a second (like ?rare: for checking the egg).
    const after = new URLSearchParams(location.search).has('idle') ? 1 : idle.after
    let timer = 0
    const wait = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => setState('shown'), after * 1000)
    }
    wait()
    addEventListener('pointerdown', wait, { capture: true, passive: true })
    addEventListener('keydown', wait, { capture: true, passive: true })
    return () => {
      clearTimeout(timer)
      removeEventListener('pointerdown', wait, true)
      removeEventListener('keydown', wait, true)
    }
  }, [state])

  // Write the note, draw the arrow; the next click, tap or key press fades it out.
  useEffect(() => {
    const el = ref.current
    if (state !== 'shown' || !el) return
    const tier = readTier()
    const anims: Animation[] = []
    let live = true
    let leaving = false
    /** The note's top at least idle.clearance below the last "What I bring" item (the next thing above it). */
    const fits = () => {
      const last = document.querySelector('.home-bring-list > li:last-child')
      if (!last) return true
      return el.getBoundingClientRect().top - last.getBoundingClientRect().bottom >= idle.clearance
    }

    const show = async () => {
      const text = el.querySelector<HTMLElement>('.idle-hint-text')!
      const cs = getComputedStyle(text)
      // Words are measured in the real handwriting, so wait for it (never longer than a second).
      await Promise.race([
        document.fonts?.load(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, note),
        new Promise((r) => setTimeout(r, 1000)),
      ]).catch(() => {})
      if (!live || leaving) return
      // No room on this screen (a short phone): skip the note, unseen (it may show another time).
      if (!fits()) return setState('gone')
      try {
        sessionStorage.setItem(SHOWN_KEY, '1')
      } catch {}
      el.dataset.ready = ''
      if (tier === 'reduced') {
        anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedCrossfade * 1000 }))
        return
      }
      // The text: word by word, each revealed left to right, at a steady pace (by width).
      const words = [...el.querySelectorAll<HTMLElement>('.idle-hint-word')]
      const widths = words.map((w) => w.offsetWidth)
      const total = widths.reduce((a, b) => a + b, 0) || 1
      const write = idle.write * 1000
      let t = 0
      words.forEach((w, i) => {
        const d = (widths[i] / total) * write
        anims.push(
          w.animate([{ clipPath: 'inset(-40% 100% -40% -10%)' }, { clipPath: 'inset(-40% -10% -40% -10%)' }], {
            duration: d,
            delay: t,
            fill: 'backwards',
          }),
        )
        t += d
      })
      // Then the arrow: the curl, then its head.
      const [curl, head] = [...el.querySelectorAll<SVGPathElement>('.idle-hint-arrow path')]
      const at = t + idle.gap * 1000
      const arrow = idle.arrow * 1000
      const curlTime = arrow * idle.arrowCurl
      for (const [path, delay, duration] of [
        [curl, at, curlTime],
        [head, at + curlTime, arrow - curlTime],
      ] as const)
        anims.push(
          path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
            duration,
            delay,
            easing: bezier(ease.inOut),
            fill: 'backwards',
          }),
        )
    }

    const leave = () => {
      if (leaving) return
      leaving = true
      removeEventListener('pointerdown', leave, true)
      removeEventListener('keydown', leave, true)
      for (const a of anims) a.finish()
      const fade = (tier === 'reduced' ? reducedCrossfade : idle.fade) * 1000
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade, easing: bezier(ease.outQuint), fill: 'forwards' })
        .finished.catch(() => {})
        .then(() => live && setState('gone'))
    }

    // A resize that leaves no room (rotation, a window made shorter) takes the note away.
    const onResize = () => {
      if (el.hasAttribute('data-ready') && !fits()) leave()
    }
    void show()
    addEventListener('pointerdown', leave, { capture: true, passive: true })
    addEventListener('keydown', leave, { capture: true, passive: true })
    addEventListener('resize', onResize, { passive: true })
    return () => {
      live = false
      removeEventListener('pointerdown', leave, true)
      removeEventListener('keydown', leave, true)
      removeEventListener('resize', onResize)
      for (const a of anims) a.cancel()
    }
  }, [state, note])

  if (state !== 'shown') return null
  const words = note.split(' ')
  return (
    <div ref={ref} className="idle-hint" aria-hidden="true" data-idle-hint="">
      <p className="idle-hint-text">
        {words.map((w, i) => (
          <span key={i}>
            <span className="idle-hint-word">{w}</span>
            {i < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </p>
      <svg className="idle-hint-arrow" viewBox="0 0 96 84" fill="none" stroke="currentColor">
        <path pathLength={1} d="M88 6c-14 1-27 6-31 15-4 8 3 15 10 12 7-3 5-13-3-15-11-3-23 6-31 18-6 10-12 21-18 34" />
        <path pathLength={1} d="M24 64c-3 2-6 4-9 6-1-3-1-7-2-10" />
      </svg>
    </div>
  )
}
