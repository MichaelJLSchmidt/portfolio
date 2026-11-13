// Builds the site's photos from scripts/images/manifest.mjs.
//
//   node scripts/images/fetch-and-build.mjs            download, render, write content/images.ts
//   node scripts/images/fetch-and-build.mjs --force    download again (ignore the cache)
//   node scripts/images/fetch-and-build.mjs --remote   no download: hotlinked entries only
//   node scripts/images/fetch-and-build.mjs --only a,b rebuild only these ids; every other
//                                                      entry keeps its files and measured size
//
// For each photo it downloads the Unsplash source at 2048 px
// (?auto=format&fit=crop&w=2048&q=80, cached in node_modules/.cache/images;
// a manifest `crop: [w, h]` adds &crop=entropy&h=… so a portrait source is
// cut to that ratio, e.g. 3:2 = 2048 × 1365), writes
// public/images/<id>-{640,1280,2048}.{avif,webp,jpg} (AVIF q50, WebP q72,
// JPEG q78 with mozjpeg), measures the largest rendition's width and height
// and the dominant colour, and regenerates content/images.ts. The
// placeholder is that colour clamped dark (luminance at most the ink glow's),
// so nothing flashes light on the dark site before an image decodes.
// Files in public/images/ that no manifest entry produces are removed.
//
// --remote is the fallback for an environment that cannot download: it
// writes hotlinked entries (images.unsplash.com, {w} = 640/1280/2048) with an
// assumed 2048 × 1365 until a local run measures the real size.
//
// Needs sharp (installed with Next.js as an optional dependency). Run from
// the repository root.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { photos } from './manifest.mjs'

const root = process.cwd()
const outDir = join(root, 'public/images')
const cacheDir = join(root, 'node_modules/.cache/images')
const registry = join(root, 'content/images.ts')

const widths = [640, 1280, 2048]
const formats = [
  { name: 'avif', ext: 'avif', options: { quality: 50, effort: 6 } },
  { name: 'webp', ext: 'webp', options: { quality: 72, effort: 6 } },
  { name: 'jpeg', ext: 'jpg', options: { quality: 78, mozjpeg: true, progressive: true } },
]

const argv = process.argv.slice(2)
const args = new Set(argv)
const remoteOnly = args.has('--remote')
const force = args.has('--force')
const onlyAt = argv.indexOf('--only')
const only = onlyAt >= 0 ? new Set((argv[onlyAt + 1] ?? '').split(',').filter(Boolean)) : null

if (!existsSync(join(root, 'content/schema.ts'))) {
  console.error('Run from the repository root: node scripts/images/fetch-and-build.mjs')
  process.exit(1)
}

const ids = new Set()
for (const p of photos) {
  if (ids.has(p.id)) throw new Error(`Duplicate image id "${p.id}" in manifest.mjs`)
  ids.add(p.id)
  for (const key of ['base', 'page', 'photographer', 'handle', 'alt']) {
    if (!p[key]) throw new Error(`"${p.id}" has no ${key} in manifest.mjs`)
  }
}

/** The source query: 2048 px wide; with a crop ratio, cut to it around the most detailed region. */
const cropQuery = (photo, w) => {
  if (!photo.crop) return `w=${w}`
  const [cw, ch] = photo.crop
  return `crop=entropy&w=${w}&h=${Math.round((w * ch) / cw)}`
}
const sourceUrl = (photo) => `${photo.base}?auto=format&fit=crop&${cropQuery(photo, 2048)}&q=80`
const remoteUrl = (photo) => `${photo.base}?auto=format&fit=crop&${cropQuery(photo, '{w}')}&q=75`

async function download(url, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'image/jpeg,image/*;q=0.8' } })
      const type = res.headers.get('content-type') ?? ''
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!type.startsWith('image/')) throw new Error(`unexpected content type "${type}"`)
      return Buffer.from(await res.arrayBuffer())
    } catch (error) {
      if (i >= attempts) throw new Error(`Download failed (${url}): ${error.message}`)
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i))
    }
  }
}

async function source(photo) {
  const file = join(cacheDir, `${photo.id}${photo.crop ? `-${photo.crop.join('x')}` : ''}.src`)
  if (!force && existsSync(file)) return readFileSync(file)
  const data = await download(sourceUrl(photo))
  mkdirSync(cacheDir, { recursive: true })
  writeFileSync(file, data)
  return data
}

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase()

/** Placeholders never exceed this relative luminance (the ink glow, #2A2D33, is about 0.026). */
const maxLuminance = 0.026
/** The darkest end of the clamp: the ink field. */
const inkField = { r: 0x0e, g: 0x0f, b: 0x11 }
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const luminance = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const mix = (a, b, t) => ({
  r: Math.round(a.r + (b.r - a.r) * t),
  g: Math.round(a.g + (b.g - a.g) * t),
  b: Math.round(a.b + (b.b - a.b) * t),
})
/** The colour mixed toward the ink field just enough to stay dark (unchanged when it already is). */
export function darkPlaceholder(colour) {
  if (luminance(colour) <= maxLuminance) return colour
  let lo = 0
  let hi = 1
  for (let i = 0; i < 20; i++) {
    const t = (lo + hi) / 2
    if (luminance(mix(colour, inkField, t)) > maxLuminance) lo = t
    else hi = t
  }
  return mix(colour, inkField, hi)
}
const fromHex = (h) => ({
  r: parseInt(h.slice(1, 3), 16),
  g: parseInt(h.slice(3, 5), 16),
  b: parseInt(h.slice(5, 7), 16),
})

