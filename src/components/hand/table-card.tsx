'use client'

import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { HandCard } from '@/lib/hand-data'
import type { Flight } from '@/motion/flight'
import { runFlight } from '@/motion/play'
import { CardFace } from './card-face'

/*
 * The played card on its way to the table (stage 1 of a play): a fixed clone
 * of the card face, a portal on <body>, decorative (aria-hidden; the link the
 * visitor chose keeps the meaning). It is laid out at the table size where it
 * will land (cardPlay.*.card, .landing) and FLIP-inverted to the slot it
 * leaves, so its transform is identity on landing and the view transition
 * snapshots it at full size: the title stays sharp through the morph.
 *
 * Four nested layers carry one channel each, so every channel has its own
 * curve and all of them run as compositor animations (Motion's WAAPI
 * animate): x, y (the two together draw the arc), the pose (rotation and the
 * fan's tilt) and the scale (press, lift, rise, drop). The shadows are opacity
 * layers inside the named frame, so its snapshot keeps the contact shadow.
 * The hand stops rendering it when the route changes: it unmounts in the same
 * commit as the page mounts, which is what pairs its names with the page's.
 * While it flies it takes touches: a second tap is the Tap egg's double tap.
 */
export function TableCard({ flight, card, onTap }: { flight: Flight; card: HandCard; onTap: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => runFlight(ref.current!, flight), [flight])
  return createPortal(
    <div
      ref={ref}
      className="table-card"
      data-identity={card.identity}
      data-from={flight.from}
      aria-hidden="true"
      // The Tap egg by touch: a second tap on the card while it flies calls the play off.
      onPointerDown={(e) => e.pointerType === 'touch' && !ref.current?.hasAttribute('data-landed') && onTap()}
    >
      <div className="table-card-layer" data-layer="x">
        <div className="table-card-layer" data-layer="y">
          <div className="table-card-layer" data-layer="pose">
            <div className="table-card-layer" data-layer="scale">
              <CardFace
                card={card}
                layers={
                  <>
                    <span className="table-card-shadow" data-layer="lifted" />
                    <span className="table-card-shadow" data-layer="contact" />
                    <span className="table-card-shadow" data-layer="spread" />
                  </>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
