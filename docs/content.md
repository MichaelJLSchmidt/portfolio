# Content

Every word, number and link the site shows lives in `src/content`. Components render only what
is there and never hardcode copy, so a change of wording is an edit in one file, and
`npm run check:content` can see every gap. This page says where each kind of content lives, how
unfinished content is marked and checked, and what the owner still has to supply.

## Where copy lives

| File | Holds |
| --- | --- |
| `site.ts` | The name source and the brand (below), the page title and its template, the site description, the header's labels (Case studies, About, Contact), the Motion control, the footer (the clock, the credit, the coordinates, the wordmark's name), the skip link, the 404 page. |
| `home.ts` | The home page, top to bottom: the role line, the intro sentence and "More about me", Case studies, Earlier projects (newest first; a row links once it has an `href`). |
| `about.ts` | About: the header and portrait slot, Who I am (facts and paragraphs), Career so far (the camps), How I lead, How I work with people, How I start with a new team, Skills beyond design, Tools and craft, Away from work: cards. Also `holding`: the under-construction page and the password gate. |
| `contact.ts` | The email and LinkedIn links (the only place they are written; home, About, the footer and the under-construction page read them), Get in touch, Copy address and its toast. |
| `cards.ts`, `card-labels.ts`, `case-study-labels.ts` | The map-sheet cards (`projectCards`, then the flagged examples): name, year, sector, role, team size, reach, the headline number (`impact`), the terrain; the fixed labels of cards and case studies and the per-card helpers live apart (re-exported by `cards.ts`), so client components can use them without bundling every card. |
| `case-studies.ts` | Real case studies, keyed by their card's slug (`projectCaseStudies`), then the flagged examples. |
| `examples/` | Flagged fictional examples (below). |
| `geo.ts`, `geo-data.json` | Verified places: each case study's summit (the header plate's line, the card's set line) and the About climb (below). |
| `relief.ts` | Which large titles carry the relief fill (the footer wordmark and the gate mark). |
| `example-values.ts` | `ex()`, the marker for invented values (below). |
| `lab.ts` | The motion lab's copy (review builds only). |
| `terrain.config.json` | The input of `npm run terrain`: the region and the card terrains (`docs/terrain.md`). |
| `portrait.json` | Written by `npm run portrait` (below); absent until the photo is supplied. |

Server pages pass copy to client components as props where importing the content module would put
it into a client bundle.

## The name and the brand

`site.name` in `src/content/site.ts` is the name source: the only place the display name is
written. The hero reads it as `site.hero.name` and sets it as written: it wraps between words
wherever the column ends and is never sized or split by its length. The page titles, the Open
Graph site name, the web manifest, the portrait's alt text, the motion lab, the under-construction
page and the gate read it too.

`site.brand` is a separate setting: a short brand of a few capitals. It names the header's home link
(read as "<brand>, home"), the footer wordmark and the gate's mark (live text with the relief fill),
the manifest's short name and the application name.

A change of either is one edit; nothing else needs touching. `npm run check:name` proves it: it
builds copies with neutral names of 8, 18 and 32 characters and brands of 2, 4 and 10, checks that
no file of the export still holds the real ones, and that nothing scrolls sideways or clips at 320,
390, 768, 1440 and 2560 px.

## Unfinished content

Two markers, both listed by `npm run check:content` with file, line and field:

- **`[PLACEHOLDERS]`**: a fact still to confirm, written in square brackets and capitals, e.g.
  `"[LEVEL TO CONFIRM]"`. A link without a URL yet is `href: null`: it renders as a visible, inert
  placeholder. Card stats are optional instead: leave a stat out until there is a real number, and
  the card's stat row shows only those with a value (and disappears without any).
- **`ex("…")`** (`src/content/example-values.ts`): an invented value in real content (a figure, a
  date, a line) that shows the intended storytelling until the real one exists. It renders as
  written; components can tell it apart (`isExample`).

`npm run build` runs `check:content --build` for its `SITE_MODE`:

| `SITE_MODE` | Placeholders and example values |
| --- | --- |
| `construction` | Fails while the under-construction page's own facts (`holding` in `about.ts`: the name and the email and LinkedIn links) are placeholders; nothing else counts. `npm run check:content -- --mode=construction` lists those. |
| `basecamp` | Warns only: they stay visible on the gated site, so the gaps are easy to spot. |
| `live` | Fails on any placeholder or example value. |

With `NEXT_PUBLIC_PREVIEW=1` a local build only warns, in every mode. In every mode but
construction the check also validates each case study against the template (below) and stops
the build on an incomplete one. `npm run build` also runs `check:wording`, which fails on old
names, a CV or a `.pdf` link, or job-seeking phrases in any built page.

## Flagged examples

