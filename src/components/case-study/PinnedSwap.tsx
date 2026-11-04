"use client";

import { useEffect, useRef } from "react";

/**
 * The pinned decision's swap: marks the figure of the step that crosses the middle of the screen
 * (data-active); the CSS fades between them. Listens once per frame while scrolling.
 */
export function PinnedSwap() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current?.closest("[data-pinned]");
    if (!root) return;
    const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
    const figures = [...root.querySelectorAll<HTMLElement>("[data-step-figure]")];
    let active = 0;
    let frame = 0;
    const read = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let next = 0;
      steps.forEach((s, i) => {
        if (s.getBoundingClientRect().top < middle) next = i;
      });
      if (next === active) return;
      active = next;
      figures.forEach((f, i) => f.toggleAttribute("data-active", i === active));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, []);
  return <span ref={ref} hidden />;
}
