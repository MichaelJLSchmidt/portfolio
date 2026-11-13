'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useChrome } from '@/lib/chrome'
import {
  type Look,
  ALL_IDENTITIES,
  COLOUR_LABEL,
  COLOUR_MODES,
  cap,
  colourForSurface,
  resolve,
  stageStyle,
} from '../colours'
import { hStem } from '../glyphs'
import { type Concept, type VariantKey, fileStem, conceptLabel } from '../model'
import { drawInto, pngBlob, saveBlob, saveText } from '../raster'
import { type Paints, toSvgString } from '../svg-string'
import { type Container, SQUARE_R, buildMark, heightFor as boxHeight, metricsOf, variantOf } from '../tree'
import { Mark } from './mark'
import { Segmented } from './controls'
import { useStored } from './store'

export const LADDER = [16, 24, 32, 48, 64, 128, 256, 512]
/** Whole-pixel height of a mark rendered `w` pixels wide. */
const heightFor = (concept: Concept, v: VariantKey, w: number, container: Container) =>
  Math.round(boxHeight(w, container, variantOf(concept, v)))

/** Paints for a file: the favicon variant never takes the accent. */
export function paintsFor(look: Look, variant: VariantKey): Paints {
  const r = resolve(look)
  return { neutral: r.neutral, accent: variant === 'favicon' ? r.neutral : r.accent, container: r.container }
}

/* ---------- Size ladder ---------- */

export function Ladder({ concept, variant, look }: { concept: Concept; variant: VariantKey; look: Look }) {
  const [free, setFree] = useState(160)
  const [max, setMax] = useState(1024)
  const id = useId()
  useEffect(() => {
    const update = () => setMax(Math.max(64, Math.floor(document.documentElement.clientWidth - 48)))
    update()
    addEventListener('resize', update)
    return () => removeEventListener('resize', update)
  }, [])
  const size = Math.min(free, max)
  return (
    <section className="lab-section" aria-labelledby="ladder-title">
      <h2 id="ladder-title" className="lab-h2 t-h3">
        Size ladder
      </h2>
      <div className="lab-scroll">
        <ol className="lab-ladder lab-stage-bg" style={stageStyle(look)}>
          {LADDER.map((s) => (
            <li key={s}>
              <Mark concept={concept} variant={variant} container={look.container} size={s} />
              <span className="t-label">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="lab-free">
        <label htmlFor={id} className="t-label">
          Free size: {size} px
        </label>
        <input
          id={id}
          type="range"
          min={16}
          max={max}
          step={1}
          value={size}
          onChange={(e) => setFree(Number(e.target.value))}
        />
        <div className="lab-free-stage lab-stage-bg" style={stageStyle(look)}>
          <Mark concept={concept} variant={variant} container={look.container} size={size} />
        </div>
      </div>
    </section>
  )
}

/* ---------- Pixel-true view ---------- */

function Raster({
  svg,
  width,
  height,
  ground,
  cssWidth,
  label,
}: {
  svg: string
  width: number
  height: number
  ground: string
  cssWidth: number
  label: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) drawInto(ref.current, svg, width, height, ground).catch(() => {})
  }, [svg, width, height, ground])
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      className="lab-raster"
      style={{ width: cssWidth, height: (cssWidth * height) / width }}
    />
  )
}

const ZOOM: Record<number, number> = { 16: 8, 32: 4, 48: 3 }

