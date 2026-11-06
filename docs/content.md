# Content

Every word, number and link the site shows lives in `src/content`. Components render only what
is there and never hardcode copy, so a change of wording is an edit in one file, and
`npm run check:content` can see every gap. This page says where each kind of content lives, how
unfinished content is marked and checked, and what the owner still has to supply.

## Where copy lives

| File | Holds |
| --- | --- |
| `site.ts` | The name source and the brand (below), the page title and its template, the site description, the HUD's labels (navigation, the Calm map and Haptics switches and their descriptions), the footer, the skip link, the 404 page. |
| `home.ts` | The home page, top to bottom: the hero's tags and scale bar, the intro and its "At a glance" rows, How I lead (four principles, each with its illustration id and an evidence line), Selected work, Earlier work (a logbook; the first ten entries show). |
| `about.ts` | About: the portrait card, the lead, Who I am (facts and paragraphs), How I work with people, How I start with a new team, Skills beyond design (the field kit), Career so far (the camps), the card binder, Tools and craft. Also `holding`: the under-construction page and the password gate. |
| `contact.ts` | The email and LinkedIn links (the only place they are written; home, About, the footer and the under-construction page read them), Get in touch, Copy address and its toast. |
| `cards.ts`, `card-labels.ts` | The Summit Cards (`projectCards`, then the flagged examples) and their type; the fixed labels of cards and case studies and the per-card helpers live in `card-labels.ts` (re-exported by `cards.ts`), so client components can use them without bundling every card. |
| `case-studies.ts` | Real case studies, keyed by their card's slug (`projectCaseStudies`), then the flagged examples. |
| `examples/` | Flagged fictional examples (below). |
| `geo.ts`, `geo-data.json` | Verified places, the three ascents and the About climb (below). |
| `flood.ts` | Which titles carry the contour flood (below). |
| `example-values.ts` | `ex()`, the marker for invented values (below). |
| `lab.ts` | The motion lab's copy (review builds only). |
| `terrain.config.json` | The input of `npm run terrain`: the region, its posters, lakes and the card terrains (`docs/terrain.md`). |
| `portrait.json` | Written by `npm run portrait` (below); absent until the photo is supplied. |

Server pages pass copy to client components as props where importing the content module would put
it into a client bundle (the deck receives its section copy and captions from the home page).

## The name and the brand

`site.name` in `src/content/site.ts` is the name source: the only place the display name is
written. The hero reads it as `site.hero.name` and sets it on at most two lines
(`src/lib/name-lines.ts`: a name over twelve characters breaks before its last word); the page
titles, the Open Graph site name, the web manifest, the portrait's alt text, the
under-construction page and the gate read it too.

`site.brand` is a separate setting: a short brand of a few capitals. It names the HUD's home link
(read as "<brand>, home"), the bar of the under-construction page and the gate, the manifest's
short name, the application name, and the footer wordmark, whose outlines and construction lines `npm run wordmark` (`scripts/wordmark.mjs`)
generates from it into `src/components/footer/wordmark.json`.

A change of either is one edit. `npm run build` and `npm run dev` re-run the title measurement
(`npm run titles`: every display title in `src/lib/display-titles.ts`, the name and the brand
among them, gets its width knots in `src/lib/title-axes.json`) and the wordmark, so nothing else
needs touching. Preview builds take `?name=…` to try the hero with another name for one page load.

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
(platform: a design system), in that deck order, the panorama from Interlaken: the Eiger, the
Mönch and the Jungfrau. Test Project uses every block; read it as the reference.

Each card and case study is marked `example: true`. They carry an example line above the H1, a
"Fictional example" stamp on the card, noindex, and a strip on every image; they sit last in the
deck. Their values are invented on purpose, so `check:content` skips them and names them once.
Where they exist is `includesExamples` in `src/hosting/config.ts`:

| Build | Examples |
| --- | --- |
| `SITE_MODE=basecamp` (branch deploys, Deploy Previews) | included |
| `SITE_MODE=live` | excluded: no route, card, asset, sitemap entry or bundle code |
| no `SITE_MODE` | included in `npm run dev` and with `NEXT_PUBLIC_PREVIEW=1`, else excluded |

A live build swaps `@/content/examples` and its case studies for `none.ts` (`next.config.ts`),
removes their files from `out/` and fails if anything of theirs is left. Their card terrains are
in `public/terrain/examples.json`, not `terrain.json`. With no real project yet, a live build's
deck is empty and says so, and `/work/` generates no case study.

## Case studies

The content model is `src/lib/case-study.ts`; the copy is in `case-studies.ts` and
`src/content/examples`; the components in `src/components/case-study`. Every case study has the
same parts, in this order:

- **Trailhead:** a lede (the meta description), the problem in two or three sentences, the result
  in one line (`impactLine`), and role · team · time (`facts`). An optional `typeLine`.
- **Summary** (the legend sheet): the brief, the outcome (items with their evidence: measured,
  estimated or qualitative), my role, the team I led, what I put in place, the key decision, an
  optional closing note.
- **Six stages**, one per stage of the ascent: each an id, a short name for the timeline and a
  finding (its heading, a sentence), then blocks: paragraphs (with an optional side note),
  lists, figures, decisions and at most one key insight. No quotes or testimonials.
- **Decisions:** a question and two or more options, each with what spoke for and against it and
  its cost; exactly one `chosen`, the others `rejected`. One more decision, the one we reversed,
  has exactly one `reversed` option with the date and reason we turned back.
- **After launch:** a captioned, dated log. **Results:** each metric before and after, its
  evidence and the stage (1–6) it was won at.
