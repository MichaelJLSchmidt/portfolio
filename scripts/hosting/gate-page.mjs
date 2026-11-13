// The password gate's page model (src/hosting/page.ts): its fonts copied under content-hashed
// names, CSS from the site's tokens (palette, type scale, grid, motion), the site's logo, the
// inline script, the copy from content/ (content/gate.ts, content/<locale>/gate.ts), and the
// page's Content-Security-Policy. Lightweight on purpose: no WebGL, no app bundle; the colour
// field is three CSS gradients that breathe and drift on the compositor, still under reduced
// motion (and when the request asks to save data, src/hosting/gate-handler.ts).
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { load, root } from '../load-ts.mjs'

const { LOCALE_KEY, locales } = await load('src/lib/i18n.ts')
const { palette, text, muted, logoGradients } = await load('src/design/palette.ts')
const { type } = await load('src/design/type.ts')
const { grid, breakpoints } = await load('src/design/layout.ts')
const { duration, ease, field, logo, reducedCrossfade, dur } = await load('src/motion/tokens.ts')
const { identity } = await load('content/gate.ts')
const copy = Object.fromEntries(
  await Promise.all(locales.map(async (l) => [l, (await load(`content/${l}/gate.ts`)).gate])),
)

const sha256 = (data) => createHash('sha256').update(data).digest()

// German copy follows the site's rules (src/lib/content.ts checks the same on every page).
const germanRules = [
  [/ß/, 'Swiss Standard German writes "ss", never "ß"'],
  [/—/, 'no em-dashes'],
  [/;/, 'no semicolons'],
]
for (const [key, value] of Object.entries(copy.de)) {
  for (const [pattern, rule] of germanRules) {
    if (pattern.test(value)) throw new Error(`content/de/gate.ts: ${key}: ${rule}: "${value}"`)
  }
}
for (const l of locales) {
  for (const key of Object.keys(copy[locales[0]])) {
    if (typeof copy[l][key] !== 'string' || !copy[l][key]) throw new Error(`content/${l}/gate.ts: ${key} is missing`)
  }
}

/** The fonts the page uses, as the site serves them (src/app/fonts.ts). */
const fonts = {
  display: join(root, 'src/fonts/BricolageGrotesque-opsz-wght.latin.woff2'),
  text: join(root, 'src/fonts/HankenGrotesk-wght.latin.woff2'),
  mono: join(root, 'src/fonts/MartianMono-wght.latin.woff2'),
}

/** Copies the fonts into `dir` under content-hashed names; returns their URLs under `prefix`. */
export function copyAssets(dir, prefix) {
  mkdirSync(dir, { recursive: true })
  const put = (source) => {
    const ext = extname(source)
    const name = `${basename(source, ext)}.${sha256(readFileSync(source)).toString('hex').slice(0, 10)}${ext}`
    copyFileSync(source, join(dir, name))
    return `${prefix}${name}`
  }
  return Object.fromEntries(Object.entries(fonts).map(([k, v]) => [k, put(v)]))
}

// ---------------------------------------------------------------- the logo
// The site's logo (src/components/logo.tsx), static: the back card with the M cut out, the front
// card with the F, its gradient flowing like the header's (still under reduced motion).
const BACK = 'rotate(-6 18.235 37.923)'
const FRONT = 'rotate(5 30.235 37.923)'
const CARD = 'y="9.923" width="20" height="28" rx="2.5"'
const M =
  'M14.735 30.923V22.181L19.235 25.823L23.735 22.181V30.923H27.235V16.923H25.064L19.235 21.642L13.406 16.923H11.235V30.923Z'
