import { palette, type Identity } from '@/design/palette'
import { field as F } from '@/motion/tokens'
import { type BlobVariant, blobBaseRadius, blobVariants } from './blobs'

/*
 * CSS fallback of the field (no WebGL2, context lost, or slow frames): two
 * layers of stacked radial gradients whose colours are registered @property
 * values (see src/styles/field.css). Each engine retarget becomes a CSS
 * transition with the same duration, easing and delay, written only while
 * this fallback is the visible renderer.
 */
export class CssField {
  private specs = new Map<string, string>()

  constructor(private el: HTMLElement) {}

  /** Sets a property, transitioning over `dur` s after `delay` s (0: instantly). */
  write(prop: string, value: string, dur: number, easing: string, delay = 0) {
    const instant = dur <= 0 && delay <= 0
    this.specs.set(prop, instant ? `${prop} 0s` : `${prop} ${dur}s ${easing} ${delay}s`)
    this.el.style.transition = [...this.specs.values()].join(',')
    this.el.style.setProperty(prop, value)
    // Commit an instant value now, so a transition set right after starts from it.
    if (instant) void getComputedStyle(this.el).getPropertyValue(prop)
  }

  /**
   * The blob's variant (or where it is between two): its transform values, moving over `dur` s on
   * the compositor (each layer's ::after transitions `transform`; src/styles/field.css).
   */
  blob(v: number[], dur: number, easing: string, delay = 0) {
    const [x, y, rx, ry, deg] = v
    this.el.style.setProperty('--blob-t', dur > 0 || delay > 0 ? `${dur}s ${easing} ${delay}s` : '0s')
    for (const [k, value] of Object.entries(blobCss({ x, y, rx, ry, deg }))) this.el.style.setProperty(k, value)
    if (dur <= 0 && delay <= 0) this.flushBlob()
  }

  /** The blob's opacity (a reduced crossfade), over `dur` s. */
  blobOpacity(w: number, dur: number, easing: string, delay = 0) {
    this.el.style.setProperty('--blob-o', dur > 0 || delay > 0 ? `${dur}s ${easing} ${delay}s` : '0s')
    this.el.style.setProperty('--bw', w.toFixed(3))
    if (dur <= 0 && delay <= 0) this.flushBlob()
  }

  /** Commits an instant blob value, so a transition set right after starts from it. */
  private flushBlob() {
    const layer = this.el.firstElementChild
    if (layer) void getComputedStyle(layer, '::after').transform
  }

  /** Bloom centre and the radius that reaches the farthest corner. */
  origin(x: number, y: number) {
    const w = innerWidth
    const h = innerHeight
    const r = Math.hypot(Math.max(x, 1 - x) * w, Math.max(y, 1 - y) * h)
    this.el.style.setProperty('--fx', `${(x * 100).toFixed(2)}%`)
    this.el.style.setProperty('--fy', `${(y * 100).toFixed(2)}%`)
    this.el.style.setProperty('--fr', `${Math.ceil(r + 40)}px`)
  }
}

/**
 * The CSS twin's blob (.field-layer::after): the original pool's ellipse (36% × 40% of the pools'
 * box, which overhangs the layer by 6% each side) as its own box, moved to a variant's centre,
 * turned and scaled by its radii against the original's. Percentages of the blob's own box, so it
 * draws the same in any frame (the page, the inventory's tiles).
 */
const BLOB_W = 0.36 * 1.12 * 2
const BLOB_H = 0.4 * 1.12 * 2
export function blobCss(v: Pick<BlobVariant, 'x' | 'y' | 'rx' | 'ry' | 'deg'>): Record<string, string> {
  const cx = v.x * 1.12 - 0.06
  const cy = v.y * 1.12 - 0.06
  return {
    '--btx': `${((cx / BLOB_W - 0.5) * 100).toFixed(2)}%`,
    '--bty': `${((cy / BLOB_H - 0.5) * 100).toFixed(2)}%`,
    '--bdeg': `${v.deg.toFixed(2)}deg`,
    '--bsx': (v.rx / blobBaseRadius).toFixed(4),
    '--bsy': (v.ry / blobBaseRadius).toFixed(4),
  }
}

/** Identities with a bloomed page (cards) start at page intensity. */
const pageIdentities: Identity[] = ['ember', 'tide', 'grove', 'saffron']

/**
 * Initial fallback colours per `data-field` (set before first paint from the
 * URL), so a direct load of a card page paints its colour at once.
 */
export function fieldInitialCss(): string {
  // The blob at rest: variant 1, the original pool (the engine moves it from there).
  const blob = Object.entries(blobCss(blobVariants[0]))
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return (Object.keys(palette) as Identity[])
    .map((id) => {
      const i = pageIdentities.includes(id) ? F.intensityPage : F.intensityRest
      const sel = id === 'ink' ? ':root' : `:root[data-field="${id}"]`
      const rest = id === 'ink' ? `;${blob}` : ''
      return `${sel}{--fi-field:var(--${id}-field);--fi-mid:var(--${id}-mid);--fi-glow:var(--${id}-glow);--fi-i:${i}${rest}}`
    })
    .join('')
}
