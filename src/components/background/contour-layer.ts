import { field as F, ease } from '@/motion/tokens'

/*
 * About's SVG layer and its vignette (background-field.tsx, src/styles/field.css), driven by the
 * field engine with opacity and transform only: nothing here repaints once the SVG is rasterised.
 *
 *   .contour-bg        the ground with the SVG <img> (cover, scale 1.03); its opacity crossfades
 *                      over the canvas (the morph's last frame shows the same picture)
 *   .contour-vignette  the old page's static gradients, faded with opacity
 *
 * prime() loads the SVG this viewport shows (the <picture> picks it with contourQuery) and decodes
 * it, and displays both layers at PRIMED, an opacity nobody can see (0.001 of a dark ground over a
 * dark field) but above 0: the compositor skips rasterising a layer at exactly 0, so this is what
 * makes the raster happen before the morph, never during the crossfade. The drift (field.contourDrift) animates `translate` only, from
 * the identity offset, so the shader's last frame and the SVG line up when the handoff ends.
 */

type Fade = { to: number; dur: number; easing: string; delay?: number }

/** Invisible, but rasterised: the layers' opacity while About is near (prime()). */
export const PRIMED = 0.001

const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

/** Fades an element's opacity from where it is to `to` (WAAPI, compositor). Resolves when done. */
function fade(el: HTMLElement, { to, dur, easing, delay = 0 }: Fade): Promise<boolean> {
  const from = parseFloat(getComputedStyle(el).opacity)
  for (const a of el.getAnimations()) if (a.id === 'fade') a.cancel()
  el.style.opacity = String(to)
  if (dur <= 0 || Math.abs(from - to) < 1e-3) return Promise.resolve(true)
  const a = el.animate(
    { opacity: [from, to] },
    { id: 'fade', duration: dur * 1000, delay: delay * 1000, easing, fill: 'backwards' },
  )
  return a.finished.then(
    () => true,
    () => false,
  )
}

export class ContourLayer {
  private decoded: Promise<void> | null = null
  private drift: Animation | null = null
  /** The SVG has decoded (or failed to: the handoff never waits on a broken image). */
  ready = false

  constructor(
    private root: HTMLElement,
    private layer: HTMLElement,
    private img: HTMLImageElement,
    private vignetteEl: HTMLElement,
  ) {}

  /** Loads and decodes the SVG and keeps both layers rasterised at PRIMED (invisible). */
  prime(): Promise<void> {
    this.root.toggleAttribute('data-contours-primed', true)
    for (const el of [this.layer, this.vignetteEl])
      if (!el.getAnimations().length && parseFloat(getComputedStyle(el).opacity) < PRIMED)
        el.style.opacity = String(PRIMED)
    if (this.img.loading !== 'eager') this.img.loading = 'eager'
    this.decoded ??= this.img.decode().then(
      () => void (this.ready = true),
      () => {
        // A <picture> switching its source mid-decode rejects: decode once more, then go on.
        this.decoded = null
        return this.img.decode().then(
          () => void (this.ready = true),
          () => void (this.ready = true),
        )
      },
    )
    return this.decoded
  }

  /** Not needed any more: the layer leaves the rendering (it stays loaded and decoded). */
  unprime() {
    this.root.removeAttribute('data-contours-primed')
    for (const el of [this.layer, this.vignetteEl]) if (!el.getAnimations().length) el.style.opacity = '0'
  }

  /** The SVG layer's current opacity (mid-fade included). */
  get opacity() {
    return parseFloat(getComputedStyle(this.layer).opacity)
  }

  /** The SVG layer's opacity (0 hidden, 1 covering the canvas); `easing` a CSS timing function. */
  show(to: number, dur: number, easing = 'linear', delay = 0) {
    return fade(this.layer, { to, dur, easing, delay })
  }

  /** The vignette's opacity. */
  vignette(to: number, dur: number, easing = 'linear', delay = 0) {
    return fade(this.vignetteEl, { to, dur, easing, delay })
  }

  /** Starts the slow drift from the identity offset, afresh (full tier only; the caller decides). */
  startDrift() {
    this.drift?.cancel()
    const { x, y, period } = F.contourDrift
    const easing = bezier(ease.inOut)
    this.drift = this.img.animate(
      [
        { translate: '0px 0px', easing },
        { translate: `${x}px ${y}px`, offset: 0.25, easing },
        { translate: `${-x}px ${-y}px`, offset: 0.75, easing },
        { translate: '0px 0px' },
      ],
      { duration: period * 1000, iterations: Infinity, direction: 'alternate' },
    )
    if (document.hidden) this.drift.pause()
  }

  /** Holds the drift where it is and returns its offset (CSS px), for the shader's first frame. */
  freezeDrift(): [number, number] {
    if (!this.drift) return [0, 0]
    this.drift.pause()
    const [x = 0, y = 0] = getComputedStyle(this.img)
      .translate.split(' ')
      .map((v) => parseFloat(v) || 0)
    return [x, y]
  }

  stopDrift() {
    this.drift?.cancel()
    this.drift = null
  }

  /** The drift stands still while the tab is hidden. */
  setHidden(hidden: boolean) {
    if (!this.drift || this.drift.playState === 'finished') return
    if (hidden) this.drift.pause()
    else if (this.drift.playState === 'paused' && this.root.dataset.contours === 'shown') this.drift.play()
  }
}
