// LCP element/time and INP-style interaction latency in Chromium with 4x CPU
// throttling and a slow-4G-like network (rough mid-range Android stand-in).
// Usage: node scripts/vitals.mjs <base-url>
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:3000', ...flags] = process.argv.slice(2)
const root = base.endsWith('/') ? base : `${base}/`

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Network.enable')
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
})
await context.addInitScript(() => {
  window.__lcp = null
  window.__events = []
  new PerformanceObserver((list) => {
    const last = list.getEntries().at(-1)
    window.__lcp = {
      time: last.startTime,
      element: last.element ? `${last.element.tagName.toLowerCase()}#${last.element.id}` : '?',
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true })
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (e.interactionId) window.__events.push({ name: e.name, duration: e.duration })
  }).observe({ type: 'event', durationThreshold: 16, buffered: true })
})

let failed = false
const report = (label, ok, detail) => {
  failed ||= !ok
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label} — ${detail}`)
}

await page.goto(root, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const lcp = await page.evaluate(() => window.__lcp)
report(
  'home LCP is the headline, ≤ 2000 ms',
  lcp?.element === 'h1#page-heading' && lcp.time <= 2000,
  `${Math.round(lcp?.time)} ms, ${lcp?.element}`,
)

// Interactions: settings switch, card tap → navigation, flip.
await page.getByRole('switch', { name: 'Foil effect' }).tap()
await page.getByRole('switch', { name: 'Foil effect' }).tap()
await page.locator('a[data-return-focus$="/work/front-door"]').tap()
await page.waitForURL(/work\/front-door/)
await page.waitForTimeout(1500)
await page.getByRole('button', { name: 'Show details' }).tap()
await page.waitForTimeout(800)
const events = await page.evaluate(() => window.__events)
const worst = Math.max(0, ...events.map((e) => e.duration))
report(
  'worst interaction latency ≤ 150 ms (INP proxy)',
  worst <= 150,
  `${Math.round(worst)} ms over ${events.length} events`,
)
await browser.close()
process.exit(failed ? 1 : 0)
