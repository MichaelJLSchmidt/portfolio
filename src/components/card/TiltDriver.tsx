"use client";

import { useSpring } from "motion/react";
import { useEffect, type RefObject } from "react";
import { spring } from "@/styles/tokens";
import { onGyroTilt, type GyroStatus } from "./gyro";

const MAX_POINTER_DEG = 14;
const VARS = ["--rx", "--ry", "--px", "--py", "--hyp"];

/**
 * Pointer (or gyroscope) tilt through Motion springs, loaded lazily so Motion is not part
 * of the initial bundle. Writes CSS custom properties on the card root: --rx/--ry for
 * rotation, --px/--py/--hyp for foil and glare. Renders nothing.
 */
export default function TiltDriver({
  rootRef,
  stageRef,
  gyro,
}: {
  rootRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLElement | null>;
  gyro: GyroStatus;
}) {
  const rx = useSpring(0, spring.tilt);
  const ry = useSpring(0, spring.tilt);
  const px = useSpring(50, spring.tilt);
  const py = useSpring(50, spring.tilt);

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
      if (e.pointerType === "touch") return;
      const r = stage.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
      rx.set((0.5 - y) * 2 * MAX_POINTER_DEG);
      ry.set((x - 0.5) * 2 * MAX_POINTER_DEG);
      px.set(x * 100);
      py.set(y * 100);
    };
    const leave = () => {
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
      rx.set(x);
      ry.set(y);
      px.set(50 + (y / 8) * 40);
      py.set(50 - (x / 8) * 40);
    });
  }, [gyro, rx, ry, px, py]);

  return null;
}
