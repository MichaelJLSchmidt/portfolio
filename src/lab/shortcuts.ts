import { type EggName, eggs } from '@/eggs/registry'
import { gate } from '@/hosting/config'
import { concepts } from '@/lab/logo/concepts'
import { isLab, sourceFiles } from './source'

/*
 * The test shortcuts the lab overview lists, read from the code: the URL flags the site checks
 * (URLSearchParams on location.search), the easter eggs (src/eggs/registry.ts) with the page to
 * try each on, the values the site keeps in session and local storage (its *_KEY constants), and
 * the command-line checks (scripts/*.mjs). Server only.
 */

/** Where to try each egg (without the locale). A new egg fails the type check until it is listed. */
const eggPages: Record<EggName, string> = {
  mulligan: '/',
  workshop: '/management',
  rarePull: '/?rare',
  tap: '/',
  shortcuts: '/',
  discard: '/no-such-page',
  onTheTable: '/about',
  inspect: '/',
  idleHint: '/?idle',
  coffee: '/',
}

export const eggList = () =>
  (Object.keys(eggs) as EggName[]).map((name) => ({ name, ...eggs[name], path: eggPages[name] }))

/** The comment right above line `line` of `text` (// or block comment lines), joined. */
function commentAbove(text: string, line: number): string {
  const lines = text.split('\n')
  const out: string[] = []
  for (let i = line - 2; i >= 0 && i >= line - 8; i--) {
    const l = lines[i].trim()
    if (/^(\/\/|\*|\/\*)/.test(l)) out.unshift(l.replace(/^(\/\*\*?|\*\/?|\/\/)\s?/, '').replace(/\*\/$/, ''))
    else if (out.length || l) break
  }
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

/** Where the code explains a flag elsewhere: an egg's trigger, else a comment that names "?flag". */
function mentionOf(flag: string): string {
  const egg = eggList().find((e) => e.trigger.includes(`?${flag}`))
  if (egg) return `${egg.name}: ${egg.trigger}`
  const re = new RegExp(`\\?${flag}(?![\\w-])`)
  for (const f of sourceFiles())
    for (const l of f.text.split('\n')) {
      const t = l.trim()
      if (/^(\/\/|\*|\/\*)/.test(t) && re.test(t)) return t.replace(/^(\/\*\*?|\*\/?|\/\/)\s?/, '')
    }
  return ''
}

export type UrlFlag = { flag: string; kind: 'has' | 'get'; file: string; line: number; note: string; links: string[] }

/** Every URL flag the code reads (?rare, ?idle, the logo lab's ?c=<concept>). */
export function urlFlags(): UrlFlag[] {
  const out: UrlFlag[] = []
  for (const f of sourceFiles()) {
    for (const m of f.text.matchAll(/URLSearchParams\(location\.search\)\.(has|get)\(\s*'(\w+)'\s*\)/g)) {
      const line = f.text.slice(0, m.index).split('\n').length
      const kind = m[1] as 'has' | 'get'
      const flag = m[2]
      if (out.some((o) => o.flag === flag)) continue
      // The site's flags act on home (the hand and its eggs); the logo lab's on the lab.
      const page = isLab(f.path) ? '/logo-lab' : '/'
      const links =
        kind === 'has'
          ? [`${page}?${flag}`]
          : flag === 'c' && f.path.startsWith('src/lab/logo/')
            ? concepts.map((c) => `${page}?c=${c.id}`)
            : [`${page}?${flag}=`]
      out.push({ flag, kind, file: f.path, line, note: commentAbove(f.text, line) || mentionOf(flag), links })
    }
  }
  return out
}

export type StoredValue = {
  key: string
  storage: 'sessionStorage' | 'localStorage'
  constant: string
  file: string
  line: number
  note: string
}

/** The site's stored values: every *_KEY constant that session or local storage reads or writes. */
export function storedValues(): StoredValue[] {
  const files = sourceFiles().filter((f) => !isLab(f.path) && /\.tsx?$/.test(f.path))
  const out: StoredValue[] = []
  for (const f of files) {
    for (const m of f.text.matchAll(/(?:export\s+)?const\s+(\w+_KEY)\s*=\s*'([^']+)'/g)) {
      const [, constant, key] = m
      const use = (s: string) =>
        files.some((g) => new RegExp(`${s}\\.\\w+Item\\(\\s*(?:["'\`]\\$\\{)?${constant}\\b`).test(g.text))
      const storage = use('sessionStorage') ? 'sessionStorage' : use('localStorage') ? 'localStorage' : null
      if (!storage) continue
      const line = f.text.slice(0, m.index).split('\n').length
      out.push({ key, storage, constant, file: f.path, line, note: commentAbove(f.text, line) })
    }
  }
  return out.sort((a, b) => a.storage.localeCompare(b.storage) || a.key.localeCompare(b.key))
}

/** The gate's own addresses (Netlify deploys only: the edge function answers them). */
export const gatePaths = () => [
  { path: gate.lock, note: 'Clears the gate cookie: the next request shows the password page again.' },
  ...['de', 'en'].map((l) => ({
    path: `${gate.lang}${l}?next=/`,
    note: `The gate page in ${l === 'de' ? 'German' : 'English'} (remembered in a cookie).`,
  })),
]

export type Check = { file: string; summary: string; usage: string | null }

/** The command-line checks: scripts/*.mjs and the logo lab's tools that say how to run them. */
export function checks(): Check[] {
  return sourceFiles()
    .filter((f) => /^(scripts\/[^/]+|src\/lab\/logo\/tools\/[^/]+)\.mjs$/.test(f.path))
    .map((f) => {
      const head: string[] = []
      for (const l of f.text.split('\n')) {
        const t = l.trim()
        if (/^(\/\/|\/\*|\*)/.test(t)) head.push(t.replace(/^(\/\*\*?|\*\/?|\/\/)\s?/, ''))
        else break
      }
      const usage = head.find((l) => /^Usage:/.test(l))?.replace(/^Usage:\s*/, '') ?? null
      const summary = head
        .filter((l) => !/^Usage:/.test(l))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(/(?<=[a-z)]\.)\s(?=[A-Z])/)[0]
      return { file: f.path, summary, usage }
    })
    .filter((c) => c.summary && (c.usage || /-check\.mjs$/.test(c.file)))
}
