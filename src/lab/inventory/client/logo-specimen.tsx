'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'
import styles from '@/components/header.module.css'
import { Logo as SiteLogo, type LogoHandle } from '@/components/logo'
import { logo as L } from '@/motion/tokens'

/*
 * The site's logo (src/components/logo.tsx) with the header's styles (header.module.css .logo:
 * the gradient's stops and its flow), at any size. Its colours come from --logo-a / -b / -c,
 * which a wrapper sets per gradient. The states run the component's own code:
 *   rest   as it is
 *   hover  the fan, opened the way the header opens it: a pointerenter on its slot (Motion's
 *          hover()); the slot ignores the real pointer, so it stays open
 *   turn   the letters egg (claimClick on home): Play turns it
 *   exit   logo -> Back and back: the cards' exit, then the deal (the slot's mode)
 * Reduced motion: the component itself keeps the cards still (the egg swaps the letters).
 */
export type LogoState = 'rest' | 'hover' | 'turn' | 'exit'

export function Logo({
  size = 30,
  state = 'rest',
  style,
}: {
  size?: number
  state?: LogoState
  style?: CSSProperties
}) {
  const slot = useRef<HTMLSpanElement>(null)
  const handle = useRef<LogoHandle>(null)
  const [mode, setMode] = useState<'mark' | 'back'>('mark')
  const open = () => {
    const el = slot.current
    if (!el) return
    el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
  }
  useEffect(() => {
    if (state !== 'hover') return
    // After the logo's own effect has attached its hover listener.
    const id = requestAnimationFrame(open)
    return () => cancelAnimationFrame(id)
  }, [state])
  const play = () => {
    if (state === 'hover') open()
    if (state === 'turn') handle.current?.claimClick(true)
    if (state === 'exit') {
      setMode('back')
      setTimeout(() => setMode('mark'), (L.exit.dur + 0.6) * 1000)
    }
  }
  return (
    <span className="inv-logo" style={style}>
      <span
        ref={slot}
        className="inv-logo-slot"
        style={{ height: size, pointerEvents: state === 'hover' ? 'none' : undefined }}
      >
        <SiteLogo ref={handle} className={styles.logo} mode={mode} slot={slot} />
      </span>
      {state === 'rest' ? null : (
        <button type="button" className="tool-button inv-play" onClick={play} data-demo-play="">
          {state === 'hover' ? 'Reopen' : 'Play'}
        </button>
      )}
    </span>
  )
}
