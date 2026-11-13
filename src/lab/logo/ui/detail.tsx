'use client'

import { useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import type { Identity } from '@/design/palette'
import {
  type Look,
  ACCENT_IDENTITIES,
  ALL_IDENTITIES,
  COLOUR_LABEL,
  COLOUR_MODES,
  cap,
  colourForSurface,
  stageStyle,
} from '../colours'
import { concepts } from '../concepts'
import type { Concept, VariantKey } from '../model'
import { Button, Segmented, Toggle } from './controls'
import { go, hrefFor, useLabSettings } from './logo-lab'
import { Mark } from './mark'
import { type Outcome, usePlayer } from './player'
import { Scorecard } from './scorecard'
import { Downloads, Ladder, Lockup, PixelTrue, Strips, TabMock } from './views'

const nextIdentity = (id: Identity): Identity => {
  const i = ACCENT_IDENTITIES.indexOf(id as (typeof ACCENT_IDENTITIES)[number])
  return ACCENT_IDENTITIES[(i + 1) % ACCENT_IDENTITIES.length]
}

const BACKGROUNDS = [
  ...ALL_IDENTITIES.map((id) => ({ value: id, label: cap(id) })),
  { value: 'white', label: 'White' },
  { value: 'tabbar', label: 'Tab bar' },
]

export function Detail({ concept }: { concept: Concept }) {
  const { tier, speed } = useLabSettings()
  const [look, setLook] = useState<Look>({ identity: 'ink', surface: 'field', colour: 'neutral', container: 'none' })
  const [variant, setVariant] = useState<VariantKey>('master')
  const [alt, setAlt] = useState(false)
  const [looping, setLooping] = useState(false)
  const [loadingOn, setLoadingOn] = useState(false)
  const [status, setStatus] = useState('')

  const player = usePlayer(concept, { tier, speed })

  /** Every look change crossfades the colours that follow it (450 ms). */
  const applyLook = (next: Look) => {
    const before = player.snapshot()
    flushSync(() => setLook(next))
    player.recolour(before)
  }
  const report = (o: Outcome | void, done: string) => setStatus(o && !o.ran ? (o.note ?? '') : done)
  const reset = () => {
    player.stopAll()
    setLooping(false)
    setLoadingOn(false)
  }

  // The reveal plays once when the detail opens.
  useLayoutEffect(() => {
    player.reveal()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Tier changes stop loops (the player snaps to the static mark).
  useLayoutEffect(() => {
    setLooping(false)
    setLoadingOn(false)
  }, [tier])

  const index = concepts.findIndex((c) => c.id === concept.id)
  const prev = concepts[(index - 1 + concepts.length) % concepts.length]
  const next = concepts[(index + 1) % concepts.length]
  const variants = Object.entries(concept.variants) as [VariantKey, { label: string }][]
  const background = look.surface === 'field' ? look.identity : look.surface

  return (
    <>
      <nav className="lab-detail-nav" aria-label="Concepts">
        <a className="link t-label" href={hrefFor(null)} onClick={(e) => (e.preventDefault(), go(null))}>
          ← All concepts
        </a>
        <span className="lab-row">
          <a className="link t-label" href={hrefFor(prev.id)} onClick={(e) => (e.preventDefault(), go(prev.id))}>
            ← {prev.label} {prev.name}
          </a>
          <a className="link t-label" href={hrefFor(next.id)} onClick={(e) => (e.preventDefault(), go(next.id))}>
            {next.label} {next.name} →
          </a>
        </span>
      </nav>

      <section className="lab-section lab-detail-head" aria-labelledby="concept-title">
        <h2 id="concept-title" className="t-h2">
          <span className="lab-num">{concept.label}</span> {concept.name}
        </h2>
        <p className="t-lead lab-idea">{concept.idea}</p>
        <details className="lab-notes-list">
          <summary className="t-label">Design notes</summary>
          <ul>
            {concept.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </details>
      </section>

      <section className="lab-section lab-main" aria-label="Stage and controls">
        <div
          className="lab-stage lab-stage-bg"
          style={stageStyle(look)}
          onPointerEnter={player.hoverIn}
          onPointerLeave={player.hoverOut}
        >
          <Mark
            ref={player.ref}
            concept={concept}
            variant={variant}
            container={look.container}
            className="lab-stage-mark"
          />
        </div>

        <div className="lab-panel">
          <Segmented
            label="Variant"
            value={variant}
            options={variants.map(([k, v]) => ({ value: k, label: v.label }))}
            onChange={(v) => (reset(), setVariant(v as VariantKey))}
          />
          <Segmented
            label="Background"
            value={background}
            options={BACKGROUNDS}
            onChange={(v) => {
              if (v === 'white' || v === 'tabbar')
                applyLook({ ...look, surface: v, colour: colourForSurface(v, look.colour) })
              else
                applyLook({
                  ...look,
                  identity: v as Identity,
                  surface: 'field',
                  colour: colourForSurface('field', look.colour),
                })
            }}
          />
          <Segmented
            label="Colour"
            value={look.colour}
            options={COLOUR_MODES.map((c) => ({ value: c, label: COLOUR_LABEL[c] }))}
            onChange={(v) => applyLook({ ...look, colour: v as Look['colour'] })}
          />
          <Segmented
            label="Container"
            value={look.container}
            options={[
              { value: 'none', label: 'None' },
              { value: 'square', label: 'Rounded square' },
              { value: 'card', label: 'Card' },
            ]}
            onChange={(v) => (reset(), setLook({ ...look, container: v as Look['container'] }))}
          />

          <fieldset className="lab-actions">
            <legend className="t-label">Animation</legend>
            {concept.motion.alt && (
              <Segmented
                label="Reveal"
                value={alt ? 'alt' : 'main'}
                options={[
                  { value: 'main', label: concept.motion.reveal.label },
                  { value: 'alt', label: concept.motion.alt.label },
                ]}
                onChange={(v) => setAlt(v === 'alt')}
              />
            )}
            <div className="lab-row lab-wrap">
              <Button onClick={() => (setLooping(false), report(player.reveal(alt), 'Reveal'))}>Replay</Button>
              <Toggle
                label="Loop"
                checked={looping}
                onChange={(on) => {
                  setLooping(on)
                  if (on) setLoadingOn(false)
                  player.loop(on, alt)
                  setStatus(
                    on
                      ? tier === 'reduced'
                        ? 'Reduced motion: the reveal shows the static mark.'
                        : 'Looping the reveal'
                      : '',
                  )
                }}
              />
              <Button onClick={() => report(player.extra(), concept.motion.extra.label)}>
                {concept.motion.extra.label}
              </Button>
              <Button onClick={() => report(player.glint(), 'Foil glint')}>Foil glint</Button>
              <Button
                onClick={() => {
                  applyLook({ ...look, identity: nextIdentity(look.identity), surface: look.surface })
                  setStatus(`Identity: ${cap(nextIdentity(look.identity))}`)
                }}
              >
                Identity recolour
              </Button>
              <Button
                onClick={() => {
                  player.hoverIn()
                  setTimeout(player.hoverOut, 700 / speed)
                  setStatus(tier === 'reduced' ? 'Reduced motion: no hover movement.' : 'Hover')
                }}
              >
                Hover
              </Button>
              <Toggle
                label="Loading"
                checked={loadingOn}
                onChange={async (on) => {
                  setLoadingOn(on)
                  if (on) setLooping(false)
                  const o = await player.setLoading(on)
                  if (!o.ran) setLoadingOn(false)
                  report(o, on ? 'Loading loop (stops at the end of a cycle)' : '')
                }}
              />
              <Button
                onClick={async () => (setLooping(false), setLoadingOn(false), report(await player.exit(), 'Exit'))}
              >
                Exit
              </Button>
            </div>
            <p className="t-label lab-status" role="status">
              {status}
            </p>
          </fieldset>
        </div>
      </section>

      <Ladder concept={concept} variant={variant} look={look} />
      <PixelTrue concept={concept} variant={variant} look={look} />
      <Strips concept={concept} variant={variant} look={look} />
      <TabMock concept={concept} look={look} />
      <Lockup concept={concept} variant={variant === 'favicon' ? 'master' : variant} look={look} />
      <Downloads concept={concept} look={look} />
      <Scorecard concept={concept} />
    </>
  )
}
