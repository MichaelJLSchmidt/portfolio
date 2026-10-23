"use client";

import { Suspense, ViewTransition, lazy, useSyncExternalStore, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion-preference";

/**
 * Picks the morph mechanism for MorphTarget. Browsers with the View Transitions API get
 * React's <ViewTransition> (stable in the installed React and wired into Next.js
 * navigations); others fall back to a Motion layoutId shared-layout animation, loaded
 * only when needed. With Calm map / reduced motion nothing morphs: the <ViewTransition>
 * boundary stays (so the tree never remounts) but no transition starts (view-transition.ts),
 * and the fallback renders a plain box.
 */
const LayoutMorph = lazy(() => import("./LayoutMorph"));

const supportsViewTransitions = () => typeof document.startViewTransition === "function";
const noop = () => () => {};

export function MorphSwitch({
  name,
  share,
  className,
  children,
}: {
  name: string;
  share: string;
  className?: string;
  children: ReactNode;
}) {
  // Server snapshot assumes support, so capable browsers hydrate without a re-render.
  const native = useSyncExternalStore(noop, supportsViewTransitions, () => true);
  const reduced = useReducedMotion();
  if (native) {
    return (
      <ViewTransition name={name} share={share} default="none">
        {children}
      </ViewTransition>
    );
  }
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <LayoutMorph layoutId={name} className={className}>
        {children}
      </LayoutMorph>
    </Suspense>
  );
}
