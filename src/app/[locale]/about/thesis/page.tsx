import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  BurnoutProcess,
  PrototypeFunctions,
  ResearchSequence,
  StakeholderMap,
  TestIterations,
} from '@/components/illustrations/thesis'
import { MetaPairs, Minimap, Scoreboard, Section, imageSides } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { ImageSlot } from '@/components/thesis/image-slot'
import { ThesisHero } from '@/components/thesis/thesis-hero'
import { type Paragraph, type ThesisChapterKey, contentFor, getContent, pad2, thesisChapterKeys } from '@/lib/content'
import { pageAlternates } from '@/lib/metadata'
import { asLocale, setRequestLocale } from '@/lib/request-locale'
import { RETURN } from '@/motion/transitions'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const t = contentFor(locale).thesis
  return { title: t.title, description: t.subtitle, alternates: pageAlternates(locale, '/about/thesis') }
}

/** A chapter's running text: lines reveals in the reading column. */
function Body({ body }: { body: Paragraph[] }) {
  if (!body.length) return null
  return (
    <div className="section-body col-content">
      {body.map((p, i) => (
        <Reveal key={i} as="p" kind="lines" className="t-body">
          {p}
        </Reveal>
      ))}
    </div>
  )
}

/** A chapter's lead: the three-minute layer (one paragraph at lead size). */
function Lead({ children }: { children: Paragraph }) {
  return (
    <Reveal as="p" kind="lines" className="thesis-lead t-lead col-content">
      {children}
    </Reveal>
  )
}

/** A drawing in the reading column, drawn on reveal. */
function Figure({ children }: { children: ReactNode }) {
  return (
    <Reveal as="figure" kind="draw" className="thesis-figure col-content">
      {children}
    </Reveal>
  )
}

/*
 * The master's thesis overview (R8): glacier, over the table field in the glacier tint (not the
 * contour map), in the case-study template. Three reading layers:
 *   30 s    the hero (eyebrow, title, subtitle), the one-line answer, the meta pairs and the
 *           scoreboard
 *   3 min   every chapter's lead and the dealt row of four insights
 *   7 min   the chapters in full, with five drawings and the screenshot slots
 * Chapters 01–08 open with their drawn numerals; the page ends with the conclusions, the
 * reflection on the method and a link back to About's timeline. Reached from the Master's card in
 * About's timeline (the card -> hero morph) and from About's projects chapter. The author is not
 * named and the company stays anonymous.
 */
