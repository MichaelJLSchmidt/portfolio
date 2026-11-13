'use client'

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState, ViewTransition } from 'react'
import { headerHeight } from '@/design/layout'
import { useChrome } from '@/lib/chrome'
import { cardNumber, pad2 } from '@/lib/format'
import type { HandCard } from '@/lib/hand-data'
import { getFlight, useFlight } from '@/motion/flight'
import { table } from '@/motion/table-store'
import { afterReady } from '@/motion/view-transition'
import {
  bandName,
  cardName,
  heroBandShare,
  heroFrameShare,
  heroTitleShare,
  pageEnter,
  pageExit,
  titleName,
} from '@/motion/transitions'
import { PageTitle } from './page-title'
import { Reveal } from './reveals'

type Props = {
  card: HandCard
  /** The h1 (default: the card's title; Management passes "How I lead"). */
  title?: string
  /** Mono label beside the counter, e.g. "Platform · 2024". */
  label: string
  /** Case study summary, or Management's lead. */
  summary: string
  /**
   * What the played card's band becomes: the hero <Picture priority> (never inside an image
   * reveal) or an illustration. Rendered by the server page, so this client component never
   * imports page content (D7).
   */
  media: ReactNode
  /** "image" crops a photo to the frame; "illustration" sets a drawing on the card's field. */
  mediaKind?: 'image' | 'illustration'
}

/*
 * The detail hero continues the played card, in three parts (the view
 * transition's container transform, src/styles/view-transitions.css):
 *
 *   .play-frame         the card's frame grown to the full screen: fixed,
 *                       pointer-events none, the identity's fill with a 1 px
 *                       accent edge (card-<slug>). After a play it dissolves
 *                       (CSS, from the tokenised delay on mount: its
 *                       snapshot in the transition is live, so the fade shows
 *                       through); at rest it is transparent. Back makes it
 *                       materialise again before the page leaves, so the
 *                       card has a frame to shrink into its slot.
 *   [data-hero-target]  the card's band grown into the hero image's frame
 *                       (card-band-<slug>); the frame's colour is the
 *                       identity's, the image fades in once decoded
 *   h1                  the card's title (card-title-<slug>)
 *
 * The band and title carry their names only while the frame is in view
 * (nothing flies in from off screen). On a switch away from this page all
 * three names stand down: its card re-enters its slot instead of morphing
 * back. The label and counter, the summary and the meta pairs are not part
 * of the transition: they reveal on the page (src/motion/reveal.ts) from the
 * transition's start, after the morph has mostly landed.
 *
 *   desktop   counter + label in the index column; frame from column 7 to the
 *             right edge, full height; the display h1 runs onto the frame,
 *             summary below it
 *   mobile    counter + label, frame (content start to the right edge), h1
 *             overlapping the frame's lower edge, summary
 */
export function CaseHero({ card, title = card.title, label, summary, media, mediaKind = 'image' }: Props) {
  const { handCards } = useChrome()
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)
  const standDown = useFlight()?.leaving === card.id
  // Arrived by a play (or a switch, or the history replay of one): the frame dissolves from opaque.
  const [arrival] = useState(() => {
    const intent = table.peekIntent()
    return getFlight()?.id === card.id || intent === 'play' || intent === 'switch' ? 'play' : 'rest'
  })

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [card.id])

  // The hero image fades in once decoded (over the frame's identity colour); listened to through
  // the ref, never an onLoad prop, so React keeps waiting for it before the view transition.
  useLayoutEffect(() => {
    const img = ref.current?.querySelector('img')
    if (!img) return
    const shown = () => (img.dataset.loaded = '')
    if (img.complete && img.naturalWidth > 0) return void shown()
    let live = true
    const onLoad = () =>
      void img
        .decode()
        .catch(() => {})
        .then(() => live && shown())
    img.addEventListener('load', onLoad, { once: true })
    img.addEventListener('error', shown, { once: true })
    return () => {
      live = false
      img.removeEventListener('load', onLoad)
      img.removeEventListener('error', shown)
    }
  }, [])

  // The frame's dissolve (CSS, delays from mount) is anchored to the view transition's start, V:
  // a CSS animation only starts once the compositor picks it up, which a busy first frame of the
  // transition can delay; with its start time set to V it keeps the tokenised timing regardless.
  const frame = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (arrival !== 'play') return
    afterReady(() => {
      const dissolve = frame.current
        ?.getAnimations()
        .find((a) => (a as CSSAnimation).animationName === 'play-frame-out')
      if (dissolve) dissolve.startTime = document.timeline.currentTime
    })
  }, [arrival])

  const named = !standDown
  return (
    <header className="case-hero spread-grid" data-identity={card.identity} data-media={mediaKind}>
      <ViewTransition
        name={named ? cardName(card.id) : undefined}
        share={heroFrameShare}
        enter="none"
        exit="none"
        default="none"
      >
        <div ref={frame} className="play-frame" data-arrival={arrival} aria-hidden="true" />
      </ViewTransition>
      <Reveal as="p" kind="block" step="label" className="case-hero-meta t-label">
        <span className="case-hero-counter">
          <span className="case-hero-index">{cardNumber(card.index)}</span> / {pad2(handCards.length)}
        </span>
        <span className="case-hero-label">{label}</span>
      </Reveal>
      <ViewTransition
        name={inView && named ? bandName(card.id) : undefined}
        share={heroBandShare}
        enter={pageEnter}
        exit={pageExit}
      >
        <div ref={ref} className="case-hero-frame" data-hero-target="">
          {media}
        </div>
      </ViewTransition>
      <div className="case-hero-text">
        <ViewTransition
          name={inView && named ? titleName(card.id) : undefined}
          share={heroTitleShare}
          enter="none"
          exit="none"
          default="none"
        >
          <PageTitle className="case-hero-title t-display">{title}</PageTitle>
        </ViewTransition>
        <Reveal as="p" kind="block" step="summary" className="case-hero-summary t-lead">
          {summary}
        </Reveal>
      </div>
    </header>
  )
}