const F = 'M23.735 16.923H27.235V30.923H23.735ZM23.735 16.923H36.235V20.423H23.735ZM23.735 22.673H33.735V26.173H23.735Z'
{
  const source = readFileSync(join(root, 'src/components/logo.tsx'), 'utf8')
  for (const part of [BACK, FRONT, M, F]) {
    if (!source.includes(part))
      throw new Error(`The gate's logo no longer matches src/components/logo.tsx (${part.slice(0, 24)}…)`)
  }
}
const area = 'x="-24" y="-24" width="96" height="96"'
const mask = (id, content) =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" ${area}><rect ${area} fill="#fff"/>${content}</mask>`
const logoSvg = [
  `<svg viewBox="5 8.5 38 31" aria-hidden="true" focusable="false"><defs>`,
  `<linearGradient id="logo-paint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="stop-0"/><stop offset=".5" class="stop-1"/><stop offset="1" class="stop-2"/></linearGradient>`,
  mask('logo-gap', `<g transform="${FRONT}"><rect x="20.235" ${CARD} fill="#000" stroke="#000" stroke-width="3"/></g>`),
  mask('logo-m', `<path d="${M}" fill="#000"/>`),
  mask('logo-f', `<path d="${F}" fill="#000"/>`),
  `</defs>`,
  `<g mask="url(#logo-gap)"><g transform="${BACK}"><rect x="8.235" ${CARD} fill="currentColor" mask="url(#logo-m)"/></g></g>`,
  `<g transform="${FRONT}"><rect x="20.235" ${CARD} fill="url(#logo-paint)" mask="url(#logo-f)"/></g>`,
  `</svg>`,
].join('')

// The tab icon: the site's own (src/app/icon.svg).
const icon = `data:image/svg+xml,${encodeURIComponent(
  readFileSync(join(root, 'src/app/icon.svg'), 'utf8').replace(/>\s+</g, '><').trim(),
)}`

// ---------------------------------------------------------------- CSS
const px = (n) => `${n}px`
const s = (seconds) => `${Math.round(seconds * 1000)}ms`
const bezier = (b) => `cubic-bezier(${b.join(',')})`
/** A type token's fluid size, as src/styles/type.css writes it (min at 390 px, max at 1440 px). */
const fluid = ({ min, max }) => {
  const slope = (max - min) / (1440 - 390)
  return `clamp(${px(min)},${(min - slope * 390).toFixed(3)}px + ${(slope * 100).toFixed(3)}vw,${px(max)})`
}
const leading = (style) => (typeof style.leading === 'number' ? String(style.leading) : px(style.leading.px))

