"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { distance } from "@/styles/tokens";

/**
 * The HUD's frame: a fixed bar that is never hidden. Once the page has scrolled past
 * distance.hudCondense (120 px) it condenses (data-condensed): its backdrop strengthens and the
 * bar narrows from 56 to 44 px (Hud.module.css); the labels keep their width. Still mode only
 * strengthens the backdrop. One passive scroll listener, read once per frame.
 */
export function HudFrame({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let queued = 0;
    const update = () => {
      queued = 0;
      el.toggleAttribute("data-condensed", window.scrollY > distance.hudCondense);
    };
    const onScroll = () => {
      if (!queued) queued = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(queued);
    };
  }, []);
  return (
    <header ref={ref} className={className} data-chrome="">
      {children}
    </header>
  );
}
