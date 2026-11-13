# Foundation session

Branch: `claude/foundation-contracts-stubs-blhqi3` (merged into `main` once verified).

## Plan

Written before any edit. The goal is a stable set of contracts for the four Wave 1 sessions,
not visual polish.

1. **Hand (A)**
   - Remove the face-down "More projects" deck from `hand.tsx`, its CSS in `hand.css`,
     `reveal.css`, `eggs.css`, and the deck-only code paths (long press on the deck, the
     `.hand-deck` chrome reveal, `hand.deckGap`). The off-screen point cards are dealt from
     (`deckOffset`) is also used by the first-visit draw, so it stays, renamed `dealOffset`.
   - "More projects" stays in the header and becomes a plain link in the mobile bottom sheet,
     next to About and Contact. The route moves from `/projects` to `/more-projects`.
   - Card counter on home only: `01 / 04` plus the hovered or focused card's title (Martian
     Mono, label token), `aria-live="polite"`, first card when nothing is hovered or focused.
     It follows the table store's `hoverCard`, written to the DOM directly (no React render).
   - Eggs: Mulligan loses its deck trigger; touch gets a long press on the counter instead
     (M still works). Coffee and the intro draw deal from off screen as before.
2. **Tokens (B, C, D)**
   - `src/styles/layout.css` + `src/design/layout.ts`: "Spread" grid (4 / 8 / 12 / 12 + outer
     tracks), margins, gutters, baseline, `--space-s/m/l`, header height, hand reserve, grid
     utilities `.spread-grid`, `.col-content`, `.col-index`, `.col-full`, `.col-margin`.
   - `src/styles/type.css` + `src/design/type.ts`: label, body, lead, h3, h2, display,
     numeral (+ outline), fluid between 390 and 1440 px, as tokens and `.t-*` classes.
   - `src/motion/tokens.ts`: duration scale xs–xl, the three easings, staggers, tier
     multipliers, emitted as CSS custom properties next to the existing ones. Springs stay
     converted to `linear()`; they are made critically damped (no overshoot).
3. **Stubs (E)**: `src/components/layout/*` (8 components), `src/motion/scenes/deal-scene.ts`,
   `<Reveal>` and `<FirstLoadSequence>` in `reveals.tsx`, `<ReadingHairline>` mounted in the
   header, 15 illustration stubs behind a registry, `<Picture>` + `content/images.ts` with
   three generated placeholder images.
4. **Content schema (E)**: `content/schema.ts` for every page and egg; `content/index.ts` is
   the single typed entry point, built from the existing JSON/MDX by `content/adapters.ts`.
   Existing files stay in place.
5. **Routes (E)**: `/`, `/work/[slug]` (3), `/management`, `/more-projects`, `/about`,
   `/contact`, 404, each rendering minimal structure with the stubs.
6. **Docs (F)**: `docs/contracts.md` (tokens, components, props, hooks, data attributes,
   paths, ownership), `docs/handoff/README.md`, `docs/art-direction.md` (it does not exist yet;
   written from the brief so parallel sessions can read it), three lines in `CLAUDE.md`.
7. **Deploy (G)**: the workflow already runs only on push to `main` (plus manual dispatch) and
   has a `pages` concurrency group; add a guard so a manual dispatch from a branch cannot deploy.
8. **Verify**: production build, Playwright smoke at 1440x900 and 390x844 (home, a case study,
   Management, About, Contact, 404), screenshots of home, then merge to `main` and confirm the
   deploy run.

## What shipped

All contracts are documented in `docs/contracts.md`; this is the summary.

- **Hand**: the face-down deck and its code paths are gone (`.hand-deck`, `.deck-*` CSS, deck
  long press, deck in the intro chrome, `hand.deckGap`); `deckOffset` is now `dealOffset` (the
  off-screen dealer point the intro and the eggs still use). Exactly four cards, enforced in
  `src/lib/cards.ts`. Card counter `src/components/hand/hand-counter.tsx` (home only, label
  token, `aria-live="polite"`, follows hover and keyboard focus, first card at rest, keeps the
  played card while it lifts). The mobile sheet has plain links to More projects, About,
  Contact; the header keeps More projects (now `/more-projects`).
- **Eggs**: new hand = M or a long press on the counter; Coffee is dealt from off screen; all
  others unchanged. Checked in Chromium: M, counter long press (touch), "draw", `?`, workshop
  draw, About cards, 404 discard.
