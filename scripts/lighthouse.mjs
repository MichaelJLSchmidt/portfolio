// Lighthouse (mobile preset: mid-range Android emulation, simulated slow 4G, 4x CPU).
// Usage: node scripts/lighthouse.mjs <base-url> [path ...]
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const [base = 'http://localhost:3000', ...rest] = process.argv.slice(2)
const paths = rest.filter((a) => !a.startsWith('--'))
const root = base.endsWith('/') ? base : `${base}/`
const outDir = process.env.LH_OUT ?? 'verify-output/lighthouse'
mkdirSync(outDir, { recursive: true })

const budgets = { lcp: 2000, cls: 0.05, tbt: 200 }
let failed = false
for (const path of paths.length ? paths : ['/']) {
  const url = new URL(path.replace(/^\//, ''), root).href
  const name = path.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home'
  const out = `${outDir}/${name}.json`
  const args = [
    'lighthouse',
    url,
    '--quiet',
    '--output=json',
    `--output-path=${out}`,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--chrome-flags=--headless=new --no-sandbox',
  ]
  const run = spawnSync('npx', args, {
    stdio: 'inherit',
    env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium' },
  })
  if (run.status !== 0) {
    failed = true
    continue
  }
  const lhr = JSON.parse(readFileSync(out, 'utf8'))
  const a = lhr.audits
  const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100)
  const lcp = a['largest-contentful-paint'].numericValue
  const cls = a['cumulative-layout-shift'].numericValue
  const tbt = a['total-blocking-time'].numericValue
  const lcpEl = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.selector ?? '?'
  const ok = lcp <= budgets.lcp && cls <= budgets.cls && tbt <= budgets.tbt
  failed ||= !ok
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${path}  perf ${score('performance')}  a11y ${score('accessibility')}  bp ${score('best-practices')}  seo ${score('seo')}` +
      `  | LCP ${Math.round(lcp)}ms (${lcpEl})  CLS ${cls.toFixed(3)}  TBT ${Math.round(tbt)}ms  FCP ${Math.round(a['first-contentful-paint'].numericValue)}ms`,
  )
}
process.exit(failed ? 1 : 0)
