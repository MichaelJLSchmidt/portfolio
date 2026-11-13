import type { CSSProperties } from 'react'
import { contentFor } from '@/lib/content'
import { CardBack, CardFace } from '@/components/hand/card-face'
import { OnTheTable } from '@/eggs/on-the-table'
import { WorkshopDraw } from '@/eggs/workshop-draw'
import { buildChrome } from '@/lib/hand-data'
import { cardPlay, hand } from '@/motion/tokens'
import { lineIn, readSource, usages } from '../../source'
import { type ItemData, type SectionData, code } from '../ui'

const FACE = 'src/components/hand/card-face.tsx'

/** --card-radius as the hand declares it (hand.css), for faces shown outside the hand. */
const cardRadius = () =>
  /\.hand \{[^}]*--card-radius:\s*([^;]+);/.exec(readSource('src/styles/hand.css'))?.[1] ?? '10px'

/** A card face in a box of `w` x `h` px: the face sizes itself with container query units. */
function Box({ w, h, children, label }: { w: number; h: number; children: React.ReactNode; label: string }) {
  return (
    <span className="inv-card-size">
      <span className="inv-card" style={{ width: w, height: h, '--card-radius': cardRadius() } as CSSProperties}>
        {children}
      </span>
      <span className="inv-k">{label}</span>
    </span>
  )
}

export function cardsSection(): SectionData {
  const en = contentFor('en')
  const chrome = buildChrome({ locale: 'en', site: en.site, hand: en.hand, coffeeEgg: en.coffeeEgg })
  const table = cardPlay.play.card
  const sizes = [
    { w: hand.card.w, h: hand.card.h, label: `hand ${hand.card.w}×${hand.card.h}` },
    { w: hand.cardSm.w, h: hand.cardSm.h, label: `phone ${hand.cardSm.w}×${hand.cardSm.h}` },
    { w: table.w, h: table.h, label: `table ${table.w}×${table.h}` },
  ]
  const faceUse = usages({ jsx: ['CardFace'], classes: ['card-face'], except: [FACE] })
  const faces: ItemData[] = chrome.handCards.map((card) => ({
    id: `card.face.${card.id}`,
    title: card.title,
    render: (
      <span className="inv-cards">
        {sizes.map((s) => (
          <Box key={s.label} {...s}>
            <CardFace card={card} named={false} />
          </Box>
        ))}
      </span>
    ),
    values: [
      ['identity', code(`identity.${card.identity}`)],
      ['index', String(card.index + 1)],
      ['sizes', sizes.map((s) => s.label).join(' · ')],
      ['parts', 'index and years, the band (title, type) on glow, summary, facts; tap line on the long edge'],
    ],
    source: [
      { file: FACE, line: lineIn(FACE, 'export function CardFace'), name: 'CardFace' },
      { file: 'content/en/hand.ts', name: `hand.cards['${card.id}']` },
      { file: 'src/styles/hand.css', line: lineIn('src/styles/hand.css', '.card-face {'), name: '.card-face' },
    ],
    usage: faceUse,
  }))
  const back: ItemData = {
    id: 'card.back',
    title: 'Card back',
    render: (
      <span className="inv-cards">
        {sizes.slice(0, 2).map((s) => (
          <Box key={s.label} {...s}>
            <CardBack />
          </Box>
        ))}
      </span>
    ),
    values: [['parts', 'fine diagonal lines on ink mid, a thin inner frame, a small two-card mark']],
    source: [
      { file: FACE, line: lineIn(FACE, 'export function CardBack'), name: 'CardBack' },
      { file: 'src/styles/hand.css', line: lineIn('src/styles/hand.css', '.card-back {'), name: '.card-back' },
    ],
    usage: usages({ jsx: ['CardBack'], classes: ['card-back'], except: [FACE] }),
  }
  const about = en.about.onTheTable
  const table5: ItemData = {
    id: 'card.on-the-table',
    title: 'About: what’s on the table',
    render: (
      <OnTheTable title={about.title} items={about.items} flipped={en.site.eggs.tableFlipped} titleId="inv-on-table" />
    ),
    values: [['cards', `${about.items.length} face down; a tap turns one`]],
    source: {
      file: 'src/eggs/on-the-table.tsx',
      line: lineIn('src/eggs/on-the-table.tsx', 'export function OnTheTable'),
      name: 'OnTheTable',
    },
    usage: usages({ jsx: ['OnTheTable'] }),
  }
  const w = en.workshopMethods
  const draw: ItemData = {
    id: 'card.workshop-draw',
    title: 'Management: draw a method',
    render: (
      <WorkshopDraw button={en.management.workshops.drawButton} again={w.again} drawn={w.drawn} methods={w.methods} />
    ),
    values: [['flip', 'a card turns over (3D) to a random method; reduced: an instant swap']],
    source: {
      file: 'src/eggs/workshop-draw.tsx',
      line: lineIn('src/eggs/workshop-draw.tsx', 'export function WorkshopDraw'),
      name: 'WorkshopDraw',
    },
    usage: usages({ jsx: ['WorkshopDraw'] }),
  }
  return {
    id: 'cards',
    title: 'Card faces',
    intro: (
      <>
        The hand&rsquo;s four cards from the English hand content, rendered with <code>CardFace</code> at the
        hand&rsquo;s, the phone&rsquo;s and the table&rsquo;s size (the face scales with its box), the card back, and
        the cards the eggs deal.
      </>
    ),
    groups: [
      { title: 'Faces', items: faces, layout: 'wide' },
      { title: 'Back and egg cards', items: [back, table5, draw], layout: 'wide' },
    ],
    unrendered: [
      {
        what: 'The Coffee card',
        why: 'is markup inside the hand (dealt by typing “draw” on home), not a component: try it from the Lab overview.',
        source: {
          file: 'src/components/hand/hand.tsx',
          line: lineIn('src/components/hand/hand.tsx', 'hand-coffee'),
          name: '.hand-coffee',
        },
      },
      {
        what: 'The rail card and the “Viewing” ghost',
        why: 'are the hand’s own markup on phones and for the open card; the hand is hidden on lab pages, see any page.',
        source: {
          file: 'src/components/hand/hand.tsx',
          line: lineIn('src/components/hand/hand.tsx', 'rail-card'),
          name: '.rail-card, .hand-ghost',
        },
      },
      {
        what: 'The card on the table and the next-project card',
        why: 'exist only during a play and at the end of a detail page (they play their card when clicked); their face is the CardFace above.',
        source: { file: 'src/components/hand/table-card.tsx', name: 'TableCard, NextProject' },
      },
    ],
  }
}
