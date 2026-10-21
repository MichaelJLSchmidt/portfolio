"use client";

import { useSpring } from "motion/react";
import { useEffect, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { spring } from "@/styles/tokens";
import { onGyroTilt, type GyroStatus } from "./gyro";

const MAX_POINTER_DEG = 14;

/**
 * Pointer (or gyroscope) tilt through Motion springs. Values are written to CSS custom
 * properties on the card root: --rx/--ry for rotation, --px/--py/--hyp for foil and glare.
 */
export function useTilt(rootRef: RefObject<HTMLElement | null>, { reduced, gyro }: { reduced: boolean; gyro: GyroStatus }) {
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
      const hyp = Math.min(1, Math.hypot(px.get() - 50, py.get() - 50) / 50);
      el.style.setProperty("--hyp", hyp.toFixed(3));
    };
    const unsubs = [rx, ry, px, py].map((v) => v.on("change", write));
    return () => unsubs.forEach((u) => u());
  }, [rootRef, rx, ry, px, py]);

  useEffect(() => {
    if (reduced) {
      [rx, ry].forEach((v) => v.jump(0));
      [px, py].forEach((v) => v.jump(50));
      const el = rootRef.current;
      ["--rx", "--ry", "--px", "--py", "--hyp"].forEach((p) => el?.style.removeProperty(p));
    }
  }, [reduced, rootRef, rx, ry, px, py]);

  useEffect(() => {
    if (reduced || gyro !== "on") return;
    return onGyroTilt((x, y) => {
      rx.set(x);
      ry.set(y);
      px.set(50 + (y / 8) * 40);
      py.set(50 - (x / 8) * 40);
    });
  }, [reduced, gyro, rx, ry, px, py]);

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    rx.set((0.5 - y) * 2 * MAX_POINTER_DEG);
    ry.set((x - 0.5) * 2 * MAX_POINTER_DEG);
    px.set(x * 100);
    py.set(y * 100);
  };

  const onPointerLeave = () => {
    rx.set(0);
    ry.set(0);
    px.set(50);
    py.set(50);
  };

  return { onPointerMove, onPointerLeave };
}
