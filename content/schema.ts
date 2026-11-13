/*
 * Content schema: the types every piece of visible text and every image
 * reference must satisfy. There is one content set per locale
 * (content/de, content/en), each a `Content`. Pages read typed content only
 * through src/lib/content.ts (which picks the set of the route's locale);
 * client components receive the active locale's slim chrome (site labels and
 * the hand) from the layout through src/lib/chrome.tsx. Never import JSON or
 * MDX content directly. Foundation-owned. Contract: docs/contracts.md#content-schema.
 *
 * Shapes fit the final persona content (a fictional UX team lead). Counts
 * that the contract fixes (four decisions, five metrics, seven timeline
 * stops, ...) are checked at build time for every locale in src/lib/content.ts.
 * Copy rules: plain labels, no personal names (the fictional persona is
 * fine), no job-seeking language, no CV, no testimonials.
 */
import type { ContentIllustration, ProjectType, WorkshopMethod } from '@/components/illustrations/types'
import type { Identity } from '@/design/palette'
import type { ImageId } from './images'

export type { ContentIllustration, Identity, ImageId, ProjectType, WorkshopMethod }

/** A string with {placeholders} filled at runtime, e.g. "Turned sideways: {line}". */
export type Template = string

/** One paragraph of plain text (no markup). */
export type Paragraph = string

export type Fact = { label: string; value: string }

/** A number with a unit and a label (Scoreboard). */
export type Metric = { value: string; unit?: string; label: string }

/** Ids of the four hand cards: three case-study slugs and "management". */
export type CardId = string

/**
 * The head every Management and About section carries: a short label for
 * SectionIndex and the Minimap, an optional h2 (defaults to the label) and an
 * optional image with an optional caption (Spread shows a caption only when
 * one is set, never the alt text).
 */
export type SectionHead = { label: string; title?: string; image?: ImageId; caption?: string }

// ---------------------------------------------------------------------------
// Images (content/images.ts)

export type ImageFormat = 'avif' | 'webp' | 'jpeg'

/** Where a photo comes from; the About colophon credits and links each one. */
export type ImageCredit = {
  photographer: string
  photographerUrl: string
  /** The photo's own page (e.g. on the stock site). */
  pageUrl: string
}

type ImageBase = {
  /** Required; an empty string marks the image decorative. */
  alt: string
  /** Intrinsic size of the largest rendition (sets width/height, avoids layout shift). */
  width: number
  height: number
  /** Renditions written by scripts/images to public/images/<id>-<width>.<ext> (avif, webp, jpg). */
  local?: { widths: number[]; formats: ImageFormat[] }
  /** Hotlinked source; the URL contains {w} for the width. */
  remote?: { src: string; widths: number[] }
  /** Solid colour shown before the image decodes. */
  placeholder?: string
}

/** One image: a photo (credit required) or a generated placeholder (credit optional). */
export type ImageEntry =
  (ImageBase & { kind: 'photo' } & ImageCredit) | (ImageBase & { kind: 'generated' } & Partial<ImageCredit>)

// ---------------------------------------------------------------------------
// Site chrome (header, footer, shortcut sheet, shared labels)

export type Site = {
  name: string
  description: string
  /** Header wordmark (initials or short name). */
  wordmark: string
  skipLink: string
  introSkip: string
  /**
   * The home slot (wordmark, or Back on detail pages), the one page link (About), the name of
   * the site navigation and of the language switcher (DE, EN).
   */
  header: { homeLabel: string; back: string; about: string; nav: string; language: string }
  footer: { note: string }
  /** The "?" sheet. */
  shortcuts: { title: string; close: string; items: { keys: string; label: string }[] }
  /** Egg announcements (live region): new hand, tap, rare pull, Coffee dealt, an About card flipped. */
  eggs: {
    dealt: string
    turned: Template
    rare: string
    /** "One more card: {title}" */
    coffeeDealt: Template
    /** "{label}: {value}" */
    tableFlipped: Template
  }
  labels: {
    /** aria-label of the facts list on a card. */
    facts: string
    next: string
    viewing: string
    /** aria-label of the Minimap nav. */
    sections: string
    meta: Record<keyof CaseStudyMeta, string>
    decision: Record<keyof Decision, string>
    /** Column labels of the case-study role section: "What I owned", "What I didn't". */
    owned: string
    notOwned: string
    /** Field labels on Management's workshop cards. */
    workshop: Record<Exclude<keyof WorkshopFormat, 'name' | 'glyph'>, string>
  }
}

