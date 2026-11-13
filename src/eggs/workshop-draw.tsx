'use client'

import { useRef, useState } from 'react'
import { announce } from '@/components/live-region'
import { fill } from '@/lib/format'
import { deal, spring, springCss } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import { buzz } from './haptics'

const flip = springCss(spring.play)

type Props = {
  /** Button label (management.workshops.drawButton). */
  button: string
  /** Label once a method is drawn (workshopMethods.again). */
  again: string
  /** Announcement template, "Workshop method: {title}. {howTo}" (workshopMethods.drawn). */
  drawn: string
  methods: { title: string; howTo: string }[]
}

/** Management: the draw button (management.workshops.drawButton) turns a card over to a random method. Copy comes in as props. */
export function WorkshopDraw({ button, again, drawn, methods }: Props) {
  const [index, setIndex] = useState<number | null>(null)
  const card = useRef<HTMLDivElement>(null)

  const draw = () => {
    let next = Math.floor(Math.random() * methods.length)
    if (next === index) next = (next + 1) % methods.length
    const method = methods[next]
    const tier = readTier()
    const el = card.current!
    buzz(8)
    if (tier === 'full') {
      el.animate(
        [
          { transform: `perspective(${deal.flipPerspective}px) rotateY(180deg)` },
          { transform: `perspective(${deal.flipPerspective}px) rotateY(0deg)` },
        ],
        {
          duration: flip.duration * 1000,
          easing: flip.easing,
        },
      )
    }
    setIndex(next)
    announce(fill(drawn, { title: method.title, howTo: method.howTo }))
  }

  const method = index === null ? null : methods[index]
  return (
    <section className="workshop" aria-label={button}>
      <div ref={card} className="workshop-card" data-drawn={method ? '' : undefined}>
        <div className="workshop-face workshop-back card-back" aria-hidden="true" />
        <div className="workshop-face workshop-front" data-identity="saffron">
          {method && (
            <>
              <p className="workshop-title">{method.title}</p>
              <p className="workshop-howto">{method.howTo}</p>
            </>
          )}
        </div>
      </div>
      <button type="button" className="button" onClick={draw}>
        {method ? again : button}
      </button>
    </section>
  )
}
