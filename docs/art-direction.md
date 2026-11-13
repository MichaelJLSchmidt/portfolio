# Art direction: "The Table"

The brief every session designs to. Tokens and components that implement it are listed in
`docs/contracts.md`.

## The idea

A card table seen from the player's seat. A dark neutral field (ink `#0E0F11`, text `#ECEAE4`)
with a slowly breathing WebGL gradient behind everything; its colour pools drift on slow loops
(90 s and longer, 2–3% of the viewport), noticeable only when you look closely. A persistent
**hand of four cards** is the main navigation: three case studies (`/work/[slug]`) and Management
(`/management`). About is the one plain link; it holds the project list and the contact chapter.

On About the gradient's colour pools contract and fade into a dark ground (`#1B1C18`) while
contour lines rise out of a soft noise relief and settle onto the real swisstopo terrain of
Interlaken (1.6 s): the lakes fill in at 8%, stone-grey lines (`#8A8C80`, 1 px and 1.5 px index
lines) under the old password page's vignette. The last moment hands over, unseen, to the old
page's contour drawing itself. At rest only its lines move, a very slow drift of a few pixels;
nothing reacts to the pointer. Leaving About runs the morph back.

## Colour identities

| Card / page | Identity |
| --- | --- |
| Case 1, Team of Teams | ember red |
| Case 2, Shared Foundations | tide blue |
| Case 3, Front Door | grove green |
| Management | saffron gold |
| About | glacier teal (accents), over the contour field's ground |
| Master's thesis overview | glacier, over the table field in the glacier tint |
| Home, 404 | ink |

Values: `src/design/palette.ts`. Body text stays `--text`; accents are for links, focus, metrics,
dividers and illustration strokes.

## Behaviour

- **Hover** a card: the background blends toward the card's colour.
- **Play** a card: the card hits the table. It gives a little under the finger, lifts out of the
  hand and flies in a low arc to the centre of the table, rising toward the eye and then dropping
  into contact at speed: no rebound, just the contact shadow snapping tight, a 60 ms hold, a short
  haptic where the device has one, and one soft ring in the card's colour running out across the
  field as its colour blooms from where the card landed. Then the card becomes its page in one
  container transform: its frame grows to the full screen and dissolves, its coloured band becomes
  the hero image, its title the page's h1; the hero's details follow on the page. **Back** (the
  header's top-left slot on detail pages, where the logo compresses into a back arrow, or Escape)
  folds the page back into the card, which shrinks into its slot and lies on top of the hand.
  Playing another card from an open page dims that page's hero while the new card flies; the old
  card goes back to its slot.
- **Waiting**: if the next page is slow, the card rests on the table and the field breathes softly
  under it; after a moment a plain "Loading…" appears beneath it. Offline, the card lands, comes back
  to the hand and a plain line says so. No spinners, no progress bars.
- **Desktop**: the hand is always visible at the bottom in a perspective fan.
- **Mobile**: the fan on home; elsewhere a 48 px rail of the four cards' edges: one tap plays a
  card (a press shows under the thumb, a scroll calls it off), the open card's edge sits lower with
  an accent line and takes the page back to its top.
- **Header**: the logo (two fanned cards with an M and an F cut out) or Back at the top left; at
  the right one capsule, the tray: About, a hairline and the language switcher, whose active
  language lies on a face-up chip that slides across when you switch. On pages that scroll it
  leaves on a deliberate scroll down and returns on any scroll up (the mobile rail with it); the
  reading hairline stays at the top edge. On card pages Back never leaves: it holds its place on a
  floating chip. Its hover pulls the arrow back, rolls the letters and draws the chip in.
- **Logo**: on the first home visit its two cards are dealt in with the rest of the table. The F
  card wears one of four gradients made from the cards' colours, a different one on every load,
  its colours flowing along it very slowly (still under reduced motion). Hover or focus opens the
  fan: the cards turn apart, part and lift. A click on the logo on home (or a long press by touch) turns
  the cards to show their letters, and back. Entering a detail page the cards close up and leave
  before "← Back" appears; coming back they are dealt again.
- **Home** is one screen: the name, the intro, what I bring to the table and the hand. On a first
  visit it builds up in reading order in about two seconds, the hand last.
- **Detail pages**: chapters open with big outlined numerals that draw themselves, contour by
  contour, as the chapter comes into view (Key decisions keeps its head pinned above the cards as
  they are dealt, and draws its numeral as the stage pins); images are offset editorial frames
  that echo the hero's offset (anchored to the reading column, reaching toward one edge, sides
  alternating), never full bleed on desktop.
- **About** keeps to the table: its timeline and "How I work" are face-up cards in the same family
  as "What's on the table" (edges, mono labels). The timeline is two lanes, work and education,
  on one year axis (horizontal on desktop, vertical on phones): each card as long as its years,
  overlaps marked by a faint shared band, the apprenticeship one card across both lanes. Its cards
  are dealt in order from a deck at the start of the axis; the Master's card opens the thesis
  overview with the card-to-hero morph. "How I work" is dealt with a slight fan that settles
  straight.

- **Text links**: a thick marker block in a deeper shade of the page's colour sits behind the
  lower part of the text, shifted a little to the right; on hover or focus it slides left and down
  and thins into an underline in the page's accent, in one quick ease-out move, and back. Links
  that stand alone get a small solid triangle after the text that fades in with the line. On home
  and 404 the marker is the logo's gradient, flowing with it. Links outside the page (the header's
  About, the footer) take the colour of the page shown; the current page shows the line alone.

- **Thesis overview**: the case-study template in glacier, reached from the Master's card in the
  timeline (the card grows into the hero). It reads in three layers: the hero, the one-line answer
  and the figures; each chapter's lead and four dealt insight cards; the chapters in full, with
  five line drawings. Anonymous: no author, no employer.

## Tone

- Calm, subtle, smooth, professional, with playful moments (the easter eggs).
- Only the background (and the logo's slow gradient, shared by text links on home and 404) moves
  at rest; everything else is still until the visitor scrolls or
  interacts. No bounce, no overshoot: impact comes from acceleration into contact, a hold, the
  shadow and the field's answer.
- Two motion tiers: full, and reduced (`prefers-reduced-motion`: crossfades only, no flight and no
  shared morph, and the background's ambient motion is still). There is no motion setting on the
  site.
- Dark mode first. Mobile first, with full creativity on desktop.
- Type: Bricolage Grotesque (display, opsz + wght), Hanken Grotesk (text), Martian Mono (labels,
  numbers); Caveat (handwriting) only for the idle hint's note on home.
- Plain labels. No job-seeking language, CV download or testimonials. No personal names in code,
  comments, docs or commits.
- Two languages, German (Swiss Standard German, informal "du", no em-dashes or semicolons) and
  English, the same design in both. The header's switcher (DE, EN) switches in place with one short
  cross-fade; the table, the field and the reading position stay.

## Constraints

- Static export under the GitHub Pages base path (`/random/`): never a hard-coded leading `/`
  for assets or links (`next/link`, or `withBase()` for raw URLs).
- No new animation or smooth-scroll libraries (no GSAP, no Lenis): Motion, Motion+ and CSS cover
  everything; every extra runtime costs mobile performance. Initial JS budget 170 KB gzip.
