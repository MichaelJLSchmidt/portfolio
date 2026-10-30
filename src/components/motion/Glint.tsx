import { Fragment } from "react";
import styles from "./Glint.module.css";

/**
 * The foil sweep: one summit-gold pass across a Mythic card's name, the only glint left. Put it
 * inside a positioned element (position: relative) whose text it should cross. Idle until
 * `playGlint` runs on it or an ancestor. Server-safe: no hooks.
 */
export function Glint({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className ? `${styles.glint} ${className}` : styles.glint} data-glint="" aria-hidden="true">
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </span>
  );
}
