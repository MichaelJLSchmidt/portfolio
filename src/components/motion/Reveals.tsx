"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { watchItalicFace } from "@/lib/italic-face";
import { startReveals } from "./reveal";

/**
 * Mounted once in the root layout: runs the reveal controller (reveal.ts) on every page and
 * watches for italic text coming near the screen (italic-face.ts).
 */
export function Reveals() {
  const pathname = usePathname();
  useEffect(() => {
    const stop = startReveals();
    watchItalicFace();
    return stop;
  }, [pathname]);
  return null;
}
