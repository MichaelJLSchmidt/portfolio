import type { CSSProperties } from 'react'
import { Reveal } from '@/components/reveals'
import type { About, CareerLane, CareerStop } from '@/lib/content'
import { ThesisStop } from './thesis-stop'

type Timeline = About['timeline']

/*
 * About's career timeline (R7): two lanes, work and education, as cards on the
 * table. One chronological <ol aria-label> (its label is the section's) whose
 * items carry their lane as text ("Work: …"), their title and place, and their
 * years as <time>; an overlap with the other lane is also said in words. CSS
 * grid places everything on shared year tracks (src/styles/pages/pages.css):
 *
 *   >= 1024  a horizontal year axis (2004 to today, a tick every two years),
 *            Work above and Education below; each card as wide as its years
 *            (at least as wide as its title's longest word)
 *   <  1024  a vertical axis on the left, two narrow lanes side by side; each
 *            card about 28 px per year tall, at least 72 px
 *
 * The apprenticeship is one card across both lanes with a quiet seam between
 * its halves. Overlaps get a faint shared band across both lanes in the glacier
 * tint and a small "alongside" label. The Master's card links to the thesis
 * (ThesisStop: the card -> hero morph). The cards are dealt in order from a
 * deck at the start of the axis (the deal reveal, --deal-mode: deck).
 */

const endOf = (s: CareerStop, today: number) => (s.to === 'today' ? today : s.to)

/** Overlapping years between a work and an education stop: [from, to) bands. */
function overlaps(items: CareerStop[], today: number) {
  const bands: { from: number; to: number }[] = []
  for (const w of items.filter((s) => s.lane === 'work'))
    for (const e of items.filter((s) => s.lane === 'education')) {
      const from = Math.max(w.from, e.from)
      const to = Math.min(endOf(w, today), endOf(e, today))
      if (to > from) bands.push({ from, to })
    }
  return bands
}

export function Years({ stop, today }: { stop: CareerStop; today: string }) {
  return (
    <span className="career-years">
      <time dateTime={String(stop.from)}>{stop.from}</time>–
      {stop.to === 'today' ? today : <time dateTime={String(stop.to)}>{stop.to}</time>}
    </span>
  )
}

export function StopBody({ stop, timeline }: { stop: CareerStop; timeline: Timeline }) {
  const laneLabel = stop.lane === 'both' ? timeline.both : timeline.lanes[stop.lane]
  return (
    <>
      <span className="sr-only">{laneLabel}: </span>
      <Years stop={stop} today={timeline.today} />
      <span className="career-title">{stop.title}</span>
      {stop.parts ? (
        <span className="career-parts">
          {(['work', 'education'] as CareerLane[]).map((lane) => (
            <span key={lane} className="career-part" data-lane={lane}>
              <span className="sr-only">{timeline.lanes[lane]}: </span>
              <span className="career-part-title">{stop.parts![lane].title}</span>
              {stop.parts![lane].place && <span className="career-place">{stop.parts![lane].place}</span>}
            </span>
          ))}
        </span>
      ) : (
        stop.place && <span className="career-place">{stop.place}</span>
      )}
      {stop.alongside && <span className="sr-only"> {stop.alongside}</span>}
    </>
  )
}

export function CareerTimeline({ timeline, label }: { timeline: Timeline; label: string }) {
  const items = timeline.items
  const start = Math.min(...items.map((s) => s.from))
  // "today": the end of the year the site was built in.
  const today = new Date().getFullYear() + 1
  const years = today - start
  const ticks = Array.from({ length: Math.ceil(years / 2) }, (_, i) => start + i * 2)
  // The year tracks start at grid line 2 (the first track holds the lane labels / the axis).
  const place = (from: number, to: number) =>
    ({ '--track': `${from - start + 2} / span ${to - from}` }) as CSSProperties
  const latest = items.findIndex((s) => s.to === 'today')
  return (
    <div className="career col-wide" style={{ '--years': years } as CSSProperties}>
      <p className="career-lane-label t-label" data-lane="work" aria-hidden="true">
        {timeline.lanes.work}
      </p>
      <p className="career-lane-label t-label" data-lane="education" aria-hidden="true">
        {timeline.lanes.education}
      </p>
      {overlaps(items, today).map((b) => (
        <span key={b.from} className="career-band" style={place(b.from, b.to)} aria-hidden="true">
          <span className="career-band-label t-label">{timeline.alongside}</span>
        </span>
      ))}
      <Reveal as="ol" kind="deal" className="career-stops" aria-label={label}>
        {items.map((stop, i) => {
          const props = {
            className: 'career-stop about-card',
            'data-lane': stop.lane,
            'data-deal-item': '',
            'data-latest': i === latest ? '' : undefined,
            style: place(stop.from, endOf(stop, today)),
          }
          return stop.thesis ? (
            <ThesisStop key={i} {...props} linkLabel={timeline.thesisLink}>
              <StopBody stop={stop} timeline={timeline} />
            </ThesisStop>
          ) : (
            <li key={i} {...props}>
              <StopBody stop={stop} timeline={timeline} />
            </li>
          )
        })}
      </Reveal>
      <ol className="career-axis" aria-hidden="true">
        {ticks.map((y) => (
          <li key={y} className="career-tick t-label" style={place(y, Math.min(y + 2, today))}>
            {y}
          </li>
        ))}
      </ol>
    </div>
  )
}
