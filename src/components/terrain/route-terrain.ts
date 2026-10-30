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
 * Card routes and their terrains (cardTerrains in the cards module), as the root layout wrote
 * them on <html data-card-terrains>: there from the first byte, before any script runs, and
 * without the cards' data in the client bundle. Tests (and anything without a document) set it.
 */
let cardRoutes: Record<string, string> | null = null;

export function setCardTerrains(map: Record<string, string>) {
  cardRoutes = map;
}

function cardRouteMap(): Record<string, string> {
  if (cardRoutes) return cardRoutes;
  if (typeof document === "undefined") return {};
  try {
    cardRoutes = JSON.parse(document.documentElement.dataset.cardTerrains ?? "{}") as Record<string, string>;
  } catch {
    cardRoutes = {};
  }
  return cardRoutes;
}

/**
 * The terrain the field shows on a route: Bern on Basecamp (/about/), otherwise a card's own
 * terrain, or null for the home region (and for any route the server renders: its markup is the
 * same either way).
 */
export function routeTerrain(pathname: string | null): string | null {
  if (!pathname || pathname === "/") return null;
  const path = withSlash(pathname);
  if (path === "/about/") return BERN;
  return cardRouteMap()[path] ?? null;
}