- **Looking back:** each lesson with "Next time I would …". **Team:** each role with its count and
  a line on what they did; no names. **What I did not do** and the credits.

`validateCaseStudy` rejects a case study with any part missing or malformed; the unit tests and
`check:content` run it, so an incomplete case study never builds. The page's ascent comes from its
card: the card's artwork must be a crop terrain that is one of the ascents in `geo.ts` (`eiger`,
`moench`, `jungfrau`), or the page refuses to build. A new mountain needs an ascent in `geo.ts`,
its places in `scripts/geo/geo.config.json` and a crop card in `terrain.config.json`.

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

`src/content/geo.ts` holds the places the site names with their altitudes: the six stages and the
summit of each ascent (from Interlaken Ost, by the Mittellegi ridge, the Mönch's southeast ridge
and the Rottalsattel), and the About climb from Ittigen to the Bantiger. The values come from
swisstopo through `npm run geo` (`scripts/geo/build.mjs`, configured in
`scripts/geo/geo.config.json`), which writes `geo-data.json`; edit the config, never the JSON.
Every altitude carries its source; where a research value disagreed, swisstopo won and the
conflict is kept beside the value; a value from elsewhere is flagged `secondary` (the Bantiger
tower's tip, about 1'129 m). Drawings are stylised; the numbers are not. `docs/terrain.md` has
the sources and checks.

Labels format altitudes with `altitudeLabel` ("2’061 m", Swiss thousands separator).

## Flood switches

`src/content/flood.ts` says which titles carry the contour flood (a glacier fill that spreads
through a title on hover, keyboard focus or a tap; `docs/motion.md`). Set any to `false`:

| Switch | Where |
| --- | --- |
| `heroName` | the name in the home page's hero |
| `sections.lead`, `.work`, `.earlier`, `.contact` | the home section titles (Get in touch also on About) |
| `caseStudyTitle` | each case study's H1 |
| `footerWordmark` | the outline wordmark in the footer |
| `buttons` | every `FloodButton` (Copy address, the portrait card's toggle) |

About's own section titles and its H1 carry no flood.

## The About portrait

Until a photo is supplied, a contour silhouette stands in on the portrait card and
`about.portrait.missing` holds the placeholder `[PORTRAIT PHOTO]`, so a live build stops on it.
To add the photo:

1. Cut the person out of the background and save it as a PNG with transparency (the script
   refuses an image without an alpha channel).
2. Run `npm run portrait -- path/to/cutout.png [--duotone=0.2] [--contours]`
   (`scripts/portrait.mjs`). It writes AVIF and WebP with alpha at 480, 800, 1200 and 1600 px
   wide (up to the source's width) into `public/media/portrait/`, stepping the 800 px AVIF's
   quality down until it is at most 120 KB. `--duotone` lays a ground-to-paper-dusk duotone over
   the photo at that strength (default and maximum 0.2), so the portrait sits in the palette
   without losing its own colours; `--contours` adds faint contour rings (8%) that fade out around
   the face. It writes the sizes and sources to `src/content/portrait.json`. The output is the
   same for the same input.
3. In `src/content/about.ts`, set `portrait.image` to the import of `./portrait.json` and delete
   `portrait.missing`. The card then shows the photo, and the placeholder is gone from
   `check:content`.

`portrait.alt` is the photo's alt text; `rarity` and `collector` set the card frame.

## The binder pockets and the career camps

Both are in `src/content/about.ts`.

- **The card binder** (`cards.binder.pockets`): nine pockets, three by three, in order. A pocket
  is `{ kind: "deck", game, line }` (a deck box for a game), `{ kind: "trainer", line }`,
  `{ kind: "workshop", line }` or `{ kind: "empty" }` (the first empty one carries the "Still
  collecting" label). The cards are original drawings: no game's logo, art or card frame. A tap
  turns a card over to its line; the lines are also listed as text beside the binder, under each
  card's name ("Deck box · <game>", "Trainer card", "Workshop card").
- **The career camps** (`camps`): each role with its year and `at`, its position along the
  Ittigen → Bantiger trail from 0 (Ittigen) to 1 (the summit). The career profile stands each
  role on the trail at the terrain's real height there (the official spot heights at the two
  ends); the last camp is the summit and reads "<title> · <year>". Above it a dashed line climbs
  the transmitter mast to about 1'129 m, with the outlook (`career.outlook`) beside it.

## What the owner must supply

`npm run check:content` lists the current gaps; at the time of writing:

- **Placeholders (2):** the portrait photo (`about.portrait.missing`, above) and the level of
  French in About's facts (`[LEVEL TO CONFIRM]` in the Languages row).
- **Example values (52)**, each to be replaced by a real one:
  - About: the three earlier camps' years; the lead; the facts (role, team, based, born, trained,
    languages); the two Who I am paragraphs; the critique rule's detail; the six skills' proofs;
    the four binder lines written with `ex()`.
  - Home: the intro; the four How I lead evidence lines; the six Earlier work entries (year,
    type, sector and role each).
- **Real projects:** no real card or case study is written yet (`projectCards` in `cards.ts`,
  `projectCaseStudies` in `case-studies.ts`). Each needs a card on one of the three ascents'
  terrains and a complete case study; card stats only where there is a real number. A real case
  study is never flagged `example`, so `check:content` and a live build treat its placeholders
  like any other.
- **The contact links** are set; a link without a URL would show as `href: null` in the list.

Launch (README, "Launch") needs the list empty: a live build fails on any entry.
