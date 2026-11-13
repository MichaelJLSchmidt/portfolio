/*
 * Number-by-number interpolation between path strings of the same structure
 * (same commands, same count of numbers): the font instances (concept 5) and
 * the ridge ↔ contour morph (concept 6).
 */
const NUM = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi

export function morphable(a: string, b: string) {
  return a.replace(NUM, '#') === b.replace(NUM, '#')
}

/** A function t → path, t in [0, 1] (values outside extrapolate). */
export function interpolator(a: string, b: string) {
  if (!morphable(a, b)) throw new Error('Paths do not share a structure')
  const na = (a.match(NUM) ?? []).map(Number)
  const nb = (b.match(NUM) ?? []).map(Number)
  const parts = a.split(NUM)
  return (t: number) => {
    let out = parts[0]
    for (let i = 0; i < na.length; i++) {
      const v = na[i] + (nb[i] - na[i]) * t
      out += String(Math.round(v * 1000) / 1000) + parts[i + 1]
    }
    return out
  }
}

/** Interpolates along a list of keyframe paths at progress p in [0, 1] (evenly spaced). */
export function along(values: string[]) {
  const segs = values.slice(1).map((v, i) => interpolator(values[i], v))
  return (p: number) => {
    if (segs.length === 0) return values[0]
    const x = Math.min(Math.max(p, 0), 1) * segs.length
    const i = Math.min(Math.floor(x), segs.length - 1)
    return segs[i](x - i)
  }
}
