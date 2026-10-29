"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { watchItalicFace } from "@/lib/italic-face";
import { startReveals } from "./reveal";

/**
 * Mounted once in the root layout: runs the reveal controller (reveal.ts) and rescans per route,
 * and watches for italic text coming near the screen (italic-face.ts).
 */
export function Reveals() {
  const pathname = usePathname();
  useEffect(() => {
    startReveals()();
    watchItalicFace();
  }, [pathname]);
  return null;
}
