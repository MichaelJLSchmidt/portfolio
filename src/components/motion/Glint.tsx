import { Fragment } from "react";
import styles from "./Glint.module.css";

/**
 * The glint layer: put it inside a positioned element (position: relative) whose text it should
 * cross. Idle until `playGlint` runs on it or an ancestor. On the light sheet (`surface="sheet"`)
 * a 1 px moss-ink rule draws instead, since a mint band would not read there.
 * Server-safe: no hooks.
 */
export function Glint({
  text,
  surface = "dark",
  tone = "mint",
  className,
  ...data
}: {
  text: string;
  surface?: "dark" | "sheet";
  /** "gold": the summit-gold pass a Mythic card plays (its rarity colour); mint otherwise. */
  tone?: "mint" | "gold";
  className?: string;
} & { [key: `data-${string}`]: string }) {
  if (surface === "sheet") return <span {...data} className={className ? `${styles.rule} ${className}` : styles.rule} data-glint="" aria-hidden="true" />;
  return (
    <span {...data} className={className ? `${styles.glint} ${className}` : styles.glint} data-glint="" data-tone={tone === "gold" ? "gold" : undefined} aria-hidden="true">
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </span>
  );
}
