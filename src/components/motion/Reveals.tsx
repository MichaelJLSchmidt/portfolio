"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { startFlood } from "@/components/interaction/flood";
import { watchTitles } from "@/components/type/titles";
import { watchItalicFace } from "@/lib/italic-face";
import { startReveals } from "./reveal";

/**
 * Mounted once in the root layout: runs the reveal controller (reveal.ts) and rescans per route,
 * hands the page's titles to the shared title observer (titles.ts), starts the contour flood's
 * delegated listeners (flood.ts, once) and watches for italic text coming near the screen
 * (italic-face.ts).
 */
export function Reveals() {
  const pathname = usePathname();
  useEffect(() => {
    startReveals()();
    watchTitles();
    startFlood();
    watchItalicFace();
  }, [pathname]);
  return null;
}
