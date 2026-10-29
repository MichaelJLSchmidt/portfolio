/**
 * The hero name on at most two lines: a long name breaks between the given names and the
 * family name, a short one stays on one line. Layout sizes the type by the longest line, so
 * it works for any name length.
 */
export function nameLines(name: string, maxOneLine = 12): string[] {
  const words = name.trim().split(/\s+/);
  if (words.join(" ").length <= maxOneLine || words.length < 2) return [words.join(" ")];
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}
