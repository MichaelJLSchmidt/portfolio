// Loads the repository's TypeScript modules (content, src/lib) from Node scripts, with Node's
// built-in type stripping (Node >= 22.18). A small resolve hook adds the ".ts" extensions and the
// @content/ and @/ aliases, so a module may import "../deck" like the app does.
//   import { load } from './load-ts.mjs'
//   const { site } = await load('content/de/site.ts')
import { register } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const root = fileURLToPath(new URL('..', import.meta.url))

const hooks = `
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = ${JSON.stringify(root.replace(/\/$/, ''))}
export async function resolve(specifier, context, next) {
  let s = specifier
  if (s.startsWith('@content/')) s = pathToFileURL(root + '/content/' + s.slice(9)).href
  else if (s.startsWith('@/')) s = pathToFileURL(root + '/src/' + s.slice(2)).href
  if ((s.startsWith('.') || s.startsWith('file:')) && !/\\.[cm]?[jt]sx?$/.test(s) && context.parentURL) {
    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      const url = new URL(s + ext, context.parentURL)
      if (existsSync(fileURLToPath(url))) return next(url.href, context)
    }
  }
  return next(s, context)
}`
register(`data:text/javascript,${encodeURIComponent(hooks)}`, pathToFileURL(join(root, 'package.json')))

/** Imports a module by its path from the repository root, e.g. "content/de/site.ts". */
export const load = (path) => import(pathToFileURL(join(root, path)).href)