function css({ display, text: textFont, mono }) {
  const [logoA, logoB, logoC] = Object.values(logoGradients)[0]
  // The site's field at rest (field-css.ts, field.css): three pools in low-frequency colour. Here
  // they take three card colours, so the ground reads as the site's without the WebGL field.
  const pools = [
    { color: palette.ember.glow, at: '18% 86%', size: '42% 48%', strength: field.intensityRest * 0.7 },
    { color: palette.tide.mid, at: '84% 16%', size: '46% 52%', strength: field.intensityRest },
    { color: palette.grove.mid, at: '34% 52%', size: '36% 40%', strength: field.intensityRest * 0.6 },
  ]
  const label = `font:500 ${fluid(type.label.size)}/${leading(type.label)} "Martian Mono",ui-monospace,monospace;letter-spacing:${type.label.tracking}em;text-transform:uppercase`
  const rules = [
    `@font-face{font-family:"Bricolage Grotesque";src:url(${display}) format("woff2");font-weight:200 800;font-display:swap}`,
    `@font-face{font-family:"Hanken Grotesk";src:url(${textFont}) format("woff2");font-weight:100 900;font-display:swap}`,
    `@font-face{font-family:"Martian Mono";src:url(${mono}) format("woff2");font-weight:100 800;font-display:swap}`,
    `:root{color-scheme:dark;--ink:${palette.ink.field};--text:${text};--muted:${muted};--accent:${palette.ink.accent};` +
      `--line:color-mix(in srgb,var(--text) 13%,transparent);--line-strong:color-mix(in srgb,var(--text) 28%,transparent);` +
      `--fill:color-mix(in srgb,var(--ink) 62%,transparent);--logo-a:${logoA};--logo-b:${logoB};--logo-c:${logoC};` +
      `--margin:${grid.base.margin};--ease-out:${bezier(ease.outQuint)};--ease-in-out:${bezier(ease.inOut)};--dur-s:${s(dur.s)}}`,
    `@media (min-width:${breakpoints.sm}px){:root{--margin:${px(grid.sm.margin)}}}`,
    `@media (min-width:${breakpoints.md}px){:root{--margin:${px(grid.md.margin)}}}`,
    `*,*::before,*::after{box-sizing:border-box}`,
    `html{background:var(--ink);color:var(--text);-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased}`,
    `body{margin:0;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;font:400 ${fluid(type.body.size)}/${leading(type.body)} "Hanken Grotesk",ui-sans-serif,system-ui,sans-serif}`,
    // The colour field.
    `.field{position:fixed;inset:0;z-index:-1;overflow:hidden;background:var(--ink);pointer-events:none}`,
    `.pool{position:absolute;inset:-6%;will-change:transform}`,
    ...pools.map(
      (p, i) =>
        `.pool-${i + 1}{transform-origin:${p.at};background:radial-gradient(${p.size} at ${p.at},color-mix(in oklab,${p.color} ${(p.strength * 100).toFixed(1)}%,transparent),transparent)}`,
    ),
    // Breath (the site's: scale 1 to 1 + breathScale on a `breath` s sine) and a slow drift of
    // each pool (poolDrift of the viewport, its own pair of loops, all over 90 s): translate,
    // transform and scale, three properties, so the three loops never fight.
    `@keyframes breath{to{scale:${1 + field.breathScale}}}`,
    `@keyframes drift-x{from{translate:${-field.poolDrift * 100}vw 0}to{translate:${field.poolDrift * 100}vw 0}}`,
    `@keyframes drift-y{from{transform:translateY(${-field.poolDrift * 100}vh)}to{transform:translateY(${field.poolDrift * 100}vh)}}`,
    `@media (prefers-reduced-motion:no-preference){` +
      field.poolDriftPeriods
        .map(
          ([x, y], i) =>
            `:root:not([data-motion=still]) .pool-${i + 1}{animation:drift-x ${x / 2}s ease-in-out ${-x * (i + 1) * 0.17}s infinite alternate,drift-y ${y / 2}s ease-in-out ${-y * (i + 1) * 0.29}s infinite alternate,breath ${duration.breath / 2}s var(--ease-in-out) infinite alternate}`,
        )
        .join('') +
      `}`,
    // The language switch: the site's tray (header.module.css), two 44 px segments in Martian
    // Mono, the active one on a face-up chip, the other with a hairline chip on hover and focus.
    `.top{display:flex;justify-content:flex-end;padding:max(8px,env(safe-area-inset-top)) max(calc(var(--margin) - 4px),env(safe-area-inset-right)) 0 max(var(--margin),env(safe-area-inset-left))}`,
    `.language ul{position:relative;isolation:isolate;display:flex;margin:0;padding:0;list-style:none}`,
    `.language ul::before{content:"";position:absolute;inset:4px 0;z-index:-1;border:1px solid var(--line);border-radius:999px;background:var(--fill)}`,
    `.language a{position:relative;z-index:0;display:inline-flex;align-items:center;justify-content:center;width:44px;min-height:44px;border-radius:999px;color:var(--muted);font:500 .75rem/1 "Martian Mono",ui-monospace,monospace;letter-spacing:.06em;text-decoration:none;transition:color var(--dur-s) linear}`,
    `.language a::before{content:"";position:absolute;inset:8px 4px;z-index:-1;border:1px solid var(--line-strong);border-radius:999px;opacity:0;transition:opacity var(--dur-s) linear}`,
    `.language a[aria-current]{color:var(--ink);font-weight:600}`,
    `.language a[aria-current]::before{border-color:var(--text);background:var(--text);opacity:1}`,
    `.language a:not([aria-current]):is(:hover,:focus-visible){color:var(--text)}`,
    `.language a:not([aria-current]):is(:hover,:focus-visible)::before{opacity:1}`,
    `:focus-visible{outline:2px solid var(--accent);outline-offset:3px}`,
    `.language a:focus-visible{outline-offset:-3px}`,
    // The page: one column, the mark, the name, the sentence, the form, the way to ask.
    `main{flex:1;display:flex;flex-direction:column;justify-content:center;width:100%;max-width:calc(34rem + 2 * var(--margin));margin:0 auto;padding:clamp(24px,6vh,72px) max(var(--margin),env(safe-area-inset-right)) max(clamp(40px,10vh,120px),env(safe-area-inset-bottom)) max(var(--margin),env(safe-area-inset-left))}`,
    `.mark{width:clamp(52px,40px + 2vw,64px);margin:0 0 1.5rem -2px}`,
    `.mark svg{display:block;width:100%;height:auto;overflow:visible;color:var(--text)}`,
    `.mark stop{stop-color:var(--logo-a)}.mark .stop-1{stop-color:var(--logo-b)}.mark .stop-2{stop-color:var(--logo-c)}`,
    `@keyframes logo-flow{0%,100%{stop-color:var(--logo-a)}33.333%{stop-color:var(--logo-b)}66.667%{stop-color:var(--logo-c)}}`,
    `@media (prefers-reduced-motion:no-preference){.mark stop{animation:logo-flow ${logo.flow.dur}s linear infinite}.mark .stop-1{animation-delay:${-logo.flow.dur / 3}s}.mark .stop-2{animation-delay:${-logo.flow.dur / 1.5}s}}`,
    `.name{margin:0;font:${type.h2.weight} ${fluid(type.h2.size)}/${leading(type.h2)} "Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;font-variation-settings:"opsz" ${type.h2.opsz};letter-spacing:${type.h2.tracking}em;text-wrap:balance}`,
    `.lede{margin:1rem 0 0;max-width:28em;font-size:${fluid(type.lead.size)};line-height:1.35;text-wrap:pretty}`,
    `.unlock{margin:3rem 0 0}`,
    `.label{display:block;margin:0 0 .5rem;color:var(--muted);${label}}`,
    // The password field and the button share one capsule (the tray's hairline on a dimmed ink fill).
    `.row{display:flex;flex-wrap:wrap;gap:4px;padding:3px;border:1px solid var(--line-strong);border-radius:26px;background:var(--fill);transition:border-color var(--dur-s) linear}`,
    `.row:hover{border-color:color-mix(in srgb,var(--text) 45%,transparent)}`,
    `.row:focus-within,.row:has([aria-invalid=true]){border-color:var(--text)}`,
    `.row:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:3px}`,
    `.row input{flex:1 1 9rem;min-width:0;height:44px;margin:0;padding:0 15px;border:0;border-radius:22px;background:transparent;color:var(--text);font:inherit;font-size:max(16px,1em)}`,
    `.row input:focus{outline:none}`,
    `.row button{flex:1 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:10px;height:44px;margin:0;padding:0 18px;border:0;border-radius:22px;background:var(--text);color:var(--ink);${label};font-weight:600;cursor:pointer;transition:transform ${s(0.09)} var(--ease-out)}`,
    `@media (min-width:400px){.row{flex-wrap:nowrap}.row button{flex:none}}`,
    `.row button svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;transition:translate var(--dur-s) var(--ease-out)}`,
    `@media (hover:hover){.row button:hover svg{translate:3px 0}}`,
    `.row button:focus-visible svg{translate:3px 0}`,
    `.row button:active{transform:scale(.97)}`,
    `.row button[aria-disabled=true]{cursor:progress}`,
    // A wrong password: the capsule's line turns full, an icon and the message in the text colour.
    `.error{display:flex;gap:10px;align-items:flex-start;margin:.75rem 0 0;color:var(--text)}`,
    `.error svg{flex:none;width:18px;height:18px;margin-top:.3em;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round}`,
    `.closed{margin:2.5rem 0 0;color:var(--text)}`,
    `.contact{margin:2rem 0 0;color:var(--muted)}`,
    // The two ways to ask wrap together, never one alone after the dot.
    `.ways{white-space:nowrap}`,
    `.dot{color:var(--muted)}`,
    // Text links, after the site's (globals.css .link): a marker block in a deeper shade of the
    // logo's colours behind the text; hover and focus collapse it into the underline at full colour.
    `.link{--depth-a:color-mix(in oklab,var(--logo-a),var(--ink) 52%);--depth-b:color-mix(in oklab,var(--logo-b),var(--ink) 52%);--depth-c:color-mix(in oklab,var(--logo-c),var(--ink) 52%);` +
      `padding:0 .15em .05em;margin:0 -.15em;color:var(--text);text-decoration:none;white-space:nowrap;border-radius:2px;` +
      `background-image:linear-gradient(90deg,var(--logo-a),var(--logo-b),var(--logo-c)),linear-gradient(90deg,var(--depth-a),var(--depth-b),var(--depth-c));` +
      `background-repeat:no-repeat;background-size:0% 2px,100% .7em;background-position:left bottom,left bottom;` +
      `transition:background-size var(--dur-s) var(--ease-out)}`,
    `@supports (color:oklch(from red l c h)){.link{--depth-a:oklch(from var(--logo-a) 0.49 c h);--depth-b:oklch(from var(--logo-b) 0.49 c h);--depth-c:oklch(from var(--logo-c) 0.49 c h)}}`,
    `@media (hover:hover){.link:hover{background-size:100% 2px,100% 0}}`,
    `.link:focus-visible{background-size:100% 2px,100% 0;outline-offset:2px}`,
    // Reduced motion: nothing moves, colour changes become the site's short crossfade.
    `@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:${s(reducedCrossfade)}!important}.row button,.row button svg,.link{transition:none!important}.row button:active{transform:none}.row button:is(:hover,:focus-visible) svg{translate:none}}`,
  ]
  return rules.join('')
}

