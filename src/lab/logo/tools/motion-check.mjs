/*
 * Logo lab QA: every moment ends exactly on the static mark, in every tier.
 * Opens each concept's detail view, switches the motion tier, presses each
 * animation button and, once the moment is over, compares the stage SVG with
 * its static state: markup and inline styles, each part's computed opacity,
 * transform, dash, stroke width, colours and path, and no running animations.
 * Colour is left out of the comparison for moments that change the identity
 * on purpose (recolour, concept 2's flip).
 *
 *   [BROWSER=webkit|firefox] node src/lab/logo/tools/motion-check.mjs http://localhost:4100/random/en/logo-lab/ [concept ids…]
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const playwright = require(process.env.PLAYWRIGHT_MODULE ?? '/opt/node22/lib/node_modules/playwright')
/** BROWSER=chromium (default) | webkit | firefox */
const engine = process.env.BROWSER ?? 'chromium'

const base = process.argv[2] ?? 'http://localhost:4100/random/en/logo-lab/'
const only = process.argv.slice(3).map((a) => a.toLowerCase())
const concepts = only.length ? only : ['3', '3b', '8', '8b', '8c', '8d']

const PROPS = [
  'opacity',
  'transform',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-width',
  'stroke',
  'fill',
  'd',
  'visibility',
]
const COLOUR = new Set(['stroke', 'fill'])

async function state(page) {
  return page.evaluate((PROPS) => {
    const svg = document.querySelector('.lab-stage svg')
    const parts = {}
    for (const el of svg.querySelectorAll('[data-part]')) {
      const cs = getComputedStyle(el)
      parts[el.getAttribute('data-part')] = Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)]))
    }
    const markup = svg.outerHTML.replace(/\s+/g, ' ')
    const running = svg.getAnimations({ subtree: true }).length
    const fx = svg.querySelectorAll('[data-fx]').length
    return { parts, markup, running, fx, root: getComputedStyle(svg).transform }
  }, PROPS)
}

function diff(a, b, ignoreColour) {
  const out = []
  if (a.root !== b.root) out.push(`svg transform ${a.root} → ${b.root}`)
  if (b.running) out.push(`${b.running} animations still running`)
  if (b.fx) out.push('effect layer left behind')
  const strip = (m) => (ignoreColour ? m.replace(/(stroke|fill)="[^"]*"/g, '') : m)
  if (strip(a.markup) !== strip(b.markup)) out.push('markup differs')
  for (const [part, props] of Object.entries(a.parts)) {
    for (const [k, v] of Object.entries(props)) {
      if (ignoreColour && COLOUR.has(k)) continue
      const w = b.parts[part]?.[k]
      if (v !== w) out.push(`${part}.${k}: ${v} → ${w}`)
    }
  }
  return out
}

const browser = await playwright[engine].launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

let failures = 0
const click = (name) => page.getByRole('button', { name, exact: true }).first().click()
const toggle = (name) => page.getByRole('checkbox', { name, exact: true }).first().click()

for (const n of concepts) {
  await page.goto(`${base}?c=${n}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600)
  const extraName = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.lab-actions .lab-button')].map((b) => b.textContent)
    return buttons[1]
  })
  for (const tier of ['Full', 'Calm', 'Reduced']) {
    await page.getByRole('radio', { name: new RegExp(`^${tier}`) }).check()
    await page.waitForTimeout(150)
    const moments = [
      ['Replay', () => click('Replay'), 1600, false],
      [extraName, () => click(extraName), 3200, false],
      ['Foil glint', () => click('Foil glint'), 1800, false],
      ['Identity recolour', () => click('Identity recolour'), 900, true],
      ['Hover', () => click('Hover'), 1400, false],
      [
        'Loading',
        async () => (await toggle('Loading'), await page.waitForTimeout(900), await toggle('Loading')),
        2200,
        false,
      ],
      ['Exit', () => click('Exit'), 1600, false],
    ]
    for (const [name, act, wait, ignoreColour] of moments) {
      const before = await state(page)
      // Sample mid-way, so a moment that does nothing in this tier is visible too.
      await act()
      await page.waitForTimeout(120)
      const mid = await state(page)
      await page.waitForTimeout(wait)
      const after = await state(page)
      const moved = diff(before, mid, true).length > 0
      const problems = diff(before, after, ignoreColour)
      const status = problems.length ? 'FAIL' : 'ok'
      if (problems.length) failures++
      console.log(
        `${n} ${tier.padEnd(8)} ${String(name).padEnd(24)} ${moved ? 'moves ' : 'static'} ${status}${problems.length ? '  ' + problems.slice(0, 4).join('; ') : ''}`,
      )
    }
  }
}
console.log(errors.length ? `page errors:\n${errors.join('\n')}` : 'no page errors')
console.log(`${engine}: ` + (failures ? `${failures} failure(s)` : 'all moments end on the static mark'))
await browser.close()
process.exit(failures ? 1 : 0)