export default async function ThesisPage({ params }: Props) {
  setRequestLocale((await params).locale)
  const { thesis: t, about, site, href } = await getContent()
  const c = t.chapters
  const stop = about.timeline.items.find((s) => s.thesis)!
  const head = (key: ThesisChapterKey) => ({
    id: key,
    number: thesisChapterKeys.indexOf(key) + 1,
    label: c[key].label,
    title: c[key].title,
    space: 'l' as const,
    breaker: true,
  })
  const side = imageSides()
  const sections = thesisChapterKeys.map((key) => ({ id: key, label: c[key].label }))
  return (
    <PageTransition>
      <article className="detail-page thesis-page" data-identity="glacier" data-detail="thesis">
        <ThesisHero
          eyebrow={t.eyebrow}
          title={t.title}
          subtitle={t.subtitle}
          card={
            <div className="case-hero-art thesis-hero-card" aria-hidden="true">
              <span className="thesis-hero-years t-label">
                {stop.from}–{stop.to}
              </span>
              <span className="thesis-hero-name">{stop.title}</span>
              <span className="thesis-hero-place">{stop.place}</span>
            </div>
          }
        />

        {/* The 30-second layer: the answer in one line, then the facts. */}
        <div className="detail-facts spread-grid">
          <Reveal as="div" kind="block" className="thesis-answer col-content">
            <p className="thesis-answer-label t-label">{t.answer.label}</p>
            <p className="thesis-answer-text t-lead">{t.answer.text}</p>
          </Reveal>
          <MetaPairs items={t.meta} label={site.labels.facts} className="col-wide" />
          <Scoreboard metrics={t.scoreboard} className="col-wide thesis-scoreboard" />
        </div>

        {/* 01 The question */}
        <Section {...head('question')} pin={3}>
          <Lead>{c.question.lead}</Lead>
          <Body body={c.question.body} />
          <dl className="thesis-questions col-content">
            {c.question.questions.map((q) => (
              <Reveal key={q.label} as="div" kind="pair" className="thesis-question">
                <span className="thesis-rule" aria-hidden="true" data-pair-rule="" />
                <dt className="t-label" data-pair-part="">
                  {q.label}
                </dt>
                <dd className="t-h3" data-pair-part="">
                  {q.text}
                </dd>
              </Reveal>
            ))}
          </dl>
        </Section>

        {/* 02 Context */}
        <Section {...head('context')} pin={2}>
          <Lead>{c.context.lead}</Lead>
          <Body body={c.context.body} />
        </Section>

        {/* 03 Approach: drawing (a), the explanatory sequential design. */}
        <Section {...head('approach')} pin={3}>
          <Lead>{c.approach.lead}</Lead>
          <Body body={c.approach.body} />
          <Figure>
            <ResearchSequence copy={t.drawings.sequence} />
          </Figure>
        </Section>

        {/* 04 What the survey showed */}
        <Section {...head('survey')} pin={2}>
          <Lead>{c.survey.lead}</Lead>
          <Body body={c.survey.body} />
        </Section>

        {/* 05 Key insights: the dealt row of four (the three-minute layer), then drawing (b). */}
        <Section {...head('insights')} pin={4}>
          <Lead>{c.insights.lead}</Lead>
          <Reveal as="ul" kind="deal" className="how-cards thesis-insights col-wide">
            {c.insights.cards.map((card, i) => (
              <li key={card.title} className="how-card about-card" data-deal-item="">
                <span className="how-number about-card-label">{pad2(i + 1)}</span>
                <h3 className="how-title">{card.title}</h3>
                <p className="how-body t-body">{card.body}</p>
              </li>
            ))}
          </Reveal>
          <Body body={c.insights.body} />
          <Figure>
            <BurnoutProcess copy={t.drawings.burnout} />
          </Figure>
        </Section>

        {/* 06 The prototype: drawings (c) and (d), two screenshot slots. */}
        <Section {...head('prototype')} pin={2}>
          <Lead>{c.prototype.lead}</Lead>
          <Body body={c.prototype.body.slice(0, 1)} />
          <Figure>
            <StakeholderMap copy={t.drawings.stakeholders} />
          </Figure>
          <Body body={c.prototype.body.slice(1)} />
          <Figure>
            <PrototypeFunctions copy={t.drawings.functions} />
          </Figure>
          {/* TODO(owner): replace with the prototype screenshot of the knowledge base (an OffsetImage). */}
          <ImageSlot label={t.slots.knowledgeBase} side={side()} className="section-image" />
          {/* TODO(owner): replace with the prototype screenshot of the check-in (an OffsetImage). */}
          <ImageSlot label={t.slots.checkIn} side={side()} className="section-image" />
        </Section>

        {/* 07 Testing: drawing (e), one screenshot slot. */}
        <Section {...head('testing')} pin={2}>
          <Lead>{c.testing.lead}</Lead>
          <Body body={c.testing.body} />
          <Figure>
            <TestIterations copy={t.drawings.tests} />
          </Figure>
          {/* TODO(owner): replace with the screenshot of the clearer source labels, round 2 (an OffsetImage). */}
          <ImageSlot label={t.slots.sources} side={side()} className="section-image" />
        </Section>

        {/* 08 Conclusions and reflection, then back to About's timeline. */}
        <Section {...head('conclusions')} pin={4}>
          <Lead>{c.conclusions.lead}</Lead>
          <dl className="thesis-answers col-content">
            {c.conclusions.answers.map((a) => (
              <Reveal key={a.label} as="div" kind="pair" className="thesis-question">
                <span className="thesis-rule" aria-hidden="true" data-pair-rule="" />
                <dt className="t-label" data-pair-part="">
                  {a.label}
                </dt>
                <dd className="t-body" data-pair-part="">
                  {a.body}
                </dd>
              </Reveal>
            ))}
          </dl>
          <div className="thesis-next col-content">
            <h3 className="t-label">{c.conclusions.nextLabel}</h3>
            <Reveal as="ul" kind="list" className="thesis-next-list">
              {c.conclusions.next.map((n) => (
                <li key={n} className="t-body">
                  {n}
                </li>
              ))}
            </Reveal>
          </div>
          <div className="thesis-reflection col-content">
            <h3 className="t-label">{c.conclusions.reflectionLabel}</h3>
            <Reveal as="p" kind="lines" className="t-body">
              {c.conclusions.reflection}
            </Reveal>
          </div>
          <p className="thesis-back col-content">
            <Link className="link link-standalone t-lead" href={href('/about#timeline')} transitionTypes={[RETURN]}>
              ← {t.back}
            </Link>
          </p>
        </Section>

        <Minimap sections={sections} />
      </article>
    </PageTransition>
  )
}
