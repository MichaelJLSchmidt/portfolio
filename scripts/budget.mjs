// JS budget for a page: gzip size of scripts referenced by the HTML (initial)
// and of every script fetched until the network is idle (incl. lazy chunks).
// Usage: node scripts/budget.mjs <url> [--max=170]
import { createRequire } from 'node:module'
import { gzipSync } from 'node:zlib'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [url, ...flags] = process.argv.slice(2)
const flag = (n) =>
  flags
    .find((f) => f.startsWith(`--${n}=`))
    ?.split('=')
    .slice(1)
    .join('=')
const max = Number(flag('max') ?? 170)

const browser = await chromium.launch()
const page = await browser.newPage()
const scripts = new Map()
page.on('response', async (res) => {
  if (res.request().resourceType() !== 'script') return
  try {
    scripts.set(res.url(), gzipSync(await res.body()).length)
  } catch {}
})
const response = await page.goto(url, { waitUntil: 'networkidle' })
const html = await response.text()
await page.waitForTimeout(1000)
// Scripts in the server HTML, minus noModule polyfills (never run by modern browsers).
const inHtml = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
  .filter(([tag]) => !/nomodule/i.test(tag))
  .map(([, src]) => new URL(src, url).href)
await browser.close()

const kb = (n) => (n / 1024).toFixed(1)
const initial = inHtml.reduce((sum, src) => sum + (scripts.get(src) ?? 0), 0)
const all = [...scripts.values()].reduce((a, b) => a + b, 0)
console.log(`initial JS (scripts in HTML): ${kb(initial)} KB gzip across ${inHtml.length} files`)
if (flags.includes('--list'))
  for (const [src, size] of scripts)
    console.log(`  ${kb(size).padStart(6)} KB  ${src.split('/').pop()}${inHtml.includes(src) ? '' : '  (lazy)'}`)
console.log(`all JS loaded by network idle: ${kb(all)} KB gzip across ${scripts.size} files`)
console.log(initial / 1024 <= max ? `ok   within ${max} KB` : `FAIL over ${max} KB`)
process.exit(initial / 1024 <= max ? 0 : 1)
