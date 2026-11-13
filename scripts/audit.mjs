// Accessibility audit with axe-core in Chromium (Playwright must be available).
// Usage: node scripts/audit.mjs <base-url> [--motion=full|reduced]
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const [base = 'http://localhost:3000', ...flags] = process.argv.slice(2)
const flag = (name) =>
  flags
    .find((f) => f.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
const motion = flag('motion') ?? 'full'
const paths = [
  '/',
  '/work/team-of-teams/',
  '/work/shared-foundations/',
  '/work/front-door/',
  '/about/',
  '/missing-page/',
]

const browser = await chromium.launch()
const context = await browser.newContext({ reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference' })
const page = await context.newPage()

let total = 0
for (const path of paths) {
  const url = new URL(path.replace(/^\//, ''), base.endsWith('/') ? base : `${base}/`).href
  await page.goto(url, { waitUntil: 'networkidle' })
  total += report(path, await runAxe(path))
}
await browser.close()
console.log(total === 0 ? `\nNo axe violations (motion: ${motion}).` : `\n${total} violation(s).`)
process.exit(total === 0 ? 0 : 1)

async function runAxe() {
  await page.addScriptTag({ content: axeSource })
  return page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    }),
  )
}

function report(path, result) {
  const { violations } = result
  console.log(`${violations.length === 0 ? 'ok  ' : 'FAIL'} ${path} (${result.passes.length} checks passed)`)
  for (const v of violations) {
    console.log(`     - ${v.id} [${v.impact}]: ${v.help}`)
    for (const n of v.nodes.slice(0, 3))
      console.log(`         ${n.target.join(' ')} :: ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`)
  }
  return violations.length
}