`src/content/examples` holds three complete, fictional case studies at one fictional employer:
Seilschaft (people: building a UX practice), Test Project (service: a subsidy form) and Gratweg
(platform: a design system), in card order, the panorama from Interlaken: the Eiger, the
Mönch and the Jungfrau. Test Project uses every block; read it as the reference.

Each card and case study is marked `example: true`. They carry an example line above the H1, a
"Fictional example" stamp on the card, noindex, and a strip on every image; they sit last among the
cards. Their values are invented on purpose, so `check:content` skips them and names them once.
Where they exist is `includesExamples` in `src/hosting/config.ts`:

| Build | Examples |
| --- | --- |
| `SITE_MODE=basecamp` (branch deploys, Deploy Previews) | included |
| `SITE_MODE=live` | excluded: no route, card, asset, sitemap entry or bundle code |
| no `SITE_MODE` | included in `npm run dev` and with `NEXT_PUBLIC_PREVIEW=1`, else excluded |

A live build swaps `@/content/examples` and its case studies for `none.ts` (`next.config.ts`),
removes their files from `out/` and fails if anything of theirs is left. Their card terrains are
in `terrain/examples.json` and `public/terrain/field/examples.json`, not `terrain.json`. With no real project yet, a live build's
Case studies section is empty and says so, and `/work/` generates no case study.

## Case studies

The content model is `src/lib/case-study.ts`; the copy is in `case-studies.ts` and
`src/content/examples`; the components in `src/components/case-study`. Every case study has the
same parts, in this order:

- **Trailhead:** a lede (the meta description), the problem in two or three sentences, the result
  in one line (`impactLine`), and role · team · time (`facts`). An optional `typeLine`.
- **Summary** (the legend sheet): the brief, the outcome (items with their evidence: measured,
  estimated or qualitative), my role, the team I led, what I put in place, the key decision, an
  optional closing note.
- **Six stages**, with the ids `context`, `leadership`, `discovery`, `decisions`, `delivery` and `outcome`: each a short name and a
  finding (its heading, a sentence), then blocks: paragraphs (with an optional side note),
  lists, figures, decisions and at most one key insight. No quotes or testimonials.
- **Decisions:** a question and two or more options, each with what spoke for and against it and
  its cost; exactly one `chosen`, the others `rejected`. One more decision, the one we reversed,
  has exactly one `reversed` option with the date and reason we turned back.
- **After launch:** a captioned, dated log. **Results:** each metric before and after, its
  evidence and the stage (1–6) it was won at.
- **Looking back:** each lesson with "Next time I would …". **Team:** each role with its count and
  a line on what they did; no names. **What I did not do** and the credits.

The six stages carry the ids `context`, `leadership`, `discovery`, `decisions`, `delivery` and
`outcome`, in that order. `validateCaseStudy` rejects a case study with any part missing or
malformed; the unit tests and `check:content` run it, so an incomplete case study never builds.

### The page: the Calm Survey template

`surveyLayout()` (`src/lib/survey-layout.ts`, unit-tested) lays the content out; nothing is
invented and every part lands in exactly one place. In page order, alternating the dark ground
and the light sheet:

1. **Header plate**: the card's level plate full bleed, with the meta line, the H1 and the summit
   · altitude · coordinates (`geo.ts`).
2. **Summary** (sheet): the problem, my role, team · duration · reach (`facts` and the card's
   `reach`), the key decision, the outcome with its evidence.
3. **01 · Context**: the context stage and the brief, beside the contents trail.
4. **Metric band**: the card's `impact.after` and the impact line.
5. **02 · Findings**: the discovery stage, an offset pair of its first two plain images (from
   discovery and delivery), then the delivery stage.
6. **Decisions**: the decisions stage's finding, each decision a step beside a sticky figure (the
   figure that follows it in the stage, or its options set as type).