- **Tokens**: `src/styles/layout.css` + `src/design/layout.ts` (Spread grid, `--space-s/m/l`,
  `--header-h` 64px, `--hand-reserve` 176/120/rail, `.spread-grid`, `.col-full`, `.col-wide`,
  `.col-index`, `.col-content`, `.col-margin`); `src/styles/type.css` + `src/design/type.ts`
  (label, body, lead, h3, h2, display, numeral + outline, fluid 390–1440, `.t-*`);
  `src/motion/tokens.ts` (`dur` xs–xl, `ease.outExpo/outQuint/inOut`, staggers words, lines,
  items, cards, svgGroups, `motionScale`, `reducedCrossfade`, `durFor()`, CSS `--dur-xs…xl`,
  `--ease-out-expo…`, `--stagger-…`, `--motion-scale`, `--dur-reduced`).
- **Stubs**: `src/components/layout/` (SectionIndex, NumeralBreaker, Spread, MetaPairs,
  Scoreboard, DealRow, MarginNote, Minimap, plus a `Section` helper), `src/motion/scenes/deal-scene.ts`,
  `<Reveal>` / `<FirstLoadSequence>` in `src/components/reveals.tsx`, `<ReadingHairline>` in
  the header, 15 illustrations behind `src/components/illustrations/index.ts`, `<Picture>` with
  three generated placeholder images.
- **Content**: `content/schema.ts`, `content/index.ts` (typed entry point), `content/adapters.ts`
  (existing JSON/MDX shaped into the schema), `content/images.ts`; `src/lib/content.ts` and
  `src/lib/cards.ts` read only the typed content.
- **Routes**: `/`, `/work/{team-of-teams,shared-foundations,front-door}`, `/management`,
  `/more-projects`, `/about`, `/contact`, 404, each built from the stubs.
- **Docs**: `docs/contracts.md`, `docs/handoff/README.md`, `docs/art-direction.md`, two lines in
  `CLAUDE.md`, README updated.
- **Deploy**: the workflow already ran only on push to `main` (plus manual dispatch) with a
  `pages` concurrency group (`cancel-in-progress: false`); the build job now also requires
  `github.ref == 'refs/heads/main'`, so a manual run from a branch cannot deploy.

Verification: `npm run build` passes; `scripts/smoke.mjs` passes in full, calm and reduced at
1440x900 and 390x844 (with new checks: no deck, counter text, counter follows hover); a separate
check loads home, a case study, Management, More projects, About, Contact and a missing URL at
both sizes with no console errors and no horizontal scroll; `scripts/budget.mjs`: 163.6 KB gzip
initial JS (was 158.7 KB before this session; limit 170). Most of the +4.9 KB is the content
module, which now carries the transcribed section text into the client chunk (see question 7).

## Deviations from the brief, and why

- `docs/art-direction.md` did not exist; written from the brief so Wave 1 can read it.
- ≥ 1440 grid: the outer tracks are `minmax(var(--grid-edge), 1fr)` (48 px minus the gutter),
  not `minmax(48px, 1fr)`, because CSS `column-gap` also sits next to the outer tracks; this
  keeps the visible margin at 48 px like 1024–1439. `.col-margin` at ≥ 1440 spans column 12 plus
  the right outer track, since the outer track alone is only 24–48 px wide until ~1600 px.
- "No overshoot": the three springs were made critically damped (play damping 28 → 29, hover
  32 → 40, land 26 → 35) and `springCss()` clamps at 1. Calm's `ui` multiplier 0.7 → 0.6 to match
  "calm = × 0.6".
- Animated headlines settle on the type scale: `weight.h1` 680 → 700, `weight.h2` 700 → 600,
  `SectionTitle` opsz 48 → 72.
- `/projects` became `/more-projects` (the old URL now shows the 404 page).
- Case-study sections 02–04 are named `problem`, `role`, `approach` (the brief named the others).
- The MDX bodies are transcribed into `content/adapters.ts` and no longer rendered from MDX; the
  `.mdx` files stay in place as sources. Copy the old content lacks (layout labels) is marked
  `NEW`; sections with no text say "To be written." (role, decisions, differently). Case studies
  have no metrics yet, so their Scoreboard is hidden.
- `<Reveal>` writes `data-revealed=""` up front so the stub is final and the legacy reveal system
  skips it.
