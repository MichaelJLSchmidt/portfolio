import condensedTable from "./condensed-widths.json";
import table from "./display-widths.json";

/**
 * Archivo's advance widths, measured by scripts/measure-display.mjs, for the cuts whose letter
 * boxes are fixed (SettleText `widths`): "display", the display rest axes (wdth 62, wght 800,
 * upper case, the .display letter-spacing); "condensed", the condensed cut at wght 600, mixed
 * case (the case-study type line). They let the server size display titles to their real width
 * and fix every letter's box, so a web font arriving after the fallback cannot move anything.
 */
export type MeasuredCut = "display" | "condensed";
const em = table.em as Record<string, number>;
const cuts: Record<MeasuredCut, { em: Record<string, number>; upper: boolean }> = {
  display: { em, upper: true },
  condensed: { em: condensedTable.em as Record<string, number>, upper: false },
};

/** One glyph's advance in em, or null when it isn't in the table. */
export function glyphEm(ch: string, cut: MeasuredCut = "display"): number | null {
  const { em: widths, upper } = cuts[cut];
  return widths[upper ? ch.toUpperCase() : ch] ?? null;
}

/** A run of text's width in em at a cut's axes, or null if a glyph isn't measured. */
export function textEm(text: string, cut: MeasuredCut = "display"): number | null {
  let sum = 0;
  for (const ch of text) {
    const w = glyphEm(ch, cut);
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
