# Portfolio — The Summit Deck

Portfolio of a UX Team Lead / Senior UX Designer from Interlaken. Art direction: a night hike across a
topographic contour map. Projects are presented as original "Summit Cards".

The signature pieces:

1. **Persistent contour field**: one WebGL canvas behind all routes, drawing real swisstopo contours as a calm,
   monochrome map. It holds still while a page is read and takes no pointer input; on a page change it morphs to
   the next terrain (a case study's mountain, Bern on About). Quiet zones, like contours interrupted under the
   labels of a printed map, fade the lines behind headings (`data-quiet-zone`) to 22% with a 48 px feather and
   behind running text (`.body-copy`, or `.knockout` for other text blocks) to 7% with a 64 px feather. Longer
   reading blocks also sit on a map-legend panel (`.legend`). `docs/terrain.md` has the details.
2. **Summit Card**: spring tilt and contour foil under a fine pointer. Fully data-driven and accessible; the whole
   card links to its case study.
3. **Card → case study transition**: a view-transition morph from the deck into `/work/[slug]`, synchronised with
   the field. The way back is a "card reassembly": the page's own content leaves first, the artwork and title fly
   back into the card, and the card is rebuilt around them (its neatline, then its parts;
   `src/components/transition/return-transition.ts`).
4. **The red route**: one red path down the home page and each case study through its waypoints, walked with the
   scroll (`src/components/route/RouteLayer.tsx`); on About the career profile is the route.

Production currently serves a static under-construction page; the full site lives on the `basecamp` branch behind
a password gate (see "Hosting on Netlify").

Motion (`docs/motion.md`): every page is readable from its first frame, the map holds still while a page is read,
and motion answers the reader. Display titles arrive on their weight at a fixed line length (`WeightTitle`), a
glacier "contour flood" spreads through titles and buttons on hover, focus or a tap, trail links draw a red line,
and the About portrait card turns over to its facts. Nothing follows the pointer but the card tilt. Three motion
modes (full, calm, still) and the primitives are shown side by side in the motion lab (`/lab/`, preview builds
only).

The pages put leadership before the work, for hiring managers who skim, in plain words: the visuals
play, the wording never does. Home: the name and its tags, a short intro, How I lead, Selected work
(the Summit Cards, `/#work`), Earlier work and Get in touch. About (`/about/`) is reached from the
HUD, whose About label morphs into the page's H1. The HUD is the only navigation: the brand (home) ·
Work · About · the Calm map switch (and the haptics switch where vibration works), inline on every
screen size. The display name and the brand are one setting each in `src/content/site.ts`; `docs/content.md`
says where all copy lives and what is still to fill.

## Stack

| Concern                    | Choice                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Framework                  | Next.js 16 (App Router), React 19.3, TypeScript, static export (`output: "export"`) |
| Field                      | three + @react-three/fiber, custom GLSL (WebGL2), leva for dev-only tuning          |
| Motion                     | `motion` (frame loop, springs), React `<ViewTransition>`, CSS scroll and view timelines; tokens and primitives in `docs/motion.md`. Motion+ is installed (hence `MOTION_TOKEN`) but no route imports it |
| Smooth scroll              | Lenis, fine-pointer desktop in full motion only                                     |
| Fonts                      | Archivo (wdth + wght, italic) and Martian Mono via `next/font/google`, self-hosted; the italic face loads only once italic text nears the screen (`src/lib/italic-face.ts`) |
| Hosting                    | Netlify: static files, plus one Edge Function (the Basecamp gate) off production   |
| Terrain                    | Node scripts with geotiff.js and d3-contour; swisstopo services for place data      |
| Type tools                 | harfbuzzjs and fontverter at build time (the titles' width knots, the footer wordmark) |

## Local development

Requirements: Node 22.18 or newer (see `.nvmrc`) and npm.

Motion+ is a private package. The committed `.npmrc` points the `@motionplus` scope at
`https://api.motion.dev/npm/` and reads the token from the `MOTION_TOKEN` environment variable. npm doesn't
read `.env` files, so export the token in your shell before installing:

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
| `npm run check:contrast` | WCAG contrast of the token colour pairs: text over the field 7:1, on paper and raised surfaces 4.5:1, marks 3:1 |
| `npm run check:legibility` | Body text against its real background on rendered screenshots (field and poster) |
| `npm run check:content`  | Lists every placeholder and example value still to replace, with file, line and field (`docs/content.md`) |
| `npm run check:figures`  | Numbers in copy, card and charts match their data file; images are current        |
| `npm run check:wording`  | No old names, CV, `.pdf` links or job-seeking phrases in any built page (the build runs it) |
| `npm test`               | Unit tests (`node:test`): the gate, tokens and stylesheets, the case-study model, formatting, the terrain conductor, the red route's geometry, no pointer following |
| `npm run test:e2e`       | Chromium checks against `out/`, one scenario with `-- <name>` (listed in `scripts/e2e.mjs`): view transitions, motion modes, hydration, primitives, decode, case-study template, terrain, deck and Next loop, About morph, page structure, phone layouts, HUD and toast, font swap, cards, arrivals and focus, reading, the red route, flood, trail links, portrait, pointer, INP, wording, a cross-browser smoke subset |
| `npm run test:hosting`   | Gated and production deploys under netlify-cli (build, edge runtime, redirects)   |
| `npm run report:size`    | Initial JS/CSS/fonts per route, lazy chunks, terrain assets (gzip)               |
| `npm run report:transfer` | One page's transfer on a phone and a desktop, first view and full scroll         |
| `npm run report:motion`  | Layout time in a page's first 3.5 s on a phone with the CPU slowed 4×; Lighthouse with `--lighthouse` |
| `npm run record:motion`  | Review videos: the motion lab, a round trip and the terrain conductor in each mode, the home page, About via the nav and the case-study loop (`motion-recordings/`) |
| `npm run images`         | Renders and encodes the case-study artefact images (see "Case studies")           |
| `npm run terrain`        | Regenerates `public/terrain` from swisstopo data                                  |
| `npm run terrain:bern`   | Regenerates the About terrain in `public/terrain/bern` (`docs/terrain.md`)       |
| `npm run geo`            | Regenerates the verified place data in `src/content/geo-data.json` from swisstopo |
| `npm run verify:terrain` | Checks that the committed heightmaps decode to the exact source heights          |
| `npm run titles`         | Solves the display titles' width knots into `src/lib/title-axes.json` (build and dev run it) |
| `npm run wordmark`       | Draws the footer wordmark from the brand into `src/components/footer/wordmark.json` (build and dev run it) |
| `npm run flood`          | Regenerates the contour flood's sprites in `src/components/interaction`          |
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

In `npm run dev`, a collapsed "Tuning (dev only)" leva panel controls the field: contour spacing and line
strengths per device, index lines, line widths, neutral line colours, the draw-on front's gain, quiet-zone
strengths and feathers, the base zoom and the card terrains' zoom push, the morph duration and the frame budget.

The field is a monochrome map: lines take neutral colours only (the Aare on About is the one coloured line), and
the draw-on front only raises the strength of the same line colour (`revealGain`). Line strength and spacing are
set per device profile, `desktop` (a fine pointer and a long edge of at least 900 px) and `mobile` (everything
else); both currently draw regular lines at 30% and index lines at 50%.

The contour interval adapts to the screen. It is the smallest step of the terrain's set (50, 100, 200, 250 and
500 m in the Alps; 10, 20 and 50 m for Bern, under 1000 m of relief) that keeps lines on steep terrain (the map's
95th-percentile gradient) at least `minSpacingPx` CSS pixels apart at the map's on-screen scale; every 5th line
is an index line. With the committed `minSpacingPx` (3.25 on desktop, 3 on mobile) the region draws 200 m on
phones (250 m on 320 px wide screens), small tablets and laptops and desktops up to ~1920 px, and 100 m on large
portrait tablets (820 × 1180) and 2560 px desktops. The panel shows the interval in use; resizes glide to the new
interval, and morphs blend between the two terrains' intervals. "Save to config" writes the values to
`src/config/contour-field.json`, which is committed. Colours and durations are stored as token names. Leva is
never part of the production build. Add `?field=force` to a URL to skip the low-spec check, which is useful in
headless browsers.

## Case studies

Every case study (`/work/<slug>/`) is built from the same parts, an ascent from trailhead to summit. The content
model is in `src/lib/case-study.ts` (`docs/content.md` walks through it), the copy in
`src/content/case-studies.ts`, the components in `src/components/case-study`. `src/content/examples` holds
three complete, fictional model case studies at one fictional employer: Seilschaft (people: building a UX
practice), Test Project (service: a subsidy form) and Gratweg (platform: a design system), in that deck order,
the panorama from Interlaken (the Eiger, the Mönch, the Jungfrau), each one's "Next project" leading to the
next and the last back to the first. Test Project uses every block; read it as the reference.

- **Trailhead spread:** the H1 the card's name morphs into, the type line, "The problem" in two or three
  sentences, and "The result" as the climb: the impact line over the altitude gained from the trailhead to the
  summit, then role · team · time. Under it "7 min read · 60-second summary below" (reading time counted like
  Medium: 265 words a minute plus 12 s for the first figure, a second less for each next one, at least 3 s).
- **Summary:** the legend sheet, the site's only paper surface: corner ticks, "Sheet n/3", a scale bar and a map
  symbol per row (the brief, outcome, my role, team I led, what I put in place, key decision). The product hero
  sits after it.
- **Six stages:** each opens with a mono line (stage, place and altitude from `src/content/geo.ts`) and its
  finding as the H2; running text at 60–68 characters with numbered side notes in the margin (inline on
  phones), figures, decisions as fork diagrams (a signpost junction: the chosen way solid red, the others dashed
  to a dead end, an ordered list of the options with what spoke for and against them and their cost) and at
  most one key insight.
- **Then:** a decision we reversed (with its dated turn-back), what happened after launch (a logbook), the
  results as an elevation profile over a real table (each result's stage), the evidence legend (measured,
  estimated, qualitative: shape plus text), looking back and the team on a rope, what I did not do and the
  credits, and the Next project band (a ridge of the three peaks with "You are here").
- **In-page navigation:** from 1280 px a sticky "On this page" trail beside the stages, each node as far from the
  next as the climb between them, filling as the reader scrolls (`aria-current="true"` on the current stage);
  below 1280 px the "On this page" links near the top, "Next stage ↓ / Back to top ↑" at the end of each stage
  and the altimeter bar ("Stage 2 of 6 · Grindelwald") with its jump sheet.
- **Figures** (`Figure.tsx`): `<figure>` with `<picture>` (AVIF, then WebP, width descriptors, `sizes`, explicit
  width and height), lazy unless `priority` (eager, `fetchpriority="high"`, only for an image in the first
  viewport), a tiny blurred placeholder, and a mono caption "Fig. n · what it shows · source" (numbered in order
  of appearance, about 30 words at most). Complex diagrams add a long description behind "Describe this
  diagram". Two surfaces, both raised ground with a hairline: the sheet (32 px inside, 8 px corners) for light UI
  and diagrams, the night frame for charts and the hero; column (~720 px) or wide (~1120 px), full width on
  phones.
- **Lightbox** (`zoom: true`): an "Enlarge" button on a native `<dialog>`; focus moves in, Esc closes, focus
  returns; the largest source loads on open; pinch and pan on touch, click or wheel zoom and +/−/reset (names
  carry the zoom level) on desktop; no zoom animation with reduced motion. Without JavaScript the figure offers
  "Open full-size image".
- **Before/after** (`kind: "compare"`): a native range "Compare before and after" moves a clip, plus "Before /
  After / Side by side" buttons; without JavaScript both images stack with their own alt text.
- **Hotspots** (`kind: "hotspots"`): numbered marker buttons on the image highlight the matching note in the
  caption's visible ordered list; positions come from the image manifest.

Lightbox, comparison and hotspot code load lazily, only on pages that use them, once the figure comes near the
viewport (`Enhance.tsx`). `npm run check:figures` enforces the "one key insight per page" and caption rules for
every case study; `validateCaseStudy` (run by `check:content` in every build but construction) rejects an
incomplete one.

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
`out/` and fails if any mention of them is left. Their card terrains live in `public/terrain/examples.json`, not
in `terrain.json`, so live bundles don't carry them either.

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
moss-ink highlights, alpenglow-ink "no feedback" gaps, at most one faint contour set behind diagrams, and the strip
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
  `src/content/about.ts` (no Next.js, no Three.js): static HTML with inline CSS, self-hosted WOFF2 subsets of
  Archivo and Martian Mono, and the contour poster (200 m on small screens, 100 m where the site's field draws
  100 m too). Nothing moves on its own and nothing follows the pointer; the only script sets the gate's
  submit button to "Checking…" while the password is checked, and the page is complete without JavaScript. Its
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
  published as one cloud-optimised GeoTIFF of all of Switzerland (~10 GB). Its overviews jump from 10 m to
  40 m, so the pipeline reads only the tiles covering the bbox at 10 m with HTTP range requests (geotiff.js).
  That is ~100 MB, downloaded once into the git-ignored `scripts/terrain/.cache/`. DHM25 is not in the STAC
  catalogue; swissALTI3D would mean thousands of 1 km tiles.
- **Outputs** (`public/terrain`, committed):
  - `heightmap-1024.webp` (53 m/px, 382 KB), `heightmap-1536.webp` (35 m/px, 710 KB) and
    `heightmap-2048.webp` (26 m/px, 1.1 MB): elevation packed into R (high byte) and G (low byte), 1 m steps,
    light σ=1 blur, stored as **lossless WebP** (about 40% smaller than PNG). Decoded in the shader as
    `h = offset + (R·65280 + G·255)·scale`. Phones and small screens load the 1024 map, desktops the 1536 map
    (from 1400 device pixels on the long edge).
    The 2048 map is only used in preview builds with `?hm=2048` (also `?hm=1024` / `?hm=1536`), to compare
    them side by side.
  - `terrain.json`: elevation range, LV95/WGS84 bbox, pixel scale, encoding, lakes and card metadata.
  - `contours.svg` (100 m, 67 KB gzipped) and `contours-200.svg` (200 m, 34 KB gzipped): the first-paint,
    reduced-motion and no-WebGL posters. Like the field they are a monochrome map: neutral lines only, at the
    field's desktop line strengths from `src/config/contour-field.json`, every 5th line an index line. A media
    query computed from the same spacing rule as the field (per device profile) picks one, so the poster and the
    field show the same interval (100 m on the largest screens and tablets in portrait, 200 m on phones, laptops
    and desktops up to ~1920 px).
  - `cards/*.svg`: card terrains. Crop cards are cut from the real terrain, their trail drawn through verified
    places from `src/content/geo-data.json` (`npm run geo`) and pinned at their spot heights; the three examples'
    cards are crops around the Eiger, the Mönch and the Jungfrau (150 m lines, under 10 KB each). Seeded-noise
    cards (seed = collector number) are still supported; none is configured.
  - `morph/*.webp`: per-card heightmaps the field morphs to on case-study pages (448 px wide, about 40 KB).
  - `examples.json`: the card terrains of flagged examples (cards marked `"example": true` in the config), kept
    out of `terrain.json` so live bundles don't carry them.
  - `profile.json`: the elevation profile along the Interlaken → Jungfrau trail (`profile` in the config, 240
    points, ~1 KB gzipped), drawn along the footer's top edge.
- `npm run terrain -- --refresh` re-downloads; `-- --placeholder` builds from procedural terrain without the
  network; `-- --png` also writes PNG copies (git-ignored, not used by the site); `-- --only=<id>` rebuilds only
  the named card terrains and updates their metadata, without touching the region.
- About's terrain (Bern) has its own pipeline, `npm run terrain:bern`, and the place data its own, `npm run geo`
  (`docs/terrain.md`).
- `*.bin` next to every heightmap: the same heights as raw 16-bit values (gradient-predicted, zigzag-coded,
  gzipped by the pipeline), about 10% smaller than the WebP. The site only fetches them in a session where a
  browser decoded a WebP to different values (see "Heightmap decode check").
- **Exact heights:** every WebP and `.bin` is decoded again right after encoding and must match byte for byte;
  the raster's SHA-256 and 16 reference texels are recorded in `terrain.json`. `npm run verify:terrain` re-checks the committed files with libwebp;
  `npm run verify:terrain -- --browser` also decodes them in Chromium the way the site does
  (`createImageBitmap` without colour-space conversion or premultiplied alpha, no flip, WebGL2 read-back).
  The browser check needs Playwright.

### Heightmap decode check

The WebPs are decoded as raw data (no colour-space conversion, no premultiplied alpha, no flip), but a browser
could still alter the values, for example by ignoring `colorSpaceConversion: "none"` for WebP. So the field
checks every heightmap once per session (`src/components/terrain/heightmap-loader.ts`):

1. After the texture is uploaded, exactly as the shader samples it, its 16 reference texels from `terrain.json`
   are copied from the texture through a throwaway framebuffer into a pixel-pack buffer and read once a fence
   says the GPU is done. No shader, no draw, no main-thread wait; it runs after first paint, before the field
   fades in, and the result is remembered for the session.
2. On a mismatch the session switches to the raw 16-bit heights (`*.bin`, decoded with `DecompressionStream`
   into a `DataTexture`, which nothing can colour-manage) and checks those the same way.
3. If that is unavailable or fails too, the field stays on the SVG poster for the session.

One console warning names the browser and the first differing texel. `npm run test:e2e -- decode` simulates
a colour-managing browser (a gamma curve on decoded pixels) with and without `DecompressionStream`.

Attribution: "Terrain data © swisstopo" appears in the footer of every page (and on the under-construction page).

## Accessibility and motion

- Semantic HTML first. The hero name is server-rendered text, so LCP is text, not the canvas.
- All interactions work with the keyboard. Each card is a single link, named "Open case study: <name>, <type>,
  rarity <letter>" (", Visited" once its case study was opened), with the focus ring around the card. Focus returns
  to the originating card after navigating back.
- Display titles are one text node each (`WeightTitle`): their arrival eases the weight at a fixed line length, so
  it never changes layout (no CLS), and a light weight is still the whole word. Decorative copies (the flood,
  a button's reserved labels) draw their text from `data-echo`, so screen readers read every text once.
- Text in the first viewport is visible from first paint; only blocks below the fold reveal (`data-reveal`). Body
  text, table cells and numbers never animate.
- Three motion modes on `html[data-motion]`, resolved before first paint (`docs/motion.md` has the full matrix):
  - **full**, the default;
  - **calm**, the "Calm map" switch (stored in localStorage; its visible label is its name, and its
    description reads "Reduces motion on this site"): view-transition morphs and responses stay; reveals fade
    without their rise; title arrivals, pings, the foil sweep, tilt, foil, the field's draw-on and Lenis stop;
    the field only morphs between routes; the red route steps from waypoint to waypoint;
  - **still**, when the OS asks for reduced motion (also without JavaScript): the field becomes the static
    poster, nothing moves or changes width, colour and opacity changes take 200 ms at most, and no View
    Transition runs at all: pages change directly and the incoming page fades in over 150 ms (opacity only);
    focus return and scroll restoration work as in full motion. Still always wins over the switch, which then
    shows on and says why.
- Nothing follows the pointer but the Summit Card's tilt and foil (`src/lib/pointer.test.ts`,
  `npm run test:e2e -- pointer`). The route's red is used only for the red route, trail links and their blazes
  (the "route red" test in `src/styles/tokens.test.ts`).
- After every route change focus moves to the new page's H1, so screen readers announce it (going back to the
  deck focuses the card you came from instead). Browser back and forward cross-fade in 180 ms with the shared
  elements; links run the arrival choreography (`docs/motion.md`, Route transitions).
