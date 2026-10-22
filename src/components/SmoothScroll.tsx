"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/motion-preference";

/**
 * Lenis smooth scrolling on fine-pointer desktop devices only; never on touch or reduced motion.
 * Lenis has no loop of its own (autoRaf off): Motion's frame loop drives it, the same loop
 * that runs the springs and the contour field, so scrolling costs one requestAnimationFrame.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let destroyed = false;
    let stop: (() => void) | null = null;
    Promise.all([import("lenis"), import("@/lib/frameloop")]).then(([{ default: Lenis }, { frame, cancelFrame }]) => {
      if (destroyed) return;
      const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.14, stopInertiaOnNavigate: true });
      const update = frame.update(({ timestamp }) => lenis.raf(timestamp), true);
      stop = () => {
        cancelFrame(update);
        lenis.destroy();
      };
    });
    return () => {
      destroyed = true;
      stop?.();
    };
  }, [reduced]);

  return null;
}
