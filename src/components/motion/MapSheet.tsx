import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Map sheet: a light-sheet panel that unfolds from its fold edge (clip-path) as it scrolls into
 * view, its content fading in afterwards (once per session; the reveal controller, reveal.ts).
 * Only sheet-safe inks belong on it (CLAUDE.md). In the first viewport and in still mode it is
 * simply there.
 */
export function MapSheet({
  as: Tag = "div",
  fold = "top",
  arriveAt,
  className,
  style,
  children,
}: {
  as?: ElementType;
  /** The edge the sheet unfolds from. */
  fold?: "top" | "left";
  /**
   * On screen when a route arrives by a link: unfolds this many milliseconds after the commit, up
   * to the arrival's end (`arrival` in the tokens, reveal.ts). Otherwise it is simply there.
   */
  arriveAt?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag className={className ? `map-sheet ${className}` : "map-sheet"} data-reveal="sheet" data-fold={fold} data-arrive-at={arriveAt} style={style}>
      {children}
    </Tag>
  );
}