/** What a hand card shows. */
export type HandCardCopy = {
  /** Must equal the page title (case study title; "Management" for the fourth card). */
  title: string
  /** Project type on the card band, e.g. "Platform" or "How I lead". */
  type: string
  /** Years on the card face, e.g. "2025" or "Since 2016". */
  year: string
  /** One line shown when a card is inspected (and on the card face). */
  inspect: string
  /** Printed along the long edge; readable when the card is turned sideways. */
  tapLine: string
  /** The card's facts, each with its own label (two in the final content, e.g. "Team: 2 → 5 people"). */
  facts: Fact[]
}

/**
 * The hand: exactly four cards. Lives in content/hand.ts, the slim module the
 * client bundle loads, so it holds card metadata only (no page text).
 */
export type HandContent = {
  order: readonly [CardId, CardId, CardId, CardId]
  identity: Record<CardId, Identity>
  /** Short labels on the mobile peek rail. */
  railLabel: Record<CardId, string>
  cards: Record<CardId, HandCardCopy>
  labels: {
    nav: string
    viewing: string
    /** A played card's page is slow to arrive (after 1.5 s, under the card on the table). */
    loading: string
    /** …and still not there after 12 s. */
    stillLoading: string
    /** Offline: when the card met the table (it goes back to the hand), or while its page loads. */
    offline: string
  }
}

/** Typing "draw" on home deals a fifth card, "Coffee?", which opens About's contact chapter (content/hand.ts). */
export type CoffeeEgg = {
  title: string
  /** One line on the card face. */
  body: string
  /** On the card band, e.g. "Say hello". */
  cta: string
}

// ---------------------------------------------------------------------------
// Pages

export type Home = {
  /** Above the title, e.g. "Bern, Switzerland — UX Team Lead". */
  label: string
  title: string
  role: string
  intro: Paragraph
  /** A quiet line above the hand, e.g. "Pick a card". */
  hint: string
  /** "What I bring to the table": three short items. */
  bring: { label: string; items: string[] }
  /** The idle hint (egg): a handwritten note beside the hand after 30 s without input. */
  idleNote: string
}

export type CaseStudyMeta = {
  client: string
  timeframe: string
  role: string
  team: string
  /** Project type, e.g. "Platform" (also the card band's type). */
  type: string
}

export type Decision = { decision: string; chose: string; tradeOff: string; why: string }

/** Exactly four decisions (DealRow deals four cards). */
export type Decisions = [Decision, Decision, Decision, Decision]

export type Artefact = {
  title: string
  caption?: string
  image?: ImageId
  illustration?: ContentIllustration
}

/** The text every numbered section shares. */
export type SectionCopy = {
  /** Short index label (SectionIndex, Minimap), e.g. "Context". */
  label: string
  /** The section's h2. */
  title: string
  body: Paragraph[]
  /** A plain list after the body. */
  list?: string[]
  /** MarginNote next to the body. */
  note?: string
  /** Any section may hold an illustration (not only the artefacts). */
  illustration?: ContentIllustration
  image?: ImageId
  /** Caption under the section image; Spread shows it only when set (never the alt text). */
  caption?: string
}

/** Case-study sections in reading order: 01 Context … 09 Next. */
export const caseStudySectionKeys = [
  'context',
  'problem',
  'role',
  'approach',
  'decisions',
  'artefacts',
  'outcomes',
  'differently',
  'next',
] as const
export type CaseStudySectionKey = (typeof caseStudySectionKeys)[number]