- Navigation finishes cleanly even when a view transition is skipped, times out or fails: React commits the
  route change anyway. `npm run test:e2e -- transitions` simulates all three (forward, browser back, forward
  again, the in-page back link, open again) plus calm, still and the previous return (`?vt=classic`), and checks
  the page, focus, the field's terrain (`data-terrain` on the backdrop), the return's phases (exit, travel, card
  rebuild; browser back: the traversal cross-fade) and that nothing is left hidden. It needs Playwright with
  Chromium and a build in `out/`.
- Contrast is checked by `npm run check:contrast`: text over the field at least 7:1 (in a quiet zone, on the HUD
  backdrop, knocked out), text on paper (the case-study summary) and raised surfaces at least 4.5:1, meaningful
  marks (the route, focus rings, outlines, rarity shapes) at least 3:1. On paper only `paperInk`, `paperInk2`,
  `mossInk` and `alpenglowInk` carry text. Labels on a drawing or where lines crowd keep their halo inside a
  quiet zone (`.keep-halo`), and the poster fallback keeps all halos and its vignette; both add a hard halo, a
  ground stroke under the glyphs (`--type-halo-stroke`).
- Body text is measured as rendered: `npm run check:legibility` screenshots every `.body-copy` block (and the
  footer and tables, `.knockout`) and every label over the field on the home page, a case study, the case-study
  example (when built) and About, at 1440×900 and 390×844, over the field, over the field caught mid-morph
  (preview builds) and over the poster. It requires at least 7:1 against the brightest background pixel under or
  next to a glyph, and lines under the glyphs at most 15% of a lit line. Text on opaque surfaces
  (`.surface-copy`: captions, the summary, the key insight) is measured too; dark text on paper and light text on
  an opaque raised panel (the logbook, results tables, figure surfaces) need 4.5:1 (no lines run behind them). It
  also fails when a page is wider than the phone (it would pan sideways).

### Preview-only switches

Dev and preview builds (`NEXT_PUBLIC_PREVIEW=1`, so the Basecamp deploy) understand these query parameters;
production builds compile them out:

- `?motion=full|calm|still` loads the page in that motion mode (the OS setting for reduced motion still wins);
- `?name=…` shows the hero with another name, to check the layout for other lengths (the name is set on at
  most two lines and sized by its longest line);
- `?vt=classic` switches the way back to the deck to the previous plain morph for the rest of the session, and
  `?vt=new` back to the card reassembly. This switch is temporary;
- `?tier=desktop|mobile|low` (or `A`, `B`, `C`), `?dpr=…` and `?hm=1024|1536|2048` set the field's tier, DPR cap
  and heightmap for one page load (`docs/terrain.md`). `?field=force`, which skips the field's low-spec checks
  (headless browsers), works in every build.
