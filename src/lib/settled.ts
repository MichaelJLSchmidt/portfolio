/**
 * Once-per-session motion: an element that has played its reveal is remembered in sessionStorage,
 * so a reload, a page re-shown after back navigation or a second visit in the same session renders
 * it settled.
 */
export const SETTLED_STORAGE_KEY = "summit:settled";

/** A short, CSS-safe key for an element on a page: the page path plus its id or text. */
export function settleKey(path: string, id: string): string {
  let h = 5381;
  const s = `${path}|${id}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `s${(h >>> 0).toString(36)}`;
}

function read(): string[] {
  try {
    const list = JSON.parse(sessionStorage.getItem(SETTLED_STORAGE_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

let fallback: string[] = [];

export function isSettled(key: string): boolean {
  return read().includes(key) || fallback.includes(key);
}

export function markSettled(key: string) {
  if (isSettled(key)) return;
  try {
    sessionStorage.setItem(SETTLED_STORAGE_KEY, JSON.stringify([...read(), key].slice(-200)));
  } catch {
    fallback = [...fallback, key];
  }
}
