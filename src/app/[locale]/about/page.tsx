import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { CareerTimeline } from '@/components/about/career-timeline'
import { OffsetImage, Section, SectionIndex, imageSides } from '@/components/layout'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Picture } from '@/components/picture'
import { Reveal } from '@/components/reveals'
import { OnTheTable } from '@/eggs/on-the-table'
import { type AboutSectionKey, aboutSectionKeys, contentFor, getContent, pad2 } from '@/lib/content'
import { pageAlternates } from '@/lib/metadata'
import { asLocale, setRequestLocale } from '@/lib/request-locale'
import { NAV } from '@/motion/transitions'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return { title: contentFor(locale).about.title, alternates: pageAlternates(locale, '/about') }
}

const space: Record<AboutSectionKey, 's' | 'm' | 'l'> = {
  story: 'm',
  timeline: 'l',
  howIWork: 'm',
  tcg: 'l',
  roots: 's',
  onTheTable: 'm',
  projects: 'l',
  contact: 'l',
}

/**
 * About (glacier, over the old password page's contour background, drawn by
 * the background field): hero (title, lead, the portrait photo), 01 story,
 * 02 timeline (two lanes, work and education, on one year axis: horizontal
 * from 1024, vertical below; the Master's card links to the thesis), 03 how I work (four
 * face-up cards: a row dealt with a slight fan from 1024, 2×2, one column),
 * 04 "At the table", 05 roots, 06 "What's on the table" (five mini cards: the
 * card family the timeline and how I work share), 07 projects (a plain list:
 * title, year, client, what I did; not interactive), 08 contact ("Let's
 * talk."). Images are offset on alternating sides. The photo credits and the
 * terrain credit are small print in the footer (AboutSmallPrint); the credit
 * also runs along the left edge from 1024.
 */
