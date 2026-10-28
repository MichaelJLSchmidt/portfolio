"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { startReveals } from "./reveal";

/** Mounted once in the root layout: runs the reveal controller (reveal.ts) and rescans per route. */
export function Reveals() {
  const pathname = usePathname();
  useEffect(() => {
    startReveals()();
  }, [pathname]);
  return null;
}
