'use client'

import Link from 'next/link'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState, ViewTransition } from 'react'
import { useChrome } from '@/lib/chrome'
import { PLAY, pageEnter, pageExit, thesisName, thesisShare } from '@/motion/transitions'

type Props = {
  className: string
  style: CSSProperties
  linkLabel: string
  children: ReactNode
  'data-lane': string
  'data-deal-item': string
  'data-latest'?: string
}

/*
 * The Master's card in About's timeline: a link to the thesis page ("Thesis
 * overview", the card's visible link, a standalone text link on the inner span;
 * the whole card is its target, so hovering the card draws the line). The card
 * and the thesis hero share a view-transition name (thesisName), so the card
 * zooms into the hero (type play) and the hero goes back into the card on the
 * way back (its share map times the return), like a hand card and its case.
 * Only while the card is in view: from the projects link (the card scrolled
 * away) the page simply changes, nothing flies in from off screen.
 */
export function ThesisStop({ linkLabel, children, ...li }: Props) {
  const { href } = useChrome()
  const ref = useRef<HTMLLIElement>(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])
  return (
    <ViewTransition name={inView ? thesisName : undefined} share={thesisShare} enter={pageEnter} exit={pageExit}>
      <li ref={ref} {...li} data-thesis="">
        {children}
        <Link className="career-thesis-link" href={href('/about/thesis')} transitionTypes={[PLAY]}>
          <span className="link link-standalone">{linkLabel}</span>
        </Link>
      </li>
    </ViewTransition>
  )
}
