// Quick behaviour check in Chromium at 1440x900 and 390x844 (light, not exhaustive).
// Usage: node scripts/smoke.mjs <locale-url> [--motion=full|reduced]
//   e.g. node scripts/smoke.mjs http://localhost:4100/random/de/ --motion=full
// Run it once per locale (de, en) and per tier (full; reduced = prefers-reduced-motion): the
// motion suite checks what each tier must (and must not) do; the locale suite checks the root's
// language choice, the 404 page and the switcher.
// Needs `npm run preview` (or any server for dist/ under its BASE_PATH).
// Card and page titles and the chrome's labels come from the locale's content modules (loaded
// with Node's type stripping, scripts/load-ts.mjs), so copy changes never break the checks.
import { createRequire } from 'node:module'
import { load } from './load-ts.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:4100/random/de/', ...flags] = process.argv.slice(2)
const motion = flags.find((f) => f.startsWith('--motion='))?.slice(9) ?? 'full'
const root = base.endsWith('/') ? base : `${base}/`
const locale = new URL(root).pathname.split('/').filter(Boolean).at(-1)
const { locales } = await load('src/lib/i18n.ts')
const { logoGradientNames } = await load('src/design/palette.ts')
if (!locales.includes(locale)) throw new Error(`The URL must end in a locale (${locales.join(', ')}): ${root}`)
const other = locales.find((l) => l !== locale)
const { hand } = await load(`content/${locale}/hand.ts`)
const { site } = await load(`content/${locale}/site.ts`)
const { notFound } = await load(`content/${locale}/pages/not-found.ts`)
const { about: aboutCopy } = await load(`content/${locale}/pages/about.ts`)
const cardTitle = (id) => hand.cards[id].title
const url = (path) => new URL(path.replace(/^\//, ''), root).href
/** The site root (the language choice), one level above the locale. */
const siteRoot = new URL('..', root).href
const basePath = new URL(root).pathname.replace(/\/$/, '')

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const wait = (page, ms) => page.waitForTimeout(ms)
const path = (page) => new URL(page.url()).pathname.slice(basePath.length).replace(/(.)\/$/, '$1') || '/'

const viewports = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
}

async function newContext(browser, device, { firstVisit = false } = {}) {
  const context = await browser.newContext({
    ...viewports[device],
    deviceScaleFactor: 1,
    reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
  })
  await context.addInitScript(
    ({ motion, firstVisit, locale }) => {
      try {
        if (!firstVisit) sessionStorage.setItem('table-drawn', '1')
        // The 404 page picks the stored language: keep it on the locale under test.
        localStorage.setItem('locale', locale)
      } catch {}
      // Record every view transition and its types.
      window.__vts = []
      const start = document.startViewTransition?.bind(document)
      if (start)
        document.startViewTransition = (arg) => {
          const t = start(arg)
          const rec = { types: arg?.types ? [...arg.types] : [], ok: null }
          window.__vts.push(rec)
          t.ready.then(
            () => (rec.ok = true),
            (e) => (rec.ok = String(e)),
          )
          return t
        }
    },
    { motion, firstVisit, locale },
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    // The deliberate 404 pages (an unknown address, the removed routes) log their own status.
    if (m.type() !== 'error' || /GPU stall|GL Driver/.test(m.text())) return
    if (m.text().includes('404') && /no-such-page|more-projects|contact/.test(m.location().url)) return
    errors.push(`${m.text()} (${m.location().url})`)
  })
  return { context, page, errors }
}

/**
 * Average colour of the background field in a screen region (decoded in the
 * page; works for the WebGL field). The page content and header are hidden
 * for the shot, so a hero image never lands in the sample (the sampled
 * regions stay clear of the hand).
 */
async function regionColour(page, clip) {
  await page
    .addStyleTag({ content: 'main, header, footer { visibility: hidden !important; }' })
    .then((tag) => tag.evaluate((el) => (el.id = 'smoke-field-only')))
  const png = (await page.screenshot({ clip })).toString('base64')
  await page.evaluate(() => document.getElementById('smoke-field-only')?.remove())
  return page.evaluate(async (data) => {
    const img = new Image()
    img.src = `data:image/png;base64,${data}`
    await img.decode()
    const c = new OffscreenCanvas(img.width, img.height)
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0)
    const px = g.getImageData(0, 0, img.width, img.height).data
    const sum = [0, 0, 0]
    for (let i = 0; i < px.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += px[i + k]
    const n = px.length / 4
    return sum.map((v) => Math.round(v / n))
  }, png)
}

