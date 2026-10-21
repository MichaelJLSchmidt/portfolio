"use client";

import { useSpring } from "motion/react";
import { useMagneticPull } from "motion-plus/react";
import Link from "next/link";
import { useEffect, useRef, type ComponentProps } from "react";
import { useReducedMotion } from "@/lib/motion-preference";
import { spring } from "@/styles/tokens";

/**
 * A link whose label leans towards a fine pointer (Motion+ magnetic pull, magnet spring).
 * The hit area never moves; only the inner label is translated. Off for touch and reduced motion.
 */
export function MagneticLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  const ref = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const pull = useMagneticPull(ref, 0.18);
  const x = useSpring(pull.x, spring.magnet);
  const y = useSpring(pull.y, spring.magnet);

  useEffect(() => {
    const label = labelRef.current;
    if (!label) return;
    if (reduced) {
      label.style.transform = "";
      return;
    }
    const write = () => {
      label.style.transform = `translate3d(${x.get().toFixed(2)}px, ${y.get().toFixed(2)}px, 0)`;
    };
    const unsubs = [x.on("change", write), y.on("change", write)];
    return () => unsubs.forEach((u) => u());
  }, [x, y, reduced]);

  return (
    <Link ref={ref} className={className} {...props}>
      <span ref={labelRef} style={{ display: "inline-flex", alignItems: "center", gap: "inherit" }}>
        {children}
      </span>
    </Link>
  );
}
