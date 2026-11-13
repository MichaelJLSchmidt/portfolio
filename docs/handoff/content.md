# Content & Images session

## Branch

`claude/content-images-moritz-qlxscu` (pushed only to this branch; never `main`).

## Plan

Written before editing.

1. **Images**: `scripts/images/fetch-and-build.mjs` (sharp, already in the lockfile as Next's
   optional dependency, so no new dependency). It downloads the 14 Unsplash photos at 2048 px,
   writes `public/images/<id>-{640,1280,2048}.{avif,webp,jpg}` (AVIF 50, WebP 72, JPEG 78),
   measures width, height and the dominant colour, and regenerates `content/images.ts` from its
   manifest. The three generated placeholder heroes and `scripts/images/placeholders.mjs` go.
2. **Picture**: finish `src/components/picture.tsx` against the [Picture](../contracts.md#picture)
   contract (AVIF + WebP sources, JPEG `<img>`, 640/1280/2048 srcset, base path, width/height,
   lazy or eager + `fetchpriority="high"`). Read the registry from `@content/images` directly so
   the component never pulls page text into a bundle.
3. **Content**: replace every placeholder with the approved copy, word for word, as typed
   modules: `content/site.ts`, `content/hand.ts` (slim, D7), `content/cases/*.ts` (three case
   studies), `content/pages/*.ts` (home, Management, More projects, About, Contact, 404,
   workshop methods), assembled in `content/index.ts`. Fields the approved copy does not give
   keep the current copy (chrome labels, settings, shortcuts, egg announcements, topography).
4. **Delete (D8)**: `site.json`, `case-studies.json`, `projects.json`, `workshops.json`,
   `about.mdx`, `management.mdx`, `content/work/*`, `adapters.ts`; fold `cards.ts` into
   `hand.ts` (only content modules import it).
5. **Verify**: type check and production build (count checks), a content assertion script,
   no page text in the slim modules, Chromium at 1440×900 and 390×844 on a case study and
   About with no 404s under `/random/`.

## What shipped

### Content ([Content schema](../contracts.md#content-schema))

| Module | Exports | Notes |
| --- | --- | --- |
| `content/site.ts` (slim) | `site: Site` | New: name, description, header labels, footer note, `labels.meta`, `labels.decision`, `owned` / `notOwned`. Kept: skip link, intro skip, `homeLabel`, `back`, settings, shortcuts, egg announcements, other labels. Imports only `type` from `./schema`. |
| `content/hand.ts` (slim) | `hand: HandContent`, `coffeeEgg: CoffeeEgg` | Order, identities, rail labels, four cards, Coffee card. `content/cards.ts` folded in. `labels` kept. Imports only types. |
| `content/cases/team-of-teams.ts`, `shared-foundations.ts`, `front-door.ts` | `teamOfTeams`, `sharedFoundations`, `frontDoor: CaseStudy` | Slugs, numbers 01–03 and identities unchanged (D6); 5 metrics, 4 steps, 4 decisions each. |
| `content/pages/home.ts`, `management.ts`, `workshop-methods.ts`, `more-projects.ts`, `about.ts`, `contact.ts`, `not-found.ts` | `home`, `management`, `workshopMethods`, `moreProjects`, `about`, `contact`, `notFound` | 13 More projects items, 12 workshop methods; About topography label, attribution and placeholder note kept. |
| `content/index.ts` | `content … satisfies Content`, every named export, `images` | Unchanged export names. |
| `content/images.ts` | `images`, `type ImageId` | Generated (see below). 14 entries, all `kind: 'photo'`. |

- Copy is the approved text word for word, including straight quotes, en dashes, `→` and the
  minus sign `−` in "−38%" / "−31%". Section `body: []` where the approved copy says "(empty
  list)". Contact's LinkedIn entry has no `href` (placeholder, shown as text).
- **TODO fields: none.** Every required field has approved or current copy. Optional fields the
  approved copy leaves out stay unset: `about.story.title` (falls back to the label "Story"),
  `management.heroImage`, `note` on most sections.
- Images the content references: three heroes, three case `context` images, Management
  `principles` / `workshops`, About `story` (about-roots), `tcg` (about-tcg), `roots`
  (about-lake). `about-mountain`, `about-tcg2` and `about-og` are registered without a slot
  (breakers; `about-og` is the Open Graph image).
