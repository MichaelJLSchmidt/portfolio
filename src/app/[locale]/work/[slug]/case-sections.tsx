import type { ReactNode } from 'react'
import { CareerMatrix, Illustration } from '@/components/illustrations'
import { DealRow, MarginNote, OffsetImage, Section, imageSides } from '@/components/layout'
import { NextProject } from '@/components/next-project'
import { Picture } from '@/components/picture'
import { Reveal } from '@/components/reveals'
import type { IllustrationVariant } from '@/components/illustrations'
import {
  type Artefact,
  type CaseStudy,
  type CaseStudySectionKey,
  type ContentIllustration,
  type IllustrationCopy,
  type Management,
  caseStudySectionKeys,
  getContent,
  pad2,
} from '@/lib/content'
import { cx } from '@/lib/cx'

/*
 * Sections 01 Context … 09 Next of one case study. Every section is its own
 * .spread-grid (Section); blocks inside are placed on the twelve columns:
 *
 *   col-content   columns 4–11 (the reading column)
 *   cols-4-7 / cols-8-11 / cols-8-12 / cols-9-12 / cols-4-11 / cols-4-12 / cols-4-10
 *   col-wide      columns 1–12 (stages, the gallery)
 *   col-full      edge to edge (OffsetImage: anchored to the content column, toward one edge)
 *
 * Every chapter 01–08 opens with its outlined numeral (NumeralBreaker); 09 Next
 * has none. Below 1024 px everything stacks in source order.
 */

type Placement = Partial<Record<CaseStudySectionKey, ContentIllustration>>

/** Section illustrations, where the content puts them (any section may hold one: SectionCopy.illustration). */
function placement(study: CaseStudy): Placement {
  const placed: Placement = {}
  for (const key of caseStudySectionKeys) {
    const section = study.sections[key]
    if ('illustration' in section && section.illustration) placed[key] = section.illustration
  }
  return placed
}

/**
 * Space above each section (S 96 / M 160 / L 240 desktop). Every chapter opens with its numeral,
 * so each gets the large space; the numerals carry the rhythm.
 */
const space: Record<CaseStudySectionKey, 's' | 'm' | 'l'> = {
  context: 'l',
  problem: 'l',
  role: 'l',
  approach: 'l',
  decisions: 'l',
  artefacts: 'l',
  outcomes: 'l',
  differently: 'l',
  next: 'l',
}

/** Words and data for the drawings (the route's locale). */
type Drawings = { copy: IllustrationCopy; growth: Management['growth'] }

/** Data for a drawing in the gallery: the career framework draws Management's levels and dimensions. */
function ArtefactDrawing({
  name,
  titleId,
  drawings,
}: {
  name: ContentIllustration
  titleId: string
  drawings: Drawings
}) {
  if (name === 'CareerMatrix')
    return (
      <CareerMatrix
        titleId={titleId}
        levels={drawings.growth.levels}
        tracks={drawings.growth.dimensions}
        {...drawings.copy.CareerMatrix}
      />
    )
  return <Illustration name={name} titleId={titleId} copy={drawings.copy} />
}

/** Paragraphs (+ the plain list) in one block. */
function Body({ body, list, className }: { body: string[]; list?: string[]; className?: string }) {
  if (body.length === 0 && !list?.length) return null
  return (
    <div className={cx('section-body', className)}>
      {body.map((p, i) => (
        <Reveal key={i} as="p" kind="lines" className="t-body">
          {p}
        </Reveal>
      ))}
      {list && list.length > 0 && (
        <Reveal as="ul" kind="list" className="ruled-list t-body">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </Reveal>
      )}
    </div>
  )
}

const hasBody = (s: { body: string[]; list?: string[] }) => s.body.length > 0 || Boolean(s.list?.length)

/** A section illustration, drawn on when it scrolls in. */
function Figure({
  name,
  id,
  variant,
  className,
  copy,
}: {
  name: ContentIllustration
  id: string
  variant?: IllustrationVariant
  className?: string
  copy: IllustrationCopy
}) {
  return (
    <Reveal as="figure" kind="draw" className={cx('section-figure', className)}>
      <Illustration name={name} titleId={`${id}-illustration-title`} variant={variant} copy={copy} />
    </Reveal>
  )
}

function Note({ children }: { children?: ReactNode }) {
  return children ? <MarginNote>{children}</MarginNote> : null
}

/**
 * Gallery slots: rows of two with unequal spans, alternating 7 + 5 and 4 + 8
 * (never equal thirds). A lone last item keeps its row's asymmetry: 7 wide on
 * the left, or 8 wide pushed right.
 */
