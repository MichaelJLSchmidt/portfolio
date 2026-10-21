"use client";

import { Suspense, ViewTransition, lazy, useSyncExternalStore, type ReactNode } from "react";

/**
 * Names an element that morphs between the deck and a case study.
 *
 * Browsers with the View Transitions API get React's <ViewTransition> (stable in the
 * installed React and wired into Next.js navigations). Others fall back to a Motion
 * layoutId shared-layout animation, loaded only when needed.
 */
const LayoutMorph = lazy(() => import("./LayoutMorph"));

const supportsViewTransitions = () => typeof document.startViewTransition === "function";
const noop = () => () => {};

export function MorphTarget({ name, className, children }: { name: string; className?: string; children: ReactNode }) {
  // Server snapshot assumes support, so capable browsers hydrate without a re-render.
  const native = useSyncExternalStore(noop, supportsViewTransitions, () => true);
  if (native) {
    return (
      <ViewTransition name={name} share="morph" default="none">
        {children}
      </ViewTransition>
    );
  }
  return (
    <Suspense fallback={<div className={className}>{children}</div>}>
      <LayoutMorph layoutId={name} className={className}>
        {children}
      </LayoutMorph>
    </Suspense>
  );
}
