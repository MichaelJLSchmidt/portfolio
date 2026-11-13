// Checks what the Content & Images session ships, against the real modules:
//   node scripts/images/check.mjs
// - the image registry: 13 photos, each with alt, photographer, photographerUrl
//   and pageUrl; every local rendition exists and the 2048 px JPEG matches the
//   recorded width and height
// - per locale (content/de, content/en): 3 case studies, 13 About projects (and
//   the count line agrees), 12 workshop methods, alt text for every image; every
//   image id the content names exists
// - the slim modules (content/<locale>/hand.ts, site.ts) import only types and
//   the text-free deck
// - no placeholder copy ("To be written.", TODO) and no deleted legacy file
// Loads content/*.ts with Node's built-in type stripping (scripts/load-ts.mjs: ".ts" extensions and
// the @content/ and @/ aliases). Counts and image references are checked in every locale.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load, root } from '../load-ts.mjs'

const { contents, images } = await load('content/index.ts')
const { default: sharp } = await import('sharp')

const failures = []
const check = (ok, message) => {
  if (!ok) failures.push(message)
}
const eq = (what, actual, expected) => check(actual === expected, `${what}: expected ${expected}, found ${actual}`)

// Content counts, per locale
const projectsWord = { de: 'Projekte', en: 'projects' }
for (const [locale, content] of Object.entries(contents)) {
  eq(`${locale} caseStudies`, content.caseStudies.length, 3)
  eq(`${locale} about.projects.items`, content.about.projects.items.length, 13)
  eq(`${locale} workshopMethods.methods`, content.workshopMethods.methods.length, 12)
  const years = content.about.projects.items.map((p) => Number(p.year))
  eq(
    `${locale} about.projects.intro`,
    content.about.projects.intro,
    `${content.about.projects.items.length} ${projectsWord[locale]} · ${Math.min(...years)}–${Math.max(...years)}`,
  )
}

// Image registry
const entries = Object.entries(images)
const photos = entries.filter(([, e]) => e.kind === 'photo')
eq('images', entries.length, 13)
eq('photos (kind "photo")', photos.length, 13)
for (const [id, e] of photos) {
  check(typeof e.alt === 'string' && e.alt.trim().length > 0, `${id}: alt is empty`)
  check(Boolean(e.photographer), `${id}: no photographer`)
  check(
    /^https:\/\/unsplash\.com\/@[\w.-]+$/.test(e.photographerUrl ?? ''),
    `${id}: photographerUrl "${e.photographerUrl}"`,
  )
  check(/^https:\/\/unsplash\.com\/photos\/[\w-]+$/.test(e.pageUrl ?? ''), `${id}: pageUrl "${e.pageUrl}"`)
  check(/^#[0-9A-F]{6}$/i.test(e.placeholder ?? ''), `${id}: placeholder "${e.placeholder}"`)
  check(Boolean(e.local || e.remote), `${id}: neither local nor remote`)
  if (e.local) {
    const ext = { avif: 'avif', webp: 'webp', jpeg: 'jpg' }
    for (const w of e.local.widths)
      for (const f of e.local.formats) {
        const file = join(root, 'public/images', `${id}-${w}.${ext[f]}`)
        check(existsSync(file), `${id}: missing ${file}`)
      }
    const largest = join(root, 'public/images', `${id}-${Math.max(...e.local.widths)}.jpg`)
    if (existsSync(largest)) {
      const m = await sharp(largest).metadata()
      check(
        m.width === e.width && m.height === e.height,
        `${id}: recorded ${e.width}×${e.height}, file ${m.width}×${m.height}`,
      )
    }
  }
}

// Every image id the content names exists
const named = []
const walk = (value, path) => {
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`))
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'image' || k === 'heroImage') && typeof v === 'string') named.push([path + '.' + k, v])
      walk(v, `${path}.${k}`)
    }
  else if (typeof value === 'string')
    check(!/To be written|\bTODO\b|\bTBD\b/.test(value), `${path}: placeholder copy "${value.slice(0, 60)}"`)
}
for (const [locale, content] of Object.entries(contents)) {
  walk(content, `content/${locale}`)
  for (const id of Object.keys(images))
    check(Boolean(content.imageAlt[id]?.trim()), `content/${locale}: no alt text for image "${id}"`)
}
for (const [path, id] of named) check(id in images, `${path}: unknown image "${id}"`)

// Slim modules import only types and the text-free deck (D7)
for (const file of Object.keys(contents).flatMap((l) => [`content/${l}/hand.ts`, `content/${l}/site.ts`])) {
  const imports = readFileSync(join(root, file), 'utf8').match(/^import .*$/gm) ?? []
  for (const line of imports)
    check(/^import type /.test(line) || /from '\.\.\/deck'$/.test(line), `${file} has a value import: ${line}`)
}

// Deleted legacy files stay deleted
for (const file of [
  'content/site.json',
  'content/case-studies.json',
  'content/projects.json',
  'content/workshops.json',
  'content/about.mdx',
  'content/management.mdx',
  'content/work',
  'content/adapters.ts',
  'content/cards.ts',
  'content/pages',
  'content/cases',
  'content/hand.ts',
  'content/site.ts',
  'src/lib/cards.ts',
  'public/topo',
  'scripts/topo',
  // public/terrain/ and src/components/background/terrain.ts are back since round 3 (R1: About's
  // heightmap, generated by scripts/terrain/build-field.py).
  'src/components/ambient-toggle.tsx',
  'src/components/ambient-toggle.module.css',
  'src/motion/scenes/pin.ts',
  'src/components/illustrations/contour-portrait.tsx',
  'src/components/illustrations/about-timeline.tsx',
  'src/motion/scenes/timeline-scene.ts',
  'src/components/calm-switch.tsx',
])
  check(!existsSync(join(root, file)), `${file} still exists`)

if (failures.length) {
  console.error(`check failed (${failures.length}):\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `ok: ${Object.keys(contents).join(' + ')}: 3 case studies, 13 About projects and 12 workshop methods each, ` +
    `${photos.length} photos with credits and alt text in every locale, ${named.length} image references, ` +
    `slim modules type-only (+ deck)`,
)
