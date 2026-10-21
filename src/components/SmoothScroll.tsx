"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/motion-preference";

/** Lenis smooth scrolling on fine-pointer desktop devices only; never on touch or reduced motion. */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let destroyed = false;
    let lenis: { destroy: () => void } | null = null;
    import("lenis").then(({ default: Lenis }) => {
      if (destroyed) return;
      lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.14, stopInertiaOnNavigate: true });
    });
    return () => {
      destroyed = true;
      lenis?.destroy();
    };
  }, [reduced]);

  return null;
}
