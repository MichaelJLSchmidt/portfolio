"use client";

import { useEffect, useRef } from "react";

/**
 * Loads and decodes a card's "level" plate the first time its link is hovered or focused, so the
 * step up one contour level never waits on the network or the decoder. Renders an empty marker
 * inside the card's link and listens on that link only.
 */
export function PlatePreload() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const link = ref.current?.closest("a");
    const plate = link?.querySelector<HTMLImageElement>("img[data-plate='level']");
    if (!link || !plate) return;
    const warm = () => {
      plate.loading = "eager";
      plate.decode().catch(() => {});
      link.removeEventListener("pointerenter", warm);
      link.removeEventListener("focusin", warm);
    };
    link.addEventListener("pointerenter", warm);
    link.addEventListener("focusin", warm);
    return () => {
      link.removeEventListener("pointerenter", warm);
      link.removeEventListener("focusin", warm);
    };
  }, []);
  return <span ref={ref} hidden />;
}