// ---------------------------------------------------------------- script
// The submit button's pending label while the password is checked, and a language switch
// remembered for the site (its root reads the same key). Without JavaScript the page is complete.
const script = `(()=>{const b=document.querySelector("button[data-pending]");if(b){const idle=b.innerHTML;b.form.addEventListener("submit",e=>{if(b.getAttribute("aria-disabled")==="true"){e.preventDefault();return}b.textContent=b.dataset.pending;b.setAttribute("aria-disabled","true")});addEventListener("pageshow",e=>{if(e.persisted){b.innerHTML=idle;b.removeAttribute("aria-disabled")}})}for(const a of document.querySelectorAll("a[data-locale]"))a.addEventListener("click",()=>{try{localStorage.setItem(${JSON.stringify(LOCALE_KEY)},a.dataset.locale)}catch(e){}})})();`

/** The page model for fonts copied by `copyAssets`. */
export function pageModel(assets) {
  return {
    identity,
    copy,
    css: css(assets),
    script,
    logo: logoSvg,
    icon,
    themeColor: palette.ink.field,
    preload: [assets.display, assets.text],
  }
}

/** Content-Security-Policy for the page: its own inline style and script, its fonts, its form. */
export function contentSecurityPolicy(model) {
  const hash = (body) => `'sha256-${sha256(body).toString('base64')}'`
  return [
    "default-src 'none'",
    `style-src ${hash(model.css)}`,
    `script-src ${hash(model.script)}`,
    "font-src 'self'",
    'img-src data:',
    "form-action 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; ')
}
