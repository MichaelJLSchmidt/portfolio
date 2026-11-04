import type { ReactNode } from "react";
import styles from "./Chapter.module.css";

/**
 * A chapter on the dark ground: its mono line ("01 · Context") and its heading, which states the
 * finding (or, in chapter 03, is the page's one pull statement), then its blocks. On wide screens
 * the text keeps to columns 4–10, beside the contents trail; wide figures run on to the edge of
 * the grid. Children place themselves with `data-block` ("text", "figure", "wide").
 */
export function Chapter({ id, line, heading, pull = false, children }: { id: string; line: string; heading: string; pull?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`${styles.chapter} container grid section`} aria-labelledby={`${id}-heading`}>
      <div className={styles.head} data-block="text" data-quiet-zone>
        <p className={`${styles.line} mono`}>{line}</p>
        <h2 id={`${id}-heading`} className={pull ? `${styles.pull} t-pull` : "t-h2"}>
          {heading}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** A heading inside a chapter (the delivery stage's finding, "Team I led"). */
export function SubHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div data-block="text" className={styles.sub} data-quiet-zone>
      <h3 id={id} className="t-h3">
        {children}
      </h3>
    </div>
  );
}
