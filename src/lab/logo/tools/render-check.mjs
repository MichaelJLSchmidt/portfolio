/*
 * Logo lab QA: renders every concept's variants to PNG at 16, 24, 32, 48 and
 * 256 px on a dark and a light ground, with the same tree and serializer as the
 * lab's downloads, and writes one contact sheet per concept (small sizes
 * enlarged, pixelated) plus the single PNGs.
 *
 *   node --import ./src/lab/logo/tools/ts-register.mjs src/lab/logo/tools/render-check.mjs <out-dir> [concept numbers…]
 *
 * Uses the Playwright that is installed with Chromium on the machine (not a
 * project dependency): PLAYWRIGHT_MODULE overrides where it is loaded from.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { concepts } from '../concepts/index.ts'
import { toSvgString } from '../svg-string.ts'
import { buildMark } from '../tree.ts'
import { fileStem } from '../model.ts'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? '/opt/node22/lib/node_modules/playwright')

const out = resolve(process.argv[2] ?? 'logo-qa')
const only = process.argv.slice(3).map((a) => a.toLowerCase())
mkdirSync(out, { recursive: true })

const themes = {
  dark: { bg: '#0E0F11', paints: { neutral: '#ECEAE4', accent: '#FF8A73', container: '#1A1C20' } },
  light: { bg: '#FFFFFF', paints: { neutral: '#0E0F11', accent: '#B8432F', container: '#ECEAE4' } },
}
const sizes = [16, 24, 32, 48, 256]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 })

for (const c of concepts.filter((c) => !only.length || only.includes(c.id))) {
  const rows = []
  for (const key of Object.keys(c.variants)) {
    for (const [theme, t] of Object.entries(themes)) {
      const paints = key === 'master' ? t.paints : { ...t.paints, accent: t.paints.neutral }
      rows.push({ key, theme, bg: t.bg, svg: toSvgString(buildMark(c, key), { paints }) })
    }
  }
  const html = `<!doctype html><body style="margin:0;padding:16px;background:#555;font:12px ui-monospace,monospace;color:#eee">
  <h3 style="margin:0 0 8px">${c.label} · ${c.name}</h3><div id="rows"></div></body>`
  await page.setContent(html)
  const files = await page.evaluate(
    async ({ rows, sizes }) => {
      const files = []
      const host = document.getElementById('rows')
      for (const r of rows) {
        const row = document.createElement('div')
        row.style.cssText = `display:flex;gap:14px;align-items:flex-end;margin:0 0 12px;padding:10px;background:${r.bg}`
        const label = document.createElement('div')
        label.textContent = `${r.key} / ${r.theme}`
        label.style.cssText = `width:110px;color:${r.theme === 'dark' ? '#aaa' : '#444'}`
        row.append(label)
        for (const size of sizes) {
          const svg = r.svg.replace('<svg ', `<svg width="${size}" height="${size}" `)
          const img = new Image()
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
          await img.decode()
          const cv = document.createElement('canvas')
          cv.width = cv.height = size
          const ctx = cv.getContext('2d')
          ctx.fillStyle = r.bg
          ctx.fillRect(0, 0, size, size)
          ctx.drawImage(img, 0, 0, size, size)
          files.push({ name: `${r.key}-${r.theme}-${size}.png`, data: cv.toDataURL('image/png') })
          const box = document.createElement('div')
          box.style.cssText = 'display:flex;flex-direction:column;gap:4px;align-items:center'
          if (size <= 48) {
            const big = document.createElement('canvas')
            big.width = big.height = size
            big.getContext('2d').drawImage(cv, 0, 0)
            const k = size === 16 ? 8 : size === 24 ? 6 : size === 32 ? 4 : 3
            big.style.cssText = `width:${size * k}px;height:${size * k}px;image-rendering:pixelated`
            box.append(big)
          }
          cv.style.cssText = `width:${size}px;height:${size}px`
          box.append(cv)
          row.append(box)
        }
        host.append(row)
      }
      return files
    },
    { rows, sizes },
  )
  const dir = join(out, fileStem(c))
  mkdirSync(dir, { recursive: true })
  for (const f of files) writeFileSync(join(dir, f.name), Buffer.from(f.data.split(',')[1], 'base64'))
  await page.screenshot({ path: join(out, `sheet-${fileStem(c)}.png`), fullPage: true })
  console.log(`${c.label} ${c.slug}: ${files.length} PNGs`)
}
await browser.close()
