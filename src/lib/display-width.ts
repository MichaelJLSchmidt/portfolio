import table from "./display-widths.json";

/**
 * Archivo's advance widths at the display rest axes (wdth 62, wght 800, upper case, the .display
 * letter-spacing), measured by scripts/measure-display.mjs. They let the server size display
 * titles to their real width and fix every letter's box (SettleText `widths="display"`), so a
 * web font arriving after the fallback cannot move anything.
 */
const em = table.em as Record<string, number>;

/** One glyph's advance in em, or null when it isn't in the table. */
export function glyphEm(ch: string): number | null {
  return em[ch.toUpperCase()] ?? null;
}

/** A run of text's width in em at the display rest axes, or null if a glyph isn't measured. */
export function textEm(text: string): number | null {
  let sum = 0;
  for (const ch of text) {
    const w = glyphEm(ch);
    if (w === null) return null;
    sum += w;
  }
  return Math.round(sum * 1000) / 1000;
}

/**
 * The widest word of a title (or of each line, with `lines`), in em. A glyph outside the table
 * counts as an M, so an unknown title errs on the narrow side.
 */
export function widestEm(text: string, { lines = false }: { lines?: boolean } = {}): number {
  const parts = lines ? text.split("\n") : text.split(/\s+/);
  const width = (s: string) => [...s].reduce((sum, ch) => sum + (glyphEm(ch) ?? em.M), 0);
  return Math.round(Math.max(...parts.filter(Boolean).map(width)) * 1000) / 1000;
}
