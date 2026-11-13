# Contracts

The shared surface of the redesign. Four Wave 1 sessions (Layout & Pages, Motion, Illustrations,
Content & Images) worked in parallel against it; the Integration session merged them, applied the
[integration decisions](#integration-decisions-i1i27) and updated this file to match the code.
[Feedback round 1](#feedback-round-1) (one session) then changed the decisions listed there,
[Locales](#locales-l1l11) made the site bilingual (German and English),
[Feedback round 2](#feedback-round-2), [Feedback round 3](#feedback-round-3),
[Card play](#card-play-p1p8), [Feedback round 4](#feedback-round-4) and
[Text links](#text-links-k1k4) changed the decisions listed there; every reference section
below describes the code as it is now. Everything here exists in the repository
as typed code. Read this file, `docs/art-direction.md`, `CLAUDE.md` and the files named below
before planning. Known follow-ups: `docs/backlog.md`.

Since feedback round 1 one session at a time works on the repository and pushes `main`. The rules
below were written for Wave 1 and apply again only if a future wave runs in parallel:

- Edit only the paths your session owns ([ownership](#ownership-wave-1)). Everything else is
  read-only, including this file.
- Keep every name, prop, attribute and type listed here. If one has to change, do not change it:
  write a **contract change request** in your handoff (`docs/handoff/<agent>.md`) with the reason
  and the smallest change; Integration decides.
- Push only your own branch. Only the Foundation and Integration sessions push `main` (the deploy
  workflow runs only for `main`).
- No new dependencies. In particular no animation or smooth-scroll libraries (no GSAP, no Lenis):
  Motion 14, Motion+ 4 and CSS cover everything.
- Respect `BASE_PATH`: links through `next/link` (it adds the base path); raw URLs (`<img>`,
  `fetch`, `<a>` to files) through `withBase()` from `src/lib/site.ts`. Never a hard-coded
  leading `/` for assets.
- No personal names in code, comments, docs or commits (the fictional "Moritz Lauber" in test
  content is fine). Plain labels; no job-seeking language, CV download or testimonials.
- Calm by default: only the background field (and, since T2, the very slow flow of the header
  logo's gradient, which text links on home and 404 share since K2) moves at rest. Everything else is still until the visitor scrolls or
  interacts, and every stub already renders its final, readable state.
- Run `npm run build` before you push (it type-checks; output in `dist/`).

Contents: [Decisions](#decisions) · [Integration decisions](#integration-decisions-i1i27) ·
[Feedback round 1](#feedback-round-1) · [Locales](#locales-l1l11) ·
[Feedback round 2](#feedback-round-2) · [Feedback round 3](#feedback-round-3) ·
[Card play](#card-play-p1p8) · [Feedback round 4](#feedback-round-4) ·
[Text links](#text-links-k1k4) · [Ownership](#ownership-wave-1) · [Files](#file-map) · [Layout tokens](#layout-tokens) ·
[Type tokens](#type-tokens) · [Motion tokens](#motion-tokens) · [Colour](#colour) ·
[Hand](#hand) · [Layout components](#layout-components) · [Reveal](#reveal) ·
[Scenes](#scenes) · [Reading hairline](#reading-hairline) · [Illustrations](#illustrations) ·
[Picture](#picture) · [Content schema](#content-schema) · [Routes](#routes) ·
[Data attributes](#data-attributes) · [Eggs](#eggs) · [Checks](#checks)

---

## Decisions

Settled before Wave 1 so the four sessions do not decide them four ways. Each one is binding;
change requests go through the handoff like any other contract change.

**D1. Hand reserve.** The hand shows 72% of itself on home and 45% everywhere else, so every route
except home uses the collapsed reserve. The hand component (`src/components/hand/hand.tsx`) sets
`data-hand="collapsed"` on `<html>` on every route except home and removes it on home; the
pre-paint script (`src/motion/preferences.ts`) sets the same attribute from the URL, so the first
paint is already right. `layout.css` maps it to `--hand-reserve: 120px` from 1024 px (176 px on
home); below 1024 px the rail reserve applies on every route. *Implemented by Foundation.*

**D2. Margin notes.** From 1680 px wide (`--breakpoint-margin-notes` in `src/styles/layout.css`,
`breakpoints.marginNotes` and `media.marginNotes` in `src/design/layout.ts`), MarginNote and every
other `.col-margin` element sit in column 12 plus the right outer track. Below 1680 px a
MarginNote renders inline in the content column as an aside with a 1 px left rule.
*Implemented by Foundation.*

**D3. Hero target** (its `heroTarget()` superseded by P2: the played card lands at the table's
centre, not on the hero). The case hero's media frame carries `data-hero-target`: the element that
frames the played card on a detail page (today `.hero-slot` in `case-hero.tsx`, already marked;
Layout keeps the attribute on the frame of its redesigned hero). Motion changes `heroTarget()` in
`src/motion/play.ts` to measure `[data-hero-target]` with `getBoundingClientRect()` at play time
and to fall back to the current computed values when the element is missing (for example when
playing from home, where no hero is mounted yet).

**D4. Reveals.** After Wave 1, `<Reveal>` kinds are the only reveal system. Layout uses only
`<Reveal>` (and `<FirstLoadSequence>` on home) in page markup, never the legacy `data-reveal`
presets or `data-order`. Motion implements the eight kinds on the new tier scale (calm: durations
× 0.6, removed by M1; reduced: 160 ms opacity crossfades) and removes the legacy kinds (`headline`, `paragraph`,
`line`, `tags`, …), `data-order` and the 300 / 200 ms `--reveal-calm` / `--reveal-reduced`
timings once nothing references them. Integration deletes any leftovers.

**D5. DealRow mobile counter.** The "1 / 4" position label is UI state and belongs to Layout:
DealRow tracks the snapped card with an IntersectionObserver on its `[data-deal-card]` items
inside the scroll row and writes the label (`[data-deal-position]`). Motion's `useDealScene`
reports no position; its return type stays `{ active: boolean }`.

**D6. Content.** Case sections 02–04 are `problem`, `role` (with `owned` / `notOwned`) and
`approach` (with four `steps`). Each More projects item carries its `projectType` (`form`, `map`,
`dashboard`, `portal`, `calendar`, `checklist`), which selects its ProjectTypeGlyph. Each case
study has exactly five metrics. The slugs stay `team-of-teams` (case 01, ember),
`shared-foundations` (case 02, tide) and `front-door` (case 03, grove). The fixed counts are
checked at build time in `src/lib/content.ts`.

**D7. Bundle.** The hand imports only card metadata (ids, labels, identities, card copy), not
the whole content module, so long page text stays out of the shared client bundle. *Amended by
L5:* client components get the active locale's slim chrome (`content/<locale>/hand.ts`: the four
cards and the Coffee card; `content/<locale>/site.ts`: chrome labels) from the `[locale]` layout
through `src/lib/chrome.tsx` (`useChrome()`, `activeChrome()`); only that locale's chrome reaches a
page. Language-free helpers (which card a route is, identities) are in `src/lib/hand-data.ts`,
pure text helpers in `src/lib/format.ts`. Page text (case-study sections, Management, About) is
read only by server components through `src/lib/content.ts`; client egg components that need
page copy (workshop draw, "What's on the table") receive it as props from their server page.
`scripts/budget.mjs` stays advisory for this playground: report its number in your handoff; a
result over 170 KB does not block a push. *Implemented by Foundation.*

**D8. MDX.** The `@next/mdx` configuration, its packages and `src/mdx-components.tsx` are
removed: no route renders MDX. The Content session deletes the obsolete `.mdx` and JSON content
files (and `content/adapters.ts`) once its typed modules replace them. *Implemented by Foundation
(configuration) and Content & Images (files deleted).*

**D9. Pages.** Every page, including About, More projects, Contact and 404, moves to the Spread
grid (`.spread-grid` sections with `.col-*` placement); the legacy `.page` layout goes. That is
the Layout session's job in Wave 1. *Implemented by Layout; D3, D4 and D5 by Layout and Motion,
D4's leftovers deleted by Integration (I3).*

---

## Integration decisions (I1–I27)

Taken when the four Wave 1 branches were merged; they answer every contract change request in
the Wave 1 handoffs. Each one is implemented; `docs/handoff/integration.md` says where.

**Accent and identity**

- **I1. `--accent` follows the page identity.** Every `[data-identity]` scope emitted by
  `identityCss()` declares `--accent: var(--id-accent)`; the local workarounds in `globals.css`
  and `illustrations.css` are gone.

**Reveals and motion**

- **I2. Page titles.** `RevealTag` includes `h1`. `PageTitle` renders `<Reveal as="h1"
  kind="lines" order={0}>` (WeightText inside): it reveals on direct loads and client
  navigations. After a play or switch the card → hero morph delivers the case or Management
  title, so the engine marks it revealed at once. Home keeps `<FirstLoadSequence>` (its own title
  sequence). No page uses `data-reveal="headline"`.
- **I3. Tokens only.** The values Motion kept in `choreography.ts` live in `src/motion/tokens.ts`
  (`at.firstLoad`, `duration.digits`, `duration.svgDraw`, `duration.svgDrawCalm`,
  `distance.block`, `reveal.{mask, image, digitRoll, zoomLanded, mobileJobs, heroDrift}`,
  `deal.*`, `timeline.*`, `discard.*`, `field.pinnedDetail` (removed in round 3, R4), and for older literals
  `duration.gather`, `duration.liftTimeout`, `stagger.gather`, `angle.lift`, `angle.tap`;
  `deal.flipPerspective` serves every card that turns over); `choreography.ts` holds only the
  tier helpers. `stagger.metric` is `stagger.digits`. Retired: the legacy `data-reveal` presets and
  their aliases in `kindOf()`, `data-order`, `--reveal-calm`, `--reveal-reduced`, `--angle-word`,
  `--angle-metric`, every unreferenced `duration` / `stagger` / `at` entry (and `angle.handTilt`,
  `weight.medium`, `field.drift`, `ease.settle`), `src/components/blocks.tsx`,
  `section-title.tsx` and `title-fill.tsx` (D4).
- **I4. Illustration fills and labels** are `data-draw-fill` and `data-draw-label`. The `draw`
  kind fades a group's labels in as the group starts and its tints once its strokes are drawn.
  There is no fill heuristic and no `data-tint` (every tint carries `data-draw-fill`, checked in
  the browser on every page).
- **I5. Breaker lift.** Full-bleed breakers carry `data-breaker` (every `Spread`, and the case
  study's 02 Problem section with its statement); the background field's 10% lift reads
  `[data-breaker]` and holds while any breaker is in view (counted: adjacent breakers overlap).
- **I6. Hero drift.** `.hero-drift` sits on the hero `<picture>` inside the
  `[data-hero-target]` frame, which clips its overflow with `overflow: clip` (not `hidden`: a
  scroll container would capture the `view()` timeline, and the drift would never move).
- **I7. 404.** The discard fall animates `.lost-card` (the draw reveal around `DiscardedCard`)
  from above to its own resting pose.
- **I8. Minimap.** `aria-current="location"` is set by Layout's `MinimapObserver` only.
- **I9. Workshops.** Management's workshop formats are a static row on desktop (no pinned scene:
  the team structure is already pinned on that page) and a scroll-snap row with its "n / N"
  counter on mobile (`WorkshopRow`). `useDealScene` keeps its signature and is used only by the
  case-study `DealRow`.
- **I10. Reading hairline exception.** The rule "at most one scroll-linked effect per viewport"
  does not count the reading hairline: it is a 1 px progress indicator and may run next to one
  other scroll-linked effect (hero drift, the pinned deal; the About timeline until A2).

**Illustrations**

- **I11. Labels are SVG `<text>`** in `--font-mono` (no font is embedded). Labelled drawings have
  no root `viewBox`: they keep their proportions with CSS `aspect-ratio`, and the root is a size
  container, so give it a definite width and size it by width only.
- **I12. Narrow columns.** A wide drawing in a narrow column takes its vertical layout: pass
  `variant="vertical"` when the column is narrow at every width. The Approach drawing is narrow
  only in the sticky column from 1024 px, so it renders both layouts (`auto`) and `detail.css`
  shows the vertical one there, capped by the viewport height so it stays in view while pinned;
  below 1024 it spans the reading column with the default layouts. Every placement was checked
  in the browser.
- **I13. Alignment with the page's HTML.** (`AboutTimeline` removed by A2.) `AboutTimeline` places its stops at
  `x = (i + 0.5) × 960 / n` (with `labels={false}` it is line and dots only, 960×120);
  `CareerMatrix` with `axes={false}` spreads its levels and tracks evenly edge to edge, so HTML
  axis labels in equal columns and rows line up; `DiscardedCard` is one upright card (the page
  tilts it with `--angle-discard` and lays it on its pile).
- **I14. Content in data props.** About passed `about.timeline.items` to `AboutTimeline` (removed by A2).
  Each Management workshop format names its `WorkshopGlyph` (`glyph`): Kick-off canvas →
  `one-two-four-all`, Service blueprint jam → `fishbowl`, Design studio → `crazy-eights`, Retro
  with a twist → `dot-voting`. `CareerMatrix` takes `growth.levels` / `growth.dimensions`;
  `WeekRing` takes the weekly rituals the content names.
- **I15. Any section.** Illustrations may sit in any case-study section through
  `SectionCopy.illustration`, not only in the artefacts.

**Content and schema**

- **I16. Captions.** `SectionCopy` and `SectionHead` have an optional `caption` for their image.
  `Spread` shows a caption only when one is set, never the alt text or a fallback label.
- **I17. Workshop labels.** `site.labels.workshop` (`duration`, `who`, `outcome`) labels the
  fields on the workshop cards.
- **I18. Topography label**: "Interlaken, between Lake Thun and Lake Brienz" (attribution and
  placeholder note unchanged).
- **I19. Docs** follow the content: `HandCardCopy.facts` holds the card's own facts (two in the
  final content); deleted content files and placeholder seeds are no longer named.

**Page fixes**

- **I20. Phones never widen.** Scoreboard values wrap between words (`.scoreboard-word`), so
  "9 → 3 weeks" and "3 weeks → 4 days" fit at 390 px. Nothing may widen the viewport: overflow
  aborts the card view transitions on phones.
- **I21. Portrait photos** (`team-of-teams-hero`, `about-tcg2`) are rebuilt as 3:2 crops
  (`crop: [3, 2]` in the manifest → `fit=crop&crop=entropy&w=2048&h=1365`); the hero frame and
  the Spread use `object-fit: cover`.
- **I22. Dark placeholders.** `fetch-and-build.mjs` clamps every placeholder colour to at most
  the ink glow's luminance, so nothing flashes light before an image decodes.
- **I23. Hero priority.** The case hero `<Picture>` is `priority` (eager, `fetchpriority="high"`)
  and never inside an image reveal.
- **I24. Home clears the fan** at 1440×900 and 390×844 with the real intro: from 1024 px the
  role and intro sit beside the name (columns 7–12); on phones the hero starts under the header
  and the intro uses the body size.
- **I25. Closing contact.** After 09 Next (case studies) and Next (Management), `ClosingContact`
  renders one quiet line: `site.labels.contactTitle` in the index column, `contactText` and a
  `contactLink` mail link. No card.
- **I26. Open Graph.** The deploy workflow passes `SITE_URL` (the `base_url` output of
  `actions/configure-pages`) to the build; `about-og` (1280 px JPEG) becomes the default Open
  Graph image with `metadataBase` only when it is set. Never hard-coded; local builds have none.
- **I27. Smoke** reads card and page titles from `content/hand.ts` and
  `content/pages/not-found.ts` (Node type stripping) instead of hard-coding them. (Since L5:
  from `content/<locale>/…` of the locale under test, through `scripts/load-ts.mjs`.)

---

## Feedback round 1

One round of design feedback, applied by one session (plan and report:
`docs/handoff/feedback-1.md`). Where it changes an earlier decision, the earlier one is marked
superseded here and the reference sections below describe the new state. Items keep the
feedback's numbers (G, H, D, A); its D1–D8 are not the Wave 1 decisions D1–D9 above.

**General**

- **G1. Pool drift.** On top of the breath, the field's three colour pools drift on slow
  Lissajous loops: 2.5% of the viewport (`field.poolDrift`), loops of 97–151 s
  (`field.poolDriftPeriods`), full tier only (scaled by the `motion` track; calm and reduced keep
  the pools still). Uniform `uDrift[3]` in `shader.ts`.
- **G2. Calm switch** (superseded by M1 and M2: the calm tier and its switch are gone). The footer's DisplaySettings is gone. `CalmSwitch`
  (`src/components/calm-switch.tsx`, `button[role="switch"][data-calm-switch]`) sits in the
  header. One source of truth: the stored preference that the pre-paint script applies as
  `html[data-motion]`; the switch's look (thumb, track, on, disabled) is CSS on that attribute,
  so it is right before hydration; React reads the attribute (`useMotionTier`) for
  `aria-checked` / `disabled` and syncs on mount. The thumb and track move on the hover spring
  (critically damped), instant in reduced. Reduced (system): on, disabled, hint
  `site.settings.reducedHint` ("Set by your system").
- **G3. Header.** Links: the home slot and About only. More projects and Contact are pages no
  more (A1–A3); the mobile bottom sheet lists the four cards only (`ul.hand-sheet-links` gone;
  the sheet itself is gone since P5: the rail plays a card with one tap).
- **G4. Home slot** (its morph superseded by R3). One link at the top left (`a[data-slot-mode="mark|back"]` in
  `header.tsx`): the logo (`.mark`, `src/components/logo.tsx`), or on detail
  pages (the case studies and Management) a back arrow + "Back" (`.back`: an SVG shaft and head,
  the label in a mask). Between them a CSS morph (`header.module.css`, `duration.slotMorph`
  420 ms in all, `duration.slotLag` 120 ms, outQuint): the mark compresses (`scale` x to
  `slot.markScale`) and fades toward the left edge while the shaft draws out of it and the label
  rises from its mask (`--reveal-mask`), and back; the parts that start second wait the lag and
  run in the rest of the 420 ms. The mark is one box, never its letters. Reduced: a 160 ms crossfade. Back keeps its behaviour
  (`RETURN`, `table.returnHome`). The header is live in every view transition, so the morph runs
  during play / return.
- **G5. Footer.** None on home (`FooterShell`, a client gate on the pathname). On About it adds
  the small print (photo credits, terrain attribution; A2).

**Home**

- **H1. One screen.** `.home` is `min-height: 100dvh` with the hand's visible height as bottom
  padding; it scrolls only when the viewport is too small. Short desktop screens (max-height
  820 px) set the name at most 18svh and the intro on the body size. Checked to clear the hand at
  1024×768, 1280×720, 1440×900, 1920×1080, 2560×1440 and 390×844. The hint ("Pick a card") sits
  just above the hand (centred from 1024, left on phones; centred at every width since H2 of round 2).
- **H2. No card counter.** `HandCounter`, `hand.labels.counter` and its announcements are gone.
  New hand: M on home; by touch a long press (800 ms) on the empty table, never on a card, link,
  control or text (`attachTableLongPress` in `src/eggs/hand-eggs.ts`).
- **H3. Copy.** `home.bring` ("What I bring to the table", three items) replaces
  `home.onTheTableNow`.
- **H4. First visit.** `at.firstLoad` holds every offset and duration (supersedes the old
  title 520 / role 900 / intro 1000 / rest 1300): name 0–600 ms, label 250–600, role and intro
  450–950 (lines 60 apart, the intro's lines after the role's; with more lines than fit, as on
  phones, the stagger narrows so the last line lands by 950), divider 850–1150 (drawn left to
  right like a link underline), "What I bring" label and items from 1000 (80 apart) with the hint
  on the last item, the four cards 1250–2000 (330 ms each, 140 apart), then the chrome. The parts
  carry `data-reveal-step`. Calm × 0.6; reduced: everything at once, 160 ms. Revisits: unchanged.
- **H5. Idle hint** (egg, `src/eggs/idle-hint.tsx`, home only): after `idle.after` (30 s; 10 s since M3)
  without a click, tap or key press, a Caveat note (`home.idleNote`, "(a selection of my
  projects)", self-hosted OFL latin subset with umlauts, not preloaded) writes itself word by
  word, then a curly SVG arrow draws toward the cards. Once per session (sessionStorage), fades on
  the next click, tap or key press, `aria-hidden`, in `--muted`. Calm × 0.6; reduced: a fade.
  `?idle` shortens the wait to a second (for checking).

**Detail pages**

- **D1. Hero sequence** (its timings superseded by P3: `cardPlay.*.hero`, label before summary). After the card morph or on a direct load: the title and the hero image
  as before, then (`at.detail`) the summary +200 ms, the top label and counter +360 ms, then the
  meta pairs from +500 ms, 100 ms apart left to right, each a `pair` reveal (rule, then label,
  then value; 300 ms). Only blocks in the first viewport when the sequence starts join it
  (`data-reveal-step`, measured once); the rest reveal on scroll.
- **D2. Offset images** (supersedes the full-bleed Spread and I5's "full-bleed"):
  `OffsetImage` replaces `Spread` on case studies, Management and About. From 1024 anchored to
  the content column on one side and running toward the viewport edge on the other, always 3:2
  (`object-fit: cover`), at most 1200 px wide and 72svh tall (the height cap narrows the frame); consecutive images alternate sides
  (`imageSides()`, starting left: the hero runs right); caption beside the image from 1680, below
  otherwise; edge to edge at 4:3 below 1024. The case hero frame is capped at 1200 px.
- **D3. No mini card** (superseded by P3: Back always folds the page into the full-screen frame,
  which shrinks into the slot; `dealIn()`, `heroVisible()` and `distance.returnDeal` are gone). When the hero frame has scrolled away nothing carries `card-<id>`: a
  return then deals the card into its slot (`dealIn()` in `play.ts`: a 24 px rise with opacity,
  `distance.returnDeal`), no shared-element morph, nothing from off screen. The case hero reports
  its visibility (`heroVisible()`); the title's transition name follows it too.
- **D4. Numerals.** Every case chapter 01–08 opens with its outlined NumeralBreaker; 09 Next has
  none. Every chapter has the large space above it.
- **D5. No closing contact** (supersedes I25): `ClosingContact` and
  `site.labels.contactTitle / contactText / contactLink` are gone.
- **D6. Decisions deal face up.** The deck lies face up; `deal.stage` is 180 svh (was 250).
- **D7. Workshop cards** share their rows (CSS subgrid): name, then duration, who and outcome
  stay level when a name wraps.
- **D8. Artefacts.** "Career framework" draws `CareerMatrix` (Management's levels and
  dimensions); a text-only artefact ("Intake one-pager") is a deliberate text card
  (`.artefact-card`), never an empty frame.

**About**

- **A1. Projects** (supersedes D6's `projectType` and the More projects page): chapter 07 on
  About, a plain list of `about.projects.items` (title, year, client, role: "what I did"); no
  numbers, no glyphs, not interactive (no links, no focus, no hover); rows reveal with their
  drawn rules (`pair`). Count line and closing line kept.
- **A2. Contact** is chapter 08 on About (`id="contact"`): label, "Let's talk.", body, the email
  with its drawn underline (since K3 its marker block, drawn in from the left), LinkedIn and
  location, the note. The photo credits and the terrain
  attribution are small print in the footer on About (`AboutSmallPrint`).
- **A3. Routes.** `/more-projects` and `/contact` are gone (the 404 page answers); Coffee leads
  to `/about#contact`.
- **A4. Images.** About uses offset images; `about-mountain` and `about-tcg2` are deleted
  (manifest, registry, files, credits): 12 photos.
- **A5. Contours** (superseded by B1: the SVG contour layer; the heightmap and its posters are gone) (supersedes the noise placeholder, I18's placeholder note and the
  `public/topo` elevation): About shows the old portfolio's password-page field, drawn by the one
  background canvas: the Interlaken region heightmap (`public/terrain/region.webp`, its exact
  fallback `region.bin`, `src/components/background/terrain.ts`), its focus crop and zoom 1.06,
  lines 1 px and every fifth an index line at 1.5 px, alphas 0.28 / 0.42, line `#8A8C80` on the
  ground `#1B1C18` (`contour` in `palette.ts`), interval from the 95th-percentile gradient and
  3.25 / 3 px minimum spacing, DPR cap 1.5 / 1.25 (`field.contours`). Navigating to About morphs
  the gradient into the lines (colour bands narrowing into lines, `duration.topo` 1.6 s) and back
  on leaving. No drift, breath, pointer or highlight band: at rest one static frame and no
  requested frames. Reduced, no WebGL2, or a direct visit until the heightmap is ready: the
  region's poster (`public/terrain/region-{l,p}.avif`) with a 160 ms crossfade. The heightmap
  loads on About or when a link to About is hovered, focused or touched. `public/topo` and
  `scripts/topo` are deleted. The swisstopo attribution stays on About (left edge from 1024, and
  the footer).

---

## Locales (L1–L11)

The site in German and English, applied by one session (report: `docs/handoff/i18n.md`). Design,
motion and the three tiers are unchanged.

- **L1. Routes.** Every page lives under `/de/` and `/en/` (`src/app/[locale]/…`, both locales
  generated at build time, `dynamicParams = false`), with the same card slugs in both. Locales,
  path helpers and the language rule: `src/lib/i18n.ts` (`locales`, `Locale`, `splitPath`,
  `pagePath`, `localeHref`, `LOCALE_KEY`, `pickLocaleScript`). Everything that links internally
  (hand, header, Back, Escape, the 404 page's link home, Next project, Coffee) stays in the
  current locale; route logic (which card a page is, home, About) reads paths without the locale.
- **L2. Two layouts.** `src/app/layout.tsx` is the root: `<html>`, the pre-paint script, the
  background field and `RouterBridge` (the router for play / return and the back / forward replay).
  It never remounts. `src/app/[locale]/layout.tsx` holds the chrome (skip links, header, main,
  footer, hand, eggs, `ChromeProvider`) and remounts when the language changes, so the field, the
  motion tier and everything the pre-paint script wrote on `<html>` survive a switch.
- **L3. `<html lang>`** is the locale (`de`, `en`): written into every page's HTML after the
  build (`scripts/i18n-pages.mjs`; the root layout cannot read the locale) and kept in step on
  the client (`LocaleSync`). Per page: hreflang alternates for both locales and `x-default` (the
  root), a canonical link (`src/lib/metadata.ts`, absolute with `SITE_URL`); per locale: title
  template, description and Open Graph locale (`de_CH`, `en_GB` alternate).
- **L4. Root and 404** are written after `next build` by `scripts/i18n-pages.mjs` (BASE_PATH
  read there). The root runs `pickLocaleScript` inline before anything paints and replaces the
  URL with `/<locale>/`: a stored choice (localStorage `locale`) wins, then the first of
  `navigator.languages` that starts with "de" or "en"; languages but none of them: English; no
  language: German. Without JavaScript: links to both. `dist/404.html` picks the same way; an
  address from before the locales (no `/de/` or `/en/`: `/random/about/`, old links and bookmarks)
  moves to the same page in that language when it exists (a HEAD request); otherwise it fetches
  `/<locale>/404/` (the localized 404 page, `src/app/[locale]/404/page.tsx`) and writes it into
  the document, so the unknown address stays; without JavaScript, a note in both languages.
- **L5. Content per locale.** `content/de` and `content/en` are each a `Content` (one schema);
  `content/deck.ts` holds the cards without text (ids, order, identities, `cardPath`). Server
  components read the page's locale with `getContent()` (`src/lib/content.ts`; each `[locale]`
  layout and page calls `setRequestLocale(params.locale)` first, `src/lib/request-locale.ts`), or
  `contentFor(locale)`. New in `Content`: `illustrations` (each drawing's title, description and
  labels) and `imageAlt` (German alt text; English: the registry's). The build-time checks run
  for both locales and check that they tell the same story (slugs, card order); German strings
  may not contain "ß", em-dashes or semicolons.
- **L6. Switcher** (its look superseded by T3 and T4). `nav[data-locale-switcher]` in the header after About (the calm switch until M2, the pause button until R2):
  "DE · EN" (since T3 "DE EN" on a sliding chip), one link per locale (`a[data-locale][hreflang][lang]`) to the same page in that
  language, the active one `aria-current="page"` (its `.link` underline drawn, like the current
  page link; since T3 it sits on the face-up chip, no `.link`); each a 44 × 44 px target. On the 404 page the other language's link reloads the
  address (the 404 page then picks the stored language; since F1 it opens the same address under the
  other language's prefix, and the address's locale decides).
- **L7. The switch** (`src/motion/locale-switch.ts`): stores the choice, finishes running
  reveals, remembers the reading position (the section under the header and how far into it) and
  whether the switcher had focus, sets `html[data-locale-switch]` and navigates with type
  `locale` (`LOCALE` in `transitions.ts`, `scroll={false}`). After the new locale has rendered
  (`LocaleSync`, a layout effect before `Reveals`) the position is restored, focus returns to
  the switcher and the new title is announced. Browser back / forward across languages replays
  the same way (no stored choice).
- **L8. Cross-fade.** Every part with words cross-fades once in place over `--dur-s` (calm × 0.6 until M1,
  reduced 160 ms linear): the page and the card faces get the class `locale-fade` from the
  `[LOCALE]` entries of the React maps (`pageEnter`, `pageExit`, the hero's and the hand's frame,
  band and title maps, `thesisShare`; P3), the header, hand, rail and footer through
  `:root[data-locale-switch]` (`view-transitions.css`). Groups do not move; the field stays live.
  Never a card morph.
- **L9. No replay.** The reveal system runs the remounted page as kind `locale` (`table`'s intent
  `locale`): blocks on screen are final at once, the rest reveal on scroll; never the home intro.
  The table store moves nothing when only the language changes (`route()`), the breaker lift is
  kept, and the rare pull does not roll.
- **L10. Labels.** `site.header.nav` and `site.header.language` name the two header navs;
  `site.settings.calmLabel` is the calm switch's visible label, `site.settings.calm` its
  accessible name ("Ruhig" / "Ruhigere Animationen"; "Calm" / "Calm motion"). Since M2:
  `site.settings.pause` / `play` (the pause button's name and its tooltip while paused; removed by R2).
- **L11. German type.** Running text hyphenates under `:lang(de)` (`.t-body`, `.t-lead`, the
  decision cards' fields, margin notes, timeline stops, project rows; `type.css`); display type,
  headings and labels never do, their copy is written to fit at 390 px.

---

## Feedback round 2

A second round of design feedback, applied by one session (plan and report:
`docs/handoff/feedback-2.md`). Item numbers are the feedback's (M, N, H, A, B, F); its H1–H2 and
A1–A3 are not round 1's. Earlier decisions it changes are marked above; the reference sections
below describe the new state.

**Motion settings**

- **M1. Two tiers** (supersedes G2, the calm parts of D4, I3, G1, H4, H5, L8, L10): `full`, and
  `reduced` from `prefers-reduced-motion`, which every animation honours. `MotionTier` is
  `'full' | 'reduced'`; `motionScale.calm`, `tiers.calm`, `duration.svgDrawCalm`,
  `duration.calmBloom`, the stored `motion` preference, `CalmSwitch` and `site.settings.calm*` are
  gone. `durFor` / `msFor` / `spanFor` / `gapFor` / `drawFor` know the two tiers only.
- **M2. Ambient pause** (superseded by R2: the button and everything only it used are gone) (WCAG 2.2.2): `AmbientToggle` (`src/components/ambient-toggle.tsx`,
  `button[data-ambient-toggle][aria-pressed]`) in the header where the calm switch was: a 16 px
  pause / play glyph in a 44 px target. The stored choice (localStorage `ambient` = `paused`) is
  applied before first paint by the pre-paint script as `html[data-ambient="paused"]` (its single
  writer, `savePreference(AMBIENT_KEY, …)`); the glyph is CSS on that attribute; React reads it
  (`useAmbientPaused`, `ambientPaused()`, `onAmbientChange()` in `src/motion/use-tier.ts`). Paused
  stops ambient background motion only: the field's clock (breath and pool drift freeze where they
  are; hover, bloom, switch and About's morph still run), the CSS fallback's breath and the About
  contour drift. Never transitions or reveals. Hidden under reduced motion. The accessible name
  stays `site.settings.pause` in both states (a toggle button's name never changes; aria-pressed
  carries the state); `site.settings.play` is the tooltip while paused.
- **M3. Idle hint** after `idle.after` = 10 s (supersedes H5's 30 s); `?idle` stays 1 s. Since R9 it shows only where it fits: its top at least
  `idle.clearance` (24 px) below the last "What I bring" item, measured once the handwriting has
  loaded and on resize; otherwise it is skipped.

**Navigation**

- **N1. Header on scroll** (`src/motion/header-scroll.ts`, started by `header.tsx` on every route):
  one passive scroll listener, rAF-throttled, writes `html[data-header="hidden"]`. Hidden after
  more than `header.threshold` (8 px) of scrolling down in one direction past the header's height;
  shown after 8 px up, near the top (within the header's height), on pages that do not scroll, on
  focus inside the header and after every route change (the mobile sheet is gone, P5). Overscroll
  bounce and scroll changes during a view transition (`transitionRunning()` in
  `view-transition.ts`) are ignored. CSS: `translate: 0 -100%`, `duration.headerHide` 200 ms
  `ease.in`, `duration.headerShow` 240 ms outQuint (on card pages Back stays, T5); the reading hairline stays on screen at the top
  edge; reduced: the header's content and backdrop crossfade (160 ms), nothing slides. The mobile
  rail follows the same attribute and timings (`data-rail` and `hand.railHideAfter` are gone).
  `scroll-padding-top: var(--header-h)` keeps anchors clear.

**Home**

- **H1. Baseline.** From 1024 the "What I bring to the table" label and the three items share one
  baseline (`align-items: baseline` on `.home-bring`); below, the label stays above the items.
- **H2. Hint centred** at every width (supersedes H1 of round 1's "left on phones").

**About**

- **A1. Portrait** (supersedes `ContourPortrait`, removed with its copy): `about.portrait`
  (`about-portrait`, "Man's face in profile, black and white" by Nik Bagherzadegan, Unsplash
  License, `crop: [4, 5]`) in the hero, an `image` reveal; alt text in both languages. 13 photos.
- **A2. Timeline cards** (superseded by R7: two lanes) (supersedes I13, I14 and `AboutTimeline`, removed with its copy and
  `scenes/timeline-scene.ts`): `about.timeline.items` are `{ years, title, place }`; seven face-up
  cards (`.career-card.about-card`, the latest `[data-latest]` with the page accent on its edge) in
  the card family of "What's on the table" (`.about-card`, `.about-card-back`, `.about-card-label`
  in `eggs.css`: 132 × 184, 10 px corners, the accent edge, mono labels). From 1280 a line across
  the content width (`[data-deal-line]`) with the cards on it, dealt from a small face-down stack at
  its left end (`[data-deal-stack]`); 1024–1279 a scroll-snap strip with the line through it;
  below 1024 a vertical line on the left and the cards at reading width, each dealt in from the
  left as it enters. Reduced: static. Not interactive.
- **A3. How I work cards**: four face-up cards (`.how-card.about-card`: number, title, body at the
  body size): from 1024 a row dealt with a slight fan that settles straight; 640–1023 2×2; below
  640 one column. No flip, no hover lift.
- **Deal reveal.** A tenth reveal kind, `deal`, runs both: the block's `[data-deal-item]` cards; the
  mode comes from the CSS custom property `--deal-mode` (`stack`, `fan`, `left`, `list`, else a
  `block` rise), timings `deal.line`, `deal.fan`, `deal.left` in `tokens.ts`. Mode `left` keeps its
  job open until every card has entered (`ctx.stop()` in `jobs.ts` ends the wait on a skip or route
  change).

**Background**

- **B1. Contour layer** (supersedes A5; its reveal and drift superseded by R1): `.contour-bg` > `.contour-bg__poster` inside the
  background field, above the canvas and below the content, with the old password page's CSS
  reproduced exactly (`src/styles/field.css`); its two SVGs (`public/contour-bg/contours.svg`,
  `contours-200.svg`, added by hand, unchanged) come in as `--contour-poster` / `--contour-full`
  through `withBase()` (`background-field.tsx`). Ground `#1B1C18` (`contour.ground`; the line colour
  lives in the SVGs). No headlamp, no pointer. The poster drifts (`field.contourDrift`: ±8 / ±5 px,
  one 120 s loop there and back, scale 1.03; `--contour-drift-*`), transform only, full tier; it
  stops when paused, under reduced motion and while the tab is hidden (`.field[data-tab-hidden]`).
  The morph (`duration.topo` 1.6 s, inOut): the shader's `uTopo` contracts the pools and fades the
  field into the ground while the layer reveals through a radial mask from the centre
  (`--contour-reveal`, written by the engine with the same duration and curve); at rest the
  canvas draws no frames until About is left; leaving reverses it; reduced: a 160 ms crossfade.
  `.field[data-contours="off|morph|shown"]`; before the engine runs, the pre-paint `data-field`
  shows it whole on a direct visit. The SVG is fetched when a link to About is hovered, focused or
  touched (and on About). Removed: the heightmap shader code, `terrain.ts`, `public/terrain/`,
  `field.contours`, `contour.line`, the posters and `data-poster` / `data-topo`. Credit:
  `about.topo.attribution` "Terrain data © swisstopo" / "Geländedaten © swisstopo", a link to
  `about.topo.href` (swisstopo's terms of use) in the footer's small print and along the left edge
  from 1024.

**Fixes**

- **F1. 404 language** (amends L4, L6): `dist/404.html` takes the locale from the address when it
  has `/de/` or `/en/`; the stored and browser language decide only for addresses without one.
- **F2.** German copy writes "Design-System".
- **F3.** The smoke check of the home intro compares each part's start from its animations' own
  timing (start time + delay), not when it crosses an opacity threshold.

---

## Feedback round 3

A third round of design feedback, applied by one session (plan and report:
`docs/handoff/feedback-3.md`, the plan also in `docs/backlog.md`). Items keep the feedback's
numbers as R1–R9. Earlier decisions it changes are marked above; the reference sections below
describe the new state.

**R1. About's morph** (supersedes B1's reveal and drift). The shader morph is back, cheap and
sharp, and hands over to the SVG with opacity only:

- *Heightmap*: `public/terrain/field.webp` (768 × 528, lossless WebP, 147 KB; R, G heights
  `h = offset + (R·65280 + G·255)·scale` with offset 536.25 and scale 4 m, B the lake coverage),
  described by the generated `src/components/background/terrain.ts` (size, encoding, range, sha,
  reference texels). Built by `scripts/terrain/build-field.py <portfolio checkout>` from the
  portfolio repository's 1536 × 1056 master (`terrain/heightmap-1536.webp`, offset from its
  `terrain.json`; the master's sha checked): averaged 2 × 2, blurred σ 0.6 texel, rounded to 4 m;
  the lake mask is the SVG's lake path rasterised (nonzero, 4 × 4 samples per texel). Its contours
  lie a median 0.09 viewBox units from the SVG's vertices. Loaded (and its reference texels checked
  once a session) when a link to About is hovered, focused or touched, and on About.
- *Shader* (`shader.ts`): `h = mix(noise relief, elevation, smoothstep(0.15, 0.95, uTopo))`, the
  heights bicubic (Catmull-Rom) over exact `texelFetch` texels; regular lines on every interval
  except the index levels, index lines on those; anti-aliased by the level's screen-space
  derivative (fwidth's Euclidean form); lines fade in over the first 40% of `uTopo`, lakes from
  30%; the gradient's pools contract and the field fades into the ground. At `uTopo = 1` it draws
  what the SVG layer shows (`contours.ts`): cover crop centred (`xMidYMid slice`) and the layer's
  1.03 scale (`uMap`); 200 m with an index line every 1000 m, or 100 m with one every 500 m while
  `contourQuery` matches (the one copy of the old media query: the `<picture>` source and the
  shader read it, no CSS repeats it); line `#8A8C80`, 1 CSS px at 0.55 and 1.5 CSS px at 0.9,
  lakes `#8FC7E8` at 0.08, all × 0.42 over `#1B1C18`, line widths × DPR of the buffer.
- *Resolution*: the resting field keeps half its CSS size (DPR capped at 1); only while a morph
  runs the buffer is the device's (DPR capped at 2, `field.morph.dprMax`), applied at the start of
  a frame and drawn in it. If the median of the first 10 morph frame intervals is above 20 ms, the
  rest of that morph renders at 0.75× (`field.morph`). The morph draws every frame (the resting
  field 30 fps).
- *Handoff*: `.contour-bg` (the ground with a `<picture>`/`<img class="contour-bg__img">`, cover,
  opacity 0.42, static `scale(1.03)`, `will-change`) and `.contour-vignette` (the old `::after`
  gradients as a static overlay) change only by opacity (WAAPI). They render on About, during a
  morph and once a link to About is near (`data-contours-primed`: the SVG loaded, decoded and
  rasterised at `PRIMED`, 0.001: invisible, but the compositor skips rasterising a layer at exactly
  0, so the raster happens on the intent, never during the crossfade). Entering: `uTopo` 0 → 1 over `duration.topo` (1.6 s, inOut) while the
  vignette fades in; in the last `duration.contourHandoff` (0.3 s), once `img.decode()` has
  resolved (else as soon as it does), the SVG layer crossfades over the canvas; then the canvas is
  covered (`data-canvas-covered`, not composited), its buffer back at rest, the loop stops (zero
  draw calls) and the drift starts. Leaving: the drift holds, one shader frame at `uTopo = 1` with
  the drift's offset is drawn under the SVG and the canvas uncovered in that frame, the SVG fades
  off it (0.3 s), then `uTopo` runs 1 → 0 while the colours return; the field returns to its resting
  resolution in the frame the morph ends. A heightmap arriving mid-morph fades its lines in.
- *Drift*: `translate` only on the `<img>` (WAAPI, compositor), from the identity offset, ±8 / ±5 px,
  one 120 s loop with `ease.inOut`, alternating; never the scale; paused while the tab is hidden;
  never on the pointer. Reduced motion: no morph and no drift, the SVG layer crossfades (160 ms).
  The CSS fallback (`field-css.ts`, no WebGL2) and a missing heightmap: the SVG layer crossfades in
  over `duration.topo`.
- The CSS fallback layer (`.field-css`) leaves rendering once the canvas has faded in (`display:
  none`, deferred with `allow-discrete`) and only breathes while it is the visible renderer:
  hidden under the canvas it used to run its breath on the main thread and repaint every frame.
  If the engine falls back to it mid-morph (slow frames, a lost context), the morph finishes by
  opacity.
- Removed: the `mask-image` reveal, `--contour-reveal` and its transition, the CSS background
  images (`--contour-poster`, `--contour-full`), the CSS drift keyframes, `data-tab-hidden`.

**R2. No pause button** (supersedes M2 and the pause parts of L6, L10): `AmbientToggle`, its
glyphs and styles, `site.settings` (both locales and the schema), `AMBIENT_KEY`,
`savePreference`, `PREFS_EVENT`, `html[data-ambient]`, `useAmbientPaused` / `ambientPaused` /
`onAmbientChange` and the engine's paused clock are gone. The header is the logo / Back slot (top
left), About and "DE · EN". Ambient motion follows `prefers-reduced-motion` (still in reduced) and
stops while the tab is hidden; that is the only control (a visitor's stored `ambient` value is
simply no longer read).

**R3. The header logo moves** (`src/components/logo.tsx`, tokens `logo` and `ease.enter` /
`move` / `exit` in `tokens.ts`; supersedes G4's mark compression). Ported from the logo lab's
concept 3 (the lab and `/[locale]/logo-lab` untouched): Motion `animate()` (the WAAPI-only one from
`motion/mini`, so the full engine stays off every page) on the two card groups,
transforms and opacity only; each card has a move group (deal, exit, turn) and a fan group inside
it (hover); the front card's knock-out in the back card moves with it.

- *Deal-in*: part of the home intro, once a session (sessionStorage `table:logo-dealt`): when the
  intro reveals the chrome (`CHROME_IN`), the back card, then the front card 120 ms later, 400 ms
  each, from a small offset and turn (−4 / 4 units, 10 down, ∓10°) with opacity 0 (opaque at 45%),
  `ease.enter`, no bounce. A skipped intro completes it.
- *Hover and focus-visible* (superseded by T1: wider, parting and lifting): the fan widens ±1° (240 ms, `ease.move`) and closes on leave or blur
  (Motion `hover()`, which ignores emulated touch hovers; focus / blur listeners).
- *Letters egg*: on home a click on the logo (it would only reload the table) is taken
  (`claimClick()`, no navigation) and plays the 600 ms turn (scaleX 1 → 0 → 1 per card, front
  +120 ms, the M and F cut-outs showing from the moment a card is edge-on), then turns back after
  1.6 s. By touch, a 0.5 s long press anywhere the logo shows does the same (Motion `press()` with
  `hold`; no callout or context menu).
- *Logo ↔ Back*: entering a detail page the cards play their 300 ms exit (they close up, sink and
  fade, `ease.exit`), then "← Back" draws (shaft, then head and label, as before). Returning, Back
  fades (160 ms) and the cards are dealt again with the front card at +80 ms. The slot has its own
  view-transition name, `home-slot`, live and not animated by the transition (like the header), so
  the morph runs once.
- No loading "breathe". Reduced motion: nothing moves; logo ↔ Back swap at once; the egg swaps the
  letters' opacity.

**R4. Chapter 05 flicker** (cause and fix in `docs/backlog.md`): `field.pinnedDetail` and
`src/motion/scenes/pin.ts` are gone. The canvas is sized only by its ResizeObserver
(`device-pixel-content-box`), which draws in the same callback; height-only changes under
`field.ignoreHeight` (120 px) are ignored (the container is `100lvh`); the deal cards carry
`will-change: transform` from the scene's mount to its unmount; the header keeps one layer
(`will-change: translate`).

**R5. Reveals start later**: the shared trigger is `reveal.amount` 0.35 and `reveal.margin`
`0px 0px -18% 0px` (was 0.25 and −10%), in one place (`src/motion/reveal-trigger.ts`, used by the
engine and the deal kind's cards). Tall blocks: `amount = min(0.35, 0.45 × innerHeight /
offsetHeight)`. At the end of the page (within 4 px, or a page that cannot scroll) every waiting
block reveals. Reduced motion: everything outside the home intro is visible at once, without
animation (supersedes the 160 ms reveal crossfades of M1 for scroll reveals). The field's breaker
lift keeps 0.25 (`reveal.breakerAmount`).

**R6. Chapter numerals draw themselves.** `scripts/build-numerals.mjs` (run by `npm run build`
before `next build`) loads Bricolage Grotesque's variable TTF (`scripts/assets/`, from the Google
Fonts repository, with its OFL; never the WOFF2), instances it with fontkit at wght 300 / opsz 96,
takes the lining tabular digits (`lnum`, `tnum`: what the CSS numeral shows), flips them onto one
baseline in a viewBox that is the numeral's 0.8 line box, splits every glyph into its closed
contours and writes `src/content/generated/numerals.ts` (typed, committed). Checked against a
fonttools `varLib.instancer` static instance (bounds and contours within half a unit) and, in the
browser, against the live text-stroke numeral (92% of stroke pixels overlap at 1440 px; the rest
anti-aliasing). `ChapterNumeral` renders it in place of the text numeral, same size (88 → 240 px
token) and position; a 1 CSS px stroke in user units (`--numeral-stroke`, kept by
`src/motion/numeral-stroke.ts`: a non-scaling stroke breaks `pathLength` dashes in Chromium);
`stroke-dasharray: 1`, `stroke-dashoffset` 1 until its chapter reveals. The `draw` kind draws it
1 → 0 over `duration.svgDraw` (1.2 s, `ease.inOut`), contours `stagger.contours` (60 ms) apart, the
left digit first. The chapter number stays text in the section index. Reduced motion: drawn from
the start.

**R7. The timeline has two lanes** (supersedes A2): `CareerTimeline`
(`src/components/about/career-timeline.tsx`, styles in `pages.css`). Data: `about.timeline`
(`CareerStop`s with lane, years, title, place; the apprenticeship one stop across both lanes with
its company and school `parts`; `alongside` sentences for the overlaps; the Master's stop
`thesis`), checked at build time (seven stops, oldest first, 1 / 4 / 2 by lane, one thesis link,
the same in both locales). Markup: one chronological `ol.career-stops[aria-label]`, each `li` with
its lane as text (visually hidden "Work:" / "Education:"), its years as `<time>` (`2021–today`),
title and place, and where it overlaps the other lane an "alongside …" sentence; lane labels, the
overlap bands and the axis are `aria-hidden`. CSS grid on year tracks (`--track`; the list and the
axis are subgrids): from 1024 a horizontal axis 2004 → today (Martian Mono ticks every two years),
Work above Education, each card as wide as its years and at least its title's longest word (a
short card reaches into the empty years after it); below 1024 a vertical axis on the left with
two narrow lanes, each year a row of at least 28 px, each card at least 72 px, text at least
14 px, no horizontal scroll at 360 and 390 px. The apprenticeship is one card across both lanes
with a dashed seam; overlaps get a faint glacier band across both lanes and a small "alongside"
label. The cards are dealt in order from a deck at the axis's start (`deal.deck`: 70 ms apart,
the `land` spring as `linear()`). The Master's card is a link ("Thesis overview", the whole card
its target) to `/about/thesis` with type `play`, sharing the view-transition name `thesis-card`
with the thesis hero (R8). Removed: the dealt line and its stack, the scroll-snap strip, the
`left` deal mode, `deal.line`, `deal.left`.

**R8. The master's thesis overview** (first draft): `/<locale>/about/thesis` (static, both
locales; there is no sitemap). Glacier: the table store gives it the table field in the glacier
tint (`identity: 'glacier', spread: 0, topo: 0`), never the contour map; the pre-paint script marks
About alone with `data-about-map` (the contour layer's first paint), so `data-field="glacier"` is
just a colour. Content in `content/<locale>/thesis.ts` (typed `Thesis`, counts checked: five meta
pairs, four values, two questions, four insights, two answers, three next steps), with the
consent note in both files: publishing internal survey figures and naming the employer needs the
employer's consent, so it stays anonymous ("a Swiss software company") and the author is not named.
German: Swiss Standard German (the sentence about the letter itself says "Eszett", since German
strings may not contain it). Template: the case study's (`ThesisHero` in the case hero's layout,
`detail-facts`, `Section` chapters with `NumeralBreaker`s, `Minimap`). Reading layers: hero, the
one-line answer and the facts (30 s); each chapter's lead and the dealt row of four insight cards
(the How I work cards' `deal` reveal, no pinning; 3 min); the chapters in full (7 min). Drawings
(the site's line style, drawn by the `draw` reveal, horizontal and vertical layouts):
`ResearchSequence` (a), `BurnoutProcess` (b, the data gap tinted before the only signal),
`StakeholderMap` (c), `PrototypeFunctions` (d), `TestIterations` (e). Three `ImageSlot`s (the
offset image's frame, 3:2 / 4:3, a faint outline and their label, a `TODO(owner)` comment in the
page): the knowledge base and the check-in in 06, the round-2 source labels in 07. Reached from
the Master's card in About's timeline (type `play`; the card and the hero frame share
`thesis-card`, the hero only while in view) and from a link below About's projects
(`about.projects.thesis`); it ends with "Back to About" to `/about#timeline` (type `return`).

**R9. Carried over.** (a) The idle note renders only with at least 24 px between its top and the
last "What I bring" item (`idle.clearance`, measured after the handwriting loads and on resize; at
390 × 800, 360 × 740 and 390 × 844 it is skipped, from 430 × 932 and on desktop it shows). (b) Logo
↔ Back with the final logo: R3, checked both ways on the case studies; the thesis page keeps the
logo (it is not a card page) and morphs with the timeline card instead.

---

## Card play (P1–P8)

The play, return and switch choreography rebuilt as "the card hits the table", applied by one
session. Earlier decisions it changes are marked above; the reference sections below describe the
new state. Every value is a token in `cardPlay` (`src/motion/tokens.ts`; desktop `play` from
1024 px, `mobilePlay` below), CSS reads them as custom properties (`--play-*`, `--return-*`,
`--rail-*`, `--loading-*`, `--reduced-*`, emitted by `motionCss()`, the phone values under
`@media (max-width: 1023.98px)`).

**P1. Tokens.** `cardPlay.play` / `.mobilePlay`: `press` (90 / 80 ms, `cubic-bezier(0.33,1,0.68,1)`,
scale 0.97), `haptic` (press 8 ms, impact 12 ms), `lift` (110 ms, outQuint, −16 px, ×1.04; none on
phones), `flight` (300 / 320 ms: x `cubic-bezier(0.45,0,0.25,1)`, y `cubic-bezier(0.2,0.6,0.35,1)`,
rotate and tilt `cubic-bezier(0.3,0,0.2,1)` to 0; phones start −3° further), `rise` (180 / 220 ms to
1.06 / 1.04, outQuint), `drop` (120 / 100 ms to 1.00, `cubic-bezier(0.55,0,0.85,0.35)`), `shadow`
(lifted `0 28px 56px -12px rgba(0,0,0,.55)` at `rest` 0.5 in the hand, contact `0 2px 4px
rgba(0,0,0,.5)` spreading 4 → 10 px over 80 ms ease-out into `settled`), `hold` (60 / 50 ms),
`navigate` (560 / 450 ms after the press), `card` (212 × 296; phones `min(54vw, 240px)` at 63:88),
`landing` (the viewport's centre, 46% / 44% of its height), `ring` (700 / 600 ms, outExpo,
0.14 → 0), `morph` (600 / 520 ms, `cubic-bezier(0.3,0,0,1)`; band +20, title +40 / +30; the old
face gone after 150 / 130; band out +60 / 240 (+50 / 200), image in +120 / 300 (+100 / 260), title
out +40 / 200 (+30 / 180), h1 in +140 / 240 (+120 / 220); the frame dissolves from +460 / +400 over
260 / 220 ms, `cubic-bezier(0,0,0.2,1)`; the page left exits 180 ms, ease-in, 8 px down), `hero`
(label +420 / +360, summary +500 / +430, 240 / 220 ms, outQuint, 8 / 6 px; meta pairs from +620 /
+540, 100 / 80 ms apart, each rule 240 ms, label +60 and value +120, 200 ms each), `rail` (phones).
`cardPlay.return` (details out 160 ms, the frame back over 140 ms, navigate at 160 ms; morph 520 ms
`cubic-bezier(0.5,0,0.1,1)`; the hand face in at +260; home content at +200 over 280 ms),
`cardPlay.switch` (hero dim 0.3; the left card re-enters at +300 / +260, 12 px), `cardPlay.loading`
(cue 350 ms, breath 1.6 s ±6%, label 1.5 s, long wait 12 s, image fade 320 ms, offline: hold 200 ms,
back 420 ms `cubic-bezier(0.5,0,0.1,1)`, message 5 s), `cardPlay.reduced` (out 120 ms, in 200 ms,
bloom 300 ms). `spring.gap` (bounce 0, visualDuration 0.28, Motion's own conversion) moves the
hand's siblings; `field.play.dprMax` 1.5. Removed: `ease.zoom` (0.76,0,0.24,1), `ease.return`,
`duration.{press, gap, zoom, return, switchIn, switchDelay, exitPlay, exitReturn, exitSwitch,
liftTimeout, sheet}`, `at.{navigate, switchNavigate, detail}`, `distance.{exitPlay, exitReturn,
exitSwitch, landY, returnDeal}`, `angle.lift`, `hand.{hero, liftScale, pressScale, sheet, scrim}`,
`reveal.zoomLanded`, `tiers.*.vt`, `--hero-w`, `--z-sheet`; `duration.navFade` (200 ms) times plain
page fades.

**P2. Stage 1: the table card** (`src/motion/play.ts`, `src/motion/flight.ts`,
`src/components/hand/table-card.tsx`). `play(id, href, source?)` sets the flight store; the hand
renders a portal clone of the card face (`.table-card`, aria-hidden) laid out at the table size at
the landing point and FLIP-inverted to the source (a fan card: its centre, size, rotation and the
fan's 8° tilt; a rail edge: its width, the clone's top on the edge's top; the Next project card's
face). Four nested layers (`[data-layer="x|y|pose|scale"]`) each carry one channel as a Motion
(`motion/mini`, WAAPI) animation, so x and y run on their own curves (the arc) and all of it is
compositor work; the shadows are opacity layers inside the named frame. The source is hidden on
the next frame (`visibility`). At contact (the scale's end): identity transform (the snapshot is
rasterised at full size), the contact shadow spreads, `navigator.vibrate(12)` where it exists, the
field rings and blooms from the landing point (`table.play(…, ring)`); after the hold, navigate
(`play` or `switch`). The view-transition names move from the hand card to the clone for the
flight (`CardFace standDown`); the clone unmounts in the commit of the new route, which pairs its
names with the page's. A second play while one flies, waits or returns is ignored; Escape calls it
off (`cancelPlay()`), a route change settles it (`settlePlay()`). Siblings close the gap on
`spring.gap` and open around the ghost again.

**P3. Stage 2: the three-part morph** (`src/styles/view-transitions.css`, `case-hero.tsx`).
Names: `card-<slug>` (the hand face / clone ↔ the page's `.play-frame`, fixed, full screen, the
face's fill and 1 px accent edge), `card-band-<slug>` (the face's band ↔ `[data-hero-target]`),
`card-title-<slug>` (the face's title ↔ the h1), plus the chrome's and the root. Classes, not
types (Firefox 144+ has `view-transition-class`, not types): the page's maps give `vt-play` (play,
switch) or `vt-morph vt-in` (no type: back / forward), the hand's maps `vt-return` or `vt-morph
vt-out`, each with `vt-frame` / `vt-band` / `vt-title`; About's Master's card and the thesis hero
use `thesisShare` (`vt-morph` alone). Stacking: page groups, the card's parts (z 1–3), the hand and
rail (10), the parts on their way back into the hand (11–13), the header (20); the DOM keeps the
same order (`--z-*` in tokens.css). The frame's new image holds opaque until the DOM dissolve has
ended (`--play-hold`), so the transition (and its order) lasts as long as the dissolve. The old
title and band and the new hand face, band and title keep their own size (never shown scaled up).
The hero's label, summary and meta pairs are not in the transition: the reveal engine starts them
from the transition's `ready` (V), or from mount without one. After `finished` the h1 has focus,
the page at its top. Return: `html[data-returning]` fades the details and brings the frame back
(above the hand, with the hero's image and title) before navigating; the hand card that came back
lies on top of its neighbours (`data-returned`) until the pointer returns. Switch: the open hero
dims during the flight (`html[data-switching]`), its names stand down, its page exits and its card
re-enters its slot. Browser back / forward is replayed without a type: the default `vt-morph`.

**P4. Slow network and offline** (`src/motion/use-play-pending.ts`,
`src/components/hand/play-status.tsx`). `<Link>` prefetch stays "auto" (never `prefetch={true}`:
in Next 16 static exports it fetches HTML instead of the `__next.*.txt` segments and leaves the
link dead); the play also prefetches on pointerenter, focus and pointerdown. The press warms the
hero image (a detached `<picture>` with the page's own sources and `heroSizes`,
`src/lib/hero-images.ts`, then `decode()`); the hero `<img>` has no `onLoad` prop (React then
stops waiting for it before the transition), it waits on the frame's identity colour and fades in
once decoded (`data-loaded`, a ref listener). The pending signal is set when navigate is called
and cleared in the hand's layout effect when the route changes: after 350 ms the field breathes
around the resting card, after 1.5 s a plain "Loading…" (role="status") shows under it, after 12 s
"Still loading…". Offline at the impact: no navigation (Next 16.4.5 answers a failed RSC fetch
with a full page load: `fetchServerResponse` logs "Falling back to browser navigation"); the card
flies back, the bloom recedes (`table.cancelPlay()`), the message shows near the hand for 5 s.
Going offline while waiting shows it too. Three keys per locale: `hand.labels.loading`,
`stillLoading`, `offline`.

**P5. One-tap rail** (phones off home). `nav.hand-rail[aria-label]` of four `<Link>`s
(`a.rail-card[data-play]`), each a quarter of the width and the full 48 px height,
`touch-action: manipulation`, `aria-current="page"` on the open card (lower, dimmed, an accent
line). The press shows from pointerdown and is called off by pointercancel or more than 10 px of
movement; the play runs on click (the browser suppresses it once it takes over a scroll); Enter
runs the same path. The open card's edge scrolls its page to the top (at once under reduced
motion). The bottom sheet (`#hand-sheet` popover), `table.sheetOpen` / `setSheet`,
`data-sheet-moving`, `duration.sheet`, `hand.sheet` / `scrim` and the sheet's CSS are gone; the
fan is a `nav` of its own and the hand's root a `div.hand` (it holds the two navs; one shows).

**P6. The field's answer** (`shader.ts`, `field-engine.ts`). Uniforms `uImpact`, `uRing`
(radius, strength, width), `uRingCol`, `uWait`: one soft ring in the card's colour from the
landing point (its strength falls on the clock), the bloom from the same point, and the waiting
breath driven by the pending signal. During a play the field draws every frame and never above
1.5 DPR (About's morph included). Still not pointer-reactive. Reduced: the bloom is a 300 ms colour
fade, no ring, no breath.

**P7. Reduced motion.** No clone, no flight, no shared morph: the page cross-fades as one (old out
120 ms, new in 200 ms; the card's groups hold their old place, then show the new one), the field's
colour fades over 300 ms, the hero's details are final at once and focus moves to the h1. Haptics
stay.

**P8. Chapter 05** (`scenes/deal-scene.ts`, Section's `stage`). From 1024 px wide and
`deal.minPinnedHeight` (760) tall, the chapter's label, numeral and h2 ride in the sticky stage
above the dealt cards; head and cards are pinned through the 180svh track and leave together. The
stage is a subgrid with a fixed head row (`deal.pinned.head`, 200 px: the label, the numeral and
the h2 beside it) and a fixed canvas row, clear of the hand's reserve, sized on mount and on width
changes only (debounced ResizeObserver), never from the head or the scroll; cards taller than it
scale to fit, and a fit below `deal.pinned.minScale` (0.72) keeps the static row. The numeral's
reveal is held (`data-reveal-hold`, `releaseReveal()`) until the stage pins, then it draws once.
Below the gate, below 1024 px or under reduced motion: the standard chapter head and a static row.

## Feedback round 4

Small header changes, applied by one session (plan in `docs/backlog.md`, report in
`docs/handoff/feedback-4.md`). Items T1–T5. Earlier decisions it changes are marked above; the
reference sections below describe the new state.

**T1. The logo's hover** (supersedes R3's ±1°): hover and focus-visible open the fan ±4°, part
the cards by 1.5 units and lift them (the back card 0.5, the front card 1.5 units, 40 ms later),
360 ms `ease.move`; closing, both together. Both states use the same transform function list
(`translate() rotate()`), so each part interpolates on its own. Tokens: `logo.hover` (`dur`,
`deg`, `spread`, `lift.back` / `lift.front`, `front`). Reduced: nothing moves (as before).

**T2. The F card's gradient.** The front card is painted with an SVG `linearGradient` (the card's
corner to its far corner, stops at 0, 0.5, 1, `[data-logo-stop]`) instead of `--accent`. Four
gradients, one per card, from the four cards' colours: the card's glow, its accent and the accent
of the next card round the colour wheel (`logoGradients` in `src/design/palette.ts`: ember → saffron,
saffron → grove, grove → tide, tide → ember). `logoGradientCss()` (injected in the root layout)
gives `:root` the first and each `html[data-logo-gradient="<name>"]` its three colours as
`--logo-a`, `--logo-b`, `--logo-c`. The pre-paint script picks one per page load at random among
the ones the last load did not show (localStorage `logo-gradient`, `LOGO_GRADIENT_KEY`), so every
load and reload shows another; client navigations and language switches keep it. The flow: each
stop runs through a → b → c → a in one `logo.flow.dur` loop (24 s, `--logo-flow`, linear), the
stops a third of the loop apart, so the colours travel slowly along the card (CSS keyframes on
`stop-color` in `header.module.css`); `logo.tsx` sets their start time to the page clock (0) on
mount, so a remounted logo carries on in phase. Reduced: no animation, the gradient in its own
order. This is the one thing besides the field that moves at rest.

**T3. The switcher's chip.** The codes (`DE`, `EN`) in Martian Mono, 0.75 rem, in two 44 px
segments; the active one (`aria-current="page"`) sits on a face-up chip (36 × 28 px, the text
colour, ink letters), the other is muted and shows a hairline chip and the text colour on hover
and focus. The chip is one element (`[class*="chip"]` inside `[data-locale-switcher]`, aria-hidden)
at `--active` × `--seg` (`--active`: the locale's index, inline). A header mounted by a language
switch (`html[data-locale-switch]` set at mount) marks the switcher `data-arrived` in a layout
effect: the chip slides in from the other segment (`duration.chip`, 360 ms, outQuint) while the
two codes trade colours between 30% and 70% of it. The switcher has its own view-transition name,
`locale-switcher`, live and not animated in every transition (like `home-slot`), so the switch's
cross-fade never shows two chips. Reduced: no slide. The "·" between the codes is gone.

**T4. The tray.** The header's right side is one capsule (`.end::before`: 36 px high inside the
44 px targets, a 1 px edge in `--chip-line` (text 13%) on `--chip-fill` (ink field 62%), fully
rounded): About (no resting underline inside the tray; it draws on hover and stays drawn as the
current page; superseded by K1–K2: a standalone text link in the page's colour), a 16 px hairline, then the switcher, whose chip sits 4 px inside the capsule's
end. Back's chip (T5) speaks the same language. The tray's width follows About's label, so during
a language switch its edge cross-fades with the header.

**T5. Back stays, and its hover.** On card pages (`a[data-slot-mode="back"]`), when the header
leaves on a scroll down the slot moves down by `--header-h` in step with it (the same duration and
curve, `will-change: translate`), so it holds its place (checked: the arrow does not move a
fraction of a pixel through the slide), keeps taking clicks (`pointer-events: auto`) and its chip
comes up as a floating backdrop (the ink field at 80%, the tray's edge). Reduced: the header's
other parts fade, Back does not; its chip fades in. Hover and focus-visible: the arrow pulls back
(the head 3 px left, the shaft stretching after it, `transform`, so the morph's delayed `scale`
and `opacity` never hold it back), the letters roll up one after another, each replaced by its
copy from below (`duration.backPull` 420 ms, `stagger.letters` 25 ms, outQuint; the label is read
once from a visually hidden copy, the rolling letters are aria-hidden), and the chip draws in
(a faint text-colour fill, from 92%, `duration.chip`); a press scales Back to 0.96
(`duration.fast`). Reduced: the chip fades, nothing moves.

## Text links (K1–K4)

One treatment for every text link (`.link`, `src/app/globals.css`), applied by one session.

**K1. The marker.** At rest a block sits behind the lower part of the text: as wide as the text,
shifted 0.4em right (it overhangs the end by 0.4em), from 0.3em above the baseline to 0.5em below
it, in a deeper shade of the page's identity. Hover (`@media (hover: hover)`, no sticky hover on
touch) and `:focus-visible` (the focus ring stays): in one move it slides left and down and
collapses into the underline (aligned with the text, top 0.15em below the baseline, 0.12em thick,
at least 2px) in the identity's accent; out again the exact reverse. One registered number,
`--lk-p` (0 block, 1 line), drives position, size and colour. Every line fragment gets its own
block and line (`box-decoration-break: clone`). Sizes in em; the marker is anchored to the baseline
through each family's descent (`--font-descent` in `type.css`: Hanken 0.303, Martian Mono 0.2,
Bricolage 0.27, declared next to every `font-family` there). Link text is `--text`, never changes
colour and never moves. Tokens: `duration.linkIn` 240 ms, `linkOut` 160 ms, `linkMarkIn` 160 ms,
`linkMarkOut` 100 ms, `ease.link` (`cubic-bezier(0.33,1,0.68,1)`); reduced: instant. Forced
colours: an underline.

**K2. Colour.** Each `[data-identity]` scope gives `--link-a / -b / -c` (the line's stops) and
`--link-rest` (the block): the accent, and the glow mixed toward the field in OKLab by
`linkMark.mix` (`palette.ts`: ember 25%, tide 28%, grove 39%, saffron 49%, glacier 5%; `--text`
over the block 4.77 / 4.77 / 4.79 / 4.72 / 5.23 : 1). Ink pages (home, 404) follow the logo: the
page load's `--logo-a / -b / -c` as a gradient along the link, flowing with the logo's front card
(`@keyframes link-flow`, one `--logo-flow` loop; `--link-flow` names it on ink scopes; the
pre-paint script sets every `link-flow` animation's start to the page clock as it starts, as
`logo.tsx` does for the logo); the block takes each colour to OKLCH lightness `linkMark.inkDepth`
0.49 with chroma and hue kept (4.92–5.70 : 1 over the whole flow; without relative colours a 52%
mix toward the ink field, at least 4.90 : 1). Reduced: the gradient holds still. Links outside the
page (the header's About, the footer's small print) take the identity of the page shown:
`identityCss()` sets `:root`'s link colours from `:root:has(#main > [data-identity])`, the page's
own scope (never the hand's cards), so they follow every navigation, card play, Back, switch and
language switch.

**K3. Variants.** `.link-standalone` (nothing after it on its line: the header's About, the
projects' thesis link, the thesis page's way back, the timeline's Master's card, the contact
links, the email): a solid right-pointing triangle, 0.45em tall, 0.3em after the last letter,
centred on the x-height, in the text colour, fades in with the line (never moves; the line does
not run under it); its room (0.75em) is reserved at rest, and a word joiner keeps it with the last
word. Other links (photo credits, the terrain credit) keep their spacing in the sentence (a
negative margin cancels the overhang). `.link-vertical`: the same with the axes swapped (the
terrain credit along About's left edge). The current page (`aria-current="page"`): the line in the
accent, no block, no triangle, no hover. The class sits on the `<a>` or on a span directly inside
it (the `<a>` is the target and carries the focus ring: the header's About, the Master's card).
Typed arrows the triangle replaces are gone ("Thesis overview →"). The 404 page's way home is a
button, not a text link.

**K4. The email** (About, 08 Contact) is a standalone text link set at h2 size; the `rule` reveal
around it (`p[data-reveal-marker]`) no longer draws a separate `<hr>`: the text shows from the
start and its block draws in from the left (`--ue` 0 → 1, inherited; `reveal.css`, `kinds.ts`).

---

## Ownership (Wave 1)

Wave 1 is merged; the table is kept as the default split for future parallel waves.

```text
- Foundation (read-only for everyone in Wave 1): docs/contracts.md, CLAUDE.md, src/design/**, src/styles/layout.css, src/styles/type.css, tokens.ts, content/schema.ts, src/components/hand/**, header.tsx structure, table-store.ts.
- Layout & Pages: app/** pages, src/components/layout/**, detail-page.tsx, case-hero.tsx, next-project.tsx, src/styles/pages/**.
- Motion: src/motion/** except tokens.ts, src/components/reveals.tsx, src/components/reading-hairline.tsx, src/styles/reveal.css, src/styles/hand.css, src/components/background/**, src/eggs/** behaviour, scripts/smoke.mjs.
- Illustrations: src/components/illustrations/**.
- Content & Images: content/** except schema.ts, scripts/images/**, public/images/**, src/components/picture.tsx.
```

Paths the table does not name, and how to read the short names in it:

| Path | Owner |
| --- | --- |
| `tokens.ts` = `src/motion/tokens.ts`; `table-store.ts` = `src/motion/table-store.ts` | Foundation |
| `header.tsx structure` = the markup of `src/components/header.tsx` (links, order, the hairline mount) | Foundation |
| `src/components/header.module.css` (header look, not markup) | Layout & Pages |
| `src/lib/**` (`content.ts`, `hand-data.ts`, `format.ts`, `cards.ts`, `site.ts`, `cx.ts`), `src/styles/tokens.css`, `next.config.ts`, `tsconfig*.json`, `.github/**`, `docs/art-direction.md` | Foundation |
| `content/<locale>/hand.ts`, `content/<locale>/site.ts` (slim modules, D7), `content/deck.ts` | Content & Images, under one rule: they import no page text |
| `src/app/**` (all of it: `layout.tsx`, `globals.css`, `fonts.ts`, routes) | Layout & Pages |
| `src/components/page-title.tsx`, `page-transition.tsx`, `site-footer.*`, `footer-shell.tsx`, `about-small-print.tsx` | Layout & Pages |
| `src/components/weight-text.tsx`, `play-link.tsx`, `route-focus.tsx`, `live-region.tsx`, `reading-hairline.module.css`, `src/styles/view-transitions.css`, `field.css`, `eggs.css` | Motion |
| `src/components/picture.css`, `public/contour-bg/**` (the old password page's SVGs, added by hand, unchanged) | Content & Images |
| `docs/handoff/<agent>.md` | that agent |
| `README.md`, `package.json`, `package-lock.json`, `scripts/{budget,audit,vitals,lighthouse,serve-static}.mjs` | Integration (Wave 1 may run them, not change them) |

`src/app/globals.css` already imports every session's CSS entry point once (see its header), so no
session other than Layout needs to touch it.

Responsibilities the decisions place (no path changes owner):

- D1: `hand.tsx` (Foundation) and the pre-paint line in `src/motion/preferences.ts` (Motion keeps it).
- D3: `data-hero-target` on the hero frame: Layout (`heroTarget()` is gone, P2).
- D4: Layout writes only `<Reveal>`; Motion implements and removes the legacy kinds; Integration
  deletes leftovers.
- D5: DealRow's position label: Layout (not Motion).
- D7: the egg components' copy props (`WorkshopDraw`, `OnTheTable`): Motion owns the components,
  Layout passes the props from the pages.
- D8: deleting obsolete `.mdx` / JSON content and `adapters.ts`: Content & Images.

---

## File map

```
docs/
  contracts.md                 this file
  art-direction.md             "The Table": the brief every session designs to
  backlog.md                   known follow-ups (card transition, final logo, intro timings)
  handoff/README.md            how each Wave 1 session reports; <agent>.md per session (feedback-1.md, i18n.md)
content/
  schema.ts                    types for all content (Foundation), the same for every locale
  index.ts                     the typed entry point (server): contents = { de, en } satisfies Record<Locale, Content>
src/content/generated/numerals.ts  generated by scripts/build-numerals.mjs (chapter numeral outlines, R6)
scripts/build-numerals.mjs     runs before next build: Bricolage's digits as contours (fontkit, scripts/assets/*.ttf + OFL)
  deck.ts                      the four cards without text: order, identity, cardPath (L5)
  de/, en/                     one content set per locale (L5): index.ts (Content), hand.ts and site.ts
                               (slim, D7), cases/*.ts, pages/*.ts, illustrations.ts; de/images.ts (alt text)
  images.ts                    image registry used by <Picture> (generated by scripts/images/fetch-and-build.mjs)
scripts/images/                manifest.mjs (photos, alt, credits, crops), fetch-and-build.mjs, check.mjs
scripts/i18n-pages.mjs         after next build: <html lang> per page, dist/index.html (root), dist/404.html (L3, L4)
scripts/load-ts.mjs            loads content and src/lib TypeScript from Node scripts (smoke, check, i18n-pages)
src/design/
  palette.ts                   colour identities (ink, ember, tide, grove, saffron, glacier)
  layout.ts                    typed mirror of src/styles/layout.css
  type.ts                      typed mirror of the scale in src/styles/type.css
src/styles/
  tokens.css                   surfaces, legacy sizes, radii, hand geometry, layers
  layout.css                   Spread grid, spacing, header height, hand reserve, grid utilities
  type.css                     type scale tokens and .t-* classes, base type
  reveal.css, hand.css, view-transitions.css, field.css, eggs.css      (Motion)
  pages/detail.css, pages/pages.css                                     (Layout)
src/motion/
  tokens.ts                    motion tokens (Foundation; every motion value lives here, I3)
  scenes/deal-scene.ts         useDealScene (Motion)
  table-store.ts               the table store (Foundation)
  reveal.ts                    the reveal engine; kinds.ts (the ten kinds), jobs.ts (scheduler),
                               first-load.ts, split.ts (Motion+ splitText), deal.ts, choreography.ts
                               (tier helpers only)
  play.ts, flight.ts (the card in flight), use-play-pending.ts (the wait for the next page),
  transitions.ts, preferences.ts, use-tier.ts, view-transition.ts (Motion)
  header-scroll.ts             the header leaving on a scroll down, returning on a scroll up (N1)
  locale-switch.ts             the language switch: store, reading position, focus, settle (L7)
src/components/
  hand/                        hand.tsx, card-face.tsx, table-card.tsx (the played card's clone),
                               play-status.tsx (the play's status line) (Foundation)
  layout/                      SectionIndex, NumeralBreaker, OffsetImage, MetaPairs, Scoreboard,
                               DealRow, WorkshopRow, MarginNote, Minimap (+ MinimapObserver),
                               Section, use-deal-position.ts, layout.css, index.ts (Layout)
  illustrations/               13 drawings, frame.tsx (kit), geometry.ts, badges.tsx, types.ts,
                               illustration.tsx, index.ts, illustrations.css, README.md (Illustrations)
  reveals.tsx                  <Reveals/>, <Reveal>, <FirstLoadSequence> (Motion)
  reading-hairline.tsx         <ReadingHairline/> (Motion), mounted in header.tsx
  picture.tsx                  <Picture> (Content & Images)
  header.tsx                   header: home slot (logo / Back morph, Back stays), the tray (About, language switcher), hairline
  locale-sync.tsx              <html lang> on the client; settles a language switch (L3, L7)
  router-bridge.tsx            root layout: registerNavigate + the back / forward replay (L2)
  site-footer.tsx, footer-shell.tsx, about-small-print.tsx   footer (none on home; About's small print)
  background/                  background-field.tsx (with About's SVG layer and vignette), field-engine.ts,
                               field-gl.ts, shader.ts, field-css.ts, tracks.ts, oklab.ts, contours.ts (the
                               SVGs' drawing and contourQuery), contour-layer.ts (the SVG layer's opacity
                               and drift), terrain.ts (generated: the heightmap's metadata, R1)
  detail-page.tsx, case-hero.tsx, next-project.tsx (Layout)
src/eggs/                      registry.ts, eggs.tsx, hand-eggs.ts, idle-hint.tsx, workshop-draw.tsx,
                               on-the-table.tsx, discard.ts, haptics.ts
public/contour-bg/             contours.svg, contours-200.svg (About's contour background, B1)
public/terrain/field.webp      About's region heightmap for the shader morph (R1)
scripts/terrain/build-field.py builds it (and terrain.ts) from the portfolio repository's master (R1)
src/lib/
  i18n.ts                      locales, Locale, splitPath, pagePath, localeHref, LOCALE_KEY, pickLocaleScript (L1)
  content.ts                   server: getContent() / contentFor(locale) with hand cards and getCaseStudy,
                               count and copy checks for every locale (+ format helpers)
  request-locale.ts            server: setRequestLocale / requestLocale (the render's locale, React cache)
  metadata.ts                  server: pageAlternates (canonical, hreflang, x-default)
  chrome.tsx                   client: ChromeProvider, useChrome(), activeChrome() (the active locale's chrome, D7)
  hero-images.ts               server: the case heroes' sources and heroSizes (warmed on a press, P4)
  hand-data.ts                 client-safe: buildChrome (handCards, cardById, cardForPath, nextCard, href),
                               cardIdForPath, identityOf, cardIds (language-free)
  format.ts                    pad2, cardNumber, fill (no imports)
  site.ts                      basePath, withBase(); siteOrigin / absoluteUrl() (server, from SITE_URL)
  cx.ts                        class-name join
```

---

## Layout tokens

Source: `src/styles/layout.css`. Typed mirror: `src/design/layout.ts` (`breakpoints`, `media`,
`grid`, `baseline`, `sectionSpace`, `headerHeight`, `handReserve`, `gridClasses`).

**Breakpoints** (min-width): `sm` 640, `md` 1024, `lg` 1440, `marginNotes` 1680 (CSS
`--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`, `--breakpoint-margin-notes`; media
queries cannot read custom properties, so the `@media` rules repeat the values). Mobile first.
The hand switches from the rail (phones off home) to the desktop fan at `md` (1024).

| Range | Columns | Margin | Gutter | Notes |
| --- | --- | --- | --- | --- |
| < 640 | 4 | `clamp(20px, 5.3vw, 28px)` | 12 px | everything stacks |
| 640–1023 | 8 | 32 px | 16 px | everything stacks |
| 1024–1439 | 12 | 48 px | 24 px | index in columns 1–3, content in 4–11 |
| ≥ 1440 | 12 × max 96 px | ≥ 48 px | 24 px | `[full-start] minmax(48px,1fr) [content-start] repeat(12, minmax(0,96px)) [content-end] minmax(48px,1fr) [full-end]` |
| ≥ 1680 | as ≥ 1440 | | | margin notes in column 12 + the right outer track (D2) |

"Margin" is the distance from the viewport edge to the first column. CSS `column-gap` also sits
between the outer track and column 1, so the outer tracks are `--grid-edge` = margin − gutter
(at ≥ 1440: `minmax(var(--grid-edge), 1fr)`); the visible margin is exactly the token.

**Custom properties**

| Property | Value |
| --- | --- |
| `--grid-columns` | 4 / 8 / 12 |
| `--grid-margin` | `clamp(20px, 5.3vw, 28px)` / 32px / 48px |
| `--grid-gutter` | 12px / 16px / 24px |
| `--grid-column-max` | 96px (≥ 1440) |
| `--grid-edge` | `calc(var(--grid-margin) - var(--grid-gutter))` (outer track) |
| `--baseline` | 4px (vertical rhythm unit) |
| `--space-s` / `--space-m` / `--space-l` | 64 / 96 / 144 px below 1024; 96 / 160 / 240 px from 1024 |
| `--header-h` | 64px |
| `--hand-reserve` | from 1024: `var(--hand-reserve-desktop)` = 176px on home, `var(--hand-reserve-collapsed)` = 120px under `:root[data-hand="collapsed"]` (every other route, D1); below 1024: `calc(48px rail + env(safe-area-inset-bottom) + 16px)` |
| `--breakpoint-sm` / `-md` / `-lg` / `-margin-notes` | 640px / 1024px / 1440px / 1680px |
| `--gutter` | legacy alias of `--grid-margin` (older components pad with it) |

The last block on every page (the site footer) pads `var(--hand-reserve)` at the bottom so
nothing hides under the hand; home has no footer and pads itself with the hand's visible height
(H1). `data-hand="collapsed"` is set on every route except home (D1).

**Grid utilities** (use these; do not re-declare the grid in pages):

| Class | Placement |
| --- | --- |
| `.spread-grid` | the grid itself: `display: grid` with named lines `full-start`, `content-start`, `content-end`, `full-end` and the column gap |
| `.col-full` | `full-start / full-end` (edge to edge) |
| `.col-wide` | `content-start / content-end` (all columns) |
| `.col-index` | all columns below 1024; columns 1–3 (`2 / 5`) from 1024 |
| `.col-content` | all columns below 1024; columns 4–11 (`5 / 13`) from 1024 |
| `.col-margin` | like `.col-content` below 1680 (inline, below the text); from 1680 column 12 + the right outer track (`13 / full-end`) (D2) |

Each section is its own `.spread-grid` (full width), so nested blocks line up without subgrid.
Below 1024 every `.col-*` stacks in source order.

---

## Type tokens

Source: `src/styles/type.css`. Typed mirror: `src/design/type.ts` (`type`, `fluid()`,
`typeClasses`). Sizes are fluid between a 390 px and a 1440 px viewport (`clamp()` in rem, so
they follow the browser's font size). Fonts: `--font-display` (Bricolage Grotesque, opsz 12–96,
wght 200–800), `--font-text` (Hanken Grotesk), `--font-mono` (Martian Mono).

| Style | Class | Family / weight | opsz | Size 390 → 1440 | Line height | Tracking |
| --- | --- | --- | --- | --- | --- | --- |
| label | `.t-label` | Martian Mono 500, uppercase, tabular | – | 11 → 12 px | 16 px | +0.08em |
| body | `.t-body` | Hanken Grotesk 400, max 62ch | – | 17 → 19 px | 28 px | – |
| lead | `.t-lead` | Hanken Grotesk 400 | – | 21 → 28 px | 32 px | – |
| h3 | `.t-h3` | Bricolage 600 | 24 | 22 → 32 px | 1.15 | −0.01em |
| h2 | `.t-h2` | Bricolage 600 | 72 | 36 → 72 px | 1.04 | −0.02em |
| display | `.t-display` | Bricolage 700 | 96 | 56 → 168 px | 0.92 | −0.03em |
| numeral | `.t-numeral` | Bricolage 300, lining tabular | 96 | 88 → 240 px | 0.8 | −0.04em |
| numeral outline | `.t-numeral-outline` (with `.t-numeral`) | transparent fill, 1 px text stroke in `currentColor` (chapter numerals are drawn as SVG outlines instead, R6) | | | | |

Custom properties, for each style `S` in `label, body, lead, h3, h2, display, numeral`:
`--type-S-size`, `--type-S-leading`, `--type-S-weight`, plus `--type-label-tracking`,
`--type-body-measure`, `--type-{h3,h2,display,numeral}-opsz`,
`--type-{h3,h2,display,numeral}-tracking`, `--type-numeral-stroke` (1px).

The display classes set `--wght` and `--opsz`, which weight-animated text (`WeightText`, the
headline and h2 reveals) interpolates; the motion tokens `weight.h1`, `weight.h2`, `weight.h3`,
`opsz.end`, `opsz.h2`, `opsz.h3` read from `src/design/type.ts`, so animated headlines settle on
the scale. `body` uses the body size; legacy size tokens (`--text-sm`, `--text-lg`, `--text-xl`,
`--text-2xl`, `--text-display`, `--text-hero`, `--text-page`) remain in `tokens.css` for existing
components and may be retired by Layout as pages move to the scale.

---

## Motion tokens

Source: `src/motion/tokens.ts` (TypeScript constants, seconds), emitted as CSS custom properties
by `motionCss()` into `<head>` (the reduced tier under `:root[data-motion="reduced"]` and
`@media (prefers-reduced-motion: reduce)`). Springs are converted to CSS `linear()` by
`springCss()`. No bounce, elastic or overshoot anywhere: the béziers stay in [0, 1] and every
spring is critically damped.

**The scale (use for all new work)**

| Token (TS) | CSS | Value |
| --- | --- | --- |
| `dur.xs` / `s` / `m` / `l` / `xl` | `--dur-xs` … `--dur-xl` | 160 / 240 / 420 / 640 / 900 ms (full) |
| `ease.outExpo` | `--ease-out-expo` | `cubic-bezier(0.16,1,0.3,1)` |
| `ease.outQuint` | `--ease-out-quint` | `cubic-bezier(0.22,1,0.36,1)` |
| `ease.inOut` | `--ease-in-out` | `cubic-bezier(0.65,0,0.35,1)` |
| `stagger.words` | `--stagger-words` | 70 ms |
| `stagger.lines` | `--stagger-lines` | 60 ms |
| `stagger.items` | `--stagger-items` | 50 ms |
| `stagger.cards` | `--stagger-cards` | 80 ms |
| `stagger.svgGroups` | `--stagger-svg-groups` | 120 ms |
| `motionScale` | `--motion-scale` | full 1, reduced 0 |
| `reducedCrossfade` | `--dur-reduced` | 160 ms |
| `durFor(tier, step)` | – | full: as is; reduced: always 160 ms |

Two tiers (M1): **full** as listed; **reduced** (`prefers-reduced-motion`) every `--dur-*` =
160 ms and the only allowed change is an opacity crossfade (travel distances are 0). Read the tier
with `useMotionTier()` / `readTier()` / `onTierChange()` from `src/motion/use-tier.ts`; the root
carries `data-motion="full|reduced"`. There is no other motion setting (R2): the background's
ambient motion follows the tier and stops while the tab is hidden.

**Table vocabulary**: `ease.outSoft` (= outQuint), `draw` (= outExpo), `bloom` (= inOut),
`in` → `--ease-out-soft`, `--ease-draw`, `--ease-bloom`, `--ease-in`; springs `play` (the
workshop draw's turn), `hover`, `land`, `gap` (P1) → `--spring-play`, `--spring-hover`,
`--spring-land`, `--spring-gap` and `--spring-*-dur`; `duration.*` → `--dur-<kebab>` (e.g.
`--dur-nav-fade`, `--dur-fast`), tier-scaled by `tiers.ui`; the card play: `cardPlay` (P1);
`distance.*` →
`--travel-<kebab>` (0 in reduced); `stagger.contours` (60 ms between a chapter numeral's contours, R6), `stagger.digits` (40 ms between a Scoreboard value's
strips); `at.firstLoad` (home, first visit: `{ at, dur }` per part: title, label, copy
`{ at, end }`, divider, items `{ at, dur, stagger }`, cards `{ at, dur, stagger }`; H4),
`cardPlay.*.hero` (the detail hero's label, summary and meta pairs, P1, P3); `idle` (`after` 10 s, `write`, `gap`, `arrow`, `arrowCurl`, `fade`; H5, M3);
`header.threshold` (8 px) and `duration.headerHide` / `headerShow` (200 / 240 ms; N1);
`reveal.mask` also as `--reveal-mask`; `duration.slotMorph` / `slotLag` (Back's arrow and label,
G4), `duration.logoExit` / `logoBackFade` and `logo.*` (the header logo, R3; `ease.enter`,
`ease.move`, `ease.exit` are its curves; `logo.hover` T1, `logo.flow` T2 → `--logo-flow`),
`duration.linkIn` / `linkOut` / `linkMarkIn` / `linkMarkOut` and `ease.link` (text links, K1),
`duration.chip` (the switcher's chip and Back's chip, 360 ms) and `duration.backPull` (Back's
hover, 420 ms) with `stagger.letters` (25 ms; T3, T5), `duration.topo` (About's morph, 1.6 s) and
`duration.contourHandoff` (the SVG's crossfade, 0.3 s; R1);
`angle.*` (`--angle-discard`, `--angle-tap`), `weight.*`
(`--wght-<kebab>`), `opsz`, `field.*` (incl. `ignoreHeight` (R4), `poolDrift`, `poolDriftPeriods`
(G1), `contourDrift` (R1: `x` 8 px, `y` 5 px, one `period` 120 s loop from the identity
offset, `scale` 1.03 static → `--contour-drift-scale`) and `morph` (R1: `dprMax` 2, `slowScale`
0.75, `guardFrames` 10, `guardMs` 20)), `hand.*` (geometry mirrored in `tokens.css`).

**Reveal choreography** (I3): `duration.digits` 700 ms, `duration.svgDraw` 1200 ms,
`distance.block` 12 px; `reveal` = trigger (`amount` 0.35, `margin` −18% at the bottom,
`tallAmount` 0.45, `endSlack` 4 px; R5), `breakerAmount` 0.25 (the field's lift), `mask`
1.1 (lines rise from 110%), `image` (`inset` 0.1, `scale` 1.12), `digitRoll` 5, `mobileJobs` 8,
`heroDrift` 0.06 (`--hero-drift`); `deal` = `stage` 180 svh, `phases`, `landTilt`,
`flipPerspective`, `toss`, `below`, and the About cards' `deal` reveal: `deck` (R7: `stagger`
70 ms, `reach` 240 px, `tilt` −4°, `appear` 0.3, on the `land` spring as `linear()`), `fan` (A3:
`dur` 420 ms, `stagger` 80 ms, `rise` 32 px, `tilt` 0.5 of `angle.hand`, `settle` 420 ms),
Chapter 05's `minPinnedHeight` (760) and `pinned` (`head` 200 px, `pad` 12 px, `minScale` 0.72,
`debounce` 0.15 s; P8);
`discard` = `drop`, `fade`. `src/motion/choreography.ts` only applies the tiers (`msFor`, `spanFor`, `gapFor`,
`drawFor`).

---

## Colour

`src/design/palette.ts`: identities `ink` (home, #0E0F11 field, text #ECEAE4), `ember` (case 1),
`tide` (case 2), `grove` (case 3), `saffron` (Management), `glacier` (About). Each has `field`,
`mid`, `glow`, `accent`, `ink`, as `--<identity>-<key>`. Inside `[data-identity="<identity>"]`
the current identity is `--id-field`, `--id-mid`, `--id-glow`, `--id-accent`, `--id-ink`, and
`--accent` follows `--id-accent` (each scope re-declares it, I1). Body text is always `--text`; accents only for links, focus,
metrics, dividers, illustration strokes; text on a glow surface uses the identity's `ink`.
Other: `--text`, `--muted`, `--line`, `--glacier-text`, and About's contour ground:
`contour.ground` `#1B1C18` (`--contour-ground`; the old password page's; its line colour `#8A8C80`
lives in the SVGs, B1). On About the hand's scrim takes the contour ground. The header logo's
front card: `logoGradients` (four three-colour gradients from the cards' glow and accents, T2),
`logoGradientCss()` → `--logo-a`, `--logo-b`, `--logo-c` on `:root` and per
`html[data-logo-gradient]`. Text links (K2): `--link-a / -b / -c`, `--link-rest`, `--link-flow` per
scope and on `:root` from the page shown; `linkMark` (`mix`, `inkDepth`, `inkMix`).

---

## Hand

`src/components/hand/**` (Foundation; styles in `src/styles/hand.css`, Motion).

- Exactly **four cards**: the three case studies and Management, in `content/deck.ts` order
  (`buildChrome` in `src/lib/hand-data.ts` throws otherwise). No face-down deck. "New hand"
  re-deals these four.
- **Data (D7, L5)**: the hand, the header, the eggs, the case hero, DealRow and WorkshopRow read
  the active locale's cards and labels with `useChrome()` (`handCards`, `cardById`,
  `cardForPath`, `nextCard`, `handLabels`, `coffeeEgg`, `site`, `href`); code outside React
  (hand eggs) with `activeChrome()`; the table store, play and the field use the language-free
  `cardIdForPath` / `identityOf` from `src/lib/hand-data.ts`; never `src/lib/content.ts`. A card's
  `path` is its page without the locale, its `href` the link in the current locale.
- **Reserve (D1)**: the hand sets `data-hand="collapsed"` on `<html>` on every route except home
  (and the pre-paint script does the same for the first paint).
- `div.hand` holds two navigations, one shown at a time (P5): the fan
  `<nav class="hand-fan" aria-label="{hand.labels.nav}">` ("Projekte" / "Work"), one tab stop
  (roving `tabindex`, arrows, Home/End), card links `a.hand-card[data-play="<id>"][data-roving="<id>"]`
  in `li.hand-slot[data-slot="<id>"]`; and the rail `<nav class="hand-rail" aria-label=…>` of four
  `a.rail-card[data-play][data-slot-anchor]` links. The open card shows `.hand-ghost` ("Viewing")
  in the fan and `aria-current="page"` on both.
- Desktop (≥ 1024): fan at the bottom centre. Mobile: fan on home; elsewhere the 48 px rail: one
  tap plays a card, the open card's edge scrolls to the top (P5). No bottom sheet. The rail leaves
  and returns with the header (`html[data-header]`, N1).
- No card counter (H2). New hand by touch: a long press on the empty table on home.
- Back and Escape fold the page into the full-screen frame, which shrinks into the card's slot
  (P3); with the hero scrolled away the band and title simply do not take part.
- **Table store** (`src/motion/table-store.ts`, Foundation): `table.get()` →
  `{ activeCard, hoverCard, lastPlayed, tier, breaker, field }` (`field.ring`: a card met the table);
  `table.subscribe((state, prev) => …)`; `hover(id)`, `play(id, rect, href, ring?)`,
  `cancelPlay()` (a play called off after its bloom, P4), `returnHome(href)`
  (`href`: home in the current locale), `switchLocale()`, `route(path, initial)` (paths carry the
  locale; a route that differs only by locale changes nothing, L9), `setTier`,
  `setBreaker`, `registerSlots`, `slotOf`, `takeIntent()` / `peekIntent()` (`'play' | 'switch' |
  'return' | 'locale' | null`). Subscribers write DOM / uniforms
  directly; hovering or playing never re-renders React.
- View-transition names: `card-<id>`, `card-band-<id>`, `card-title-<id>` (hand card or its
  clone ↔ the page's play frame, hero image and h1; P3), `hand`,
  `hand-rail`, `site-header`, `home-slot` (R3), `locale-switcher` (T3), `site-footer`. Transition types: `play`, `return`, `switch`, `nav`,
  `locale` (`src/motion/transitions.ts`; `locale`: L7, L8).
- Stage 1 of a play runs on the card's clone on the table (`.table-card`, P2): press, lift
  (desktop), the arced flight with its rise and drop into contact, the hold, then the navigation.

---

## Layout components

`src/components/layout/**` (Layout & Pages), exported from `src/components/layout/index.ts`,
styled in `src/components/layout/layout.css`. All are server components except DealRow (client,
for the scene hook). All accept `className`. All render their final, static state.

### SectionIndex

`<SectionIndex number={1} label="Context" className? />` → `p.section-index.t-label[data-section-index="1"]`
with `.section-index-number` ("01") and `.section-index-label`. Sticky in `.col-index` from 1024
(`top: header + 24px`), static above the body below.

### NumeralBreaker

`<NumeralBreaker value={5} className? />` → `div.numeral-breaker[aria-hidden][data-numeral]`, a
`draw` reveal, holding a `ChapterNumeral` (R6): `svg.chapter-numeral[data-numeral-svg]` with one
`path[pathLength="1"][data-draw]` per contour in its own `data-draw-group`, the left digit's first
("05"; numbers padded to two digits, strings as given). Its
bottom margin is −1/3 of the numeral's line box, so it overlaps the next block by a third; the
next siblings sit above it (`z-index: 1`). Use with `.col-full`. Every case chapter 01–08 opens
with one (`Section breaker`, D4); Management's sections and 09 Next have none.

### OffsetImage

`<OffsetImage image="<ImageId>" side="left|right" caption? className? />` (replaces Spread, D2) →
`figure.offset-image.spread-grid.col-full[data-side][data-breaker]` >
`div.offset-image-area` (a size container) > `div.offset-image-frame` > `<Picture class="offset-image-media">`,
and only when `caption` is set (I16) `figcaption.offset-image-caption.t-label`. From 1024: `right`
spans the content column's start (line 5) to `full-end`, `left` `full-start` to the content
column's end (line 13); the frame is 3:2, `min(100%, 1200px, 72svh × 3/2)` wide, `cover`,
rounded on its anchored side and on the far side only once a cap keeps it off the edge. Caption
beside it from 1680 (columns 1–3 for `right`, column 12 + the outer track for `left`), below it in
the content column otherwise. Below 1024: edge to edge, 4:3. `imageSides()` returns a counter that
alternates sides per page, starting left. `data-breaker` lifts the field while in view (I5).

### MetaPairs

`<MetaPairs items={[{ label, value }]} label? className? />` (`type MetaPair = { label: string; value: ReactNode }`)
→ `dl.meta-pairs[data-count]` of `div.meta-pair` (a `pair` reveal, step `meta`) >
`dt.meta-pair-label.t-label` (with `span.meta-pair-rule[data-pair-rule]`, the 1 px top rule, and
the label in `[data-pair-part]`) + `dd.meta-pair-value[data-pair-part]`. Five across from 1024,
two columns below. Case studies pass the five `meta` fields in the order client, timeframe, role,
team, type with `site.labels.meta`. In the detail hero's first viewport the pairs join its
sequence (D1).

### Scoreboard

`<Scoreboard metrics={Metric[]} label? className? />` → `<Reveal as="dl" kind="digits">` with class
`scoreboard`, `div.scoreboard-item` > `dt.scoreboard-label.t-label` + `dd.scoreboard-value`.
The value holds an sr-only copy and an `aria-hidden` `span.scoreboard-digits[data-digits]` with
one `span.scoreboard-word` per word holding one `span[data-digit]` per character, and
`.scoreboard-unit`; values wrap between words, never inside one (I20). Martian Mono, tabular.
Five across from 1024, two below. Renders nothing for an empty list.

### DealRow

`<DealRow decisions={Decisions} labels? className? />` (client). `decisions` is exactly four
`{ decision, chose, tradeOff, why }`; `labels` defaults to `site.labels.decision`. Calls
`useDealScene(ref, { cards: 4 })` on its root:
`div.deal-row[data-scene="deal"][data-scene-active?]` > `ol.deal-row-list` >
`li.deal-card[data-deal-card="1..4"]` (`.deal-card-index.t-label`, `h3.deal-card-title.t-h3`,
`dl.deal-card-fields`) and `p.deal-row-position.t-label[data-deal-position]` ("1 / 4",
`aria-hidden`). Desktop: a row of four that the deal scene pins and deals in the full tier
(static in reduced). Mobile: horizontal scroll-snap row; `useDealPosition` updates the
"1 / 4" label from the snapped card with an IntersectionObserver (D5).

### WorkshopRow

`<WorkshopRow formats={WorkshopFormat[]} glyphs?={ReactNode[]} className? />` (client): Management's
workshop formats with DealRow's markup (`div.deal-row.deal-row-workshops` > `ol.deal-row-list` >
`li.deal-card[data-deal-card]`, `p[data-deal-position]`) but no `data-scene` and no scene hook (I9):
a static row on desktop, a scroll-snap row with its "n / N" label on mobile. Each card: number and
glyph (`glyphs[i]`, rendered by the server page: `<Reveal kind="draw"><WorkshopGlyph method={glyph}>`),
name, then `dl` fields labelled by `site.labels.workshop` (I17). The cards share five rows (CSS
subgrid: index, name, the three fields), so the fields stay level when a name wraps (D7).

### MarginNote

`<MarginNote label? className?>text</MarginNote>` → `aside.margin-note.col-margin[data-margin-note]`.
Column 12 + outer track from 1680 px (`--breakpoint-margin-notes`); below that an inline aside in
the content column with a 1 px left rule (D2).

### Minimap

`<Minimap sections={[{ id, label }]} label? className? />` (`type MinimapSection`) →
`nav.minimap[aria-label=site.labels.sections][data-minimap]` > `ol` > `a.minimap-tick[href="#<id>"][data-minimap-tick="<id>"]`
(label shown as a pill on hover / focus). Fixed at the right edge from 1024, hidden below. Each
`id` is the id of a `[data-section]` element. The current section gets `aria-current="location"`
from Layout's `MinimapObserver`, its only writer (I8).

### Section (helper)

`<Section id number label title titleHidden? breaker? lift? space? pin? className?>children</Section>`
composes the above: `section#<id>.page-section.spread-grid.space-<s|m|l>[data-section="<id>"][aria-labelledby]`
(`[data-breaker]` with `lift`), optional NumeralBreaker, SectionIndex in `.col-index` (sticky over
`pin` grid rows), the `h2#<id>-title.section-title.t-h2` (a `lines` reveal; plain and sr-only with
`titleHidden`) and the children as direct grid items. Not a contract of its own: Layout may change
or drop it.

### ClosingContact

Removed (D5): case studies and Management end with Next.

---

## Reveal

`src/components/reveals.tsx` (Motion). Styles: `src/styles/reveal.css`. Logic: `src/motion/reveal.ts`.
After Wave 1 the kinds below are the only reveal system (D4).

```tsx
<Reveal as="p" kind="lines" order={0} delay={120} className="t-body">…</Reveal>
<FirstLoadSequence>{home hero}</FirstLoadSequence>
```

- `type RevealKind = 'lines' | 'block' | 'list' | 'image' | 'digits' | 'rule' | 'draw' | 'note' | 'pair' | 'deal'`
  (`revealKinds`). `as?: RevealTag` (div, section, article, aside, header, footer, figure,
  figcaption, p, span, h1, h2, h3, ul, ol, dl, li, blockquote, hr; default div). Other HTML
  attributes pass through. These ten kinds are the only reveal system (D4, I3; `pair` since
  feedback round 1, `deal` since round 2).
- Renders `data-reveal="<kind>"`, `data-reveal-order="<order>"` (position in the first-viewport
  sequence; equal orders start together; omitted = reveal on scroll), `data-reveal-delay="<ms>"`
  and `data-reveal-step="<step>"` (`step` prop: the block's part of a timed sequence: on home
  `label`, `copy`, `divider`, `items`, `hint` (`at.firstLoad`); on detail pages `summary`,
  `label`, `meta` (`at.detail`)).
- **How it runs** (`src/motion/reveal.ts`, `kinds.ts`, `jobs.ts`): while the pre-paint script has
  armed the page (`:root[data-reveal]`), CSS hides unrevealed blocks with `opacity: 0` only
  (never the eager hero image, never digits in reduced). Every movement is a WAAPI animation
  started by JS that holds its start pose with a backwards fill, so reduced motion never sees a
  transform and without JavaScript the arming is dropped after 4 s. A job marks the block
  `data-revealed`, runs its kind, and at the end cancels its animations and removes `will-change`
  (nothing animated at rest). Below 1024 px at most `reveal.mobileJobs` jobs run at once.
- Triggers: `data-reveal-order` blocks in the first viewport play in sequence (base + 80 ms ×
  (order + 1) + delay; base = 0, or after a play or switch the hero label's offset from the
  transition's start, `cardPlay.*.hero.label`; 0 in reduced); a block with `data-reveal-hold` is
  left to its scene (`releaseReveal(el)`, Chapter 05's numeral, P8);
  everything else reveals by the one shared rule (`src/motion/reveal-trigger.ts`, R5): once 35%
  of it is inside the viewport less its bottom 18% (`reveal.amount` 0.35, `reveal.margin`
  `0px 0px -18% 0px`; a block taller than the viewport needs `min(0.35, 0.45 × innerHeight /
  offsetHeight)`; Motion `inView`, once), and every block still waiting reveals once the page is
  scrolled to within 4 px of its end (or cannot scroll); reduced: every block outside the home
  intro is final at once, nothing hidden or animated. Blocks entering in the same
  frame 50 ms apart in document order, and a block revealing with the same kind as the block
  before it at least 80 ms after it. A `note` waits for its related paragraph: the last `block` /
  `lines` reveal before it in its section.
- Page titles (I2): `PageTitle` is `<Reveal as="h1" kind="lines" order={0}>`; after a play or
  switch the engine marks it revealed at once (the morph delivers it).
- Detail hero (D1, P3): the `data-reveal-step` blocks in the first viewport start from the view
  transition's `ready` (or from mount without one) by `cardPlay.*.hero`: the label and counter,
  the summary (each a `block` rise of 8 / 6 px), then each meta pair 100 / 80 ms apart; the rest
  reveal on scroll. Sequences with their own timing are exact (no neighbour spacing).
- Kinds: `lines` paragraph lines rise from a mask (Motion+ `splitText` after the fonts are ready;
  WeightText titles per word; stagger lines); `block` rises `distance.block` with opacity; `list`
  items in turn (stagger items); `image` clip inset + inner scale settle; `digits` Scoreboard
  digit strips roll in (`[data-digit]`, stagger digits); `rule` a hairline draws (scaleX); `draw`
  SVG strokes draw by group (`[data-draw]`, `[data-draw-group]`, stagger svgGroups), labels
  (`[data-draw-label]`) fade in as their group starts and tints (`[data-draw-fill]`) once it is
  drawn (I4; chapter numerals' contours `stagger.contours` apart, R6); `note` fades in after its paragraph; `pair` a ruled row: its `[data-pair-rule]`
  draws from the left, then each `[data-pair-part]` rises in turn (`cardPlay.play.hero.meta`: the rule 240 ms, the
  label at +60 and the value at +120, 200 ms each; MetaPairs, About's projects); `deal` About's face-up cards
  (`[data-deal-item]`), by the block's `--deal-mode`: `deck` (the timeline, R7: each card dealt in
  document order from a deck at the block's start, `deal.deck`), `fan` (each card rises into a
  slight fan, then the row settles straight, `deal.fan`), `list`, otherwise a `block` rise. (The
  dealt line `stack` and the phone mode `left` are gone, R7.) Reduced: final at once (R5).
  Kinds take optional timing from a sequence (`KindOptions`: `dur`, `span`, `stagger`,
  `underline`).
- `<FirstLoadSequence className?>`: wraps the home hero; renders `div[data-first-load]` with
  `display: contents`. First visit in the session (H4, `at.firstLoad`): the name (0–600 ms),
  the label (250–600), the role and intro lines (450–950), the divider (850–1150, drawn like a
  link underline), "What I bring to the table", its items and the hint (from 1000, 80 apart),
  the four cards (1250–2000, 330 ms each, 140 apart), then `[data-chrome]` (the header).
  Reduced: all at once, 160 ms. Revisits and client navigations to home: one 300 ms
  crossfade. Any key, click, wheel or scroll completes it.
- `<Reveals />` (mounted once in `layout.tsx`) runs the engine for each route
  (`revealRoute(kind: NavigationKind)`, `NavigationKind = 'first' | 'repeat' | 'load' | 'nav' |
  'play' | 'switch' | 'return'`).

---

## Scenes

`src/motion/scenes/deal-scene.ts` (Motion).

```ts
type DealSceneOptions = { cards: number }
type DealSceneState = { active: boolean }
function useDealScene(ref: RefObject<HTMLElement | null>, options: DealSceneOptions): DealSceneState
```

Full tier, from 1024 px wide and `deal.minPinnedHeight` (760 px) tall, used only by the
case-study `DealRow` (I9) inside its Section's `stage` (P8): the section's track
(`[data-stage-track]`) becomes `deal.stage` (180 svh) tall and its stage (`[data-stage]`: the
chapter's label, numeral and h2, then the cards) sticks under the header, a subgrid with a fixed
head row and a fixed canvas row clear of the hand (`--deal-head`, `--deal-canvas`, `--deal-scale`;
sized on mount and on width changes only). Motion's `scroll()` deals the four cards face up
(readable from the moment they move, D6) from a deck in five phases (`deal.phases`), each landing
with a quarter of its hand-fan tilt, then the row squares up. The numeral draws once, as the stage
pins. The cards carry `will-change: transform` while the stage is pinned (set on mount or a width
change, never toggled at the pin boundaries while scrolling); the background field is never
resized by a scene (R4). Reduced, narrow or short screens, or cards that would fit the canvas only
below `deal.pinned.minScale`: nothing is touched and the static row stays under the title. Returns
`{ active }` (`data-scene-active` on the root while it runs). The mobile "1 / 4" position is not
scene state; DealRow (Layout) tracks it (D5). (The About timeline's scroll-linked drawing is gone:
its cards use the `deal` reveal, A2.)
New scenes live in `src/motion/scenes/<name>-scene.ts` and target `[data-scene="<name>"]`.

---

## Reading hairline

`<ReadingHairline />` (`src/components/reading-hairline.tsx`, Motion), mounted inside
`header.tsx` (last child of the fixed header). Renders
`div[data-reading-hairline][aria-hidden]` (1 px, along the header's bottom edge) with a bar
scaled by `transform: scaleX(var(--reading-progress, 0))` (origin left, colour `--id-accent`).
Motion sets `--reading-progress` (0–1) on `[data-reading-hairline]` (CSS `animation-timeline:
scroll(root)` where supported, Motion `scroll()` otherwise); in every tier it stays a progress
indicator (reduced: drawn with a clip, no transform). It is the one allowed exception to "at most
one scroll-linked effect per viewport" and may run next to one other (I10).

---

## Illustrations

`src/components/illustrations/**` (Illustrations), exported from `index.ts`.

```ts
type IllustrationVariant = 'auto' | 'horizontal' | 'vertical'
type IllustrationProps = { className?: string; titleId?: string; title?: string; description?: string; variant?: IllustrationVariant }
type WorkshopMethod = 'crazy-eights' | 'one-two-four-all' | 'dot-voting' | 'fishbowl'
type ProjectType = 'form' | 'map' | 'dashboard' | 'portal' | 'calendar' | 'checklist'
type ProjectTypeGlyphProps = IllustrationProps & { type: ProjectType }
type IllustrationName = (typeof illustrationNames)[number]           // all 13
type ContentIllustration = Exclude<IllustrationName, 'ProjectTypeGlyph'>
const illustrations: Record<ContentIllustration, ComponentType<IllustrationProps>>
function Illustration(props: IllustrationProps & { name: ContentIllustration })
function WorkshopGlyph(props: IllustrationProps & { method: WorkshopMethod })
```

Each drawing also takes optional data props (defaults: the brief's values; README in the folder).
"Where" follows the content (`SectionCopy.illustration` may name a drawing in any case-study
section, I15) and the pages.

| Component | Layout(s) (h / v) | Where |
| --- | --- | --- |
| `IntakeBeforeAfter` | 960×480 / 360×760 | Building the team (case 01), 04 Approach (`vertical`, sticky) |
| `TeamGrowthTimeline` | 960×360 / 360×480 | Building the team, 06 Artefacts |
| `DesignSystemLayers` | 640×560 / 360×540 | Allmend design system (case 02), 04 Approach (`vertical`, sticky) |
| `ContributionLoop` | 560×560 | Allmend design system, 06 Artefacts |
| `AdoptionBars` | 960×400 / 360×380 | Allmend design system, 07 Outcomes |
| `JourneyEmotionCurve` | 960×360 / 360×640 | Moving house, once (case 03), 02 Problem |
| `ServiceBlueprint` | 1200×560 / 360×780 | Moving house, once, 04 Approach (`vertical`, sticky) |
| `TeamConstellation` | 640×640 | Management, hero frame |
| `WeekRing` | 560×560 | Management, 03 Rituals (the content's weekly rituals) |
| `CareerMatrix` | 960×600 / 360×540 | Management, 05 Growth (`axes={false}`, HTML axis labels); Building the team, 06 Artefacts ("Career framework", Management's levels and dimensions, D8) |
| `WorkshopGlyph` (`method`) | 64×64 | Management, 06 Workshops: one per format card (I14) |
| `WorkshopGlyphs` | 960×160 / 360×320 | not placed (the per-card glyphs replace the strip) |
| `ProjectTypeGlyph` (`type`) | 48×48 | not placed (About's projects are a plain list, A1) |
| `DiscardedCard` | 132×184 | 404, `.lost-card` on the discard pile (drawn upright, I13) |

Markup contract (every illustration; conventions in `src/components/illustrations/README.md`):

- Root `<svg role="img" aria-labelledby="<title-id> <desc-id>" class="illustration …"
  data-illustration="<kebab-name>" fill="none" stroke="currentColor">` with `<title>` and `<desc>`
  first. Ids are unique per instance (`useId`); `titleId` sets the title id (the desc id is
  `<titleId>-desc`). Where a visible label already names it, the caller wraps it in
  `aria-hidden="true"`.
- **Plain drawings** (DiscardedCard, ProjectTypeGlyph, WorkshopGlyph) keep a root
  `viewBox`. **Labelled drawings** have no root `viewBox` (I11): the root keeps its proportions
  with CSS `aspect-ratio` (`--il-ratio-h` / `--il-ratio-v`), geometry sits in nested
  `<svg class="il-plate" viewBox>` plates and labels in CSS px, so 11 px labels stay 11 px. The
  root is a size container (`container-type: inline-size`, stroke width corrected per size):
  give it a definite width and size it by width only.
- **Layouts**: drawings with a vertical variant render `<g data-layout="h|v">` inside each group
  and `data-layouts` on the root; `variant="auto"` (default) shows the vertical layout below
  640 px viewport width, `horizontal` / `vertical` render only one (use them where the column
  width is known, I12).
- Colour: `currentColor` only (= `--accent`, which follows the identity, I1); strokes at 80%,
  guides at 34%; tints are 8% fills marked `data-draw-fill`; no raster images, gradients or
  filters. Labels are SVG `<text>` in `--font-mono` marked `data-draw-label` (no embedded font).
- **Every stroke element that draws on uses `pathLength="1"` and `data-draw`**, and strokes are
  grouped in drawing order in `<g data-draw-group="1">` … `<g data-draw-group="n">`. Motion
  draws `[data-draw]` with `stroke-dasharray: 1; stroke-dashoffset: 1 → 0`, group by group
  (`--stagger-svg-groups`), fading a group's labels and tints with it (I4); in reduced motion the
  drawing simply appears (160 ms fade). No `vector-effect: non-scaling-stroke` (it breaks
  `pathLength` dashes in Chromium).
- Static: illustrations never animate themselves (no SMIL, no CSS animation inside).

---

## Picture

`src/components/picture.tsx` (Content & Images), registry `content/images.ts`.

```tsx
<Picture id="team-of-teams-hero" sizes="100vw" priority? className? alt? />
```

- `id: ImageId` (`keyof typeof images`). Entry (`ImageEntry` in the schema): `{ kind, alt, width,
  height, local?: { widths, formats: ('avif'|'webp'|'jpeg')[] }, remote?: { src (with {w}), widths },
  placeholder?, photographer, photographerUrl, pageUrl }`. `kind: 'photo'` requires the three
  credit fields (the About colophon credits and links each photo); `kind: 'generated'` (the
  placeholders) makes them optional.
- Local: `<picture data-image="<id>">` with `<source type="image/avif">` and/or
  `<source type="image/webp">` when listed, and an `<img>` with the JPEG `srcset`. Files:
  `public/images/<id>-<width>.<avif|webp|jpg>`, URLs through `withBase()`.
- Remote (hotlinked): `<picture>` with one `<img srcset>` built by replacing `{w}`.
- `<img>` always has `width`/`height` (no layout shift), `alt` (empty = decorative),
  `sizes`, `decoding="async"`, the placeholder colour as background, and
  `loading="lazy"` — or with `priority`: `loading="eager"` + `fetchpriority="high"` (one per page:
  the case hero, I23, never inside an image reveal).
- Photos: 13 self-hosted Unsplash photos (`kind: 'photo'`, credited in the footer's small print on
  About), AVIF,
  WebP and JPEG at 640 / 1280 / 2048 px in `public/images/`. `content/images.ts` is generated by
  `node scripts/images/fetch-and-build.mjs` from `scripts/images/manifest.mjs` (alt text, credits,
  an optional `crop: [w, h]` for portrait sources, I21; `--only a,b` rebuilds single ids); width,
  height and the placeholder are measured, the placeholder clamped dark (I22).
  `node scripts/images/check.mjs` checks the registry and the files.

---

## Content schema

`content/schema.ts` (Foundation). One content set per locale (L5): `content/<locale>/index.ts`
exports `content = {…} satisfies Content`, `content/index.ts` collects them
(`contents = { de, en }`). Server components read the page's locale through `src/lib/content.ts`
(`getContent()`, `contentFor(locale)`); client components get the slim chrome through
`src/lib/chrome.tsx` (D7). Values live in typed modules: `content/<locale>/site.ts`,
`content/<locale>/hand.ts` (slim), `content/<locale>/cases/*.ts`, `pages/*.ts` and
`illustrations.ts` (server only), `content/de/images.ts` (German alt text),
`content/deck.ts` (cards without text), `content/images.ts` (generated). The slim modules stay
slim (type-only imports, plus the text-free deck).

```ts
type Content = {
  site: Site; hand: HandContent; home: Home; caseStudies: CaseStudy[]; management: Management;
  about: About; thesis: Thesis; notFound: NotFound; coffeeEgg: CoffeeEgg; workshopMethods: WorkshopMethods;
  illustrations: IllustrationCopy; imageAlt: Record<ImageId, string>
}
```

Shared: `Template` (string with `{placeholders}`, filled by `fill()` from `src/lib/format.ts`),
`Paragraph` (plain text), `Fact { label, value }`, `Metric { value, unit?, label }`, `CardId`,
`ImageId`, `ContentIllustration`, `ProjectType` (illustrations only), `WorkshopMethod`, `Identity`, and
`SectionHead { label; title?; image?; caption? }`: every Management and About section carries a
short `label` (SectionIndex, Minimap), an optional h2 `title` (defaults to the label) and an
optional image with an optional `caption` (I16).

| Type | Fields |
| --- | --- |
| `Site` (`content/<locale>/site.ts`) | `name, description, wordmark, skipLink, introSkip, header { homeLabel, back, about, nav, language }, footer { note }, shortcuts { title, close, items[{ keys, label }] }, eggs { dealt, turned, rare, coffeeDealt, tableFlipped }` (templates) `, labels { facts, next, viewing, sections, meta: Record<keyof CaseStudyMeta,string>, decision: Record<keyof Decision,string>, owned, notOwned, workshop { duration, who, outcome } }` |
| `HandContent` (`content/<locale>/hand.ts`; `order` and `identity` from `content/deck.ts`) | `order: [CardId ×4], identity: Record<CardId,Identity>, railLabel: Record<CardId,string>, cards: Record<CardId,HandCardCopy>, labels { nav, viewing, loading, stillLoading, offline }` (the last three: the play's status line, P4) |
| `HandCardCopy` | `title` (equals the page title; "Management" for the fourth card)`, type, year, inspect, tapLine, facts: Fact[]` (the card's own facts, each with its label; two in the final content) |
| `CoffeeEgg` (`content/<locale>/hand.ts`) | `title, body, cta` |
| `Home` | `label` (e.g. "Bern, Switzerland — UX Team Lead")`, title, role, intro, hint` ("Pick a card", above the hand)`, bring { label, items: string[] }` ("What I bring to the table", 3 items)`, idleNote` (the idle hint egg) |
| `CaseStudy` | `slug, number` ("01"–"03")`, identity, label, title, summary, statement?, heroImage: ImageId, meta: CaseStudyMeta, metrics: Metric[]` (exactly 5)`, sections: CaseStudySections` |
| `CaseStudyMeta` | `client, timeframe, role, team, type` |
| `SectionCopy` | `label, title, body: Paragraph[], list?, note?, illustration?: ContentIllustration` (any section, I15)`, image?: ImageId, caption?` (shown under the image only when set, I16) |
| `CaseStudySections` | `context, problem: SectionCopy; role: SectionCopy & { owned: string[]; notOwned: string[] }; approach: SectionCopy & { steps: { title, body }[] }` (4 steps)`; decisions: SectionCopy & { items: Decisions }; artefacts: SectionCopy & { items: Artefact[] }; outcomes, differently: SectionCopy & { items?: string[] }; next: { label, title, card?: CardId }` — order `caseStudySectionKeys` = 01 context, 02 problem, 03 role, 04 approach, 05 decisions, 06 artefacts, 07 outcomes, 08 differently, 09 next |
| `Decision` / `Decisions` | `{ decision, chose, tradeOff, why }`, exactly four |
| `Artefact` | `title, caption?, image?, illustration?` |
| `Management` | `slug: 'management', identity, title` (hero, "How I lead")`, lead, heroImage?, principles: SectionHead & { items: { title, evidence }[] }` (5)`, team: SectionHead & { members: { initials, role, fte, focus }[]; note }, rituals: SectionHead & { items: { name, cadence, purpose }[] }, hiring: SectionHead & { steps: { title, duration, purpose }[]; note }, growth: SectionHead & { body, levels: string[], dimensions: string[] }, workshops: SectionHead & { formats: { name, duration, who, outcome, glyph: WorkshopMethod }[]; drawButton }, metrics: SectionHead & { items: Metric[] }` (5) — order `managementSectionKeys`. Team members appear as initials only. The card's title, type and facts live in `hand.cards.management`. |
| `About` | `title, lead, story: SectionHead & { body: Paragraph[] }, portrait: ImageId` (the hero's 4:5 photo, A1)`, timeline: SectionHead & { lanes: Record<CareerLane,string>, both, today, alongside, thesisLink, items: CareerStop[] }` (R7: `CareerStop { lane: 'work'\|'education'\|'both', from, to: number\|'today', title, place?, parts?: Record<CareerLane,{ title, place? }>, alongside?, thesis? }`, seven, oldest first)`, howIWork: SectionHead & { items: { title, body }[] }` (4)`, tcg: SectionHead & { title, body, lessons: { title, body }[], stats }, roots: SectionHead & { title, body }, onTheTable: SectionHead & { title, items: { label, value }[] }` (5 face-down mini cards)`, projects: SectionHead & { title, intro` (the count line, "13 projects · 2014–2025")`, columns: Record<keyof Project,string>, items: Project[]` (13)`, end` (the closing line) `}, contact: SectionHead & { title` ("Let's talk.")`, body, email, links: ContactLink[]` (LinkedIn, location)`, note }, creditsTitle, topo { label, attribution, href }` (the credit "Terrain data © swisstopo" and its link, B1)` — order `aboutSectionKeys` (story, timeline, howIWork, tcg, roots, onTheTable, projects, contact) |
| `Project` | `title, year, client, role` (what I did) |
| `ContactLink` | `label, value, href?` |
| `Thesis` (`content/<locale>/thesis.ts`, R8) | `eyebrow, title, subtitle, answer { label, text }, meta: { label, value }[]` (5)`, scoreboard: Metric[]` (4)`, chapters: Record<ThesisChapterKey, ThesisChapter { label, title, lead, body }>` (+ `question.questions` (2), `insights.cards` (4), `conclusions { answers (2), nextLabel, next (3), reflectionLabel, reflection }`)`, slots { knowledgeBase, checkIn, sources }, drawings` (each `{ title, description, labels }`)`, back` — order `thesisChapterKeys` (question, context, approach, survey, insights, prototype, testing, conclusions) |
| `NotFound` | `title, body, back` |
| `WorkshopMethods` | `again, drawn: Template, methods[{ title, howTo }]` (the button label is `management.workshops.drawButton`) |
| `IllustrationCopy` | per drawing (component name): `{ title, description }` plus its labels (`labels`, `steps`, `lanes`, `offers`, `layers`, `badges`, `squads`, `lead`, `days`, `rituals`); `WorkshopGlyph` per method |
| `ImageEntry` | see [Picture](#picture) |

Build-time checks (`src/lib/content.ts`, for every locale; the build fails with a pointer to this
section): both locales have the same case-study slugs and card order; German strings contain no
"ß", em-dash or semicolon; and per locale exactly
three case studies with unique slugs and `number` "01"–"03" in order; per case study five
metrics, four decisions, four approach steps, a hand card with the same title and identity;
Management five principles and five metrics; About seven timeline stops (oldest first, one across
both lanes with `parts`, four in work, two in education, one thesis link; the same lanes and years
in every locale; R7), four how-I-work items,
five "on the table" items, thirteen projects with a count line that matches them ("13 projects ·
2014–2025", "13 Projekte · 2014–2025"); home three
"What I bring to the table" items; the hand exactly four cards.

Helpers: `src/lib/content.ts` (server) exports `getContent()` / `contentFor(locale)` (every value
above for that locale, with `handCards`, `cardById`, `nextCard`, `href` and `getCaseStudy(slug)`),
`localeParams`, `caseStudySectionKeys`, `managementSectionKeys`, `aboutSectionKeys`,
`images`, every type (`export type * from '@content/schema'`) and re-exports `pad2`,
`cardNumber`, `fill`. `src/lib/hand-data.ts` (client-safe) is listed under [Hand](#hand).

---

## Routes

All static, all under `BASE_PATH` (`/random/` on Pages), trailing slash. Every page exists under
`/de/` and `/en/` (`<locale>` below; files under `src/app/[locale]/`, L1). Every page is on the
Spread grid (D9).

| Route | File | Identity | Skeleton |
| --- | --- | --- | --- |
| `/` (root) | written by `scripts/i18n-pages.mjs` | ink ground | no page: an inline script picks the language and replaces the URL with `/<locale>/`; without JavaScript, links to both (L4) |
| `/<locale>/` | `src/app/[locale]/page.tsx` | ink | one screen (H1): `FirstLoadSequence` around label, title, role, intro, "What I bring to the table", hint; IdleHint egg; no footer; clears the fan |
| `/<locale>/work/[slug]` (`team-of-teams`, `shared-foundations`, `front-door`) | `src/app/[locale]/work/[slug]/page.tsx`, `case-sections.tsx` | ember / tide / grove | `DetailPage`: hero (`[data-hero-target]` frame with the priority hero picture + `.hero-drift`, display h1, summary) + MetaPairs + Scoreboard; sections 01–09 via `Section` (01 context + OffsetImage with caption; 02 problem opens with the statement (`data-breaker`); 03 owned / not owned; 04 four steps + sticky vertical drawing; 05 DealRow (deal scene, face up); 06 artefact gallery (drawings, photos, text cards); 07 outcomes; 08 differently; 09 NextProject); a NumeralBreaker on 01–08; Minimap |
| `/<locale>/management` | `src/app/[locale]/management/page.tsx` | saffron | `DetailPage`: hero (TeamConstellation) + "How I lead" + lead + card facts; 01 principles (+ OffsetImage), 02 team (structure pinned), 03 rituals (WeekRing), 04 hiring (drawn connector), 05 growth (CareerMatrix + HTML axes), 06 workshops (WorkshopRow with a WorkshopGlyph per format on a subgrid, workshop draw, + OffsetImage), 07 metrics (Scoreboard); NextProject; Minimap |
| `/<locale>/about` | `src/app/[locale]/about/page.tsx` | glacier, over the contour layer (B1) | hero (title, lead, the portrait photo, A1); 01 story (+ OffsetImage), 02 timeline (two lanes on one year axis, the Master's card links to the thesis, R7), 03 how I work (four face-up cards, A3), 04 tcg (+ OffsetImage), 05 roots (+ OffsetImage), 06 "What's on the table" (five cards), 07 projects (plain list, count and closing lines), 08 contact (`#contact`); the footer adds the photo credits and the terrain credit (a link; also along the left edge from 1024) |
| `/<locale>/about/thesis` | `src/app/[locale]/about/thesis/page.tsx` | glacier, over the table field in the glacier tint (not the contour map; R8) | the case-study template: `ThesisHero` (eyebrow, the Master's card grown in the `[data-hero-target]` frame, display h1, subtitle), the one-line answer, five MetaPairs, a four-value Scoreboard; chapters 01–08 (`thesisChapterKeys`) with drawn numerals, leads, five drawings (`src/components/illustrations/thesis/`), three marked screenshot slots (`ImageSlot`), a dealt row of four insights; Q1 / Q2 answers, next steps, reflection; a link back to About's `#timeline`; Minimap |
| 404 | `src/app/[locale]/404/page.tsx` (`/<locale>/404/`), served for any unknown address by `dist/404.html` (L4) | ink | discard zone, pile and `.lost-card` (DiscardedCard, falls in, I7), title, back link (home in its locale) |

`/more-projects` and `/contact` are gone (A3; the 404 page answers). `/<locale>/logo-lab` is the
unlinked logo lab (English, `lang="en"`). Header: the home slot (logo, or Back on card
pages), and the tray with About and the language switcher (L6, T3, T4); it leaves on a scroll down
(N1), Back stays (T5). Every page has one `h1` (`PageTitle`,
`id="page-heading"`, focus target after navigation).

---

## Data attributes

| Attribute | On | Meaning / set by |
| --- | --- | --- |
| `data-reveal="<kind>"` | any block | one of the ten reveal kinds, via `<Reveal>` (see [Reveal](#reveal)) |
| `data-revealed` | revealed blocks | set by the engine: `""` (animated) or `instant` (final at once) |
| `data-reveal-order`, `data-reveal-delay` | `<Reveal>` | sequence position; extra delay (ms) |
| `data-reveal-step` | `<Reveal step>` | part of a timed sequence (home `at.firstLoad`, detail hero `at.detail`) |
| `data-pair-rule`, `data-pair-part` | inside a `pair` reveal (MetaPairs, About's projects) | the rule that draws, the parts that follow |
| `data-breaker` | OffsetImage, the problem statement section | the field lifts 10% while in view (I5) |
| `data-side="left\|right"` | OffsetImage | the edge the image extends toward from 1024 |
| `data-slot-mode="mark\|back"` | the header's home slot | logo or Back (G4, R3) |
| `data-logo-part` | the logo's card groups (move and fan, and the front card's knock-out) | animated by logo.tsx; turn and fan about their bottom centre (R3) |
| `data-logo-stop="0\|1\|2"` | the front card's gradient stops | their colours flow (T2) |
| `data-logo-gradient="ember\|tide\|grove\|saffron"` | `<html>` | this page load's logo gradient, from the pre-paint script (T2) |
| `data-locale-switcher`, `data-locale="de\|en"` | the header's language nav and its links | the switcher (L6, T3) |
| `data-arrived` | the language nav | mounted by a language switch: its chip slides in (T3) |
| `data-locale-switch` | `<html>` | while a language switch runs: the chrome cross-fades (L7, L8) |
| `data-idle-hint`, `data-ready` | the idle hint (home) | the note; ready once its font has loaded |
| `data-contours="off\|morph\|shown"`, `data-contours-primed`, `data-canvas-covered` | `.field` | About's SVG layer: hidden, morphing in or out, at rest; rendered at opacity 0 because About is near; the SVG layer covers the canvas, which is not composited (R1) |
| `data-deal-item`, `data-latest` | About's cards (the `deal` reveal) | the cards, the timeline's open stop (R7, A3) |
| `data-lane="work\|education\|both"`, `data-thesis` | the timeline's stops (`li.career-stop`) | its lane; the Master's card, a link to the thesis (R7) |
| `data-first-load` | `<FirstLoadSequence>` | home hero wrapper |
| `data-chrome` | header | revealed last in the first-visit intro |
| `data-draw` | SVG stroke elements (with `pathLength="1"`) | drawn on by the `draw` reveal |
| `data-draw-group="1..n"` | `<g>` in illustrations | drawing order |
| `data-draw-fill`, `data-draw-label` | tint fills, `<text>` labels in illustrations | fade with their group (I4) |
| `data-layout="h\|v"`, `data-layouts` | illustration groups / root | horizontal and vertical layouts |
| `data-illustration="<name>"` | illustration `<svg>` | registry name |
| `data-scene="<name>"`, `data-scene-active` | scene roots (`deal`: the case-study DealRow only) | scroll / interaction scenes |
| `data-deal-card="1..n"`, `data-deal-position` | DealRow, WorkshopRow | cards; "1 / 4" label (mobile) |
| `data-section="<id>"` | page sections | Minimap targets, section anchors |
| `data-section-index`, `data-numeral`, `data-margin-note`, `data-minimap`, `data-minimap-tick="<id>"` | layout components | hooks for styling and motion |
| `data-digits`, `data-digit` | Scoreboard | digit spans for the `digits` reveal |
| `data-image="<id>"` | `<picture>` | image id |
| `data-reading-hairline` (+ `--reading-progress`) | hairline | reading progress 0–1 |
| `data-identity="<identity>"` | page roots, cards | colour scope (`--id-*`) |
| `data-detail="<id>"`, `data-home` | page roots / hand nav | page hooks (`thesis` on the thesis overview, R8) |
| `data-about-map` | `<html>` | About's contour map shows whole before the engine runs (pre-paint script, About only; R8) |
| `data-play="<id>"`, `data-roving`, `data-slot`, `data-slot-anchor`, `data-play-link` | hand, Next project | play / roving / slot geometry |
| `data-tapped`, `data-inspect`, `data-rare`, `data-drawn`, `data-closing`, `data-opening`, `data-returned` | hand cards / slots / row | egg and play states (the siblings closing / opening the gap; the card just back from its page lies on top) |
| `data-pressed`, `data-playing` | `a.rail-card` / `nav.hand-rail` | the rail's press; a card leaving the rail (the other edges step back) |
| `data-layer="x\|y\|pose\|scale\|lifted\|contact\|spread"`, `data-from`, `data-landed` | `.table-card` (the played card's clone) and its layers | the flight's channels and shadows; where it came from; at rest on the table |
| `data-arrival="play\|rest"` | `.play-frame` | arrived by a play (the frame dissolves) or not (transparent) |
| `data-returning`, `data-switching` | `<html>` | Back: the frame materialises again before the page leaves; a switch: the open hero dims |
| `data-loaded` | the hero `<img>` | decoded: it fades in over the frame's colour |
| `data-where="table\|hand"`, `data-shown` | `.play-status` | the play's status line: under the card while waiting, near the hand when offline |
| `data-stage-track`, `data-stage`, `data-pinned` | Section's stage (Chapter 05) | the deal's track and sticky stage; pinned while the scene runs |
| `data-reveal-marker` | a `rule` reveal holding a text link (About's email) | the link's marker block draws in from the left (`--ue`), the text shows from the start (K4) |
| `data-reveal-hold` | a reveal block | its scene reveals it (`releaseReveal()`; Chapter 05's numeral) |
| `data-motion="full\|reduced"` | `<html>` | motion tier (pre-paint script, M1) |
| `data-header="hidden"` | `<html>` | the header (and the mobile rail) has left on a scroll down (N1) |
| `data-intro="first|repeat"`, `data-reveal="armed|live"`, `data-reveal-skip` | `<html>` | intro and reveal arming |
| `data-field="<identity>"`, `data-renderer="gl|css"` | `<html>` | background field |
| `data-hand="collapsed"` | `<html>` | every route except home (hand component + pre-paint script); switches `--hand-reserve` to 120 px from 1024 (D1) |
| `data-hero-target` | the detail hero's media frame (`.case-hero-frame`) | the card's band grows into it (`card-band-<slug>`, P3); clips the `.hero-drift` picture (I6) |

---

## Eggs

`src/eggs/registry.ts` lists each egg's trigger and full / reduced behaviour; all work
with the four-card hand:

| Egg | Trigger |
| --- | --- |
| New hand (Mulligan) | M on home, or by touch a long press (800 ms) on the empty table (not on a card or text); the four cards fly off to the dealer (bottom right, off screen) and are dealt again |
| Workshop draw | "Draw a workshop method" (`management.workshops.drawButton`) on /management; `<WorkshopDraw button again drawn methods>` gets its copy as props (D7) |
| Rare pull | 1 in 40 loads, or `?rare` |
| Tap 90° | T on a focused card, or a double tap on a card as it flies to the table (mobile) |
| Inspect | hold Space on a focused card, or a long press (mobile) |
| Shortcut sheet | `?` |
| Coffee | type "draw" on home: a fifth card (`coffeeEgg`: title, body, cta) dealt from off screen, opens About's contact chapter (`/about#contact`); announced with `site.eggs.coffeeDealt` |
| Idle hint | home only, 10 s without a click, tap or key press, once per session: a handwritten note writes itself beside the hand and a curly arrow draws toward the cards; fades on the next input (H5) |
| 404 discard | any unknown address: `.lost-card` falls onto the pile (I7) |
| What's on the table | About: five face-down mini cards (`about.onTheTable.items`), each flipping to its value; `<OnTheTable title items flipped>` gets its copy as props (D7) |

---

## Checks

- `npm run build` (`scripts/build-numerals.mjs`, then the static export to `dist/`, type check and
  the content checks for both locales included, then `scripts/i18n-pages.mjs`: `<html lang>`, root,
  404). Must pass before every push.
- `npm run preview` then, once per locale,
  `node scripts/smoke.mjs http://localhost:4100/random/<locale>/ [--motion=full|reduced]`
  (behaviour at 1440×900 and 390×844: intro order (from the animations' own start times, F3) and
  length, home on one screen, header links (no pause button, R2), the header leaving and returning
  on a case study with the rail, play / switch / return (the h1 focused after a play and a switch,
  the clone gone and the frame dissolved, the rail a nav of four links that plays in one tap with
  no popover, its open card scrolling to the top), browser back / forward with the default morph,
  Chapter 05 pinned with its head (or static where the cards would not fit), the detail hero order, a return with the
  hero scrolled away, the idle hint (after 10 s), About's morph (full resolution only while it
  runs, the SVG covering the canvas, back to rest on leaving; R1) and contour layer (base path,
  cover, 42%, scale 1.03, no mask, no frames at rest, drift by tier, no pointer reaction, the
  swisstopo credit), its cards and portrait, removed routes, reveals,
  motion per tier; the root's language choice (de-CH, en-US, fr-FR, no language, a stored
  choice, no JavaScript), the 404 page's language (the address's locale wins, F1), `<html lang>` and hreflang, the switcher on
  home, a case study, Management and About, back across a switch; card and page titles and
  labels read from the locale's content modules, I27)
  and `node scripts/budget.mjs http://localhost:4100/random/` (initial JS, 170 KB gzip target).
  The budget is advisory for this playground (D7): report the number in your handoff; going over
  does not block a push.
- `node scripts/images/check.mjs` (image registry (13 photos), renditions, content counts per
  locale incl. About's 13 projects, alt text in every locale, slim modules, deleted files stay
  deleted).