export type ApproachStep = { title: string; body: Paragraph }

export type CaseStudySections = {
  context: SectionCopy
  problem: SectionCopy
  /** Two columns, labelled by site.labels.owned / notOwned. */
  role: SectionCopy & { owned: string[]; notOwned: string[] }
  /** Exactly four steps. */
  approach: SectionCopy & { steps: ApproachStep[] }
  decisions: SectionCopy & { items: Decisions }
  artefacts: SectionCopy & { items: Artefact[] }
  outcomes: SectionCopy & { items?: string[] }
  differently: SectionCopy & { items?: string[] }
  /** The next card. `card` defaults to the next one in hand order. */
  next: Pick<SectionCopy, 'label' | 'title'> & { card?: CardId }
}

export type CaseStudy = {
  slug: string
  /** "01" … "03", the case's position. */
  number: string
  /** Colour identity: ember, tide or grove (equals hand.identity[slug]). */
  identity: Identity
  /** Short label (mobile rail). */
  label: string
  /** Equals hand.cards[slug].title. */
  title: string
  summary: Paragraph
  /** One large statement (full-bleed breaker). */
  statement?: string
  heroImage: ImageId
  meta: CaseStudyMeta
  /** Scoreboard: exactly five. */
  metrics: Metric[]
  sections: CaseStudySections
}

/** Management sections in reading order (after the hero). */
export const managementSectionKeys = [
  'principles',
  'team',
  'rituals',
  'hiring',
  'growth',
  'workshops',
  'metrics',
] as const
export type ManagementSectionKey = (typeof managementSectionKeys)[number]

export type Principle = { title: string; evidence: string }
/** Team members appear as initials only. */
export type TeamMember = { initials: string; role: string; fte: string; focus: string }
export type Ritual = { name: string; cadence: string; purpose: string }
export type HiringStep = { title: string; duration: string; purpose: string }
/** A workshop format; `glyph` selects its WorkshopGlyph on the workshop card. */
export type WorkshopFormat = { name: string; duration: string; who: string; outcome: string; glyph: WorkshopMethod }

export type Management = {
  slug: 'management'
  /** saffron (equals hand.identity.management). */
  identity: Identity
  /** Hero heading, e.g. "How I lead" (the card itself stays "Management"). */
  title: string
  lead: Paragraph
  heroImage?: ImageId
  /** Exactly five. */
  principles: SectionHead & { items: Principle[] }
  team: SectionHead & { members: TeamMember[]; note: string }
  rituals: SectionHead & { items: Ritual[] }
  hiring: SectionHead & { steps: HiringStep[]; note: string }
  growth: SectionHead & { body: Paragraph; levels: string[]; dimensions: string[] }
  /** The workshop draw (egg) follows the formats; drawButton is its label. */
  workshops: SectionHead & { formats: WorkshopFormat[]; drawButton: string }
  /** Exactly five. */
  metrics: SectionHead & { items: Metric[] }
}

/** One row of About's "Projects" chapter: what it was, when, for whom, and what I did. */
export type Project = { title: string; year: string; client: string; role: string }

export type ContactLink = { label: string; value: string; href?: string }

/** About's timeline lanes. */
export type CareerLane = 'work' | 'education'
export type CareerPart = { title: string; place?: string }
/**
 * One stop of About's two-lane timeline (R7): a span of years in the work or the education lane,
 * or (`both`) one card across both lanes, its two halves in `parts` (the apprenticeship: the
 * company part and the vocational school).
 */
export type CareerStop = {
  lane: CareerLane | 'both'
  /** First year. */
  from: number
  /** Last year (the span ends there), or 'today'. */
  to: number | 'today'
  title: string
  place?: string
  /** lane 'both' only: its work half and its education half. */
  parts?: Record<CareerLane, CareerPart>
  /** The overlap with the other lane in words, for readers without the picture. */
  alongside?: string
  /** The Master's card: a link to the thesis page (/about/thesis). */
  thesis?: boolean
}