7. **Options** (sheet): every decision's options in full, then the decision we reversed.
8. **Map frame**: the `hero` figure, full bleed in a map-sheet frame.
9. **03 · Leading the team**: the leadership stage's finding as the page's one pull statement (the
   owner's own words), its blocks, the team I led, what I put in place, the team by role.
10. **Outcome** (sheet): the results as tiles (after, from before, evidence, the stage it was won
    at), the outcome stage, any before/after figure, the after-launch log.
11. **Reflection**: looking back, what I did not do, the credits.
12. **Next case study**: the next card, then "Back to case studies".

The header's summit comes from the card's terrain: one of the summits in `geo.ts` (`eiger`,
`moench`, `jungfrau`). A new mountain needs its summit there, the place in
`scripts/geo/geo.config.json` and a crop card in `terrain.config.json` (then `npm run terrain`,
which also writes its plates).

### Numbers come from a data file

A case study can keep every number in one data file (the examples: `examples/<slug>/data.ts`,
with its `keyFigures` and `consistency` checks). Copy, the card, captions, alt text and the
artefact sources then write each number as a token resolved by `src/lib/fill.ts`:
`{{outcomes.complete.after}}%`, `{{workshops.count|word}}`, `CHF {{subsidy.maxChf|en}}`. Formats:
none (as written), `en` (2,800), `ch` (10'000), `word` and `Word` (up to twenty), `ordinal`,
`signed` (with a real minus sign). An unknown path stops the build.
`src/content/examples/sources.ts` tells the tools where such a case study keeps its data, copy,
artefacts, images and manifest.

- `npm run images` renders each image from its HTML or SVG source in `artefacts/<slug>/` and
  encodes it into `public/media/<slug>/`, writing the manifest next to the data file (README,
  "Artefact images").
- `npm run check:figures` (every build that includes examples runs it) fails when copy, the card or
  an artefact writes a digit of its own, when the data contradicts itself, when a key figure is
  missing where it must appear, when a committed image is older than its data or source, on a
  missing alt text, a caption over about 30 words, or more than one key insight.

After changing a data file or an artefact, run `npm run images`.

## Geo data

`src/content/geo.ts` holds the places the site names with their altitudes: each case study's
summit (the Eiger, the Mönch, the Jungfrau: the header plate's line and the card's set line) and
the About climb from Ittigen to the Bantiger. `geo-data.json` also keeps the verified stages of
each ascent from Interlaken Ost, which the pages no longer print. The values come from
swisstopo through `npm run geo` (`scripts/geo/build.mjs`, configured in
`scripts/geo/geo.config.json`), which writes `geo-data.json`; edit the config, never the JSON.
Every altitude carries its source; where a research value disagreed, swisstopo won and the
conflict is kept beside the value; a value from elsewhere is flagged `secondary` (the Bantiger
tower's tip, about 1'129 m). Drawings are stylised; the numbers are not. `docs/terrain.md` has
the sources and checks.

Labels format altitudes with `altitudeLabel` ("2’061 m", Swiss thousands separator).

## The relief fill

`src/content/relief.ts` lists the titles that carry the relief fill (`docs/motion.md`): today the
footer wordmark and the gate's mark. Add a large bold title's id to opt it in; never body text,
navigation, ordinary links or buttons.

## The About portrait

Until a photo is supplied, a framed "Portrait to come" slot stands in on About and
`about.portrait.missing` holds the placeholder `[PORTRAIT PHOTO]`, so a live build stops on it.
To add the photo:

1. Cut the person out of the background and save it as a PNG with transparency (the script
   refuses an image without an alpha channel).
2. Run `npm run portrait -- path/to/cutout.png [--duotone=0.2] [--contours]`
   (`scripts/portrait.mjs`). It writes AVIF and WebP with alpha at 480, 800, 1200 and 1600 px
   wide (up to the source's width) into `public/media/portrait/`, stepping the 800 px AVIF's
   quality down until it is at most 120 KB. `--duotone` lays a ground-to-sheet duotone over
   the photo at that strength (default and maximum 0.2), so the portrait sits in the palette
   without losing its own colours; `--contours` adds faint contour rings (8%) that fade out around
   the face. It writes the sizes and sources to `src/content/portrait.json`. The output is the
   same for the same input.
3. In `src/content/about.ts`, set `portrait.image` to the import of `./portrait.json` and delete
   `portrait.missing`. The slot then shows the photo, and the placeholder is gone from
   `check:content`.

`portrait.alt` is the photo's alt text.

## The career camps

In `src/content/about.ts`: each role with its year and `at`, its position along the Ittigen →
Bantiger trail from 0 (Ittigen) to 1 (the summit). The career line places each role on the trail;
the last camp is today's role. The line is drawn once as it comes into view (`docs/motion.md`).

## What the owner must supply

`npm run check:content` lists the current gaps; at the time of writing:

- **Placeholders (2):** the portrait photo (`about.portrait.missing`, above) and the level of
  French in About's facts (`[LEVEL TO CONFIRM]` in the Languages row).
- **Example values (52)**, each to be replaced by a real one:
  - About: the three earlier camps' years; the lead; the facts (role, team, based, born, trained,
    languages); the two Who I am paragraphs; the critique rule's detail; the six skills' proofs;
    the card lines written with `ex()`; the four How I lead evidence lines.
  - Home: the intro; the six Earlier projects entries (year, type, sector and role each).
- **Real projects:** no real card or case study is written yet (`projectCards` in `cards.ts`,
  `projectCaseStudies` in `case-studies.ts`). Each needs a card on one of the three summits'
  terrains and a complete case study; the headline number only where there is a real one. A real case
  study is never flagged `example`, so `check:content` and a live build treat its placeholders
  like any other.
- **The contact links** are set; a link without a URL would show as `href: null` in the list.

Launch (README, "Launch") needs the list empty: a live build fails on any entry.
