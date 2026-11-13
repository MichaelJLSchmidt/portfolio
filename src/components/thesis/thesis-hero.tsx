'use client'

import { type ReactNode, useEffect, useRef, useState, ViewTransition } from 'react'
import { PageTitle } from '@/components/page-title'
import { Reveal } from '@/components/reveals'
import { headerHeight } from '@/design/layout'
import { pageEnter, pageExit, thesisName, thesisShare } from '@/motion/transitions'

type Props = {
  eyebrow: string
  title: string
  subtitle: string
  /** The frame's face: the Master's card from About's timeline, grown (rendered by the server page). */
  card: ReactNode
}

/*
 * The thesis overview's hero, the case-study hero's layout (detail.css .case-hero): the eyebrow,
 * the frame sliding off the right edge, the display h1 running onto it, the subtitle. The frame is
 * About's Master's card grown: it carries the shared view-transition name (thesisName) while it is
 * in view, so the timeline card zooms into it and it goes back into the card on the way back. Once
 * it has scrolled away nothing carries the name (no morph from off screen).
 */
export function ThesisHero({ eyebrow, title, subtitle, card }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return (
    <header className="case-hero thesis-hero spread-grid" data-identity="glacier" data-media="illustration">
      <Reveal as="p" kind="block" step="label" className="case-hero-meta t-label">
        <span className="case-hero-label">{eyebrow}</span>
      </Reveal>
      <ViewTransition name={inView ? thesisName : undefined} share={thesisShare} enter={pageEnter} exit={pageExit}>
        <div ref={ref} className="case-hero-frame" data-hero-target="">
          {card}
        </div>
      </ViewTransition>
      <div className="case-hero-text">
        <PageTitle className="case-hero-title t-display">{title}</PageTitle>
        <Reveal as="p" kind="lines" step="summary" className="case-hero-summary t-lead">
          {subtitle}
        </Reveal>
      </div>
    </header>
  )
}