export default async function AboutPage({ params }: Props) {
  setRequestLocale((await params).locale)
  const { about: a, site, href } = await getContent()
  const head = (key: AboutSectionKey) => ({
    id: key,
    number: aboutSectionKeys.indexOf(key) + 1,
    label: a[key].label,
    title: a[key].title ?? a[key].label,
    space: space[key],
  })
  const side = imageSides()
  const p = a.projects
  const c = a.contact
  return (
    <PageTransition>
      <div className="about-page" data-identity="glacier">
        <header className="about-hero spread-grid">
          <PageTitle className="about-title t-display">{a.title}</PageTitle>
          <Reveal as="p" kind="lines" order={1} className="about-lead t-lead">
            {a.lead}
          </Reveal>
          <Reveal kind="image" order={1} className="about-portrait">
            <Picture id={a.portrait} sizes="(min-width: 1024px) 25vw, 15rem" />
          </Reveal>
        </header>

        {/* 01 Story */}
        <Section {...head('story')} pin={2}>
          <div className="section-body col-content">
            {a.story.body.map((p, i) => (
              <Reveal key={i} as="p" kind="lines" className="t-body">
                {p}
              </Reveal>
            ))}
          </div>
          {a.story.image && (
            <OffsetImage image={a.story.image} side={side()} caption={a.story.caption} className="section-image" />
          )}
        </Section>

        {/* 02 Timeline: two lanes, work and education, on one year axis (R7). */}
        <Section {...head('timeline')} pin={1}>
          <CareerTimeline timeline={a.timeline} label={a.timeline.title ?? a.timeline.label} />
        </Section>

        {/* 03 How I work: four face-up cards (number, title, body); not interactive. */}
        <Section {...head('howIWork')} pin={1}>
          <Reveal as="ul" kind="deal" className="how-cards col-wide">
            {a.howIWork.items.map((h, i) => (
              <li key={i} className="how-card about-card" data-deal-item="">
                <span className="how-number about-card-label">{pad2(i + 1)}</span>
                <h3 className="how-title">{h.title}</h3>
                <p className="how-body t-body">{h.body}</p>
              </li>
            ))}
          </Reveal>
        </Section>

        {/* 04 At the table */}
        <Section {...head('tcg')} pin={3}>
          <Reveal as="p" kind="lines" className="tcg-body t-lead cols-4-10">
            {a.tcg.body}
          </Reveal>
          <Reveal as="ul" kind="list" className="tcg-lessons col-content">
            {a.tcg.lessons.map((l, i) => (
              <li key={i} className="tcg-lesson">
                <h3 className="t-h3">{l.title}</h3>
                <p className="t-body">{l.body}</p>
              </li>
            ))}
          </Reveal>
          <p className="tcg-stats t-label col-content">{a.tcg.stats}</p>
          {a.tcg.image && (
            <OffsetImage image={a.tcg.image} side={side()} caption={a.tcg.caption} className="section-image" />
          )}
        </Section>

        {/* 05 Roots: set to the right, lead size. */}
        <Section {...head('roots')} pin={2}>
          <Reveal as="p" kind="lines" className="roots-body t-lead cols-6-11">
            {a.roots.body}
          </Reveal>
          {a.roots.image && (
            <OffsetImage image={a.roots.image} side={side()} caption={a.roots.caption} className="section-image" />
          )}
        </Section>

        {/* 06 What's on the table: the egg brings its own h2. */}
        <div id="onTheTable" className="page-section spread-grid space-m about-table" data-section="onTheTable">
          <SectionIndex
            number={aboutSectionKeys.indexOf('onTheTable') + 1}
            label={a.onTheTable.label}
            className="col-index"
          />
          <div className="col-content">
            <OnTheTable
              title={a.onTheTable.title}
              items={a.onTheTable.items}
              flipped={site.eggs.tableFlipped}
              titleId="onTheTable-title"
            />
          </div>
        </div>

        {/* 07 Projects: a plain list, not interactive (no hover or focus states); rows reveal with their rules. */}
        <Section {...head('projects')} pin={2}>
          <Reveal as="p" kind="block" className="projects-count t-label col-content">
            {p.intro}
          </Reveal>
          <div className="projects col-wide">
            <p className="projects-head t-label" aria-hidden="true">
              <span>{p.columns.title}</span>
              <span>{p.columns.year}</span>
              <span>{p.columns.client}</span>
              <span>{p.columns.role}</span>
            </p>
            <ul className="projects-list">
              {p.items.map((item) => (
                <Reveal key={item.title} as="li" kind="pair" className="project">
                  <span className="project-rule" aria-hidden="true" data-pair-rule="" />
                  <span className="project-title" data-pair-part="">
                    {item.title}
                  </span>
                  <span className="project-year t-label" data-pair-part="">
                    <span className="sr-only">{p.columns.year}: </span>
                    {item.year}
                  </span>
                  <span className="project-client" data-pair-part="">
                    <span className="sr-only">{p.columns.client}: </span>
                    {item.client}
                  </span>
                  <span className="project-role" data-pair-part="">
                    <span className="sr-only">{p.columns.role}: </span>
                    {item.role}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal as="p" kind="lines" className="projects-end t-lead col-content">
            {p.end}
          </Reveal>
          <p className="projects-thesis col-content">
            <Link className="link link-standalone" href={href('/about/thesis')} transitionTypes={[NAV]}>
              {p.thesis}
            </Link>
          </p>
        </Section>

        {/* 08 Contact: the end point (Coffee, the egg, leads here: /about#contact). */}
        <Section {...head('contact')} pin={2} className="about-contact">
          <Reveal as="p" kind="lines" className="contact-body t-lead col-content">
            {c.body}
          </Reveal>
          {/* The email's marker block draws in from the left as the chapter reveals (a `rule` with a marker). */}
          <Reveal as="p" kind="rule" className="contact-email-line t-h2 col-content" data-reveal-marker="">
            <a className="contact-email link link-standalone" href={`mailto:${c.email}`}>
              {c.email}
            </a>
          </Reveal>
          <dl className="contact-pairs col-content">
            {c.links.map((l) => (
              <div key={l.label} className="contact-pair">
                <dt className="t-label">{l.label}</dt>
                <dd className="t-label">
                  {l.href ? (
                    <a className="link link-standalone" href={l.href}>
                      {l.value}
                    </a>
                  ) : (
                    l.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Reveal as="p" kind="block" className="contact-note t-body col-content">
            {c.note}
          </Reveal>
        </Section>

        {/* The contour map's credit along the left edge from 1024, while the map is behind the page. The
            footer's small print carries the same link for keyboards and screen readers. */}
        <p className="topo-attribution t-label" aria-hidden="true">
          <a className="link link-vertical" href={a.topo.href} tabIndex={-1}>
            {a.topo.attribution}
          </a>
        </p>
      </div>
    </PageTransition>
  )
}
