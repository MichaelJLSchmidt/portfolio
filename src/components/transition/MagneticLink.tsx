"use client";

import Link from "next/link";
import { Suspense, lazy, useRef, type ComponentProps } from "react";
import { useFinePointer, useIdle } from "@/lib/idle";
import { useReducedMotion } from "@/lib/motion-preference";

const MagnetDriver = lazy(() => import("./MagnetDriver"));

/**
 * A link whose label leans towards a fine pointer (Motion+ magnetic pull, magnet spring).
 * The hit area never moves; only the inner label is translated. The effect loads after
 * the page is idle and never on touch or with reduced motion.
 */
export function MagneticLink({ children, ...props }: ComponentProps<typeof Link>) {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const finePointer = useFinePointer();
  const idle = useIdle();
  const reduced = useReducedMotion();
  const enabled = finePointer && idle && !reduced;

  return (
    <Link ref={anchorRef} {...props}>
      <span ref={labelRef} style={{ display: "inline-flex", alignItems: "center", gap: "inherit" }}>
        {children}
      </span>
      {enabled && (
        <Suspense fallback={null}>
          <MagnetDriver anchorRef={anchorRef} labelRef={labelRef} />
        </Suspense>
      )}
    </Link>
  );
}
