import type { ReactNode } from 'react'
import * as tokens from '@/motion/tokens'
import { motionCss, springCss } from '@/motion/tokens'
import { lineIn, readSource, usages } from '../../source'
import { MotionDemo } from '../client/motion-demo'
import { RevealDemo } from '../client/reveal-demo'
import { kebab } from '../colour'
import { declarations } from '../css'
import { type ItemData, type SectionData, code, ms } from '../ui'

const TOKENS = 'src/motion/tokens.ts'
const MOD = 'src/motion/tokens'
/** Curves are shown over one second, so they compare. */
const CURVE_SECONDS = 1

type Bezier = readonly [number, number, number, number]
type Spring = { stiffness: number; damping: number; mass: number }
const isCurve = (v: unknown): v is Bezier =>
  Array.isArray(v) &&
  v.length === 4 &&
  v.every((n) => typeof n === 'number') &&
  v[0] >= 0 &&
  v[0] <= 1 &&
  v[2] >= 0 &&
  v[2] <= 1
const isSpring = (v: unknown): v is Spring =>
  !!v && typeof v === 'object' && 'stiffness' in v && 'damping' in v && 'mass' in v

/** Points of a cubic bézier (x, y) from t = 0 to 1. */
function bezierPoints([x1, y1, x2, y2]: Bezier): [number, number][] {
  return Array.from({ length: 41 }, (_, i) => {
    const t = i / 40
    const c = (a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
    return [c(x1, x2), c(y1, y2)]
  })
}
/** Points of a CSS linear() easing (evenly spaced stops). */
const linearPoints = (easing: string): [number, number][] => {
  const v = /linear\(([^)]*)\)/.exec(easing)![1].split(',').map(Number)
  return v.map((y, i) => [i / (v.length - 1), y])
}

const css = () => declarations(motionCss())
const cssVarOf = (name: string) => (css().has(name) ? name : null)

/** The custom property motionCss() writes for a token, when it writes one. */
function cssFor(group: string, key: string): string | null {
  const k = kebab(key)
  const candidates: Record<string, string> = {
    dur: `--dur-${k}`,
    duration: `--dur-${k}`,
    ease: `--ease-${k}`,
    spring: `--spring-${k}`,
    stagger: `--stagger-${k}`,
    weight: `--wght-${k}`,
    distance: `--travel-${k}`,
  }
  return candidates[group] ? cssVarOf(candidates[group]) : null
}

const use = (group: string, path: string[], cssVar: string | null) =>
  usages({
    exports: [{ module: MOD, name: group, member: path }],
    cssVars: cssVar ? [cssVar, ...(group === 'spring' ? [`${cssVar}-dur`] : [])] : [],
    except: [TOKENS],
  })

const src = (group: string, path: string[]) => ({
  file: TOKENS,
  line: lineIn(TOKENS, `export const ${group}`),
  name: [group, ...path].join('.'),
})

function durations(group: 'dur' | 'duration'): ItemData[] {
  return Object.entries(tokens[group]).map(([key, s]) => {
    const v = cssFor(group, key)
    return {
      id: `motion.${group}.${key}`,
      render: <MotionDemo kind="duration" seconds={s} />,
      values: [
        ['value', `${ms(s)} (${s} s)`],
        ['css', v ? code(v) : 'no custom property'],
        ...(group === 'dur' ? [['reduced', ms(tokens.durFor('reduced', key as tokens.DurationStep))] as const] : []),
      ],
      source: src(group, [key]),
      usage: use(group, [key], v),
    }
  })
}

function curves(): ItemData[] {
  return Object.entries(tokens.ease).map(([key, b]) => {
    const v = cssFor('ease', key)
    const easing = `cubic-bezier(${b.join(', ')})`
    const alias = Object.entries(tokens.ease).find(
      ([k, o]) => k !== key && o === b && Object.keys(tokens.ease).indexOf(k) < Object.keys(tokens.ease).indexOf(key),
    )
    return {
      id: `motion.ease.${key}`,
      render: <MotionDemo kind="curve" easing={easing} seconds={CURVE_SECONDS} points={bezierPoints(b as Bezier)} />,
      values: [
        ['value', code(easing)],
        ['css', v ? code(v) : '—'],
        ...(alias ? [['same as', code(`ease.${alias[0]}`)] as const] : []),
      ],
      source: src('ease', [key]),
      usage: use('ease', [key], v),
    }
  })
}

function springs(): ItemData[] {
  return Object.entries(tokens.spring).map(([key, s]) => {
    const v = cssFor('spring', key)
    const { easing, duration } = springCss(s)
    return {
      id: `motion.spring.${key}`,
      render: <MotionDemo kind="curve" easing={easing} seconds={duration} points={linearPoints(easing)} />,
      values: [
        ['physics', `stiffness ${+s.stiffness.toFixed(2)}, damping ${+s.damping.toFixed(2)}, mass ${s.mass}`],
        ['settles', ms(duration)],
        ['css', v ? code(`${v} (linear(), 41 stops), ${v}-dur`) : '—'],
      ],
      source: src('spring', [key]),
      usage: use('spring', [key], v),
    }
  })
}

