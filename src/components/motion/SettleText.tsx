"use client";

import { usePathname } from "next/navigation";
import {
  Fragment,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { headlampFalloff, watchHeadlamp } from "@/lib/headlamp";
import { useFinePointer } from "@/lib/idle";
import { currentMode, useMotionMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { activeViewTransition } from "@/lib/view-transition";
import { duration, headlamp, stagger, staggerStep, type AxisRole } from "@/styles/tokens";
import { Glint } from "./Glint";
import { playGlint } from "./glint";
import styles from "./SettleText.module.css";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

/** chars: per-letter cascade (display titles); words: per word; block: one run (labels, buttons, nav). */
export type SettleMode = "chars" | "words" | "block";
/** paint: from first paint (CSS, before hydration); inview: when scrolled into view; manual: `play()`. */
export type SettleTrigger = "paint" | "inview" | "manual";
export type SettleHandle = {
  /** Plays the settle again (and the glint after it, if the text has one). */
  play(): void;
  glint(): Promise<void>;
};

export type SettleTextProps = {
  /** The text; "\n" breaks the line (read as a space). */
  text: string;
  as?: Tag;
  id?: string;
  className?: string;
  mode?: SettleMode;
  /** Axes from the tokens: display (default for chars and words) or label / mono (default for block). */
  role?: AxisRole;
  trigger?: SettleTrigger;
  /** A single mint glint after the first arrival this session (full motion, dark surfaces). */
  glint?: boolean;
  /** Letters near a fine pointer shine part of the way to glacier (the headlamp; full motion only). */
  shine?: boolean;
  /** Marks the text as a quiet zone: the contour field fades its lines behind it. */
  quiet?: boolean;
  /**
   * For text that morphs in with a page transition: while the transition runs it holds just wide
   * (the breath axes) and settles once the transition has landed. Direct loads settle as usual.
   */
  settleOnArrival?: boolean;
  style?: CSSProperties;
  ref?: Ref<SettleHandle>;
};

type Play = "true" | "rest" | "wait" | "done";

/**
 * Settle text, the motion language's verb for type: text arrives slightly wide and condenses to
 * its set width. In chars and words modes every unit keeps a hidden rest-state ghost that fixes its
 * box, and the visible glyph over it is a layout root (contain: size layout), so the axis animation
 * neither moves anything nor makes the browser lay out more than the glyph. Block mode reserves one
 * box at the run's widest state. Server-rendered: a paint-triggered settle runs from first paint,
 * before hydration; each element plays once per session (settled.ts). Still mode shows the rest
 * state; calm keeps the settle but never glints or shines. docs/motion.md has the API.
 */
export function SettleText({
  text,
  as: Tag = "span",
  id,
  className,
  mode = "chars",
  role = mode === "block" ? "label" : "display",
  trigger = "paint",
  glint = false,
  shine = false,
  quiet = false,
  settleOnArrival = false,
  style,
  ref,
}: SettleTextProps) {
  const elRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const key = settleKey(pathname ?? "", id ?? text);
  const { mode: motion } = useMotionMode();
  const finePointer = useFinePointer();

  const lines = text.split("\n");
  const units = mode === "chars" ? text.replace(/[\s\n]/g, "").length : mode === "words" ? text.split(/\s+/).length : 1;
  const step = staggerStep(mode === "words" ? stagger.word : stagger.char, units);

  // The settle's state is the element's own animation state, kept on data-play (React renders
  // only the initial value, so it never overwrites it). A settle that has run to the end is
  // "done" and remembered for the session (settled.ts): a reload, a page Next re-shows or a later
  // visit renders it at rest. The glint may follow it.
  const stopRef = useRef<() => void>(() => {});
  const setPlay = (state: Play) => {
    const el = elRef.current;
    if (!el) return;
    stopRef.current();
    stopRef.current = () => {};
    el.setAttribute("data-play", state);
    if (state === "true") stopRef.current = whenSettled(el, landed);
  };

  // A settle has landed: remembered, then the glint (full motion, once per session).
  const landed = () => {
    const el = elRef.current;
    if (!el) return;
    if (el.getAttribute("data-play") === "true") el.setAttribute("data-play", "done");
    markSettled(key);
    if (!glint || currentMode() !== "full" || isSettled(`${key}g`)) return;
    markSettled(`${key}g`);
    playGlint(el);
  };

  useImperativeHandle(ref, () => ({
    play() {
      setPlay("rest");
      requestAnimationFrame(() => setPlay("true"));
    },
    glint: () => playGlint(elRef.current),
  }));

  // Before the first paint of a client-side mount: text already settled this session shows at
  // rest. (A full page load has the pre-paint style for that.) Then, arrival through a page
  // transition: layout effects run inside the transition's update, before the new state is
  // captured, so the settle never shows in the morph.
  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (trigger === "paint" && isSettled(key) && el.getAttribute("data-play") === "true") el.setAttribute("data-play", "done");
    const transition = activeViewTransition();
    if (!settleOnArrival || !transition || currentMode() === "still") return;
    let live = true;
    el.setAttribute("data-arrive", "hold");
    const settle = () => {
      if (!live) return;
      el.setAttribute("data-arrive", "settle");
      whenSettled(el, () => {
        if (!live) return;
        el.setAttribute("data-arrive", "done");
        landed();
      });
    };
    // Settle when the transition lands, or right away if it was aborted.
    transition.finished.then(settle, settle);
    return () => {
      live = false;
      if (el.getAttribute("data-arrive") !== "done") el.setAttribute("data-arrive", "done");
    };
    // landed reads props that are fixed for the element's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settleOnArrival, key]);

  // Triggers. Text already in view when an in-view settle would start stays at rest: it has been
  // visible from first paint.
  useEffect(() => {
    const el = elRef.current;
    if (!el || trigger === "manual" || el.hasAttribute("data-arrive")) return;
    const state = el.getAttribute("data-play");
    if (trigger === "paint") {
      // Running since first paint, or stopped by the pre-paint style: either way it lands.
      if (state === "true") setPlay("true");
      return () => stopRef.current();
    }
    if (isSettled(key) || state === "done" || currentMode() === "still") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return markSettled(key);
    setPlay("wait");
    const io = new IntersectionObserver(
      (entries) => {
        // Play when it scrolls into view, or right away if the reader already jumped past it.
        if (!entries.some((e) => e.isIntersecting || e.boundingClientRect.bottom < 0)) return;
        io.disconnect();
        setPlay("true");
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stopRef.current();
      // Unmounted or hidden while waiting: back to rest, so it never stays in the wide state.
      if (el.getAttribute("data-play") === "wait") el.setAttribute("data-play", "rest");
    };
    // setPlay and landed read props that are fixed for the element's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, key]);

  // Pointer shine: the headlamp lights the letters near a fine pointer, colour only. A 0..1
  // `--kt-shine` per glyph eases on Motion's frame loop (up in the headlamp's rise, back over its
  // fade) and is written only where it changed.
  useEffect(() => {
    const el = elRef.current;
    if (!el || !shine || mode === "block" || motion !== "full" || !finePointer) return;
    const glyphs = [...el.querySelectorAll<HTMLElement>("[data-st='glyph']")];
    const current = new Float32Array(glyphs.length);
    const target = new Float32Array(glyphs.length);
    let centres: { x: number; y: number }[] = [];
    let radius: number = headlamp.radiusPx;
    let loop: typeof import("@/lib/frameloop") | null = null;
    let queued: import("@/lib/frameloop").Process | null = null;
    const rise = duration[headlamp.rise] / 3;
    const fall = headlamp.fadeMs / 3;

    const measure = () => {
      centres = glyphs.map((g) => {
        const r = g.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      radius = Math.max(headlamp.radiusPx, parseFloat(getComputedStyle(el).fontSize) * headlamp.radiusEm);
    };
    const step = ({ delta }: { delta: number }) => {
      queued = null;
      const dt = Math.min(delta || 16, 250);
      let moving = false;
      for (let i = 0; i < glyphs.length; i++) {
        // Time constants: each transition takes about three of them.
        const tau = target[i] > current[i] ? rise : fall;
        let next = current[i] + (target[i] - current[i]) * (1 - Math.exp(-dt / tau));
        if (Math.abs(target[i] - next) < 0.004) next = target[i];
        if (next === current[i]) continue;
        if (Math.abs(next - current[i]) > 0.0005 || next === target[i]) glyphs[i].style.setProperty("--kt-shine", next.toFixed(3));
        current[i] = next;
        if (next !== target[i]) moving = true;
      }
      if (moving) kick();
    };
    const kick = () => {
      if (!queued && loop) queued = loop.frame.render(step);
    };
    const unwatch = watchHeadlamp((lamp) => {
      if (!centres.length) measure();
      for (let i = 0; i < centres.length; i++) {
        target[i] = lamp.on ? headlampFalloff(Math.hypot(lamp.x - centres[i].x, lamp.y - centres[i].y) / radius) : 0;
      }
      kick();
    });
    const invalidate = () => {
      centres = [];
    };
    import("@/lib/frameloop").then((m) => (loop = m));
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    return () => {
      unwatch();
      if (queued) loop?.cancelFrame(queued);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      glyphs.forEach((g) => g.style.removeProperty("--kt-shine"));
    };
  }, [shine, mode, motion, finePointer, text]);

  let index = 0;
  const unit = (content: string, i: number): ReactNode => (
    <span key={i} className={styles.unit}>
      <span className={styles.ghost}>{content}</span>
      <span className={styles.glyph} data-st="glyph" style={{ "--kt-i": i } as CSSProperties}>
        {content}
      </span>
    </span>
  );

  return (
    <Tag
      ref={elRef as never}
      id={id}
      className={className ? `${styles.settle} ${className}` : styles.settle}
      data-mode={mode}
      data-role={role}
      data-play={trigger === "paint" ? "true" : "rest"}
      data-settle-key={key}
      data-quiet-zone={quiet ? "" : undefined}
      style={{ ...style, "--kt-step": `${step}ms` } as CSSProperties}
    >
      <span className="visually-hidden">{text.replace(/\n/g, " ")}</span>
      {mode === "block" ? (
        <span className={styles.block} aria-hidden="true">
          <span className={styles.ghost}>{text}</span>
          <span className={styles.run} data-st="run">
            {text}
          </span>
        </span>
      ) : (
        <span className={styles.letters} aria-hidden="true">
          {lines.map((line, l) => (
            <Fragment key={l}>
              {l > 0 && <br />}
              {line.split(" ").map((word, w, words) => (
                <Fragment key={w}>
                  {mode === "words" ? unit(word, index++) : <span className={styles.word}>{[...word].map((ch) => unit(ch, index++))}</span>}
                  {w < words.length - 1 ? " " : null}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </span>
      )}
      {glint && <Glint text={text} className={styles.glint} />}
    </Tag>
  );
}

/** Calls `done` once the settle animations running in `el` have finished (now, if none run). */
function whenSettled(el: Element, done: () => void): () => void {
  let live = true;
  const running = el
    .getAnimations({ subtree: true })
    .filter((a) => /st-(settle|arrive)/.test((a as CSSAnimation).animationName ?? ""));
  if (!running.length) {
    done();
    return () => {};
  }
  const end = () => live && done();
  Promise.all(running.map((a) => a.finished)).then(end, end);
  return () => {
    live = false;
  };
}
