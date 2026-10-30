/**
 * A title's key in title-axes.json: a short FNV-1a hash of the title as set (upper case), so the
 * generated file carries no copy of its own (and no names).
 */
export function titleKey(title: string): string {
  let h = 0x811c9dc5;
  for (const ch of title.toUpperCase()) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