export function PixelTrue({ concept, variant, look }: { concept: Concept; variant: VariantKey; look: Look }) {
  const [mode, setMode] = useState<'auto' | 'selected'>('auto')
  const [dpr, setDpr] = useState(1)
  useEffect(() => setDpr(window.devicePixelRatio || 1), [])
  const r = resolve(look)
  return (
    <section className="lab-section" aria-labelledby="pixel-title">
      <div className="lab-section-head">
        <h2 id="pixel-title" className="lab-h2 t-h3">
          Pixel-true
        </h2>
        <Segmented
          label="Variant"
          hideLabel
          value={mode}
          options={[
            { value: 'auto', label: 'Favicon to 32, master at 48' },
            { value: 'selected', label: 'Selected variant' },
          ]}
          onChange={(v) => setMode(v as 'auto' | 'selected')}
        />
      </div>
      <p className="lab-hint">
        Rasterised into a canvas at exactly 16, 32 and 48 device pixels (this screen: {dpr}× ), shown at true size,
        enlarged with hard pixels, and next to the vector at the same enlarged size.
      </p>
      <div className="lab-pixels">
        {[16, 32, 48].map((n) => {
          const v: VariantKey = mode === 'auto' ? (n <= 32 ? 'favicon' : 'master') : variant
          const h = heightFor(concept, v, n, look.container)
          const svg = toSvgString(buildMark(concept, v, look.container), {
            paints: paintsFor(look, v),
            size: { width: n, height: h },
          })
          const big = n * ZOOM[n]
          return (
            <figure key={n} className="lab-pixel">
              <div className="lab-pixel-row">
                <Raster
                  svg={svg}
                  width={n}
                  height={h}
                  ground={r.ground}
                  cssWidth={n / dpr}
                  label={`${n} device pixels, true size`}
                />
                <Raster
                  svg={svg}
                  width={n}
                  height={h}
                  ground={r.ground}
                  cssWidth={big}
                  label={`${n} device pixels, enlarged ${ZOOM[n]}×`}
                />
                <div className="lab-stage-bg lab-pixel-vector" style={stageStyle(look)}>
                  <Mark concept={concept} variant={v} container={look.container} size={big} decorative />
                </div>
              </div>
              <figcaption className="t-label">
                {n} px · {v} · raster, enlarged {ZOOM[n]}×, vector
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Grounds, colours, containers ---------- */

function Swatch({
  concept,
  variant,
  look,
  label,
}: {
  concept: Concept
  variant: VariantKey
  look: Look
  label: string
}) {
  return (
    <figure className="lab-swatch">
      <div className="lab-swatch-stage lab-stage-bg" style={stageStyle(look)}>
        <Mark concept={concept} variant={variant} container={look.container} size={64} decorative />
      </div>
      <figcaption className="t-label">{label}</figcaption>
    </figure>
  )
}

export function Strips({ concept, variant, look }: { concept: Concept; variant: VariantKey; look: Look }) {
  const grounds: { label: string; look: Look }[] = [
    ...ALL_IDENTITIES.map((identity) => ({
      label: `${cap(identity)} field`,
      look: { ...look, identity, surface: 'field' as const, colour: colourForSurface('field', look.colour) },
    })),
    { label: 'White', look: { ...look, surface: 'white', colour: 'dark' } },
    { label: 'Tab bar grey', look: { ...look, surface: 'tabbar', colour: 'dark' } },
  ]
  const colours = COLOUR_MODES.map((colour) => ({
    label: COLOUR_LABEL[colour],
    look: { ...look, colour, surface: colour === 'dark' ? ('white' as const) : ('field' as const) },
  }))
  const containers = (['none', 'square', 'card'] as Container[]).map((container) => ({
    label: container === 'none' ? 'No container' : container === 'square' ? 'Rounded square' : 'Card 132:184',
    look: { ...look, container },
  }))
  const strip = (title: string, items: { label: string; look: Look }[]) => (
    <div className="lab-strip">
      <h3 className="t-label">{title}</h3>
      <div className="lab-strip-row">
        {items.map((it) => (
          <Swatch key={it.label} concept={concept} variant={variant} look={it.look} label={it.label} />
        ))}
      </div>
    </div>
  )
  return (
    <section className="lab-section" aria-labelledby="grounds-title">
      <h2 id="grounds-title" className="lab-h2 t-h3">
        Grounds, colours, containers
      </h2>
      {strip('Backgrounds (each field with its accent)', grounds)}
      {strip('Colour', colours)}
      {strip('Container', containers)}
    </section>
  )
}

/* ---------- Browser tab mock ---------- */

export function TabMock({ concept, look }: { concept: Concept; look: Look }) {
  const { site } = useChrome()
  const scheme = (dark: boolean): Look =>
    look.container === 'none'
      ? { ...look, identity: 'ink', surface: dark ? 'field' : 'white', colour: dark ? 'mono' : 'dark' }
      : { ...look, colour: look.colour === 'dark' ? 'dark' : 'mono' }
  return (
    <section className="lab-section" aria-labelledby="tabs-title">
      <h2 id="tabs-title" className="lab-h2 t-h3">
        Browser tab
      </h2>
      <p className="lab-hint">The favicon variant at 16 CSS px beside the page title, in a light and a dark browser.</p>
      <div className="lab-tabs-pair">
        {[false, true].map((dark) => (
          <div key={String(dark)} className="lab-browser" data-scheme={dark ? 'dark' : 'light'}>
            <div className="lab-tabstrip">
              <div className="lab-tab lab-tab-active">
                <span className="lab-tab-icon" style={{ ...stageStyle(scheme(dark)), background: 'transparent' }}>
                  <Mark concept={concept} variant="favicon" container={look.container} size={16} decorative />
                </span>
                <span className="lab-tab-title">{site.name}</span>
                <span className="lab-tab-x" aria-hidden="true">
                  ×
                </span>
              </div>
              <div className="lab-tab">
                <span className="lab-tab-blank" aria-hidden="true" />
                <span className="lab-tab-title">New Tab</span>
              </div>
            </div>
            <div className="lab-urlbar">
              <span>{dark ? 'Dark' : 'Light'} browser</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Lockup ---------- */

/**
 * The wordmark weight whose H stem matches the mark's stroke, at the optical
 * size the wordmark is set in (bilinear in the font's corner masters).
 */
function wordmarkWeight(stemOverCap: number, fontSizePx: number) {
  const opsz = Math.min(96, Math.max(12, fontSizePx))
  const k = (opsz - 12) / 84
  const a = hStem['12-200'] + (hStem['96-200'] - hStem['12-200']) * k
  const b = hStem['12-800'] + (hStem['96-800'] - hStem['12-800']) * k
  const t = (stemOverCap * 660 - a) / (b - a)
  return { wght: Math.round(200 + 600 * Math.min(1, Math.max(0, t))), opsz: Math.round(opsz), clamped: t < 0 || t > 1 }
}

export function Lockup({ concept, variant, look }: { concept: Concept; variant: VariantKey; look: Look }) {
  const { site } = useChrome()
  const [text, setText] = useStored('wordmark', site.wordmark)
  const [size, setSize] = useState(96)
  const id = useId()
  const m = metricsOf(concept, variant)
  const capUnits = m.base - m.cap
  // The mark is `size` px wide; its units scale by size / box width.
  const capPx = (capUnits / m.box.w) * size
  const fontSize = capPx / 0.66
  const w = wordmarkWeight(m.stem / capUnits, fontSize)
  const drop = ((m.box.y + m.box.h - m.base) / m.box.w) * size
  const flat: Look = { ...look, container: 'none' }
  return (
    <section className="lab-section" aria-labelledby="lockup-title">
      <h2 id="lockup-title" className="lab-h2 t-h3">
        Lockup
      </h2>
      <div className="lab-lockup-controls">
        <label className="lab-field">
          <span className="t-label">Wordmark (kept in this browser only)</span>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} maxLength={40} spellCheck={false} />
        </label>
        <label className="lab-field" htmlFor={id}>
          <span className="t-label">Mark size: {size} px</span>
          <input
            id={id}
            type="range"
            min={32}
            max={240}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="lab-scroll">
        <div className="lab-lockup lab-stage-bg" style={stageStyle(flat)}>
          {/* Inline layout: the mark's baseline is its bottom edge, lowered so its own baseline sits on the text's. */}
          <Mark
            concept={concept}
            variant={variant}
            size={size}
            decorative
            className="lab-lockup-mark"
            style={{ verticalAlign: `${-drop}px` }}
          />
          <span
            className="lab-lockup-word"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: w.wght,
              fontVariationSettings: `'opsz' ${w.opsz}`,
              marginLeft: `${capPx * 0.45}px`,
            }}
          >
            {text || site.wordmark}
          </span>
        </div>
      </div>
      <p className="lab-hint">
        Cap heights matched ({Math.round(capPx * 10) / 10} px), baselines aligned. The mark&apos;s stroke is{' '}
        {Math.round((m.stem / capUnits) * 1000) / 10} % of its cap height; the wordmark is set at wght {w.wght}, opsz{' '}
        {w.opsz}, where Bricolage&apos;s stem is the same share
        {w.clamped ? ' (clamped to the weight range)' : ''}.
      </p>
    </section>
  )
}

/* ---------- Downloads ---------- */

export function Downloads({ concept, look }: { concept: Concept; look: Look }) {
  const [status, setStatus] = useState('')
  const stem = fileStem(concept)
  const title = conceptLabel(concept)
  const master = () =>
    toSvgString(buildMark(concept, 'master', look.container), {
      paints: paintsFor(look, 'master'),
      title,
      idPrefix: concept.slug,
    })
  const favicon = () => {
    const paints = paintsFor(look, 'favicon')
    const scheme =
      look.container === 'none'
        ? { light: resolve({ ...look, colour: 'dark' }).neutral, dark: resolve({ ...look, colour: 'mono' }).neutral }
        : { light: paints.neutral, dark: paints.neutral }
    return toSvgString(buildMark(concept, 'favicon', look.container), {
      paints,
      title,
      idPrefix: `${concept.slug}-fav`,
      scheme,
    })
  }
  const png = async (variant: VariantKey, w: number, name: string, opaque = false) => {
    // Apple touch icon: square and opaque, the container colour edge to edge (wide marks fitted by width).
    const c: Container = opaque ? 'square' : look.container
    const h = heightFor(concept, variant, w, c)
    let svg = toSvgString(buildMark(concept, variant, c), {
      paints: paintsFor(look, variant),
      size: { width: w, height: h },
    })
    if (opaque) svg = svg.replace(`rx="${SQUARE_R}"`, 'rx="0"')
    saveBlob(await pngBlob(svg, w, h), name)
    setStatus(`Saved ${name}`)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(master())
      setStatus('SVG code copied')
    } catch {
      setStatus('Copy failed: the browser blocked clipboard access')
    }
  }
  const colourNote = `${COLOUR_LABEL[look.colour]}, ${look.container === 'none' ? 'no container' : look.container}`
  return (
    <section className="lab-section" aria-labelledby="downloads-title">
      <h2 id="downloads-title" className="lab-h2 t-h3">
        Downloads
      </h2>
      <p className="lab-hint">Static final frame with colours baked in for the current choice ({colourNote}).</p>
      <div className="lab-downloads">
        <div className="lab-download-group">
          <h3 className="t-label">SVG</h3>
          <button
            type="button"
            className="lab-button"
            onClick={() => (saveText(master(), `${stem}.svg`), setStatus(`Saved ${stem}.svg`))}
          >
            Master SVG
          </button>
          <button
            type="button"
            className="lab-button"
            onClick={() => (saveText(favicon(), `${stem}-favicon.svg`), setStatus(`Saved ${stem}-favicon.svg`))}
          >
            Favicon SVG
          </button>
          <button type="button" className="lab-button" onClick={copy}>
            Copy SVG code
          </button>
        </div>
        <div className="lab-download-group">
          <h3 className="t-label">PNG, master</h3>
          {LADDER.map((s) => (
            <button key={s} type="button" className="lab-button" onClick={() => png('master', s, `${stem}-${s}.png`)}>
              {s}
            </button>
          ))}
          <button type="button" className="lab-button" onClick={() => png('master', 180, `${stem}-180.png`, true)}>
            180 apple-touch
          </button>
        </div>
        <div className="lab-download-group">
          <h3 className="t-label">PNG, favicon</h3>
          {[16, 24, 32, 48].map((s) => (
            <button
              key={s}
              type="button"
              className="lab-button"
              onClick={() => png('favicon', s, `${stem}-favicon-${s}.png`)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="t-label" role="status">
        {status}
      </p>
    </section>
  )
}