const live = (page) => page.evaluate(() => document.querySelector('[role="status"]')?.textContent ?? '')
const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement
    return el
      ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.dataset?.play ? `[${el.dataset.play}]` : ''}`
      : ''
  })

// ---------------------------------------------------------------------------

async function introSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device, { firstVisit: true })
  await page.goto(url('/'), { waitUntil: 'commit' })
  // When does each part of the home sequence start? Read from the animations' own timing (start
  // time + delay on the document timeline, ms since the navigation), not from when a part crosses
  // an opacity threshold: parts with different curves cross it at different points, which made
  // the order check flaky. Each part's first animation counts (the items: their first item).
  const times = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const seen = {}
        const parts = {
          title: () => document.querySelector('[data-first-load] h1'),
          label: () => document.querySelector('.home-label'),
          lines: () => document.querySelector('.home-intro'),
          divider: () => document.querySelector('.home-bring-rule'),
          items: () => document.querySelector('.home-bring-list'),
          cards: () => document.querySelector('.hand-fan'),
          chrome: () => document.querySelector('[data-chrome]'),
        }
        const startOf = (el) => {
          const starts = el
            .getAnimations({ subtree: true })
            // The intro's own WAAPI animations (not CSS transitions or the hairline's scroll timeline).
            .filter((a) => a.constructor === Animation && a.timeline === document.timeline && a.startTime !== null)
            .map((a) => a.startTime + (Number(a.effect?.getTiming().delay) || 0))
          return starts.length ? Math.round(Math.min(...starts)) : undefined
        }
        const tick = () => {
          for (const [k, get] of Object.entries(parts)) {
            const el = get()
            if (seen[k] === undefined && el) seen[k] = startOf(el)
          }
          const done = Object.keys(parts).every((k) => seen[k] !== undefined)
          if (done || performance.now() > 6000) resolve(seen)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
  )
  const keys = ['title', 'label', 'lines', 'divider', 'items', 'cards', 'chrome']
  const order = keys.map((k) => `${k} ${times[k] ?? '-'}ms`).join(', ')
  if (motion === 'reduced') {
    // Reduced: everything at once; check the end state.
    await page.waitForFunction(() => document.documentElement.dataset.intro === undefined, null, { timeout: 4000 })
    const shown = await page.evaluate(() =>
      [
        '[data-first-load] h1',
        '.home-label',
        '.home-intro',
        '.home-bring-list',
        '.hand-fan .hand-card',
        '[data-chrome]',
      ]
        .map((sel) => {
          let o = 1
          for (let e = document.querySelector(sel); e && e.nodeType === 1; e = e.parentElement)
            o *= Number(getComputedStyle(e).opacity)
          return o
        })
        .every((o) => o > 0.99),
    )
    check('home first visit: everything shows (reduced)', shown, order)
  } else {
    // Name, label, role and intro, divider, items, then the hand, then the chrome.
    const inOrder = keys.every(
      (k, i) => k in times && times[k] !== undefined && (i === 0 || times[keys[i - 1]] <= times[k]),
    )
    check(`home first visit (${motion}): name, label, lines, divider, items, hand, chrome`, inOrder, order)
    const span = times.chrome - times.title
    check(`home first visit: about 2 s`, span > 1500 && span < 2700, `${span}ms`)
  }
  await wait(page, 1600)
  check(
    'intro done: data-intro cleared',
    (await page.evaluate(() => document.documentElement.dataset.intro)) === undefined,
  )
  check('field renderer is WebGL', (await page.evaluate(() => document.querySelector('.field')?.dataset.mode)) === 'gl')
  check('no page errors (intro)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

async function tableSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device)
  const sky =
    device === 'desktop' ? { x: 1000, y: 120, width: 400, height: 260 } : { x: 220, y: 560, width: 150, height: 120 }
  await page.goto(url('/'), { waitUntil: 'networkidle' })
  await wait(page, 1200)
  const handNav = `nav[aria-label="${hand.labels.nav}"]`
  check(
    `hand: four card links in nav "${hand.labels.nav}"`,
    (await page.locator(`${handNav} a.hand-card`).count()) === 4,
  )
  check('hand: no face-down deck', (await page.locator('.hand-deck').count()) === 0)
  check('home: no card counter', (await page.locator('.hand-counter').count()) === 0)
  check('hand: one tab stop', (await page.locator(`${handNav} [data-roving][tabindex="0"]`).count()) === 1)
  const screen = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    vh: innerHeight,
    footer: document.querySelectorAll('footer').length,
    hint: document.querySelector('.home-hint')?.getBoundingClientRect().bottom ?? 0,
    hand: Math.min(...[...document.querySelectorAll('.hand-fan .hand-card')].map((c) => c.getBoundingClientRect().top)),
  }))
  check(
    'home: one screen, no scroll, no footer',
    screen.height <= screen.vh && screen.footer === 0,
    JSON.stringify(screen),
  )
  check('home: content clears the hand', screen.hint <= screen.hand, JSON.stringify(screen))
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('header a:not([data-locale-switcher] a)')].map((a) => a.textContent.trim()),
  )
  check(
    `header: home slot and ${site.header.about} only (plus the language switcher)`,
    links.length === 2 && links.includes(site.header.about),
    links.join(' | '),
  )
  // R2: no pause / play button; the background follows prefers-reduced-motion and the tab's
  // visibility only.
  const fieldFrames = (ms) =>
    page.evaluate(
      (ms) =>
        new Promise((resolve) => {
          const gl = document.querySelector('.field-canvas').getContext('webgl2')
          let n = 0
          const draw = gl.drawArrays.bind(gl)
          gl.drawArrays = (...a) => (n++, draw(...a))
          setTimeout(() => {
            gl.drawArrays = draw
            resolve(n)
          }, ms)
        }),
      ms,
    )
  const header = await page.evaluate(() => ({
    toggle: document.querySelectorAll('header button, [data-ambient-toggle]').length,
    ambient: document.documentElement.dataset.ambient ?? null,
  }))
  check('header: no pause / play button', header.toggle === 0 && header.ambient === null, JSON.stringify(header))
  // T2: every load picks one of the logo's gradients, never the one the load before showed; the
  // front card is painted with it, and its colours flow only in the full tier.
  const gradients = []
  for (let i = 0; i < 4; i++) {
    if (i) await page.reload({ waitUntil: 'networkidle' })
    gradients.push(
      await page.evaluate(() => {
        const stop = document.querySelector('header [data-logo-stop="1"]')
        return {
          name: document.documentElement.dataset.logoGradient,
          flowing: stop.getAnimations().length > 0,
          paint: document.querySelector('header [data-logo-part] rect[fill^="url("]') !== null,
        }
      }),
    )
  }
  check(
    'logo: a gradient per load, never the last one; flowing in the full tier only',
    gradients.every(
      (g, i) =>
        logoGradientNames.includes(g.name) &&
        g.paint &&
        g.flowing === (motion === 'full') &&
        (i === 0 || g.name !== gradients[i - 1].name),
    ),
    JSON.stringify(gradients),
  )
  if (motion === 'full') {
    const frames = await fieldFrames(1000)
    check('field: the resting field breathes (frames at rest on home)', frames > 5, String(frames))
  }

  // Hover colour blend (fine pointers).
  if (device === 'desktop' && motion !== 'reduced') {
    const before = await regionColour(page, sky)
    await page.hover('.hand-card[data-play="front-door"]', { position: { x: 60, y: 30 } })
    await wait(page, 1000)
    const after = await regionColour(page, sky)
    check(
      'hover: field blends toward the card colour (grove)',
      after[1] - before[1] > 2 && after[1] > after[0],
      `${before} -> ${after}`,
    )
    await page.mouse.move(700, 300)
    await wait(page, 1300)
  }

  // Play.
  const playCard = device === 'phone' ? page.tap.bind(page) : page.click.bind(page)
  await playCard('.hand-fan .hand-card[data-play="team-of-teams"]')
  await page.waitForURL(/team-of-teams/, { timeout: 4000 })
  await wait(page, 1400)
  let vts = await page.evaluate(() => window.__vts)
  check(
    'play: navigates with a "play" view transition',
    vts.at(-1)?.types.includes('play') && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
  check('play: H1 focused', (await focused(page)) === 'h1#page-heading')
  const rest = await page.evaluate(() => ({
    clone: document.querySelectorAll('.table-card').length,
    frame: Number(getComputedStyle(document.querySelector('.play-frame') ?? document.body).opacity),
    scrollY: Math.round(scrollY),
    status: document.querySelector('.play-status')?.textContent ?? '',
  }))
  check(
    'play: the clone is gone, the frame has dissolved, the page is at its top, no status line',
    rest.clone === 0 && (rest.frame === 0 || motion === 'reduced') && rest.scrollY === 0 && rest.status === '',
    JSON.stringify(rest),
  )
  check(
    'play: the home slot shows Back',
    (await page.locator('header [data-slot-mode="back"]').count()) === 1 &&
      (await page.locator('header [data-slot-mode="back"]').textContent()).includes(site.header.back),
  )
  check('play: title announced', (await live(page)).includes(cardTitle('team-of-teams')))
  check(
    'play: ghost in the open slot',
    (await page.locator('.hand-card[data-play="team-of-teams"] .hand-ghost').count()) === 1,
  )
  const ember = await regionColour(page, sky)
  check('play: field is the card colour (ember)', ember[0] > ember[1] + 10 && ember[0] > ember[2] + 10, `${ember}`)

  // Switch (desktop: from the hand; phone: one tap on the rail, no sheet).
  if (device === 'phone') {
    const rail = await page.evaluate(() => {
      const nav = document.querySelector('nav.hand-rail')
      return {
        nav: nav?.getAttribute('aria-label'),
        links: [...(nav?.querySelectorAll('a.rail-card[data-play]') ?? [])].map((a) => {
          const r = a.getBoundingClientRect()
          return { h: Math.round(r.height), w: Math.round(r.width), touch: getComputedStyle(a).touchAction }
        }),
        current: nav?.querySelector('[aria-current="page"]')?.dataset.play,
        popovers: document.querySelectorAll('[popover], #hand-sheet').length,
      }
    })
    check(
      'phone: the rail is a nav of four links, 48 px tall, a quarter wide each, no popover',
      rail.nav === hand.labels.nav &&
        rail.links.length === 4 &&
        rail.links.every((l) => l.h >= 44 && l.w >= 80 && l.touch === 'manipulation') &&
        rail.current === 'team-of-teams' &&
        rail.popovers === 0,
      JSON.stringify(rail),
    )
    await page.tap('.rail-card[data-play="front-door"]')
  } else await page.click('.hand-card[data-play="front-door"]')
  await page.waitForURL(/front-door/, { timeout: 4000 })
  await wait(page, 1400)
  vts = await page.evaluate(() => window.__vts)
  check(
    'switch: "switch" view transition',
    vts.at(-1)?.types.includes('switch') && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
  check('switch: H1 focused', (await focused(page)) === 'h1#page-heading')
  if (device === 'phone') {
    check('phone: one tap on the rail played the card', path(page).includes('front-door'))
    // The open card's edge: a tap scrolls its page to the top and goes nowhere.
    await page.evaluate(() => scrollTo(0, 1200))
    await wait(page, 300)
    await page.evaluate(() => scrollBy(0, -60))
    await wait(page, 500)
    await page.tap('.rail-card[aria-current="page"]')
    await wait(page, 1200)
    check(
      'phone: the open card on the rail scrolls to the top, no navigation',
      path(page).includes('front-door') && (await page.evaluate(() => scrollY)) < 4,
    )
  }
  const grove = await regionColour(page, sky)
  check('switch: field crossfaded to grove', grove[1] > grove[0] && grove[1] > grove[2], `${grove}`)

  // Return with Escape.
  await page.keyboard.press('Escape')
  await page.waitForURL((u) => path({ url: () => u.href }) === '/', { timeout: 4000 })
  await wait(page, 2400)
  vts = await page.evaluate(() => window.__vts)
  check('return: "return" view transition', vts.at(-1)?.types.includes('return'), JSON.stringify(vts.at(-1)))
  check('return: focus back on the card', (await focused(page)) === 'a[front-door]', await focused(page))
  check('return: the home slot shows the logo', (await page.locator('header [data-slot-mode="mark"]').count()) === 1)
  // Focus on the returned card blends the field like a hover; move it away first.
  await page.evaluate(() => document.activeElement?.blur())
  if (device === 'desktop') await page.mouse.move(700, 200)
  await wait(page, 1400)
  const ink = await regionColour(page, sky)
  check('return: field back to ink', Math.max(...ink) - Math.min(...ink) < 14 && Math.max(...ink) < 60, `${ink}`)

  // Browser back (no transition type): to the card page and home again.
  await page.goBack()
  await page.waitForURL(/front-door/, { timeout: 4000 })
  await wait(page, 1500)
  check('browser back: page and H1 shown', await page.locator('h1').isVisible())
  vts = await page.evaluate(() => window.__vts)
  check(
    'browser back: a view transition with no type (the default shared morph)',
    vts.at(-1)?.types.length === 0 && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
  const back = await regionColour(page, sky)
  check('browser back: field follows the route (grove)', back[1] > back[0], `${back}`)
  await page.goBack()
  await page.waitForURL(/team-of-teams/, { timeout: 4000 })
  await wait(page, 1500)
  const back2 = await regionColour(page, sky)
  check(
    'browser back again: previous card page in its colour (ember)',
    back2[0] > back2[1] && back2[0] > back2[2],
    `${back2}`,
  )
  vts = await page.evaluate(() => window.__vts)
  check(
    'browser back again: a view transition with no type (the default shared morph)',
    vts.at(-1)?.types.length === 0 && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
  await page.goForward()
  await page.waitForURL(/front-door/, { timeout: 4000 })
  await wait(page, 1200)
  check('browser forward still works after the replay', await page.locator('h1').isVisible())

  // N1: on a case study the header leaves on a deliberate scroll down and returns on a scroll up;
  // the mobile rail goes with it. Full: translate; reduced: a crossfade.
  await page.goto(url('/work/shared-foundations/'), { waitUntil: 'networkidle' })
  await wait(page, 800)
  if (device === 'phone') check('phone: peek rail visible off home', await page.locator('.hand-rail').isVisible())
  const chrome = () =>
    page.evaluate(() => {
      const header = document.querySelector('header')
      const rail = document.querySelector('.hand-rail')
      const shown = (el) => {
        if (!el || !el.getClientRects().length) return null
        const r = el.getBoundingClientRect()
        // The header fades its children (reduced; read on the tray, since Back never fades), the rail itself.
        const o = Math.min(
          Number(getComputedStyle(el).opacity),
          Number(getComputedStyle(el.querySelector(':scope > div') ?? el).opacity),
        )
        return r.bottom > 1 && r.top < innerHeight - 1 && o > 0.5
      }
      // T5: Back stays where it was, opaque and clickable, whatever the header does.
      const slot = header.querySelector('a[data-slot-mode="back"]')
      const back = (() => {
        if (!slot) return null
        const r = slot.getBoundingClientRect()
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a') === slot
        return { top: Math.round(r.top), opacity: Number(getComputedStyle(slot).opacity), hit }
      })()
      return {
        attr: document.documentElement.dataset.header ?? null,
        header: shown(header),
        rail: shown(rail),
        back,
        hairline: Math.round(document.querySelector('[data-reading-hairline]').getBoundingClientRect().top),
      }
    })
  await page.evaluate(() => scrollBy(0, 4))
  await wait(page, 400)
  const nearTop = await chrome()
  await page.evaluate(() => scrollBy(0, 900))
  await wait(page, 100)
  await page.evaluate(() => scrollBy(0, 40))
  await wait(page, 600)
  const down = await chrome()
  await page.evaluate(() => scrollBy(0, -5))
  await wait(page, 400)
  const nudge = await chrome()
  await page.evaluate(() => scrollBy(0, -30))
  await wait(page, 600)
  const up = await chrome()
  check(
    'header: stays near the top, leaves on a scroll down (hairline at the top edge), ignores 5 px, returns on a scroll up',
    nearTop.header &&
      down.attr === 'hidden' &&
      !down.header &&
      down.hairline === 0 &&
      nudge.attr === 'hidden' &&
      up.attr === null &&
      up.header,
    JSON.stringify({ nearTop, down, nudge, up }),
  )
  check(
    'header: Back stays in place, opaque and clickable while the header is away',
    [nearTop, down, up].every((st) => st.back && st.back.opacity === 1 && st.back.hit) &&
      down.back.top === nearTop.back.top &&
      up.back.top === nearTop.back.top,
    JSON.stringify({ nearTop: nearTop.back, down: down.back, up: up.back }),
  )
  if (device === 'phone')
    check(
      'phone: the rail hides and returns with the header',
      down.rail === false && up.rail === true,
      JSON.stringify({ down, up }),
    )
  await page.evaluate(() => scrollBy(0, 900))
  await wait(page, 100)
  await page.evaluate(() => scrollBy(0, 40))
  await wait(page, 600)
  await page.evaluate(() => document.querySelector('header a').focus())
  await wait(page, 400)
  check('header: shown when focus moves into it', (await chrome()).header === true)

  // About's morph (round 3): from home the canvas renders at the device's resolution only while the
  // shader morphs, then the SVG takes over (canvas covered, buffer back at rest); leaving uncovers
  // the canvas, the SVG fades and the field returns at its resting resolution. Reduced: the SVG
  // only crossfades; the buffer never grows.
  {
    await page.goto(url('/'), { waitUntil: 'networkidle' })
    await wait(page, 2600)
    const buffer = () =>
      page.evaluate(() => {
        const f = document.querySelector('.field')
        return {
          w: document.querySelector('.field-canvas').width,
          c: f.dataset.contours ?? '',
          cov: f.hasAttribute('data-canvas-covered'),
        }
      })
    const rest = await buffer()
    const link = page.locator('header a[href$="/about/"]').first()
    await link.hover()
    await link.click()
    let peak = 0
    let end = rest
    for (let i = 0; i < 60; i++) {
      end = await buffer()
      peak = Math.max(peak, end.w)
      if (end.c === 'shown') break
      await wait(page, 100)
    }
    const wide =
      motion === 'full' &&
      (await page.evaluate(() => Boolean(document.querySelector('.field-canvas').getContext('webgl2'))))
    check(
      `about morph in: ${wide ? 'full resolution while it runs, then' : 'no larger buffer,'} the SVG covers the canvas`,
      end.c === 'shown' && end.cov && end.w === rest.w && (wide ? peak > rest.w : peak === rest.w),
      JSON.stringify({ rest, peak, end }),
    )
    await page.locator('header a[data-slot-mode]').first().click()
    let back = await buffer()
    for (let i = 0; i < 80 && back.c !== 'off'; i++) {
      await wait(page, 100)
      back = await buffer()
    }
    check(
      'about morph out: the field returns at its resting resolution',
      back.c === 'off' && !back.cov && back.w === rest.w,
      JSON.stringify(back),
    )
  }

  // About (B1, round 3): the old password page's contour SVG as an <img> over the ground (opacity
  // only), the vignette a static overlay; the canvas is covered and draws nothing at rest; the SVG
  // drifts by translate (full tier only); nothing reacts to the pointer.
  await page.goto(url('/about/'), { waitUntil: 'networkidle' })
  await wait(page, 1500)
  const topo = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const field = document.querySelector('.field')
        const layer = document.querySelector('.contour-bg')
        const img = document.querySelector('.contour-bg__img')
        const vignette = document.querySelector('.contour-vignette')
        const gl = document.querySelector('.field-canvas').getContext('webgl2')
        let frames = 0
        const draw = gl.drawArrays.bind(gl)
        gl.drawArrays = (...a) => (frames++, draw(...a))
        setTimeout(() => {
          gl.drawArrays = draw
          const cs = getComputedStyle(img)
          resolve({
            contours: field.dataset.contours,
            covered: field.hasAttribute('data-canvas-covered'),
            shown: getComputedStyle(layer).display === 'block' && getComputedStyle(layer).opacity === '1',
            vignette: getComputedStyle(vignette).opacity,
            svg: img.currentSrc,
            opacity: cs.opacity,
            fit: cs.objectFit,
            scale: cs.transform,
            drift: img.getAnimations().map((a) => a.playState),
            mask: getComputedStyle(layer).maskImage,
            frames,
            attribution: document.querySelector('footer')?.textContent ?? '',
            credit: document.querySelector(`footer a[href*="swisstopo.admin.ch"]`)?.textContent ?? '',
          })
        }, 1500)
      }),
  )
  check(
    'about: the contour SVG layer (base path, cover, 42%, scale 1.03, no mask), vignette shown',
    topo.contours === 'shown' &&
      topo.covered &&
      topo.shown &&
      topo.vignette === '1' &&
      topo.svg.includes(`${basePath.replace(/\/[^/]+$/, '')}/contour-bg/contours`) &&
      topo.opacity === '0.42' &&
      topo.fit === 'cover' &&
      /matrix\(1\.03, 0, 0, 1\.03/.test(topo.scale) &&
      topo.mask === 'none',
    JSON.stringify({ ...topo, attribution: 0 }),
  )
  check('about: no frames at rest', topo.frames === 0, String(topo.frames))
  check(
    `about: drift ${motion === 'full' ? 'runs' : 'off (reduced)'}`,
    motion === 'full' ? topo.drift.join() === 'running' : topo.drift.length === 0,
    topo.drift.join(),
  )
  // The contours are on screen: the old ground #1B1C18 with stone-grey lines.
  const region =
    device === 'desktop' ? { x: 900, y: 300, width: 300, height: 200 } : { x: 40, y: 300, width: 300, height: 200 }
  const ground = await regionColour(page, region)
  check(
    'about: the contour field is drawn (ground and lines)',
    ground.every((v, i) => Math.abs(v - [31, 32, 28][i]) < 10),
    `${ground}`,
  )
  if (device === 'desktop') {
    // No headlamp: the pointer changes nothing (the drift is held still for the comparison).
    await page.addStyleTag({ content: 'main, header, footer, .hand { visibility: hidden !important; }' })
    await page.evaluate(() =>
      document
        .querySelector('.contour-bg__img')
        .getAnimations()
        .forEach((a) => a.pause()),
    )
    const before = await page.screenshot({ clip: region })
    await page.mouse.move(region.x + 100, region.y + 80)
    await page.mouse.move(region.x + 160, region.y + 120, { steps: 5 })
    await wait(page, 300)
    const after = await page.screenshot({ clip: region })
    check('about: the background does not react to the pointer', before.equals(after))
    await page.reload({ waitUntil: 'networkidle' })
    await wait(page, 800)
  }
  check(
    `about: "${aboutCopy.topo.attribution}" credit links to swisstopo in the footer`,
    topo.credit.includes(aboutCopy.topo.attribution) && topo.attribution.includes(aboutCopy.topo.label),
    topo.credit,
  )
  // R7, A3: the two-lane timeline (one chronological list, seven stops with their lane as text and
  // <time> years, one across both lanes, the latest marked, only the Master's card a link: to the
  // thesis), four How I work cards; all shown once scrolled through; nothing wider than the screen.
  for (let y = 0; y < 5000; y += 300) {
    await page.mouse.wheel(0, 300)
    await wait(page, 60)
  }
  await page.evaluate(() => document.getElementById('howIWork').scrollIntoView())
  await wait(page, 1800)
  const cards = await page.evaluate(() => {
    const stops = [...document.querySelectorAll('#timeline ol.career-stops > li')]
    const all = [...stops, ...document.querySelectorAll('.how-card')]
    const links = [...document.querySelectorAll('#timeline a, #howIWork :is(a, button, [tabindex])')]
    return {
      label: document.querySelector('#timeline ol.career-stops')?.getAttribute('aria-label') ?? '',
      career: stops.length,
      lanes: stops.map((li) => li.dataset.lane).join(','),
      laneText: stops.every((li) => li.querySelector('.sr-only')?.textContent.trim().endsWith(':')),
      times: stops.every((li) => li.querySelector('time[datetime]')),
      latest: document.querySelectorAll('#timeline [data-latest]').length,
      how: document.querySelectorAll('.how-card').length,
      hidden: all.filter((c) => Number(getComputedStyle(c).opacity) < 0.99).length,
      links: links.map((a) => a.getAttribute('href')),
      portrait: Boolean(document.querySelector('.about-portrait img[src*="about-portrait"]')),
      wide: document.documentElement.scrollWidth > innerWidth,
    }
  })
  check(
    'about: the two-lane timeline (7 stops, lanes as text, <time>, one shared card, latest marked, the thesis link only), 4 How I work cards, all shown; the portrait photo',
    cards.career === 7 &&
      cards.label.length > 0 &&
      cards.lanes === 'both,work,education,work,work,work,education' &&
      cards.laneText &&
      cards.times &&
      cards.latest === 1 &&
      cards.how === 4 &&
      cards.hidden === 0 &&
      cards.links.length === 1 &&
      /\/about\/thesis\/$/.test(cards.links[0]) &&
      cards.portrait &&
      !cards.wide,
    JSON.stringify(cards),
  )
  const about = await page.evaluate(() => ({
    projects: document.querySelectorAll('#projects .project').length,
    interactive: document.querySelectorAll('#projects .project :is(a, button, [tabindex])').length,
    thesis: [...document.querySelectorAll('#projects a')].map((a) => a.getAttribute('href')),
    contact: Boolean(document.querySelector('#contact a[href^="mailto:"]')),
  }))
  check(
    'about: 13 projects (rows not interactive), one link to the thesis below them, contact chapter',
    about.projects === 13 &&
      about.interactive === 0 &&
      about.thesis.length === 1 &&
      /\/about\/thesis\/$/.test(about.thesis[0]) &&
      about.contact,
    JSON.stringify(about),
  )

  // R8: the master's thesis overview: glacier table field (not the contour map), the case-study
  // template (hero, the answer, five meta pairs, four values, chapters 01–08 with drawn numerals,
  // five drawings, three marked screenshot slots, four insight cards), the way back to the timeline.
  await page.goto(url('/about/thesis/'), { waitUntil: 'networkidle' })
  await wait(page, 1200)
  const thesis = await page.evaluate(() => ({
    h1: document.querySelectorAll('h1').length,
    field: document.documentElement.dataset.field ?? null,
    map: document.querySelector('.field')?.dataset.contours ?? 'none',
    meta: document.querySelectorAll('.meta-pair').length,
    values: document.querySelectorAll('.scoreboard-item').length,
    chapters: document.querySelectorAll('.thesis-page [data-section]').length,
    numerals: document.querySelectorAll('.thesis-page svg.chapter-numeral').length,
    drawings: document.querySelectorAll('.thesis-figure svg.illustration[role="img"]').length,
    slots: document.querySelectorAll('.image-slot').length,
    insights: document.querySelectorAll('.thesis-insights [data-deal-item]').length,
    back: document.querySelector('.thesis-back a')?.getAttribute('href') ?? '',
    wide: document.documentElement.scrollWidth > innerWidth,
  }))
  check(
    'thesis: glacier field, hero, 5 meta pairs, 4 values, chapters 01–08 with drawn numerals, 5 drawings, 3 slots, 4 insights, back to the timeline',
    thesis.h1 === 1 &&
      thesis.field === 'glacier' &&
      thesis.map !== 'shown' &&
      thesis.meta === 5 &&
      thesis.values === 4 &&
      thesis.chapters === 8 &&
      thesis.numerals === 8 &&
      thesis.drawings === 5 &&
      thesis.slots === 3 &&
      thesis.insights === 4 &&
      /\/about\/#timeline$/.test(thesis.back) &&
      !thesis.wide,
    JSON.stringify(thesis),
  )

  // Removed routes are gone (the 404 page answers).
  for (const gone of ['/more-projects/', '/contact/']) {
    await page.goto(url(gone), { waitUntil: 'networkidle' })
    check(`${gone} removed`, (await page.locator('h1').textContent()).includes(notFound.title))
  }

  // Pages and reveals: nothing in the first viewport stays hidden.
  for (const p of ['/', '/work/front-door/', '/management/', '/about/', '/no-such-page/']) {
    await page.goto(url(p), { waitUntil: 'networkidle' })
    await wait(page, 2400)
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('main [data-reveal]')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.top < innerHeight * 0.6 && r.bottom > 0 && r.width > 0 && Number(getComputedStyle(el).opacity) < 0.99
        })
        .map((el) => el.dataset.reveal),
    )
    check(`reveal ${p}: first viewport revealed`, hidden.length === 0, hidden.join(','))
  }
  check(`404: "${notFound.title}"`, (await page.locator('h1').textContent()).includes(notFound.title))

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

/**
 * Locales: the root picks the language (a stored choice, then navigator.languages; other languages
 * English, none German) and replaces the URL; without JavaScript it links both. The 404 page picks
 * the same way at the unknown address. Every page carries <html lang> and hreflang alternates. The
 * switcher (DE / EN, the active one on a chip) opens the same page in the other language: a "locale" cross-fade (never a
 * card transition, never the home intro), the field and the motion tier untouched, the reading
 * position and the switcher's focus kept, the choice stored; 44 px targets on phones.
 */
async function localeSuite(browser, device) {
  const target = (path) => new URL(path).pathname.slice(new URL(siteRoot).pathname.length)
  async function choose({ lang, languages, stored }) {
    const context = await browser.newContext({ ...viewports[device], ...(lang ? { locale: lang } : {}) })
    await context.addInitScript(
      ({ languages, stored }) => {
        if (languages) Object.defineProperty(navigator, 'languages', { get: () => languages })
        if (stored) localStorage.setItem('locale', stored)
      },
      { languages, stored },
    )
    const page = await context.newPage()
    await page.goto(siteRoot, { waitUntil: 'networkidle' })
    const landed = target(page.url())
    await context.close()
    return landed
  }
  const cases = [
    ['browser de-CH', { lang: 'de-CH' }, 'de/'],
    ['browser en-US', { lang: 'en-US' }, 'en/'],
    ['browser fr-FR', { lang: 'fr-FR' }, 'en/'],
    ['no browser language', { lang: 'en-US', languages: [] }, 'de/'],
    ['stored en over de-CH', { lang: 'de-CH', stored: 'en' }, 'en/'],
    ['stored de over en-US', { lang: 'en-US', stored: 'de' }, 'de/'],
  ]
  for (const [name, opts, want] of cases) {
    const got = await choose(opts)
    check(`root: ${name} opens /${want}`, got === want, got)
  }
  {
    const context = await browser.newContext({ ...viewports[device], javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(siteRoot)
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[hreflang]')].map((a) => a.getAttribute('href')),
    )
    check(
      'root without JavaScript: plain links to both languages',
      locales.every((l) => hrefs.some((h) => h.endsWith(`/${l}/`))),
      hrefs.join(' '),
    )
    await context.close()
  }
  // 404: an address without a locale speaks the browser's (or stored) language; one with /de/ or
  // /en/ speaks that, whatever the browser says (F1).
  for (const [lang, path, want] of [
    ['de-CH', 'no-such-page/', 'de'],
    ['en-US', 'no-such-page/', 'en'],
    ['de-CH', 'en/no-such-page/', 'en'],
    ['en-US', 'de/no-such-page/', 'de'],
  ]) {
    const context = await browser.newContext({ ...viewports[device], locale: lang })
    const page = await context.newPage()
    await page.goto(new URL(path, siteRoot).href, { waitUntil: 'networkidle' })
    const { notFound: lost } = await load(`content/${want}/pages/not-found.ts`)
    const seen = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      h1: document.querySelector('h1')?.textContent ?? '',
    }))
    check(
      `404 /${path} (${lang}): ${want}, the address kept`,
      seen.lang === want && seen.h1.includes(lost.title) && page.url().endsWith(`/${path}`),
      JSON.stringify(seen),
    )
    await context.close()
  }

  // Every page in this locale: <html lang> and hreflang alternates to the same page.
  const { context, page, errors } = await newContext(browser, device)
  const pages = ['/', '/work/team-of-teams/', '/management/', '/about/']
  for (const p of pages) {
    await page.goto(url(p), { waitUntil: 'networkidle' })
    const head = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      alternates: Object.fromEntries(
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
          l.hreflang,
          new URL(l.href).pathname,
        ]),
      ),
    }))
    const page2 = (l) => `${new URL(siteRoot).pathname}${l}${p}`
    check(
      `${p}: <html lang="${locale}"> and hreflang de, en, x-default`,
      head.lang === locale &&
        locales.every((l) => head.alternates[l] === page2(l)) &&
        head.alternates['x-default'] === new URL(siteRoot).pathname,
      JSON.stringify(head),
    )
  }

  // The switcher, on home, a case study, Management and About: there and back.
  const titles = {}
  for (const l of locales) {
    const [{ hand: h }, { management: m }, { about: a }, { home: hm }] = await Promise.all([
      load(`content/${l}/hand.ts`),
      load(`content/${l}/pages/management.ts`),
      load(`content/${l}/pages/about.ts`),
      load(`content/${l}/pages/home.ts`),
    ])
    titles[l] = {
      '/': hm.title,
      '/work/team-of-teams/': h.cards['team-of-teams'].title,
      '/management/': m.title,
      '/about/': a.title,
    }
  }
  const tap = device === 'phone' ? page.tap.bind(page) : page.click.bind(page)
  if (device === 'phone') {
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll('[data-locale-switcher] a')].map((a) => {
        const r = a.getBoundingClientRect()
        return [Math.round(r.width), Math.round(r.height)]
      }),
    )
    check(
      'switcher: 44 px targets on phones',
      sizes.length === 2 && sizes.every(([w, h]) => w >= 44 && h >= 44),
      JSON.stringify(sizes),
    )
  }
  for (const p of pages) {
    await page.goto(url(p), { waitUntil: 'networkidle' })
    await wait(page, 600)
    if (p !== '/') {
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.4))
      await wait(page, 600)
    }
    const at = () =>
      page.evaluate(() => {
        const s = [...document.querySelectorAll('main [data-section]')]
          .filter((e) => e.getBoundingClientRect().top <= 64)
          .at(-1)
        return s?.dataset.section ?? null
      })
    const before = await page.evaluate(() => {
      document.querySelector('.field-canvas').__kept = true
      return { motion: document.documentElement.dataset.motion, field: document.documentElement.dataset.field ?? null }
    })
    const section = await at()
    const vtsBefore = (await page.evaluate(() => window.__vts)).length
    const current = await page.getAttribute(`[data-locale-switcher] a[data-locale="${locale}"]`, 'aria-current')
    // Scrolled down, the header has left (N1): focus brings it back, as it would for a visitor.
    await page.focus(`[data-locale-switcher] a[data-locale="${other}"]`)
    await wait(page, 400)
    await tap(`[data-locale-switcher] a[data-locale="${other}"]`)
    await page.waitForURL((u) => u.pathname.endsWith(`/${other}${p}`), { timeout: 4000 })
    await wait(page, 900)
    const after = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      motion: document.documentElement.dataset.motion,
      field: document.documentElement.dataset.field ?? null,
      intro: document.documentElement.dataset.intro ?? null,
      kept: document.querySelector('.field-canvas').__kept === true,
      stored: localStorage.getItem('locale'),
      h1: document.querySelector('main h1')?.textContent ?? '',
      current: document.querySelector('[data-locale-switcher] [aria-current]')?.dataset.locale,
      focus: document.activeElement?.dataset?.locale ?? document.activeElement?.tagName,
      hidden: [...document.querySelectorAll('main [data-reveal]')].filter((el) => {
        const r = el.getBoundingClientRect()
        return r.top < innerHeight * 0.6 && r.bottom > 0 && r.width > 0 && Number(getComputedStyle(el).opacity) < 0.99
      }).length,
    }))
    const vts = (await page.evaluate(() => window.__vts)).slice(vtsBefore)
    // T3: once the switch has settled, the face-up chip lies under the active language.
    const chip = await page.evaluate(() => {
      const c = document.querySelector('[data-locale-switcher] [class*="chip"]')?.getBoundingClientRect()
      const a = document.querySelector('[data-locale-switcher] [aria-current]')?.getBoundingClientRect()
      return c && a ? Math.round(Math.abs(c.left + c.width / 2 - (a.left + a.width / 2))) : null
    })
    check(`switch on ${p}: the chip lies under the active language`, chip === 0, String(chip))
    check(
      `switch ${locale} → ${other} on ${p}: same page, "${titles[other][p]}", lang, choice stored`,
      after.lang === other &&
        after.h1.includes(titles[other][p]) &&
        after.stored === other &&
        current === 'page' &&
        after.current === other,
      JSON.stringify({ ...after, current }),
    )
    check(
      `switch on ${p}: one "locale" cross-fade, no card transition`,
      vts.length === 1 && vts[0].types.join() === 'locale' && vts[0].ok === true,
      JSON.stringify(vts),
    )
    check(
      `switch on ${p}: field and tier kept, no intro, on screen at once`,
      after.kept &&
        after.motion === before.motion &&
        after.field === before.field &&
        after.intro !== 'first' &&
        after.hidden === 0,
      JSON.stringify({ before, after }),
    )
    if (p !== '/')
      check(`switch on ${p}: reading position kept (${section})`, (await at()) === section, String(await at()))
    if (device === 'desktop')
      check(`switch on ${p}: focus stays on the switcher`, after.focus === other, String(after.focus))
    // And back, so the next page starts in this locale.
    await page.focus(`[data-locale-switcher] a[data-locale="${locale}"]`)
    await wait(page, 400)
    await tap(`[data-locale-switcher] a[data-locale="${locale}"]`)
    await page.waitForURL((u) => u.pathname.endsWith(`/${locale}${p}`), { timeout: 4000 })
    await wait(page, 600)
  }
  // Browser back across a switch: the same page in the language before, a "locale" cross-fade again.
  await page.goto(url('/work/front-door/'), { waitUntil: 'networkidle' })
  await wait(page, 600)
  await tap(`[data-locale-switcher] a[data-locale="${other}"]`)
  await page.waitForURL((u) => u.pathname.endsWith(`/${other}/work/front-door/`), { timeout: 4000 })
  await wait(page, 900)
  const vtsSwitch = (await page.evaluate(() => window.__vts)).length
  await page.goBack()
  await page.waitForURL((u) => u.pathname.endsWith(`/${locale}/work/front-door/`), { timeout: 4000 })
  await wait(page, 1200)
  const backVts = (await page.evaluate(() => window.__vts)).slice(vtsSwitch)
  const backLang = await page.evaluate(() => document.documentElement.lang)
  check(
    'browser back across a switch: "locale" cross-fade, the language before',
    backLang === locale && backVts.length === 1 && backVts[0].types.join() === 'locale',
    JSON.stringify({ backLang, backVts }),
  )
  check('no page errors (locale)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

/**
 * Motion per tier on a case study: every reveal ends visible and still, no
 * will-change left, the deal scene pins only in full on desktop, the reading
 * hairline follows the scroll, and reduced motion never animates a transform.
 */
async function motionSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device)
  // Record every animated property under <main>, the hand and the header while the page runs.
  await context.addInitScript(() => {
    window.__props = new Set()
    const tick = () => {
      for (const a of document.getAnimations()) {
        const t = a.effect?.target
        if (!t?.closest?.('main, .hand, header')) continue
        for (const k of a.effect.getKeyframes())
          for (const [p, v] of Object.entries(k)) {
            if (['offset', 'easing', 'composite', 'computedOffset'].includes(p)) continue
            // A transform that goes nowhere (0px travel in reduced tokens) is not movement.
            if (
              /^(transform|translate|scale|rotate)$/.test(p) &&
              /^(none|0(px)?( 0(px)?)*|1( 1)*|0deg)$/.test(String(v).trim())
            )
              continue
            window.__props.add(p)
          }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.goto(url('/work/team-of-teams/'), { waitUntil: 'networkidle' })
  await wait(page, 600)
  const { deal: DEAL } = await load('src/motion/tokens.ts')
  const deal = await page.evaluate(
    ({ head, pad, reserve }) => {
      const el = document.querySelector('[data-scene="deal"]')
      const track = el?.closest('[data-stage-track]')
      if (!el || !track) return null
      const list = el.querySelector('.deal-row-list')
      // Would the cards fit the canvas at a readable scale (the scene's own rule)?
      const fit = (innerHeight - 64 - reserve - head - 3 * pad) / list.offsetHeight
      const stage = track.querySelector('[data-stage]')
      return {
        active: el.hasAttribute('data-scene-active'),
        pinned: track.hasAttribute('data-pinned'),
        ratio: track.getBoundingClientRect().height / innerHeight,
        headInStage: Boolean(stage.querySelector('.section-title') && stage.querySelector('[data-numeral]')),
        fit: Math.round(fit * 100) / 100,
      }
    },
    { head: DEAL.pinned.head, pad: DEAL.pinned.pad, reserve: 120 },
  )
  if (deal) {
    const room = (await page.evaluate(() => innerHeight)) >= DEAL.minPinnedHeight
    if (motion === 'full' && device === 'desktop' && room && deal.fit >= DEAL.pinned.minScale)
      check(
        'deal scene: head and cards pinned in a 180svh track (full, desktop)',
        deal.active && deal.pinned && deal.ratio > 1.7 && deal.headInStage,
        JSON.stringify(deal),
      )
    else
      check(
        `deal scene: static row under the title (${motion}, ${device}, fit ${deal.fit})`,
        !deal.active && !deal.pinned && deal.headInStage,
        JSON.stringify(deal),
      )
  }
  // Scroll the whole page like a reader.
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 160) {
    await page.mouse.wheel(0, 160)
    await wait(page, 40)
  }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2))
  await wait(page, 2600)
  const rest = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll('main [data-reveal]')]
      .filter((el) => !el.hasAttribute('data-revealed') || Number(getComputedStyle(el).opacity) < 0.99)
      .map((el) => el.dataset.reveal),
    // The deal scene's cards keep their layer for the scene's lifetime (R4); nothing else may.
    willChange: [...document.querySelectorAll('main *')].filter(
      (el) => el.style.willChange && !el.matches('[data-scene="deal"] [data-deal-card]'),
    ).length,
    dealLayers: [...document.querySelectorAll('[data-scene-active] [data-deal-card]')].map((el) => el.style.willChange),
    moving: document
      .getAnimations()
      .filter(
        (a) =>
          a.playState === 'running' &&
          a.timeline instanceof DocumentTimeline &&
          !a.effect?.target?.closest?.('.field') &&
          // T2: the logo's gradient flows at rest, very slowly (its stops only).
          !a.effect?.target?.matches?.('header [data-logo-stop]'),
      )
      .map((a) => a.effect?.target?.className?.baseVal ?? (a.effect?.target?.className || a.effect?.target?.tagName)),
    progress: Number(
      getComputedStyle(document.querySelector('[data-reading-hairline]')).getPropertyValue('--reading-progress'),
    ),
    bar: (() => {
      const cs = getComputedStyle(document.querySelector('[data-reading-hairline] > *'))
      return { transform: cs.transform, clip: cs.clipPath }
    })(),
    props: [...window.__props],
  }))
  check('motion: every reveal ends visible after scrolling', rest.hidden.length === 0, rest.hidden.join(','))
  check('motion: no will-change left at rest', rest.willChange === 0, String(rest.willChange))
  if (motion === 'full' && device === 'desktop' && deal?.pinned)
    check(
      'deal scene: its cards keep one layer while it is pinned (never toggled at the pin boundaries while scrolling, R4)',
      rest.dealLayers.length === 4 && rest.dealLayers.every((v) => v === 'transform'),
      rest.dealLayers.join(),
    )
  check(
    "motion: only the background (and the logo's gradient) moves at rest",
    rest.moving.length === 0,
    rest.moving.join(','),
  )
  check('hairline: follows the scroll (mid page)', rest.progress > 0.2 && rest.progress < 0.8, String(rest.progress))
  const moves = rest.props.filter((p) => /transform|translate|scale|rotate|clipPath/.test(p))
  if (motion === 'reduced') {
    check('reduced: no transform or clip animated (opacity only)', moves.length === 0, rest.props.join(','))
    check(
      'reduced: hairline drawn with a clip, no transform',
      rest.bar.transform === 'none' && rest.bar.clip !== 'none',
      JSON.stringify(rest.bar),
    )
  } else check(`${motion}: reveals move (${moves.join(', ') || 'none'})`, moves.length > 0, rest.props.join(','))
  check('no page errors (motion)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

/**
 * This round's behaviour: the detail hero's order (title, summary, label, meta pairs left to
 * right), a return with the hero scrolled away (no morph, the card is dealt into its slot), and
 * the idle hint (home only, once per session, fades on the next key press).
 */
async function feedbackSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device)
  await page.goto(url('/work/front-door/'), { waitUntil: 'commit' })
  const seen = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const parts = {
          title: () => document.querySelector('h1 .wt-word > span'),
          summary: () => document.querySelector('.case-hero-summary'),
          label: () => document.querySelector('.case-hero-meta'),
          pair1: () => document.querySelectorAll('.meta-pair')[0],
          pair2: () => document.querySelectorAll('.meta-pair')[1],
        }
        const opacity = (el) => {
          let o = 1
          for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity)
          return o
        }
        const t = {}
        const tick = () => {
          const field = document.querySelector('.field')
          if (field && getComputedStyle(field).position === 'fixed')
            for (const [k, get] of Object.entries(parts)) {
              const el = get()
              const r = el?.getBoundingClientRect()
              if (t[k] === undefined && r && r.top < innerHeight && opacity(el) > 0.3)
                t[k] = Math.round(performance.now())
            }
          if (Object.keys(t).length === Object.keys(parts).length || performance.now() > 5000) resolve(t)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
  )
  const keys = ['title', 'label', 'summary', 'pair1', 'pair2'].filter((k) => k in seen)
  const order = keys.map((k) => `${k} ${seen[k]}ms`).join(', ')
  if (motion !== 'reduced')
    check(
      'detail hero: title, label, summary, then the meta pairs left to right',
      keys.length >= 3 && keys.every((k, i) => i === 0 || seen[keys[i - 1]] <= seen[k] + 20),
      order,
    )
  // Return with the hero scrolled away: no card morph, the card is back in its slot.
  await wait(page, 1500)
  await page.evaluate(() => scrollTo(0, 2400))
  await wait(page, 600)
  await page.keyboard.press('Escape')
  await page.waitForURL((u) => path({ url: () => u.href }) === '/', { timeout: 4000 })
  await wait(page, 1600)
  const back = await page.evaluate(() => {
    const card = document.querySelector('.hand-fan .hand-card[data-play="front-door"]')
    return {
      opacity: getComputedStyle(card).opacity,
      running: card.getAnimations().length,
      focused: document.activeElement === card,
    }
  })
  check(
    'return (hero scrolled away): the frame folds back into the card, which ends in its slot',
    back.opacity === '1' && back.running === 0 && back.focused,
    JSON.stringify(back),
  )
  // The idle hint: ?idle shortens the wait to a second.
  await page.goto(url('/?idle'), { waitUntil: 'networkidle' })
  await wait(page, 3500)
  const hint = await page.evaluate(() => {
    const el = document.querySelector('.idle-hint')
    return (
      el && {
        ready: el.hasAttribute('data-ready'),
        hidden: el.getAttribute('aria-hidden'),
        opacity: getComputedStyle(el).opacity,
      }
    )
  })
  // R9: only where it fits (24 px under the last What I bring item): at 390 × 844 it does not.
  if (device === 'desktop')
    check(
      'idle hint: appears on home, decorative',
      hint?.ready && hint.hidden === 'true' && hint.opacity === '1',
      JSON.stringify(hint),
    )
  else check('idle hint: skipped on a phone where it does not fit (390 × 844)', hint === null, JSON.stringify(hint))
  await page.keyboard.press('Shift')
  await wait(page, 700)
  check('idle hint: the next key press fades it out', (await page.locator('.idle-hint').count()) === 0)
  await page.goto(url('/?idle'), { waitUntil: 'networkidle' })
  await wait(page, 2500)
  check('idle hint: once per session', (await page.locator('.idle-hint').count()) === 0)
  // M3: without ?idle the note waits 10 s (a fresh session; desktop only, it takes a while).
  if (device === 'desktop') {
    const fresh = await newContext(browser, device)
    await fresh.page.goto(url('/'), { waitUntil: 'networkidle' })
    const t0 = Date.now()
    await wait(fresh.page, 8000)
    const early = await fresh.page.locator('.idle-hint').count()
    await fresh.page.waitForSelector('.idle-hint[data-ready]', { timeout: 6000 }).catch(() => {})
    const after = (Date.now() - t0) / 1000
    check('idle hint: after 10 s on home', early === 0 && after < 13, `${after.toFixed(1)} s`)
    await fresh.context.close()
  }
  check('no page errors (feedback)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

async function main() {
  const browser = await chromium.launch()
  for (const device of Object.keys(viewports)) {
    console.log(`\n# ${device} (${motion}, ${locale})`)
    await introSuite(browser, device)
    await tableSuite(browser, device)
    await feedbackSuite(browser, device)
    await motionSuite(browser, device)
    await localeSuite(browser, device)
  }
  await browser.close()
  console.log(failures ? `\n${failures} failed` : '\nall passed')
  process.exit(failures ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
