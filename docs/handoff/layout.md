# Layout & Pages session

## Branch

`claude/layout-pages-composition-f58ey0` (pushed only to this branch; never `main`).

## Plan

Written before editing, after reading `docs/contracts.md`, `docs/art-direction.md`, the
foundation handoff and every stub.

**Ground rules.** Only the paths Layout owns. Every page on `.spread-grid` sections with `.col-*`
placement (D9); no legacy `.page`. Page markup uses `<Reveal kind>` only (D4). Type only through
the `.t-*` classes / `--type-*` tokens; vertical rhythm on the 4 px baseline; section spacing
chosen per section from `--space-s/m/l`. Copy only from `content/` through `src/lib/content.ts`
(server) or `src/lib/hand-data.ts` (client). Client components never import `src/lib/content.ts`
(D7): server pages pass `<Picture>` / illustrations / copy down as props.

**Components**: SectionIndex (sticky from 1024), NumeralBreaker (⅓ overlap), Spread, MetaPairs,
Scoreboard, DealRow (stage from 1024; scroll-snap + "1 / 4" below, D5), MarginNote (Reveal
"note"; margin track from 1680, D2), Minimap (focusable ticks + IntersectionObserver), Section
helper rebuilt so every block is a grid item.

**Pages**: home, case-study template, Management, More projects, About, Contact, 404, all on the
Spread grid, per the brief. **Verify**: build, Playwright at 390×844 and 1440×900 (+1024, +1680),
then a subagent review of the diff against the brief.

## What shipped

### Layout components (`src/components/layout/`, [contract](../contracts.md#layout-components))

| Component | What it does now |
| --- | --- |
| `SectionIndex` | Markup unchanged. Mono "01 —— Context" (number in the identity accent, 24 px hairline). Below 1024 an inline label 16 px above the h2. From 1024 `position: sticky; top: header + 24px` in columns 1–3, level with the middle of the h2's first line; inside `Section` it spans `--index-rows` grid rows (`pin` prop) so it stays pinned while the section reads. Checked: stays at 88 px from the top while scrolling 04 Approach at 1024 and 1440. |
| `NumeralBreaker` | Markup unchanged. Outlined numeral token, 60% accent; from 1024 it starts at the content column (column 4) and runs to the right edge, so the h2 visibly overlaps its lower third (bottom margin −⅓ of the line box; following siblings `z-index: 1`). |
| `Spread` | Markup unchanged. Full bleed, image capped at 84svh (`object-fit: cover`); caption below the image in the reading column, in column 12 + outer track from 1680 (D2). |
| `MetaPairs` | Markup unchanged. 1 px ruled, 2 columns below 1024, 5 up from 1024 (`[data-count="4"]` → 4 up for Management's card facts). |
| `Scoreboard` | Markup unchanged (`<Reveal as="dl" kind="digits">`, `[data-digit]` spans). Martian Mono at the h2 size, tabular, accent; label under the value; 2 up below 1024 (an odd first item spans both columns), 5 up from 1024. |
| `DealRow` | Props unchanged; still calls `useDealScene(ref, { cards: 4 })` and reflects `data-scene-active`. From 1024 a static stage of four card-proportioned cards across all twelve columns (`.col-wide`). Below 1024 a full-bleed scroll-snap row; `useDealPosition` (new, `use-deal-position.ts`) watches `[data-deal-card]` with an IntersectionObserver rooted in the row and writes `[data-deal-position]` directly (D5). Checked: "1 / 4" → "4 / 4" while scrolling, no page overflow. |
| `MarginNote` | Props unchanged; now `<Reveal as="aside" kind="note" class="margin-note col-margin" data-margin-note>`. Inline aside with a 1 px accent left rule below the paragraph below 1680; from 1680 column 12 + the outer track, level with the block it annotates, 32 px clear of the viewport edge. |
| `Minimap` | Props unchanged. Fixed at the right edge from 1024, `display: none` below. Ticks are `a.minimap-tick[href="#id"]`; the label (`01 Context`) is the link text, shown as a pill beside the tick on hover / focus. `MinimapObserver` (new client child) sets `aria-current="location"` on the tick of the section in a band from under the header to 40% of the viewport; none above the first section. Checked: keyboard focus + Enter jumps to `#decisions` (64 px from the top) and marks it current. |
| `Section` | Rebuilt: every child is a grid item (`.col-*` / `.cols-a-b` helpers); props `titleHidden`, `space` (`s|m|l`), `pin`. |
| `WorkshopRow` (new) | Management's workshop formats with DealRow's markup, scene hook (`cards: n`) and mobile position label; DealRow keeps its contract props. |

Placement helpers in `layout.css`: `.cols-1-5`, `.cols-4-7`, `.cols-4-8`, `.cols-4-10`,
`.cols-4-11`, `.cols-4-12`, `.cols-6-11`, `.cols-7-12`, `.cols-8-11`, `.cols-8-12`, `.cols-9-12`
(columns from 1024, stacked below), plus `.row-mate` (a block sharing a row with the first block
after the h2 starts level with it).

### Pages

- **Home** (`src/app/page.tsx`): inside `<FirstLoadSequence>`: label, display name one word per
  line (two lines) in columns 1–9 with its top at 22svh, role (mono, accent) + intro (lead) in
  columns 4–10, "On the table now" under `<Reveal as="hr" kind="rule">` (label in columns 1–3,
  three numbered items across 4–12). Fits above the fan at 1440×900 and 390×844 with the
  placeholder intro (3 lines on desktop).
- **Case study** (`work/[slug]`): `CaseHero` now continues the card: counter (`01 / 04`) + label
  (`type · year`) in the index column, the `[data-hero-target]` frame from column 6 to the right
  edge (it carries the `card-<id>` view-transition name and holds `<Picture priority>` passed in
  from the server page, no image reveal), the display h1 (`card-title-<id>`) running onto the
  frame over a scrim, summary in lead; 72svh / 64svh. The 40×56 mini card still takes the name
  once the frame scrolls away (top left on phones, bottom left from 1024 so it clears the sticky
  index). Then MetaPairs → Scoreboard, and sections with deliberately varied spacing
  (M, L, M, M, S + breaker, L, M, S, L): 01 Context (body, MarginNote, Spread), 02 Problem
  (the case's `statement` set at h2 size, `problem.body[0]` when there is none, then the problem
  paragraphs; the h2 stays for screen readers), 03 Role (owned / not
  owned columns 4–7 / 8–11), 04 Approach (steps 4–7, illustration sticky in 8–12),
  NumeralBreaker + 05 Decisions (DealRow on the twelve-column stage), 06 Artefacts (gallery
  rows 7 + 5 then 4 + 8, the right item of a 7 + 5 row dropped 96 px; a lone last item keeps its
  row's asymmetry; every artefact keeps its tile, and one whose drawing a section already shows,
  or that has no media, renders as a ruled caption tile), 07 Outcomes, 08 Differently (2 px accent rule, lead text), 09 Next
  (`NextProject`: the card face + h2-size title through `PlayLink`, a switch). Minimap with nine
  ticks. Illustrations from the brief's placement (case 1 IntakeBeforeAfter / TeamGrowthTimeline,
  case 2 DesignSystemLayers / ContributionLoop / AdoptionBars, case 3 JourneyEmotionCurve /
  ServiceBlueprint), each in `<Reveal as="figure" kind="draw">`; content's `section.illustration`
  wins as soon as content sets any; each drawing appears once per page.
