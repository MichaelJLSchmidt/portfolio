import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, posix } from 'node:path'

/*
 * The site's own source, read while the lab pages render (at build time: they are static). The
 * lab answers "where is this used" and "what is there" from it instead of keeping lists by hand:
 * which files import an export or use one of its members, read a CSS custom property, carry a
 * class or name a string. Server only (node:fs); never part of a page's JavaScript.
 *
 * The lab itself (src/lab/, the (lab) route group) is read but never counted as a use.
 */
const root = process.cwd()
const dirs = ['src', 'content', 'scripts']
const sourceExt = /\.(tsx?|css|mjs)$/

export type SourceFile = { path: string; text: string }
export type Usage = { file: string; line: number }

let cache: SourceFile[] | null = null

/** Every source file under src/, content/ and scripts/ (paths relative to the repository, with /). */
export function sourceFiles(): SourceFile[] {
  if (cache) return cache
  const out: SourceFile[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(join(/* turbopackIgnore: true */ root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else if (sourceExt.test(entry.name))
        out.push({ path, text: readFileSync(join(/* turbopackIgnore: true */ root, path), 'utf8') })
    }
  }
  for (const dir of dirs) walk(dir)
  cache = out.sort((a, b) => a.path.localeCompare(b.path))
  return cache
}

/** One file's text (any file in the repository, e.g. an SVG under public/). */
export const readSource = (path: string) => readFileSync(join(/* turbopackIgnore: true */ root, path), 'utf8')

/** Files under a directory (relative paths), recursively. */
export function listFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (d: string) => {
    for (const entry of readdirSync(join(/* turbopackIgnore: true */ root, d), { withFileTypes: true })) {
      const path = `${d}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else out.push(path)
    }
  }
  walk(dir)
  return out.sort()
}

/** A Node module from node_modules, loaded at build time without bundling it (fontkit). */
export const nodeRequire = createRequire(join(/* turbopackIgnore: true */ root, 'package.json'))

export const isLab = (path: string) => path.startsWith('src/lab/') || path.includes('/(lab)/')
const siteFiles = () => sourceFiles().filter((f) => !isLab(f.path))

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length

/** "src/motion/tokens" from an import specifier as written in `from`. */
function resolveModule(from: string, spec: string): string {
  let path: string
  if (spec.startsWith('@/')) path = `src/${spec.slice(2)}`
  else if (spec.startsWith('@content/')) path = `content/${spec.slice(9)}`
  else if (spec.startsWith('.')) path = posix.normalize(posix.join(posix.dirname(from), spec))
  else return spec
  return path.replace(/\.(tsx?|mjs|js)$/, '').replace(/\/index$/, '')
}

/** A module path without its extension: "src/design/palette.ts" -> "src/design/palette". */
export const moduleOf = (file: string) => file.replace(/\.(tsx?|mjs|js)$/, '').replace(/\/index$/, '')

type Import = { local: string; name: string; module: string }
const importCache = new Map<string, Import[]>()

/** The bindings a file imports: named, default ("default") and namespace ("*"). */
function importsOf(file: SourceFile): Import[] {
  const known = importCache.get(file.path)
  if (known) return known
  const out: Import[] = []
  const re = /(?:import|export)\s+(?:type\s+)?([\w$*{}\s,]+?)\s+from\s+['"]([^'"]+)['"]/g
  for (const m of file.text.matchAll(re)) {
    const module = resolveModule(file.path, m[2])
    const clause = m[1].trim()
    const ns = /\*\s+as\s+(\w+)/.exec(clause)
    if (ns) out.push({ local: ns[1], name: '*', module })
    const named = /\{([\s\S]*)\}/.exec(clause)
    if (named)
      for (const part of named[1].split(',')) {
        const [name, local] = part
          .replace(/^\s*type\s+/, '')
          .trim()
          .split(/\s+as\s+/)
        if (name) out.push({ local: (local ?? name).trim(), name: name.trim(), module })
      }
    const def = /^(\w+)\s*(?:,|$)/.exec(clause)
    if (def) out.push({ local: def[1], name: 'default', module })
  }
  importCache.set(file.path, out)
  return out
}

export type UsageQuery = {
  /**
   * An export of a module ("src/motion/tokens", "ease"): the files that import it, or with
   * `member` (["link"]) the files that use that member through their import (`ease.link`,
   * `E.link` after `ease as E`). The module's own file counts when it uses the member itself.
   */
  exports?: { module: string; name: string; member?: string[] }[]
  /** CSS custom properties ("--ember-glow"): read with var(), or set by name. */
  cssVars?: string[]
  /** Class names, in markup (className strings) and in selectors. */
  classes?: string[]
  /** JSX elements by component name. */
  jsx?: string[]
  /** Quoted strings ('about-portrait'). */
  strings?: string[]
  /** Leave these files out (the definition itself). */
  except?: string[]
}

/** Where the site's code uses something: the first line per file, sorted by path. */
export function usages(q: UsageQuery): Usage[] {
  const found = new Map<string, number>()
  const hit = (file: SourceFile, index: number) => {
    if (q.except?.includes(file.path) || index < 0) return
    const line = lineOf(file.text, index)
    const prev = found.get(file.path)
    if (prev === undefined || line < prev) found.set(file.path, line)
  }
  const first = (file: SourceFile, re: RegExp) => {
    const m = re.exec(file.text)
    if (m) hit(file, m.index)
  }
  for (const file of siteFiles()) {
    const css = file.path.endsWith('.css')
    for (const e of q.exports ?? []) {
      const member = e.member?.length ? `\\??\\.${e.member.map(escape).join('\\??\\.')}(?![\\w$])` : ''
      if (moduleOf(file.path) === e.module) {
        if (member) first(file, new RegExp(`(?<![\\w$.])${escape(e.name)}${member}`))
        continue
      }
      for (const imp of importsOf(file)) {
        if (imp.module !== e.module) continue
        if (imp.name === '*') first(file, new RegExp(`(?<![\\w$.])${escape(imp.local)}\\.${escape(e.name)}${member}`))
        else if (imp.name === e.name) {
          if (!member) hit(file, file.text.indexOf(imp.local))
          else first(file, new RegExp(`(?<![\\w$.])${escape(imp.local)}${member}`))
        }
      }
    }
    for (const v of q.cssVars ?? []) first(file, new RegExp(`(?:var\\(\\s*|['"\`])${escape(v)}(?![\\w-])`))
    for (const c of q.classes ?? []) {
      const token = escape(c)
      if (css) first(file, new RegExp(`\\.${token}(?![\\w-])`))
      else {
        // In markup: a className string or expression that holds the class as a word; in code: a
        // selector string (".link", "a > .link").
        first(file, new RegExp(`className=(?:"[^"]*|'[^']*|\\{[^}]*?)(?<![\\w-])${token}(?![\\w-])`))
        first(file, new RegExp(`['"\`][^'"\`\\n]*\\.${token}(?![\\w-])[^'"\`\\n]*['"\`]`))
      }
    }
    if (!css) {
      for (const j of q.jsx ?? []) first(file, new RegExp(`<${escape(j)}[\\s/>]`))
      for (const s of q.strings ?? []) first(file, new RegExp(`['"\`]${escape(s)}['"\`]`))
    }
  }
  return [...found].map(([file, line]) => ({ file, line })).sort((a, b) => a.file.localeCompare(b.file))
}

/** The line where `pattern` first matches in `file` (1 when it does not): for "source" pointers. */
export function lineIn(file: string, pattern: RegExp | string): number {
  const text = sourceFiles().find((f) => f.path === file)?.text ?? ''
  const index = typeof pattern === 'string' ? text.indexOf(pattern) : (pattern.exec(text)?.index ?? -1)
  return index < 0 ? 1 : lineOf(text, index)
}

/** An absolute path for a repository file (for libraries that open files themselves). */
export const absolute = (path: string) => join(/* turbopackIgnore: true */ root, path)

/** What a file imports, by local name: { module, name } (module paths as moduleOf() writes them). */
export function importMap(path: string): Map<string, { module: string; name: string }> {
  const file = sourceFiles().find((f) => f.path === path)
  return new Map((file ? importsOf(file) : []).map((i) => [i.local, { module: i.module, name: i.name }]))
}
