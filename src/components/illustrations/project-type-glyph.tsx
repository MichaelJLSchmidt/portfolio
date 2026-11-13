import type { ReactNode } from 'react'
import { Group, IllustrationFrame } from './frame'
import { roundRect, space } from './geometry'
import type { ProjectType, ProjectTypeGlyphProps } from './types'

const titles: Record<ProjectType, string> = {
  form: 'Form',
  map: 'Map',
  dashboard: 'Dashboard',
  portal: 'Portal',
  calendar: 'Calendar',
  checklist: 'Checklist',
}

const descs: Record<ProjectType, string> = {
  form: 'A page with two input fields and a button.',
  map: 'A folded map with a location pin.',
  dashboard: 'A panel with three bars of different heights.',
  portal: 'A window with an open doorway in it.',
  calendar: 'A calendar page with one day marked.',
  checklist: 'A list of three rows, the first two ticked.',
}

const S = space(48, 48)

/** Each glyph on a 48 grid: [outline, details]. Shapes keep ≥ 4 units of air at 20–32 px. */
const glyphs: Record<ProjectType, [ReactNode, ReactNode]> = {
  form: [
    <path key="o" d={roundRect(9, 5, 30, 38, 3)} pathLength="1" data-draw="" />,
    <>
      <path d={roundRect(14, 12, 20, 6, 1.5)} pathLength="1" data-draw="" />
      <path d={roundRect(14, 22, 20, 6, 1.5)} pathLength="1" data-draw="" />
      <path d="M14 35H24" pathLength="1" data-draw="" />
    </>,
  ],
  map: [
    <path key="o" d="M5 12L17 8L31 12L43 8V36L31 40L17 36L5 40Z" pathLength="1" data-draw="" />,
    <>
      <path d="M17 8V36M31 12V40" className="il-faint" pathLength="1" data-draw="" />
      <path d="M24 30C24 30 19 24.5 19 21.5A5 5 0 0 1 29 21.5C29 24.5 24 30 24 30Z" pathLength="1" data-draw="" />
    </>,
  ],
  dashboard: [
    <path key="o" d={roundRect(5, 8, 38, 32, 3)} pathLength="1" data-draw="" />,
    <>
      <path d="M14 33V25M22 33V16M30 33V21" pathLength="1" data-draw="" />
      <path d="M11 33H37" className="il-faint" pathLength="1" data-draw="" />
    </>,
  ],
  portal: [
    <path key="o" d={roundRect(5, 7, 38, 34, 3)} pathLength="1" data-draw="" />,
    <>
      <path d="M5 15H43" pathLength="1" data-draw="" />
      <path d="M19 41V29A5 5 0 0 1 29 29V41" pathLength="1" data-draw="" />
    </>,
  ],
  calendar: [
    <path key="o" d={roundRect(7, 10, 34, 32, 3)} pathLength="1" data-draw="" />,
    <>
      <path d="M7 18H41M16 6V13M32 6V13" pathLength="1" data-draw="" />
      <path d={roundRect(27, 27, 7, 7, 1.5)} data-draw-fill="" />
      <path d={roundRect(27, 27, 7, 7, 1.5)} pathLength="1" data-draw="" />
    </>,
  ],
  checklist: [
    <path key="o" d="M21 12H41M21 24H41M21 36H35" pathLength="1" data-draw="" />,
    <>
      <path d={roundRect(7, 8, 8, 8, 1.5)} pathLength="1" data-draw="" />
      <path d={roundRect(7, 20, 8, 8, 1.5)} pathLength="1" data-draw="" />
      <path d={roundRect(7, 32, 8, 8, 1.5)} pathLength="1" data-draw="" />
      <path d="M9 12L10.8 13.8L14 9.5M9 24L10.8 25.8L14 21.5" pathLength="1" data-draw="" />
    </>,
  ],
}

/**
 * Project types (not placed: About's projects are a plain list): one small glyph per project type, 48×48, meant for 20–32 px (one per row; the
 * Layout session draws it on row hover / focus). Groups: 1 outline, 2 details.
 */
export function ProjectTypeGlyph({ type, className, titleId, title, description }: ProjectTypeGlyphProps) {
  const [outline, details] = glyphs[type]
  return (
    <IllustrationFrame
      slug="project-type-glyph"
      viewBox={S}
      title={title ?? titles[type]}
      desc={description ?? descs[type]}
      className={className}
      titleId={titleId}
    >
      <Group n={1}>{outline}</Group>
      <Group n={2}>{details}</Group>
    </IllustrationFrame>
  )
}
