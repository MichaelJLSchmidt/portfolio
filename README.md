# Höhenlinie — The Summit Deck

Portfolio of a UX Team Lead / Senior UX Designer from Interlaken. Art direction: a night hike across a
topographic contour map. Projects are presented as original "Summit Cards".

This repository currently holds the foundation plus three technical spikes for the signature effects:

1. **Persistent contour field**: one WebGL canvas behind all routes. It draws real swisstopo contours with a
   pointer "headlamp", an intro sweep and terrain morphs.
2. **Summit Card**: tilt, contour foil and flip, fully data-driven and accessible.
3. **Card → case study transition**: a view-transition morph from the deck into `/work/[slug]`, synchronised
   with the field.

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
| `npm run report:size`    | Initial JS/CSS/fonts per route, lazy chunks, terrain assets (gzip)               |
| `npm run terrain`        | Regenerates `public/terrain` from swisstopo data                                  |

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

### Tuning the contour field

In `npm run dev`, a collapsed "Tuning (dev only)" leva panel controls every uniform: interval, index lines,
line widths and opacities, colour tokens, headlamp, glow, drift, intro and morph durations. "Save to config"
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
  - `heightmap-2048.png` (26 m/px) and `heightmap-1024.png` (53 m/px): elevation packed into R (high byte) and
    G (low byte), 1 m steps, light σ=1 blur. Decoded in the shader as
    `h = offset + (R·65280 + G·255)·scale`. Phones and smaller desktops load the 1024 map; large and high-DPI
    screens load the 2048 map.
  - `terrain.json`: elevation range, LV95/WGS84 bbox, pixel scale, encoding, lakes and card metadata.
  - `contours.svg`: the first-paint, reduced-motion and no-WebGL poster. It has 100 m lines with every 5th as an
    index line, and the lakes are filled shapes found as flat surfaces in the DTM. About 67 KB gzipped.
  - `cards/*.svg`: the leader card's Interlaken → Jungfrau crop (200 m lines) and seeded-noise terrains for
    project cards (seed = collector number, ~20 lines, every 4th an index line).
  - `morph/*.png`: per-card heightmaps the field morphs to on case-study pages.
- `npm run terrain -- --refresh` re-downloads; `-- --placeholder` builds from procedural terrain without the
  network.

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
- All interactions work with the keyboard. Cards are real toggle buttons (`aria-pressed`) with a separate link
  on the back, and flips are announced through a polite live region. Focus returns to the originating card after
  navigating back.
- Every effect has a reduced-motion twin, triggered by `prefers-reduced-motion` or the Calm map toggle (stored
  in localStorage):
  - the field becomes the static poster;
  - tilt is off;
  - the foil is static;
  - the flip becomes a 150 ms crossfade;
  - the route morph becomes a short crossfade.
- WCAG AA contrast is checked by `npm run check:contrast`.
