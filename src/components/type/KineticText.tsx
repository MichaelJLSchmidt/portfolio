"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { fieldConfig, msOf } from "@/components/terrain/field-settings";
import { useFinePointer } from "@/lib/idle";
import { useReducedMotion } from "@/lib/motion-preference";
import { activeViewTransition } from "@/lib/view-transition";
import styles from "./KineticText.module.css";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

/** The contour field's headlamp falloff (contour-material.ts), for a distance in radii. */
function headlampFalloff(d: number): number {
  const x = Math.min(1, d);
  const lit = 1 - x * x * (3 - 2 * x);
  return lit * lit * (3 - 2 * lit);
}

export type KineticTextProps = {
  /** The text; "\n" breaks the line (read as a space). */
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
  /**
   * Letters near a fine pointer shine towards glacier, like contours under the field's
   * headlamp: the same falloff, a quick rise and a ~600 ms glide back. Colour only; the
   * axes never move on hover.
   */
  proximity?: boolean;
  /** Marks the heading as a quiet zone: the contour field fades its lines behind it. */
  quiet?: boolean;
  /**
   * For a heading that morphs in from a card: when it mounts inside a page transition, it
   * skips its entrance, flies just off its rest axes and settles on them (~360 ms) once
   * the transition has landed. Direct loads keep the entrance.
   */
  settleOnArrival?: boolean;
  style?: CSSProperties;
};

/**
 * Variable-font headline. Each letter condenses from wide and light into the display cut,
 * with a glacier shine. Every letter keeps a hidden rest-state "ghost" that fixes its box,
 * and the visible glyph is positioned over it, so the axis animation never changes layout
 * (no CLS). On hover the same shine follows a fine pointer; the axes stay at rest.
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
  settleOnArrival = false,
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

  // Arrival through a page transition. Layout effects run inside the transition's update,
  // before the new state is captured, so the entrance never shows in the morph.
  useLayoutEffect(() => {
    const el = ref.current;
    const transition = activeViewTransition();
    if (!el || !settleOnArrival || !transition) return;
    if (document.documentElement.getAttribute("data-motion") === "reduced") return;
    let live = true;
    el.setAttribute("data-arrive", "hold");
    // Settle when the transition lands, or right away if it was aborted.
    const settle = () => {
      if (live) el.setAttribute("data-arrive", "settle");
    };
    transition.finished.then(settle, settle);
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName.includes("kt-settle")) el.setAttribute("data-arrive", "done");
    };
    el.addEventListener("animationend", onEnd);
    return () => {
      live = false;
      el.removeEventListener("animationend", onEnd);
      if (el.getAttribute("data-arrive") !== "done") el.setAttribute("data-arrive", "done");
    };
  }, [settleOnArrival]);

  // Pointer proximity: a 0..1 "--p" per glyph drives the shine (KineticText.module.css).
  // Fine pointers only; it eases on Motion's frame loop (loaded lazily), the page's single
  // animation loop, and writes only the glyphs whose value changed.
  useEffect(() => {
    const el = ref.current;
    if (!el || !proximity || reduced || !finePointer) return;
    const chars = [...el.querySelectorAll<HTMLElement>(`.${styles.char}`)];
    let centres: { x: number; y: number }[] = [];
    let radius = fieldConfig.headlampRadiusPx;
    const current = new Float32Array(chars.length);
    const target = new Float32Array(chars.length);
    let loop: typeof import("@/lib/frameloop") | null = null;
    let queued: import("@/lib/frameloop").Process | null = null;
    let disposed = false;

    const measure = () => {
      centres = chars.map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      // The field's headlamp radius, wide enough to light a few letters of large type.
      radius = Math.max(fieldConfig.headlampRadiusPx, parseFloat(getComputedStyle(el).fontSize) * 1.2);
    };
    const step = ({ delta }: { delta: number }) => {
      queued = null;
      const dt = Math.min(delta || 16, 250);
      let moving = false;
      for (let i = 0; i < chars.length; i++) {
        const rising = target[i] > current[i];
        // Time constants: up in ~micro, back over headlampFadeMs (each ≈ 3 τ).
        const tau = (rising ? msOf("micro") : fieldConfig.headlampFadeMs) / 3;
        let next = current[i] + (target[i] - current[i]) * (1 - Math.exp(-dt / tau));
        if (Math.abs(target[i] - next) < 0.004) next = target[i];
        if (next !== current[i]) {
          if (Math.abs(next - current[i]) > 0.0005 || next === target[i]) {
            chars[i].style.setProperty("--p", next.toFixed(3));
          }
          current[i] = next;
          if (next !== target[i]) moving = true;
        }
      }
      if (moving) kick();
    };
    const kick = () => {
      if (!queued && loop) queued = loop.frame.render(step);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      for (let i = 0; i < centres.length; i++) {
        target[i] = headlampFalloff(Math.hypot(e.clientX - centres[i].x, e.clientY - centres[i].y) / radius);
      }
      kick();
    };
    const onLeave = () => {
      target.fill(0);
      kick();
    };
    import("@/lib/frameloop").then((m) => {
      if (disposed) return;
      loop = m;
      measure();
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure);
    });
    return () => {
      disposed = true;
      if (queued) loop?.cancelFrame(queued);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      chars.forEach((c) => c.style.removeProperty("--p"));
    };
  }, [proximity, reduced, finePointer, text]);

  let index = 0;
  const lines = text.split("\n");
  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className ? `${styles.kinetic} ${className}` : styles.kinetic}
      aria-label={text.replace(/\n/g, " ")}
      data-play={inView ? "true" : "false"}
      data-quiet-zone={quiet ? "" : undefined}
      style={{ ...style, "--kt-delay": `${delay}ms` } as CSSProperties}
    >
      <span className={styles.letters} aria-hidden="true">
        {lines.map((line, l) => (
          <Fragment key={l}>
            {l > 0 && <br />}
            {line.split(" ").map((word, w, words) => (
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
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