- Illustrations named by the content: Team of Teams `approach` IntakeBeforeAfter, artefact
  TeamGrowthTimeline; Allmend `approach` DesignSystemLayers, artefact ContributionLoop,
  `outcomes` AdoptionBars; Moving house `problem` JourneyEmotionCurve, `approach`
  ServiceBlueprint. TeamConstellation and CareerMatrix are not referenced by the final content.

### Deleted (D8)

`content/site.json`, `case-studies.json`, `projects.json`, `workshops.json`, `about.mdx`,
`management.mdx`, `content/work/{team-of-teams,shared-foundations,front-door}.mdx`,
`content/adapters.ts`, `content/cards.ts` (only `hand.ts` and `adapters.ts` imported it; every
`@/lib/cards` import is `src/lib/cards.ts`, which stays), `scripts/images/placeholders.mjs` (it
would overwrite the photos). Nothing imports any of them.

### Images ([Picture](../contracts.md#picture))

- `scripts/images/manifest.mjs`: the 14 photos (id, Unsplash base URL, page, photographer,
  handle, alt). Alt text and credits are edited here.
- `scripts/images/fetch-and-build.mjs` (sharp 0.35.5 from the lockfile): downloads
  `<base>?auto=format&fit=crop&w=2048&q=80` (cache: `node_modules/.cache/images`), writes
  `public/images/<id>-{640,1280,2048}.{avif,webp,jpg}` (AVIF q50 effort 6, WebP q72, mozjpeg
  q78 progressive), records the 2048 rendition's real width/height and the dominant colour,
  removes stale files and regenerates `content/images.ts`. `--force` re-downloads; `--remote`
  writes the hotlink fallback (no download, 2048 × 1365 assumed). A full run takes about 7 min
  (AVIF encoding).
- **Result: self-hosted**, not hotlinked. 126 files, 10,072,962 bytes (9.6 MiB): AVIF 2.2 MiB,
  WebP 2.8 MiB, JPEG 4.6 MiB. Measured sizes: all 2048 wide; heights 1150–1420, except
  `team-of-teams-hero` and `about-tcg2`, which are portrait **2048 × 3072**.
- `src/components/picture.tsx`: `<picture data-image>` with AVIF then WebP `<source>` (each with
  `sizes`) and a JPEG `<img>` (`srcset` 640/1280/2048 w, `src` = the 1280 JPEG), every URL
  through `withBase()`, `width`/`height` from the entry, `decoding="async"`, placeholder colour
  as background, `loading="lazy"` or with `priority` `loading="eager"` + `fetchpriority="high"`.
  The remote (hotlink) branch is kept for the fallback. It now imports the registry from
  `@content/images` and types from `@content/schema` instead of `@/lib/content`. The props and
  `getImage()` are unchanged.
- `scripts/images/check.mjs`: loads the real TS modules through Node's type stripping and asserts
  3 case studies, 13 More projects items (and that the count line matches them), 12 workshop
  methods, 14 photos, each with alt, photographer, photographerUrl (`https://unsplash.com/@…`),
  pageUrl and a placeholder; every rendition on disk and the 2048 JPEG matching the recorded size;
  every referenced image id exists; `hand.ts` / `site.ts` import only types; no placeholder copy;
  the deleted files are gone.

## Contract change requests

1. **`HandCardCopy.facts` doc** (`content/schema.ts` comment, contracts table "role, team,
   timeframe, client"): the approved cards carry **two** facts with their own labels (e.g.
   "Team: 2 → 5 people", "Completion: 54% → 83%"). The type (`Fact[]`) already allows it; only
   the comment and the contracts row should say "the card's facts (two in the final content)".
   No workaround needed.
2. **Docs that still name deleted files**: `docs/contracts.md` (file map lines for
   `adapters.ts`, `cards.ts, *.json, *.mdx`; the Picture "Seeds" paragraph about
   `placeholders.mjs` and generated gradients; the Content schema paragraph naming
   `content/adapters.ts`) and the content tree in `README.md`. Smallest change: replace them with
   `cases/*.ts`, `pages/*.ts`, `images.ts` (generated by `scripts/images/fetch-and-build.mjs`) and
   "14 photos, AVIF/WebP/JPEG at 640/1280/2048".
