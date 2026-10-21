"use client";

import { LazyMotion, domMax, m } from "motion/react";
import type { ReactNode } from "react";
import { spring } from "@/styles/tokens";

/** Fallback shared-element morph for browsers without the View Transitions API. */
export default function LayoutMorph({
  layoutId,
  className,
  children,
}: {
  layoutId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <LazyMotion features={domMax} strict>
      <m.div layoutId={layoutId} className={className} transition={{ type: "spring", ...spring.card }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
