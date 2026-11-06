import type { CSSProperties, ReactNode } from "react";
import { titleVars } from "@/lib/title-axes";
import styles from "./WeightTitle.module.css";

export type WeightTitleProps = {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** The title as written (set upper case); "\n" breaks lines. */
  text: string;
  /**
   * "load": arrives from the first frame, pure CSS (the hero). "view": arrives when it first comes
   * into view (one shared IntersectionObserver, titles.ts). "none": always at rest.
   */
  arrive?: "load" | "view" | "none";
  id?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * The contour flood (flood.ts): on hover, focus or a tap a glacier copy of the title spreads
   * through it. Opt in per title from the content (src/content/flood.ts).
   */
  flood?: boolean;
  /** Extra layers inside the title; the text stays the first child. */
  children?: ReactNode;
};

/**
 * A display title: one element, the text itself, no letter spans. At rest Archivo wght 800 at
 * wdth 75. In full motion it arrives from wght 200 at a wider cut, one eased progress value
 * (--title-t, 600 ms) driving both axes through widths solved per title at build time, so the
 * line keeps its length and nothing around it moves (WeightTitle.module.css); calm and still show
 * the rest state. Legible from the first frame: a light weight is still the whole word.
 */
export function WeightTitle({ as: Tag = "h2", text, arrive = "view", flood = false, id, className, style, children }: WeightTitleProps) {
  const lines = text.split("\n");
  const content = lines.length > 1 ? lines.map((line, i) => (i ? [<br key={i} />, line] : line)) : text;
  return (
    <Tag
      id={id}
      className={className ? `${styles.title} ${className}` : styles.title}
      data-title={arrive}
      data-flood={flood ? "" : undefined}
      style={{ ...titleVars(text), ...style }}
    >
      {content}
      {flood && (
        <>
          <span className={styles.flood} data-flood-fringe="" data-echo={text} aria-hidden="true" />
          <span className={styles.flood} data-flood-layer="" data-echo={text} aria-hidden="true" />
        </>
      )}
      {children}
    </Tag>
  );
}
