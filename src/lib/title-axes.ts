import type { CSSProperties } from "react";
import { titleKey } from "./title-key";
import data from "./title-axes.json";

type Entry = { em: number; wordEm: number; knots: number[]; compensated: boolean };
const titles = data.titles as Record<string, Entry>;

/**
 * A display title's widths along its arrival (scripts/measure-titles.mjs): the knots WeightTitle's
 * stylesheet follows so the line keeps its length while the weight eases from 200 to 800. A title
 * that was not measured (or drifts more than 2%) keeps the rest width all the way: its box stays
 * at its final width and only the weight moves.
 */
export function titleVars(text: string): CSSProperties {
  const entry = titles[titleKey(text)];
  const knots = entry?.compensated ? entry.knots : [data.rest.wdth, data.rest.wdth, data.rest.wdth, data.rest.wdth];
  return Object.fromEntries(knots.map((k, i) => [`--title-k${i}`, k])) as CSSProperties;
}

/** Whether a title animates both axes (measured and within the drift limit). */
export const titleCompensated = (text: string) => !!titles[titleKey(text)]?.compensated;

/**
 * A title's measure at the rest cut, in em: its widest line, or with `words` its widest word (the
 * display letter-spacing included). For sizing a title to its column; an unmeasured title falls
 * back to an estimate of 0.55 em a character.
 */
export function titleEm(text: string, { words = false }: { words?: boolean } = {}): number {
  const entry = titles[titleKey(text)];
  if (entry) return words ? entry.wordEm : entry.em;
  const parts = words ? text.split(/\s+/) : text.split("\n");
  return Math.max(...parts.map((p) => p.length)) * 0.55;
}