- Placeholder images are WebP + JPEG only (Chromium's canvas cannot encode AVIF).
- The body font size now uses the body token (17–19 px) everywhere, and the legacy `--gutter`
  follows `--grid-margin`; mobile hand reserve is 16 px above the rail (was 32).
- Added beyond the brief: `.col-wide`, the `Section` helper, `Illustration` (render by name),
  `data-stub` dashed frames on illustration stubs, `fill()` / `pad2()` helpers, an ownership
  table for paths the Wave 1 table does not name.

## Open questions (first pass), now resolved

All nine questions of the first pass are answered as decisions D1–D9 in `docs/contracts.md#decisions`
(1 hand reserve → D1, 2 margin notes → D2, 3 hero target → D3, 4 reveals → D4, 5 DealRow
counter → D5, 6 content → D6, 7 budget → D7, 8 MDX → D8, 9 pages → D9).

## Follow-up: final content schema and contract decisions

Second Foundation pass, before Wave 1 starts (branch restarted from `main` at 01ee33e).

**Plan.** Revise `content/schema.ts` so the final persona content fits without workarounds; keep
the placeholder content compiling through the adapters ("To be written." for missing copy);
write the nine decisions into `docs/contracts.md`; implement the Foundation ones (D1, D2, D7,
D8); update the skeleton routes; verify; merge to `main` once.

**What shipped.**

- Schema (`content/schema.ts`): `Home` + `label`, `onTheTableNow`; `CaseStudy` + `number`, role
  section `owned` / `notOwned` (labels `site.labels.owned` / `notOwned`), approach section
  `steps` (four); `Management` rebuilt (hero `title` + `lead`; `principles`, `team`, `rituals`,
  `hiring`, `growth`, `workshops`, `metrics`, each with a `SectionHead` label); `About` rebuilt
  (`lead`, `story`, `timeline`, `howIWork`, `tcg`, `roots`, `onTheTable` five cards,
  `creditsTitle`, `topo`); `Contact` (`label`, `title`, `body`, `email`, `links`, `note`);
  `CoffeeEgg` (`title`, `body`, `cta`); `MoreProjects` intro = count line, end = closing line;
  `ImageEntry` gains `kind` and `photographer` / `photographerUrl` / `pageUrl` (required for
  photos). Card metadata moved to `HandContent.cards` (`HandCardCopy`); `CardCopy` and the
  pages' `card` fields are gone. Egg announcements `coffeeDealt` / `tableFlipped` are templates
  in `site.eggs`; the workshop button label moved to `management.workshops.drawButton`.
- Counts the contract fixes are checked at build time in `src/lib/content.ts`.
- D1: `hand.tsx` sets `data-hand="collapsed"` off home; the pre-paint script does the same for
  the first paint. D2: `--breakpoint-margin-notes` 1680 px / `breakpoints.marginNotes`;
  `.col-margin` moves to column 12 + outer track from 1680, MarginNote is an inline aside with a
  left rule below. D3: `data-hero-target` already on `.hero-slot`. D7: slim
  `content/hand.ts`, `content/site.ts`, `src/lib/hand-data.ts`, `src/lib/format.ts`; every client
  module repointed (the hand, counter, card face, header, case hero, DealRow, route focus, play,
  table store, eggs); `WorkshopDraw` and `OnTheTable` take their copy as props. D8: `@next/mdx`,
  `@mdx-js/*`, `@types/mdx` and `src/mdx-components.tsx` removed.
- Routes: Management, About, Contact, home and the case-study role / approach sections render
  the new fields as skeletons.

**Verification.** `npm ci` (clean, from the new lockfile) and `npm run build` pass (type check
included, 11 routes). Chromium at 1440x900 and 390x844: home, a case study, Management, About,
Contact, More projects and a missing URL render with no console errors and no horizontal scroll;
4 cards everywhere, the counter on home only; `data-hand="collapsed"` on every route except
home (also after client navigation), `--hand-reserve` 176 px on home and 120 px elsewhere on
desktop. Eggs (M, counter long press, "draw", `?`, workshop draw, About cards, 404) work.
`scripts/smoke.mjs` (full tier) passes. `.col-margin` is inline at 1500 px and in column 12 +
outer track at 1700 px. Page text (case sections, About, Management) no longer appears in any
client chunk; initial JS 159.8 KB gzip (was 163.6 KB).

**Still open.**

- `site.json` and `case-studies.json` still ship whole in the client chunk because the slim
  modules adapt them; that ends when Content replaces them with typed modules (D7, D8).
- D3: playing from home has no hero mounted, so `heroTarget()` will use its fallback there;
  only switches (detail page to detail page) can measure the target.
- The placeholder content shows "To be written." on the live site until the content pass.
