import { palette, type Identity } from '@/design/palette'
import { field as F } from '@/motion/tokens'

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

/** Identities with a bloomed page (cards) start at page intensity. */
const pageIdentities: Identity[] = ['ember', 'tide', 'grove', 'saffron']

/**
 * Initial fallback colours per `data-field` (set before first paint from the
 * URL), so a direct load of a card page paints its colour at once.
 */
export function fieldInitialCss(): string {
  return (Object.keys(palette) as Identity[])
    .map((id) => {
      const i = pageIdentities.includes(id) ? F.intensityPage : F.intensityRest
      const sel = id === 'ink' ? ':root' : `:root[data-field="${id}"]`
      return `${sel}{--fi-field:var(--${id}-field);--fi-mid:var(--${id}-mid);--fi-glow:var(--${id}-glow);--fi-i:${i}}`
    })
    .join('')
}
