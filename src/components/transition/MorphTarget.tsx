import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { MorphSwitch } from "./MorphSwitch";

/**
 * Names an element that morphs between the deck and a case study, or between the HUD and Basecamp.
 *
 * The name and class are also set inline: Next keeps visited pages alive in hidden
 * <Activity> boundaries, and React does not pair names inside a page that is re-shown on
 * back navigation, so the browser pairs them by the inline name instead. Hidden pages are
 * display:none and are never captured. Browsers without view transitions ignore the
 * inline properties.
 *
 * No "use client" on purpose: in a server page the clone happens before the child crosses
 * into the client, so the style travels as a real prop. A client component receiving the
 * child can get a lazy reference instead, which isValidElement rejects.
 */
type Styled = ReactElement<{ style?: CSSProperties }>;

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
  const share = `morph morph-${variant}`;
  const named = isValidElement(children)
    ? cloneElement(children as Styled, {
        style: {
          ...(children as Styled).props.style,
          viewTransitionName: name,
          viewTransitionClass: share,
        } as CSSProperties,
      })
    : children;
  return (
    <MorphSwitch name={name} share={share} className={className}>
      {named}
    </MorphSwitch>
  );
}
