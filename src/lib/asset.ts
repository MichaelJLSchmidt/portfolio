/**
 * Prefixes a public-folder path with the configured base path.
 *
 * Use this for every runtime URL that does not go through next/link or next/image:
 * heightmaps, terrain SVGs, textures, fetch calls. Without it, assets 404 when the
 * site is served from a sub-path such as GitHub Pages.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
