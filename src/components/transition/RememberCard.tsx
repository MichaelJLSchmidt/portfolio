"use client";

import { useEffect } from "react";
import { markVisited } from "@/lib/visited";
import { rememberOrigin } from "./return-focus";

/**
 * On a card's own page (a case study): going back to the deck returns to that card
 * (in view and focused), however this page was reached, including history forward; and the
 * card is marked visited (its "Visited" stamp).
 */
export function RememberCard({ slug }: { slug: string }) {
  useEffect(() => {
    rememberOrigin(slug);
    markVisited(slug);
  }, [slug]);
  return null;
}
