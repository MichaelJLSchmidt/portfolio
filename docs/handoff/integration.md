# Integration session

## Branch

`claude/integration-deployment-4gh3wl` (the integration branch, from `main` at 19a13c5), merged
into `main` once verification passed; `main` is pushed and deployed once.

## Plan

1. Read `docs/contracts.md`, `docs/art-direction.md` and the four handoffs.
2. Merge, in order, building after each: Content & Images, Illustrations, Layout & Pages, Motion.
3. Resolve conflicts by the ownership table (owner wins in its files; re-apply only the necessary
   part of a non-owner's change; never delete a feature).
4. Apply the 27 integration decisions (recorded as I1–I27 in `docs/contracts.md`).
5. Consistency pass across all pages, then an independent review of the merged diff.
6. Verify: production build, `scripts/smoke.mjs` per tier at 1440×900 and 390×844, screenshots of
   every page at both sizes, one reduced-motion pass, eggs.
7. Merge into `main`, push once, confirm the Pages deploy.

## Merges

| Order | Branch | Head | Textual conflicts | Build after merge |
| --- | --- | --- | --- | --- |
| 1 | `claude/content-images-moritz-qlxscu` | 7d1741d | none | passes |
| 2 | `claude/illustrations-svg-components-1k9w7o` | d337147 | none | passes |
| 3 | `claude/layout-pages-composition-f58ey0` | 1fe4bd3 | none | passes |
| 4 | `claude/motion-choreography-reveals-och1mz` | 45e05f8 | none | passes |

No file was changed by two branches and every branch stayed inside its ownership, so git merged
cleanly. The conflicts were semantic (two sessions solving the same thing, or one session's
output not fitting another's), resolved like this:

| Conflict | Resolution |
| --- | --- |
| Two writers of the Minimap's `aria-current` (Layout's `MinimapObserver`, Motion's `minimap()` in `reveal.ts`) | Layout's kept, Motion's removed (I8) |
| Two `--accent` workarounds (`globals.css`, `illustrations.css`) | Both removed; the identity scopes declare `--accent` (I1) |
| `PageTitle` kept the legacy `data-reveal="headline"`, Motion aliased it | `<Reveal as="h1" kind="lines">`, alias removed (I2) |
| Layout's fallback "brief placement" of illustrations vs Content's `section.illustration` | Content wins; the fallback is gone (the content names every placement) |
| About and Management rendered `AboutTimeline` / `CareerMatrix` with placeholder data and their own labels next to Layout's HTML labels (every label twice) | Data from content; `labels={false}` / `axes={false}` draw without labels, geometry aligned with the HTML (I13, I14) |
| Illustrations drew `DiscardedCard` tilted on its own pile; Layout tilts it again on a CSS pile | One upright card; the page tilts it (I13) |
| Layout's hiring connector used `vector-effect: non-scaling-stroke` with `pathLength="1"`, which Illustrations found breaks dash drawing in Chromium | Unscaled SVGs with percentage coordinates (1 px stroke, drawable) |
| Spread caption fell back to the image's alt text | `caption` field; nothing shown when unset (I16) |
| The 02 Problem `h2` is screen-reader only but was a `lines` reveal that can never intersect (smoke: "every reveal ends visible — lines") | Plain `h2` when the title is hidden |
| `WorkshopRow` used the pinned deal scene on a page that already pins its team structure | Static row, mobile counter, no scene (I9) |
| `WorkshopGlyphs` strip above the cards named methods differently from the formats | A `WorkshopGlyph` per format card (I14); the strip is not placed |
| `WeekRing` defaults (Planning, Demo, a daily Stand-up) contradicted the rituals listed beside it | Wired to the weekly rituals the content names (check-in Mon, 1:1s, critique Wed) |
| Content referenced Management `principles` / `workshops` and About `tcg` / `roots` images that no page rendered | Placed as Spreads in their sections (captions only if set) |
| Smoke sampled the field colour where Layout's new hero image now sits | Smoke samples the field with page content hidden |

## Decisions (I1–I27)

Recorded in `docs/contracts.md#integration-decisions-i1i27`. Where each one lives:

1. `src/design/palette.ts` (`identityCss()` scopes); workarounds removed from `globals.css`, `illustrations.css`.
2. `src/components/reveals.tsx` (`h1` in `RevealTag`), `page-title.tsx`, `src/motion/reveal.ts` (titles revealed at once after play / switch).
3. `src/motion/tokens.ts` (`at.firstLoad`, `duration.digits/svgDraw/svgDrawCalm`, `distance.block`, `reveal.*`, `deal`, `timeline`, `discard`, `field.pinnedDetail`, `stagger.digits`); `choreography.ts` only tier helpers; retired legacy presets, aliases, `data-order`, CSS vars, unused entries; deleted `blocks.tsx`, `section-title.tsx`, `title-fill.tsx` and their CSS. Two literals moved in too: `--angle-tap` (tap egg) and `--hero-drift`.
4. `src/motion/kinds.ts` `drawGroups()` / `draw()`, `scenes/timeline-scene.ts`: labels fade as their group starts, tints after it is drawn; no fill heuristic, no `data-tint` (a browser check found every fill tagged).
5. `spread.tsx` and `Section lift` set `data-breaker`; `reveal.ts` lifts the field on `[data-breaker]`.
6. `src/app/work/[slug]/page.tsx`: `className="case-hero-picture hero-drift"` inside the clipping frame.
7. `src/eggs/discard.ts`, `reveal.ts`: the fall animates `.lost-card` from above to its own pose (rotate and translate end on its CSS, no jump).
8. `reveal.ts` no longer touches the Minimap.
9. `src/components/layout/workshop-row.tsx`: no `useDealScene`, no `data-scene`; `useDealPosition` for the mobile counter.
10. Documented in the contract (Reading hairline, I10).
11. Documented in the contract (Illustrations markup).
12. Approach drawings: vertical in the narrow sticky column from 1024 px (both layouts render, `detail.css` shows the vertical one there and caps its width by the viewport height, so the pinned drawing always fits: all three checked at 1024 and 1680 px, 740 px tall under the header); below 1024 the default layouts (horizontal in the wide reading column).
13. `about-timeline.tsx` (`labels`, stops at `(i + 0.5) × 960 / n`), `career-matrix.tsx` (`axes`), `discarded-card.tsx` (upright); About's timeline grid has no column gap so stop centres match the dots.
14. About passes `about.timeline.items`; `WorkshopFormat.glyph` in schema and content; Management renders a glyph per card; `CareerMatrix` and `WeekRing` take content.
15. Contract table; any section's illustration renders (`placement()` reads content only).
16. `SectionHead.caption`, `SectionCopy.caption`; the four captions set in content; Spreads pass `caption` only.
17. `site.labels.workshop`; `WorkshopRow` fields labelled.
18. `content/pages/about.ts` `topo.label`.
19. Schema comment and contract row for `HandCardCopy.facts`; contract and README no longer name deleted files or placeholder seeds.
20. `scoreboard.tsx` groups digits by word (`.scoreboard-word`); `.scoreboard-digits` wraps between words. No page is wider than 390 px at 390 px.
21. `scripts/images/manifest.mjs` `crop: [3, 2]`; `fetch-and-build.mjs --only team-of-teams-hero,about-tcg2` downloaded the 3:2 crops (2048×1365); the hero frame and Spread use `object-fit: cover`.
22. `fetch-and-build.mjs` clamps every placeholder to at most the ink glow's luminance (the two `#F8F8F8` ones are now `#2C2C2E`).
23. Already true; kept (`priority`, outside any reveal).
24. `pages.css`: from 1024 the role and intro sit beside the name (columns 7–12, bottom-aligned); phones start under the header and set the intro on the body size. Checked at 1440×900 and 390×844 (content ends above the fan and the counter).
25. `src/components/closing-contact.tsx`, rendered by `DetailPage` after the sections.
26. `.github/workflows/deploy.yml`: `actions/configure-pages@v6` (`id: pages`) → `SITE_URL` for the build; `src/lib/site.ts` `absoluteUrl()`; `layout.tsx` sets `metadataBase` and the `about-og` image only when `SITE_URL` is set (checked: a build with `SITE_URL` emits `og:image` = `<origin>/random/images/about-og-1280.jpg`, a local build none).
27. `scripts/smoke.mjs` imports `content/hand.ts` and `content/pages/not-found.ts`.

## Consistency pass

- Tokens only: ~150 literal px spacing values in the page CSS (`pages/*.css`, `layout/layout.css`,
  `site-footer.module.css`) are now `--space-*` (or `calc(var(--baseline) * n)`), value for
  value; four sub-grid values (5, 6 px) stay. No literal durations or easings in page CSS; the
  one literal font size (the mini card) uses the label token. Kept as documented exceptions: the
  illustration labels' fixed 11 / 20 px (their spec: constant at any drawing size) and the hand's
  card-face sizes.
- Grid and spacing: every page on `.spread-grid` sections with section spacing tokens; no
  horizontal scroll at 390 px on any route; content clears the hand reserve and the rail.
- Contact recomposed at ≥ 1024 (wider body measure, smaller gaps) so the whole page sits above the
  hand at 1440×900 with the real copy.
- Illustrations: each placed where the content says, in a `draw` reveal, in the page accent,
  fitting its column (checked in screenshots); registry and README texts of the eggs updated.

## Review

A subagent reviewed the merged diff against the contract, the decisions and the hard
constraints (correctness only). Its findings, all fixed and re-verified:

| Finding | Fix | Check |
| --- | --- | --- |
| Hero drift never moved: the frame's `overflow: hidden` made it a scroll container, so the `view()` timeline followed the frame | `overflow: clip` on `.case-hero-frame` | drift 0 → 6% from scroll 0 to 800 px, timeline source the root |
| Field lift dropped while the problem statement was on screen: the context Spread's leave reset the single breaker flag | Breakers counted in `reveal.ts` | field brighter with only the statement in view (45.2 vs 41.1 average with no breaker) |
| The vertical Approach drawing below 1024 px was taller than 4 viewports on short screens, so its 25% `inView` threshold was unreachable and it stayed hidden | `auto` layouts with the vertical one only in the sticky column; `inView` amount capped at 25% of the viewport's height for tall blocks | every reveal completes at 844×390, 1023×500, 640×360, 1024×600, 320×568 |
| Calm: reveals after a play started at 36% of the (unscaled) morph | Base = `zoomLanded` × the morph as the tier runs it (`tiers.vt`); switch timings for switches | smoke all tiers |
| Motion literals left in `hand-eggs.ts`, `play.ts`, `workshop-draw.tsx` | `duration.gather`, `duration.liftTimeout`, `stagger.gather`, `angle.lift`, `deal.toss`, `deal.flipPerspective` | eggs re-checked |

## Verification

- `BASE_PATH=/random/ npm run build`: passes (type check, content count checks, 12 routes).
- `node scripts/smoke.mjs http://localhost:4100/random/ --motion=full|calm|reduced`: all passed in
  each tier at 1440×900 and 390×844 (90 checks per tier), before and after the review fixes.
- Eggs in Chromium: new hand (M; counter long press by touch), Coffee ("draw" → fifth card),
  "?" sheet, tap 90° (T), inspect (hold Space), rare pull (`?rare`), workshop draw, "What's on the
  table" flip, 404 discard (`.lost-card` falls and rests at −12°, no animation left): all pass, no
  page errors.
- Screenshots (full page, both sizes) of home, the three case studies, Management, More
  projects, About, Contact, 404, looked at. Reduced motion emulated on every route: every reveal
  ends visible with no transform (the phone workshop glyphs in cards 2–4 reveal when swiped into
  view inside the scroll row).
- `scripts/budget.mjs`: 162.8 KB gzip initial JS (184.8 KB by network idle), within the advisory
  170 KB.

## Known issues

See the final report in the session; the polish list is repeated here once the deploy is done.
