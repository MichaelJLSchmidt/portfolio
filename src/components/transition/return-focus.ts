"use client";

/** Remembers which card opened a case study so back navigation can return focus to it. */
const KEY = "summit:return-focus";

export function rememberOrigin(slug: string) {
  try {
    sessionStorage.setItem(KEY, slug);
  } catch {
    // Without storage, focus simply isn't restored.
  }
}

export function takeOrigin(): string | null {
  try {
    const slug = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return slug;
  } catch {
    return null;
  }
}
