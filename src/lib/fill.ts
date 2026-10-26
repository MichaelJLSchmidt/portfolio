/**
 * Numbers in copy come from one data file: copy is written with tokens such as
 * "{{outcomes.complete.after}}%" or "{{workshops.count|word}} workshops", and fill() resolves
 * them. An unknown path throws, so a typo stops the build instead of printing a gap.
 *
 * Formats: none (as written), `en` (2,800), `ch` (10'000, Swiss product UI), `word` / `Word`
 * (five / Five, up to twenty), `ordinal` (third), `signed` (−35 with a real minus sign).
 */
type Data = Record<string, unknown>;

export const TOKEN = /\{\{\s*([\w.]+)(?:\|(\w+))?\s*\}\}/g;

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const ORDINALS = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];

const group = (n: number, sep: string) => {
  const [int, dec] = String(Math.abs(n)).split(".");
  return `${n < 0 ? "−" : ""}${int.replace(/\B(?=(\d{3})+(?!\d))/g, sep)}${dec ? `.${dec}` : ""}`;
};

export function lookup(data: Data, path: string): unknown {
  let value: unknown = data;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object" || !(key in value)) throw new Error(`fill: no value at "${path}"`);
    value = (value as Data)[key];
  }
  return value;
}

export function format(value: unknown, fmt: string | undefined, path: string): string {
  if (typeof value !== "number") {
    if (fmt) throw new Error(`fill: "${path}" is not a number, so it can't be formatted as ${fmt}`);
    if (typeof value !== "string") throw new Error(`fill: "${path}" is not a number or text`);
    return value;
  }
  switch (fmt) {
    case undefined:
      return String(value).replace("-", "−");
    case "en":
      return group(value, ",");
    case "ch":
      return group(value, "'");
    case "signed":
      return value > 0 ? `+${value}` : String(value).replace("-", "−");
    case "word":
    case "Word": {
      const word = WORDS[value];
      if (!Number.isInteger(value) || !word) throw new Error(`fill: "${path}" (${value}) has no number word`);
      return fmt === "Word" ? word[0].toUpperCase() + word.slice(1) : word;
    }
    case "ordinal": {
      const word = ORDINALS[value];
      if (!Number.isInteger(value) || !word) throw new Error(`fill: "${path}" (${value}) has no ordinal`);
      return word;
    }
    default:
      throw new Error(`fill: unknown format "${fmt}" for "${path}"`);
  }
}

export function fill(text: string, data: Data): string {
  return text.replace(TOKEN, (_, path: string, fmt?: string) => format(lookup(data, path), fmt, path));
}

/** Resolves every string inside a value (objects and arrays are copied). */
export function fillDeep<T>(value: T, data: Data): T {
  if (typeof value === "string") return fill(value, data) as T;
  if (Array.isArray(value)) return value.map((v) => fillDeep(v, data)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillDeep(v, data)])) as T;
  }
  return value;
}
