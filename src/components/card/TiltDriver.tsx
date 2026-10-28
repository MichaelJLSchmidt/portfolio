"use client";

import { animate, useSpring, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { legacy, spring } from "@/styles/tokens";
import { onGyroTilt, type GyroStatus } from "./gyro";

/** Springs the card flat; resolves once it is (at most `spring.settle.visualDuration`). Null if already flat. */
export type SettleTilt = () => Promise<void> | null;

// The card's current tilt, kept until phase 4 moves cards to spring.tilt and distance.tiltMax.
const MAX_POINTER_DEG = legacy.tilt.maxDeg;
const VARS = ["--rx", "--ry", "--px", "--py", "--hyp"];

/**
 * Pointer (or gyroscope) tilt through Motion springs, loaded lazily so Motion is not part
 * of the initial bundle. Writes CSS custom properties on the card root: --rx/--ry for
 * rotation, --px/--py/--hyp for foil and glare. Renders nothing.
 */
export default function TiltDriver({
  rootRef,
  stageRef,
  settleRef,
  gyro,
}: {
  rootRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  /** Filled with a function that settles the tilt before the card opens a page. */
  settleRef: RefObject<SettleTilt | null>;
  gyro: GyroStatus;
}) {
  const rx = useSpring(0, legacy.tilt.spring);
  const ry = useSpring(0, legacy.tilt.spring);
  const px = useSpring(50, legacy.tilt.spring);
  const py = useSpring(50, legacy.tilt.spring);
  // While settling, pointer and gyro input no longer move the card.
  const settling = useRef(false);

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
      const r = stage.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      rx.set((0.5 - y) * 2 * MAX_POINTER_DEG);
      ry.set((x - 0.5) * 2 * MAX_POINTER_DEG);
      px.set(x * 100);
      py.set(y * 100);
    };
    const leave = () => {
      if (settling.current) return;
      rx.set(0);
      ry.set(0);
      px.set(50);
      py.set(50);
    };
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    return () => {
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
    };
  }, [stageRef, rx, ry, px, py]);

  useEffect(() => {
    if (gyro !== "on") return;
    return onGyroTilt((x, y) => {
      if (settling.current) return;
      rx.set(x);
      ry.set(y);
      px.set(50 + (y / 8) * 40);
      py.set(50 - (x / 8) * 40);
    });
  }, [gyro, rx, ry, px, py]);

  return null;
}
