/* Small text helpers with no content imports (safe for any bundle). */

/** "01" … "09": two-digit index labels (cards, sections, counter). */
export const pad2 = (n: number) => String(n).padStart(2, '0')

/** "01" … "04": the small index on a card (0-based input). */
export const cardNumber = (index: number) => pad2(index + 1)

/** Fills {placeholders} in a content template. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`))
