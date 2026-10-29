import { terrainIdForPath } from "@/content/cards";

/** The Basecamp terrain: an 8 × 8 km window around the zero point of the Swiss coordinates. */
export const BERN = "bern";

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * The terrain the field shows on a route: Bern on Basecamp (/about/), otherwise a card's own
 * terrain (terrainIdForPath in the cards module), or null for the home region.
 */
export function routeTerrain(pathname: string | null): string | null {
  if (pathname && withSlash(pathname) === "/about/") return BERN;
  return terrainIdForPath(pathname);
}
