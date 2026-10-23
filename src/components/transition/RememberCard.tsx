"use client";

import { useEffect } from "react";
import { rememberOrigin } from "./return-focus";

/**
 * On a card's own page (case study, Basecamp): going back to the deck returns to that card
 * (in view and focused), however this page was reached, including history forward.
 */
export function RememberCard({ slug }: { slug: string }) {
  useEffect(() => rememberOrigin(slug), [slug]);
  return null;
}
