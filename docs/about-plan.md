# About page plan: "Basecamp"

**Status: superseded in phase 2.** The leader card is retired and Basecamp is reached from the HUD: its
Basecamp label morphs into the page's H1 (`src/components/hud/BasecampLink.tsx`). The page now reads: header
(H1 and lead), map legend, bio, rope rules (working with me), first 90 days, career climb (the ascent chart with
five camps, each with its card rarity), craft, off the map and the contact band; the copy is in
`src/content/about.ts`, invented values as `ex("…")`. The plan below is kept for its reasoning (the climb, the
chart, the motion budget); its entry points, header and sections describe the first version.

The About page continues the night hike. If case studies are expeditions, About is the **basecamp**: where you
learn who leads the rope team, what they carry and how they climb. It uses the same map, tokens, type and
motion rules as the rest of the site, and the facts a hiring manager needs come first.

## Goals

1. **Ten-second scan.** Role, scope, strengths and contact are above the fold, readable without JavaScript.
2. **Personality through the art direction.** The Alps are the narrative, not decoration: the career is told as a
   real ascent from Interlaken (566 m) to the Jungfrau (4158 m).
3. **No new weight.** No new libraries. It reuses KineticText, the Summit summary, CardArtwork and MorphTarget,
   and the scroll motion uses CSS where supported.

## Route and entry points

- **Route:** `/about/`, statically generated.
- **Leader card.** The leader card (IKN · 000) links here instead of `/work/profile/`.
  - Its artwork morphs into the About header and its name into the H1, using the same transition as the projects.
  - The contour field morphs to the real Interlaken → Jungfrau crop (`ikn-000`) with the camera push-in, so the
    map flies to Interlaken.
- **Other entry points:**
  - The HUD mark ("Höhenlinie") links home, and a HUD item "Basecamp" links here.
  - The footer gets an About link.

## Structure, top to bottom

```
DESKTOP (≥ 1000 px)                                   PHONE
┌───────────────────────────────────────────────┐    ┌─────────────────────┐
│ HUD                                           │    │ HUD                 │
│ ┌─────────── terrain header (morph) ────────┐ │    │ terrain header      │
│ │  Interlaken → Jungfrau crop, trail, pins  │ │    │ [FULL NAME]         │
│ └───────────────────────────────────────────┘ │    │ role · 566 m        │
│ [FULL NAME]  (kinetic H1)       role / place  │    │ statement           │
│ positioning statement      [Email][LinkedIn]  │    │ [Email][LinkedIn]   │
│                                   [CV ↓]      │    │ [CV ↓]              │
│ ┌──────── Summit summary (sheet) ───────────┐ │    │ Summit summary      │
│ └───────────────────────────────────────────┘ │    │ Ascent (vertical):  │
│ ASCENT PROFILE  (sticky, scroll-driven)       │    │ │ 2xxx  waypoint    │
│  4158 ┐                          ▲ Jungfrau   │    │ │ 2xxx  waypoint    │
│       │            ╱╲    ╱‾‾‾‾‾‾‾             │    │ │ 2xxx  waypoint    │
│   566 └──●───╱‾‾‾‾  ╲╱ ●        ●             │    │ ▲ Jungfrau          │
│        2xxx  2xxx   2xxx  2xxx  now           │    │ Rope team           │
│ ROPE TEAM: how I lead (3–4 trail markers)     │    │ Craft plaques       │
│ CRAFT: Facilitation · Design Systems · Code   │    │ Off the trail       │
│ OFF THE TRAIL (personal note)                 │    │ Plan a route →      │
│ PLAN A ROUTE TOGETHER → contact               │    │ footer              │
└───────────────────────────────────────────────┘    └─────────────────────┘
```

