"use client";

import { useSpring } from "motion/react";
import { useMagneticPull } from "motion-plus/react";
import { useEffect, type RefObject } from "react";
import { spring } from "@/styles/tokens";

/** Motion+ magnetic pull with the magnet spring; loaded lazily, renders nothing. */
export default function MagnetDriver({
  anchorRef,
  labelRef,
}: {
  anchorRef: RefObject<HTMLAnchorElement | null>;
  labelRef: RefObject<HTMLSpanElement | null>;
}) {
  const pull = useMagneticPull(anchorRef, 0.12);
  const x = useSpring(pull.x, spring.magnet);
  const y = useSpring(pull.y, spring.magnet);

  useEffect(() => {
    const label = labelRef.current;
    if (!label) return;
    const write = () => {
      label.style.transform = `translate3d(${x.get().toFixed(2)}px, ${y.get().toFixed(2)}px, 0)`;
    };
    const unsubs = [x.on("change", write), y.on("change", write)];
    return () => {
      unsubs.forEach((u) => u());
      label.style.transform = "";
    };
  }, [x, y, labelRef]);

  return null;
}
