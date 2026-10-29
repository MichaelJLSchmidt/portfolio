"use client";

import { animate, useSpring, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { duration, easing, spring } from "@/styles/tokens";

/** Springs the card flat; resolves once it is (at most `spring.settle.visualDuration`). Null if already flat. */
export type SettleTilt = () => Promise<void> | null;

const VARS = ["--rx", "--ry", "--px", "--py", "--hyp"];
const settleEase = [...easing.settle] as [number, number, number, number];

/**
 * Pointer tilt through Motion springs (spring.tilt), loaded lazily so Motion is not part of the
 * initial bundle: at most `maxDeg` (distance.tiltMax, 5°; mini cards 3°) under a fine pointer,
 * never on focus or touch, and off in calm and still (SummitCard mounts it in full motion only).
 * Leaving resets the card over --dur-breath-out (240 ms). Writes CSS custom properties on the card
 * root: --rx/--ry for rotation, --px/--py/--hyp for the foil and glare. Renders nothing.
 */
export default function TiltDriver({
  rootRef,
  stageRef,
  settleRef,
  maxDeg,
}: {
  rootRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  /** Filled with a function that settles the tilt before the card opens a page. */
  settleRef: RefObject<SettleTilt | null>;
  maxDeg: number;
}) {
  const rx = useSpring(0, spring.tilt);
  const ry = useSpring(0, spring.tilt);
  const px = useSpring(50, spring.tilt);
  const py = useSpring(50, spring.tilt);
  // While settling or resetting, pointer input no longer moves the card.
  const settling = useRef(false);
  const resets = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    // Runs again when Next re-shows a page kept alive after back navigation.
    settling.current = false;
    const values: [MotionValue<number>, number][] = [
      [rx, 0],
      [ry, 0],
      [px, 50],
      [py, 50],
    ];
    const rest = () => values.forEach(([v, to]) => v.jump(to));
    settleRef.current = () => {
      resets.current.forEach((r) => r.stop());
      if (Math.abs(rx.get()) < 0.25 && Math.abs(ry.get()) < 0.25) {
        rest();
        return null;
      }
      settling.current = true;
      // jump() bypasses the follow spring, so the stiffer settle spring drives the values.
      const runs = values.map(([v, to]) => animate(v.get(), to, { type: "spring", ...spring.settle, onUpdate: (x) => v.jump(x) }));
      const cap = new Promise<void>((resolve) => setTimeout(resolve, spring.settle.visualDuration * 1000));
      return Promise.race([Promise.all(runs.map((r) => r.finished)).then(() => {}), cap]).then(() => {
        runs.forEach((r) => r.stop());
        rest();
      });
    };
    return () => {
      settleRef.current = null;
    };
  }, [settleRef, rx, ry, px, py]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const write = () => {
      el.style.setProperty("--rx", `${rx.get().toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.get().toFixed(2)}deg`);
      el.style.setProperty("--px", `${px.get().toFixed(1)}%`);
      el.style.setProperty("--py", `${py.get().toFixed(1)}%`);
      el.style.setProperty("--hyp", Math.min(1, Math.hypot(px.get() - 50, py.get() - 50) / 50).toFixed(3));
    };
    const unsubs = [rx, ry, px, py].map((v) => v.on("change", write));
    return () => {
      unsubs.forEach((u) => u());
      VARS.forEach((p) => el.style.removeProperty(p));
    };
  }, [rootRef, rx, ry, px, py]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" || settling.current) return;
      resets.current.forEach((r) => r.stop());
      resets.current = [];
      const r = stage.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      rx.set((0.5 - y) * 2 * maxDeg);
      ry.set((x - 0.5) * 2 * maxDeg);
      px.set(x * 100);
      py.set(y * 100);
    };
    // Leaving resets over --dur-breath-out, a tween rather than the follow spring.
    const leave = () => {
      if (settling.current) return;
      resets.current.forEach((r) => r.stop());
      resets.current = (
        [
          [rx, 0],
          [ry, 0],
          [px, 50],
          [py, 50],
        ] as [MotionValue<number>, number][]
      ).map(([v, to]) => animate(v.get(), to, { duration: duration.breathOut / 1000, ease: settleEase, onUpdate: (x) => v.jump(x) }));
    };
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    return () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      resets.current.forEach((r) => r.stop());
    };
  }, [stageRef, rx, ry, px, py, maxDeg]);

  return null;
}
