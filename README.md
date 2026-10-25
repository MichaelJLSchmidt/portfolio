# Höhenlinie — The Summit Deck

Portfolio of a UX Team Lead / Senior UX Designer from Interlaken. Art direction: a night hike across a
topographic contour map. Projects are presented as original "Summit Cards".

This repository currently holds the foundation plus three technical spikes for the signature effects:

1. **Persistent contour field**: one WebGL canvas behind all routes. It draws real swisstopo contours with:
   - a pointer "headlamp" and loupe;
   - a rising alpenglow pulse;
   - parallax and click pings;
   - an intro sweep and terrain morphs;
   - quiet zones, like contours interrupted under the labels of a printed map: headings (`data-quiet-zone`)
     fade the lines behind them to 25% with a 48 px feather; running text (`.body-copy`, or `.knockout` for
     other text blocks) to 9% with a 64 px feather, so the lines visibly break around the copy. Longer reading
     blocks also sit on a map-legend panel (`.legend`). See "Accessibility and motion".
2. **Summit Card**: spring tilt and contour foil. Fully data-driven and accessible; the whole card links to its
   case study.
3. **Card → case study transition**: a choreographed view-transition morph from the deck into `/work/[slug]`,
   synchronised with the field. The way back is a "card reassembly": the page's own content leaves first, the
   artwork and title fly back into the card, and the card is rebuilt around them (neatline, parts, a glacier
   shine on its name). Durations and their reasoning are in `src/app/globals.css`; the reassembly is in
   `src/components/transition/return-transition.ts`.

Production currently serves a static under-construction page; the full site lives on the `basecamp` branch behind
a password gate (see "Hosting on Netlify").

Headlines use kinetic variable-font type (`src/components/type/KineticText.tsx`): letters condense from wide and
light into the display cut with a glacier shine, and the same shine follows a fine pointer like the field's
headlamp (colour only; the axes never move on hover). The About page ("Basecamp",
`/about/`) opens from the leader card and tells the career as the real climb from Interlaken to the Jungfrau; its
plan and the content still needed are in `docs/about-plan.md`.

## Stack

| Concern                    | Choice                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Framework                  | Next.js 16 (App Router), React 19.3, TypeScript, static export (`output: "export"`) |
| Field                      | three + @react-three/fiber, custom GLSL (WebGL2), leva for dev-only tuning          |
| Motion                     | `motion` (springs, gestures), Motion+ (`useMagneticPull`), React `<ViewTransition>` |
| Smooth scroll              | Lenis, fine-pointer desktop only                                                    |
| Fonts                      | Archivo (wdth + wght, italic) and Martian Mono via `next/font/google`, self-hosted  |
| Hosting                    | Netlify: static files, plus one Edge Function (the Basecamp gate) off production   |
| Terrain                    | Node scripts with geotiff.js and d3-contour                                         |

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
| `npm run check:contrast` | WCAG contrast of the token colour pairs, quiet zones, body text and the type shine |
| `npm run check:legibility` | Body text against its real background on rendered screenshots (field and poster) |
| `npm run check:content`  | Lists every content placeholder still to fill, with file, line and field          |
| `npm run check:figures`  | Numbers in copy, card and charts match their data file; images are current        |
| `npm test`               | Unit tests of the Basecamp gate (`node:test`)                                      |
| `npm run test:e2e`       | Chromium checks against `out/`: view transitions, calm navigation, decode, case-study template |
| `npm run test:hosting`   | Gated and production deploys under netlify-cli (build, edge runtime, redirects)   |
| `npm run report:size`    | Initial JS/CSS/fonts per route, lazy chunks, terrain assets (gzip)               |
| `npm run report:transfer` | One page's transfer on a phone and a desktop, first view and full scroll         |
| `npm run images`         | Renders and encodes the case-study artefact images (see "Case studies")           |
| `npm run terrain`        | Regenerates `public/terrain` from swisstopo data                                  |
| `npm run verify:terrain` | Checks that the committed heightmaps decode to the exact source heights          |
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

All copy lives in `src/content`. Facts still to confirm are written as `[PLACEHOLDERS]` (links as `href: null`);
they stay visible in preview builds so gaps are easy to spot. Stats are optional everywhere (cards, case-study
summary, Basecamp): a stat row shows only the stats that have a value and disappears when none has one.
`npm run check:content` lists every remaining placeholder with file, line and field. `npm run build` runs it for
its `SITE_MODE`:

- `construction` requires only what the under-construction page shows: the name and the email and LinkedIn
  links (`npm run check:content -- --mode=construction` lists those);
- `basecamp` only warns;
- `live` fails on any placeholder.

A local build with `NEXT_PUBLIC_PREVIEW=1` only warns in every mode. Flagged examples (see "Case studies")
are fictional on purpose: `check:content` skips them and names them once, and live builds don't contain them.

### Tuning the contour field

In `npm run dev`, a collapsed "Tuning (dev only)" leva panel controls every uniform: contour spacing, index
lines, line widths and opacities, colour tokens, headlamp, glow, drift, intro and morph durations.

