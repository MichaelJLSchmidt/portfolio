import type { CSSProperties, ReactNode } from "react";
import { titleArrival } from "@/styles/tokens";
import styles from "./Title.module.css";

export type TitleProps = {
  as?: "h1" | "h2" | "p" | "span";
  /** The type role: the display name or a page's H1. */
  role?: "display" | "h1";
  /** The title as written; it wraps wherever the column ends (never split by its length). */
  text: string;
  /** "arrive": the weight arrival plays when the title is inserted (first load and route arrivals). */
  arrive?: "arrive" | "none";
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * A title that arrives on its weight: each word eases from wght 200 to its role's weight over
 * --dur-title (900 ms, ease-out), the words 60 ms apart (at most four steps). wdth stays at 100.
 * Each word is a small grid cell holding a hidden copy at the final weight, which reserves the
 * word's width from the first frame, and the live word on top: line breaks never change and
 * nothing around the title moves. Pure CSS, so it plays from the first paint, before hydration.
 * Calm: 600 ms, no stagger. Off (and without JavaScript): the final weight at once. Screen readers
 * read the live words once; the copies are aria-hidden.
 */
export function Title({ as: Tag = "h1", role = "h1", text, arrive = "arrive", id, className, style, children }: TitleProps) {
  const words = text.trim().split(/\s+/);
  return (
    <Tag id={id} className={[`t-${role}`, styles.title, className].filter(Boolean).join(" ")} data-arrive={arrive} style={style}>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && " "}
          <span className={styles.word} style={{ "--i": Math.min(i, titleArrival.maxWords - 1) } as CSSProperties}>
            <span className={styles.rest} aria-hidden="true">
              {word}
            </span>
            <span className={styles.live}>{word}</span>
          </span>
        </span>
      ))}
      {children}
    </Tag>
  );
}
