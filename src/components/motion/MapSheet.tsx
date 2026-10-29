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
  className,
  style,
  children,
}: {
  as?: ElementType;
  /** The edge the sheet unfolds from. */
  fold?: "top" | "left";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag className={className ? `map-sheet ${className}` : "map-sheet"} data-reveal="sheet" data-fold={fold} style={style}>
      {children}
    </Tag>
  );
}