/** About sections in reading order (after the hero). */
export const aboutSectionKeys = [
  'story',
  'timeline',
  'howIWork',
  'tcg',
  'roots',
  'onTheTable',
  'projects',
  'contact',
] as const
export type AboutSectionKey = (typeof aboutSectionKeys)[number]

export type About = {
  title: string
  lead: Paragraph
  /** The hero's portrait (a 4:5 photo; an example until the real one comes). */
  portrait: ImageId
  story: SectionHead & { body: Paragraph[] }
  /**
   * Two lanes, work and education (R7): exactly seven stops, oldest first (by `from`), one of them
   * across both lanes, four in work, two in education, one the thesis link. `lanes` names the
   * lanes, `both` the shared card's lane, `today` the open end, `alongside` the overlap bands'
   * label, `thesisLink` the Master's card's link.
   */
  timeline: SectionHead & {
    lanes: Record<CareerLane, string>
    both: string
    today: string
    alongside: string
    thesisLink: string
    items: CareerStop[]
  }
  /** Exactly four. */
  howIWork: SectionHead & { items: { title: string; body: string }[] }
  tcg: SectionHead & { title: string; body: Paragraph; lessons: { title: string; body: string }[]; stats: string }
  roots: SectionHead & { title: string; body: Paragraph }
  /** "What's on the table": exactly five mini cards, face down, each flipping to its value (egg). */
  onTheTable: SectionHead & { title: string; items: { label: string; value: string }[] }
  /**
   * "Projects": a plain, non-interactive list (13 rows). `intro` is the count line
   * ("13 projects · 2014–2025", checked against the items), `end` the closing line.
   */
  projects: SectionHead & {
    title: string
    intro: string
    columns: Record<keyof Project, string>
    items: Project[]
    end: string
    /** A link to the master's thesis overview below the list (R8). */
    thesis: string
  }
  /** The final chapter: "Let's talk.", the body, the email (drawn underline), the links and a note. */
  contact: SectionHead & { title: string; body: Paragraph; email: string; links: ContactLink[]; note: string }
  /** Heading of the small print in the footer on About that credits every photo (kind "photo"). */
  creditsTitle: string
  /**
   * The contour background: its place and the swisstopo credit ("Terrain data © swisstopo"), a
   * link to swisstopo's terms of use (`href`), shown on About (footer, and the left edge from 1024).
   */
  topo: { label: string; attribution: string; href: string }
}

export type NotFound = { title: string; body: Paragraph; back: string }

/** "Draw a workshop method" on /management (the button label is management.workshops.drawButton). */
export type WorkshopMethods = {
  again: string
  /** Announced: "Workshop method: {title}. {howTo}" */
  drawn: Template
  methods: { title: string; howTo: string }[]
}

// ---------------------------------------------------------------------------
// Illustration copy: each drawing's <title>, <desc> and labels, per locale

/** A drawing's short name (<title>) and what it shows (<desc>, one or two sentences). */
export type IllustrationText = { title: string; description: string }

/**
 * The words inside the illustrations, keyed by component name. Each entry spreads into the
 * component as props (src/components/illustrations), so a locale replaces every default.
 * Data that is not text (counts, scores, years) stays in the components.
 */