async function build(sharp, photo) {
  const input = await source(photo)
  const written = []
  let largest = { width: 0, height: 0 }
  for (const w of widths) {
    for (const f of formats) {
      const file = join(outDir, `${photo.id}-${w}.${f.ext}`)
      const info = await sharp(input)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        [f.name](f.options)
        .toFile(file)
      written.push(file)
      if (info.width >= largest.width) largest = { width: info.width, height: info.height }
    }
  }
  const { dominant } = await sharp(input).rotate().stats()
  return { ...largest, placeholder: hex(darkPlaceholder(dominant)), written }
}

/** A TypeScript string literal in the repository's Prettier style. */
const str = (s) =>
  s.includes("'") && !s.includes('"') ? JSON.stringify(s) : `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

function entry(photo, measured) {
  const lines = [
    `  ${str(photo.id)}: {`,
    `    kind: 'photo',`,
    `    alt: ${str(photo.alt)},`,
    `    width: ${measured.width},`,
    `    height: ${measured.height},`,
    measured.local
      ? `    local: { widths: [${widths.join(', ')}], formats: [${formats.map((f) => `'${f.name}'`).join(', ')}] },`
      : `    remote: { src: ${str(remoteUrl(photo))}, widths: [${widths.join(', ')}] },`,
    ...(measured.placeholder ? [`    placeholder: '${measured.placeholder}',`] : []),
    `    photographer: ${str(photo.photographer)},`,
    `    photographerUrl: ${str(`https://unsplash.com/@${photo.handle}`)},`,
    `    pageUrl: ${str(photo.page)},`,
    `  },`,
  ]
  return lines.join('\n')
}

function writeRegistry(entries, mode) {
  const how =
    mode === 'local'
      ? ` * Local renditions: public/images/<id>-{${widths.join(',')}}.{avif,webp,jpg}; width, height and the
 * placeholder (dominant colour) are measured from the 2048 px rendition.`
      : ` * Hotlinked fallback (no download was possible): images.unsplash.com with {w} =
 * ${widths.join(' / ')}; every size is assumed 2048 × 1365 until a local run measures it.`
  const text = `/*
 * Image registry: every image the site shows, by id. <Picture id> reads it.
 * GENERATED by scripts/images/fetch-and-build.mjs from scripts/images/manifest.mjs:
 * change alt text, credits or the list there, then run
 * \`node scripts/images/fetch-and-build.mjs\` (do not edit this file by hand).
${how}
 * Every entry is a photo (kind "photo"): the About colophon credits and links
 * each one. Contract: docs/contracts.md#picture.
 */
import type { ImageEntry } from './schema'

export const images = {
${entries.join('\n')}
} satisfies Record<string, ImageEntry>

export type ImageId = keyof typeof images
`
  writeFileSync(registry, text)
  console.log(`wrote ${registry}`)
}

if (remoteOnly) {
  writeRegistry(
    photos.map((p) => entry(p, { width: 2048, height: 1365, local: false })),
    'remote',
  )
  process.exit(0)
}

/** --only: what the current registry measured for an entry that is not rebuilt (its files stay). */
function measuredBefore(id) {
  const text = existsSync(registry) ? readFileSync(registry, 'utf8') : ''
  const block = new RegExp(`'${id}': \\{([\\s\\S]*?)\\n  \\},`).exec(text)?.[1]
  const num = (key) => Number(new RegExp(`${key}: (\\d+)`).exec(block ?? '')?.[1])
  const placeholder = /placeholder: '(#[0-9A-F]{6})'/i.exec(block ?? '')?.[1]
  if (!block || !num('width') || !num('height') || !/local:/.test(block)) return null
  const written = widths.flatMap((w) => formats.map((f) => join(outDir, `${id}-${w}.${f.ext}`)))
  if (!written.every((f) => existsSync(f))) return null
  return {
    width: num('width'),
    height: num('height'),
    placeholder: placeholder && hex(darkPlaceholder(fromHex(placeholder))),
    written,
  }
}

const { default: sharp } = await import('sharp')
mkdirSync(outDir, { recursive: true })
const entries = []
const produced = new Set()
for (const photo of photos) {
  const kept = only && !only.has(photo.id) ? measuredBefore(photo.id) : null
  const measured = kept ?? (await build(sharp, photo))
  measured.written.forEach((f) => produced.add(f))
  entries.push(entry(photo, { ...measured, local: true }))
  console.log(`${photo.id}: ${measured.width} × ${measured.height}, ${measured.placeholder}${kept ? ' (kept)' : ''}`)
}

let bytes = 0
for (const name of readdirSync(outDir)) {
  const file = join(outDir, name)
  if (!produced.has(file)) {
    rmSync(file)
    console.log(`removed stale ${file}`)
  } else bytes += statSync(file).size
}
console.log(`${produced.size} files, ${(bytes / 1024 / 1024).toFixed(1)} MB in public/images`)
writeRegistry(entries, 'local')
