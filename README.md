# Höhenlinie — The Summit Deck

Portfolio of a UX Team Lead / Senior UX Designer from Interlaken. Art direction: a night hike across a
topographic contour map. Projects are presented as original "Summit Cards".

This repository currently holds the foundation plus three technical spikes for the signature effects:

1. **Persistent contour field**: one WebGL canvas behind all routes. It draws real swisstopo contours with:
   - a pointer "headlamp" and loupe;
   - a rising alpenglow pulse;
   - parallax and click pings;
   - an intro sweep and terrain morphs;
   - quiet zones: elements marked `data-quiet-zone` (hero text, page headers, Basecamp headings) fade the lines
     behind them to 25% with a 48 px feather, so that text needs no halo or scrim while the field runs.
2. **Summit Card**: spring tilt and contour foil. Fully data-driven and accessible; the whole card links to its
   case study.
3. **Card → case study transition**: a choreographed view-transition morph from the deck into `/work/[slug]`
   and back, synchronised with the field. Durations and their reasoning are in `src/app/globals.css`.

Headlines use kinetic variable-font type (`src/components/type/KineticText.tsx`). The About page ("Basecamp",
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
| `npm run build`          | Static export to `out/`                                                            |
| `npm run preview`        | Serves `out/` like a static host, including the base path and gzip               |
| `npm run lint`           | ESLint (Next.js core-web-vitals + TypeScript rules)                               |
| `npm run typecheck`      | Generates route types, then `tsc --noEmit`                                        |
| `npm run check:contrast` | WCAG contrast of the token colour pairs                                            |
| `npm run check:content`  | Lists every content placeholder still to fill, with file, line and field          |
| `npm run report:size`    | Initial JS/CSS/fonts per route, lazy chunks, terrain assets (gzip)               |
| `npm run terrain`        | Regenerates `public/terrain` from swisstopo data                                  |
| `npm run verify:terrain` | Checks that the committed heightmaps decode to the exact source heights          |

To test the GitHub Pages sub-path locally:

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
`npm run check:content` lists every remaining placeholder with file, line and field. It also runs before
`npm run build` (`prebuild`): preview builds only warn, production builds fail while any placeholder remains.

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

## Preview deployment: GitHub Pages

`.github/workflows/pages.yml` runs on every push to `main` and on manual dispatch. It installs with
`MOTION_TOKEN` from the repository secret, then builds with `NEXT_PUBLIC_BASE_PATH` set to the Pages base path
(`/<repo>`) and `NEXT_PUBLIC_PREVIEW=1`. It deploys with `actions/configure-pages`,
`actions/upload-pages-artifact` and `actions/deploy-pages`.

One-time repository settings:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → New repository secret:** `MOTION_TOKEN`.
3. If the `github-pages` environment has deployment branch rules, `main` must be allowed (it is by default).

Preview URL: `https://<user>.github.io/<repo>/`. Deep links and reloads such as `/work/kibon/` work because
every route is exported as `route/index.html` (`trailingSlash: true`).

`.github/workflows/ci.yml` checks pull requests: lint, types, contrast, a sub-path build and the size report.
It also needs the `MOTION_TOKEN` secret.

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
  - `profile.json`: the elevation profile along the leader trail (240 points, ~1 KB gzipped) for the About
    page's ascent chart.
- `npm run terrain -- --refresh` re-downloads; `-- --placeholder` builds from procedural terrain without the
  network; `-- --png` also writes PNG copies (git-ignored, not used by the site).
- **Exact heights:** every WebP is decoded again right after encoding and must match byte for byte, and its
  SHA-256 is recorded in `terrain.json`. `npm run verify:terrain` re-checks the committed files with libwebp;
  `npm run verify:terrain -- --browser` also decodes them in Chromium the way the site does
  (`createImageBitmap` without colour-space conversion or premultiplied alpha, no flip, WebGL2 read-back).
  The browser check needs Playwright.

Attribution: "Terrain data © swisstopo" appears in the HUD and the footer.

## Production later: Netlify

Nothing is linked or deployed yet. `netlify.toml` is ready for a static deploy: `npm run build`, publish `out`,
Node 22, empty base path, no preview flag in production, and noindex on Deploy Previews and branch deploys.

When it's time:

1. In Netlify, **Add new project → Import an existing project**, connect this GitHub repository and keep the
   settings from `netlify.toml`.
2. **Project configuration → Environment variables:** add `MOTION_TOKEN` (all deploy contexts).
3. Point the root domain at the project. No base path is needed.
4. Keep production deploys rare: each one costs credits. Deploy Previews for pull requests and branch deploys
   are free, so iterate there and promote deliberately.

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
- WCAG AA contrast is checked by `npm run check:contrast`, including sheet and glacier text over the faded
  lines of a quiet zone. Contour-coloured labels keep their halo (`.keep-halo`), and the poster fallback keeps
  all halos and its vignette.
