# Portfolio — Calm Survey

Portfolio of a UX Team Lead / Senior UX Designer from Interlaken. Art direction ("Calm Survey",
`docs/motion.md`): a survey map sheet on a dark desk. The contours are always there and slightly alive;
every interaction maps to a cartographic action. Fewer effects, one signature effect.

The pieces:

1. **The living survey**: one WebGL2 canvas behind every page, real swisstopo contours in stone grey. It
   drifts and breathes too slowly to watch, bends a few pixels under a fine pointer, and crossfades to the
   next terrain on a page change (a case study's summit, Bern on About). Quiet zones fade the lines behind
   text. The gate draws it with the same code. `docs/terrain.md` has the details.
2. **The relief fill** (the one signature effect): the footer wordmark and the gate mark fill with the sheet
   colour like terrain rising through a contour, under a construction layer (`src/components/relief`).
3. **Map-sheet cards**: calm 5:7 cards with a contour plate that steps up one contour level on hover; the
   same plate morphs into the case study's header (a React `<ViewTransition>` shared element).
4. **Case studies** on one template with layout breakers, alternating dark ground and light sheet bands
   (`docs/content.md`).

Production currently serves a static under-construction page; the full site lives on the `basecamp` branch behind
a password gate (see "Hosting on Netlify").

Navigation is a plain header: the brand (home) · Case studies · About · Contact, inline at every width. The
footer holds Get in touch, the wordmark, the time in Bern and the Motion control ("Motion: Full · Calm · Off";
the OS setting for reduced motion forces Off). Home: the role line, the name, one intro sentence, Case studies,
Earlier projects. About (`/about/`): the intro, the career line, How I lead and the rest. The display name and
the brand are one setting each in `src/content/site.ts`; `docs/content.md` says where all copy lives and what is
still to fill.

## Stack

| Concern                    | Choice                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Framework                  | Next.js 16 (App Router), React 19.3, TypeScript, static export (`output: "export"`) |
| Field                      | A framework-free WebGL2 renderer (`src/field/core.ts`, GLSL strings), shared with the gate; leva for dev-only tuning |
| Motion                     | React `<ViewTransition>`, CSS (tokens and primitives in `docs/motion.md`), `motion` for the frame loop Lenis runs on |
| Smooth scroll              | Lenis, fine-pointer desktop in Full only                                            |
| Fonts                      | Archivo (wght only, wdth stays 100; italic) and Martian Mono (wdth + wght) via `next/font/google`, self-hosted; the italic face loads only once italic text nears the screen (`src/lib/italic-face.ts`) |
| Hosting                    | Netlify: static files, plus one Edge Function (the Basecamp gate) off production   |
| Terrain                    | Node scripts with geotiff.js and d3-contour; swisstopo services for place data      |

## Local development

Requirements: Node 22.18 or newer (see `.nvmrc`) and npm.

No dependency comes from the Motion+ registry any more, but the committed `.npmrc` still points the
`@motionplus` scope at `https://api.motion.dev/npm/` and reads the token from the `MOTION_TOKEN` environment
variable, so npm expects it. npm doesn't read `.env` files: export the token in your shell before installing:

```sh
# macOS / Linux
export MOTION_TOKEN=your-token
# Windows PowerShell
$env:MOTION_TOKEN = "your-token"
# Windows cmd
set MOTION_TOKEN=your-token

npm ci
npm run dev      # http://localhost:3000
```

Never commit the token. `.env*` files are git-ignored; `.env.example` lists the variables.

| Script                   | What it does                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `npm run dev`            | Next dev server plus the local save endpoint for the tuning panel (port 4319)     |
| `npm run build`          | Builds the deploy for `SITE_MODE` into `out/` (see "Hosting on Netlify")          |
| `npm run preview`        | Serves `out/` like a static host, including the base path and gzip               |
| `npm run lint`           | ESLint (Next.js core-web-vitals + TypeScript rules)                               |
| `npm run typecheck`      | Generates route types, then `tsc --noEmit`                                        |
| `npm run check:contrast` | WCAG AA contrast of the token colour pairs (ground, raised ground, sheet, over the field in and out of quiet zones), marks 3:1 |
| `npm run check:legibility` | Text against its real background on rendered screenshots (the field, a page change half-way, the poster), WCAG AA |
| `npm run check:name`     | Builds copies with names of 8, 18 and 32 characters and brands of 2, 4 and 10: nothing keeps the real ones, nothing overflows or clips at 320–2560 px |
| `npm run check:content`  | Lists every placeholder and example value still to replace, with file, line and field (`docs/content.md`) |
| `npm run check:figures`  | Numbers in copy, card and charts match their data file; images are current        |
| `npm run check:wording`  | No old names, CV, `.pdf` links or job-seeking phrases in any built page (the build runs it) |
| `npm test`               | Unit tests (`node:test`): the gate, tokens and stylesheets, no red, no pointer followers, the case-study model and its layout mapping, formatting, the field's limits |
| `npm run test:e2e`       | Chromium checks against `out/`, one scenario with `-- <name>` (listed in `scripts/e2e.mjs`): transitions, hydration, primitives, case-study template, terrain, the relief wordmark, the calm rules, cards and the Next loop, page structure, phone layouts, toast, font swap, arrivals and focus, reading, access, pointer, INP, wording, axe, a cross-browser smoke subset |
| `npm run test:hosting`   | Gated and production deploys under netlify-cli (build, edge runtime, redirects)   |
| `npm run report:size`    | Initial JS/CSS/fonts per route, lazy chunks, terrain assets (gzip)               |
| `npm run report:transfer` | One page's transfer on a phone and a desktop, first view and full scroll         |
| `npm run report:motion`  | Layout time in a page's first 3.5 s on a phone with the CPU slowed 4×; Lighthouse with `--lighthouse` |
| `npm run record:motion`  | Review videos of the pages and the round trips in each tier (`motion-recordings/`) |
| `npm run images`         | Renders and encodes the case-study artefact images (see "Case studies")           |
| `npm run terrain`        | Regenerates the masters in `terrain/` from swisstopo data, then the field maps and plates |
| `npm run terrain:bern`   | Regenerates the About terrain (`docs/terrain.md`)                                 |
| `npm run terrain:field`  | Derives the field's maps (≤ 150 KB each) in `public/terrain/field/` from the masters |
| `npm run posters`        | Renders each terrain's first frame as an AVIF poster (≤ 60 KB)                    |
| `npm run plates`         | Draws the cards' 4:3 contour plates (`public/plates/`, ≤ 25 KB each)              |
| `npm run geo`            | Regenerates the verified place data in `src/content/geo-data.json` from swisstopo |
| `npm run verify:terrain` | Checks that the committed heightmaps decode to the exact source heights          |
| `npm run portrait`       | Encodes the About portrait from a cut-out PNG (`docs/content.md`)                 |
| `npm run fonts:subset`   | Regenerates the under-construction page's WOFF2 subsets in `src/hosting/fonts`    |

Without `SITE_MODE`, `npm run build` builds the full site (`live`). To check that every asset goes through
`asset()`, build for a sub-path:

```sh
# macOS / Linux (on Windows set the variables first, as above)
NEXT_PUBLIC_BASE_PATH=/portfolio NEXT_PUBLIC_PREVIEW=1 npm run build
NEXT_PUBLIC_BASE_PATH=/portfolio npm run preview   # http://localhost:3000/portfolio/
```

### Base path

`next.config.ts` reads `NEXT_PUBLIC_BASE_PATH` (empty by default). `next/link` and `next/image` handle it
automatically. Every other runtime URL (heightmaps, terrain SVGs, textures, fetch calls) must go through
`asset()` in `src/lib/asset.ts`.

`NEXT_PUBLIC_PREVIEW=1` adds `<meta name="robots" content="noindex, nofollow">` and a disallow-all
`robots.txt`. Production builds leave it unset.

### Content and placeholders

All copy lives in `src/content` (`docs/content.md` has the map, the name source, the case-study model and what
is still to supply). Facts still to confirm are written as `[PLACEHOLDERS]` (links as `href: null`); they stay
visible in preview builds so gaps are easy to spot. Card stats (team led, time, scope, impact) are optional: a
stat row shows only the stats that have a value and disappears when none has one.
`npm run check:content` lists every remaining placeholder with file, line and field. `npm run build` runs it for
its `SITE_MODE`:

- `construction` requires only what the under-construction page shows: the name and the email and LinkedIn
  links (`npm run check:content -- --mode=construction` lists those);
- `basecamp` only warns;
- `live` fails on any placeholder or example value.

A local build with `NEXT_PUBLIC_PREVIEW=1` only warns in every mode. Flagged examples (see "Case studies")
are fictional on purpose: `check:content` skips them and names them once, and live builds don't contain them.

**Example values.** The home page and About tell the intended story with invented figures, dates, facts, the
bio, the evidence lines of How I lead, the Earlier work entries and the binder's lines. Each is written as
`ex("…")` (`src/content/example-values.ts`): it renders as written, `check:content` lists it with file, line
and field next to the placeholders, and a live build stops on it until a real value replaces it.

### Tuning the contour field

In `npm run dev`, a collapsed "Tuning (dev only)" leva panel controls the field: line and index strengths, the
quiet zones' strength and feather, the zoom, the DPR cap and minimum line spacing per device, the drift, the
breath, the pointer bump and the page change's dim. "Save to config" writes the values to
`src/config/contour-field.json`, which is committed; leva is never part of the production build. The contour
interval follows the screen (`docs/terrain.md`). Add `?field=force` to a URL to skip the low-spec check, which
is useful in headless browsers.

## Case studies

Every case study (`/work/<slug>/`) has the same content model (`src/lib/case-study.ts`; `docs/content.md`
walks through it): the problem, the summary, six stages each headed by its finding, a decision we reversed,
what happened after launch, the results, looking back, the team. `surveyLayout()` (`src/lib/survey-layout.ts`,
unit-tested) lays it out on the Calm Survey template without inventing anything: the header plate, the summary
band, 01 · Context beside the contents trail, a metric band, 02 · Findings with an offset image pair, the pinned
decision, the options band, the hero in a map frame, 03 · Leading the team under its one pull statement, the
outcome band, the reflection, and the next case study. `src/content/examples` holds three complete, fictional
model case studies at one fictional employer: Seilschaft (people), Test Project (service) and Gratweg
(platform), in card order the panorama from Interlaken (the Eiger, the Mönch, the Jungfrau). Test Project uses
every block; read it as the reference.

- **Figures** (`Figure.tsx`): `<figure>` with `<picture>` (AVIF, then WebP, width descriptors, `sizes`, explicit
  width and height), lazy unless `priority`, a tiny blurred placeholder, and a mono caption "Fig. n · what it
  shows · source" (numbered in page order). Complex diagrams add a long description behind "Describe this
  diagram".
- **Lightbox** (`zoom: true`): an "Enlarge" button on a native `<dialog>`; focus moves in, Esc closes, focus
  returns; the largest source loads on open; pinch and pan on touch, click or wheel zoom and +/−/reset on
  desktop. Without JavaScript the figure offers "Open full-size image".
- **Before/after** (`kind: "compare"`): a native range "Compare before and after" plus "Before / After / Side by
  side" buttons; without JavaScript both images stack with their own alt text.
- **Hotspots** (`kind: "hotspots"`): numbered marker buttons highlight the matching note in the caption's list.

Lightbox, comparison and hotspot code load lazily, once the figure comes near the viewport (`Enhance.tsx`).
`npm run check:figures` enforces the "one key insight per page" and caption rules; `validateCaseStudy` (run by
`check:content` in every build but construction) rejects an incomplete case study.

### Numbers come from a data file

A case study can keep every number in one data file (Test Project: `src/content/examples/test-project/data.ts`).
Copy, the card, figure captions and alt text are written with tokens, `{{outcomes.complete.after}}%`,
`{{workshops.count|word}}`, `CHF {{subsidy.maxChf|en}}` (`src/lib/fill.ts`; an unknown path stops the build).
`src/content/examples/sources.ts` tells the tools where such a case study keeps its data, copy and artefacts.
`npm run check:figures` (run by every build that includes examples) fails when copy, the card or an artefact
source writes a digit of its own, when the data contradicts itself, when a key figure (`keyFigures`) is missing
from the copy, card or chart it must appear in, or when a committed image is older than its data or source.

### Flagged examples

A card and case study marked `example: true` (`src/content/examples`) are fictional: an example line above the
H1, a "Fictional example" stamp on the card, "fictional" in the type line, noindex on the page, a footer strip on every
image. Where they appear (`includesExamples` in `src/hosting/config.ts`):

| Build                                         | Examples                                                   |
| --------------------------------------------- | ---------------------------------------------------------- |
| `SITE_MODE=basecamp` (branch deploys, Deploy Previews) | included, last in the deck                        |
| `SITE_MODE=live`                              | excluded: no route, card, asset, sitemap entry or bundle code |
| no `SITE_MODE`                                | included in `npm run dev` and with `NEXT_PUBLIC_PREVIEW=1`, else excluded |

A live build swaps `@/content/examples` for an empty module (`next.config.ts`), removes the examples' files from
`out/` and fails if any mention of them is left. Their terrains live in `terrain/examples.json` and
`public/terrain/field/examples.json`, not in `terrain.json` and `field.json`, so live bundles don't carry them.

### Artefact images

`npm run images` (`scripts/images/`) renders each image from one HTML or SVG source in `artefacts/<slug>/`. The
sources share `artefacts/shared/artefact.css` (the site palette from the tokens, the fictional product's UI
tokens, self-hosted Archivo and Martian Mono for portfolio labels and diagrams, Source Sans 3 for the product UI)
and `artefacts/shared/diagram.js` (boxes and connectors). Numbers come from the data file, as `{{tokens}}` or from
`window.DATA` in a chart's script.

1. Playwright renders the page at half the master size with deviceScaleFactor 2, waits for
   `document.fonts.ready`, with animations off, the clock fixed and `Math.random` seeded, and screenshots the
   artefact root to a lossless PNG master (`artefacts/.masters`, git-ignored).
2. sharp encodes AVIF (quality 55) and WebP (quality 78) at 640/960/1280/1920/2560 px, never upscaled, into
   `public/media/<slug>/`.
3. The manifest next to the data file records intrinsic size, a blurred placeholder, alt and caption keys,
   every source, hotspot positions, the rendered text and the hash of the inputs.

Every image's page carries the whole data file, so changing any number marks all of that case study's images as
stale: re-run `npm run images` (about five minutes for fifteen images; `npm run images -- tp-hero` renders one).
Re-renders are byte-identical when nothing changed. Budget: the hero's 1920 px AVIF at most 180 KB. Sources and
outputs are committed; masters are not. Image rules:
flat browser frames (28 px bar, three neutral dots, the fictional URL), on light sheets ground-coloured markers,
neutral highlights (no red or orange anywhere), at most one faint contour set behind diagrams, and the strip
"<NAME> · FICTIONAL EXAMPLE · Fig. n" on every image.

## Hosting on Netlify

Netlify builds this repository with continuous deployment. The domains are configuration values in
`src/hosting/config.ts`: `PRIMARY_DOMAIN` (production), `REDIRECT_DOMAINS` (aliases that 301 to
`https://PRIMARY_DOMAIN`, path kept) and `BASECAMP_HOST` (the branch subdomain of `basecamp`).

### Deploy model

| Deploy context  | Branch                     | `SITE_MODE`    | Serves                                                    |
| --------------- | -------------------------- | -------------- | --------------------------------------------------------- |
| Production      | `main`                     | `construction` | The under-construction page at `PRIMARY_DOMAIN`           |
| Branch deploy   | `basecamp`                 | `basecamp`     | The full site behind the password gate at `BASECAMP_HOST` |
| Deploy Previews | pull requests              | `basecamp`     | The same, gated, at the preview URL                       |

`basecamp` is the integration branch: pull requests target it, and `main` is production. `netlify.toml` sets
`SITE_MODE` per context, and `npm run build` (`scripts/site/build.mjs`) builds accordingly:

- **construction**: only the under-construction page. A small Node script renders it from the design tokens and
  `src/content/about.ts` (no Next.js): static HTML with inline CSS, self-hosted WOFF2 subsets of Archivo and
  Martian Mono, the region's AVIF poster and, inline under the hash-pinned CSP, the same contour field and
  relief mark as the site (`src/field/core.ts` and `src/components/relief/relief-core.ts`, their types stripped).
  Under reduced motion the poster stays and the mark is filled and still; one more script sets the gate's
  submit button to "Checking…" while the password is checked. The page is complete without JavaScript. Its
  name and brand come from the name source (`docs/content.md`). Every other path redirects (302) to `/`, and
  `REDIRECT_DOMAINS` redirect (301) to `PRIMARY_DOMAIN`. A phone visit transfers about 80 KB
  (`npm run report:size` after a construction build).
- **basecamp**: the full static export, plus the gate as a Netlify Edge Function. The build writes it to
  `.netlify/v1/edge-functions/` (Netlify's Frameworks API), so it exists only in these deploys; production has
  no edge function at all.
- **live**: the full site, no gate. Prepared for launch, not enabled. Flagged examples are left out (see "Case
  studies"), and the build writes a `sitemap.xml` of the indexable pages.

Netlify's automatic Next.js runtime is switched off (`NETLIFY_NEXT_PLUGIN_SKIP=true` in `netlify.toml`): deploys
are plain static files. Each mode writes its own `_redirects` and `_headers` into `out/`, because headers and
redirects in `netlify.toml` would apply to every context alike.

### The Basecamp gate

`src/hosting/gate.ts` (logic) and `src/hosting/gate-handler.ts` (requests) protect every path of a `basecamp`
deploy: pages, RSC payloads, scripts and terrain data. Only the gate's own assets under `/.basecamp/assets/`
(styles, fonts, poster) are public, and the gate answers `robots.txt` itself with `Disallow: /`.

- Without a valid cookie the gate page is shown (the under-construction design with the password form):
  401, `Cache-Control: no-store`.
- The form posts `password` and `next` to `/.basecamp/unlock`. The password is compared with
  `BASECAMP_PASSWORD` in constant time (both sides hashed first). The request is accepted only from
  `https://PRIMARY_DOMAIN` (the password form on the production page), from the gated host itself, or
  without an Origin header.
- On success the gate sets `__Host-basecamp` (Secure, HttpOnly, SameSite=Lax, Path=/, 30 days). Its value is
  an expiry plus an HMAC-SHA-256 signature; the key is derived from the password, so changing the password logs
  everyone out. Then a 303 to `next` if it is a same-host relative path, else to `/`.
- A wrong password waits ~750 ms, then shows the gate again with an error announced to screen readers.
- `/.basecamp/lock` clears the cookie and shows the gate.
- Without `BASECAMP_PASSWORD` the gate fails closed: the page says Basecamp is closed, and one log line says why.
- Every gated response carries `X-Robots-Tag: noindex, nofollow`; shared caching is switched to `private`.

`npm test` covers cookie signing, expiry, tampering, `next`, Origin and the constant-time comparison.
`npm run test:hosting` runs the deploys under netlify-cli (`npm i -g netlify-cli`, or `NETLIFY_CLI=…`):
`netlify serve --context deploy-preview` exercises the gate in Netlify's edge runtime (plus the form in Chromium
when Playwright resolves), and `netlify serve --context production` the under-construction page, its redirects
and the absence of the gate. The production run is skipped while the page's own facts are placeholders.

### Netlify and GitHub settings

Netlify (once, in the UI):

1. **Add new project → Import an existing project →** this GitHub repository. Build settings come from
   `netlify.toml` (build command `npm run build`, publish directory `out`).
2. **Project configuration → Developer settings → Continuous deployment → Branches and deploy contexts →
   Configure:** Production branch `main`; Branch deploys: **Let me add individual branches** → `basecamp`;
   Deploy Previews on (pull requests into `main` or `basecamp` get one, because `basecamp` has branch
   deploys).
3. **Project configuration → Environment variables → Add a variable:**
   - `MOTION_TOKEN`: scope **Builds**, all deploy contexts.
   - `BASECAMP_PASSWORD`: scope **Functions**, deploy contexts **Branch deploys** and **Deploy Previews**,
     marked **Contains secret values**. Edge functions read it at runtime; variables in `netlify.toml` never
     reach them.
4. **Domain management → Domains → Add a domain:** `PRIMARY_DOMAIN` as the primary domain, then each of
   `REDIRECT_DOMAINS` as a domain alias. HTTPS certificates are issued automatically.
5. **Domain management → Domains → Branch subdomains → New subdomain:** branch `basecamp`, which becomes
   `BASECAMP_HOST`. Branch subdomains need Netlify DNS for `PRIMARY_DOMAIN` (the domain's **Options → Set up
   Netlify DNS**, then Netlify's name servers at the registrar), and the branch needs one successful deploy
   first.

GitHub:

1. **Settings → Secrets and variables → Actions:** `MOTION_TOKEN` (CI installs Motion+ with it).
2. Create the `basecamp` branch from `main`. Optionally make it the default branch (**Settings → General →
   Default branch**) so new pull requests target it.
3. **Settings → Pages:** unpublish the old GitHub Pages preview; its workflow is gone.

`.github/workflows/ci.yml` checks pull requests into `basecamp` and `main`: lint, types, contrast, unit tests,
the construction build (into `main` with the production content check), the gated build, the size reports, and
`npm run test:hosting`.

### Changing the password

Edit `BASECAMP_PASSWORD` under **Project configuration → Environment variables**, then redeploy the `basecamp`
branch (**Deploys → Trigger deploy → Deploy project**, or push to it). Each deploy keeps the value it was built
with, so existing Deploy Previews keep the old password until they are rebuilt. Every cookie signed with the old
password stops working, so everyone has to enter the new one.

### Launch

1. Fill every placeholder (`npm run check:content` lists them; live builds fail on any).
2. In `netlify.toml`, set `SITE_MODE = "live"` under `[context.production.environment]`.
3. Merge `basecamp` into `main`. Production then serves the full site without a gate; `basecamp` and Deploy
   Previews stay gated.

## Terrain pipeline

`npm run terrain` (`scripts/terrain/build.mjs`, configured by `src/content/terrain.config.json`):

- **Area:** Thun – Interlaken – Grindelwald – Lauterbrunnen – Jungfrau, WGS84 bbox 7.55–8.25 E, 46.47–46.80 N,
  converted to Swiss LV95 (EPSG:2056).
- **Source:** swisstopo **swissALTIRegio** (10 m DTM), found through the STAC API on `data.geo.admin.ch`. It is
  published as one cloud-optimised GeoTIFF of all of Switzerland (~10 GB); the pipeline reads only the tiles
  covering the bbox at 10 m with HTTP range requests (geotiff.js), ~100 MB, downloaded once into the
  git-ignored `scripts/terrain/.cache/`.
- **Masters** (`terrain/`, committed, never deployed): the region's heightmaps (`heightmap-{1024,1536,2048}`),
  each card's summit (`morph/<id>`), Bern (`bern/`), as lossless WebP with elevation packed into R (high byte)
  and G (low byte), plus raw `.bin` fallbacks, and `terrain.json` / `examples.json` with their metadata.
- **Field maps** (`npm run terrain:field`, `public/terrain/field/`): one map per page type, the largest width
  whose WebP and raw fallback both stay within 150 KB, lightly blurred and stored in coarser height steps, plus
  `field.json` / `examples.json`. **Posters** (`npm run posters`): each terrain's first frame as AVIF (≤ 60 KB,
  landscape and portrait), the first paint, the Off tier and the no-WebGL fallback. **Plates** (`npm run
  plates`): the cards' 4:3 contour plates (`public/plates/`, ≤ 25 KB). The terrain scripts run the field maps
  and plates at their end; the posters need Playwright.
- `npm run terrain -- --refresh` re-downloads; `-- --placeholder` builds from procedural terrain without the
  network; `-- --png` also writes PNG copies (git-ignored); `-- --only=<id>` rebuilds only the named seeded card
  terrains.
- About's terrain (Bern) has its own pipeline, `npm run terrain:bern`, and the place data its own, `npm run geo`
  (`docs/terrain.md`).
- **Exact heights:** every WebP and `.bin` is decoded again right after encoding and must match byte for byte;
  the raster's SHA-256 and 16 reference texels are recorded. `npm run verify:terrain` re-checks the committed
  files.

### Heightmap decode check

A browser could alter a WebP's values while decoding it (for example by colour-managing it), so the field
checks each map once per session (`src/field/core.ts`): after the upload it reads its 16 reference texels back
and compares them; on a mismatch it loads the raw heights (`.bin`, decoded with `DecompressionStream`) and checks
those. If that fails too, the page keeps the poster. A passed check is remembered for the session.

Attribution: "Terrain data © swisstopo" appears in the footer of every page (and on the under-construction page).

## Accessibility and motion

- Semantic HTML first, readable without JavaScript, keyboard operable. The hero name is server-rendered text,
  so LCP is text, not the canvas.
- Each card is one link, named "<name> (Fictional example): <sector · role · team size>", with the focus ring
  around it. After every page change focus moves to the new page's H1 (or the hash's target).
- Titles arrive on their weight with their width reserved, so nothing moves (no CLS); screen readers read each
  title once (the width-holding copies are aria-hidden).
- Text in the first viewport is there from the first paint; only content scrolled to rises, never on sheet bands.
- Three tiers on `html[data-motion]`, resolved before first paint: Full, Calm (durations ×0.7, no stagger, no
  pointer effects but links) and Off (the OS setting for reduced motion forces it; also without JavaScript).
  The footer's Motion control chooses; Off pauses the background and haptics. `docs/motion.md` has the matrix.
- Nothing follows the pointer but the field's bump and the relief fill (`src/lib/pointer.test.ts`,
  `npm run test:e2e -- pointer`); no red anywhere (`src/styles/no-red.test.ts`).
- Page changes finish cleanly even when a view transition is skipped, times out or fails
  (`npm run test:e2e -- transitions`); scroll positions come back on back and forward.
- Contrast: `npm run check:contrast` holds the token pairs to WCAG AA; `npm run check:legibility` measures text
  against what is really behind it (the field, the field half-way through a page change, the poster) at
  1440×900 and 390×844, and fails when a page is wider than the phone. `npm run test:e2e -- axe` runs axe-core's
  WCAG 2.2 A and AA rules on every route in every tier, on a phone and with forced colours.

### Preview-only switches

Dev and preview builds (`NEXT_PUBLIC_PREVIEW=1`, so the Basecamp deploy) understand these query parameters;
production builds compile them out:

- `?motion=full|calm|still` loads the page in that tier (the OS setting for reduced motion still wins);
- `?tier=desktop|mobile|low` sets the field's device tier for one page load (`docs/terrain.md`).

`?field=force`, which skips the field's low-spec checks (headless browsers), works in every build.
