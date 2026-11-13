/*
 * Typed content for pages and server components, per locale
 * (content/index.ts: one `Content` per locale, typed by content/schema.ts),
 * plus the build-time checks of the counts the contract fixes, run for every
 * locale. Server side: client components get the active locale's slim chrome
 * through src/lib/chrome.tsx instead, so page text stays out of the client.
 *
 *   getContent()        the locale of the page being rendered (src/lib/request-locale.ts: each
 *                       [locale] layout and page sets it), for any server component below them
 *   contentFor(locale)  a given locale (generateMetadata, generateStaticParams)
 */
import { contents } from '@content/index'
import type { Content } from '@content/schema'
import { type Chrome, buildChrome } from './hand-data'
import { type Locale, localeHref, locales } from './i18n'
import { requestLocale } from './request-locale'

export type * from '@content/schema'
export { aboutSectionKeys, caseStudySectionKeys, managementSectionKeys, thesisChapterKeys } from '@content/schema'
export { images } from '@content/index'
export { cardNumber, fill, pad2 } from './format'

/** One locale's content with its hand cards and lookups. */
export type LocaleContent = Content &
  Omit<Chrome, keyof Content> & {
    locale: Locale
    /** The case study with `slug` and its position, or null. */
    getCaseStudy: (slug: string) => { study: Content['caseStudies'][number]; index: number } | null
  }

/** Fails the build with a pointer to the contract when content breaks a fixed count. */
function expect(ok: boolean, message: string) {
  if (!ok) throw new Error(`Content contract (docs/contracts.md#content-schema): ${message}`)
}

/** About's count line per locale: "13 projects · 2014–2025". */
const projectsLine: Record<Locale, (n: number, from: number, to: number) => string> = {
  de: (n, from, to) => `${n} Projekte · ${from}–${to}`,
  en: (n, from, to) => `${n} projects · ${from}–${to}`,
}

function validate(locale: Locale, content: Content, chrome: Chrome) {
  const at = (what: string) => `content/${locale}: ${what}`
  const count = (what: string, list: unknown[], n: number) =>
    expect(list.length === n, at(`${what} must have exactly ${n}, found ${list.length}.`))
  const studies = content.caseStudies
  count('caseStudies', studies, 3)
  expect(new Set(studies.map((c) => c.slug)).size === studies.length, at('case-study slugs must be unique.'))
  studies.forEach((c, i) => {
    expect(/^[a-z0-9-]+$/.test(c.slug), at(`invalid case-study slug "${c.slug}".`))
    expect(c.number === String(i + 1).padStart(2, '0'), at(`"${c.slug}".number must be "0${i + 1}".`))
    count(`"${c.slug}".metrics`, c.metrics, 5)
    count(`"${c.slug}".sections.decisions.items`, c.sections.decisions.items, 4)
    count(`"${c.slug}".sections.approach.steps`, c.sections.approach.steps, 4)
    const card = chrome.cardById(c.slug)
    expect(Boolean(card), at(`"${c.slug}" is not a hand card (content/${locale}/hand.ts).`))
    expect(
      card?.title === c.title,
      at(`hand card title "${card?.title}" must equal the case study title "${c.title}".`),
    )
    expect(card?.identity === c.identity, at(`"${c.slug}".identity must equal hand.identity.`))
  })
  count('management.principles.items', content.management.principles.items, 5)
  count('management.metrics.items', content.management.metrics.items, 5)
  const stops = content.about.timeline.items
  count('about.timeline.items', stops, 7)
  const lane = (l: string) => stops.filter((s) => s.lane === l)
  count('about.timeline.items in both lanes', lane('both'), 1)
  count('about.timeline.items in work', lane('work'), 4)
  count('about.timeline.items in education', lane('education'), 2)
  count(
    'about.timeline.items with the thesis link',
    stops.filter((s) => s.thesis),
    1,
  )
  stops.forEach((s, i) => {
    const end = s.to === 'today' ? Infinity : s.to
    expect(end >= s.from, at(`about.timeline.items[${i}] ends before it starts.`))
    expect(i === 0 || s.from >= stops[i - 1].from, at('about.timeline.items must be oldest first.'))
    expect(Boolean(s.parts) === (s.lane === 'both'), at(`about.timeline.items[${i}]: parts only on the shared card.`))
  })
  count('about.howIWork.items', content.about.howIWork.items, 4)
  const t = content.thesis
  count('thesis.meta', t.meta, 5)
  count('thesis.scoreboard', t.scoreboard, 4)
  count('thesis.chapters.question.questions', t.chapters.question.questions, 2)
  count('thesis.chapters.insights.cards', t.chapters.insights.cards, 4)
  count('thesis.chapters.conclusions.answers', t.chapters.conclusions.answers, 2)
  count('thesis.chapters.conclusions.next', t.chapters.conclusions.next, 3)
  count('about.onTheTable.items', content.about.onTheTable.items, 5)
  const projects = content.about.projects.items
  count('about.projects.items', projects, 13)
  const years = projects.map((p) => Number(p.year))
  const line = projectsLine[locale](projects.length, Math.min(...years), Math.max(...years))
  expect(content.about.projects.intro === line, at(`about.projects.intro must be "${line}".`))
  count('home.bring.items', content.home.bring.items, 3)
}

