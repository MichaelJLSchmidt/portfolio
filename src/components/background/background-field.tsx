'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { table } from '@/motion/table-store'
import { onTierChange, readTier } from '@/motion/use-tier'
import { withBase } from '@/lib/site'
import { ContourLayer } from './contour-layer'
import { contourQuery, contourStyle, contourSvg } from './contours'
import { FieldEngine } from './field-engine'

let engine: FieldEngine | null = null

/** The running field. */
export const fieldEngine = () => engine

/**
 * Persistent background field, mounted once in the root layout. It renders no
 * React state: the engine listens to the table store and drives the canvas
 * (or the CSS fallback) directly.
 *
 * Above the canvas, About's layers (contour-layer.ts, src/styles/field.css):
 * the old password page's SVG over its ground (.contour-bg; a <picture> picks
 * the full or the 200 m SVG with contourQuery, the same query the shader's
 * interval reads; lazy, so nothing loads until About is near) and the page's
 * vignette (.contour-vignette). Both change by opacity only, and the SVG's
 * drift by translate; nothing reacts to the pointer.
 */
export function BackgroundField() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const layers = useRef<HTMLDivElement>(null)
  const contours = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const vignette = useRef<HTMLDivElement>(null)

  useEffect(() => {
    table.setTier(readTier())
    const offTier = onTierChange((tier) => table.setTier(tier))
    const layer = new ContourLayer(root.current!, contours.current!, img.current!, vignette.current!)
    engine = new FieldEngine(root.current!, canvas.current!, layers.current!, layer)
    return () => {
      offTier()
      engine?.destroy()
      engine = null
    }
  }, [])

  const [vw, vh] = contourStyle.viewBox
  return (
    <div ref={root} className="field" data-mode="css" aria-hidden="true">
      <div ref={layers} className="field-css">
        <div className="field-layer" data-layer="a" />
        <div className="field-layer" data-layer="b" />
      </div>
      <canvas ref={canvas} className="field-canvas" />
      <div ref={contours} className="contour-bg">
        <picture>
          <source media={contourQuery} srcSet={withBase(contourSvg.full)} />
          <img
            ref={img}
            className="contour-bg__img"
            src={withBase(contourSvg.poster)}
            alt=""
            width={vw}
            height={vh}
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
      <div ref={vignette} className="contour-vignette" />
      <RouteSync />
    </div>
  )
}

/** Tells the table about every route change (links, back/forward, direct loads). */
function RouteSync() {
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    table.route(pathname, first.current)
    first.current = false
  }, [pathname])
  return null
}