function slot(i: number, n: number) {
  const row = Math.floor(i / 2)
  const second = i % 2 === 1
  const lone = !second && i === n - 1
  if (row % 2 === 0) return second ? 'b' : 'a'
  return second || lone ? 'd' : 'c'
}

function Gallery({ items, drawings }: { items: Artefact[]; drawings: Drawings }) {
  return (
    <ul className="artefacts col-wide">
      {items.map((a, k) => (
        <li
          key={`${a.title}-${k}`}
          className="artefact"
          data-slot={slot(k, items.length)}
          data-media={a.image ? 'image' : a.illustration ? 'illustration' : 'none'}
        >
          <figure className="artefact-figure">
            {a.image ? (
              <Reveal kind="image" className="artefact-media" data-media="image">
                <Picture id={a.image} sizes="(min-width: 1024px) 60vw, 92vw" />
              </Reveal>
            ) : a.illustration ? (
              <Reveal kind="draw" className="artefact-media" data-media="illustration">
                <ArtefactDrawing name={a.illustration} titleId={`artefact-${k + 1}-title`} drawings={drawings} />
              </Reveal>
            ) : null}
            {a.image || a.illustration ? (
              <figcaption className="artefact-caption">
                <span className="t-label">
                  <span className="artefact-number">06.{k + 1}</span> {a.title}
                </span>
                {a.caption && <span className="artefact-text t-body">{a.caption}</span>}
              </figcaption>
            ) : (
              // A text card (no image, no drawing): set as a document of its own, never an empty frame.
              <Reveal as="figcaption" kind="block" className="artefact-caption artefact-card">
                <span className="artefact-card-number t-label">06.{k + 1}</span>
                <span className="artefact-card-title t-h3">{a.title}</span>
                {a.caption && <span className="artefact-text t-body">{a.caption}</span>}
              </Reveal>
            )}
          </figure>
        </li>
      ))}
    </ul>
  )
}

