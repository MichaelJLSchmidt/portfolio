# The lab (temporary, internal)

Internal testing pages, in English on both locales (`lang="en"`), never indexed, and only in
builds that are not public:

| Page             | Address (`/de/…` or `/en/…`) | Route file                                       |
| ---------------- | ---------------------------- | ------------------------------------------------ |
| Lab overview     | `/lab/`                      | `src/app/[locale]/(lab)/lab/page.lab.tsx`        |
| Design inventory | `/lab/inventory/`            | `src/app/[locale]/(lab)/lab/inventory/page.lab.tsx` |
| Logo lab         | `/logo-lab/`                 | `src/app/[locale]/(lab)/logo-lab/page.lab.tsx`   |

The header shows a temporary **Lab** link next to About (About's style in a dashed capsule) that
leads to the overview.

## The lab switch

`SITE_ACCESS` (netlify.toml, per deploy context) decides, as it does for the password gate:

- **anything but `public`** (every deploy until launch, Deploy Previews after it): `next.config.ts`
  adds `lab.tsx` to `pageExtensions`, so the `*.lab.tsx` files in `src/app/[locale]/(lab)/` are
  routes, and sets `NEXT_PUBLIC_LAB=1`, so the header renders `LabLink`.
- **`public`**: `*.lab.tsx` is no page extension, so there are no lab routes, and nothing imports
  the lab's pages or their code. `NEXT_PUBLIC_LAB` is empty, so `LabLink`
  (`src/lab/header-link.tsx`) is the constant `null`: the header renders nothing and the minifier
  drops the component and its words. Its styles are inline for that reason.

Every lab route lives in the `(lab)` route group, whose layout sets `robots: noindex, nofollow`
whatever `SITE_ACCESS` says (each page sets it too). A new lab page: a `page.lab.tsx` under
`src/app/[locale]/(lab)/` and an entry in `src/lab/pages.ts`; the build fails while the two
disagree, or when the header's link points elsewhere.

Check a public build has none of it:

```bash
SITE_ACCESS=public npm run build
```

then `dist/` has no `lab/` or `logo-lab/` folder, and no file in `dist/_next/` mentions the lab
(`grep -rl "data-lab-link\|Design inventory\|logo-lab" dist` finds nothing).

## How the pages know what to list

Nothing is kept by hand where the code can say it. `source.ts` reads `src/`, `content/` and
`scripts/` while the pages render (at build time) and answers "which files import this export or
use this member, read this custom property, carry this class, name this string"; the lab itself is
never counted as a use.

- **Overview** (`shortcuts.ts`): the URL flags the code reads from `location.search`, the eggs of
  `src/eggs/registry.ts` (a new egg fails the type check until it has a page to try it on), the
  site's shortcut sheet (`content/en/site.ts`), every `*_KEY` the site stores (with a Clear
  button), the gate's addresses and the command-line checks.
- **Design inventory** (`inventory/`): one builder per section in `inventory/sections/`. Each walks
  the module it shows (`palette.ts`, `type.ts`, `tokens.ts`, `layout.ts`, the illustration and
  image registries, the token stylesheets), renders every entry with the site's own components,
  classes and custom properties, and gives it a reference ID derived from its source name
  (`identity.ember.accent`, `gradient.tide`, `motion.ease.outQuint`), its values (hex and OKLCH,
  computed with the field's OKLab code), its source file and export, and where it is used.
  Client parts (`inventory/client/`): the real `Logo` driven through its own hover and egg
  handlers, replay demos for curves, springs, durations and staggers, the reveal kinds run by the
  reveal's own jobs, hover and focus forced by copying the loaded `:hover` / `:focus-visible`
  rules onto `[data-force]`, and clones of the live header.

## Delete the lab

Remove `src/lab/`, `src/app/[locale]/(lab)/`, the `LabLink` line in `src/components/header.tsx`,
the lab lines in `next.config.ts` (`pageExtensions`, `NEXT_PUBLIC_LAB`) and the Lab check in
`scripts/smoke.mjs`.
