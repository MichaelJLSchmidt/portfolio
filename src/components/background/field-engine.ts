import { contour, palette, type Identity } from '@/design/palette'
import { identityOf } from '@/lib/hand-data'
import { INTRO_DONE } from '@/motion/preferences'
import { VT_DONE } from '@/motion/view-transition'
import { playTokens } from '@/motion/play'
import { type FieldTarget, type TableState, table } from '@/motion/table-store'
import { type MotionTier, cardPlay, duration as D, field as F, reducedCrossfade } from '@/motion/tokens'
import { getPending, onPending } from '@/motion/use-play-pending'
import { ContourLayer, PRIMED } from './contour-layer'
import { contourLevels, contourQuery, contourStyle } from './contours'
import { CssField } from './field-css'
import { type FieldFrame, GlField } from './field-gl'
import { hexToLab, labCss, labToRgb } from './oklab'
import { terrain } from './terrain'
import { type EaseName, Track, easeCss } from './tracks'

/*
 * The background field's state machine. It listens to the table store and
 * eases a handful of channels (palettes, bloom spread, intensities, breath,
 * About's morph); the WebGL renderer samples them each frame, the CSS
 * fallback receives each change as a transition. React never re-renders for
 * any of it.
 *
 *   rest     ink pools breathing on a 9 s sine, their centres drifting on slow
 *            Lissajous loops (90 s and longer, 2.5% of the viewport; full tier,
 *            no data saver). The loop stops while the tab is hidden.
 *   hover    A's mid/glow blend to the card's, intensity up, pools lean to its slot
 *   bloom    B (the card's identity) spreads from the played card to fill the page
 *   unbloom  B contracts into the slot, then the residual tint settles to ink
 *   switch   B crossfades in OKLab with a 6% luminance dip at the midpoint
 *   impact   a played card meets the table: one soft ring in its colour from
 *            the landing point (cardPlay.*.ring) as the bloom fills from there
 *   waiting  the next page is slow: the field breathes softly around the
 *            resting card (cardPlay.loading.breath) until the route commits
 *   About    the pools contract and fade into the contour ground while the
 *            contour lines rise from a noise relief onto the region's heights
 *            (1.6 s inOut, the canvas at the device's resolution meanwhile);
 *            the SVG layer crossfades over the last 300 ms, then covers the
 *            canvas, which draws nothing at rest. Leaving: one shader frame
 *            under the SVG, the SVG fades, the shader runs back. Reduced, the
 *            CSS field or no heightmap: the SVG layer crossfades in and out.
 */

type Name =
  | 'a'
  | 'b'
  | 'h'
  | 'hover'
  | 'pull'
  | 'spread'
  | 'iA'
  | 'iB'
  | 'breaker'
  | 'breath'
  | 'topo'
  | 'dip'
  | 'fade'
  | 'motion'
  | 'lines'
  | 'ring'
  | 'wait'

const swatch = (id: Identity) => [
  ...hexToLab(palette[id].field),
  ...hexToLab(palette[id].mid),
  ...hexToLab(palette[id].glow),
]
/** A hex colour as sRGB 0..1 (the contour field's ground). */
const srgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const hoverSwatch = (id: Identity) => [...hexToLab(palette[id].mid), ...hexToLab(palette[id].glow)]
const mixArr = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)

/** CSS fallback properties for each channel that has one. */
const CSS: Partial<Record<Name, (v: number[]) => [string, string][]>> = {
  a: (v) => [
    ['--fa-field', labCss(v.slice(0, 3))],
    ['--fa-mid', labCss(v.slice(3, 6))],
    ['--fa-glow', labCss(v.slice(6, 9))],
  ],
  b: (v) => [
    ['--fb-field', labCss(v.slice(0, 3))],
    ['--fb-mid', labCss(v.slice(3, 6))],
    ['--fb-glow', labCss(v.slice(6, 9))],
  ],
  h: (v) => [
    ['--fh-mid', labCss(v.slice(0, 3))],
    ['--fh-glow', labCss(v.slice(3, 6))],
  ],
  hover: (v) => [['--fh', v[0].toFixed(4)]],
  iA: (v) => [['--fa-i', v[0].toFixed(4)]],
  iB: (v) => [['--fb-i', v[0].toFixed(4)]],
  breaker: (v) => [['--fk', v[0].toFixed(4)]],
  spread: (v) => [['--fs', v[0].toFixed(4)]],
  fade: (v) => [['--fade', v[0].toFixed(4)]],
}

type Connection = { saveData?: boolean }

export class FieldEngine {
  private tracks: Record<Name, Track>
  private gl: GlField | null = null
  private css: CssField
  private mode: 'gl' | 'css' = 'css'
  private tier: MotionTier
  private origin: [number, number] = [0.5, 1]
  private maxD = 1
  private time = 0
  private raf = 0
  private lastFrame = 0
  private lastDraw = 0
  private paused = false
  private saveData = false
  private samples: number[] = []
  private slowWindows = 0
  private warmUntil = 0
  private frame: FieldFrame
  private offs: (() => void)[] = []

