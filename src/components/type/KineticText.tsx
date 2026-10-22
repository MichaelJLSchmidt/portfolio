"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useFinePointer } from "@/lib/idle";
import { useReducedMotion } from "@/lib/motion-preference";
import styles from "./KineticText.module.css";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

export type KineticTextProps = {
  text: string;
  as?: Tag;
  id?: string;
  className?: string;
  /**
   * "mount" plays on first paint (pure CSS, so it runs before hydration and without JS);
   * "inview" waits until the text scrolls into view.
   */
  play?: "mount" | "inview";
  /** Extra delay before the first letter, in ms. */
  delay?: number;
  /** Letters near a fine pointer open up (wider and lighter), like a loupe over the map. */
  proximity?: boolean;
  /** Marks the heading as a quiet zone: the contour field fades its lines behind it. */
  quiet?: boolean;
  style?: CSSProperties;
};

/**
 * Variable-font headline. Each letter condenses from wide and light into the display cut.
 * Every letter keeps a hidden rest-state "ghost" that fixes its box, and the visible glyph
 * is positioned over it, so the axis animation never changes layout (no CLS).
 */
export function KineticText({
  text,
  as: Tag = "span",
  id,
  className,
  play = "mount",
  delay = 0,
  proximity = false,
  quiet = false,
  style,
}: KineticTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(play === "mount");
  const reduced = useReducedMotion();
  const finePointer = useFinePointer();

  useEffect(() => {
    if (play !== "inview" || inView) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Play when it scrolls into view, or right away if the reader already jumped past it.
        if (entries.some((e) => e.isIntersecting || e.boundingClientRect.bottom < 0)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [play, inView]);

  // Pointer proximity: write a 0..1 "--p" per glyph, eased towards its target each frame.
  useEffect(() => {
    const el = ref.current;
    if (!el || !proximity || reduced || !finePointer) return;
    const chars = [...el.querySelectorAll<HTMLElement>(`.${styles.char}`)];
    let centres: { x: number; y: number }[] = [];
    let radius = 160;
    const current = new Float32Array(chars.length);
    const target = new Float32Array(chars.length);
    let raf = 0;

    const measure = () => {
      centres = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      radius = Math.max(120, parseFloat(getComputedStyle(el).fontSize) * 1.6);
    };
    const step = () => {
      raf = 0;
      let moving = false;
      for (let i = 0; i < chars.length; i++) {
        const next = current[i] + (target[i] - current[i]) * 0.16;
        if (Math.abs(next - current[i]) > 0.002) moving = true;
        current[i] = Math.abs(target[i] - next) < 0.002 ? target[i] : next;
        chars[i].style.setProperty("--p", current[i].toFixed(3));
      }
      if (moving) raf = requestAnimationFrame(step);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      for (let i = 0; i < centres.length; i++) {
        const d = Math.hypot(e.clientX - centres[i].x, e.clientY - centres[i].y);
        const t = Math.max(0, 1 - d / radius);
        target[i] = t * t * (3 - 2 * t);
      }
      kick();
    };
    const onLeave = () => {
      target.fill(0);
      kick();
    };
    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      chars.forEach((c) => c.style.removeProperty("--p"));
    };
  }, [proximity, reduced, finePointer]);

  let index = 0;
  const words = text.split(" ");
  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className ? `${styles.kinetic} ${className}` : styles.kinetic}
      aria-label={text}
      data-play={inView ? "true" : "false"}
      data-quiet-zone={quiet ? "" : undefined}
      style={{ ...style, "--kt-delay": `${delay}ms` } as CSSProperties}
    >
      <span className={styles.letters} aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            <span className={styles.word}>
              {[...word].map((ch) => {
                const i = index++;
                return (
                  <span key={i} className={styles.char} style={{ "--i": i } as CSSProperties}>
                    <span className={styles.ghost}>{ch}</span>
                    <span className={styles.glyph}>{ch}</span>
                  </span>
                );
              })}
            </span>
            {w < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </Tag>
  );
}