The contour interval adapts to the screen. It is the smallest of 50, 100, 200, 250 and 500 m that keeps lines on
steep terrain (the map's 95th-percentile gradient) at least `minSpacingPx` CSS pixels apart at the map's
on-screen scale; every 5th line is an index line. With the committed `minSpacingPx: 3` phones in portrait get
200 m (250 m on 320 px wide screens), 1280–1440 px laptops 200 m, tablets and 1920+ px desktops 100 m. The panel
shows the interval in use; resizes glide to the new interval, and morphs blend between the two terrains'
intervals. "Save to config"
writes the values to `src/config/contour-field.json`, which is committed. Colours and durations are stored as
token names. Leva is never part of the production build. Add `?field=force` to a URL to skip the low-spec check,
which is useful in headless browsers.

## Case studies

Every case study (`/work/<slug>/`) is built from the same blocks. The content model is in
`src/lib/case-study.ts`, the copy in `src/content/case-studies.ts`, the components in
`src/components/case-study`. `src/content/examples/test-project` is a complete, fictional model case study that
uses every block; read it as the reference.

- **Header:** the terrain header and its morph from the card stay; under the deck line a type line and the meta
  line "7 min read · 60-second skim below" (reading time from the body, counted like Medium: 265 words a minute
  plus 12 s for the first figure, a second less for each next one, at least 3 s; the link goes to the Summit
  summary). The product hero (`hero`) sits directly after the summary.
- **Waypoints:** each heading states its finding, "Label — finding"; decisions are h3 blocks.
- **In-page navigation:** from 1200 px a sticky "On this page" trail beside the content (a `nav`, one link per
  waypoint, a dotted contour trail that fills up to the waypoint being read, `aria-current="true"`); below
  1200 px the "Jump to" chips near the top and "Next waypoint ↓ / Back to top ↑" at the end of each waypoint.
- **Figures** (`Figure.tsx`): `<figure>` with `<picture>` (AVIF, then WebP, width descriptors, `sizes`, explicit
  width and height), lazy unless `priority` (eager, `fetchpriority="high"`, only for an image in the first
  viewport), a tiny blurred placeholder, and the caption "Fig. n — What it shows. Why it matters." (numbered in
  order of appearance, about 30 words at most). Complex diagrams add a long description behind "Describe this
  diagram". Two surfaces: the map sheet (sheet colour, 32 px inside, contour hairline, 8 px corners) for light UI
  and diagrams, the night frame (raised ground) for charts and the hero; column (~720 px) or wide (~1120 px),
  full width on phones.
- **Lightbox** (`zoom: true`): an "Enlarge" button on a native `<dialog>`; focus moves in, Esc closes, focus
  returns; the largest source loads on open; pinch and pan on touch, click or wheel zoom and +/−/reset (names
  carry the zoom level) on desktop; no zoom animation with reduced motion. Without JavaScript the figure offers
  "Open full-size image".
- **Before/after** (`kind: "compare"`): a native range "Compare before and after" moves a clip, plus "Before /
  After / Side by side" buttons; without JavaScript both images stack with their own alt text.
- **Hotspots** (`kind: "hotspots"`): numbered marker buttons on the image highlight the matching note in the
  caption's visible ordered list; positions come from the image manifest.
- **Key insight** (one per page), **pull quote** (one per page), **decision** (options table, then chose / cost /
  mitigation), **metric tiles** and **outcome table** with evidence badges MEASURED, ESTIMATED, QUALITATIVE
  (shape plus text) and a legend.

Lightbox, comparison and hotspot code load lazily, only on pages that use them, once the figure comes near the
viewport (`Enhance.tsx`). `npm run check:figures` enforces the "one per page" and caption rules for every case
study.

### Numbers come from a data file

A case study can keep every number in one data file (Test Project: `src/content/examples/test-project/data.ts`).
Copy, the card, figure captions and alt text are written with tokens, `{{outcomes.complete.after}}%`,
`{{workshops.count|word}}`, `CHF {{subsidy.maxChf|en}}` (`src/lib/fill.ts`; an unknown path stops the build).
`src/content/examples/sources.ts` tells the tools where such a case study keeps its data, copy and artefacts.
`npm run check:figures` (run by every build that includes examples) fails when copy, the card or an artefact
source writes a digit of its own, when the data contradicts itself, when a key figure (`keyFigures`) is missing
from the copy, card or chart it must appear in, or when a committed image is older than its data or source.

### Flagged examples

A card and case study marked `example: true` (`src/content/examples`) are fictional: a banner above the H1, a
"Fictional example" stamp on the card, "fictional" in the type line, noindex on the page, a footer strip on every
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
"TEST PROJECT · FICTIONAL EXAMPLE · Fig. n" on every image.

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
  100 m too). The only script runs the live Bern clock and the pointer/touch headlamp; both stay off with
  reduced motion, and the page is complete without JavaScript. Every other path redirects (302) to `/`, and
  `REDIRECT_DOMAINS` redirect (301) to `PRIMARY_DOMAIN`. A phone visit transfers about 81 KB
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
  `https://PRIMARY_DOMAIN` (the production page's "Basecamp access" form), from the gated host itself, or
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
    `h = offset + (R·65280 + G·255)·scale`. Phones and small screens load the 1024 map, desktops the 1536 map.
    The 2048 map is only used in preview builds with `?hm=2048` (also `?hm=1024` / `?hm=1536`), to compare
    them side by side.
  - `terrain.json`: elevation range, LV95/WGS84 bbox, pixel scale, encoding, lakes and card metadata.
  - `contours.svg` (100 m, 67 KB gzipped) and `contours-200.svg` (200 m, 35 KB gzipped): the first-paint,
    reduced-motion and no-WebGL posters, every 5th line an index line, lakes as filled shapes found as flat
    surfaces in the DTM. A media query computed from the same spacing rule as the field picks one, so the
    poster and the field show the same interval (100 m on large screens and tablets, 200 m on phones and
    laptops).
  - `cards/*.svg`: the leader card's Interlaken → Jungfrau crop (200 m lines) and seeded-noise terrains for
    project cards (seed = collector number, ~20 lines, every 4th an index line).
  - `morph/*.webp`: per-card heightmaps the field morphs to on case-study pages and Basecamp.
  - `examples.json`: the card terrains of flagged examples (cards marked `"example": true` in the config), kept
    out of `terrain.json` so live bundles don't carry them.
  - `profile.json`: the elevation profile along the leader trail (240 points, ~1 KB gzipped) for the About
    page's ascent chart.
- `npm run terrain -- --refresh` re-downloads; `-- --placeholder` builds from procedural terrain without the
  network; `-- --png` also writes PNG copies (git-ignored, not used by the site); `-- --only=lab-099` rebuilds only
  the named seeded card terrains and updates their metadata, without touching the region.
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

Attribution: "Terrain data © swisstopo" appears in the HUD and the footer.

## Accessibility and motion

- Semantic HTML first. The hero name is server-rendered text, so LCP is text, not the canvas.
- All interactions work with the keyboard. Each card is a single link, named by the card's title, with the focus
  ring around the card. Focus returns to the originating card after navigating back.
- Kinetic headlines keep a hidden rest-state copy of each letter, so the animation never changes layout (no CLS).
  The accessible name is the plain text.
- Every effect has a reduced-motion twin, triggered by `prefers-reduced-motion` or the Calm map toggle (stored
  in localStorage):
  - the field becomes the static poster;
  - tilt is off;
  - the foil is static;
  - headlines don't animate;
  - the deck doesn't deal in;
  - no View Transition runs at all: pages change directly and the incoming page fades in over 150 ms (opacity
    only); focus return and scroll restoration work as in full motion.
- Navigation finishes cleanly even when a view transition is skipped, times out or fails: React commits the
  route change anyway, and the arriving heading settles. `npm run test:e2e -- transitions` simulates all three
  (forward, browser back, forward again, the in-page back link, open again) plus Calm map, reduced motion and
  the previous return (`?vt=classic`), and checks the page, focus, the field's terrain (`data-terrain` on the
  backdrop), the return's phases (exit, travel, card rebuild) and that nothing is left hidden. It needs
  Playwright with Chromium and a build in `out/`.

