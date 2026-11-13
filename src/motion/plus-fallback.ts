/*
 * Stand-in for the parts of motion-plus this site uses, for installs without
 * MOTION_TOKEN (next.config.ts aliases the module here and the type check maps
 * it in tsconfig.fallback.json). Same call shapes, simpler behaviour.
 */
type TypewriterOptions = { speed?: 'slow' | 'normal' | 'fast' | number; cursorBlinkRepeat?: number }

/** Types `text` into `target` one character at a time (no cursor). */
export function typewriter(target: Element, text: string, options: TypewriterOptions = {}) {
  const step =
    typeof options.speed === 'number'
      ? options.speed
      : options.speed === 'fast'
        ? 30
        : options.speed === 'slow'
          ? 130
          : 75
  let i = 0
  let timer = 0
  const finished = new Promise<void>((resolve) => {
    const tick = () => {
      target.textContent = text.slice(0, ++i)
      if (i < text.length) timer = window.setTimeout(tick, step)
      else resolve()
    }
    tick()
  })
  return {
    finished,
    stop: () => clearTimeout(timer),
  }
}

type SplitTextOptions = { preserveHyphens?: boolean; lineClass?: string; wordClass?: string; charClass?: string }

/** Splits an element's text into word spans grouped in line spans (no character spans). */
export function splitText(target: Element, options: SplitTextOptions = {}) {
  const { lineClass = 'split-line', wordClass = 'split-word' } = options
  const text = target.textContent ?? ''
  target.setAttribute('aria-label', text)
  target.textContent = ''
  const words = text.split(' ').map((word, i, all) => {
    const span = document.createElement('span')
    span.className = wordClass
    span.style.display = 'inline-block'
    span.style.verticalAlign = 'top'
    span.textContent = word
    target.append(span)
    if (i < all.length - 1) target.append(' ')
    return span
  })
  const groups: Node[][] = []
  let top = Number.NaN
  for (const word of words) {
    if (word.offsetTop > top || Number.isNaN(top)) {
      groups.push([])
      top = word.offsetTop
    }
    groups[groups.length - 1].push(word)
    if (word.nextSibling?.nodeType === Node.TEXT_NODE) groups[groups.length - 1].push(word.nextSibling)
  }
  target.textContent = ''
  const lines = groups.map((nodes) => {
    const line = document.createElement('span')
    line.className = lineClass
    line.style.display = 'inline-block'
    line.append(...nodes)
    target.append(line)
    return line
  })
  return { chars: [] as HTMLSpanElement[], words, lines }
}