/** Sections 01 Context … 09 Next of one case study, on the Spread grid. */
export async function CaseSections({ study }: { study: CaseStudy }) {
  const { site, management, illustrations: copy } = await getContent()
  const drawings: Drawings = { copy, growth: management.growth }
  const s = study.sections
  const fig = placement(study)
  const head = (key: CaseStudySectionKey) => ({
    id: key,
    number: caseStudySectionKeys.indexOf(key) + 1,
    label: s[key].label,
    title: s[key].title,
    space: space[key],
  })

  // Each drawing once per page: an artefact whose drawing a section already shows keeps its tile, without the drawing.
  const shown = new Set(Object.values(fig))
  const gallery = s.artefacts.items.map((a) =>
    a.illustration && shown.has(a.illustration) ? { ...a, illustration: undefined } : a,
  )

  const spreadImage = s.context.image ?? study.heroImage
  const side = imageSides()
  // 02 Problem opens with the case's statement at h2 size (the first problem paragraph when there is none).
  const statement = study.statement ?? s.problem.body[0]
  const problemRest = study.statement ? s.problem.body : s.problem.body.slice(1)

  return (
    <>
      {/* 01 Context: reading column, margin note, then an offset image. */}
      <Section {...head('context')} breaker pin={2}>
        <Body body={s.context.body} list={s.context.list} className="col-content" />
        <Note>{s.context.note}</Note>
        {fig.context && <Figure name={fig.context} id="context" className="cols-4-12" copy={copy} />}
        <OffsetImage image={spreadImage} side={side()} caption={s.context.caption} className="section-image" />
      </Section>

      {/* 02 Problem: the statement set at h2 size; the h2 stays for screen readers. */}
      <Section
        {...head('problem')}
        titleHidden
        lift
        breaker
        pin={1 + (problemRest.length > 0 || s.problem.list?.length ? 1 : 0) + (fig.problem ? 1 : 0)}
      >
        {statement && (
          <Reveal as="p" kind="lines" className="problem-statement t-h2 cols-4-11">
            {statement}
          </Reveal>
        )}
        <Body body={problemRest} list={s.problem.list} className="col-content" />
        <Note>{s.problem.note}</Note>
        {fig.problem && <Figure name={fig.problem} id="problem" className="cols-4-12" copy={copy} />}
      </Section>

      {/* 03 Role: what I owned / what I didn't, two columns. */}
      <Section {...head('role')} breaker pin={1 + (hasBody(s.role) ? 1 : 0) + 1}>
        <Body body={s.role.body} list={s.role.list} className="col-content" />
        <div className="role-col cols-4-7">
          <h3 className="role-head t-label">{site.labels.owned}</h3>
          <Reveal as="ul" kind="list" className="ruled-list t-body">
            {s.role.owned.map((item, k) => (
              <li key={k}>{item}</li>
            ))}
          </Reveal>
        </div>
        <div className="role-col role-col-not row-mate cols-8-11">
          <h3 className="role-head t-label">{site.labels.notOwned}</h3>
          <Reveal as="ul" kind="list" className="ruled-list t-body">
            {s.role.notOwned.map((item, k) => (
              <li key={k}>{item}</li>
            ))}
          </Reveal>
        </div>
        <Note>{s.role.note}</Note>
      </Section>

      {/* 04 Approach: steps on the left, the illustration pinned on the right from 1024. */}
      <Section {...head('approach')} breaker pin={1 + (hasBody(s.approach) ? 1 : 0) + 1}>
        <Body body={s.approach.body} list={s.approach.list} className="col-content" />
        <Reveal as="ol" kind="list" className={cx('approach-steps', fig.approach ? 'cols-4-7' : 'col-content')}>
          {s.approach.steps.map((step, k) => (
            <li key={k} className="approach-step">
              <p className="approach-step-number t-label">{pad2(k + 1)}</p>
              <h3 className="t-h3">{step.title}</h3>
              <p className="t-body">{step.body}</p>
            </li>
          ))}
        </Reveal>
        {/* Both layouts render (variant "auto"): the sticky column from 1024 px is narrow (about
            370–560 px), so detail.css shows the vertical layout there; below 1024 the drawing spans
            the reading column and follows the default (horizontal from 640 px). */}
        {fig.approach && (
          <Figure name={fig.approach} id="approach" className="approach-figure row-mate cols-8-12" copy={copy} />
        )}
        <Note>{s.approach.note}</Note>
      </Section>

      {/* 05 Decisions: the deal stage across all twelve columns. */}
      {/* 05 Decisions: the chapter head rides with the dealt cards in the pinned stage (desktop). */}
      <Section
        {...head('decisions')}
        breaker
        pin={1}
        stage={<DealRow decisions={s.decisions.items} className="col-wide" />}
      >
        <Body body={s.decisions.body} list={s.decisions.list} className={fig.decisions ? 'cols-4-8' : 'col-content'} />
        {fig.decisions && (
          <Figure name={fig.decisions} id="decisions" className="decisions-figure row-mate cols-9-12" copy={copy} />
        )}
        <Note>{s.decisions.note}</Note>
      </Section>

      {/* 06 Artefacts: asymmetric gallery (7 + 5, then 4 + 8). */}
      <Section {...head('artefacts')} breaker pin={1 + (hasBody(s.artefacts) ? 1 : 0)}>
        <Body body={s.artefacts.body} list={s.artefacts.list} className="col-content" />
        <Note>{s.artefacts.note}</Note>
        {gallery.length > 0 && <Gallery items={gallery} drawings={drawings} />}
      </Section>

      {/* 07 Outcomes */}
      <Section
        {...head('outcomes')}
        breaker
        pin={1 + (hasBody(s.outcomes) ? 1 : 0) + (s.outcomes.items?.length ? 1 : 0) + (fig.outcomes ? 1 : 0)}
      >
        <Body body={s.outcomes.body} list={s.outcomes.list} className="col-content" />
        {s.outcomes.items && s.outcomes.items.length > 0 && (
          <Reveal as="ol" kind="list" className="outcome-list col-content">
            {s.outcomes.items.map((item, k) => (
              <li key={k}>
                <span className="outcome-number t-label">{pad2(k + 1)}</span>
                <span className="t-body">{item}</span>
              </li>
            ))}
          </Reveal>
        )}
        <Note>{s.outcomes.note}</Note>
        {fig.outcomes && <Figure name={fig.outcomes} id="outcomes" className="cols-4-12" copy={copy} />}
      </Section>

      {/* 08 What I'd do differently: lead size under a rule in the case accent. */}
      <Section {...head('differently')} breaker pin={3 + (s.differently.items?.length ? 1 : 0)}>
        <Reveal as="hr" kind="rule" className="accent-rule col-content" />
        <div className="differently-body cols-4-10">
          {s.differently.body.map((p, i) => (
            <Reveal key={i} as="p" kind="lines" className="t-lead">
              {p}
            </Reveal>
          ))}
        </div>
        {s.differently.items && s.differently.items.length > 0 && (
          <Reveal as="ul" kind="list" className="ruled-list t-body cols-4-10">
            {s.differently.items.map((item, k) => (
              <li key={k}>{item}</li>
            ))}
          </Reveal>
        )}
        <Note>{s.differently.note}</Note>
      </Section>

      {/* 09 Next: the next card, played from here. */}
      <Section {...head('next')} pin={2}>
        <NextProject current={study.slug} next={s.next.card} className="col-content" />
      </Section>
    </>
  )
}
