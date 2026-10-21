"use client";

import {
  Suspense,
  ViewTransition,
  cloneElement,
  isValidElement,
  lazy,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Names an element that morphs between the deck and a case study.
 *
 * Browsers with the View Transitions API get React's <ViewTransition> (stable in the
 * installed React and wired into Next.js navigations). The name and class are also set
 * inline: Next keeps visited pages alive in hidden <Activity> boundaries, and React does
 * not pair names inside a page that is re-shown on back navigation, so the browser pairs
 * them by the inline name instead. Hidden pages are display:none and are never captured.
 * Others fall back to a Motion layoutId shared-layout animation, loaded only when needed.
 */
const LayoutMorph = lazy(() => import("./LayoutMorph"));

type Styled = ReactElement<{ style?: CSSProperties }>;

const supportsViewTransitions = () => typeof document.startViewTransition === "function";
const noop = () => () => {};

export function MorphTarget({
  name,
  variant,
  className,
  children,
}: {
  name: string;
  /** Picks the choreography in globals.css (::view-transition-*(.morph-art|.morph-title)). */
  variant: "art" | "title";
  className?: string;
  children: ReactNode;
}) {
  // Server snapshot assumes support, so capable browsers hydrate without a re-render.
  const native = useSyncExternalStore(noop, supportsViewTransitions, () => true);
  if (native) {
    const named = isValidElement(children)
      ? cloneElement(children as Styled, {
          style: {
            ...(children as Styled).props.style,
            viewTransitionName: name,
            viewTransitionClass: `morph morph-${variant}`,
          } as CSSProperties,
        })
      : children;
    return (
      <ViewTransition name={name} share={`morph morph-${variant}`} default="none">
        {named}
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