- **Management**: hero "How I lead" + TeamConstellation in the hero frame (or `heroImage`);
  card facts (4 up); 01 principles as numeral (outlined, columns 1–3) | h3 (4–7) | evidence
  (8–12), on phones the h3 overlaps the numeral's lower third; 02 team: the structure (one mini
  card per member, initials + FTE) sticky in columns 4–7 while the member rows scroll in 8–12;
  03 rituals: list in columns 4–8, WeekRing in 9–12; 04 hiring: path of steps (one column per
  step from 1024, vertical below) with an SVG connector in `<Reveal kind="draw">`
  (`pathLength="1"`, `data-draw`); 05 growth: CareerMatrix framed by the dimensions (left) and
  levels (below) as HTML labels; 06 workshops: WorkshopGlyphs strip, `WorkshopRow`, the existing
  `WorkshopDraw` egg (copy as props); 07 metrics: Scoreboard in columns 4–12; next card; Minimap.
- **More projects**: display title, count line, column heads (desktop), `ol` of rows; each row
  `li[tabindex=0]` with `<Reveal as="hr" kind="rule">`, mono `[01]` in the index columns, h3
  title (4–8), year (9), client type (10–11), ProjectTypeGlyph (12, hidden until hover / focus,
  its `[data-draw]` strokes drawn with a CSS dash transition; reduced motion: fade only); the text
  shifts 8 px. Phones: two lines. Not links.
- **About**: hero (display title, lead, ContourPortrait in columns 10–12); 01 story (+ Spread when
  `about.story.image` is set); 02 timeline: AboutTimeline across all columns with seven HTML stops
  in a subgrid below from 1024, below 1024 the drawing turned 90° (container-query sized) beside
  seven equal stop rows; 03 how I work: staggered 2×2 (2 columns from 640); 04 tcg; 05 roots
  (lead, columns 6–11); 06 `OnTheTable` (egg, five cards; its h2 set on the h2 token by page
  CSS); colophon from the image manifest (`kind: "photo"`: title → `pageUrl`, photographer →
  `photographerUrl`) + topography credit; the swisstopo attribution also runs up the left edge
  (fixed, from 1024).
- **Contact**: one viewport, centred above the hand: label, display title, lead, the email at h2
  size with a drawn underline (`<Reveal as="hr" kind="rule">` sized to the email), mono key /
  value rows, note. No form.
- **404**: dashed discard zone, a face-down card as the discard pile, and `DiscardedCard` in
  `<Reveal kind="draw" order={0}>` tilted by `--angle-discard` on top (columns 10–12 from 1024,
  above the title on phones), display title, lead, "Back to the table" button (RETURN
  transition).