export type IllustrationCopy = {
  TeamGrowthTimeline: IllustrationText & { labels: { team: string; joined: string } }
  IntakeBeforeAfter: IllustrationText & {
    offers: string[]
    labels: { before: string; after: string; team: string; frontDoor: string }
  }
  DesignSystemLayers: IllustrationText & { layers: string[]; badges: string[] }
  ContributionLoop: IllustrationText & { steps: string[] }
  AdoptionBars: IllustrationText & { labels: { adopted: string; notYet: string } }
  ServiceBlueprint: IllustrationText & { lanes: string[]; labels: { before: string; after: string } }
  JourneyEmotionCurve: IllustrationText & { steps: string[] }
  /** The Management hero: squads around the lead (`size` people each). */
  TeamConstellation: IllustrationText & { squads: { label: string; size: number }[]; lead: string }
  /** Management's week: the weekday names and the three weekly rituals on the ring (check-in, 1:1s, critique). */
  WeekRing: IllustrationText & { days: string[]; rituals: [string, string, string] }
  /** Levels and tracks come from management.growth; this is the drawing's title and description. */
  CareerMatrix: IllustrationText
  WorkshopGlyphs: IllustrationText
  /** One glyph per workshop format on Management. */
  WorkshopGlyph: Record<WorkshopMethod, IllustrationText>
  DiscardedCard: IllustrationText
}

/** Everything one locale's content/<locale>/index.ts exports. */
// ---------------------------------------------------------------------------
// The master's thesis overview (R8): /about/thesis, glacier, the case-study template

/** Its chapters 01–08 in reading order. */
export const thesisChapterKeys = [
  'question',
  'context',
  'approach',
  'survey',
  'insights',
  'prototype',
  'testing',
  'conclusions',
] as const
export type ThesisChapterKey = (typeof thesisChapterKeys)[number]

/** A chapter: its short label (index, Minimap), h2, a one-paragraph lead and the full text. */
export type ThesisChapter = { label: string; title: string; lead: Paragraph; body: Paragraph[] }

/** A drawing's accessible title and description plus the words inside it. */
export type ThesisDrawing<L extends string> = { title: string; description: string; labels: Record<L, string> }

export type Thesis = {
  eyebrow: string
  title: string
  subtitle: Paragraph
  /** The one-line answer (the 30-second layer), with its label. */
  answer: { label: string; text: Paragraph }
  /** Exactly five: programme, submitted, method, scope, setting. */
  meta: { label: string; value: string }[]
  /** Exactly four. */
  scoreboard: Metric[]
  chapters: {
    question: ThesisChapter & { questions: { label: string; text: string }[] }
    context: ThesisChapter
    approach: ThesisChapter
    survey: ThesisChapter
    /** Exactly four insight cards (the dealt row). */
    insights: ThesisChapter & { cards: { title: string; body: string }[] }
    prototype: ThesisChapter
    testing: ThesisChapter
    conclusions: ThesisChapter & {
      answers: { label: string; body: Paragraph }[]
      nextLabel: string
      next: string[]
      reflectionLabel: string
      reflection: Paragraph
    }
  }
  /** The three screenshot placeholders' labels (the owner replaces them with images). */
  slots: { knowledgeBase: string; checkIn: string; sources: string }
  drawings: {
    sequence: ThesisDrawing<'survey' | 'interviews' | 'prototype' | 'test1' | 'test2' | 'explains'>
    burnout: ThesisDrawing<'causes' | 'symptoms' | 'signal' | 'dialogue' | 'hr' | 'intervention' | 'gap' | 'only'>
    stakeholders: ThesisDrawing<'tool' | 'individuals' | 'managers' | 'hr' | 'leadership'>
    functions: ThesisDrawing<
      'knowledge' | 'sources' | 'handover' | 'checkIn' | 'monthly' | 'mbi' | 'exhaustion' | 'cynicism' | 'inefficacy'
    >
    tests: ThesisDrawing<'round1' | 'round2' | 'people1' | 'people2' | 'changed' | 'found1' | 'found2'>
  }
  /** The link back to About's timeline. */
  back: string
}

export type Content = {
  site: Site
  hand: HandContent
  home: Home
  caseStudies: CaseStudy[]
  management: Management
  about: About
  thesis: Thesis
  notFound: NotFound
  coffeeEgg: CoffeeEgg
  workshopMethods: WorkshopMethods
  illustrations: IllustrationCopy
  /** Alt text of every image in this locale (English: the registry's own, content/images.ts). */
  imageAlt: Record<ImageId, string>
}
