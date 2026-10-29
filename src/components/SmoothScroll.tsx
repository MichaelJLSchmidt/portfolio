"use client";

import { useEffect } from "react";
import { useMotionMode } from "@/lib/motion-mode";

/**
 * Lenis smooth scrolling on fine-pointer desktop devices in full motion only (never on touch, in
 * calm or still). Lenis has no loop of its own (autoRaf off): Motion's frame loop drives it, the
 * same loop that runs the springs and the contour field, and only while Lenis is animating a
 * scroll. Every scroll Lenis animates starts in scrollTo (wheel, its anchor links, programmatic
 * calls), so that call wakes the loop; once the animation has settled the loop stops asking
 * for frames and Motion's loop can idle. Native scrolling (keys, scrollbar) needs no frames.
 */
export function SmoothScroll() {
  const { mode } = useMotionMode();

  useEffect(() => {
    if (mode !== "full" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let destroyed = false;
    let stop: (() => void) | null = null;
    Promise.all([import("lenis"), import("@/lib/frameloop")]).then(([{ default: Lenis }, { frame, cancelFrame }]) => {
      if (destroyed) return;
      const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.14, stopInertiaOnNavigate: true });
      let running = false;
      const tick = ({ timestamp }: { timestamp: number }) => {
        lenis.raf(timestamp);
        if (lenis.isSmooth) return;
        running = false;
        cancelFrame(tick);
      };
      const wake = () => {
        if (running || destroyed) return;
        running = true;
        // Restart Lenis's clock, so the first frame after idling is not one long time step.
        lenis.time = 0;
        frame.update(tick, true);
      };
      const scrollTo = lenis.scrollTo.bind(lenis);
      lenis.scrollTo = (...args: Parameters<typeof scrollTo>) => {
        scrollTo(...args);
        if (lenis.isSmooth) wake();
      };
      stop = () => {
        cancelFrame(tick);
        lenis.destroy();
      };
    });
    return () => {
      destroyed = true;
      stop?.();
    };
  }, [mode]);

  return null;
}