- Header padding and footer moved onto the grid (aligned with the twelve columns from 1440).
  Legacy `.page`, `.home`, `.detail`, `.hero*`, projects table and discard styles removed from
  `globals.css`.

## Contract change requests

1. **`--accent` does not follow the identity** (`src/styles/tokens.css`). `--accent:
   var(--id-accent)` on `:root` resolves once to the ink accent and is inherited as that value,
   so every page's accent was the ink grey. Workaround on this branch in `src/app/globals.css`:
   `[data-identity] { --accent: var(--id-accent); }`. Smallest change: move that rule into
   `tokens.css` (Foundation) and delete it from `globals.css`.
2. **`RevealTag` has no `h1`.** `PageTitle` therefore still carries the legacy
   `data-reveal="headline"` (it is the only legacy preset left in Layout markup). Smallest change:
   add `'h1'` to `RevealTag`; Layout then renders `PageTitle` as `<Reveal as="h1" kind="lines"
   order={0}>` (keeping `WeightText` inside).
3. **Minimap behaviour.** The contract gives `aria-current` to Motion; the brief asked Layout for
   it, so `MinimapObserver` sets it. Integration: keep one writer (drop Layout's file if Motion
   ships its own).
4. **Workshops deal row.** `DealRow` is fixed to four decisions, so workshops use `WorkshopRow`
   (same `[data-scene="deal"]` / `[data-deal-card]` markup, `useDealScene(ref, { cards: n })`).
   Motion: the scene should accept any `n` and the extra root class `.deal-row-workshops`.
5. **Spread captions.** The schema has no caption for a section image; the Context Spread uses the
   image's `alt`, falling back to "`number · title`". Smallest change: `SectionCopy.imageCaption?:
   string` and `SectionHead.imageCaption?: string`.
6. **Workshop field labels.** `WorkshopFormat` has no labels for duration / who / outcome, so the
   cards show the values without labels. Optional: `management.workshops.labels`.
7. **Illustrations (for that session).** AboutTimeline: put the seven stops at
   `x = (i + 0.5) × 960 / 7` (centres of seven equal cells); Layout aligns the HTML stops to that
   and rotates the drawing 90° clockwise below 1024. CareerMatrix: columns = levels and rows =
   dimensions, evenly spread edge to edge, so the HTML axis labels line up.
8. **404 discard egg (Motion).** D4: the page no longer renders the legacy
   `data-reveal="discard"` / `.discard-card`; the discarded card is the `DiscardedCard` drawing in
   `<Reveal kind="draw" order={0} className="lost-card">` inside `.lost-discard` (the page tilts
   it by `--angle-discard`, so Illustrations should draw it upright). If the fall is kept, attach
   it there.

Deliberate deviations: the sticky index pins through a section's head and reading rows and
yields where a block takes all twelve columns (the DealRow / workshop stages, the artefact
gallery, the hiring path, the About timeline and Management's principle numerals, which sit in
the index columns themselves); sections whose blocks stay in columns 4–12 keep it pinned
throughout. Management's workshops use `WorkshopRow` (request 4). The NumeralBreaker is placed
from the content column to the right edge instead of `.col-full`, so the h2 overlaps it.

Decided against the brief where the contract wins: margin notes and the Spread caption move to
the margin track from **1680** (D2), not 1440 (at 1440 the outer track is 24 px wide).
Scoreboard keeps the contract markup (one `<Reveal as="dl" kind="digits">` around all values, each
value's digits in `[data-digit]`).

## Known issues

- Content is placeholder ("To be written."); the case studies, Management and About have no
  margin notes or extra images yet, so the margin-note placement was verified by injecting a note
  into the DOM at 390, 1440 and 1680 (inline / inline / column 12 + outer track, level with the
  body).
- The detail pages' old contact block is gone: the brief's template ends at 09 Next.
- Management's pinned team structure is HTML built from `team.members` (TeamConstellation is the
  hero drawing).
- At 1440×900 the home row clears the fan only while the intro is three lines; longer copy scrolls.
- `blocks.tsx` (Callout, Metrics, Divider) is unused and still carries legacy presets; its CSS is
  kept in `globals.css` until Integration deletes it.
- More projects rows are focusable `li[tabindex=0]` elements without a role (the brief asks for
  focusable, non-link rows).

**Checks.** `npm run build` passes (11 routes, type check). Budget (advisory): 159.8 KB gzip
initial JS, 166.9 KB by network idle. Playwright / Chromium full-page screenshots of all nine
routes (home, three case studies, Management, More projects, About, Contact, 404) at 390×844,
1024×768, 1440×900 and 1680×1000: no horizontal scroll, no console errors. Behaviour checks:
sticky index at 88 px (1024, 1440), sticky Approach illustration, margin note inline / margin
track (390, 1440 / 1680), DealRow counter 1 → 4 on a phone, index row shift 8 px + glyph shown on
hover, Minimap Enter → `#decisions` current. A subagent reviewed the diff against the brief;
its findings (statement not rendered, an empty gallery, an untilted 404 card, unpinned indexes
where columns 1–3 were free) are fixed, the rest are listed above as deviations.