function staggers(): ItemData[] {
  const each = tokens.dur.s
  const easing = `cubic-bezier(${tokens.ease.outQuint.join(', ')})`
  return Object.entries(tokens.stagger).map(([key, s]) => {
    const v = cssFor('stagger', key)
    return {
      id: `motion.stagger.${key}`,
      render: <MotionDemo kind="stagger" seconds={s} each={each} easing={easing} />,
      values: [
        ['value', ms(s)],
        ['css', v ? code(v) : '—'],
        ['demo', `five items, each ${ms(each)} outQuint`],
      ],
      source: src('stagger', [key]),
      usage: use('stagger', [key], v),
    }
  })
}

/** Every other export, flattened: one row per value, with a demo where the value is a curve or a spring. */
function choreography(): { group: string; items: ItemData[] }[] {
  const shown = new Set(['dur', 'duration', 'ease', 'spring', 'stagger'])
  const out: { group: string; items: ItemData[] }[] = []
  for (const [group, value] of Object.entries(tokens)) {
    if (shown.has(group) || typeof value === 'function') continue
    const items: ItemData[] = []
    const walk = (v: unknown, path: string[]) => {
      let render: ReactNode = null
      let shownValue: ReactNode
      if (isCurve(v)) {
        const easing = `cubic-bezier(${v.join(', ')})`
        render = <MotionDemo kind="curve" easing={easing} seconds={CURVE_SECONDS} points={bezierPoints(v)} />
        shownValue = code(easing)
      } else if (isSpring(v)) {
        const { easing, duration } = springCss(v)
        render = <MotionDemo kind="curve" easing={easing} seconds={duration} points={linearPoints(easing)} />
        shownValue = `spring: stiffness ${+v.stiffness.toFixed(2)}, damping ${+v.damping.toFixed(2)}, settles in ${ms(duration)}`
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (const [k, w] of Object.entries(v)) walk(w, [...path, k])
        return
      } else shownValue = code(JSON.stringify(v))
      const key = path.at(-1) ?? group
      const cssVar = path.length === 1 ? cssFor(group, key) : null
      items.push({
        id: `motion.${[group, ...path].join('.')}`,
        render,
        values: [['value', shownValue], ...(cssVar ? [['css', code(cssVar)] as const] : [])],
        source: src(group, path),
        usage: use(group, path, cssVar),
      })
    }
    walk(value, [])
    out.push({ group, items })
  }
  return out
}

/** The reveal kinds (the Kind union in kinds.ts), each replayed on a sample with the kind's own code. */
function reveals(): ItemData[] {
  const KINDS = 'src/motion/kinds.ts'
  const union = /export type Kind = ([^\n]+)/.exec(readSource(KINDS))?.[1] ?? ''
  const kinds = [...union.matchAll(/'(\w+)'/g)].map((m) => m[1])
  const samples: Record<string, ReactNode> = {
    lines: <p className="t-body">Lines rise out of their masks, one after the other, as the block comes into view.</p>,
    block: <p className="t-lead inv-reveal-box">A block rises a little and fades in.</p>,
    list: (
      <ul className="ruled-list t-body">
        <li>Items are dealt in</li>
        <li>from the left</li>
        <li>one after the other</li>
      </ul>
    ),
    rule: <hr className="inv-rule" />,
    note: <p className="t-body">A note fades in.</p>,
  }
  return kinds.map((kind) => ({
    id: `reveal.${kind}`,
    render: samples[kind] ? (
      <RevealDemo kind={kind as 'lines'}>{samples[kind]}</RevealDemo>
    ) : (
      <span className="inv-none">Needs its page’s markup; see where it is used.</span>
    ),
    values: [['reduced', 'one 160 ms crossfade, nothing moves']],
    source: {
      file: KINDS,
      line: lineIn(KINDS, new RegExp(`export (async )?function ${kind === 'deal' ? 'dealCards' : kind}\\(`)),
      name: kind === 'deal' ? 'dealCards()' : `${kind}()`,
    },
    usage: usages({ strings: [kind], except: [KINDS, TOKENS] }).filter((u) => /\.tsx$/.test(u.file)),
  }))
}

export function motionSection(): SectionData {
  const rest = choreography()
  return {
    id: 'motion',
    title: 'Motion',
    intro: (
      <>
        Every export of <code>src/motion/tokens.ts</code>, walked: the duration scale and the table&rsquo;s durations,
        the curves, the springs (as the CSS <code>linear()</code> curve <code>springCss()</code> makes of them) and the
        staggers, each with Play; then the rest of the choreography value by value, and the reveal kinds replayed with
        the reveal&rsquo;s own code. Curves play over {CURVE_SECONDS} s. In the reduced tier every demo is one 160 ms
        crossfade.
      </>
    ),
    groups: [
      { title: 'Duration scale (dur)', items: durations('dur'), play: true },
      { title: 'Durations (duration)', items: durations('duration'), play: true },
      { title: 'Easings (ease)', items: curves(), play: true },
      { title: 'Springs (spring)', items: springs(), play: true },
      { title: 'Staggers (stagger)', items: staggers(), play: true },
      { title: 'Reveal kinds', items: reveals(), layout: 'wide', play: true },
      ...rest.map((r) => ({ title: `${r.group}`, items: r.items, layout: 'row' as const })),
    ],
  }
}