1. **Basecamp header.**
   - Terrain header (the leader card's crop, with the trail and the Interlaken and Jungfrau pins).
   - Kinetic H1 with pointer proximity, plus a role line and "Interlaken · 566 m".
   - A two-line positioning statement.
   - Primary actions, all real links: **Email**, **LinkedIn**, **Download CV (PDF)**.
2. **Summit summary** (sheet colour; the same component as the case studies, extracted for reuse). It covers:
   - current role and team size (4 FTE) and years at DV Bern (8+);
   - domains (public-sector platforms) and strengths (Facilitation · Design Systems · Front-end);
   - tools, languages and availability/location.
3. **Ascent profile** (the signature piece).
   - **Line:** the true elevation profile along the leader card's trail, Interlaken → Lauterbrunnen → Kleine
     Scheidegg → Jungfrau. It is sampled from swissALTIRegio by the terrain pipeline.
   - **Waypoints:** career milestones placed along the line by year (education, first roles, DV Bern, team lead,
     now). Each has a small plaque: year, role, organisation and one sentence of impact.
   - **Desktop:** a sticky section. Scrolling draws the line on (stroke-dashoffset tied to scroll) and moves a
     climber marker along it. Plaques reveal as the marker passes and the HUD altitude readout follows the
     marker.
   - **Phone:** the same story as a vertical timeline with a slim profile rail.
   - **Accessibility:** the real content is an ordered list (`<ol>`) of milestones. The SVG profile is decorative
     (`aria-hidden`).
4. **Rope team: how I lead.** Three or four principles styled as trail markers, each with one concrete example and
   one number. For example:
   - "Facilitate, don't dictate" → workshop formats and outcomes;
   - "Systems over screens" → Angular Material design system adoption;
   - "Design in code" → shipped components.
5. **Craft plaques.** Facilitation (Hyper Island methods), Design Systems and Front-end, written in the card's
   keyword language.
   - Static plaques derived from the card anatomy: rarity neatline, keyword plus reminder text, mono stats.
   - Evidence links where public (Storybook, talks, articles).
6. **Off the trail.** A short personal note (Interlaken, the mountains): "Born at 566 m. Still climbing."
7. **Plan a route together.** A contact call to action with the same three actions; the swisstopo credit stays in
   the footer.

## Motion, with reduced-motion twins

| Moment             | Motion                                                                | Reduced-motion twin                        |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------ |
| Arrival            | Leader card → header morph (900 ms), field morph with push-in (1.4 s) | 150 ms crossfade, static poster            |
| H1                 | KineticText condense, letters open up under the pointer               | Static display cut                         |
| Ascent profile     | Line draws with scroll, climber marker, plaques reveal                | Full line drawn, all waypoints visible     |
| Principles, plaques | Kinetic headings in view, staggered reveals (`--dur-long`)           | Static                                     |
| Background         | Headlamp and drift continue (monochrome map)                          | Poster                                     |

The ascent is driven by a passive scroll listener rather than `animation-timeline`: the climb has to land on
each milestone's position on the trail, which depends on where its plaque sits, so a small rAF loop measures the
plaques and eases towards the target (it jumps with reduced motion). Kinetic headings use an
IntersectionObserver. Durations and easings come from `tokens.ts` only.

## Content still needed

- Positioning statement (two lines) and the optional portrait.
- CV PDF, email address and LinkedIn URL.
- Milestones: year, role, organisation and one impact sentence each (5–7).
- Facts: workshops led, design system scope and adoption, languages, availability and working mode.
- Three or four leadership principles, each with an example and a number.
- The personal note.

## Technical notes

- **Content:** `src/content/about.ts` (typed; no copy in components).
- **Terrain pipeline:** a `profile` step samples the DEM every 25 m along the leader trail and writes
  `public/terrain/profile.json` (240 points, ~1 KB gzipped). The page imports it at build time, so the chart is
  part of the static HTML.
- **Leader card:** gets an optional `href` override (`/about/`); `/work/profile/` is no longer generated.
- **CV:** stored in `public/` and linked through `asset()` (a plain `<a href>` does not get the base path).
- **Performance:** no new dependencies; about +3 KB of initial JS. The profile SVG is inline (a few KB).
  Portrait as AVIF/WebP, lazy, with explicit dimensions (no CLS).
- **Accessibility:** one H1, landmarks, an ordered list for the ascent, descriptive link text, AA token pairs,
  keyboard-reachable actions above the fold.

## Implementation steps

| Step | Scope                                                                             | Estimate |
| ---- | --------------------------------------------------------------------------------- | -------- |
| 1    | Content model, route skeleton, extract the Summit summary component               | 0.5 day  |
| 2    | Basecamp header, actions, summary                                                 | 0.5 day  |
| 3    | Pipeline `profile` step, then the ascent profile with scroll drive and phone layout | 1–1.5 days |
| 4    | Rope team principles and craft plaques                                            | 0.5 day  |
| 5    | Leader card → About morph, HUD and footer links                                   | 0.5 day  |
| 6    | QA: keyboard, reduced motion, sub-path, sizes, real devices                       | 0.5 day  |
