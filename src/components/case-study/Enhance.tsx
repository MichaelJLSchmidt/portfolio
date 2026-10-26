"use client";

import { useEffect, useRef } from "react";

/**
 * Progressive enhancement for a figure: the lightbox, the before/after slider and the hotspots
 * work on markup the server already rendered (complete without JavaScript), and their code
 * loads only on pages that have such a figure, once it comes near the viewport or the reader
 * reaches for it. Each behaviour module exports attach(figure) and returns its cleanup.
 */
export type Behaviour = "lightbox" | "compare" | "hotspots";

const loaders: Record<Behaviour, () => Promise<{ attach: (figure: HTMLElement) => () => void }>> = {
  lightbox: () => import("./behaviours/lightbox"),
  compare: () => import("./behaviours/compare"),
  hotspots: () => import("./behaviours/hotspots"),
};

export function Enhance({ behaviours }: { behaviours: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const figure = ref.current?.closest<HTMLElement>("figure");
    if (!figure) return;
    const cleanups: (() => void)[] = [];
    let started = false;
    let live = true;
    const start = () => {
      if (started) return;
      started = true;
      io.disconnect();
      for (const name of behaviours.split(" ") as Behaviour[]) {
        loaders[name]().then((m) => {
          if (live) cleanups.push(m.attach(figure));
        });
      }
    };
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && start(), { rootMargin: "50% 0px" });
    io.observe(figure);
    figure.addEventListener("pointerenter", start, { once: true });
    figure.addEventListener("focusin", start, { once: true });
    return () => {
      live = false;
      io.disconnect();
      figure.removeEventListener("pointerenter", start);
      figure.removeEventListener("focusin", start);
      cleanups.forEach((c) => c());
    };
  }, [behaviours]);

  return <span ref={ref} hidden />;
}
