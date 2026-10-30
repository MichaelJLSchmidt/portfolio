import { terrainIdForPath } from "@/content/cards";

/** The Basecamp terrain: an 8 × 8 km window around the zero point of the Swiss coordinates. */
export const BERN = "bern";

/**
 * Bern's framing on portrait screens (object-position's x): from the window's west edge, so the
 * Aare runs down the right edge of a phone and the lower part of the screen stays clear for the
 * About title and portrait. Landscape screens show the window's full width (the zero point's own
 * u, from bern.json).
 */
export const BERN_PORTRAIT_U = 0;

const withSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

/**
 * The terrain the field shows on a route: Bern on Basecamp (/about/), otherwise a card's own
 * terrain (terrainIdForPath in the cards module), or null for the home region.
 */
export function routeTerrain(pathname: string | null): string | null {
  if (pathname && withSlash(pathname) === "/about/") return BERN;
  return terrainIdForPath(pathname);
}