### Preview-only switches

Dev and preview builds (`NEXT_PUBLIC_PREVIEW=1`, so the Basecamp deploy) understand two query parameters;
production builds compile them out:

- `?name=…` shows the hero with another name, to check the layout for other lengths (the name is set on at
  most two lines and sized by its longest line);
- `?vt=classic` switches the way back to the deck to the previous plain morph for the rest of the session, and
  `?vt=new` back to the card reassembly. This switch is temporary.
- WCAG AA contrast is checked by `npm run check:contrast`, including sheet and glacier text over the faded
  lines of a quiet zone, body text over its knockout and legend panels, and display type at every step of its
  hover shine. Contour-coloured labels keep their halo (`.keep-halo`), and the poster fallback keeps all halos
  and its vignette.
- Body text is measured as rendered: `npm run check:legibility` screenshots every `.body-copy` block (and the
  footer and tables, `.knockout`) on the home page, a case study, the case-study example (when built) and
  Basecamp, at 1440×900 and 390×844, over the field with the headlamp lit right on the text and over the poster.
  It requires at least 7:1 against the brightest background pixel under or next to a glyph, and lines under the
  glyphs at most 15% of a lit line. Text on opaque surfaces (`.surface-copy`: captions, the summary, the banner,
  the key insight, metric tiles) is measured too; dark text on the sheet colour needs 4.5:1 (no lines run
  behind it). It also fails when a page is wider than the phone (it would pan sideways).
- The HUD clock always shows the live Bern time, Calm map and reduced motion included (a changing time is
  content, not motion); only its pulsing dot stops.
