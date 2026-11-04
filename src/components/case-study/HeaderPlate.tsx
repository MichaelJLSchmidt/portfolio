import type { ReactNode } from "react";
import styles from "./HeaderPlate.module.css";

/**
 * The case study's header: a full-bleed terrain plate (about 70vh on desktop, 56svh on phones),
 * the card's level plate at 4:3, covering the band. A legend box in its lower left carries the
 * mono meta line, the H1 (with its weight arrival) and summit · altitude · coordinates, like a map
 * sheet's title block. The plate is the art window the card's art travels into.
 */
export function HeaderPlate({
  plate,
  alt,
  slug,
  example,
  meta,
  title,
  summit,
}: {
  /** The level plate's URL (already through asset()). */
  plate: string;
  alt: string;
  slug: string;
  /** "Example — fictional case study", for a flagged example. */
  example?: string;
  meta: string;
  title: ReactNode;
  summit: string | null;
}) {
  return (
    <header className={styles.header} data-breaker="">
      <div className={styles.art} data-card-art={slug}>
        <img className={styles.plate} src={plate} alt={alt} width={400} height={300} fetchPriority="high" />
      </div>
      <div className={`${styles.inner} container`}>
        <div className={styles.legend}>
          {example && <p className={`${styles.example} mono`}>{example}</p>}
          <p className={`${styles.meta} mono`}>{meta}</p>
          {title}
          {summit && <p className={`${styles.summit} mono`}>{summit}</p>}
        </div>
      </div>
    </header>
  );
}