/** Copy rules per locale, checked on every string of the set. German: Swiss Standard German ("ss"), no em-dash or semicolon. */
const copyRules: Record<Locale, { pattern: RegExp; rule: string }[]> = {
  de: [
    { pattern: /ß/, rule: 'Swiss Standard German writes "ss", never "ß"' },
    { pattern: /—/, rule: 'no em-dashes (use a full stop or a comma)' },
    { pattern: /;/, rule: 'no semicolons (use a full stop or a comma)' },
  ],
  en: [],
}

function validateCopy(locale: Locale, value: unknown, path: string) {
  if (typeof value === 'string') {
    for (const { pattern, rule } of copyRules[locale])
      expect(!pattern.test(value), `content/${locale}: ${path}: ${rule}: "${value.slice(0, 80)}"`)
  } else if (Array.isArray(value)) value.forEach((v, i) => validateCopy(locale, v, `${path}[${i}]`))
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) validateCopy(locale, v, path ? `${path}.${k}` : k)
}

/** Every locale tells the same story: the same case studies (slugs, order) and the same cards. */
function validateAcross(sets: Record<Locale, Content>) {
  const [first, ...rest] = locales
  const slugs = (c: Content) => c.caseStudies.map((s) => s.slug).join(',')
  const career = (c: Content) =>
    c.about.timeline.items.map((s) => `${s.lane}:${s.from}-${s.to}:${Boolean(s.thesis)}`).join(',')
  for (const locale of rest) {
    expect(slugs(sets[locale]) === slugs(sets[first]), `content/${locale}: case studies must match content/${first}.`)
    expect(career(sets[locale]) === career(sets[first]), `content/${locale}: the timeline must match content/${first}.`)
    expect(
      sets[locale].hand.order.join(',') === sets[first].hand.order.join(','),
      `content/${locale}: hand.order must match content/${first}.`,
    )
  }
}

function build(locale: Locale): LocaleContent {
  const content = contents[locale]
  const chrome = buildChrome({ locale, site: content.site, hand: content.hand, coffeeEgg: content.coffeeEgg })
  validate(locale, content, chrome)
  validateCopy(locale, content, '')
  const getCaseStudy = (slug: string) => {
    const index = content.caseStudies.findIndex((c) => c.slug === slug)
    return index === -1 ? null : { study: content.caseStudies[index], index }
  }
  return { ...content, ...chrome, locale, getCaseStudy }
}

validateAcross(contents)
const sets = Object.fromEntries(locales.map((l) => [l, build(l)])) as Record<Locale, LocaleContent>

/** One locale's content. */
export const contentFor = (locale: Locale) => sets[locale]

/** The content of the page being rendered (its layout or page called setRequestLocale). */
export async function getContent(): Promise<LocaleContent> {
  return sets[requestLocale()]
}

/** generateStaticParams for the [locale] segment: every page in every locale. */
export const localeParams = () => locales.map((locale) => ({ locale }))

export { localeHref }