  constructor(
    private root: HTMLElement,
    canvas: HTMLCanvasElement,
    cssLayer: HTMLElement,
    /** About's SVG layer and vignette (contour-layer.ts, src/styles/field.css). */
    private contours: ContourLayer,
  ) {
    this.css = new CssField(cssLayer)
    this.tier = table.get().tier
    const ink = swatch('ink')
    this.tracks = {
      a: new Track(ink),
      b: new Track(ink),
      h: new Track(hoverSwatch('ink')),
      hover: new Track([0]),
      pull: new Track([0.5, 1]),
      spread: new Track([0]),
      iA: new Track([F.intensityRest]),
      iB: new Track([F.intensityPage]),
      breaker: new Track([0]),
      breath: new Track([1]),
      topo: new Track([0]),
      dip: new Track([1]),
      fade: new Track([1]),
      motion: new Track([0]),
      lines: new Track([0]),
      ring: new Track([1]),
      wait: new Track([0]),
    }
    this.frame = {
      time: 0,
      a: new Float32Array(9),
      b: new Float32Array(9),
      intensity: [0, 0],
      spread: 0,
      origin: [0.5, 1],
      maxD: 1,
      pull: [0.5, 1],
      pullAmt: 0,
      drift: new Float32Array(6),
      breath: [1, 1],
      lum: 1,
      fade: 1,
      topo: 0,
      ground: srgb(contour.ground),
      contours: {
        fade: 0,
        view: [1, 1],
        map: [1, 1, 0, 0],
        levels: contourLevels(false),
        widths: [1, 1.5],
        alphas: [contourStyle.lineAlpha, contourStyle.indexAlpha, contourStyle.lakeAlpha, contourStyle.layerOpacity],
        line: srgb(contourStyle.line),
        lake: srgb(contourStyle.lake),
      },
      impact: [0.5, 0.5],
      ring: [1, 0, 0.07],
      ringColour: [0, 0, 0],
      wait: [0, 0.45],
    }
    this.saveData = Boolean((navigator as Navigator & { connection?: Connection }).connection?.saveData)
    this.tracks.motion.jump([this.animated() ? 1 : 0], performance.now())

    const now = performance.now()
    // Hydration and the first navigation are busy: judge frame times after that.
    this.warmUntil = now + 2000
    if (document.documentElement.dataset.intro === 'first') {
      // First visit: the field fades in from black.
      this.tracks.fade.jump([0], now)
      this.tracks.fade.set([1], this.dur(D.fieldIn), 'outSoft', now)
    }

    try {
      this.gl = new GlField(canvas, () => this.fallback())
      this.mode = 'gl'
      // The first size, until the ResizeObserver reports the device-pixel box.
      const rect = canvas.getBoundingClientRect()
      const dpr = devicePixelRatio || 1
      this.box = { w: rect.width, h: rect.height, dw: Math.round(rect.width * dpr), dh: Math.round(rect.height * dpr) }
      this.applySize()
    } catch {
      this.mode = 'css'
    }

    // The route sync (a child effect) may already have set the first target.
    this.applyField({ ...table.get().field, kind: 'instant' })
    this.offs.push(table.subscribe((s, p) => this.onTable(s, p)))
    // A skipped intro ends the fade from black at once.
    const onIntroDone = () => this.go('fade', [1], 0, 'linear')
    addEventListener(INTRO_DONE, onIntroDone)
    this.offs.push(() => removeEventListener(INTRO_DONE, onIntroDone))
    // A play waiting for its page: the field breathes around the resting card after the cue.
    this.offs.push(onPending(() => this.onPending()))
    // A view transition can hold rendering past a short retarget (reduced: 160 ms): the
    // frames drawn meanwhile are never shown, so draw the settled state once it ends.
    const onTransitionDone = () => this.kick(true)
    addEventListener(VT_DONE, onTransitionDone)
    this.offs.push(() => removeEventListener(VT_DONE, onTransitionDone))
    const onVisibility = () => {
      this.setPaused()
      // The contour drift stands still while the tab is hidden.
      this.contours.setHidden(document.hidden)
    }
    document.addEventListener('visibilitychange', onVisibility)
    this.offs.push(() => document.removeEventListener('visibilitychange', onVisibility))
    // The canvas is sized by this observer only (never by scrolling or a pinned scene): it reports
    // the device-pixel box where supported, and the new size is drawn in the same callback (before
    // paint), because resizing clears the drawing buffer.
    const ro = new ResizeObserver((entries) => this.onResize(entries[entries.length - 1]))
    try {
      ro.observe(canvas, { box: 'device-pixel-content-box' })
    } catch {
      ro.observe(canvas)
    }
    this.offs.push(() => ro.disconnect())
    if (this.mode === 'css') {
      this.syncCss(now)
      document.documentElement.dataset.renderer = 'css'
    }
    // About's SVG and heightmap: fetched (and the SVG decoded and rasterised, invisible) when a
    // link to About is hovered, focused or touched, and on About.
    const onIntent = (e: Event) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href]') : null
      if (a && /\/about\/?$/.test(new URL(a.href, location.href).pathname)) this.prepareContours()
    }
    for (const type of ['pointerover', 'focusin', 'touchstart'] as const) {
      document.addEventListener(type, onIntent, { passive: true })
      this.offs.push(() => document.removeEventListener(type, onIntent))
    }
    this.kick(true)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    clearTimeout(this.waitTimer)
    clearTimeout(this.outTimer)
    this.contours.stopDrift()
    for (const off of this.offs) off()
    this.gl?.destroy()
  }

  get renderer() {
    return this.mode
  }

  // ---------------------------------------------------------------- About's contours

  /**
   * About: `off` (the field), `in` (morphing in, then the SVG's crossfade), `shown` (the SVG layer
   * covers the canvas: no frames), `out` (the SVG fades off the shader's frame, then the shader
   * runs back).
   */
  private phase: 'off' | 'in' | 'shown' | 'out' = 'off'
  /** The shader draws contour lines in this morph (WebGL, full tier, heightmap loaded). */
  private linesOn = false
  /** When the SVG's crossfade may start (performance.now()); 0: started or not due. */
  private handoffAt = 0
  /** Leaving: the next frame is the shader at uTopo = 1, then the SVG fades off it. */
  private leaveFrame = false
  /** The drift offset (CSS px) the shader's frame matches while the SVG fades out. */
  private mapOffset: [number, number] = [0, 0]
  /** The drawing buffer at the device's resolution while a morph runs (field.morph). */
  private hiRes = false
  private slowMorph = false
  private morphFrames: number[] = []
  private fullContours = typeof matchMedia === 'function' ? matchMedia(contourQuery) : null
  private outTimer = 0

  /** The heightmap (when WebGL is up) and the SVG: fetched once About is near. */
  private prepareContours() {
    void this.contours.prime()
    if (this.mode !== 'gl' || !this.gl) return
    void this.gl.loadTerrain().then((ok) => {
      // Arriving during a morph in: the lines fade in (no pop), the morph keeps its timing.
      if (ok && this.phase === 'in' && this.linesOn && this.tracks.lines.to[0] === 0) {
        this.go('lines', [1], D.contourHandoff, 'outSoft')
      }
    })
  }

  /** The shader's morph needs WebGL and the full tier (the heightmap may still be on its way). */
  private canMorph() {
    return this.mode === 'gl' && this.tier === 'full'
  }

  private setCanvasCovered(covered: boolean) {
    this.root.toggleAttribute('data-canvas-covered', covered)
  }

  private setHiRes(on: boolean) {
    this.hiRes = on && this.mode === 'gl'
    this.slowMorph = false
    this.morphFrames = []
  }

  /**
   * About's morph in or out over `dur` s. In (WebGL, full tier): the shader eases uTopo 0 -> 1 at
   * full resolution (the field fades into the ground, lines rise from a noise relief onto the
   * real heights) while the vignette fades in; in its last `contourHandoff` s the SVG layer
   * crossfades over the canvas (once decoded), then the canvas is covered, the loop stops and the
   * drift starts. Out: one shader frame at uTopo = 1 (matching the drift's offset) under the SVG,
   * the SVG fades off it, then uTopo runs 1 -> 0 while the colours return. Reduced motion, the CSS
   * field, or no heightmap: the SVG layer simply crossfades in or out over `dur`.
   */
  private toTopo(to: 0 | 1, dur: number, ease: EaseName) {
    const now = performance.now()
    const L = this.contours
    const topo = this.tracks.topo
    topo.sample(now)
    clearTimeout(this.outTimer)
    const H = Math.min(D.contourHandoff, dur)

    if (to === 1) {
      this.prepareContours()
      if (dur <= 0) {
        // A direct visit (or an instant change): the SVG at once.
        this.jumpTopo(1)
        this.settleShown()
        return
      }
      if (this.phase === 'shown' || (this.phase === 'in' && topo.to[0] === 1)) return
      this.phase = 'in'
      this.root.dataset.contours = 'morph'
      this.setCanvasCovered(false)
      this.mapOffset = [0, 0]
      this.leaveFrame = false
      this.linesOn = this.canMorph()
      this.jump('lines', [this.gl?.hasTerrain ? 1 : 0])
      this.go('topo', [1], dur, ease)
      void L.vignette(1, dur, easeCss(ease))
      if (this.linesOn) {
        this.setHiRes(true)
        // Anything of the SVG still showing (a turn back mid-way) leaves first; primed stays rasterised.
        if (L.opacity > PRIMED * 2) void L.show(PRIMED, H)
        this.handoffAt = now + (dur - H) * 1000
        void L.prime().then(() => this.maybeHandoff(performance.now()))
      } else {
        this.handoffAt = 0
        void L.show(1, dur, easeCss(ease)).then((done) => {
          if (done && this.phase === 'in') this.settleShown()
        })
      }
      return
    }

    // Leaving (or not on About at all).
    if (this.phase === 'off') {
      if (topo.to[0] !== 0) this.jumpTopo(0)
      L.unprime()
      return
    }
    this.handoffAt = 0
    const fromShown = this.phase === 'shown'
    this.phase = 'out'
    this.root.dataset.contours = 'morph'
    if (dur <= 0) {
      this.jumpTopo(0)
      void L.show(0, 0)
      void L.vignette(0, 0)
      this.settleOff()
      return
    }
    if (fromShown && this.canMorph() && this.gl?.hasTerrain) {
      this.linesOn = true
      this.jump('lines', [1])
      this.setHiRes(true)
      this.mapOffset = L.freezeDrift()
      this.jumpTopo(1)
      // The next frame draws the shader under the SVG and uncovers the canvas; then the SVG fades.
      this.leaveFrame = true
      this.go('topo', [0], dur, ease, H)
      void L.vignette(0, H + dur, easeCss(ease))
      this.kick(true)
      return
    }
    // Reduced, the CSS field, no heightmap, or a turn back mid-morph: crossfade the SVG away.
    this.linesOn = this.linesOn && this.canMorph()
    this.setCanvasCovered(false)
    L.stopDrift()
    const curve = easeCss(ease)
    void L.show(0, this.linesOn ? H : dur, curve)
    void L.vignette(0, dur, curve)
    this.go('topo', [0], dur, ease)
    this.outTimer = window.setTimeout(() => this.phase === 'out' && this.settleOff(), dur * 1000 + 50)
  }

  private jumpTopo(v: number) {
    this.tracks.topo.jump([v], performance.now())
  }

  /** Entering, near the end of the morph: the SVG crossfades over the shader's frame once decoded. */
  private maybeHandoff(now: number) {
    if (this.phase !== 'in' || !this.handoffAt || now < this.handoffAt || !this.contours.ready) return
    this.handoffAt = 0
    const left = Math.max(0, this.tracks.topo.remaining(now))
    const dur = Math.max(D.contourHandoff, left)
    void this.contours.show(1, dur, 'linear').then((done) => {
      if (done && this.phase === 'in') this.settleShown()
    })
  }

  /** At rest on About: the SVG layer covers the canvas; the loop stops; the drift starts. */
  private settleShown() {
    this.phase = 'shown'
    this.handoffAt = 0
    this.root.dataset.contours = 'shown'
    void this.contours.show(1, 0)
    void this.contours.vignette(1, 0)
    this.setCanvasCovered(true)
    this.setHiRes(false)
    // The canvas is covered: a smaller buffer (cleared, never shown) until the next morph.
    this.applySize()
    if (this.tier === 'full') this.contours.startDrift()
  }

  /** Off About again: the layer leaves the rendering; the field at its resting resolution. */
  private settleOff() {
    this.phase = 'off'
    this.linesOn = false
    this.mapOffset = [0, 0]
    this.root.dataset.contours = 'off'
    this.setCanvasCovered(false)
    this.contours.stopDrift()
    this.contours.unprime()
    if (this.hiRes) {
      this.setHiRes(false)
      // Applied at the start of the next frame and drawn in it.
      this.kick(true)
    }
  }

  /** At rest on About only the SVG layer shows: the canvas draws nothing and asks for no frames. */
  private contoursAtRest() {
    if (this.phase === 'shown') return true
    // Morphed in and drawn, waiting for (or running) the SVG's crossfade: nothing changes.
    const topo = this.tracks.topo
    const lines = this.tracks.lines
    return (
      this.phase === 'in' &&
      topo.value[0] >= 1 &&
      topo.to[0] >= 1 &&
      this.frame.topo >= 1 &&
      lines.value[0] === lines.to[0]
    )
  }

  /** The heightmap mapping and the SVG's drawing for this frame (contours.ts). */
  private contourFrame() {
    const c = this.frame.contours
    const { w, h } = this.box
    c.fade = this.linesOn ? this.tracks.lines.value[0] : 0
    if (!c.fade || !w || !h) return
    const [VW, VH] = contourStyle.viewBox
    const k = F.contourDrift.scale
    // The <img>: object-fit cover (= xMidYMid slice), scaled k about the centre, translated by the drift.
    const s = Math.max(w / VW, h / VH)
    const T = terrain.width / VW
    const a = T / (k * s)
    const [dx, dy] = this.mapOffset
    c.view[0] = w
    c.view[1] = h
    c.map[0] = a
    c.map[1] = a
    c.map[2] = ((-w / 2 - dx) / (k * s) + VW / 2) * T
    c.map[3] = ((-h / 2 - dy) / (k * s) + VH / 2) * T
    c.levels = contourLevels(Boolean(this.fullContours?.matches))
    c.widths[0] = contourStyle.lineWidth * k
    c.widths[1] = contourStyle.indexWidth * k
  }

  // ---------------------------------------------------------------- input

  private onTable(s: TableState, p: TableState) {
    if (s.tier !== p.tier) this.setTier(s.tier)
    if (s.field.seq !== p.field.seq) this.applyField(s.field)
    if (s.hoverCard !== p.hoverCard) this.applyHover(s.hoverCard)
    if (s.breaker !== p.breaker) this.go('breaker', [s.breaker ? 1 : 0], this.dur(D.hoverIn), 'outSoft')
  }

  /** Tier-scaled duration: full as given, reduced one 160 ms crossfade. */
  private dur(full: number) {
    return this.tier === 'reduced' ? reducedCrossfade : full
  }

  private setTier(tier: MotionTier) {
    this.tier = tier
    this.go('motion', [this.animated() ? 1 : 0], D.crossfade, 'outSoft')
    // The contour drift is full tier only.
    if (tier !== 'full') this.contours.stopDrift()
    else if (this.phase === 'shown') this.contours.startDrift()
  }

  /** Brings every track up to date (the loop does not run in CSS mode or while idle). */
  private sampleAll(now: number) {
    let moving = false
    for (const track of Object.values(this.tracks)) moving = track.sample(now) || moving
    return moving
  }

  private applyField(t: FieldTarget) {
    const now = performance.now()
    const tr = this.tracks
    this.sampleAll(now)
    const P = swatch(t.identity)
    const iTo = t.spread ? F.intensityPage : F.intensityRest
    const topo = t.topo
    const topoDur = this.dur(D.topo)
    const spreadNow = tr.spread.value[0]
    const settled = tr.spread.remaining(now) === 0

    let kind = t.kind
    if (kind !== 'instant' && this.tier !== 'full') kind = 'crossfade'
    // A card met the table: one ring from the landing point (full tier; the bloom follows below).
    if (t.ring && this.tier === 'full' && this.mode === 'gl') this.startRing(t)
    if (kind === 'bloom' && spreadNow > 0.01) kind = 'switch'

    switch (kind) {
      case 'instant':
        this.setOrigin(t.origin)
        this.jump('a', P)
        this.jump('b', P)
        this.jump('spread', [t.spread])
        this.jump('iA', [F.intensityRest])
        this.jump('iB', [F.intensityPage])
        this.jump('breath', [t.spread ? 0.5 : 1])
        this.toTopo(topo, 0, 'linear')
        this.jump('dip', [1])
        break

      case 'bloom':
        this.setOrigin(t.origin)
        this.jump('b', P)
        this.jump('iB', [F.intensityPage])
        this.go('spread', [1], D.bloom, 'bloom')
        this.go('breath', [0.5], D.bloom, 'bloom')
        this.toTopo(0, D.bloom, 'outSoft')
        break

      case 'unbloom':
        // Contract toward the slot; mid-bloom, keep the current centre so the disc does not jump.
        if (settled) this.setOrigin(t.origin)
        if (spreadNow > 0.99) {
          // A is hidden while bloomed: leave a half tint outside the contracting disc.
          this.jump('a', mixArr(tr.b.value, P, 0.5))
          this.jump('iA', [tr.iB.value[0]])
        }
        this.go('spread', [0], D.unbloom, 'bloom')
        this.go('a', P, D.toInk, 'outSoft', D.unbloom)
        this.go('iA', [iTo], D.toInk, 'outSoft', D.unbloom)
        this.go('breath', [1], D.toInk, 'outSoft', D.unbloom)
        this.toTopo(topo, topoDur, 'bloom')
        break

      case 'switch':
        this.go('b', P, D.crossfade, 'bloom')
        this.go('iB', [F.intensityPage], D.crossfade, 'bloom')
        this.jump('dip', [0])
        this.go('dip', [1], D.crossfade, 'linear')
        if (tr.spread.to[0] !== 1) this.go('spread', [1], D.bloom, 'bloom')
        this.go('breath', [0.5], D.crossfade, 'bloom')
        this.toTopo(0, D.crossfade, 'outSoft')
        break

      case 'crossfade': {
        // Reduced turns bloom / unbloom / switch into a plain colour fade (cardPlay.reduced.bloom).
        const dur = this.tier === 'reduced' && t.kind !== 'crossfade' ? cardPlay.reduced.bloom : this.dur(D.crossfade)
        if (settled && spreadNow > 0.99 && !t.spread) {
          // Flatten B into A (invisible), then fade A.
          this.jump('a', tr.b.value)
          this.jump('iA', tr.iB.value)
          this.jump('spread', [0])
          this.go('a', P, dur, 'bloom')
          this.go('iA', [iTo], dur, 'bloom')
        } else if (settled && spreadNow < 0.01 && t.spread) {
          // Raise A into B (invisible), then fade B.
          this.jump('b', this.displayedA(now))
          this.jump('iB', tr.iA.value)
          this.jump('spread', [1])
          this.go('b', P, dur, 'bloom')
          this.go('iB', [iTo], dur, 'bloom')
        } else if (settled && t.spread) {
          this.go('b', P, dur, 'bloom')
          this.go('iB', [iTo], dur, 'bloom')
        } else if (settled) {
          this.go('a', P, dur, 'bloom')
          this.go('iA', [iTo], dur, 'bloom')
        } else {
          this.go('a', P, dur, 'bloom')
          this.go('b', P, dur, 'bloom')
          this.go('iA', [F.intensityRest], dur, 'bloom')
          this.go('iB', [F.intensityPage], dur, 'bloom')
          this.go('spread', [t.spread], dur, 'bloom')
        }
        this.go('breath', [t.spread ? 0.5 : 1], dur, 'bloom')
        this.toTopo(topo, topoDur, 'bloom')
        break
      }
    }
  }

  // ---------------------------------------------------------------- the play

  /** Where the last card met the table (the ring's and the waiting breath's centre). */
  private impact: [number, number] = [0.5, 0.5]
  private ring = { strength: 0, width: 0 }
  private waitTimer = 0
  private waitStart = 0

  private startRing(t: FieldTarget) {
    const R = playTokens().ring
    this.impact = t.origin
    this.ring = { strength: R.intensity, width: R.width }
    this.frame.ringColour = srgb(palette[t.identity].glow)
    this.jump('ring', [0])
    this.go('ring', [1], R.dur, 'outExpo')
  }

  /** The pending signal changed: after the cue the breath eases in around the card; it eases out when the page commits. */
  private onPending() {
    const p = getPending()
    const L = cardPlay.loading
    clearTimeout(this.waitTimer)
    if (p && this.tier === 'full' && this.mode === 'gl') {
      const at = Math.max(0, L.cue * 1000 - (performance.now() - p.at))
      this.waitTimer = window.setTimeout(() => {
        if (getPending() !== p) return
        this.impact = p.point
        this.waitStart = performance.now()
        this.go('wait', [1], L.breath.ramp, 'outSoft')
      }, at)
    } else if (this.tracks.wait.to[0] !== 0) this.go('wait', [0], L.breath.ramp, 'outSoft')
  }

  /** A play's field response is running (the ring, the waiting breath): draw every frame. */
  private playing() {
    const now = performance.now()
    return this.tracks.ring.remaining(now) > 0 || this.tracks.wait.value[0] > 0 || this.tracks.wait.remaining(now) > 0
  }

  private applyHover(id: string | null) {
    const identity = identityOf(id)
    if (id && identity) {
      const now = performance.now()
      this.sampleAll(now)
      const target = hoverSwatch(identity)
      if (this.tracks.hover.value[0] < 0.02 && this.tracks.hover.remaining(now) === 0) this.jump('h', target)
      else this.go('h', target, this.dur(D.hoverIn), 'outSoft')
      this.go('hover', [1], this.dur(D.hoverIn), 'outSoft')
      this.go('pull', table.slotOf(id) ?? [0.5, 1], this.dur(D.hoverIn), 'outSoft')
    } else {
      this.go('hover', [0], this.dur(D.hoverOut), 'outSoft')
    }
  }

  // ---------------------------------------------------------------- tracks

  private go(name: Name, to: number[], dur: number, ease: EaseName, delay = 0) {
    const now = performance.now()
    this.tracks[name].set(to, dur, ease, now, delay)
    if (this.mode === 'css') this.writeCss(name, to, dur, ease, delay)
    // About at rest: only the contours show, so other channels (hover, breaker, tier) ask for no frame.
    if (name !== 'topo' && this.contoursAtRest()) return
    // Dirty: at least one frame is drawn even if the track has already ended by
    // the next frame (a short reduced crossfade while a view transition holds rendering).
    this.kick(true)
  }

  private jump(name: Name, to: number[]) {
    this.go(name, to, 0, 'linear')
  }

  private writeCss(name: Name, to: number[], dur: number, ease: EaseName, delay: number) {
    const props = CSS[name]?.(to)
    if (!props) return
    for (const [prop, value] of props) this.css.write(prop, value, dur, easeCss(ease), delay)
  }

  /** Writes every channel to the CSS fallback: current value now, the rest as a transition. */
  private syncCss(now: number) {
    for (const name of Object.keys(this.tracks) as Name[]) {
      const track = this.tracks[name]
      const moving = track.sample(now)
      this.writeCss(name, track.value, 0, 'linear', 0)
      if (moving) {
        const delay = Math.max(0, (track.start - now) / 1000)
        const dur = (track.end - Math.max(now, track.start)) / 1000
        this.writeCss(name, track.to, dur, track.ease, delay)
      }
    }
    this.css.origin(...this.origin)
  }

  private setOrigin(origin: [number, number]) {
    this.origin = origin
    const w = innerWidth
    const h = innerHeight
    const aspect = w / h
    const [x, y] = origin
    this.maxD = Math.hypot(Math.max(x, 1 - x) * aspect, Math.max(y, 1 - y))
    if (this.mode === 'css') this.css.origin(x, y)
  }

  private displayedA(now: number) {
    const { a, h, hover } = this.tracks
    a.sample(now)
    h.sample(now)
    hover.sample(now)
    // Hover leans A's mid/glow most of the way to the card's (a full blend reads too loud).
    const k = hover.value[0] * 0.65
    return [
      ...a.value.slice(0, 3),
      ...mixArr(a.value.slice(3, 6), h.value.slice(0, 3), k),
      ...mixArr(a.value.slice(6, 9), h.value.slice(3, 6), k),
    ]
  }

  // ---------------------------------------------------------------- size

  /** The canvas's CSS size and its device-pixel box (last accepted). */
  private box = { w: 0, h: 0, dw: 0, dh: 0 }

  private onResize(entry: ResizeObserverEntry) {
    const css = entry.contentBoxSize?.[0]
    const w = css ? css.inlineSize : entry.contentRect.width
    const h = css ? css.blockSize : entry.contentRect.height
    const dpr = devicePixelRatio || 1
    const dev = entry.devicePixelContentBoxSize?.[0]
    const dw = dev ? dev.inlineSize : Math.round(w * dpr)
    const dh = dev ? dev.blockSize : Math.round(h * dpr)
    const b = this.box
    // The container is 100lvh, so mobile toolbars never resize it; where lvh is missing, a
    // height-only change smaller than F.ignoreHeight (a toolbar) is ignored too.
    if (b.w && w === b.w && dw === b.dw && Math.abs(h - b.h) < F.ignoreHeight) return
    this.box = { w, h, dw, dh }
    this.setOrigin(this.origin)
    if (this.applySize()) this.drawNow()
    else this.kick(true)
  }

  /**
   * Drawing-buffer size for the current state: the field's low resolution at rest (renderScale,
   * devicePixelRatio capped at 1); while About's morph runs, the device's pixels (DPR capped at
   * field.morph.dprMax), or 0.75× of that once the guard found the frames too slow.
   */
  private targetSize() {
    const { w, h, dw, dh } = this.box
    const dpr = devicePixelRatio || 1
    if (this.hiRes) {
      const M = F.morph
      const k = this.slowMorph ? M.slowScale : 1
      // A card is being played meanwhile (leaving About by a play): never above field.play.dprMax.
      const max = this.playing() ? Math.min(M.dprMax, F.play.dprMax) : M.dprMax
      return dpr <= max ? ([dw * k, dh * k] as const) : ([w * max * k, h * max * k] as const)
    }
    const scale = Math.min(dpr, 1) * F.renderScale
    return [w * scale, h * scale] as const
  }

  /** Applies the target size to the drawing buffer; true when it changed (and was cleared). */
  private applySize() {
    if (!this.gl || !this.box.w) return false
    const [w, h] = this.targetSize()
    return this.gl.setSize(w, h)
  }

  /** Draws the current state right away (after a resize cleared the buffer). */
  private drawNow() {
    if (this.mode !== 'gl' || this.paused) return
    this.sampleAll(performance.now())
    this.draw()
    this.kick()
  }

  // ---------------------------------------------------------------- loop

  private setPaused() {
    const paused = document.hidden
    if (paused === this.paused) return
    this.paused = paused
    if (paused) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    } else {
      this.samples = []
      this.warmUntil = performance.now() + 1000
      this.kick(true)
    }
  }

  /** Breath and drift may move at all (full tier, no data saver); `motion` eases toward this. */
  private animated() {
    return this.tier === 'full' && !this.saveData
  }

  /** The loop runs while something moves; the breathing field keeps it running. */
  private continuous() {
    return this.animated()
  }

  private dirty = true
  private wasMoving = false

  private kick(dirty = false) {
    if (dirty) this.dirty = true
    if (this.mode !== 'gl' || this.paused || this.raf) return
    this.lastFrame = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private tick = (now: number) => {
    this.raf = 0
    if (this.mode !== 'gl' || this.paused) return
    let moving = this.sampleAll(now)
    // About: the crossfade's moment entering; leaving, the end of the run back.
    if (this.phase === 'in') this.maybeHandoff(now)
    const topo = this.tracks.topo
    if (this.phase === 'out' && this.linesOn && !this.leaveFrame && topo.value[0] <= 0 && topo.remaining(now) === 0) {
      this.settleOff()
    }
    // A track that has just settled: draw its final value once more (the last moving frame showed
    // a value from just before its end).
    if (this.wasMoving && !moving) this.dirty = true
    this.wasMoving = moving
    // About at rest: no frames (the SVG layer covers the canvas), and always the settled frame
    // itself (topo exactly 1) before the handoff.
    const still = this.contoursAtRest()
    if (still) moving = false
    else if (this.phase === 'in' && this.frame.topo < 1 && topo.value[0] >= 1) this.dirty = true
    const continuous = !still && this.continuous()
    const playing = !still && this.playing()
    if (!moving && !continuous && !playing && !this.dirty && !this.leaveFrame) return
    this.raf = requestAnimationFrame(this.tick)

    const interval = this.lastFrame ? now - this.lastFrame : 0
    this.lastFrame = now
    // The morph has its own guard (field.morph); the resting field its CSS fallback monitor.
    if (this.hiRes && interval) this.guard(interval)
    else if (continuous && interval) this.monitor(now, interval)
    // The monitor may have switched to the CSS field: no WebGL frame after that.
    if (this.mode !== 'gl') return
    // A new buffer size is applied at the start of a frame and drawn in that same frame.
    const resized = this.applySize()
    // The resting field draws at F.fps; a morph and a play every frame.
    if (!resized && !this.hiRes && !playing && now - this.lastDraw < 1000 / F.fps - 2) return
    const dt = this.lastDraw ? Math.min(now - this.lastDraw, 100) / 1000 : 0
    this.lastDraw = now
    if (continuous) this.time += dt
    this.dirty = false
    this.draw()
    if (this.leaveFrame) {
      // Leaving About: this frame (uTopo = 1, the drift's offset) is under the SVG; uncover the
      // canvas in the same frame and fade the SVG off it.
      this.leaveFrame = false
      this.setCanvasCovered(false)
      void this.contours.show(0, Math.min(D.contourHandoff, this.dur(D.topo)), 'linear')
    }
  }

  /** The morph's frame guard: the median of its first frame intervals too slow, render at 0.75×. */
  private guard(interval: number) {
    const M = F.morph
    if (this.slowMorph || this.morphFrames.length >= M.guardFrames) return
    this.morphFrames.push(interval)
    if (this.morphFrames.length < M.guardFrames) return
    const sorted = [...this.morphFrames].sort((a, b) => a - b)
    const median = (sorted[(M.guardFrames - 1) >> 1] + sorted[M.guardFrames >> 1]) / 2
    if (median > M.guardMs) this.slowMorph = true
  }

  /** Average rAF interval over 60 frames above 24 ms, twice in a row: use the CSS field. */
  private monitor(now: number, interval: number) {
    if (now < this.warmUntil) return
    this.samples.push(Math.min(interval, 100))
    if (this.samples.length < F.frameWindow) return
    const avg = this.samples.reduce((s, v) => s + v, 0) / this.samples.length
    this.samples = []
    this.slowWindows = avg > F.maxFrameMs ? this.slowWindows + 1 : 0
    if (this.slowWindows >= 2) this.fallback()
  }

  private fallback() {
    if (this.mode === 'css') return
    this.mode = 'css'
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.syncCss(performance.now())
    this.root.dataset.mode = 'css'
    document.documentElement.dataset.renderer = 'css'
    // Mid-way through About's morph the canvas stops: finish it as the CSS field does, by opacity.
    const now = performance.now()
    const left = this.tracks.topo.remaining(now)
    this.handoffAt = 0
    this.leaveFrame = false
    this.setHiRes(false)
    if (this.phase === 'in')
      void this.contours.show(1, left, 'linear').then((done) => done && this.phase === 'in' && this.settleShown())
    else if (this.phase === 'out') {
      this.setCanvasCovered(false)
      void this.contours.show(0, Math.max(left, reducedCrossfade), 'linear')
      clearTimeout(this.outTimer)
      this.outTimer = window.setTimeout(
        () => this.phase === 'out' && this.settleOff(),
        (left + reducedCrossfade) * 1000,
      )
    }
  }

  private draw() {
    if (this.mode !== 'gl' || !this.gl) return
    const t = this.tracks
    const f = this.frame
    const motion = t.motion.value[0]
    const hover = t.hover.value[0]
    const breaker = t.breaker.value[0] * F.breaker
    const A = this.displayedA(performance.now())
    for (let i = 0; i < 3; i++) {
      labToRgb(A.slice(i * 3, i * 3 + 3), f.a, i * 3)
      labToRgb(t.b.value.slice(i * 3, i * 3 + 3), f.b, i * 3)
    }
    f.time = this.time
    f.intensity[0] = t.iA.value[0] + hover * (F.intensityHover - F.intensityRest) + breaker
    f.intensity[1] = t.iB.value[0] + breaker
    f.spread = t.spread.value[0]
    f.origin = this.origin
    f.maxD = this.maxD
    f.pull = t.pull.value as [number, number]
    f.pullAmt = hover * 0.5 * motion
    // Drift: each pool's centre loops a slow Lissajous figure, 2.5% of the viewport (full tier;
    // the clock stops in reduced, where `motion` eases the offset back to 0, and while paused).
    const aspect = innerWidth / Math.max(1, innerHeight)
    const reach = F.poolDrift * motion
    F.poolDriftPeriods.forEach(([px, py], i) => {
      f.drift[i * 2] = reach * aspect * Math.sin((2 * Math.PI * this.time) / px + i * 2.1)
      f.drift[i * 2 + 1] = reach * Math.sin((2 * Math.PI * this.time) / py + i * 1.3)
    })
    // Breath: a 9 s sine in-out; pool scale 1.00-1.06, luminance ±4%.
    const amp = t.breath.value[0] * motion
    const b = (1 - Math.cos((2 * Math.PI * this.time) / D.breath)) / 2
    f.breath[0] = 1 + F.breathScale * b * amp
    f.breath[1] = 1 + F.breathLum * (2 * b - 1) * amp
    f.lum = 1 - F.switchDip * Math.sin(Math.PI * t.dip.value[0])
    f.fade = t.fade.value[0]
    f.topo = t.topo.value[0]
    // The impact's ring: grows on outExpo and fades as it grows; the waiting breath: a slow sine.
    // (Its strength falls on the clock, not on the eased radius, so it stays visible as it travels.)
    const ring = t.ring.value[0]
    const span = t.ring.end - t.ring.start
    const left = span > 0 ? Math.min(1, Math.max(0, (t.ring.end - performance.now()) / span)) : 0
    f.impact = this.impact
    f.ring[0] = ring
    f.ring[1] = ring < 1 ? this.ring.strength * left : 0
    f.ring[2] = this.ring.width
    const B = cardPlay.loading.breath
    const wait = t.wait.value[0]
    f.wait[0] = wait
      ? B.lum * wait * Math.sin((2 * Math.PI * (performance.now() - this.waitStart)) / (B.period * 1000))
      : 0
    f.wait[1] = B.radius
    this.contourFrame()
    this.gl!.draw(f)
    if (this.root.dataset.mode !== 'gl') {
      this.root.dataset.mode = 'gl'
      document.documentElement.dataset.renderer = 'gl'
    }
  }
}
