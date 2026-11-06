"use client";

import { useEffect, useId, useRef } from "react";
import { reliefOn } from "@/content/relief";
import { useMotionMode } from "@/lib/motion-mode";
import { color } from "@/styles/tokens";
import { reliefOptions } from "./options";
import styles from "./ReliefFill.module.css";

/**
 * A large bold title with the relief fill (relief-core.ts), opt-in by id (src/content/relief.ts).
 * The title is live HTML text, so a longer word wraps instead of being split or squeezed; at rest
 * it is a 1 px outline in text-3 (an SVG morphology filter: no seams where Archivo's outlines
 * overlap) under the construction layer. The fill's code loads when the title comes near the
 * viewport. As a link it carries its own accessible name; the stack inside is aria-hidden.
 */
export function ReliefFill({ id, text, href, label, coordinates, className }: { id: string; text: string; href: string; label: string; coordinates: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const { mode } = useMotionMode();
  const enabled = reliefOn(id);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let detach = () => {};
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("./relief-core").then(({ attachRelief }) => {
          if (cancelled) return;
          detach = attachRelief(el, reliefOptions(mode, matchMedia("(hover: hover) and (pointer: fine)").matches, coordinates));
        });
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      detach();
    };
  }, [enabled, mode, coordinates]);

  return (
    <a ref={ref} href={href} aria-label={label} className={[styles.relief, "plain", className].filter(Boolean).join(" ")} data-relief-root="">
      <span className={styles.stack} data-relief-stack="" aria-hidden="true">
        <span className={styles.fill} data-relief-fill="" style={{ filter: `url(#${uid}-ring)` }}>
          {text}
        </span>
        <span className={styles.text} data-relief-text="" style={{ filter: `url(#${uid}-outline)` }}>
          {text}
        </span>
      </span>
      <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
        <filter id={`${uid}-outline`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown" />
          <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
          <feFlood floodColor={color.text3} />
          <feComposite in2="ring" operator="in" />
        </filter>
        <filter id={`${uid}-ring`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="outer" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="inner" />
          <feComposite in="outer" in2="inner" operator="out" result="ring" />
          <feFlood floodColor={color.glacier} />
          <feComposite in2="ring" operator="in" result="isoline" />
          <feMerge>
            <feMergeNode in="isoline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>
    </a>
  );
}
