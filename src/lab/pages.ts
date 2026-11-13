import { listFiles, readSource } from './source'

/*
 * The lab's pages: every internal testing page, its address without the locale, and one line on
 * what it is for. The overview (/lab/) lists them. The build fails when a lab route has no entry
 * here, an entry has no route, or the header's Lab link points elsewhere (checkLabPages), so a
 * new test page cannot go unlisted. Server only.
 */
export type LabPage = { path: string; title: string; purpose: string }

export const labPages: LabPage[] = [
  {
    path: '/lab',
    title: 'Lab',
    purpose: 'This overview: every testing page, and the shortcuts that force a state for testing.',
  },
  {
    path: '/lab/inventory',
    title: 'Design inventory',
    purpose:
      'Every visual artefact the site uses, rendered from its own code and tokens, each with a reference ID to quote when asking for a change.',
  },
  {
    path: '/logo-lab',
    title: 'Logo lab',
    purpose: 'Compare the monogram concepts small and large, play their motion per tier, score and download them.',
  },
]

const routeDir = 'src/app/[locale]/(lab)'

/** The lab's routes as the app folder has them ("/lab", "/lab/inventory", "/logo-lab"), with their files. */
export function labRoutes(): { path: string; file: string }[] {
  return listFiles(routeDir)
    .filter((f) => /\/page\.lab\.tsx$/.test(f))
    .map((file) => ({
      file,
      path:
        file
          .slice(routeDir.length)
          .replace(/\/page\.lab\.tsx$/, '')
          .replace(/\/\([^)]+\)/g, '') || '/',
    }))
}

export function checkLabPages() {
  const routes = labRoutes().map((r) => r.path)
  const listed = labPages.map((p) => p.path)
  const missing = routes.filter((r) => !listed.includes(r))
  const stale = listed.filter((p) => !routes.includes(p))
  if (missing.length || stale.length)
    throw new Error(
      `src/lab/pages.ts: ${missing.length ? `lab routes without an entry: ${missing.join(', ')}. ` : ''}${stale.length ? `entries without a route: ${stale.join(', ')}.` : ''}`,
    )
  const linked = /const path = '([^']+)'/.exec(readSource('src/lab/header-link.tsx'))?.[1]
  if (linked !== labPages[0].path)
    throw new Error(`src/lab/header-link.tsx links "${linked}", the lab overview is "${labPages[0].path}".`)
}