3. **Illustration placement table** (contracts, Illustrations): the final content places
   IntakeBeforeAfter in Team of Teams `approach`, DesignSystemLayers in Allmend `approach`,
   AdoptionBars in Allmend `outcomes`, JourneyEmotionCurve in Moving house `problem` and
   ServiceBlueprint in its `approach`, not all under "artefacts". The data is valid against the
   schema (`SectionCopy.illustration`); the table's "Where" column should follow the content.

## Known issues

- **Scoreboard overflows on phones with the final metrics (Layout).** "9 → 3 weeks" and
  "3 weeks → 4 days" are `span.scoreboard-digits` rows (`display: inline-flex`, one span per
  character) that cannot wrap in the two-column phone Scoreboard: at 390 px the layout viewport
  grows to 399 px (`/work/team-of-teams/`) and 501 px (`/work/shared-foundations/`). In Chromium's
  mobile emulation that aborts the `play` / `switch` view transitions ("Transition was aborted
  because of invalid state. Viewport size changed"). The same smoke run passes on `main`, whose
  placeholder metrics are short. Smallest fix in `src/components/layout/layout.css`:
  `.scoreboard-digits { flex-wrap: wrap }` (or a smaller phone size / single column).
  The copy stays word for word.
- **`scripts/smoke.mjs` (Motion) hard-codes the old card titles**: lines 161, 173 ("Team of
  Teams", "Front Door") and 195. The final titles are "Building the team", "Allmend design
  system", "Moving house, once". Smoke on this branch: 8 failed. Three are those title checks on
  desktop, two on phone, and three are the phone view-transition aborts above.
- **Portrait hero**: `team-of-teams-hero` is 2:3 (2048 × 3072, the source as specified). In the
  full-bleed Spread it renders 1440 × 2160 at 1440 px, so the first viewport shows only the wall
  above the notes. Layout should give the Spread media an aspect box with `object-fit: cover`.
  The alternative is a crop parameter for this one source in `manifest.mjs`, which needs a
  decision because the brief fixes the query.
- **Placeholder colours** are sharp's coarse dominant colour; two are near white (`#F8F8F8`:
  `shared-foundations-hero`, `about-roots`), which flashes light on the dark site before decode.
- **Hero priority**: the Spread on case studies does not pass `priority` yet (Layout), so the hero
  loads lazily. `<Picture priority>` works.
- **Open Graph**: `about-og` is registered; setting `metadata.openGraph.images` needs an absolute
  URL (Pages origin + base path), which is Layout's / Integration's call.
- **Topography label**: the kept label says "Lake Thun area", while `public/topo/meta.json`
  covers Interlaken between both lakes and the Roots copy says "The contour lines behind this page
  are its terrain" (Interlaken). Kept as instructed; flagging for a copy decision.
- About renders no `<Picture>` on this branch (story / tcg / roots images are Layout's); its
  colophon already lists all 14 photos with links.

### How it was checked

- `npx tsc --noEmit`: clean. `BASE_PATH=/random/ npm run build`: passes, including the count
  checks in `src/lib/content.ts`; all 12 routes are static.
- `node scripts/images/check.mjs`: `ok: 3 case studies, 13 More projects items, 12 workshop
  methods, 14 photos with credits, 11 image references, slim modules type-only`.
- Client bundle (`dist/_next/static/**/*.js`): page text ("Eleven date pickers", "Lindengrund
  builds and runs", "Hyper Island", "Lightning Decision Jam", "Accessibility audit programme")
  is in no chunk; card copy ("Allmend design system", the Coffee card) and site chrome are.
- `node scripts/budget.mjs`: initial JS **158.4 KB gzip** across 8 files (163.1 KB by network idle;
  Foundation reported 163.6 KB initial before this change).
- Chromium (Playwright) at 1440×900 and 390×844 on `/random/work/team-of-teams/`,
  `/random/work/front-door/` and `/random/about/`: no response ≥ 400; every `<picture>` decoded
  from `/random/images/…` and picked AVIF (`team-of-teams-hero-2048.avif` at 1440, `-640.avif` at
  390); all 126 renditions answer 200 under `/random/images/`. The only failed requests are
  `ERR_ABORTED` fetches of the card routes from `router.prefetch()` in `hand.tsx`, which are not
  images and not HTTP errors. The local preview server sends AVIF/WebP/JPG as
  `application/octet-stream`; Chromium decodes them anyway, and GitHub Pages sends real types.
- Prettier: every changed file is formatted.
